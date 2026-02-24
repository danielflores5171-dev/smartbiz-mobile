// src/services/productImageService.ts
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";

const FS: any = FileSystem; // runtime-safe

const DIR_NAME = "smartbiz_product_images/";

function getBaseDir(): string | null {
  const base: string | undefined =
    FS.documentDirectory ?? FS.cacheDirectory ?? undefined;

  if (!base) return null;
  return base.endsWith("/") ? base : base + "/";
}

async function ensureDir(): Promise<string | null> {
  const base = getBaseDir();
  if (!base) return null;

  const dir = base + DIR_NAME;

  try {
    const info = await FileSystem.getInfoAsync(dir);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    }
    return dir;
  } catch {
    return null;
  }
}

function extFromUri(uri: string) {
  const clean = uri.split("?")[0];
  const match = clean.match(/\.(jpg|jpeg|png|webp|heic)$/i);
  return match ? match[1].toLowerCase() : "jpg";
}

export const productImageService = {
  async pickFromLibrary(): Promise<string | null> {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return null;

    const hasNewMediaType = !!(ImagePicker as any).MediaType;
    const mediaTypes = hasNewMediaType
      ? [(ImagePicker as any).MediaType.Images] // ✅ new API
      : (ImagePicker as any).MediaTypeOptions.Images; // fallback (puede avisar deprecated)

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes,
      allowsEditing: true,
      quality: 0.85,
    });

    if ((result as any).canceled) return null;
    const assets = (result as any).assets as Array<{ uri: string }> | undefined;
    return assets?.[0]?.uri ?? null;
  },

  async saveForProduct(params: {
    userId: string;
    productId: string;
    pickedUri: string;
  }): Promise<string> {
    const dir = await ensureDir();

    // ✅ si por alguna razón NO hay directorio, no rompemos: usamos la imagen tal cual
    if (!dir) {
      console.warn(
        "[productImageService] No base dir. Returning pickedUri without copying.",
      );
      return params.pickedUri;
    }

    const ext = extFromUri(params.pickedUri);
    const filename = `u_${params.userId}_p_${params.productId}.${ext}`;
    const toUri = dir + filename;

    try {
      await FileSystem.copyAsync({ from: params.pickedUri, to: toUri });
    } catch {
      await FileSystem.moveAsync({ from: params.pickedUri, to: toUri });
    }

    return toUri;
  },

  async removeProductImage(params: {
    userId: string;
    productId: string;
  }): Promise<void> {
    const dir = await ensureDir();
    if (!dir) return;

    const exts = ["jpg", "jpeg", "png", "webp", "heic"];
    for (const ext of exts) {
      const uri = dir + `u_${params.userId}_p_${params.productId}.${ext}`;
      const info = await FileSystem.getInfoAsync(uri);
      if (info.exists) {
        await FileSystem.deleteAsync(uri, { idempotent: true });
      }
    }
  },
};
