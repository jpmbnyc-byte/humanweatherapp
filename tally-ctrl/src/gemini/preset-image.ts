/**
 * Gemini-curated thumbnails for VIN deal profiles.
 *
 * When VITE_GEMINI_API_KEY is set, ask an image-capable Gemini model for a
 * photorealistic mid-market unit matching year/make/model. Falls back to the
 * curated Unsplash URL on the preset when the key is missing or the call fails.
 */
import { PRESET_CARS, type PresetCar } from "@/data/preset-cars";

export type ImageSource = "gemini" | "curated";

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

function curated(preset: PresetCar): PresetImageResult {
  return { src: preset.fallbackImageUrl, source: "curated" };
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

/** Resolve a thumbnail — curated immediately; Gemini upgrades when keyed. */
export async function resolvePresetImage(
  preset: PresetCar,
  opts?: { forceRefresh?: boolean },
): Promise<PresetImageResult> {
  if (!opts?.forceRefresh && memoryCache.has(preset.id)) {
    return memoryCache.get(preset.id)!;
  }

  // Prefer session cache so refresh within the visit stays free.
  const sessionKey = `tc-preset-img:${preset.id}`;
  if (!opts?.forceRefresh && typeof sessionStorage !== "undefined") {
    try {
      const raw = sessionStorage.getItem(sessionKey);
      if (raw) {
        const parsed = JSON.parse(raw) as PresetImageResult;
        if (parsed?.src) {
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
    : curated(preset);

  memoryCache.set(preset.id, result);
  if (typeof sessionStorage !== "undefined" && result.source === "gemini") {
    try {
      // Cap session storage — data URLs are large; skip if quota fails.
      sessionStorage.setItem(sessionKey, JSON.stringify(result));
    } catch {
      /* quota — memory cache still holds it for this session */
    }
  }
  return result;
}

export async function prefetchAllPresetImages(): Promise<
  Map<string, PresetImageResult>
> {
  const entries = await Promise.all(
    PRESET_CARS.map(async (preset) => {
      // Seed curated first so UI can paint, then upgrade.
      if (!memoryCache.has(preset.id)) {
        memoryCache.set(preset.id, curated(preset));
      }
      const result = await resolvePresetImage(preset);
      return [preset.id, result] as const;
    }),
  );
  return new Map(entries);
}

export function curatedImageForPreset(preset: PresetCar): PresetImageResult {
  return curated(preset);
}
