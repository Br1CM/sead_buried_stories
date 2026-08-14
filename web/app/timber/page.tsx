import Link from "next/link";

export const metadata = { title: "Timber Tales | Buried Stories" };

const stories = [
  {
    href: "/timber/rings",
    title: "Rings of a Building",
    tagline: "Grow a historic building's timbers outward, ring by dated ring.",
  },
  {
    href: "/timber/species-map",
    title: "What Sweden Was Built From",
    tagline: "Scrub through the centuries and watch oak give way to pine.",
  },
  {
    href: "/timber/precise",
    title: "The Exact Month a Tree Fell",
    tagline: "Bark still attached, centuries later — precise to the month.",
  },
  {
    href: "/timber/sisters",
    title: "Sister Buildings",
    tagline: "Buildings hundreds of kilometers apart, built from the same felling.",
  },
];

export default function TimberHubPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-6 py-16">
      <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
        Every beam was once a <span className="text-accent-text">living tree.</span>
      </h1>
      <p className="mt-4 max-w-xl text-ink-60">
        Dendrochronology dates wood to the calendar year &mdash; sometimes the season
        &mdash; by reading its growth rings. Four ways into that record, built from real
        historic Swedish churches, castles, and manors.
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
