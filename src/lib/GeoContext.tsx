import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { reverseGeocode } from '../utils/solar';
import { idbGetJson, idbSetJson } from './idb';
import { resolveCoords, type CachedDailyMarks } from './dailyMarks';

const GEO_KEY = 'hw-geo';
const MARKS_KEY = 'hw-marks';

export type GeoCoords = {
  lat: number;
  lon: number;
  city: string;
  updatedAt: string;
};

type GeoStatus = 'loading' | 'ready' | 'denied';

type GeoContextValue = {
  geo: GeoCoords | null;
  status: GeoStatus;
  refresh: () => Promise<void>;
  setManualLocation: (lat: number, lon: number, city: string) => Promise<void>;
};

const GeoContext = createContext<GeoContextValue | null>(null);

async function persistGeo(geo: GeoCoords): Promise<void> {
  await idbSetJson(GEO_KEY, geo);
  const marks = await idbGetJson<CachedDailyMarks>(MARKS_KEY);
  if (!marks) return;
  await idbSetJson(MARKS_KEY, { ...marks, lat: geo.lat, lon: geo.lon, date: '' });
}

async function loadGeo(): Promise<GeoCoords> {
  const cached = await idbGetJson<GeoCoords>(GEO_KEY);
  if (cached?.lat != null && cached?.lon != null) {
    return cached;
  }

  const { lat, lon } = await resolveCoords();
  let city = 'Your location';
  try {
    city = await reverseGeocode(lat, lon);
  } catch {
    city = 'Your location';
  }

  const geo: GeoCoords = { lat, lon, city, updatedAt: new Date().toISOString() };
  await persistGeo(geo);
  return geo;
}

export function GeoProvider({ children }: { children: React.ReactNode }) {
  const [geo, setGeo] = useState<GeoCoords | null>(null);
  const [status, setStatus] = useState<GeoStatus>('loading');

  const refresh = useCallback(async () => {
    setStatus('loading');
    try {
      const next = await loadGeo();
      setGeo(next);
      setStatus('ready');
    } catch {
      setGeo({ lat: 40.7128, lon: -74.006, city: 'New York City', updatedAt: new Date().toISOString() });
      setStatus('denied');
    }
  }, []);

  const setManualLocation = useCallback(async (lat: number, lon: number, city: string) => {
    const next: GeoCoords = { lat, lon, city, updatedAt: new Date().toISOString() };
    await persistGeo(next);
    setGeo(next);
    setStatus('ready');
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({ geo, status, refresh, setManualLocation }),
    [geo, status, refresh, setManualLocation],
  );

  return <GeoContext.Provider value={value}>{children}</GeoContext.Provider>;
}

export function useGeo(): GeoContextValue {
  const ctx = useContext(GeoContext);
  if (!ctx) throw new Error('useGeo requires GeoProvider');
  return ctx;
}
