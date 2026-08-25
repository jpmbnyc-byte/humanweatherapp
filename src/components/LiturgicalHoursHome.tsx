import React, { useEffect, useMemo, useState } from "react";

type Theme = "day" | "night";
type HourId = "office" | "lauds" | "terce" | "sext" | "none" | "vespers" | "compline";
type LiturgicalHour = {
  id: HourId;
  prayer: string;
  commonName: string;
  time: string;
  invitation: string;
};

const HOURS: LiturgicalHour[] = [
  { id: "office", prayer: "OFFICE OF READINGS", commonName: "The long-form encounter", time: "AVAILABLE", invitation: "Enter the longer reading appointed for today." },
  { id: "lauds", prayer: "LAUDS", commonName: "Morning Prayer", time: "06:30 AM", invitation: "Receive the day before it begins asking things of you." },
  { id: "terce", prayer: "TERCE", commonName: "Mid-morning Prayer", time: "09:00 AM", invitation: "Return to attention inside the working morning." },
  { id: "sext", prayer: "SEXT", commonName: "Midday Prayer", time: "12:00 PM", invitation: "Pause at the height of the day." },
  { id: "none", prayer: "NONE", commonName: "Mid-afternoon Prayer", time: "03:00 PM", invitation: "Gather what has scattered since noon." },
  { id: "vespers", prayer: "VESPERS", commonName: "Evening Prayer", time: "06:00 PM", invitation: "Let the day turn toward gratitude." },
  { id: "compline", prayer: "COMPLINE", commonName: "Night Prayer", time: "09:30 PM", invitation: "Release what the day is still carrying." },
];

function currentHourId(date: Date): HourId {
  const hour = date.getHours();
  if (hour < 5) return "compline";
  if (hour < 8) return "lauds";
  if (hour < 11) return "terce";
  if (hour < 14) return "sext";
  if (hour < 17) return "none";
  if (hour < 20) return "vespers";
  return "compline";
}

function formatNow(date: Date): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDay(date: Date): string {
  return date.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
}

function useLiturgicalNow() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const activeId = currentHourId(now);
  const activeHour = useMemo(
    () => HOURS.find(hour => hour.id === activeId) ?? HOURS[1],
    [activeId],
  );

  return { now, activeHour };
}

export function LiturgicalHoursRail({
  currentTheme,
  onOpen,
}: {
  currentTheme: Theme;
  onOpen: () => void;
}) {
  const { now, activeHour } = useLiturgicalNow();
  const isNight = currentTheme === "night";

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Open the liturgical day. ${activeHour.commonName} is open now.`}
      className={`hw-pressable mt-3 w-full rounded-xl border px-4 py-3 text-left transition-colors ${
        isNight
          ? "border-white/10 bg-black/15 hover:bg-white/5"
          : "border-stone-200/80 bg-white/45 hover:bg-white/70"
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] opacity-45">The liturgical day</p>
          <p className="mt-1 truncate font-mono text-sm tracking-wide">
            <span>{formatNow(now)}</span>
            <span className="px-2 text-accent">/</span>
            <span className="font-semibold text-accent">{activeHour.prayer}</span>
          </p>
        </div>
        <span className="shrink-0 font-mono text-[10px] uppercase tracking-widest opacity-55">Open</span>
      </div>
    </button>
  );
}

export default function LiturgicalHoursHome({ currentTheme }: { currentTheme: Theme }) {
  const { now, activeHour } = useLiturgicalNow();
  const [expanded, setExpanded] = useState(false);
  const isNight = currentTheme === "night";

  return (
    <section
      id="liturgical-day"
      aria-labelledby="liturgical-day-title"
      className={`mb-8 overflow-hidden rounded-2xl border ${
        isNight ? "border-white/10 bg-black/20" : "border-stone-200/80 bg-white/55"
      }`}
    >
      <div className="p-5 sm:p-7">
        <div className="flex items-start justify-between gap-5">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] opacity-45">The liturgical day</p>
            <p className="mt-1 font-serif text-base capitalize opacity-65">{formatDay(now)}</p>
          </div>
          <span
            className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-accent shadow-[0_0_18px_currentColor]"
            aria-label="Liturgical color"
          />
        </div>

        <div className="mt-8">
          <h2
            id="liturgical-day-title"
            className="font-mono text-[clamp(1.55rem,7vw,3.65rem)] font-medium tracking-[-0.055em] leading-none"
          >
            <span>{formatNow(now)}</span>
            <span className="px-[0.22em] text-accent">/</span>
            <span className="font-serif text-accent tracking-[-0.025em]">{activeHour.prayer}</span>
          </h2>
          <p className="mt-3 font-serif text-xl">{activeHour.commonName}</p>
          <p className="mt-2 max-w-prose font-serif text-base italic leading-relaxed opacity-65">
            {activeHour.invitation}
          </p>
        </div>

        <div className="mt-7 flex flex-wrap items-center gap-3">
          <button type="button" className="hw-btn-ghost" aria-describedby="prayer-content-status">
            Begin {activeHour.commonName}
          </button>
          <button
            type="button"
            className="font-mono text-[10px] uppercase tracking-widest opacity-55 transition-opacity hover:opacity-100"
            aria-describedby="prayer-content-status"
          >
            Listen instead
          </button>
        </div>
        <p id="prayer-content-status" className="sr-only">Prayer content connection is being prepared.</p>
      </div>

      <div className={`border-t ${isNight ? "border-white/10" : "border-stone-200/80"}`}>
        <button
          type="button"
          onClick={() => setExpanded(value => !value)}
          aria-expanded={expanded}
          aria-controls="liturgical-hours-list"
          className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left sm:px-7"
        >
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] opacity-55">The Hours Today</span>
          <span className="font-mono text-xs text-accent" aria-hidden>{expanded ? "−" : "+"}</span>
        </button>

        {expanded && (
          <ol id="liturgical-hours-list" className="px-5 pb-5 sm:px-7 sm:pb-7">
            {HOURS.map(hour => {
              const active = hour.id === activeHour.id;
              return (
                <li
                  key={hour.id}
                  className={`grid grid-cols-[5.8rem_1fr] gap-3 border-t py-3.5 ${
                    isNight ? "border-white/8" : "border-stone-200/70"
                  } ${active ? "text-accent" : "opacity-55"}`}
                >
                  <span className="font-mono text-[11px] tracking-wide">{hour.time}</span>
                  <span>
                    <span className="font-serif text-sm font-semibold tracking-wide">{hour.prayer}</span>
                    <span className="block font-serif text-sm italic opacity-75">{hour.commonName}</span>
                  </span>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </section>
  );
}
