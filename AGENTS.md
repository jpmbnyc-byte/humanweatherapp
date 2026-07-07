<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Founding canon & doctrine

- `HW_HARNESS.md` (repo root) — the build constitution / single source of truth (design, vocabulary, architecture, monetization, literary canon). When code and harness conflict, the harness wins.
- `docs/founding/human-weather-founding-document.md` — the founding thesis **"On Bliss"** (Vol. I): bliss as biochemical inheritance, the four molecules, cross-species joy, the six/seven sensory gates, the daily architecture. This is the doctrinal source behind the app's purpose (harness §1 thesis; §12.4 maps *On Bliss* ↔ **THE INHERITANCE**). Treat as canon/data — quote, don't paraphrase.

## Design language — "warm darkness" (HW_HARNESS.md)

`HW_HARNESS.md` (repo root) is the design + build source of truth. When code and
harness conflict, the harness wins. The visual signature is **warm darkness — dusk,
candlelight, cathedral stone; a barometer built by monks** — never a cool-blue /
Headspace-style meditation app. Core rules for any UI work:

- **Palette (§7.2):** ground = warm near-black brown (`--hw-ground #14100E`, deep
  `#0C0A08`, raised `#1D1713`); text = warm cream (`--hw-cream #EFE6D8`, dim
  `#B8AE9E`); accent = candle/sunrise gold (`--hw-gold #C9A96A`) used **sparingly,
  at most once per screen**. Atmosphere washes are radial, low-opacity, behind
  content. These live as `--hw-*` CSS custom properties in `src/styles.css`;
  `--color-gold` maps to the gold so `text-gold`/`border-gold` utilities resolve.
- **Typography (§7.2):** three-font discipline — **Cormorant Garamond** for Names /
  questions / body / tender lines, **IBM Plex Mono** for designation lines,
  Conditions data, timestamps (uppercase, letter-spaced). Loaded via `<link>` in
  `src/routes/__root.tsx`.
- **Vocabulary (§2):** use **Conditions / Current Conditions** (never "reading",
  "report", "analysis"), **Observation** (not "check-in"), **Prescription** (not
  "recommendation"), **keep a stone** (not "save"). This applies to visible copy
  and comments, not internal identifiers/logic.
- **Design laws (§7.0):** one thing on screen at a time; motion at breath-pace
  (4–6s, `--hw-exhale`), dissolve not slide; near-square 2px radii (`--hw-radius`);
  every element must pass the pulse test (does it lower or raise the reader's pulse?).
- **Reference touchstones (§7.6):** aim for analog barometers / Braun instrumentation
  / surveyor's log sheets / candlelit stone / single-column manuscripts. **Anti-references
  (never resemble):** app-store wellness gradients (purple-teal glows), dashboard SaaS
  chrome (drop-shadow cards, pill badges), gamified fitness UI (rings/confetti/streaks),
  glassmorphism. When a screen drifts toward these, "return to the barometer."
- **Process (§7, adapted from the Calm-redesign case study,
  https://www.rachel-quan.com/work/calm-app):** clone existing screens to learn
  their bones → position visually against competitors → consolidate one style tile
  → build atomically (atoms → molecules → organisms) → redesign a small named set
  of screens against explicit heuristics (match-to-real-world, user control,
  aesthetic-minimalist). Follow the §9 build sequence (vocab sweep → style tile →
  atomic pass → …) rather than whole-file rewrites.
- **Offline-font doctrine caveat (§11.2):** the harness's single-HTML target forbids
  loading fonts from Google Fonts at runtime (must self-host/embed woff2). The current
  React app instead loads Cormorant + IBM Plex Mono via a Google Fonts `<link>` in
  `src/routes/__root.tsx` — acceptable for the framework app, but must be switched to
  bundled/self-hosted fonts if/when the offline single-HTML build (§8) is pursued.

Note: the app shell (`src/App.tsx`) currently uses the warm-darkness palette, but
the interactive sub-panels (`SomaticGrid`, `BreathworkOrb`, `FrequencyTherapy`,
`LightTherapy`, `ClassicalMusic`, `ShinrinYoku`, `SolarRay`, `TheTender`) still
carry their own light **day-mode** palettes — night mode is fully on-theme, day
mode is the pending follow-up.

## Cursor Cloud specific instructions

- **Stack**: TanStack Start + React 19 + Vite 8, styled with Tailwind v4. Package manager is **Bun** (`bun.lock`); the startup update script runs `bun install`.
- **Run/build/lint** commands live in `package.json`: `bun run dev` (dev server), `bun run build`, `bun run lint`, `bun run format`.
- **Dev server** (`bun run dev`) binds to `http://localhost:8080` (port/host set by `@lovable.dev/vite-tanstack-config`, not the Vite default 5173).
- **Lint** (`bun run lint`) currently reports many pre-existing `prettier/prettier` formatting errors in committed source. This is the repo's baseline, not an environment problem; `bun run format` would rewrite files, so don't run it unless you intend to reformat.
- **Optional TTS**: the `/api/tts` route (the "The Tender" tab audio) requires the `LOVABLE_API_KEY` env var and calls `https://ai.gateway.lovable.dev`. Everything else in the app works without it.
- `src/routeTree.gen.ts` is auto-generated by the TanStack router plugin — don't hand-edit it.
