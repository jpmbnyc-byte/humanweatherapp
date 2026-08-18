import React, { useEffect, useMemo, useState } from "react";
import { CloudSun, LocateFixed } from "lucide-react";
import type { WeatherState } from "../types";
import type { WhereAreWeResult } from "../lib/whereAreWe";
import { useGeo } from "../lib/GeoContext";
import {
  describeOutside,
  getEnvironmentalContext,
  meetingPlaceCopy,
  provisionalEnergyWindow,
  type EnvironmentalContext,
  type PracticeSetting,
} from "../lib/environmentalContext";

const SETTING_KEY = "hw.prefs.practice-setting";

type Props = {
  activeWeather: WeatherState;
  currentTheme: "day" | "night";
  place: WhereAreWeResult | null;
  onOpenLook: () => void;
  onOpenPractice: () => void;
};

function timeLabel(date: Date): string {
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function savedSetting(): PracticeSetting {
  if (typeof localStorage === "undefined") return "indoor";
  const value = localStorage.getItem(SETTING_KEY);
  return value === "outdoor" || value === "waterside" ? value : "indoor";
}

export default function EnvironmentalMeetingPlace({
  activeWeather,
  currentTheme,
  place,
  onOpenLook,
  onOpenPractice,
}: Props) {
  const { geo, status, refresh } = useGeo();
  const [environment, setEnvironment] = useState<EnvironmentalContext | null>(null);
  const [setting, setSetting] = useState<PracticeSetting>(savedSetting);
  const [weatherStatus, setWeatherStatus] = useState<"loading" | "ready" | "stale" | "unavailable">(
    "loading",
  );
  const [whyOpen, setWhyOpen] = useState(false);

  useEffect(() => {
    if (!geo) return;
    let cancelled = false;
    setWeatherStatus("loading");
    void getEnvironmentalContext(geo.lat, geo.lon)
      .then(({ context, stale }) => {
        if (cancelled) return;
        setEnvironment(context);
        setWeatherStatus(stale ? "stale" : "ready");
      })
      .catch(() => {
        if (!cancelled) setWeatherStatus("unavailable");
      });
    return () => {
      cancelled = true;
    };
  }, [geo]);

  const energyWindow = useMemo(() => {
    if (!place?.marks || !environment) return null;
    return provisionalEnergyWindow(place.marks, environment);
  }, [environment, place]);

  const chooseSetting = (next: PracticeSetting) => {
    setSetting(next);
    localStorage.setItem(SETTING_KEY, next);
  };

  const isNight = currentTheme === "night";
  const card = isNight ? "border-white/10 bg-black/20" : "border-stone-200 bg-white/60";
  const inset = isNight ? "border-white/10 bg-white/[0.035]" : "border-stone-200/80 bg-stone-50/70";

  return (
    <section
      className={`mb-8 rounded-3xl border p-6 md:p-8 ${card}`}
      aria-labelledby="meeting-place-title"
    >
      <div className="flex items-start justify-between gap-4 mb-7">
        <div>
          <span className="hw-eyebrow opacity-45">Today · meeting place</span>
          <h2
            id="meeting-place-title"
            className="font-serif text-3xl md:text-4xl mt-2 leading-tight"
          >
            Outside meets inside.
          </h2>
        </div>
        <CloudSun className="w-6 h-6 text-accent shrink-0 mt-1" aria-hidden />
      </div>

      <div className="grid md:grid-cols-2 gap-3 mb-3">
        <div className={`rounded-2xl border p-5 ${inset}`}>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] opacity-45">
            Outside
          </span>
          {environment ? (
            <>
              <p className="font-serif text-xl leading-snug mt-3">{describeOutside(environment)}</p>
              <p className="font-mono text-[11px] mt-4 opacity-50">
                {Math.round(environment.temperature)}° · {Math.round(environment.cloudCover)}% cloud
                · {Math.round(environment.windSpeed)} mph
              </p>
            </>
          ) : weatherStatus === "unavailable" ? (
            <div className="mt-3">
              <p className="font-sans text-sm opacity-65">
                Live conditions are unavailable. The solar day still remains.
              </p>
              <button
                type="button"
                onClick={() => void refresh()}
                className="font-mono text-xs uppercase tracking-wider text-accent mt-4 cursor-pointer"
              >
                Try location again
              </button>
            </div>
          ) : (
            <p className="font-sans text-sm opacity-55 mt-3">Reading the local air and light…</p>
          )}
          {geo && (
            <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider opacity-40 mt-3">
              <LocateFixed className="w-3 h-3" aria-hidden /> {geo.city}
              {status === "denied" ? " · approximate" : ""}
              {weatherStatus === "stale" ? " · last available" : ""}
            </span>
          )}
        </div>

        <div className={`rounded-2xl border p-5 ${inset}`}>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] opacity-45">
            Inside
          </span>
          <p className="font-serif text-xl leading-snug mt-3">{activeWeather.title}</p>
          <p className="font-sans text-sm leading-relaxed opacity-65 mt-3">
            This is your latest mark—not an explanation of the weather outside.
          </p>
          <button
            type="button"
            onClick={onOpenLook}
            className="font-mono text-xs uppercase tracking-wider text-accent mt-4 cursor-pointer"
          >
            Look again
          </button>
        </div>
      </div>

      <div className={`rounded-2xl border p-5 md:p-6 ${inset}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] opacity-45">
            Meeting place
          </span>
          <div className="flex flex-wrap gap-1" role="group" aria-label="Where are you practicing?">
            {(
              [
                ["indoor", "Here"],
                ["outdoor", "Outdoors"],
                ["waterside", "Near water"],
              ] as const
            ).map(([value, label]) => (
              <button
                type="button"
                key={value}
                aria-pressed={setting === value}
                onClick={() => chooseSetting(value)}
                className={`rounded-full border px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider cursor-pointer ${
                  setting === value
                    ? "border-accent/50 text-accent bg-accent/10"
                    : "border-current/10 opacity-55"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {environment ? (
          <p className="font-serif text-xl md:text-2xl leading-relaxed mt-4">
            {meetingPlaceCopy(setting, environment, activeWeather.title)}
          </p>
        ) : (
          <p className="font-serif text-xl leading-relaxed mt-4">
            Your inside mark can still meet the local solar day while live weather is unavailable.
          </p>
        )}

        {energyWindow && (
          <div className="border-t border-current/10 mt-5 pt-5">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] opacity-45">
              Today’s likely energy window
            </span>
            <p className="font-serif text-2xl md:text-3xl text-accent mt-2">
              {timeLabel(energyWindow.start)}–{timeLabel(energyWindow.end)}
            </p>
            <p className="font-sans text-sm opacity-60 mt-2">
              Provisional · still learning your rhythm
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-3 mt-6">
          <button
            type="button"
            onClick={onOpenPractice}
            className="hw-pressable rounded-xl border border-accent/40 bg-accent/10 px-4 py-3 font-mono text-xs uppercase tracking-wider text-accent cursor-pointer"
          >
            Practice with this
          </button>
          <button
            type="button"
            onClick={() => setWhyOpen((value) => !value)}
            aria-expanded={whyOpen}
            className="rounded-xl px-3 py-3 font-mono text-xs uppercase tracking-wider opacity-60 cursor-pointer"
          >
            Why this?
          </button>
        </div>

        {whyOpen && (
          <div className="border-t border-current/10 mt-5 pt-5 font-sans text-sm leading-relaxed opacity-65">
            <p>{energyWindow?.note ?? "The solar day anchors this first estimate."}</p>
            <p className="mt-2">
              Weather describes the available conditions; it does not explain or diagnose your
              internal state. Repeated Look observations will gradually make this window personal.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
