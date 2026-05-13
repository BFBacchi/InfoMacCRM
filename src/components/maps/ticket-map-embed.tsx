import { Card } from "@/components/ui/card";

type Props = {
  city: string;
  province: string;
};

/**
 * Vista previa embebida de Google Maps (requiere API key con Maps Embed API).
 * @param props.city Ciudad del ticket.
 * @param props.province Provincia.
 */
export function TicketMapEmbed({ city, province }: Props) {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const q = encodeURIComponent(`${city}, ${province}, Argentina`);
  if (!key) {
    return (
      <Card padding="m" radius="m" className="w-full">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Configurá NEXT_PUBLIC_GOOGLE_MAPS_API_KEY y habilitá Maps Embed API para ver el mapa aquí.
        </p>
      </Card>
    );
  }
  const src = `https://www.google.com/maps/embed/v1/place?key=${key}&q=${q}&zoom=10`;
  return (
    <Card padding="none" radius="m" className="w-full overflow-hidden" style={{ minHeight: 240 }}>
      <iframe title="Mapa del ticket" src={src} width="100%" height="240" className="border-0" loading="lazy" />
    </Card>
  );
}
