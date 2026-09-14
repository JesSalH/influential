import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";

const nav = [
  { href: "/#avatar", label: "Avatar" },
  { href: "/#video-agent", label: "Video Agent" },
  { href: "/#studio", label: "Studio" },
  { href: "/#translation", label: "Translate" },
  { href: "/#contexts", label: "Contexts" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="relative z-30 flex items-start justify-between px-6 pt-5 pb-3 text-[11px] font-medium uppercase tracking-[0.14em]">
      <Link to="/" className="font-display text-lg font-extrabold tracking-[-0.04em] normal-case">
        INFLUENTIAL
      </Link>

      <nav className="hidden gap-6 md:flex" aria-label="Primary">
        {nav.map((item) => (
          <a key={item.href} href={item.href} className="text-muted hover:text-fg">
            {item.label}
          </a>
        ))}
      </nav>

      <div className="hidden items-center gap-6 md:flex">
        <span className="text-muted">Vol.01 · USA</span>
        <Link
          to="/start"
          className="min-h-11 inline-flex items-center bg-fg px-4 font-display text-[12px] font-bold tracking-[0.06em] text-bg"
        >
          Start
        </Link>
      </div>

      <button
        type="button"
        className="inline-flex min-h-11 min-w-11 items-center justify-center md:hidden"
        aria-expanded={open}
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>

      {open ? (
        <div className="absolute inset-x-0 top-full border-b-2 border-line bg-bg px-6 py-6 md:hidden">
          <nav className="flex flex-col gap-4" aria-label="Mobile">
            {nav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="py-2 font-display text-2xl font-extrabold uppercase tracking-[-0.04em]"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <Link
              to="/start"
              className="mt-2 inline-flex min-h-12 items-center justify-center bg-fg font-display text-[13px] font-bold uppercase tracking-[0.06em] text-bg"
              onClick={() => setOpen(false)}
            >
              Start a project
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
