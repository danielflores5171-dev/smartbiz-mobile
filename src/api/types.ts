// src/api/types.ts
export type ID = string;

export type ApiUser = {
  id: ID;
  email: string | null;
};

export type ApiBusiness = {
  id: ID;
  name: string;
  // agrega campos reales luego (cuando tengas respuestas)
};

export type ApiProduct = {
  id: ID;
  name: string;
  price?: number;
  stock?: number;
  imageUri?: string | null;
};

export type ApiSale = {
  id: ID;
  total: number;
  createdAt?: string;
};

export type ApiNotification = {
  id: ID;
  title: string;
  body?: string;
  createdAt?: string;
};
