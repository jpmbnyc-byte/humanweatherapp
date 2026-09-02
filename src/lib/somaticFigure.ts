export type StandardFigure = "woman" | "man";

export type SomaticFigurePreference = {
  kind: "standard";
  standard: StandardFigure;
};

export const SOMATIC_FIGURE_KEY = "human-weather:somatic-figure:v3";

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
