export type TenderPromptId = 'present' | 'returning' | 'unsaid' | 'open';

export type TenderPage = {
  id: string;
  createdAt: string;
  promptId: TenderPromptId;
  durationMinutes: number;
  body: string;
  turnPrompt?: string;
  turnText?: string;
  stone?: string;
};

export const TENDER_PAGES_STORAGE_KEY = 'hw-tender-pages-v1';
const MAX_TENDER_PAGES = 90;

function isTenderPage(value: unknown): value is TenderPage {
  if (!value || typeof value !== 'object') return false;
  const page = value as Partial<TenderPage>;
  return (
    typeof page.id === 'string' &&
    typeof page.createdAt === 'string' &&
    typeof page.body === 'string' &&
    typeof page.durationMinutes === 'number' &&
    ['present', 'returning', 'unsaid', 'open'].includes(page.promptId ?? '')
  );
}

export function loadTenderPages(): TenderPage[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(TENDER_PAGES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter(isTenderPage).slice(0, MAX_TENDER_PAGES) : [];
  } catch {
    return [];
  }
}

function persistTenderPages(pages: TenderPage[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(TENDER_PAGES_STORAGE_KEY, JSON.stringify(pages.slice(0, MAX_TENDER_PAGES)));
  } catch {
    /* Storage can be unavailable in private browsing. */
  }
}

export function keepTenderPage(page: Omit<TenderPage, 'id' | 'createdAt'>): TenderPage[] {
  const createdAt = new Date().toISOString();
  const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `tender-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const pages = [{ ...page, id, createdAt }, ...loadTenderPages()].slice(0, MAX_TENDER_PAGES);
  persistTenderPages(pages);
  return pages;
}

export function removeTenderPage(id: string): TenderPage[] {
  const pages = loadTenderPages().filter(page => page.id !== id);
  persistTenderPages(pages);
  return pages;
}

export function tenderPageText(page: TenderPage): string {
  return [page.body, page.turnText, page.stone].filter(Boolean).join('\n\n');
}
