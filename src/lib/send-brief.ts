import { createServerFn } from "@tanstack/react-start";

type Brief = {
  name: string;
  email: string;
  company: string;
  brief: string;
};

export const sendBrief = createServerFn({ method: "POST" })
  .validator((d: Brief) => ({
    name: String(d.name ?? "").trim(),
    email: String(d.email ?? "").trim(),
    company: String(d.company ?? "").trim(),
    brief: String(d.brief ?? "").trim(),
  }))
  .handler(async ({ data }) => {
    const { env } = await import("@/lib/env.server");
    let to = env("CONTACT_EMAIL");
    if (!to) {
      try {
        const { readFileSync } = await import("node:fs");
        const { resolve } = await import("node:path");
        const raw = readFileSync(resolve(process.cwd(), ".env"), "utf8");
        const line = raw.split("\n").find((l) => l.startsWith("CONTACT_EMAIL="));
        to = line?.slice("CONTACT_EMAIL=".length).trim() || undefined;
      } catch {
        /* no .env */
      }
    }
    if (!to) throw new Error("inbox missing");
    if (!data.name || !data.email || !data.brief) throw new Error("missing");
    const res = await fetch(`https://formsubmit.co/ajax/${to}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        name: data.name,
        email: data.email,
        _replyto: data.email,
        company: data.company || "—",
        brief: data.brief,
        _subject: `INFLUENTIAL LABS brief — ${data.name}`,
        _template: "table",
        _captcha: "false",
      }),
    });
    const json = (await res.json()) as { success?: string | boolean; message?: string };
    const activating = /activation/i.test(String(json.message ?? ""));
    if (!activating && (!res.ok || json.success === "false" || json.success === false)) {
      throw new Error("rejected");
    }
    return { ok: true as const };
  });
