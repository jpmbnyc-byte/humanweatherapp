import React, { useEffect, useRef, useState } from 'react';
import {
  getChannelPrefs,
  setChannelPrefs,
  emitChannelSignal,
  type ChannelMode,
} from '../../lib/harness/channels';
import { migrateLegacyFieldStation } from '../../lib/harness/migrate';
import { listReadings } from '../../lib/harness/readings';
import { computeOfficeSchedule } from '../../lib/harness/officesScheduler';
import { HARNESS_PROTOCOLS } from '../../lib/harness/protocolRuntime';
import { schedulePvtStimulus, recordPvtResult } from '../../lib/harness/pvt';
import { setSlowFieldPrefs } from '../../lib/harness/slowField';
import { initHarness } from '../../lib/harness';

export default function HarnessDebugPage() {
  const [channel, setChannel] = useState<ChannelMode>('visual');
  const [readingsCount, setReadingsCount] = useState(0);
  const [offices, setOffices] = useState<string>('—');
  const [pvtMs, setPvtMs] = useState<number | null>(null);
  const [pvtWaiting, setPvtWaiting] = useState(false);
  const [awaitingTap, setAwaitingTap] = useState(false);
  const shownAt = useRef<number | null>(null);

  useEffect(() => {
    void (async () => {
      await initHarness();
      await migrateLegacyFieldStation(true);
      const prefs = await getChannelPrefs();
      setChannel(prefs.mode);
      const readings = await listReadings();
      setReadingsCount(readings.length);
      const sched = await computeOfficeSchedule(40.7128, -74.006);
      setOffices(
        sched.offices.map(o => `${o.office}:${o.state}`).join(' · ') || 'none',
      );
    })();
  }, []);

  const runPvt = () => {
    setPvtWaiting(true);
    setPvtMs(null);
    setAwaitingTap(false);
    shownAt.current = null;
    schedulePvtStimulus(() => {
      shownAt.current = performance.now();
      setPvtWaiting(false);
      setAwaitingTap(true);
    });
  };

  const tapPvt = async () => {
    if (shownAt.current == null) return;
    const ms = Math.round(performance.now() - shownAt.current);
    setPvtMs(ms);
    setAwaitingTap(false);
    await recordPvtResult(ms);
    shownAt.current = null;
  };

  return (
    <main className="min-h-screen bg-[#14100E] text-[#EFE6D8] p-8 max-w-2xl mx-auto font-mono text-sm">
      <h1 className="font-serif text-3xl text-[#C9A96A] mb-2">HW Harness Debug</h1>
      <p className="opacity-60 mb-8">Task audit route — channel, migration, scheduler, PVT.</p>

      <section className="mb-8 space-y-3">
        <h2 className="uppercase tracking-widest text-xs text-[#C9A96A]">Task 1 · Channel</h2>
        <select
          value={channel}
          onChange={e => {
            const mode = e.target.value as ChannelMode;
            setChannel(mode);
            void setChannelPrefs({ mode });
          }}
          className="bg-[#1D1713] border border-white/10 px-3 py-2 rounded"
        >
          <option value="visual">visual</option>
          <option value="haptic">haptic</option>
          <option value="audiotactile">audiotactile</option>
        </select>
        <button
          type="button"
          className="block border border-white/20 px-4 py-2 rounded hover:bg-white/5"
          onClick={() => void emitChannelSignal({ kind: 'pulse' })}
        >
          Emit pulse
        </button>
      </section>

      <section className="mb-8">
        <h2 className="uppercase tracking-widest text-xs text-[#C9A96A] mb-2">Task 2 · Migration</h2>
        <p className="opacity-70">Legacy field station snapshot migrated.</p>
      </section>

      <section className="mb-8">
        <h2 className="uppercase tracking-widest text-xs text-[#C9A96A] mb-2">Task 4 · Offices</h2>
        <p className="opacity-70">{offices}</p>
      </section>

      <section className="mb-8">
        <h2 className="uppercase tracking-widest text-xs text-[#C9A96A] mb-2">Task 5 · Protocols</h2>
        <ul className="opacity-70 list-disc pl-5">
          {HARNESS_PROTOCOLS.map(p => (
            <li key={p.id}>{p.title}</li>
          ))}
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="uppercase tracking-widest text-xs text-[#C9A96A] mb-2">Task 6 · PVT</h2>
        {pvtWaiting && <p className="text-[#C9A96A] animate-pulse">Wait for signal…</p>}
        {!pvtWaiting && !pvtMs && !awaitingTap && (
          <button type="button" className="border border-white/20 px-4 py-2 rounded" onClick={runPvt}>
            Start reaction check
          </button>
        )}
        {awaitingTap && (
          <button type="button" className="mt-2 border border-[#C9A96A] px-6 py-3 rounded" onClick={() => void tapPvt()}>
            Tap now
          </button>
        )}
        {pvtMs != null && <p className="mt-2">Reaction: {pvtMs}ms</p>}
      </section>

      <section className="mb-8">
        <h2 className="uppercase tracking-widest text-xs text-[#C9A96A] mb-2">Readings</h2>
        <p className="opacity-70">{readingsCount} stored in hw.readings</p>
      </section>

      <section className="mb-8">
        <h2 className="uppercase tracking-widest text-xs text-[#C9A96A] mb-2">Task 9 · Slow field</h2>
        <button
          type="button"
          className="border border-white/20 px-4 py-2 rounded"
          onClick={() => void setSlowFieldPrefs({ photosensitiveGate: true })}
        >
          Enable photosensitive gate (2 Hz cap)
        </button>
      </section>

      <a href="/" className="text-[#C9A96A] underline opacity-80">
        Return to Field Station
      </a>
    </main>
  );
}
