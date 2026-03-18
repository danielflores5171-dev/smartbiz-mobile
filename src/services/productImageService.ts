// src/services/productImageService.ts
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";

const DIR_NAME = "smartbiz_product_images";

function normalizeDir(path: string) {
  return path.endsWith("/") ? path : `${path}/`;
}

function getBaseDir(): string | null {
  const fsAny = FileSystem as any;

  const candidates = [
    typeof fsAny.documentDirectory === "string"
      ? fsAny.documentDirectory
      : null,
    typeof fsAny.cacheDirectory === "string" ? fsAny.cacheDirectory : null,
  ].filter(Boolean) as string[];

  if (candidates.length === 0) return null;
  return normalizeDir(candidates[0]);
}

async function ensureDir(): Promise<string | null> {
  const base = getBaseDir();
  if (!base) return null;

  const dir = `${base}${DIR_NAME}/`;

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
  const clean = String(uri ?? "").split("?")[0];
  const match = clean.match(/\.(jpg|jpeg|png|webp|heic)$/i);
  return match ? match[1].toLowerCase() : "jpg";
}

function resolveImageMediaTypes(): any {
  const pickerAny = ImagePicker as any;

  if (pickerAny?.MediaType?.Images) {
    return [pickerAny.MediaType.Images];
  }

  if (pickerAny?.MediaType?.Image) {
    return [pickerAny.MediaType.Image];
  }

  return ["images"];
}

export const productImageService = {
  async pickFromLibrary(): Promise<string | null> {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return null;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: resolveImageMediaTypes(),
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

    if (!dir) {
      return params.pickedUri;
    }

    const ext = extFromUri(params.pickedUri);
    const version = Date.now();
    const filename = `u_${params.userId}_p_${params.productId}_${version}.${ext}`;
    const toUri = `${dir}${filename}`;

    try {
      await FileSystem.copyAsync({
        from: params.pickedUri,
        to: toUri,
      });
      return toUri;
    } catch {
      try {
        await FileSystem.moveAsync({
          from: params.pickedUri,
          to: toUri,
        });
        return toUri;
      } catch {
        return params.pickedUri;
      }
    }
  },

  async removeProductImage(params: {
    userId: string;
    productId: string;
  }): Promise<void> {
    const dir = await ensureDir();
    if (!dir) return;

    try {
      const files = await FileSystem.readDirectoryAsync(dir);
      const prefix = `u_${params.userId}_p_${params.productId}_`;

      for (const file of files) {
        if (!file.startsWith(prefix)) continue;
        const uri = `${dir}${file}`;
        await FileSystem.deleteAsync(uri, { idempotent: true });
      }
    } catch {
      // silencioso
    }
  },
};
