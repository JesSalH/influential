import { useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/start")({ component: StartPage });

function StartPage() {
  const [sent, setSent] = useState(false);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const payload = {
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      company: String(data.get("company") ?? ""),
      brief: String(data.get("brief") ?? ""),
      at: new Date().toISOString(),
    };
    try {
      const prev = JSON.parse(localStorage.getItem("influential-briefs") ?? "[]") as unknown[];
      localStorage.setItem("influential-briefs", JSON.stringify([payload, ...prev].slice(0, 20)));
    } catch {
      /* ignore quota */
    }
    setSent(true);
  }

  return (
    <div className="min-h-screen bg-bg">
      <SiteHeader />
      <main className="grid gap-12 px-6 py-16 lg:grid-cols-2 lg:gap-20">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-muted">Vol.01 · Intake</p>
          <h1 className="mt-4 font-display text-[clamp(3rem,8vw,6.5rem)] font-extrabold uppercase leading-[0.8] tracking-[-0.06em] text-balance">
            Start a<br />
            project.
          </h1>
          <p className="mt-6 max-w-prose text-lg leading-relaxed text-muted text-pretty">
            Tell us the face, the market, and the first video. We will come back with a studio seat — not a 40-slide deck.
          </p>
        </div>

        {sent ? (
          <div className="border-2 border-line p-8">
            <p className="font-display text-4xl font-extrabold uppercase tracking-[-0.04em]">Received.</p>
            <p className="mt-4 max-w-prose text-muted">
              We logged the brief on this device. A producer will follow up at the email you left.
            </p>
            <Link to="/" className="mt-8 inline-flex min-h-12 items-center bg-fg px-5 font-display text-[13px] font-bold uppercase tracking-[0.06em] text-bg">
              Back to INFLUENTIAL
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="flex flex-col gap-5 border-2 border-line p-6 sm:p-8">
            <Field id="name" label="Name" required />
            <Field id="email" label="Work email" type="email" required />
            <Field id="company" label="Company" />
            <label className="flex flex-col gap-2 text-[11px] uppercase tracking-[0.14em] text-muted">
              First video
              <textarea
                id="brief"
                name="brief"
                required
                rows={6}
                className="min-h-32 border-2 border-line bg-bg px-3 py-3 font-sans text-base normal-case tracking-normal text-fg outline-none focus:border-spot"
                placeholder="Avatar, industry, language, length."
              />
            </label>
            <Button type="submit">Send brief</Button>
          </form>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function Field({
  id,
  label,
  type = "text",
  required,
}: {
  id: string;
  label: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-2 text-[11px] uppercase tracking-[0.14em] text-muted">
      {label}
      <input
        id={id}
        name={id}
        type={type}
        required={required}
        className="min-h-12 border-2 border-line bg-bg px-3 font-sans text-base normal-case tracking-normal text-fg outline-none focus:border-spot"
      />
    </label>
  );
}
