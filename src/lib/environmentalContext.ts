import { idbGetJson, idbSetJson } from "./idb";
import type { CachedDailyMarks } from "./dailyMarks";

const CACHE_KEY = "hw.environment.current";
const CACHE_MS = 15 * 60 * 1000;

export type PracticeSetting = "indoor" | "outdoor" | "waterside";

export type EnvironmentalContext = {
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  cloudCover: number;
  precipitation: number;
  pressure: number;
  windSpeed: number;
  weatherCode: number;
  isDay: boolean;
  latitude: number;
  longitude: number;
  observedAt: string;
  expiresAt: string;
};

type OpenMeteoCurrent = {
  temperature_2m: number;
  apparent_temperature: number;
  relative_humidity_2m: number;
  cloud_cover: number;
  precipitation: number;
  surface_pressure: number;
  wind_speed_10m: number;
  weather_code: number;
  is_day: number;
  time: string;
};

type OpenMeteoResponse = {
  latitude: number;
  longitude: number;
  current: OpenMeteoCurrent;
};

function closeEnough(a: number, b: number): boolean {
  return Math.abs(a - b) < 0.05;
}

export async function getEnvironmentalContext(
  latitude: number,
  longitude: number,
): Promise<{ context: EnvironmentalContext; stale: boolean }> {
  const cached = await idbGetJson<EnvironmentalContext>(CACHE_KEY);
  const matches =
    cached && closeEnough(cached.latitude, latitude) && closeEnough(cached.longitude, longitude);
  if (matches && Date.parse(cached.expiresAt) > Date.now()) {
    return { context: cached, stale: false };
  }

  const params = new URLSearchParams({
    latitude: latitude.toFixed(4),
    longitude: longitude.toFixed(4),
    current: [
      "temperature_2m",
      "apparent_temperature",
      "relative_humidity_2m",
      "cloud_cover",
      "precipitation",
      "surface_pressure",
      "wind_speed_10m",
      "weather_code",
      "is_day",
    ].join(","),
    temperature_unit: "fahrenheit",
    wind_speed_unit: "mph",
    precipitation_unit: "inch",
    timezone: "auto",
  });

  try {
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
    if (!response.ok) throw new Error(`Weather request failed: ${response.status}`);
    const data = (await response.json()) as OpenMeteoResponse;
    const current = data.current;
    const context: EnvironmentalContext = {
      temperature: current.temperature_2m,
      apparentTemperature: current.apparent_temperature,
      humidity: current.relative_humidity_2m,
      cloudCover: current.cloud_cover,
      precipitation: current.precipitation,
      pressure: current.surface_pressure,
      windSpeed: current.wind_speed_10m,
      weatherCode: current.weather_code,
      isDay: current.is_day === 1,
      latitude,
      longitude,
      observedAt: current.time || new Date().toISOString(),
      expiresAt: new Date(Date.now() + CACHE_MS).toISOString(),
    };
    await idbSetJson(CACHE_KEY, context);
    return { context, stale: false };
  } catch (error) {
    if (matches) return { context: cached, stale: true };
    throw error;
  }
}

export function describeOutside(context: EnvironmentalContext): string {
  const sky =
    context.cloudCover >= 80 ? "overcast" : context.cloudCover >= 45 ? "filtered" : "open";
  const air =
    context.apparentTemperature <= 45
      ? "cold"
      : context.apparentTemperature >= 82
        ? "warm"
        : "temperate";
  const movement =
    context.windSpeed >= 18 ? "strong wind" : context.windSpeed >= 8 ? "moving air" : "still air";
  const rain = context.precipitation > 0.01 ? " Rain is present." : "";
  return `${air[0].toUpperCase()}${air.slice(1)} air, ${sky} sky, ${movement}.${rain}`;
}

function decimalToDate(hours: number, now: Date): Date {
  const result = new Date(now);
  result.setHours(Math.floor(hours), Math.round((hours % 1) * 60), 0, 0);
  return result;
}

export function provisionalEnergyWindow(
  marks: CachedDailyMarks,
  context: EnvironmentalContext,
  now: Date = new Date(),
): { start: Date; end: Date; note: string } {
  // Solar noon anchors the first estimate. Weather changes how the opportunity is
  // described, not the user's biology; personal observations can replace this later.
  const startOffset = context.cloudCover >= 80 ? -0.5 : -0.75;
  const endOffset = context.cloudCover >= 80 ? 1 : 0.75;
  const start = decimalToDate(Math.max(marks.sunrise, marks.noon + startOffset), now);
  const end = decimalToDate(Math.min(marks.sunset, marks.noon + endOffset), now);
  const note =
    context.cloudCover >= 80
      ? "Cloud cover softens the available daylight, so this first estimate stays close to solar noon."
      : "Available daylight is strongest around the local solar center.";
  return { start, end, note };
}

export function meetingPlaceCopy(
  setting: PracticeSetting,
  context: EnvironmentalContext,
  interiorTitle: string,
): string {
  const settingLine =
    setting === "waterside"
      ? "If the waterside feels accessible and safe, let natural sound remain part of the practice."
      : setting === "outdoor"
        ? "A brief outdoor practice can meet the available light and air directly."
        : "An indoor practice can begin without asking the environment to be different.";
  const weatherLine =
    context.precipitation > 0.01 || context.windSpeed >= 18
      ? "Conditions favor shelter and a shorter arrival."
      : context.cloudCover >= 80
        ? "The light is muted; begin gently and reassess near the solar center."
        : "The available light supports an unhurried arrival.";
  return `Inside, you marked ${interiorTitle.toLowerCase()}. ${weatherLine} ${settingLine}`;
}
