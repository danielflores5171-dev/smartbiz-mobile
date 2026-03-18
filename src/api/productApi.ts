// src/api/productApi.ts
import { del, get, patch, post } from "./http";
import type { ID } from "./types";

type ApiProductItem = any;

export type ApiProductImageItem = {
  id: string;
  business_id: string;
  product_id: string;
  url: string;
  alt?: string | null;
  sort_order?: number | null;
  is_primary?: boolean;
  width?: number | null;
  height?: number | null;
  mime?: string | null;
  bytes?: number | null;
  created_at?: string;
};

function getApiBaseUrl() {
  const raw = process.env.EXPO_PUBLIC_API_BASE_URL ?? "";
  return raw.endsWith("/") ? raw.slice(0, -1) : raw;
}

async function uploadProductImageRaw(
  token: string,
  businessId: ID,
  productId: ID,
  fileUri: string,
) {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) {
    throw new Error("EXPO_PUBLIC_API_BASE_URL no configurado");
  }

  const filename =
    fileUri.split("/").pop() || `product-${String(productId)}.jpg`;
  const ext = filename.split(".").pop()?.toLowerCase();

  let mime = "image/jpeg";
  if (ext === "png") mime = "image/png";
  else if (ext === "webp") mime = "image/webp";
  else if (ext === "jpg" || ext === "jpeg") mime = "image/jpeg";

  const form = new FormData();
  form.append("file", {
    uri: fileUri,
    name: filename,
    type: mime,
  } as any);

  const res = await fetch(`${baseUrl}/api/product/${productId}/images`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "X-Business-Id": String(businessId),
    },
    body: form,
  });

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    const msg =
      json?.error?.message ||
      json?.message ||
      `HTTP ${res.status} al subir imagen`;
    throw new Error(msg);
  }

  return json as {
    ok?: boolean;
    data?: {
      item?: ApiProductImageItem | null;
      storage?: {
        bucket?: string;
        path?: string;
        publicUrl?: string | null;
      };
    };
  };
}

async function listProductImagesRaw(
  token: string,
  businessId: ID,
  productId: ID,
) {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) {
    throw new Error("EXPO_PUBLIC_API_BASE_URL no configurado");
  }

  const res = await fetch(`${baseUrl}/api/product/${productId}/images`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "X-Business-Id": String(businessId),
    },
  });

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    const msg =
      json?.error?.message ||
      json?.message ||
      `HTTP ${res.status} al listar imágenes`;
    throw new Error(msg);
  }

  return json as {
    ok?: boolean;
    data?: {
      items?: ApiProductImageItem[];
    };
  };
}

async function setPrimaryProductImageRaw(
  token: string,
  businessId: ID,
  productId: ID,
  imageId: ID,
) {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) {
    throw new Error("EXPO_PUBLIC_API_BASE_URL no configurado");
  }

  const res = await fetch(
    `${baseUrl}/api/product/${productId}/images/${imageId}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Business-Id": String(businessId),
      },
    },
  );

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    const msg =
      json?.error?.message ||
      json?.message ||
      `HTTP ${res.status} al poner imagen primaria`;
    throw new Error(msg);
  }

  return json as {
    ok?: boolean;
    data?: {
      item?: ApiProductImageItem | null;
      images_count?: number;
    };
  };
}

async function deleteProductImageRaw(
  token: string,
  businessId: ID,
  productId: ID,
  imageId: ID,
) {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) {
    throw new Error("EXPO_PUBLIC_API_BASE_URL no configurado");
  }

  const res = await fetch(
    `${baseUrl}/api/product/${productId}/images/${imageId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Business-Id": String(businessId),
      },
    },
  );

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    const msg =
      json?.error?.message ||
      json?.message ||
      `HTTP ${res.status} al borrar imagen`;
    throw new Error(msg);
  }

  return json as {
    ok?: boolean;
    data?: {
      ok?: boolean;
      images_count?: number;
    };
  };
}

export const productApi = {
  list: (token: string, businessId: ID, q?: string) =>
    get<{ items: ApiProductItem[] }>("/api/product", {
      token,
      businessId,
      query: q ? { q } : undefined,
    }),

  create: (
    token: string,
    businessId: ID,
    input: {
      name: string;
      sku?: string;
      unit?: string;
      price: number;
      cost: number;
      stock: number;
      minStock?: number;
    },
  ) => {
    const payload: any = {
      name: input.name,
      sku: input.sku ?? null,
      unit: input.unit ?? "unit",
      price: input.price ?? 0,
      cost: input.cost ?? 0,
      stock: input.stock ?? 0,
      min_stock: input.minStock ?? 0,
    };

    return post<{ item: ApiProductItem }>("/api/product", payload, {
      token,
      businessId,
    });
  },

  detail: (token: string, businessId: ID, id: ID) =>
    get<{ item: ApiProductItem }>(`/api/product/${id}`, {
      token,
      businessId,
    }),

  update: (
    token: string,
    businessId: ID,
    id: ID,
    patchInput: Partial<{
      name: string;
      sku: string | null;
      unit: string | null;
      price: number;
      cost: number;
      minStock: number;
      status: "active" | "archived";
      supplierId: string | null;
      description: string | null;
    }>,
  ) => {
    const body: any = {};

    if (patchInput.name !== undefined) body.name = patchInput.name;
    if (patchInput.sku !== undefined) body.sku = patchInput.sku;
    if (patchInput.unit !== undefined) body.unit = patchInput.unit;
    if (patchInput.price !== undefined) body.price = patchInput.price;
    if (patchInput.cost !== undefined) body.cost = patchInput.cost;
    if (patchInput.minStock !== undefined) body.min_stock = patchInput.minStock;
    if (patchInput.status !== undefined) {
      body.active = patchInput.status === "active";
    }
    if (patchInput.description !== undefined) {
      body.description = patchInput.description;
    }
    if (patchInput.supplierId !== undefined) {
      body.supplier_id = patchInput.supplierId;
    }

    return patch<{ item: ApiProductItem }>(`/api/product/${id}`, body, {
      token,
      businessId,
    });
  },

  remove: (token: string, businessId: ID, id: ID) =>
    del<{}>(`/api/product/${id}`, {
      token,
      businessId,
    }),

  stock: (token: string, businessId: ID, id: ID, body: any) =>
    post<{ item?: ApiProductItem }>(`/api/product/${id}/stock`, body, {
      token,
      businessId,
    }),

  listImages: (token: string, businessId: ID, productId: ID) =>
    listProductImagesRaw(token, businessId, productId),

  uploadImage: (
    token: string,
    businessId: ID,
    productId: ID,
    fileUri: string,
  ) => uploadProductImageRaw(token, businessId, productId, fileUri),

  setPrimaryImage: (
    token: string,
    businessId: ID,
    productId: ID,
    imageId: ID,
  ) => setPrimaryProductImageRaw(token, businessId, productId, imageId),

  deleteImage: (token: string, businessId: ID, productId: ID, imageId: ID) =>
    deleteProductImageRaw(token, businessId, productId, imageId),
};
