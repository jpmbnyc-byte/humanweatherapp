import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { WeatherState } from '../types';
import { DustField } from './dust';
import { buildFormSeed, drawForm } from './seed';
import { runCaptureSequence } from './capture';
import { localDateKey } from '../dailyMarks';
import { createMementoFromSeed, getMementoForDate, saveMemento, getAllMementos } from './genesis';
import { prefersReducedMotion } from './motion';
import {
  FORMING_CYCLE_COUNT,
  MIN_DUST_FOR_FORMING,
  type BreathPhase,
  type FormSeed,
  type FormingStage,
  type Memento,
} from './types';

type FormingContextValue = {
  stage: FormingStage;
  dust: DustField;
  formSeed: FormSeed | null;
  coalesce: number;
  breathPhase: BreathPhase;
  breathScatter: number;
  cycleIndex: number;
  canForm: boolean;
  mounting: boolean;
  stillness: boolean;
  scalePunch: number;
  warmthBloom: number;
  showFrame: boolean;
  caption: string;
  mementos: Memento[];
  todaySaved: boolean;
  reduceMotion: boolean;
  displaySeed: FormSeed | null;
  registerTouch: (normX: number, normY: number, dwellMs: number) => void;
  onBreathPhase: (phase: BreathPhase) => void;
  onExhaleEnd: (cycle: number) => void;
  abortForming: () => void;
  refreshMementos: () => void;
};

const FormingContext = createContext<FormingContextValue | null>(null);

export function useForming(): FormingContextValue {
  const ctx = useContext(FormingContext);
  if (!ctx) throw new Error('useForming requires FormingProvider');
  return ctx;
}

export function useFormingOptional(): FormingContextValue | null {
  return useContext(FormingContext);
}

type Props = {
  weather: WeatherState;
  conditionsSummary: string;
  active?: boolean;
  children: React.ReactNode;
};

