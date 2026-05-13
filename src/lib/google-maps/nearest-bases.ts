import { fetchMatrixDistancesKm } from "@/lib/google-maps/distance";
import type { Database } from "@/types/database";

type Base = Database["public"]["Tables"]["bases"]["Row"];

export type NearestResult = {
  kmCliente: number | null;
  kmInfomac: number | null;
  baseClienteId: string | null;
  baseInfomacId: string | null;
};

/**
 * Calcula km y bases INFOMAC/cliente más cercanas usando Distance Matrix.
 * @param city Ciudad del ticket.
 * @param province Provincia.
 * @param bases Lista de bases con coordenadas o nombre para geocodificar fallback.
 */
export async function computeNearestBases(
  city: string,
  province: string,
  bases: Base[],
): Promise<NearestResult> {
  const origin = `${city}, ${province}, Argentina`;
  const withCoords = bases.filter((b) => b.lat != null && b.lng != null);
  if (withCoords.length === 0) {
    return { kmCliente: null, kmInfomac: null, baseClienteId: null, baseInfomacId: null };
  }
  const destStrings = withCoords.map((b) => `${b.lat},${b.lng}`);
  const kms = await fetchMatrixDistancesKm(origin, destStrings);

  let bestClienteIdx = -1;
  let bestClienteKm = Number.POSITIVE_INFINITY;
  let bestInfomacIdx = -1;
  let bestInfomacKm = Number.POSITIVE_INFINITY;

  withCoords.forEach((b, i) => {
    const km = kms[i];
    if (Number.isNaN(km)) return;
    if (b.type === "cliente" && km < bestClienteKm) {
      bestClienteKm = km;
      bestClienteIdx = i;
    }
    if (b.type === "infomac" && km < bestInfomacKm) {
      bestInfomacKm = km;
      bestInfomacIdx = i;
    }
  });

  return {
    kmCliente: bestClienteIdx >= 0 ? kms[bestClienteIdx] : null,
    kmInfomac: bestInfomacIdx >= 0 ? kms[bestInfomacIdx] : null,
    baseClienteId: bestClienteIdx >= 0 ? withCoords[bestClienteIdx]!.id : null,
    baseInfomacId: bestInfomacIdx >= 0 ? withCoords[bestInfomacIdx]!.id : null,
  };
}
