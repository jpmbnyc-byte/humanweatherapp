/**
 * Deal-profile thumbnails.
 *
 * Primary: same-origin `/cars/*.jpg` (bundled in public/) — always consistent.
 * Optional: Gemini image upgrade only when explicitly requested (Refresh),
 * so async generation never blanks or flickers the picker on load.
 */
import { PRESET_CARS, type PresetCar } from "@/data/preset-cars";

export type ImageSource = "local" | "gemini";

export interface PresetImageResult {
  src: string;
  source: ImageSource;
}

const memoryCache = new Map<string, PresetImageResult>();

function imageModel(): string {
  return (
    (import.meta.env.VITE_GEMINI_IMAGE_MODEL as string | undefined) ||
    "gemini-2.5-flash-image"
  );
}

function local(preset: PresetCar): PresetImageResult {
  return { src: preset.fallbackImageUrl, source: "local" };
}

/** Warm the browser cache for local thumbnails so cards paint together. */
export function preloadLocalPresetImages(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  return Promise.all(
    PRESET_CARS.map(
      (preset) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => resolve();
          img.src = preset.fallbackImageUrl;
        }),
    ),
  ).then(() => undefined);
}

async function callGeminiImage(preset: PresetCar): Promise<string | null> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
  if (!apiKey) return null;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${imageModel()}:generateContent?key=${apiKey}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: [
                  "Generate a single thumbnail image for a dealer-controller preview.",
                  preset.imagePrompt,
                  "Square-friendly crop, lot photography, institutional and calm — not an ad, not a brochure hero.",
                ].join(" "),
              },
            ],
          },
        ],
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"],
          temperature: 0.4,
        },
      }),
    });
    if (!res.ok) return null;

    const data = (await res.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{
            inlineData?: { mimeType?: string; data?: string };
            inline_data?: { mime_type?: string; data?: string };
          }>;
        };
      }>;
    };

    const parts = data.candidates?.[0]?.content?.parts ?? [];
    for (const part of parts) {
      const camel = part.inlineData;
      const snake = part.inline_data;
      const mime = camel?.mimeType ?? snake?.mime_type;
      const b64 = camel?.data ?? snake?.data;
      if (mime?.startsWith("image/") && b64) {
        return `data:${mime};base64,${b64}`;
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Resolve thumbnail. Default = local asset (instant, consistent).
 * Pass forceRefresh to attempt a Gemini upgrade when keyed.
 */
export async function resolvePresetImage(
  preset: PresetCar,
  opts?: { forceRefresh?: boolean },
): Promise<PresetImageResult> {
  if (!opts?.forceRefresh) {
    const localResult = local(preset);
    memoryCache.set(preset.id, localResult);
    return localResult;
  }

  const sessionKey = `tc-preset-img:${preset.id}`;
  if (typeof sessionStorage !== "undefined") {
    try {
      const raw = sessionStorage.getItem(sessionKey);
      if (raw) {
        const parsed = JSON.parse(raw) as PresetImageResult;
        if (parsed?.src?.startsWith("data:image/")) {
          memoryCache.set(preset.id, parsed);
          return parsed;
        }
      }
    } catch {
      /* ignore */
    }
  }

  const generated = await callGeminiImage(preset);
  const result: PresetImageResult = generated
    ? { src: generated, source: "gemini" }
    : local(preset);

  memoryCache.set(preset.id, result);
  if (typeof sessionStorage !== "undefined" && result.source === "gemini") {
    try {
      sessionStorage.setItem(sessionKey, JSON.stringify(result));
    } catch {
      /* quota */
    }
  }
  return result;
}

/** Seed local images for all presets (no network to Unsplash / Gemini). */
export async function prefetchAllPresetImages(): Promise<
  Map<string, PresetImageResult>
> {
  await preloadLocalPresetImages();
  const entries = PRESET_CARS.map((preset) => {
    const result = local(preset);
    memoryCache.set(preset.id, result);
    return [preset.id, result] as const;
  });
  return new Map(entries);
}

export function curatedImageForPreset(preset: PresetCar): PresetImageResult {
  return local(preset);
}
