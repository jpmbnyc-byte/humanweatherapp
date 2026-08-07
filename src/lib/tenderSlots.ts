export type TenderSlot = {
  id: string;
  label: string;
  text: string;
  updatedAt?: string;
};

export const TENDER_SLOTS_STORAGE_KEY = 'hw-tender-message-slots';

export const DEFAULT_TENDER_SLOTS: TenderSlot[] = [
  { id: 'slot-1', label: 'Morning note', text: '' },
  { id: 'slot-2', label: 'Evening reflection', text: '' },
  { id: 'slot-3', label: 'Letter to self', text: '' },
  { id: 'slot-4', label: 'Open message', text: '' },
];

function mergeWithDefaults(saved: TenderSlot[]): TenderSlot[] {
  return DEFAULT_TENDER_SLOTS.map(def => {
    const hit = saved.find(s => s.id === def.id);
    return hit ? { ...def, ...hit, id: def.id } : { ...def };
  });
}

export function loadTenderSlots(): TenderSlot[] {
  if (typeof window === 'undefined') return [...DEFAULT_TENDER_SLOTS];
  try {
    const raw = localStorage.getItem(TENDER_SLOTS_STORAGE_KEY);
    if (!raw) return [...DEFAULT_TENDER_SLOTS];
    const parsed = JSON.parse(raw) as TenderSlot[];
    if (!Array.isArray(parsed)) return [...DEFAULT_TENDER_SLOTS];
    return mergeWithDefaults(parsed);
  } catch {
    return [...DEFAULT_TENDER_SLOTS];
  }
}

export function persistTenderSlots(slots: TenderSlot[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(TENDER_SLOTS_STORAGE_KEY, JSON.stringify(slots));
  } catch {
    /* private mode */
  }
}

export function saveTenderSlot(slot: TenderSlot): TenderSlot[] {
  const slots = loadTenderSlots().map(s =>
    s.id === slot.id
      ? { ...slot, updatedAt: new Date().toISOString() }
      : s,
  );
  persistTenderSlots(slots);
  return slots;
}
