# HW_HARNESS.md
## Human Weather — Build Harness & Knowledgebase
`HARNESS/01 · SINGLE SOURCE OF TRUTH · CURSOR-REFERENCED`

This file lives in the repo root. Every Cursor prompt should reference it: *"Follow HW_HARNESS.md."* It is the constitution of the build. When code and harness conflict, the harness wins.

---

## 6. VOICE ENGINE (Kokoro — perpetual, offline, owned)

- Library: kokoro-js, PINNED @1.2.1. Model: onnx-community/Kokoro-82M-v1.0-ONNX, dtype "q8" (~86MB), device "wasm".
- Lazy-load on first Listen tap, NEVER on page open. Honest loading copy ("Preparing the voice — one-time download").
- Config:
```javascript
const KIKI_VOICES = {
  joan:   { id: "af_heart",   speed: 0.88 },
  daniel: { id: "am_michael", speed: 0.90 },
  grace:  { id: "af_nicole",  speed: 0.85 },
  peter:  { id: "bm_george",  speed: 0.92 }
};
```
- Playback: sentence-chunked — generate sentence n+1 while n plays. iOS: audio MUST start from a user tap.

*(Full harness — see project docs. Section 6 is authoritative for voice work.)*
