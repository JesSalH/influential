# INFLUENTIAL LABS

AI influencer studio. Create hyper-real presenters, generate finished video from a prompt, direct performance in a document, and ship the same face in 175+ languages.

Live prototype (needs a Grok login): [swift-orbit-giant-river.grok.me](https://swift-orbit-giant-river.grok.me/)

Design screenshots (no login): [`docs/preview/`](docs/preview/)

## Product

Four pillars:

1. **AI Avatar Generator** — Character-locked avatars. Same face, micro-expressions, and presence across angles, runtimes, and languages.
2. **Video Agent** — Prompt to a share-ready cut (avatar + B-roll + type). Then edit without starting over.
3. **AI Studio** — Script-first editor: Voice Director, Voice Mirroring, Gesture Control, Brand Kit, captions, multiplayer.
4. **Video Translation** — Clone the voice, lock the lips, localize without a reshoot.

This repo is an **editorial landing** (prototype). No payments, no auth. Briefs from `/start` stay in `localStorage`.

## Stack

- Node + TypeScript, TanStack Start, Tailwind v4
- Design: Vol.01 — brutalist magazine (Syne + Outfit, black / cream / red)

## Local

Needs Node LTS.

```bash
git clone https://github.com/JesSalH/influential.git
cd influential
npm install
npm run dev
```

Open the URL Vite prints (usually port 8080 in this workspace).

```bash
npm run typecheck
npm run build
```

## Git

`main` is the source of truth. Branches for experiments. grok.me is published from this workspace when we say so — it is not auto-deployed from GitHub.

## License

Private prototype unless the owner says otherwise.
