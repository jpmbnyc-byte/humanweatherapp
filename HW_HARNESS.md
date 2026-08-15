# HW_HARNESS.md
## Human Weather — Build Harness & Knowledgebase
`HARNESS/01 · SINGLE SOURCE OF TRUTH · CURSOR-REFERENCED`

This file lives in the repo root. Every Cursor prompt should reference it: *"Follow HW_HARNESS.md."* It is the constitution of the build. When code and harness conflict, the harness wins.

---

## 1. THESIS (never violated, never diluted)

- Bliss is inheritance, not achievement. The app does not produce bliss; it clears the weather that obscures it.
- Presence never leaves — it gets occluded. The daily check names what stands between the user and a Presence that hasn't moved.
- Weather = state (today). Climate = trait (the trajectory). The product maps weather to eventually determine climate.
- Tagline: **"A guide to the wiring you already own."** The word *already* is load-bearing in all variants.
- Operating logic: procession over performance. No parade mechanics, ever.

## 2. VOCABULARY (enforced in all copy and code comments)

| Use | Never use |
|---|---|
| **Conditions / Current Conditions** (the output of every grid mapping — purely atmospheric, no interpreter implied) | reading, report, insight, analysis, assessment |
| Conditions header carries the clinical data line ("Current Conditions: sympathetic activation · coherence 74%") | mood score, results |
| Observation (a filed check-in) | check-in, log entry, session data |
| Prescription (routed response) | recommendation, suggestion |
| Keep a stone | save, bookmark, journal |
| Clearing / occlusion / low pressure | anxiety-speak, diagnosis language |

Forecast is used ONLY after the data privilege unlocks (30/90-day observations). Never predictive on day one.

## 3. NAMING SYSTEM (canon)

Pattern: **Cormorant carries the Name (definite article + one weighted noun). Plex Mono carries the Designation line.**

- **THE DIURNAL SPINE** — `SPINE/24 · SOLAR-KEPT · THREE OFFICES` — the daily system
- **THE VAULT** — `OBS/01 · SUNRISE · THORACIC OPENING` — morning office
- **THE MERIDIAN** — `OBS/02 · SOLAR NOON · STANDING COLUMN` — midday office
- **THE MARROW** — `OBS/03 · SUNSET · DEEP INTERIOR` — evening office
- **THE FIELD STATION** — `HW/01 · FIELD INSTRUMENT · NERVOUS SYSTEM` — on-demand core loop
- **THE FASCIA** — `REC/01 · CONNECTIVE RECORD` — the log (connective tissue stores somatic history)
- **THE INHERITANCE** — `CLIMATE/BASELINE · LONGITUDINAL` — the bliss/climate metric
- Retained from V1: **The Tender**, **The Somatic Field**, **The Sanctuary**, Aura & Tones, Shinrin-Yoku

## 4. THE TRIPLE REGISTER (beneath every Conditions header, three lines speak in fixed order)

Structure: **Plex Mono Conditions header first** ("CURRENT CONDITIONS: SYMPATHETIC ACTIVATION · COHERENCE 74%"), then the three registers beneath it:

1. **Felt** (communicative): "There's static in your chest that wants movement."
2. **Fact** (clinical/neuroscientific): "Your mapping suggests sympathetic activation — this breath pattern targets vagal tone."
3. **Faith** (spiritual): "Be still; the weather is passing through you, not staying."

Integrity rule: registers stay adjacent, never fused. No spiritual claims in clinical clothing, no clinical claims in spiritual clothing. No medical claims anywhere.

## 5. ARCHITECTURE — THE TWO MODES

**THE DIURNAL SPINE (solar-timed, via existing Jean Meeus solar code):**
- THE VAULT (local sunrise, ~60s): question → Somatic Field grid touch → Conditions header + spoken triple register → 3 calibrated breath cycles → one daily passage (voice-read) → release. No summary, no score. Observation filed silently.
- THE MERIDIAN (solar noon, <30s): one spoken line → one breath cycle → solar ray moment (sun position + light invitation). Brevity is the keeping-rate.
- THE MARROW (local sunset, 2–3 min): question past-tense → evening grid touch → day's sky compared aloud (Vault vs. Marrow conditions) → Aura & Tones wind-down → optional "keep a stone."
- Missed offices = unfiled observations. NO streaks, NO guilt, NO scolding. Notifications off by default; when on, phrased as fact ("The sun is rising over Bayonne."), one per office max.

