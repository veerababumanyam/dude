export interface GeoResult {
  label: string;
  lat: number;
  lng: number;
}

/**
 * Forward geocoding via OpenStreetMap Nominatim (free, no API key).
 * Respects the public usage policy: low volume, descriptive results only.
 */
export async function searchPlaces(
  query: string,
  signal?: AbortSignal,
): Promise<GeoResult[]> {
  const q = query.trim();
  if (q.length < 3) return [];
  const url =
    `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&addressdetails=0&q=` +
    encodeURIComponent(q);
  const res = await fetch(url, {
    signal,
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Geocoding failed (${res.status})`);
  const data = (await res.json()) as Array<{
    display_name: string;
    lat: string;
    lon: string;
  }>;
  return data.map((d) => ({
    label: d.display_name,
    lat: parseFloat(d.lat),
    lng: parseFloat(d.lon),
  }));
}

/** Reverse geocoding: coordinates → human-readable place name. */
export async function reverseGeocode(
  lat: number,
  lng: number,
  signal?: AbortSignal,
): Promise<string | null> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
  const res = await fetch(url, {
    signal,
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { display_name?: string };
  return data.display_name ?? null;
}
