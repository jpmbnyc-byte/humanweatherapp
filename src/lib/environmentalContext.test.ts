import { describe, expect, it } from "vitest";
import {
  describeOutside,
  meetingPlaceCopy,
  provisionalEnergyWindow,
  type EnvironmentalContext,
} from "./environmentalContext";

const context: EnvironmentalContext = {
  temperature: 67,
  apparentTemperature: 66,
  humidity: 62,
  cloudCover: 90,
  precipitation: 0,
  pressure: 1012,
  windSpeed: 4,
  weatherCode: 3,
  isDay: true,
  latitude: 40.7,
  longitude: -74,
  observedAt: "2026-08-18T12:00",
  expiresAt: "2026-08-18T12:15",
};

describe("environmental context language", () => {
  it("describes observable conditions without causal claims", () => {
    expect(describeOutside(context)).toBe("Temperate air, overcast sky, still air.");
    expect(meetingPlaceCopy("indoor", context, "Pressure")).toContain(
      "Inside, you marked pressure.",
    );
  });

  it("anchors a provisional window to local solar noon", () => {
    const window = provisionalEnergyWindow(
      { date: "2026-08-18", sunrise: 6, noon: 13, sunset: 20, dark: 21 },
      context,
      new Date(2026, 7, 18, 9),
    );
    expect(window.start.getHours()).toBe(12);
    expect(window.start.getMinutes()).toBe(30);
    expect(window.end.getHours()).toBe(14);
  });
});
