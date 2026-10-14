import Image from "next/image";
import Link from "next/link";
import { AttributionBadge } from "@/components/AttributionBadge";
import { getClayChroniclesPhoto, getSpeciesDetail, getTimberRingsDetail } from "@/lib/data";
import type { ImageCredit } from "@/lib/types";

// One hand-picked, already-credited photo per hub, pulled straight from that
// hub's own data rather than a new fetch.
const SIX_LEGGED_TAXON_ID = "28963"; // Copper Peacock Beetle
const TIMBER_SITE_ID = "4152"; // Glimmingehus

export default function Home() {
  const beetle = getSpeciesDetail(SIX_LEGGED_TAXON_ID);
  const timberSite = getTimberRingsDetail(TIMBER_SITE_ID);
  const potteryPhoto = getClayChroniclesPhoto();

  const hubs: {
    href: string;
    title: string;
    tagline: string;
    image: ImageCredit | null;
    imageAlt: string;
  }[] = [
    {
      href: "/six-legged-sagas",
      title: "Six-Legged Sagas",
      tagline: "Beetles as climate records and creature paths through deep time.",
      image: beetle?.image ?? null,
      imageAlt: beetle?.common_name_en ?? "A beetle from the SEAD record",
    },
    {
      href: "/clay-chronicles",
      title: "Clay Chronicles",
      tagline: "What potters mixed into their clay, era by era.",
      image: potteryPhoto,
      imageAlt: "A decorated prehistoric pottery vessel",
    },
    {
      href: "/timber",
      title: "Timber Tales",
      tagline: "Every beam was once a living tree: four stories told through its rings.",
      image: timberSite?.photo ?? null,
      imageAlt: timberSite?.site_name ?? "A historic timber-framed building",
    },
  ];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-6 py-16">
      <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
        Thousands of years of dirt, trees and life 
        <span className="text-accent-text"> told as stories.</span>
      </h1>
      <p className="mt-4 max-w-xl text-ink-60">
        Every path below is built from real excavation data. Pick a thread, pull it and find out what Archaeology has to offer.
      </p>

      <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-3">
        {hubs.map((hub) => (
          <Link
            key={hub.href}
            href={hub.href}
            className="group overflow-hidden rounded-3xl border border-ink-10 bg-ink-3 transition-colors hover:border-accent/60"
          >
            <div className="relative aspect-[4/3] w-full bg-ink-5">
              {hub.image ? (
                <Image
                  src={hub.image.url}
                  alt={hub.imageAlt}
                  fill
                  unoptimized
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : null}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-4 pb-3 pt-10">
                <h2 className="text-lg font-semibold text-white">{hub.title}</h2>
              </div>
            </div>
            <div className="p-4">
              <p className="text-sm text-ink-60">{hub.tagline}</p>
              {hub.image && (
                <div className="mt-2">
                  <AttributionBadge image={hub.image} />
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-8 flex justify-center">
        <Link
          href="/stories"
          className="rounded-full border border-ink-15 px-5 py-2 text-sm text-ink-70 transition-colors hover:border-accent/60 hover:text-accent-text"
        >
          See all stories →
        </Link>
      </div>
    </div>
  );
}