export function FormingProvider({ weather, conditionsSummary, active = true, children }: Props) {
  const dustRef = useRef(new DustField());
  const captureSessionRef = useRef(0);
  const [dustCount, setDustCount] = useState(0);
  const [stage, setStage] = useState<FormingStage>('idle');
  const [formSeed, setFormSeed] = useState<FormSeed | null>(null);
  const [coalesce, setCoalesce] = useState(0);
  const [breathPhase, setBreathPhase] = useState<BreathPhase>('Inhale');
  const [breathScatter, setBreathScatter] = useState(0.35);
  const [cycleIndex, setCycleIndex] = useState(0);
  const [mounting, setMounting] = useState(false);
  const [stillness, setStillness] = useState(false);
  const [scalePunch, setScalePunch] = useState(1);
  const [warmthBloom, setWarmthBloom] = useState(0);
  const [showFrame, setShowFrame] = useState(false);
  const [caption, setCaption] = useState('');
  const [mementos, setMementos] = useState<Memento[]>([]);
  const [todaySaved, setTodaySaved] = useState(false);
  const captureFiredRef = useRef(false);
  const reduceMotion = prefersReducedMotion();

  const refreshMementos = useCallback(() => {
    void getAllMementos().then(setMementos);
    void getMementoForDate(localDateKey()).then(m => setTodaySaved(!!m));
  }, []);

  useEffect(() => {
    refreshMementos();
  }, [refreshMementos]);

  const canForm =
    dustCount >= MIN_DUST_FOR_FORMING &&
    !todaySaved &&
    !captureFiredRef.current;

  const displaySeed =
    formSeed ??
    (dustCount >= MIN_DUST_FOR_FORMING && (stage === 'gathering' || stage === 'breathing')
      ? buildFormSeed(dustRef.current.gestureLog, dustRef.current.count, weather, conditionsSummary)
      : null);

  const registerTouch = useCallback((normX: number, normY: number, dwellMs: number) => {
    if (stage === 'capturing' || stage === 'mounting' || stage === 'stillness' || todaySaved) return;
    dustRef.current.addContact(normX, normY, dwellMs);
    setDustCount(dustRef.current.count);
    if (stage === 'idle' || stage === 'complete') setStage('gathering');
  }, [stage, todaySaved]);

  const abortForming = useCallback(() => {
    captureSessionRef.current += 1;
    if (stage === 'capturing' || stage === 'mounting') return;
    captureFiredRef.current = false;
    setStage('idle');
    setCoalesce(0);
    setCycleIndex(0);
    setMounting(false);
    setStillness(false);
    setShowFrame(false);
    setWarmthBloom(0);
    setScalePunch(1);
    setCaption('');
    setFormSeed(null);
    setDustCount(0);
    dustRef.current.clear();
  }, [stage]);

  useEffect(() => {
    if (!active) abortForming();
  }, [active, abortForming]);

  useEffect(() => {
    return () => {
      captureSessionRef.current += 1;
    };
  }, []);

  const onBreathPhase = useCallback(
    (phase: BreathPhase) => {
      if (dustCount >= MIN_DUST_FOR_FORMING && (stage === 'gathering' || stage === 'idle')) {
        setStage('breathing');
      }

      setBreathPhase(phase);
      if (phase === 'Inhale') setBreathScatter(0.45);
      else if (phase === 'Exhale') setBreathScatter(0.12);
      else setBreathScatter(0.25);

      const progress = (cycleIndex + (phase === 'Exhale' ? 0.5 : phase === 'Hold Out' ? 0.85 : 0)) / FORMING_CYCLE_COUNT;
      setCoalesce(Math.min(0.92, progress));
    },
    [canForm, cycleIndex, stage, dustCount],
  );

  const fireCapture = useCallback(async () => {
    if (captureFiredRef.current || todaySaved) return;
    captureFiredRef.current = true;
    const session = ++captureSessionRef.current;
    setStage('capturing');

    const seed = buildFormSeed(
      dustRef.current.gestureLog,
      dustRef.current.count,
      weather,
      conditionsSummary,
    );
    setFormSeed(seed);
    setCoalesce(1);

    const memento = await createMementoFromSeed(seed);
    setCaption(`NASCIMENTO/${memento.index} · MEMENTO · ${seed.weatherName}`);

    await runCaptureSequence(
      {
        onBloom: () => setWarmthBloom(1),
        onScalePunch: () => {
          setScalePunch(0.985);
          window.setTimeout(() => setScalePunch(1), 140);
        },
        onFrameDraw: () => setShowFrame(true),
        onMountStart: () => {
          setStage('mounting');
          setMounting(true);
        },
        onStillness: () => {
          setStage('stillness');
          setStillness(true);
          setMounting(false);
        },
        onRelease: async () => {
          if (session !== captureSessionRef.current) return;
          await saveMemento(memento);
          setTodaySaved(true);
          setStage('complete');
          setStillness(false);
          setWarmthBloom(0);
          setShowFrame(false);
          dustRef.current.clear();
          refreshMementos();
        },
      },
      reduceMotion,
    );
  }, [conditionsSummary, reduceMotion, refreshMementos, todaySaved, weather]);

  const onExhaleEnd = useCallback(
    (cycle: number) => {
      if (!canForm || captureFiredRef.current) return;
      setCycleIndex(cycle);
      setCoalesce(Math.min(1, (cycle + 1) / FORMING_CYCLE_COUNT));

      if (cycle + 1 >= FORMING_CYCLE_COUNT) {
        void fireCapture();
      }
    },
    [canForm, fireCapture],
  );

  const value = useMemo<FormingContextValue>(
    () => ({
      stage,
      dust: dustRef.current,
      formSeed,
      coalesce,
      breathPhase,
      breathScatter,
      cycleIndex,
      canForm,
      mounting,
      stillness,
      scalePunch,
      warmthBloom,
      showFrame,
      caption,
      mementos,
      todaySaved,
      reduceMotion,
      displaySeed,
      registerTouch,
      onBreathPhase,
      onExhaleEnd,
      abortForming,
      refreshMementos,
    }),
    [
      stage,
      formSeed,
      coalesce,
      breathPhase,
      breathScatter,
      cycleIndex,
      canForm,
      mounting,
      stillness,
      scalePunch,
      warmthBloom,
      showFrame,
      caption,
      mementos,
      todaySaved,
      reduceMotion,
      displaySeed,
      dustCount,
      registerTouch,
      onBreathPhase,
      onExhaleEnd,
      abortForming,
      refreshMementos,
    ],
  );

  return <FormingContext.Provider value={value}>{children}</FormingContext.Provider>;
}

export function drawFormToCanvas(
  canvas: HTMLCanvasElement,
  seed: FormSeed,
  coalesce: number,
  breathPhase: BreathPhase,
  breathScatter: number,
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  const phase =
    breathPhase === 'Inhale' ? 'inhale' : breathPhase === 'Exhale' ? 'exhale' : 'hold';
  drawForm(ctx, seed, {
    coalesce,
    breathPhase: phase,
    breathScatter,
    size: Math.min(w, h),
  });
}
