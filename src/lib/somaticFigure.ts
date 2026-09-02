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
    image.onerror = () => reject(new Error("The prepared portrait could not be opened."));
    image.src = source;
  });
}

export async function generateSomaticFigure(selfie: string): Promise<string> {
  const image = await loadFigureImage(selfie);
  const width = 360;
  const height = 420;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("This browser could not draw the portrait.");

  context.drawImage(image, 0, 0, image.naturalWidth, image.naturalHeight, 0, 15, width, width);
  const source = context.getImageData(0, 0, width, height);
  const output = context.createImageData(width, height);
  const luminance = new Float32Array(width * height);
  for (let i = 0; i < width * height; i += 1) {
    const p = i * 4;
    luminance[i] = source.data[p] * 0.299 + source.data[p + 1] * 0.587 + source.data[p + 2] * 0.114;
  }

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const i = y * width + x;
      const gx = -luminance[i - width - 1] + luminance[i - width + 1]
        - 2 * luminance[i - 1] + 2 * luminance[i + 1]
        - luminance[i + width - 1] + luminance[i + width + 1];
      const gy = -luminance[i - width - 1] - 2 * luminance[i - width] - luminance[i - width + 1]
        + luminance[i + width - 1] + 2 * luminance[i + width] + luminance[i + width + 1];
      const edge = Math.min(255, Math.hypot(gx, gy) * 0.72);
      const shadow = Math.max(0, 142 - luminance[i]) * 0.42;
      const nx = (x - width / 2) / (width * 0.47);
      const ny = (y - height * 0.48) / (height * 0.48);
      const feather = Math.max(0, Math.min(1, (1.08 - (nx * nx + ny * ny)) * 4));
      const alpha = Math.min(210, (edge + shadow) * feather);
      const p = i * 4;
      output.data[p] = 76;
      output.data[p + 1] = 61;
      output.data[p + 2] = 48;
      output.data[p + 3] = alpha;
    }
  }
  context.clearRect(0, 0, width, height);
  context.putImageData(output, 0, 0);
  return canvas.toDataURL("image/png");
}
