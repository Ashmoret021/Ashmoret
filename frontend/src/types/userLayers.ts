export interface UserPolygonProperties {
  name?: string;
  description?: string;
  [key: string]: unknown;
}

export interface UserPolygon {
  id: string;
  coordinates: Array<{ lat: number; lng: number }>;
  properties?: UserPolygonProperties;
}

export interface UserLayer {
  id: string;
  name: string;
  type: "user-drawn";
  visible: boolean;
  polygons: UserPolygon[];
  createdAt: number;
  updatedAt: number;
}

export const normalizeUserCoordinates = (
  value: unknown,
): { lat: number; lng: number }[] | null => {
  if (!Array.isArray(value)) return null;

  const normalized = value
    .map((point) => {
      if (!point || typeof point !== "object") return null;
      const typed = point as Record<string, unknown>;
      const lat = Number(typed.lat);
      const lng = Number(typed.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      return { lat, lng };
    })
    .filter(Boolean) as { lat: number; lng: number }[];

  return normalized.length > 0 ? normalized : null;
};

export const isValidUserLayer = (value: unknown): value is UserLayer => {
  if (!value || typeof value !== "object") return false;
  const layer = value as Record<string, unknown>;

  if (typeof layer.id !== "string") return false;
  if (typeof layer.name !== "string") return false;
  if (layer.type !== "user-drawn") return false;
  if (typeof layer.visible !== "boolean") return false;
  if (!Array.isArray(layer.polygons)) return false;
  if (typeof layer.createdAt !== "number") return false;
  if (typeof layer.updatedAt !== "number") return false;

  return layer.polygons.every((polygon) => {
    if (!polygon || typeof polygon !== "object") return false;
    const typed = polygon as Record<string, unknown>;
    if (typeof typed.id !== "string") return false;
    const coords = normalizeUserCoordinates(typed.coordinates);
    if (!coords) return false;
    if (typed.properties !== undefined && typeof typed.properties !== "object") {
      return false;
    }
    return true;
  });
};
