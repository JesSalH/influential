import { Link } from "@tanstack/react-router";
import { STUDIO_URL } from "@/lib/influential";

export function SiteFooter() {
  return (
    <footer className="flex flex-col gap-3 border-t-2 border-line px-6 py-5 text-[11px] uppercase tracking-[0.12em] text-muted sm:flex-row sm:justify-between">
      <span className="text-fg">INFLUENTIAL</span>
      <span>AI influencer studio</span>
      <div className="flex flex-wrap gap-5">
        <a href="/#avatar">Product</a>
        <a href={STUDIO_URL} className="text-spot">
          Studio
        </a>
        <Link to="/start">Start</Link>
        <span>© 2026</span>
      </div>
    </footer>
  );
}