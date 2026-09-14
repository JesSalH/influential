import { useState } from "react";
import { reels } from "@/lib/influential";
import { cn } from "@/lib/utils";

export function ReelRow() {
  const [active, setActive] = useState<(typeof reels)[number]["id"]>("courses");
  const current = reels.find((r) => r.id === active) ?? reels[1];

  return (
    <div>
      <ul className="flex justify-start gap-3 overflow-x-auto pb-3 md:justify-center">
        {reels.map((reel) => {
          const on = reel.id === active;
          return (
            <li key={reel.id} className="w-52 shrink-0 sm:w-56">
              <button
                type="button"
                onClick={() => setActive(reel.id)}
                onMouseEnter={() => setActive(reel.id)}
                className={cn(
                  "group relative block w-full overflow-hidden border-2 text-left transition-[transform,border-color] duration-200 ease-out",
                  on ? "border-spot" : "border-line hover:border-fg",
                )}
              >
                <span className="relative block aspect-reel overflow-hidden">
                  <img
                    src={reel.image}
                    alt={`${reel.label} avatar in context`}
                    className="h-full w-full object-cover transition-transform duration-200 ease-out group-hover:scale-105"
                  />
                  <span className="pointer-events-none absolute inset-0 bg-linear-to-t from-bg/85 via-bg/10 to-transparent" />
                  <span className="absolute inset-x-3 top-1/2 -translate-y-1/2 text-center font-display text-xl font-extrabold leading-[0.95] tracking-[-0.04em] text-balance">
                    {reel.caption}
                  </span>
                  <span className="absolute bottom-3 left-3 inline-flex min-h-8 items-center rounded-pill bg-bg/85 px-3 text-[10px] font-medium uppercase tracking-[0.12em]">
                    {reel.label}
                  </span>
                  {on ? (
                    <span className="absolute top-3 right-3 size-2.5 rounded-pill bg-spot" aria-hidden />
                  ) : null}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <div className="mx-auto mt-8 max-w-xl border-t-2 border-line pt-6 text-center">
        <p className="text-[11px] uppercase tracking-[0.22em] text-spot">{current.label}</p>
        <p className="mt-3 text-base leading-relaxed text-muted text-pretty">{current.blurb}</p>
      </div>
    </div>
  );
}
