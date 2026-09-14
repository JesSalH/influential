import { useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { CONTACT_EMAIL } from "@/lib/influential";

export const Route = createFileRoute("/start")({ component: StartPage });

function StartPage() {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = e.currentTarget;
    const data = new FormData(form);
    if (String(data.get("company_website") ?? "")) {
      setSent(true);
      return;
    }
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const company = String(data.get("company") ?? "").trim();
    const brief = String(data.get("brief") ?? "").trim();
    setSending(true);
    try {
      const res = await fetch(`https://formsubmit.co/ajax/${CONTACT_EMAIL}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          name,
          email,
          _replyto: email,
          company: company || "—",
          brief,
          _subject: `INFLUENTIAL brief — ${name}`,
          _template: "table",
          _captcha: "false",
        }),
      });
      const json = (await res.json()) as { success?: string | boolean; message?: string };
      const activating = /activation/i.test(String(json.message ?? ""));
      if (!activating && (!res.ok || json.success === "false" || json.success === false)) {
        throw new Error("rejected");
      }
      setSent(true);
    } catch {
      setError(`The brief didn't go through. Email us at ${CONTACT_EMAIL}.`);
    } finally {
      setSending(false);
    }
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
              The brief is with the studio. A producer will follow up at the email you left.
            </p>
            <Link to="/" className="mt-8 inline-flex min-h-12 items-center bg-fg px-5 font-display text-[13px] font-bold uppercase tracking-[0.06em] text-bg">
              Back to INFLUENTIAL
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="relative flex flex-col gap-5 border-2 border-line p-6 sm:p-8">
            <input
              type="text"
              name="company_website"
              tabIndex={-1}
              autoComplete="off"
              className="absolute -left-[9999px] h-0 w-0 overflow-hidden"
              aria-hidden
            />
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
            {error ? <p className="text-sm text-heat">{error}</p> : null}
            <Button type="submit" disabled={sending}>
              {sending ? "Sending…" : "Send brief"}
            </Button>
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