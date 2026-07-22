import Link from "next/link";

const stories = [
  {
    href: "/species",
    title: "Species Path",
    tagline: "Pick a creature. Watch where it turns up, oldest site to newest.",
    ready: true,
  },
  {
    href: "/ceramics",
    title: "Ceramics Through Time",
    tagline: "How potters' recipes for clay and temper changed, era by era.",
    ready: true,
  },
  {
    href: "/climate",
    title: "The Ancient Thermometer",
    tagline: "Dead beetles as a climate record — temperature through the ages.",
    ready: true,
  },
  {
    href: "/sites",
    title: "Dig One Spot",
    tagline: "Descend through one site's layers, one era of finds at a time.",
    ready: true,
  },
];

export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-6 py-16">
      <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
        Thousands of years of dirt, bones, and pollen —
        <span className="text-accent"> told as stories.</span>
      </h1>
      <p className="mt-4 max-w-xl text-white/60">
        Every path below is built from real excavation data. No archaeology background
        required — just pick a thread and pull.
      </p>

      <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {stories.map((s) =>
          s.ready ? (
            <Link
              key={s.href}
              href={s.href}
              className="group rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-colors hover:border-accent/60"
            >
              <h2 className="text-xl font-medium">{s.title}</h2>
              <p className="mt-2 text-sm text-white/60">{s.tagline}</p>
              <span className="mt-4 inline-block text-sm text-accent opacity-0 transition-opacity group-hover:opacity-100">
                Start exploring →
              </span>
            </Link>
          ) : (
            <div
              key={s.href}
              className="rounded-2xl border border-white/5 bg-white/[0.015] p-6 opacity-50"
            >
              <h2 className="text-xl font-medium">{s.title}</h2>
              <p className="mt-2 text-sm text-white/50">{s.tagline}</p>
              <span className="mt-4 inline-block text-xs uppercase tracking-wide text-white/30">
                Coming soon
              </span>
            </div>
          )
        )}
      </div>
    </div>
  );
}
