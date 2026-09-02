export type StandardFigure = "woman" | "man";

export type SomaticFigurePreference = {
  kind: "standard" | "likeness";
  standard: StandardFigure;
  portrait?: string;
};

export const SOMATIC_FIGURE_KEY = "human-weather:somatic-figure:v2";

export const DEFAULT_SOMATIC_FIGURE: SomaticFigurePreference = {
  kind: "standard",
  standard: "woman",
};

export function readSomaticFigure(): SomaticFigurePreference {
  if (typeof window === "undefined") return DEFAULT_SOMATIC_FIGURE;
  try {
    const raw = window.localStorage.getItem(SOMATIC_FIGURE_KEY);
    if (!raw) return DEFAULT_SOMATIC_FIGURE;
    const value = JSON.parse(raw) as Partial<SomaticFigurePreference>;
    if (value.kind === "likeness" && typeof value.portrait === "string") {
      return {
        kind: "likeness",
        standard: value.standard === "man" ? "man" : "woman",
        portrait: value.portrait,
      };
    }
    return {
      kind: "standard",
      standard: value.standard === "man" ? "man" : "woman",
    };
  } catch {
    return DEFAULT_SOMATIC_FIGURE;
  }
}

export function saveSomaticFigure(value: SomaticFigurePreference) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SOMATIC_FIGURE_KEY, JSON.stringify(value));
}

export async function makeSomaticPortrait(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Choose a photo to continue.");
  if (file.size > 15 * 1024 * 1024) throw new Error("Choose a photo smaller than 15 MB.");

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const src = URL.createObjectURL(file);
    const element = new Image();
    element.onload = () => {
      URL.revokeObjectURL(src);
      resolve(element);
    };
    element.onerror = () => {
      URL.revokeObjectURL(src);
      reject(new Error("That photo could not be opened."));
    };
    element.src = src;
  });

  const size = 360;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) throw new Error("This browser could not prepare the photo.");

  const sourceSize = Math.min(image.naturalWidth, image.naturalHeight);
  const sourceX = Math.max(0, (image.naturalWidth - sourceSize) / 2);
  // Selfies usually place the eyes slightly above center; retain hair and beard together.
  const sourceY = Math.max(
    0,
    Math.min(image.naturalHeight - sourceSize, (image.naturalHeight - sourceSize) * 0.36),
  );

  context.fillStyle = "#e9e1d2";
  context.fillRect(0, 0, size, size);
  context.filter = "grayscale(0.34) sepia(0.2) contrast(1.04) saturate(0.78)";
  context.drawImage(image, sourceX, sourceY, sourceSize, sourceSize, 0, 0, size, size);

  return canvas.toDataURL("image/jpeg", 0.82);
}

async function loadFigureImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("The generated figure could not be opened."));
    image.src = source;
  });
}

export async function generateSomaticFigure(selfie: string): Promise<string> {
  const response = await fetch("/api/somatic-figure", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ selfie }),
  });
  const payload = (await response.json().catch(() => ({}))) as { figure?: string; error?: string };
  if (!response.ok || !payload.figure) {
    throw new Error(payload.error || "Your figure could not be drawn just now.");
  }

  const image = await loadFigureImage(payload.figure);
  const width = 720;
  const height = 1200;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) throw new Error("This browser could not save the generated figure.");

  context.fillStyle = "#eee5d7";
  context.fillRect(0, 0, width, height);
  const sourceRatio = image.naturalWidth / image.naturalHeight;
  const targetRatio = width / height;
  let sourceWidth = image.naturalWidth;
  let sourceHeight = image.naturalHeight;
  let sourceX = 0;
  let sourceY = 0;
  if (sourceRatio > targetRatio) {
    sourceWidth = image.naturalHeight * targetRatio;
    sourceX = (image.naturalWidth - sourceWidth) / 2;
  } else {
    sourceHeight = image.naturalWidth / targetRatio;
    sourceY = (image.naturalHeight - sourceHeight) / 2;
  }
  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    width,
    height,
  );
  return canvas.toDataURL("image/jpeg", 0.82);
}
