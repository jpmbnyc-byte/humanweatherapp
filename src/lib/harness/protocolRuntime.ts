import { idbGetJson, idbSetJson } from '../idb';
import { HW_KEYS } from './keys';

export type ProtocolId =
  | 'equal_breath'
  | 'extended_exhale'
  | 'screen_down_rest'
  | 'sensory_check'
  | 'solar_moment';

export type ProtocolStep = {
  id: string;
  instruction: string;
  durationMs: number;
  requiresScreenDown?: boolean;
};

export type ProtocolDefinition = {
  id: ProtocolId;
  title: string;
  steps: ProtocolStep[];
};

export const HARNESS_PROTOCOLS: ProtocolDefinition[] = [
  {
    id: 'equal_breath',
    title: 'Equal breath',
    steps: [
      { id: 'inhale', instruction: 'Inhale evenly.', durationMs: 4000 },
      { id: 'exhale', instruction: 'Exhale evenly.', durationMs: 4000 },
      { id: 'rest', instruction: 'Rest in the field.', durationMs: 2000 },
    ],
  },
  {
    id: 'extended_exhale',
    title: 'Extended exhale',
    steps: [
      { id: 'inhale', instruction: 'Inhale softly.', durationMs: 4000 },
      { id: 'exhale', instruction: 'Lengthen the out-breath.', durationMs: 7000 },
    ],
  },
  {
    id: 'screen_down_rest',
    title: 'Screen-down rest',
    steps: [
      {
        id: 'face_down',
        instruction: 'Place the screen face-down. Rest your attention in the body.',
        durationMs: 8000,
        requiresScreenDown: true,
      },
      { id: 'return', instruction: 'When ready, return without hurry.', durationMs: 3000 },
    ],
  },
  {
    id: 'sensory_check',
    title: 'Sensory check',
    steps: [
      { id: 'sound', instruction: 'Name one sound.', durationMs: 5000 },
      { id: 'touch', instruction: 'Name one touch.', durationMs: 5000 },
      { id: 'air', instruction: 'Name the air on skin.', durationMs: 5000 },
    ],
  },
  {
    id: 'solar_moment',
    title: 'Solar moment',
    steps: [
      { id: 'light', instruction: 'Turn toward the light available to you.', durationMs: 6000 },
      { id: 'still', instruction: 'Hold still one breath.', durationMs: 5000 },
    ],
  },
];

export type ProtocolSession = {
  protocolId: ProtocolId;
  startedAt: string;
  completedAt?: string;
  screenDownVerified?: boolean;
};

export async function listProtocolSessions(): Promise<ProtocolSession[]> {
  return (await idbGetJson<ProtocolSession[]>(HW_KEYS.protocolSessions)) ?? [];
}

export async function recordProtocolSession(session: ProtocolSession): Promise<void> {
  const list = await listProtocolSessions();
  list.unshift(session);
  await idbSetJson(HW_KEYS.protocolSessions, list.slice(0, 200));
}

export type ScreenOrientation = 'face-up' | 'face-down' | 'unknown';

/** Best-effort screen-down detection via orientation + visibility. */
export function detectScreenOrientation(): ScreenOrientation {
  if (typeof window === 'undefined') return 'unknown';
  const type = window.screen?.orientation?.type ?? '';
  if (type.includes('portrait-primary') || type.includes('landscape-primary')) {
    // Most phones report primary when face-up; inverted types often mean face-down.
    if (type.includes('secondary') || type.includes('180')) return 'face-down';
  }
  if (typeof document !== 'undefined' && document.hidden) return 'face-down';
  return 'face-up';
}

export function protocolRequiresScreenDown(protocol: ProtocolDefinition): boolean {
  return protocol.steps.some(s => s.requiresScreenDown);
}

export async function runProtocolStepGate(
  step: ProtocolStep,
): Promise<{ ok: boolean; reason?: string }> {
  if (!step.requiresScreenDown) return { ok: true };
  const orientation = detectScreenOrientation();
  if (orientation === 'face-down') return { ok: true };
  return { ok: false, reason: 'Place the screen face-down to continue.' };
}

export function getProtocol(id: ProtocolId): ProtocolDefinition | undefined {
  return HARNESS_PROTOCOLS.find(p => p.id === id);
}
