import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_SOMATIC_FIGURE,
  readSomaticFigure,
  saveSomaticFigure,
  SOMATIC_FIGURE_KEY,
} from "./somaticFigure";

afterEach(() => vi.unstubAllGlobals());

describe("somatic figure preference", () => {
  it("uses the standard figure during server rendering", () => {
    expect(readSomaticFigure()).toEqual(DEFAULT_SOMATIC_FIGURE);
  });

  it("restores a saved likeness without changing its standard body map", () => {
    const store = new Map<string, string>([
      [
        SOMATIC_FIGURE_KEY,
        JSON.stringify({
          kind: "likeness",
          standard: "man",
          portrait: "data:image/jpeg;base64,portrait",
        }),
      ],
    ]);
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => store.set(key, value),
      },
    });

    expect(readSomaticFigure()).toEqual({
      kind: "likeness",
      standard: "man",
      portrait: "data:image/jpeg;base64,portrait",
    });
  });

  it("saves one approved default with no diagnostic metadata", () => {
    const store = new Map<string, string>();
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => store.set(key, value),
      },
    });

    saveSomaticFigure({ kind: "standard", standard: "woman" });
    expect(JSON.parse(store.get(SOMATIC_FIGURE_KEY) ?? "{}")).toEqual({
      kind: "standard",
      standard: "woman",
    });
  });
});
