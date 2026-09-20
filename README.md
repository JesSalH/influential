# INFLUENTIAL LABS

AI influencer studio. Hyper-real presenters, prompt-to-video, a script-first studio, and the same face in 175+ languages.

- Site: [influentiallabs.studio](https://influentiallabs.studio)
- Studio (self-serve): [video.influentiallabs.studio](https://video.influentiallabs.studio)

This repo is the **editorial landing** (agency). No payments, no auth. `/start` briefs go to the studio inbox via a server env var (`CONTACT_EMAIL`), not into the GitHub tree.

## Product

1. **AI Avatar Generator** — Character-locked avatars. Same face, micro-expressions, and presence across angles, runtimes, and languages.
2. **Video Agent** — Prompt to a share-ready cut (avatar + B-roll + type). Then edit without starting over.
3. **AI Studio** — Script-first editor: Voice Director, Voice Mirroring, Gesture Control, Brand Kit, captions, multiplayer. Self-serve lives at `video.influentiallabs.studio`.
4. **Video Translation** — Clone the voice, lock the lips, localize without a reshoot.

## Stack

- Node + TypeScript, TanStack Start, Vite 8, Tailwind v4
- Design: Vol.01 — brutalist magazine (Syne + Outfit, black / cream / red)

## Local

Needs **Node LTS** (18+). Vite is the local dev server; it is not the public host.

```bash
git clone https://github.com/JesSalH/influential.git
cd influential
npm install
npm run dev
```

Open **http://localhost:8080**

Leave that terminal open. First boot prints `bundling dependencies...` and can sit there a minute (especially on Windows). The server is already up — open the browser anyway.

### Windows (PowerShell)

If `npm` dies with _running scripts is disabled_:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

Or skip the policy and use the cmd shim:

```powershell
npm.cmd install
npm.cmd run dev
```

If `spawn vite ENOENT` appears, you are on an old clone. `git pull` — `scripts/with-app-env.mjs` now resolves `vite.cmd`. Workaround without pulling:

```powershell
npx vite dev --host 0.0.0.0 --port 8080
```

If the optimizer seems stuck:

```powershell
Remove-Item -Recurse -Force node_modules\.vite -ErrorAction SilentlyContinue
npm run dev
```

### Contact form in local

Copy `.env.example` to `.env` and set the inbox. Without it, the landing still runs; `/start` cannot send mail.

```
CONTACT_EMAIL=you@example.com
```

Do not commit `.env`.

### Checks

```bash
npm run typecheck
npm run build
```

## Git

`main` is the source of truth. Branches for experiments. [influentiallabs.studio](https://influentiallabs.studio) is published from the Grok workspace when we say so — it is not auto-deployed from GitHub.

## License

Public prototype.
