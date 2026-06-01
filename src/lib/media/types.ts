// src/lib/media/types.ts
export type EntityType = "product" | "category" | "brand";

export interface EntityMedia {
  id: string;
  entityType: EntityType;
  entitySlug: string;
  publicId: string;
  format: string | null;
  width: number | null;
  height: number | null;
  alt: string | null;
  sort: number;
}
