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

## 8. TECHNICAL CONSTITUTION

- Single self-contained HTML file (index.html) + manifest.json + og.png. No build step, no framework. When this must break, break it consciously — not by accident of tooling.
- Offline-first forever. All personal data on-device (IndexedDB). Nothing personal leaves the phone.
- Existing V1 features are re-homed, not rebuilt: Somatic Field grid, calibrated breath, Aura & Tones, Circadian/solar (now the liturgy's clock), Shinrin-Yoku, The Tender.
- Future satellite layer (ephemeral shared sky, 24h TTL via Cloudflare Worker) is PHASE-LATER. Not in this build.
- Monetization: reverse trial → $7/mo or $60/yr (LemonSqueezy). Never upsell mid-office, mid-Sanctuary, or mid-prescription.

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

Estimated credit burn: $3–6 of the $20 pool. Spend limit set to $0 in Cursor billing before starting.

## 10. WHAT IS EXPLICITLY OUT OF SCOPE (do not build, do not suggest)

Streaks, badges, scores on home screen, notification nagging, social feeds, profiles, likes, the Living Weather Map, share cards, gift sessions, creator deep-links, any server dependency, any API-dependent voice, any framework migration. These wait in the phased roadmap until the Spine is lived-in.

---
*The one-line summary: three offices kept by the real sun, one Field Station always open, one Fascia quietly keeping the record, one Inheritance slowly clearing — a guide to the wiring you already own.*
