import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { HoverLoop } from "@/components/hover-loop";
import { ReelRow } from "@/components/reel-row";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { buttonVariants } from "@/components/ui/button";
import { locales, pillars, selfServe, STUDIO_URL, tools } from "@/lib/influential";
import { useRotate } from "@/lib/use-rotate";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-bg text-fg">
      <SiteHeader />

      <section className="px-6 pt-4 [container-type:inline-size]">
        <p className="text-[11px] uppercase tracking-[0.22em] text-muted">Vol.01 · AI influencer studio</p>
        <h1 className="wordmark mt-5">INFLUENTIAL</h1>
        <p className="mt-5 font-display text-[clamp(2.6rem,9.5vw,8.5rem)] font-extrabold uppercase leading-[0.78] tracking-[-0.06em]">
          The most
          <br />
          realistic
          <br />
          AI <span className="text-spot">avatars</span>
        </p>
      </section>

      <HeroShots />

      <section id="contexts" className="scroll-mt-8 border-t-2 border-line px-6 py-16 md:py-20">
        <div className="mx-auto mb-10 max-w-3xl text-center">
          <p className="text-[11px] uppercase tracking-[0.22em] text-muted">One avatar, every vertical</p>
          <h2 className="mt-3 font-display text-[clamp(2.25rem,5vw,4.5rem)] font-extrabold uppercase leading-[0.88] tracking-[-0.04em]">
            Dressed for the vertical.
          </h2>
          <p className="mx-auto mt-5 max-w-prose text-muted text-pretty">
            The same identity, recut for the industry in front of it. Social content, online courses, legal, finance, real estate — new set, wardrobe, and caption. No recast. Native 9:16 for TikTok, Reels, and Stories.
          </p>
        </div>
        <ReelRow />
      </section>

      <div className="mx-6 mt-4 flex flex-col gap-2 border-y-2 border-line py-3.5 text-xs uppercase tracking-[0.12em] md:flex-row md:items-center md:justify-between">
        <span>Not a face generator</span>
        <b className="font-display font-bold">A full AI influencer studio</b>
        <span>175+ languages · character lock</span>
      </div>

      <section className="grid border-b-2 border-line lg:grid-cols-2">
        <CompareShot />
        <div className="flex flex-col justify-center px-6 py-12 lg:px-12">
          <h2 className="font-display text-[clamp(2rem,4.5vw,3.75rem)] font-extrabold uppercase leading-[0.9] tracking-[-0.04em] text-balance">
            Realistic AI video in minutes.
          </h2>
          <p className="mt-6 max-w-prose text-lg leading-relaxed text-muted text-pretty">
            Be everywhere without being everywhere. INFLUENTIAL keeps the same face, the same micro-expressions, the same presence — in a 30-second clip and a 10-minute course module. No drift. No artifacts. No uncanny valley.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#avatar" className={cn(buttonVariants({ variant: "solid" }))}>
              See the product
            </a>
            <Link to="/start" className={cn(buttonVariants({ variant: "ghost" }))}>
              Start a project
            </Link>
          </div>
        </div>
      </section>

      <section className="grid sm:grid-cols-2 lg:grid-cols-4" aria-label="Product pillars">
        {pillars.map((p) => (
          <a
            key={p.id}
            href={`#${p.id}`}
            className="group border-b-2 border-line transition-[border-color,background-color] duration-200 ease-out hover:border-heat hover:bg-heat/10 sm:border-r-2 lg:border-b-0 lg:last:border-r-0"
          >
            <figure className="h-56 overflow-hidden sm:h-64">
              <img
                src={p.image}
                alt={p.name}
                className="h-full w-full object-cover transition-transform duration-200 ease-out group-hover:scale-105"
              />
            </figure>
            <div className="px-5 py-6">
              <span className="font-display text-4xl font-extrabold tracking-[-0.06em] text-spot">{p.n}</span>
              <h3 className="mt-2 font-display text-lg font-bold uppercase tracking-[-0.03em]">{p.name}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted group-hover:hidden">{p.lede}</p>
              <p className="mt-3 hidden text-sm leading-relaxed text-fg group-hover:block">{p.detail}</p>
            </div>
          </a>
        ))}
      </section>

      <Split
        id="avatar"
        n="01"
        kicker="Flagship · AI Avatar Generator"
        title="One identity. Every frame."
        image="/product/speech.jpg"
        alt="Executive delivering a report to the company"
        cta="Generate an avatar"
        reverse={false}
      >
        Keep a single, coherent identity across every video you make. The same face, the same micro-expressions, the same presence — whether the cut is thirty seconds or a ten-minute lesson.
      </Split>
      <FeatureStrip
        items={[
          {
            t: "Character consistency",
            d: "A locked identity from the first take to the hundredth.",
            detail:
              "Avatar V-grade lock: the same face, micro-expressions, and presence in a 30-second clip and a 10-minute module. No drift. No artifacts. No uncanny valley. Trained on how you talk and move — not a one-frame mask.",
            image: "/talent/mara.jpg",
          },
          {
            t: "Multiple angles",
            d: "Wide, medium, close-up — from one recording.",
            detail:
              "The camera language of a real production: wides, mediums, and close-ups that still read as one person.",
            image: "/product/angles.jpg",
          },
          {
            t: "Phoneme-level lip sync",
            d: "What you hear and what you see agree.",
            detail:
              "Phoneme accuracy at any speed, in 175+ languages and dialects. What you hear and what you see are in perfect agreement. The mouth is not guessing.",
            image: "/product/lips.jpg",
          },
          {
            t: "Voice-synced emotion",
            d: "A performer, not a slide.",
            detail:
              "Upper-body motion, gesture, and stillness hold across scene changes — driven by the voice, not a loop.",
            image: "/product/emotion.jpg",
          },
        ]}
      />

      <Split
        id="video-agent"
        n="02"
        kicker="Video Agent"
        title="Type the idea. Ship the cut."
        image="/product/agent-prompt.jpg"
        alt="Prompt-to-video in the studio"
        cta="Generate a video"
        reverse
      >
        Type your idea. Click generate. Get a share-ready video faster than you can think. No camera, editing software, or production skills needed. Visuals, avatar, B-roll, and motion graphics land in one pass.
      </Split>
      <FeatureStrip
        items={[
          {
            t: "Prompt to finished video",
            d: "One instruction. A complete piece.",
            detail: "Write the idea. The agent returns picture, performance, B-roll, and type — not a folder of raw clips.",
            image: "/product/agent-prompt.jpg",
          },
          {
            t: "Avatar + B-roll + type",
            d: "Talent, footage, and graphics together.",
            detail: "The agent stages the presenter, supporting shots, and motion graphics in a single timeline.",
            image: "/product/angles.jpg",
          },
          {
            t: "No production stack",
            d: "Skip the camera and the NLE.",
            detail: "No crew, no booth, no edit suite. Share-ready without learning production software.",
            image: "/product/crossfit.jpg",
          },
          {
            t: "Fully editable",
            d: "Change type, color, timing. No re-render.",
            detail:
              "Every motion element stays editable after generate. Adjust text, color, timing, or layout in Studio without rendering the video again from scratch.",
            image: "/product/phone.jpg",
          },
        ]}
      />

      <Split
        id="studio"
        n="03"
        kicker="AI Studio"
        title="Direct the performance in a document."
        image="/product/studio.jpg"
        alt="AI Studio script and preview"
        cta="Open the studio"
        reverse={false}
      >
        The central editor is a script. You control tone, pace, gesture, and emotion by writing. Comments, tags, and a Brand Kit sit beside the page so teams mark up a take the way they mark up copy.
      </Split>
      <FeatureStrip
        items={[
          {
            t: "Voice Director",
            d: "Pace and silence from the script.",
            detail: "Mark emphasis, pause, and temperature in the copy. Delivery is directed, not guessed.",
            image: "/product/booth.jpg",
          },
          {
            t: "Voice Mirroring",
            d: "Match a voice without a booth day.",
            detail: "Point at a reference take. The avatar inherits tone and cadence without recasting the talent.",
            image: "/product/mirroring.jpg",
          },
          {
            t: "Gesture Control",
            d: "Hands, glance, stillness.",
            detail: "Call the performance as line items — when to move, when to hold — so the body follows the argument.",
            image: "/product/emotion.jpg",
          },
          {
            t: "Multiplayer + Brand Kit",
            d: "Comments, tags, captions, brand.",
            detail: "Teams mark up the page like a doc. Color, type, and logo lock on every export.",
            image: "/product/studio.jpg",
          },
        ]}
      />

      <Split
        id="translation"
        n="04"
        kicker="Video Translation"
        title="One recording. Every market."
        image="/product/translate.jpg"
        alt="Avatar localized for a new market"
        cta="Translate a video"
        reverse
      >
        AI video translation that keeps your tone, locks your lips, and reaches global audiences in 175+ languages and dialects — no reshoot, no manual dub.
      </Split>
      <LangBar />
      <FeatureStrip
        items={[
          {
            t: "Effortless translation",
            d: "Upload a file or paste a YouTube link.",
            detail: "One click. No recast, no dub stage. Fast localization for a creator or a company catalog.",
            image: "/product/translate.jpg",
          },
          {
            t: "Voice clone + lip lock",
            d: "Your tone. Their language.",
            detail: "The clone keeps your tone and delivery across 175+ languages while phoneme-accurate lips follow the new line.",
            image: "/product/lips.jpg",
          },
          {
            t: "Built to scale globally",
            d: "One script, many languages.",
            detail: "Brand glossary plus a multilingual player — terminology and playback stay in your control.",
            image: "/talent/kai.jpg",
          },
          {
            t: "No reshoot",
            d: "The original performance travels.",
            detail: "Same identity, new market. You do not recast the face to cross a border.",
            image: "/talent/lina.jpg",
          },
        ]}
      />

      <section id="self-serve" className="scroll-mt-8 border-t-2 border-line">
        <div className="grid lg:grid-cols-2">
          <figure className="min-h-80 overflow-hidden lg:min-h-[32rem]">
            <img
              src="/product/diy-studio.jpg"
              alt="A creator running INFLUENTIAL Studio from their own desk"
              className="h-full w-full object-cover object-center"
            />
          </figure>
          <div className="flex flex-col justify-center px-6 py-12 lg:px-12">
            <p className="text-[11px] uppercase tracking-[0.22em] text-muted">Self-serve · Paid in coins</p>
            <p className="mt-5 font-display text-[11px] font-extrabold tracking-[0.18em] text-spot">INFLUENTIAL</p>
            <h2 className="mt-1 font-display text-[clamp(2.4rem,5.4vw,5rem)] font-extrabold uppercase leading-[0.84] tracking-[-0.05em]">
              Studio
            </h2>
            <p className="mt-6 max-w-prose text-lg leading-relaxed text-muted text-pretty">
              Don't brief the agency. Sit at the desk. Image edit, image-to-video, long scenes, talking video — one coin balance, review before you pay. Fifty coins on signup. No subscription. You make it. You ship it.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href={STUDIO_URL} className={cn(buttonVariants({ variant: "heat" }))}>
                Open the studio
              </a>
              <Link to="/start" className={cn(buttonVariants({ variant: "ghost" }))}>
                Work with us instead
              </Link>
            </div>
          </div>
        </div>
        <ul className="grid border-t-2 border-line sm:grid-cols-2 lg:grid-cols-4">
          {selfServe.map((item) => (
            <li
              key={item.n}
              className="border-b-2 border-line px-6 py-8 sm:border-r-2 lg:border-b-0 lg:last:border-r-0"
            >
              <span className="font-display text-2xl font-extrabold tracking-[-0.06em] text-spot">{item.n}</span>
              <h3 className="mt-2 font-display font-bold uppercase">{item.t}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{item.d}</p>
            </li>
          ))}
        </ul>
      </section>

      <section id="tools" className="scroll-mt-8 border-t-2 border-line px-6 py-16 md:py-24">
        <p className="text-[11px] uppercase tracking-[0.22em] text-muted">Ways in</p>
        <h2 className="mt-3 max-w-4xl font-display text-[clamp(2.25rem,5vw,4.2rem)] font-extrabold uppercase leading-[0.88] tracking-[-0.04em]">
          Six doors. One studio.
        </h2>
        <p className="mt-5 max-w-prose text-muted text-pretty">
          Each card is an entry point — not a separate product. It jumps to the pillar that does that job, so you can start from a script, a still, a face, or a finished film.
        </p>
        <ul className="mt-10 grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <li key={tool.name} className="bg-bg">
              <a
                href={tool.href}
                className="group flex h-full flex-col justify-between px-6 py-8 transition-colors duration-200 hover:bg-heat/10"
              >
                <div>
                  <h3 className="font-display text-lg font-bold uppercase tracking-[-0.03em] group-hover:text-heat">
                    {tool.name}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted group-hover:text-fg">{tool.blurb}</p>
                </div>
                <span className="mt-6 text-[11px] uppercase tracking-[0.16em] text-muted group-hover:text-heat">
                  Jump to {tool.jump} →
                </span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section id="how" className="scroll-mt-8 border-t-2 border-line">
        <div className="px-6 pt-16 md:pt-20">
          <p className="text-[11px] uppercase tracking-[0.22em] text-muted">How a project ships</p>
          <h2 className="mt-3 max-w-4xl font-display text-[clamp(2.25rem,5vw,4.2rem)] font-extrabold uppercase leading-[0.88] tracking-[-0.04em]">
            Three moves. Then it is out.
          </h2>
          <p className="mt-5 mb-10 max-w-prose text-muted text-pretty">
            The order is the product. Lock the identity first, write the performance second, localize last. Skip a step and the face drifts or the market gets a recast.
          </p>
        </div>
        <div className="grid border-t-2 border-line md:grid-cols-3">
          <Step
            n="01"
            t="Lock the face"
            href="/#avatar"
            d="Generate an avatar with character consistency that survives every angle and language."
            detail="This is the lock before you write a single line. Same identity in a 30-second clip and a 10-minute module."
          />
          <Step
            n="02"
            t="Write the show"
            href="/#video-agent"
            d="Prompt the Video Agent for a finished cut, or direct tone, gesture, and captions in Studio."
            detail="A-roll, B-roll, type, brand. The draft stays editable — you do not render from scratch to change a line."
          />
          <Step
            n="03"
            t="Ship every market"
            href="/#translation"
            d="Translate with a cloned voice and phoneme lip-sync. One recording, 175+ languages."
            detail="The performance travels. The face is not recast. Brand glossary keeps the name the name."
          />
        </div>
      </section>

      <section id="trust" className="scroll-mt-8 border-t-2 border-line">
        <div className="px-6 pt-16 md:pt-20">
          <p className="text-[11px] uppercase tracking-[0.22em] text-muted">Trust</p>
          <h2 className="mt-3 max-w-4xl font-display text-[clamp(2.25rem,5vw,4.2rem)] font-extrabold uppercase leading-[0.88] tracking-[-0.04em]">
            The face has to be yours.
          </h2>
          <p className="mt-5 mb-10 max-w-prose text-muted text-pretty">
            AI video has a consent problem. INFLUENTIAL treats likeness, brand language, and the edit as things you keep — not a model we train on in the dark.
          </p>
        </div>
        <div className="grid border-t-2 border-line md:grid-cols-3">
          <Ethics
            t="Verified likeness"
            d="A custom avatar starts with on-camera consent from the person depicted. No stolen face, no scrape. Removal requests are honored."
          />
          <Ethics
            t="Brand glossary"
            d="Do-not-translate terms and forced translations travel with every market. Product names, legal lines, and the house style stay intact."
          />
          <Ethics
            t="You keep the edit"
            d="A Video Agent draft opens in Studio. Type, color, and timing stay live. You are not locked into a one-shot render."
          />
        </div>
      </section>

      <section className="grid border-t-2 border-line lg:grid-cols-2">
        <div className="flex flex-col justify-end px-6 py-16 md:py-20">
          <h2 className="font-display text-[clamp(3rem,7vw,6rem)] font-extrabold uppercase leading-[0.8] tracking-[-0.06em]">
            Book a
            <br />
            studio seat.
          </h2>
          <Link to="/start" className={cn(buttonVariants({ variant: "spot" }), "mt-8 w-fit min-h-14 px-8")}>
            Start a project
          </Link>
        </div>
        <figure className="min-h-72 overflow-hidden lg:min-h-[28rem]">
          <img src="/talent/sable.jpg" alt="INFLUENTIAL talent" className="h-full w-full object-cover" />
        </figure>
      </section>

      <SiteFooter />
    </div>
  );
}

