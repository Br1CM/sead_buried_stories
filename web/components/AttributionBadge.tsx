import type { ImageCredit } from "@/lib/types";

export function AttributionBadge({ image }: { image: ImageCredit | null }) {
  if (!image) return null;
  const parts = [image.creator, image.source, image.license].filter(Boolean);
  if (parts.length === 0) return null;

  return (
    <p className="text-[10px] leading-tight text-white/40">
      Photo: {parts.join(" · ")}
    </p>
  );
}
