// Collapsible explainer for the date notation a story uses. "bp" stories show dates SEAD
// stores as BP (radiocarbon-style, years before 1950) converted to BC/AD by the pipeline
// (see pipeline/dating.py); "dendro" stories show tree-ring dates, which are calendar AD
// years from the start.
export function DatingNote({ kind }: { kind: "bp" | "dendro" }) {
  return (
    <details className="mt-3 max-w-2xl text-sm text-ink-50">
      <summary className="cursor-pointer select-none text-ink-60 transition-colors hover:text-foreground">
        What do BC, AD and BP mean?
      </summary>
      <div className="mt-2 space-y-2 border-l-2 border-accent/40 pl-3">
        {kind === "bp" ? (
          <>
            <p>
              <strong>BC</strong> (&ldquo;Before Christ&rdquo;) counts years backwards from year 1;{" "}
              <strong>AD</strong> (&ldquo;Anno Domini&rdquo;) counts forwards, as in today&rsquo;s
              calendar. So 3000 BC is roughly 5,000 years ago.
            </p>
            <p>
              SEAD records most of these dates in <strong>BP</strong> (&ldquo;Before Present&rdquo;),
              the scale used for radiocarbon dating, where &ldquo;present&rdquo; is fixed at the year
              1950: 1000 BP is AD 950, and 5000 BP is 3050 BC. We&rsquo;ve converted them all to
              BC/AD here. They are scientific estimates, so many cover a range of years rather
              than a single one.
            </p>
          </>
        ) : (
          <>
            <p>
              <strong>AD</strong> (&ldquo;Anno Domini&rdquo;) is today&rsquo;s calendar: 1650 AD is
              simply the year 1650. Every date in this story is an AD year, worked out by
              dendrochronology, matching a timber&rsquo;s growth rings against a reference sequence
              to find the exact year its outermost ring grew.
            </p>
            <p>
              Elsewhere in SEAD you&rsquo;ll also meet <strong>BC</strong> (years before year 1) and{" "}
              <strong>BP</strong> (&ldquo;Before Present&rdquo;, counting back from 1950, the scale
              used for radiocarbon dates), but tree rings date wood to the calendar year directly.
            </p>
          </>
        )}
      </div>
    </details>
  );
}