function CompareShot() {
  const [gen, setGen] = useState(true);
  return (
    <figure className="relative min-h-80 overflow-hidden lg:min-h-[36rem]">
      <img
        src={gen ? "/product/news.jpg" : "/talent/sable.jpg"}
        alt={gen ? "INFLUENTIAL avatar on a news desk" : "Reference still"}
        className="h-full w-full object-cover object-top"
      />
      <div className="absolute bottom-4 left-4 flex border-2 border-line bg-bg/90">
        <button
          type="button"
          onClick={() => setGen(false)}
          className={cn(
            "min-h-10 px-4 text-[11px] font-medium uppercase tracking-[0.14em]",
            !gen ? "bg-heat text-heat-fg" : "text-muted hover:text-fg",
          )}
        >
          Reference
        </button>
        <button
          type="button"
          onClick={() => setGen(true)}
          className={cn(
            "min-h-10 px-4 text-[11px] font-medium uppercase tracking-[0.14em]",
            gen ? "bg-heat text-heat-fg" : "text-muted hover:text-fg",
          )}
        >
          INFLUENTIAL
        </button>
      </div>
    </figure>
  );
}

function LangBar() {
  const [id, setId] = useState<(typeof locales)[number]["id"]>("en");
  const current = locales.find((l) => l.id === id) ?? locales[0];
  return (
    <div className="flex flex-col gap-4 border-t-2 border-line px-6 py-6 md:flex-row md:items-center md:justify-between">
      <p className="font-display text-2xl font-extrabold uppercase tracking-[-0.04em]">{current.line}</p>
      <div className="flex flex-wrap gap-2">
        {locales.map((l) => (
          <button
            key={l.id}
            type="button"
            onClick={() => setId(l.id)}
            className={cn(
              "min-h-10 border-2 px-3 text-[11px] font-medium uppercase tracking-[0.14em] transition-colors duration-150",
              l.id === id ? "border-heat bg-heat text-heat-fg" : "border-line text-muted hover:border-fg hover:text-fg",
            )}
          >
            {l.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Ethics({ t, d }: { t: string; d: string }) {
  return (
    <div className="group border-b-2 border-line px-6 py-10 transition-colors duration-200 hover:bg-heat/10 md:border-b-0 md:border-r-2 md:last:border-r-0">
      <h3 className="font-display font-bold uppercase group-hover:text-heat">{t}</h3>
      <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted group-hover:text-fg">{d}</p>
    </div>
  );
}

function HeroShots() {
  const shots = [
    { src: "/talent/sable.jpg", video: "/loops/sable.mp4", alt: "INFLUENTIAL avatar, fashion" },
    { src: "/talent/ash.jpg", video: "/loops/ash.mp4", alt: "INFLUENTIAL avatar, editorial" },
    { src: "/talent/lina.jpg", video: "/loops/lina.mp4", alt: "INFLUENTIAL avatar, lifestyle" },
    { src: "/talent/kai.jpg", video: "/loops/kai.mp4", alt: "INFLUENTIAL avatar, campaign" },
  ] as const;
  const { active, enter, leave } = useRotate(shots.length);

  return (
    <section className="mt-8 grid grid-cols-2 gap-2 px-6 md:grid-cols-4">
      {shots.map((shot, i) => {
        const on = i === active;
        return (
          <figure
            key={shot.src}
            className={cn(
              "relative min-h-52 overflow-hidden border-2 md:min-h-[28rem] transition-colors duration-200",
              on ? "border-heat" : "border-transparent",
            )}
            onPointerEnter={() => enter(i)}
            onPointerLeave={leave}
          >
            <HoverLoop
              poster={shot.src}
              src={shot.video}
              alt={shot.alt}
              playing={on}
              className="h-full min-h-52 md:min-h-[28rem]"
            />
          </figure>
        );
      })}
    </section>
  );
}

function Split({
  id,
  n,
  kicker,
  title,
  image,
  alt,
  reverse,
  cta,
  children,
}: {
  id: string;
  n: string;
  kicker: string;
  title: string;
  image: string;
  alt: string;
  reverse?: boolean;
  cta: string;
  children: string;
}) {
  return (
    <section id={id} className="scroll-mt-8 grid border-t-2 border-line lg:grid-cols-2">
      <div className={cn("flex flex-col", reverse && "lg:order-2")}>
        <figure className="min-h-80 flex-1 overflow-hidden lg:min-h-[30rem]">
          <img src={image} alt={alt} className="h-full w-full object-cover object-top" />
        </figure>
        <div className="border-t-2 border-line px-6 py-4">
          <Link to="/start" className={cn(buttonVariants({ variant: "heat" }), "w-full sm:w-auto")}>
            {cta}
          </Link>
        </div>
      </div>
      <div className={cn("flex flex-col justify-center px-6 py-12 lg:px-12", reverse && "lg:order-1")}>
        <p className="text-[11px] uppercase tracking-[0.22em] text-muted">
          {n} · {kicker}
        </p>
        <h2 className="mt-4 font-display text-[clamp(2.1rem,4.8vw,4.2rem)] font-extrabold uppercase leading-[0.88] tracking-[-0.04em] text-balance">
          {title}
        </h2>
        <p className="mt-6 max-w-prose text-lg leading-relaxed text-muted text-pretty">{children}</p>
      </div>
    </section>
  );
}

function FeatureStrip({
  items,
}: {
  items: { t: string; d: string; detail: string; image: string }[];
}) {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <ul className="grid sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => {
        const on = open === item.t;
        return (
          <li key={item.t} className="min-h-0 border-t-2 border-r-2 border-line last:border-r-0 max-lg:[&:nth-child(2n)]:border-r-0 lg:[&:nth-child(4n)]:border-r-0">
            <button
              type="button"
              onClick={() => setOpen(on ? null : item.t)}
              className={cn(
                "group flex h-full w-full flex-col text-left transition-[background-color,outline-color] duration-200 ease-out",
                on ? "bg-heat/10 outline outline-2 outline-heat -outline-offset-2" : "hover:bg-heat/10 hover:outline hover:outline-2 hover:outline-heat hover:-outline-offset-2",
              )}
            >
              <figure className="h-72 overflow-hidden">
                <img
                  src={item.image}
                  alt=""
                  className="h-full w-full object-cover object-top transition-transform duration-200 ease-out group-hover:scale-110"
                />
              </figure>
              <div className="flex flex-1 flex-col px-5 py-6">
                <h3 className="font-display text-sm font-bold uppercase tracking-[-0.02em] text-fg group-hover:text-heat">
                  {item.t}
                </h3>
                <p className={cn("mt-3 text-sm leading-relaxed", on ? "hidden" : "text-muted group-hover:hidden")}>
                  {item.d}
                </p>
                <p className={cn("mt-3 text-sm leading-relaxed text-fg", on ? "block" : "hidden group-hover:block")}>
                  {item.detail}
                </p>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function Step({
  n,
  t,
  d,
  detail,
  href,
}: {
  n: string;
  t: string;
  d: string;
  detail: string;
  href: string;
}) {
  return (
    <a
      href={href}
      className="group block border-b-2 border-line px-6 py-12 transition-[background-color] duration-200 ease-out hover:bg-heat/10 md:border-b-0 md:border-r-2 md:last:border-r-0"
    >
      <div className="font-display text-5xl font-extrabold tracking-[-0.06em] text-spot transition-transform duration-200 ease-out group-hover:scale-110 group-hover:text-heat">
        {n}
      </div>
      <h3 className="mt-3 font-display font-bold uppercase group-hover:text-heat">{t}</h3>
      <p className="mt-3 max-w-prose leading-relaxed text-muted">{d}</p>
      <p className="mt-3 hidden max-w-prose text-sm leading-relaxed text-fg group-hover:block">{detail}</p>
      <span className="mt-6 text-[11px] uppercase tracking-[0.16em] text-muted group-hover:text-heat">
        Jump to this step →
      </span>
    </a>
  );
}
