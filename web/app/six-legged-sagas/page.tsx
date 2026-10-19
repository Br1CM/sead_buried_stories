import Link from "next/link";

export const metadata = { title: "Six-Legged Sagas | Buried Stories" };

const stories = [
  {
    href: "/species",
    title: "Species Path",
    tagline: "Pick a creature. Watch where it turns up, oldest site to newest.",
  },
  {
    href: "/climate",
    title: "The Ancient Thermometer",
    tagline: "Temperature through the ages using dead beetles as a climate record.",
  },
  {
    href: "/sites",
    title: "Dig One Spot",
    tagline: "Descend through one site's layers, one era of finds at a time.",
  },
];

export default function SixLeggedSagasHubPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-6 py-16">
      <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
        Most of what survives underground has{" "}
        <span className="text-accent-text">six legs.</span>
      </h1>
      <p className="mt-4 max-w-xl text-ink-60">
        Beetles outlast almost everything else in the ground, which makes them one of
        archaeology&rsquo;s best-kept records of the past: of climate, of place, of who lived
        where and when.
      </p>

      <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {stories.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="group rounded-2xl border border-ink-10 bg-ink-3 p-6 transition-colors hover:border-accent/60"
          >
            <h2 className="text-xl font-medium">{s.title}</h2>
            <p className="mt-2 text-sm text-ink-60">{s.tagline}</p>
            <span className="mt-4 inline-block text-sm text-accent-text opacity-0 transition-opacity group-hover:opacity-100">
              Start exploring →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
