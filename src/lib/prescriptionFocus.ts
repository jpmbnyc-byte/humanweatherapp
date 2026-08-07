export type PrescriptionFocus = {
  shinrinProtocolId?: string;
  lightModeId?: string;
  frequencyId?: string;
};

const STORAGE_KEY = 'hw-prescription-focus';

export function setPrescriptionFocus(focus: PrescriptionFocus): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(focus));
  } catch {
    /* private mode */
  }
}

export function consumePrescriptionFocus(): PrescriptionFocus | null {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(STORAGE_KEY);
    return JSON.parse(raw) as PrescriptionFocus;
  } catch {
    return null;
  }
}
