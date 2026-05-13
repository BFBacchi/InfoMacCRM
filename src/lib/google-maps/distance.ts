/**
 * @file Llamadas a Google Distance Matrix (solo servidor).
 */

/**
 * Obtiene distancias en km desde un origen textual hacia varios destinos.
 * @param origin Origen (ej. ciudad + provincia + país).
 * @param destinations Lista de destinos en el mismo formato.
 * @returns Kilómetros por destino (NaN si falla el elemento).
 */
export async function fetchMatrixDistancesKm(
  origin: string,
  destinations: string[],
): Promise<number[]> {
  const key = process.env.GOOGLE_MAPS_SERVER_KEY ?? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!key || destinations.length === 0) {
    return destinations.map(() => Number.NaN);
  }
  const url = new URL("https://maps.googleapis.com/maps/api/distancematrix/json");
  url.searchParams.set("origins", origin);
  url.searchParams.set("destinations", destinations.join("|"));
  url.searchParams.set("key", key);
  url.searchParams.set("units", "metric");
  const res = await fetch(url.toString());
  if (!res.ok) return destinations.map(() => Number.NaN);
  const json = (await res.json()) as {
    rows?: { elements?: { distance?: { value?: number } }[] }[];
  };
  const elements = json.rows?.[0]?.elements ?? [];
  return destinations.map((_, i) => {
    const m = elements[i]?.distance?.value;
    return m != null ? m / 1000 : Number.NaN;
  });
}
