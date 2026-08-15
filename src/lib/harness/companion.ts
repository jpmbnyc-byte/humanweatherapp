import { idbGetJson, idbSetJson } from '../idb';
import { HW_KEYS } from './keys';

export type CompanionPrefs = {
  enabled: boolean;
  quietPresence: boolean;
  keeperName: string;
};

const DEFAULT: CompanionPrefs = {
  enabled: false,
  quietPresence: true,
  keeperName: 'the station',
};

export async function getCompanionPrefs(): Promise<CompanionPrefs> {
  const stored = await idbGetJson<CompanionPrefs>(HW_KEYS.companionPrefs);
  return stored ? { ...DEFAULT, ...stored } : { ...DEFAULT };
}

export async function setCompanionPrefs(prefs: Partial<CompanionPrefs>): Promise<CompanionPrefs> {
  const next = { ...(await getCompanionPrefs()), ...prefs };
  await idbSetJson(HW_KEYS.companionPrefs, next);
  return next;
}

export type CompanionLine = {
  text: string;
  at: string;
};

const QUIET_LINES = [
  'The field is open when you are.',
  'Nothing is required here.',
  'Witness, do not fix.',
  'The weather is passing through you, not staying.',
];

export function companionLine(now = new Date()): CompanionLine {
  const idx = now.getDate() % QUIET_LINES.length;
  return { text: QUIET_LINES[idx], at: now.toISOString() };
}

export async function companionStatus(): Promise<{
  active: boolean;
  line: CompanionLine | null;
  keeperName: string;
}> {
  const prefs = await getCompanionPrefs();
  if (!prefs.enabled) {
    return { active: false, line: null, keeperName: prefs.keeperName };
  }
  return {
    active: true,
    line: prefs.quietPresence ? companionLine() : null,
    keeperName: prefs.keeperName,
  };
}
