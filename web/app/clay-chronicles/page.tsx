import Link from "next/link";

export const metadata = { title: "Clay Chronicles | Buried Stories" };

const stories = [
  {
    href: "/ceramics",
    title: "Ceramics Through Time",
    tagline: "How potters' recipes for clay and temper changed, era by era.",
  },
];

export default function ClayChroniclesHubPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-6 py-16">
      <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
        Every sherd is a <span className="text-accent-text">recipe.</span>
      </h1>
      <p className="mt-4 max-w-xl text-ink-60">
        What a potter mixed into their clay says as
        much about their era as the shape of the pot itself.
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