**THE FIELD STATION (on-demand, the V1 core loop unchanged):**
Question → grid → Conditions (header + spoken triple register) → prescription routing:
- Sympathetic overload / gray static → Shinrin-Yoku (GPS to canopy, voice-guided stages, sensory checklist)
- Scattered / low coherence → extended calibrated breathwork
- Heavy / low pressure → Aura & Tones immersion
- Restless / spiritual fog → The Tender (longer voice-read passage)
- Clear sky → prescribe NOTHING: "Your sky is clear. Go live under it."

**THE RECORD:**
- THE FASCIA: every observation, on-device (IndexedDB), private, beautiful.
- THE INHERITANCE: composite of (a) coherence attained, (b) recovery velocity (Vault→Marrow clearing), (c) clear-sky frequency. Rendered ONLY inside The Fascia as a slow seasonal line. NEVER on the home screen. NEVER a performable score.
- Forecast privilege: unlocked by observation count (30/90 days), not by payment tier.

## 6. VOICE ENGINE (Kokoro — perpetual, offline, owned)

**Authoritative references (Cursor should fetch and cross-check against these, then PIN whatever version is current):**
- Library: https://github.com/hexgrad/kokoro — kokoro-js README is the authority on the current API surface
- Model weights: https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX — the exact files the app loads
- Rule: the links are for building; the pinned version + private archive (per §11) are for perpetuity.

- Library: kokoro-js, PINNED version (e.g. @1.2.1 — verify current stable, then freeze). Model: onnx-community/Kokoro-82M-v1.0-ONNX, dtype "q8" (~86MB), device "wasm" (optionally upgrade to webgpu on detection).
- Lazy-load on first Listen tap, NEVER on page open. Honest loading copy ("Preparing the voice — one-time download"). Browser caches automatically; fully offline thereafter.
- Config is the entire voice system:
```javascript
const KIKI_VOICES = {
  joan:   { id: "af_heart",   speed: 0.88 },  // placeholders until casting —
  daniel: { id: "am_michael", speed: 0.90 },  // real Kokoro IDs, app functions now;
  grace:  { id: "af_nicole",  speed: 0.85 },  // swap IDs after in-app audition.
  peter:  { id: "bm_george",  speed: 0.92 }   // Blends allowed: "af_nicole(2)+bf_emma(1)"
};
```
- Playback: sentence-chunked — generate sentence n+1 while n plays. iOS: audio MUST start from a user tap.
- Voice-office mapping: each office gets a familiar keeper (casting pending; config-only change).
- Perpetuity: archive kokoro-js bundle + ONNX model files in private storage. Pin everything. No APIs, no keys, no billing.

## 7. DESIGN SYSTEM
*(Method adapted from the Calm-redesign case study discipline: clone the existing screens to learn their bones, position against competitors visually, consolidate a style tile, build atomically, then redesign a small named set of screens against explicit heuristics. Applied here as HW's own system — never a copy of Calm.)*

### 7.0 Design Laws (unchanged, supreme)
- Purpose: lower the reader's pulse before a single word is read. Test for every decision: *does this lower or raise the pulse?*
- One thing on screen at a time. THE SCROLL IS DEAD — nothing is found, everything arrives (by sun or by prescription).
- Ground: dark, warm, atmospheric — dusk, not dashboard. Sensory subtraction on entering deeper rooms (screen dims in The Sanctuary/The Marrow).
- Motion at breath-pace: nothing moves faster than a calm exhale (4–6s). Transitions dissolve like fog, never slide like software.
- Instrument aesthetic: corner registration brackets, designation lines, field-instrument language — a barometer built by monks.
- No metrics visible inside offices or The Sanctuary. The app wants nothing from you in those rooms.

### 7.1 Visual Position (competitive differentiation)
The meditation category clusters around cool blues/purples (relaxation-coded) or bright playful palettes (energy-coded). HW takes the vacant position: **warm darkness** — dusk, candlelight, cathedral stone. Not cold peace; inhabited stillness. If a screen could be mistaken for Calm or Headspace, it has failed the position.

### 7.2 Style Tile — tokens (implement as CSS custom properties, the single styling source)
```css
:root {
  /* GROUND — warm darkness */
  --hw-ground:        #14100E;  /* near-black warm brown: the night field */
  --hw-ground-raise:  #1D1713;  /* raised surfaces, cards */
  --hw-ground-deep:   #0C0A08;  /* Sanctuary/Marrow dimmed state */

  /* LIGHT — the presence behind the weather */
  --hw-cream:         #EFE6D8;  /* primary text: warm cream (NPFC-adjacent, softened) */
  --hw-cream-dim:     #B8AE9E;  /* secondary text */
  --hw-gold:          #C9A96A;  /* accent: candle/sunrise gold — sparing, sacred */

  /* ATMOSPHERE — conditions tinting (background washes only, never UI chrome) */
  --hw-dawn:          #8A6E52;  /* Vault hour wash */
  --hw-noon:          #A99060;  /* Meridian wash */
  --hw-dusk:          #4A3B44;  /* Marrow wash */
  --hw-fog:           #6E6A63;  /* occluded conditions */
  --hw-clear:         #7A8B7F;  /* clear-sky conditions: muted sage, not neon green */

  /* STRUCTURE */
  --hw-line:          rgba(239,230,216,0.14);  /* hairlines, registration brackets */
  --hw-radius:        2px;      /* near-square: instrument, not bubble */
  --hw-space:         8px;      /* base unit; scale = 8/16/24/40/64 */
  --hw-measure:       34ch;     /* max text line length */

  /* MOTION — breath-pace only */
  --hw-exhale:        4800ms;   /* primary transition duration */
  --hw-settle:        1600ms;   /* micro transitions */
  --hw-ease:          cubic-bezier(0.4, 0.0, 0.2, 1);
}
```
- Type scale (rem): 0.75 (designations, Plex Mono, letter-spaced +0.08em, uppercase) · 1.0 (body, Cormorant) · 1.5 (Conditions header) · 2.25 (office Names) · 3.5 (the question, threshold screens).
- Typography (three-font discipline, permanent): **Cormorant Garamond** = Names, questions, tender lines, triple register. **IBM Plex Mono** = designation lines, Conditions data, timestamps. (Barlow is NPFC-only; never in HW.)
- Color rule: gold appears at most ONCE per screen. Atmosphere washes are radial, low-opacity, behind content — the sky behind the instrument.

### 7.3 Atomic Inventory (build in this order; every screen composes only from these)
- **Atoms:** registration bracket (corner marks), designation line, hairline rule, the question (display text), Conditions datum (mono key–value), breath dot (the pacing element), stone (small marker glyph), voice chip (keeper's name), single-action button (text + hairline, no fills)
- **Molecules:** Conditions header (designation + data line), register line (Felt/Fact/Faith with hairline separators), grid cell → **Somatic Field organism** (8×8), passage block (Cormorant + voice chip + play state), office header (Name + designation + solar time)
- **Organisms:** the Field Station loop stack, an Office sequence (screens advance themselves at breath-pace; user never taps "next"), the Fascia entry row, the Inheritance seasonal line (single hairline path, no chart chrome)
- **Templates:** Threshold (one question, one action), Office (auto-advancing sequence), Record (Fascia lists)

### 7.4 The Five Screens (the redesign set — nothing else gets designed until these are lived-in)
1. **THE THRESHOLD** (replaces "home"): near-empty. The hour's wash, the question in Cormorant 3.5rem, one action. If an office is due, the threshold IS that office's door. Quiet corner glyph → The Fascia.
2. **THE SOMATIC FIELD**: the 8×8 grid alone on the ground, brackets at corners, one instruction line. Touch trails glow in the hour's wash and fade at --hw-settle.
3. **CONDITIONS**: Plex Mono header ("CURRENT CONDITIONS: SYMPATHETIC ACTIVATION · COHERENCE 74%"), then the three register lines in Cormorant, hairline-separated, voice chip showing the speaking keeper. Prescription arrives beneath as a single action after the voice finishes.
4. **THE OFFICE SEQUENCE** (Vault/Meridian/Marrow shared template): full-bleed wash, office header, then the sequence auto-advances at breath-pace; text dissolves in/out at --hw-exhale. No progress bar — the office knows its own length.
5. **THE FASCIA**: the record as ledger — Plex Mono dates, Cormorant one-line summaries, stones as glyphs; The Inheritance line at top as a slow seasonal hairline. The only scrollable surface in the app (archives may scroll; the present never does).

### 7.5 Heuristic Guardrails (evaluate every build step against these three)
- **Match to the real world:** all iconography and language stays inside the weather/anatomy metaphor — if a symbol needs a label to be understood, redraw it; if a label needs the metaphor explained, rewrite it.
- **User control & freedom:** everything is skippable and exitable mid-sequence (one gesture out, no confirmation guilt); voice, office notifications, and keeper choice are user-settable. The liturgy invites; it never locks.
- **Aesthetic & minimalist:** every element on a screen must justify itself against the pulse test; when in doubt, remove — subtraction is the house style.

### 7.6 VISUAL REFERENCE LIBRARY (the build's design-language touchstones)
When a screen needs a decision the tokens don't answer, consult these references — each named for the specific quality it contributes. Cursor prompts may cite these by name ("treat this panel like the barometer reference").

**Instrument references (structure, chrome, data display):**
- **Analog precision barometers & marine weather stations** — a single dial, engraved scale, one needle. The Conditions header should feel like reading an instrument face: calibrated, unhurried, authoritative without decoration. No skeuomorphic dials — inherit the *discipline*, not the imagery.
- **Dieter Rams-era Braun instrumentation** — "as little design as possible": one accent, functional markings, generous negative space. Governs buttons, toggles, and settings surfaces.
- **Field notebooks / surveyor's log sheets** — ruled entries, mono stamps, corner registration marks. Governs The Fascia's ledger rows and every designation line.
- **Camera/optics engraving (aperture rings, focus scales)** — how Plex Mono metadata should sit: small, letter-spaced, etched-feeling, never shouting.

**Atmosphere references (color, light, texture):**
- **Dusk nautical twilight and candlelit stone interiors** — the ground palette's emotional target: warmth inside darkness, never cold-void black. Radial washes behave like light sources (a candle, a rising sun at screen edge), not gradients-as-decoration.
- **Long-exposure fog photography & shinrin-yoku forest light** — motion and transition reference: things emerge and dissolve, nothing slides or pops.
- **Film grain at whisper level** — a fixed ~2–3% opacity noise texture over the ground kills digital flatness and adds instrument warmth; implement once as a CSS overlay, never animated.

**Liturgical references (typography, rhythm, restraint):**
- **Single-column sacred manuscript pages (Codex Sinaiticus lineage)** — one column, wide margins, the text as the sacred object. Governs passage display in the offices: max-measure Cormorant, nothing beside it.
- **A daily office book's page economy** — fixed form, minimal ornament, content that changes daily inside an unchanging frame. This is the Threshold's and the Hours' structural reference.
- **Letterpress ordination/wedding stationery** — how gold (--hw-gold) is spent: one small moment per surface, engraved-feeling, earned.

**Anti-references (what HW must never resemble):** app-store wellness gradients (purple-teal glows), dashboard SaaS chrome (cards with drop shadows, pill badges), gamified fitness UI (rings, confetti, streaks), and glassmorphism. If a screen drifts toward any of these, return to the barometer.

**Case-study reference — Calm redesign (rachel-quan.com/work/calm-app):** studied and selectively absorbed. TAKE: the intimacy of one's own recorded voice (parked as The Fifth Keeper, §10), user-composed soundscape layering (parked as Aura & Tones mixing), and its design-system centralization discipline (already ours via §7.2–7.3). REJECT: its core direction — live sessions, shareable affirmations, community/friend-finding — which is parade machinery and the opposite of HW's position. Its deepest lesson is procedural, not visual: it tested with real users before shipping (see §7.8).

### 7.7 USER EXPERIENCE (how the app feels to move through)

**The first five minutes (first-run journey):**
1. Open → warm-dark ground breathes in (one --hw-exhale fade). No splash logo, no carousel, no permissions wall.
2. The thesis, spoken once by a KiKi voice over near-still atmosphere — sixty words ending in *"…a guide to the wiring you already own."* Text appears line-by-line at speech pace. Skippable with one tap; never shown again.
3. The question arrives: *"What is your weather right now?"* → straight into the Somatic Field. The user's first act is touch, not typing. No account, no name, no email.
4. First Conditions delivered (header + spoken triple register) → first prescription → release. Total elapsed: under three minutes, and they have already *used* the instrument.
5. Only at release does one quiet line appear: *"The station keeps the Hours, if you want them"* → optional solar-notification opt-in. Permission is requested only after value is felt, framed as fact not summons.

**The daily return (the practiced user's loop):**
- Open at dawn → the Threshold IS the Vault's door (the app knows the hour; zero navigation) → 60-second office → released into the day. The dominant feeling: *the app was waiting, not wanting.*
- Any other moment → Threshold shows the question → Field Station loop on demand.
- Total daily surface area: ~3 minutes across three offices. The UX succeeds when the app is the shortest meaningful interaction on the person's phone.

**Interaction physics (the feel rules):**
- **Touch is the primary instrument.** The grid responds within 16ms with a soft glow bloom; optional single soft haptic on first contact per session (never per-cell — no buzzing).
- **The app advances itself.** Inside offices, screens progress at breath-pace with no "Next" buttons; the user's only jobs are touch, breathe, listen. Waiting is part of the medicine.
- **One gesture out, always.** Swipe-down exits any sequence instantly, no confirmation, no guilt copy. Re-entry resumes at the sequence's start, never mid-way (a rite restarts; it doesn't buffer).
- **Sound before screen.** Wherever voice and text coexist, the voice leads by a beat and the text supports — the app is primarily *heard*; eyes-closed use is a first-class mode.
- **Nothing counts in front of you.** No visible timers, streaks, or progress bars anywhere in the present tense. Duration is felt, not displayed.

**States & edges (the station's voice in adversity):**
- *Empty Fascia:* "No observations yet. The sky is waiting." — invitation, never guilt.
- *Offline:* indistinguishable from online (this is the flex, and the UX proof of sovereignty). If model files aren't yet cached, honest copy: "Preparing the voices — one-time download, works offline forever after."
- *Errors:* stated as weather-station fact, one repair action, no apology theater: "The voice couldn't load. Try again, or read this office silently."
- *Missed offices:* silence. The Fascia simply shows no entry. Stations don't scold the weather.

**Accessibility as doctrine (not compliance):**
- The KiKi voice IS the screen-reader for core content — spoken Conditions make the app's heart natively non-visual; VoiceOver labels cover the chrome around it.
- prefers-reduced-motion: washes become static, dissolves become instant fades — the liturgy holds without the breathing screen.
- All type scales with system settings; cream-on-dark tokens maintain ≥7:1 contrast for body text; touch targets ≥44px; the grid supports drag-exploration (audio feedback per zone) for low-vision use.

**The emotional KPI (what UX success means here):** not session length, not DAU — but *exit velocity into life*. The best session ends with the phone face-down and the person breathing slower. Every UX decision is graded against one question: does this screen return the user to their body, or keep them in the glass?

### 7.8 USER TESTING PROTOCOL (the gap the case-study method exposed — build, then watch five humans)
Before public launch, run five first-run observations (friends, venue partners, one skeptic). Method: hand them the phone with the app at the Threshold, say only *"tell me what you think this is"* — then be silent and take notes.
- Watch for: where they hesitate, what they tap that isn't tappable, whether they understand the grid without instruction, whether they skip the spoken thesis, their face during the first spoken Conditions.
- Ask after (never during): "What is this app for?" · "What would bring you back tomorrow?" · "Was anything uncomfortable?"
- Pass bar: 4 of 5 complete the first loop unaided; 4 of 5 can state the purpose in their own words afterward.
- Rule: fix only what two or more testers independently hit. One person's confusion is noise; two is signal; the harness is not renegotiated per anecdote.
- Repeat the five-person pass after any Five Screens (§7.4) revision.

### 8.0 DEPLOYMENT NOTE (React / TanStack Start — production at humanweather.social)

The live app ships as TanStack Start + Vite + React. Harness modules live under `src/lib/harness/` with IndexedDB keys (`hw.*`) matching the single-file PWA spec. Debug audit route: `/debug/harness`. Do not regress entitlement, Stripe, or forming systems when extending harness tasks.

### 8.1 TECHNICAL CONSTITUTION (canonical targets)

- Single self-contained HTML file (index.html) + manifest.json + og.png. No build step, no framework. When this must break, break it consciously — not by accident of tooling.
- Offline-first forever. All personal data on-device (IndexedDB). Nothing personal leaves the phone.
- Existing V1 features are re-homed, not rebuilt: Somatic Field grid, calibrated breath, Aura & Tones, Circadian/solar (now the liturgy's clock), Shinrin-Yoku, The Tender.
- Future satellite layer (ephemeral shared sky, 24h TTL via Cloudflare Worker) is PHASE-LATER. Not in this build.
- Monetization: reverse trial → $7/mo or $60/yr (LemonSqueezy). Never upsell mid-office, mid-Sanctuary, or mid-prescription.

### 8.1 MONETIZATION BUILD SPEC (the reverse trial, mechanically)

**Trial state machine (all state in IndexedDB, key `hw-entitlement`):**
- First launch → `{ state: "trial", startedAt: <timestamp> }`. Full access, no account, no card, no countdown visible during days 1–5.
- Day 6–7 → one quiet line appears at the Threshold's foot (never inside an office): *"Your full-access week ends [day]. Keep the station: $7/mo or $60/yr."*
- Day 8+ → `state: "lapsed"`. **The graceful degradation (never a wall):** the Field Station core loop (grid → Conditions → breath) remains free forever; the Hours, KiKi voices, prescriptions suite, and The Fascia archive require membership. The free tier is a working barometer; membership is the full observatory. Lapsed screens show one line + one action, in station voice: *"This room is kept for members."* → Keep the station.
- Purchase → LemonSqueezy hosted checkout (opens in new tab; overlay JS is optional later). Products: HW Monthly $7, HW Annual $60.
- Return from checkout → success URL carries the license key → validate once via LemonSqueezy License API (`/v1/licenses/activate`) → store `{ state: "member", licenseKey, plan, validatedAt }` in IndexedDB. Offline-first preserved: re-validate silently at most every 30 days when online; never lock a member out while offline.
- Restore path in settings: "Already a member?" → paste license key → same activation call. No accounts, ever — the license key IS the identity, consistent with sovereignty doctrine.

**Attribution passthrough (closes the loop with the venue + creator campaigns):**
- Scan-landing URLs carry `?ref=[venue-or-creator-slug]` → persist ref in IndexedDB on first visit → append as LemonSqueezy checkout custom data → affiliate credit flows automatically. One mechanism serves venues, creators, and Dispatch links identically.

**Upsell surfaces (exhaustive list — nowhere else, per doctrine):**
1. Threshold foot-line, days 6–7 of trial
2. Lapsed-room lines
3. Settings → "Keep the station"
4. Dispatch emails (off-device, fair game)
Never: mid-office, mid-Sanctuary, mid-prescription, or within 60 seconds of a completed office.

### 8.2 DISPATCH INTEGRATION (the newsletter ↔ app loop)

Publication: **The Atmospheric Dispatch on Ghost** (dispatch.humanweather.social). All links UTM'd `?ref=app` or `?ref=scan`.

- **In-app surface (one, quiet):** The Fascia's foot carries a single ledger-styled line — `DISPATCH/[issue №] · [essay title]` — linking to the week's essay. Updated via one line in a tiny static JSON the app fetches when online (fails silently offline). No feeds, no badges, no red dots.
- **Scan-landing capture:** after the 60-second experience, alongside the install action, one secondary line: *"Keep the Dispatch — one letter a week on the weather inside."* → Ghost signup embed (Ghost provides a portal link/form snippet; a simple mailto-free POST to the Ghost members API endpoint or the hosted signup URL both work — use the hosted URL for zero-JS simplicity).
- **Email → app loop:** every Dispatch issue ends with the same footer block: this week's passage + *"Hear it read in the Vault"* deep-linking to the app. Welcome sequence (5 emails, per the Growth Engine doc) is built in Ghost's automation on day one.
- **The rule:** the app never nags about the newsletter; the newsletter always doors back to the app. Flow direction is inward, toward the instrument.

## 9. BUILD SEQUENCE (Cursor, budget-disciplined)

Rules: select the specific section before every prompt (never whole-file context). One change per prompt. Test in browser between prompts. Auto mode default; manual Sonnet only where marked ★.

1. Vocabulary sweep — rename all "reading" and "report" instances to Conditions per §2 (Auto)
1b. Style tile — implement §7.2 tokens as CSS custom properties; migrate all existing styles to reference tokens only (Auto)
1c. Atomic pass — build §7.3 atoms/molecules as reusable classes; restyle existing V1 elements with them, changing no logic (Auto)
2. Kokoro engine + KIKI_VOICES per §6 (Auto)
3. ★ readProse() with sentence chunking + Web Audio playback (manual model — timing logic)
4. Spoken Conditions: render the Plex Mono Conditions header, then wire the triple-register text through readProse (Auto)
5. Solar office scheduler off existing Meeus code: compute Vault/Meridian/Marrow times daily (Auto)
6. ★ THE VAULT flow (grid → Conditions → breath → passage) as single screen sequence (manual model)
7. THE MERIDIAN (Auto — smallest office)
8. THE MARROW incl. day-comparison line + Aura & Tones wind-down + keep-a-stone (Auto, or ★ if comparison logic fights)
9. FIELD STATION prescription router per §5 table (Auto)
10. THE FASCIA log views + THE INHERITANCE seasonal line (Auto)
11. Kill the scroll: navigation collapses to Spine + Station + Fascia (Auto)
11b. ★ The Five Screens pass — rebuild Threshold, Somatic Field, Conditions, Office template, and Fascia per §7.4, evaluating each against §7.5 guardrails (manual model — this is the visual signature)
12. Offline/iOS test pass per Kokoro protocol Phase 2
13. Trial state machine per §8.1 — IndexedDB entitlement, day-6 foot-line, lapsed graceful degradation (Auto)
14. ★ LemonSqueezy checkout + license activation/restore flow + ref-attribution passthrough (manual model — payment paths deserve the stronger reviewer)
15. Dispatch integration per §8.2 — Fascia foot-line via static JSON, scan-page Ghost signup, deep-link handling from email (Auto)
16. Full revenue-path test: fresh install → trial → day-8 lapse (clock-spoofed) → checkout sandbox → activation → offline relaunch as member. Nothing ships until this path passes end-to-end.

Estimated credit burn: $3–6 of the $20 pool. Spend limit set to $0 in Cursor billing before starting.

## 10. WHAT IS EXPLICITLY OUT OF SCOPE (do not build, do not suggest)

Streaks, badges, scores on home screen, notification nagging, social feeds, profiles, likes, the Living Weather Map, share cards, gift sessions, creator deep-links, any server dependency, any API-dependent voice, any framework migration. These wait in the phased roadmap until the Spine is lived-in.

**PARKED — sanctioned for later, still not now (doctrine-compatible ideas absorbed from references):**
- **The Fifth Keeper** — the user records their own voice reading a passage (MediaRecorder API, stored on-device only, never shared). Joan, Daniel, Grace, Peter… and you. The deepest possible expression of "the wiring you already own" — your own voice returned to you as keeper. Earliest home: Phase 2, inside The Marrow.
- **Aura & Tones mixing** — user-composed ambient layers (tone + frequency + rain) saved as personal presets. Enhancement of an existing chamber, not a new surface.
- **Ephemeral presence** — the quiet "31 others are in fog with you" line + 24-hour dissolving sky. Requires the satellite Worker; waits for Phase 4 density.
Parked means: written down, named, and untouched — Cursor must not scaffold, stub, or "prepare" for these.

## 11. EXTERNAL REFERENCES & REQUIRED INPUTS (everything the harness cannot supply itself)

### 11.1 Authoritative docs (Cursor may fetch; always pin what's current)
- Kokoro library + model: see §6 links
- LemonSqueezy: https://docs.lemonsqueezy.com — specifically Checkout links (custom data for ref-attribution) and the License API (activate/validate endpoints for §8.1)
- Ghost members/signup: https://ghost.org/docs — Portal signup links + members docs for the §8.2 scan-page capture
- CDN for pinned imports: https://cdn.jsdelivr.net (kokoro-js ESM)

### 11.2 FONTS — OFFLINE DOCTRINE APPLIES (easy to miss, breaks §8 if missed)
Cormorant Garamond and IBM Plex Mono must NOT load from Google Fonts at runtime — an offline-first app cannot depend on a font CDN. Build step: download both families (only the weights actually used: Cormorant 400/500/600 + italic, Plex Mono 400/500), subset to latin, convert to woff2, and either (a) base64-embed in the single HTML file (~150–300KB total, acceptable) or (b) cache-first via the service worker. Verify in airplane mode: if the type falls back to system fonts offline, the build fails the sovereignty test. Both families are SIL Open Font License — bundling is fully permitted; keep copies in the archive.

### 11.3 CONFIG CHECKLIST (JP supplies before steps 13–15)
- [ ] LemonSqueezy: store ID, product/variant IDs for HW Monthly $7 + HW Annual $60, API key (License API)
- [ ] Ghost: publication URL (dispatch.humanweather.social) + hosted signup URL
- [ ] Dispatch foot-line JSON: hosted path for the one-line issue pointer (any static host)
- [ ] Final KIKI_VOICES casting IDs (placeholders valid until then)
- [ ] humanweather.social scan-page slugs for venue/creator refs

### 11.4 CONTENT LIBRARY DEPENDENCY (HW_CONTENT.md — the harness's sibling file)
The harness defines every form; HW_CONTENT.md supplies the words. Required structure:
- `thesis`: the 60-word first-launch spoken text
- `passages[]`: 30+ office passages (id, text, register-tags, season-tags) — minimum for a repeat-free month
- `conditions{}`: for every nameable weather state the grid produces → its Felt / Fact / Faith lines (§4)
- `stationLines{}`: lapsed-room lines, empty-Fascia line, error lines, Meridian one-liners
Cursor treats this file as data, never as something to author. If a build step needs copy that isn't in HW_CONTENT.md, the step pauses and the gap is flagged — Cursor does not write doctrine.

### 11.5 THE PERPETUITY ARCHIVE (do within launch week)
Private copies, stored off-platform: kokoro-js bundle at pinned version · Kokoro ONNX model files · both font families (woff2 + originals) · the deployed index.html + manifest + og.png · HW_HARNESS.md + HW_CONTENT.md. This folder is the guarantee that the app of 2036 can be rebuilt from a cold start with zero third parties surviving.

## 12. THE LITERARY CANON & CROSS-PLATFORM COPY (from the Literary Strategy, June 2026)

Human Weather is a literary brand (essays → book) and a product (app) sharing one voice. The Literary Strategy document OUTRANKS this harness on all matters of voice and tone; this section imports its binding rules so no surface drifts.

### 12.1 Canonical lines (fixed doctrine — verbatim across all platforms, never paraphrased)
- **"This desire transforms relationship, to relational."** (the anchor phrase — appears exactly as written wherever used)
- "A guide to the wiring you already own." (the product thesis line; *already* is load-bearing)
- "The song of circumstance is often meant to be heard first hand."
- "Relationship is a noun — a status. Relational is a posture — an ongoing act."
- "The book for the person who left the church but never left God." (positioning line — marketing surfaces only)
These live in HW_CONTENT.md under `canon[]`; app, Ghost, scan pages, venue cards, and social all quote from there. The Relational Proximity® framework definition is quoted only within the Relational Faith essay itself, credited, never repurposed as product copy.

### 12.2 Tone parameters (govern ALL copy — app strings included, not just essays)
- Register: philosophical but warm; theologically rooted, not denominational; accessible to secular readers without dimming the faith for believers.
- Rhythm: declarative and unhurried — short sentences that land, longer sentences that open into something. Never academic, never casual.
- FORBIDDEN: cliché faith language, intellectual performance, over-explanation, sentimentality without substance. (This applies to error messages and upsell lines as much as essays.)
- REQUIRED where the God-human relation appears: the asymmetry stays intact — the human is always the one closing the distance; the sunrise appears or is implied; silence in the questions is honored.

### 12.3 The chord principle (voice unification)
The essays move through three registers without code-switching — borrowed framework language → testimony → near-poetry — held as a chord, not a sequence. The app's triple register (Felt / Fact / Faith, §4) is the SAME chord in miniature: Fact is the borrowed framework, Felt is the testimony, Faith is the poetry. One voice, two containers. Writers (human or AI) working on either surface must honor the chord.

### 12.4 The concordance (book ↔ app — the two products name each other's parts)
- *Sunrise Protocol* (Ch. 06) ↔ **THE VAULT** — the daily architecture chapter IS the morning office's literature
- *On Bliss* (Ch. 02) ↔ **THE INHERITANCE** — the founding thesis IS the climate metric's doctrine
- *The Song of Circumstance* (Ch. 05) ↔ the Station's listening posture — circumstance as first-hand teacher
- *Human Weather / What Climate Are You Making?* (Ch. 07) ↔ the weather→climate product arc (§1)
- *The Procession* (Ch. 03) ↔ the no-parade UX doctrine (no streaks, no performance)
Dispatch essays should consciously cross-reference app vocabulary and vice versa — the reader of either should feel one world.

### 12.5 Publication reconciliation
The Literary Strategy (June 2026) names Substack as the platform play; the operating decision (July 2026) is GHOST at dispatch.humanweather.social. The strategy's function — direct list, monthly essay cadence, audience proof for publishers — is platform-agnostic and fully served by Ghost (see Dispatch Growth Engine doc). Guest-posting and cross-recommendation targets from the strategy remain valid regardless of home platform. Publication order per strategy: Relational Faith first, On Bliss second.

---
*The one-line summary: three offices kept by the real sun, one Field Station always open, one Fascia quietly keeping the record, one Inheritance slowly clearing — a guide to the wiring you already own.*
