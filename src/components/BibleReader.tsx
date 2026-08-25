import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  FetchClient,
  type FetchCollection,
  type GetBooksItem,
  type GetLanguagesItem,
  type GetResourcesItem,
} from "@gracious.tech/fetch-client";
import "@gracious.tech/fetch-client/client.css";
import type { HourId, LiturgicalHour } from "./LiturgicalHoursHome";

type Theme = "day" | "night";

type ReaderMemory = {
  language?: string;
  resource?: string;
  book?: string;
  chapter?: number;
};

const MEMORY_KEY = "hw:bible-reader:v1";

type GuidedPassage = { label: string; book: string; chapter: number };

const HOUR_GUIDES: Record<HourId, { opening: GuidedPassage; companions: GuidedPassage[] }> = {
  office: { opening: { label: "Psalm 95", book: "psa", chapter: 95 }, companions: [] },
  lauds: { opening: { label: "Psalm 63", book: "psa", chapter: 63 }, companions: [{ label: "Luke 1", book: "luk", chapter: 1 }] },
  terce: { opening: { label: "Psalm 119", book: "psa", chapter: 119 }, companions: [] },
  sext: { opening: { label: "Psalm 121", book: "psa", chapter: 121 }, companions: [] },
  none: { opening: { label: "Psalm 130", book: "psa", chapter: 130 }, companions: [] },
  vespers: { opening: { label: "Psalm 141", book: "psa", chapter: 141 }, companions: [{ label: "Luke 1", book: "luk", chapter: 1 }] },
  compline: {
    opening: { label: "Psalm 4", book: "psa", chapter: 4 },
    companions: [
      { label: "Psalm 91", book: "psa", chapter: 91 },
      { label: "Psalm 134", book: "psa", chapter: 134 },
      { label: "Luke 2", book: "luk", chapter: 2 },
    ],
  },
};

function readMemory(): ReaderMemory {
  try {
    return JSON.parse(window.localStorage.getItem(MEMORY_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function writeMemory(memory: ReaderMemory) {
  try {
    window.localStorage.setItem(MEMORY_KEY, JSON.stringify(memory));
  } catch {
    // The reader remains usable when storage is unavailable.
  }
}

export default function BibleReader({
  open,
  currentTheme,
  liturgicalHour,
  onClose,
}: {
  open: boolean;
  currentTheme: Theme;
  liturgicalHour: LiturgicalHour;
  onClose: () => void;
}) {
  const clientRef = useRef<FetchClient | null>(null);
  const [collection, setCollection] = useState<FetchCollection | null>(null);
  const [languages, setLanguages] = useState<GetLanguagesItem[]>([]);
  const [resources, setResources] = useState<GetResourcesItem[]>([]);
  const [books, setBooks] = useState<GetBooksItem[]>([]);
  const [language, setLanguage] = useState("");
  const [resource, setResource] = useState("");
  const [book, setBook] = useState("");
  const [chapter, setChapter] = useState(1);
  const [chapterCount, setChapterCount] = useState(1);
  const [chapterHtml, setChapterHtml] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [attribution, setAttribution] = useState("");
  const isNight = currentTheme === "night";
  const hourGuide = HOUR_GUIDES[liturgicalHour.id];

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open || collection) return;
    let cancelled = false;

    async function initialize() {
      setLoading(true);
      setError("");
      try {
        const client = new FetchClient();
        clientRef.current = client;
        const nextCollection = await client.fetch_collection();
        if (cancelled) return;

        const nextLanguages = nextCollection.bibles.get_languages({
          exclude_old: true,
          sort_by: "population",
        });
        const memory = readMemory();
        const browserPreferences = navigator.languages?.length
          ? Array.from(navigator.languages)
          : [navigator.language || "en"];
        const preferred = nextCollection.bibles.get_preferred_language(browserPreferences);
        const initialLanguage =
          (memory.language && nextCollection.bibles.has_language(memory.language)
            ? memory.language
            : preferred.code) || "eng";

        setCollection(nextCollection);
        setLanguages(nextLanguages);
        setLanguage(initialLanguage);
      } catch (cause) {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : "The Bible library could not be opened.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void initialize();
    return () => {
      cancelled = true;
    };
  }, [collection, open]);

  useEffect(() => {
    if (!collection || !language) return;
    const nextResources = collection.bibles.get_resources({
      language,
      exclude_obsolete: true,
      exclude_incomplete: true,
    });
    const memory = readMemory();
    const nextResource =
      (memory.resource && nextResources.some(item => item.id === memory.resource)
        ? memory.resource
        : nextResources[0]?.id) ?? "";
    setResources(nextResources);
    setResource(nextResource);
  }, [collection, language]);

  useEffect(() => {
    if (!collection || !resource) return;
    const activeCollection = collection;
    let cancelled = false;

    async function loadTranslation() {
      setLoading(true);
      setError("");
      try {
        await activeCollection.bibles.fetch_translation_extras(resource);
        if (cancelled) return;
        const nextBooks = activeCollection.bibles.get_books(resource).filter(item => item.available);
        const memory = readMemory();
        const nextBook = nextBooks.some(item => item.id === hourGuide.opening.book)
          ? hourGuide.opening.book
          : (memory.book && nextBooks.some(item => item.id === memory.book)
              ? memory.book
              : nextBooks[0]?.id) ?? "";
        setBooks(nextBooks);
        setBook(nextBook);
        setChapter(
          nextBook === hourGuide.opening.book ? hourGuide.opening.chapter : 1,
        );
      } catch (cause) {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : "This translation could not be opened.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadTranslation();
    return () => {
      cancelled = true;
    };
  }, [collection, hourGuide.opening.book, hourGuide.opening.chapter, resource]);

  const openGuidedPassage = (passage: GuidedPassage) => {
    if (!books.some(item => item.id === passage.book)) return;
    setBook(passage.book);
    setChapter(passage.chapter);
  };

  useEffect(() => {
    if (!collection || !resource || !book) return;
    const activeCollection = collection;
    let cancelled = false;

    async function loadChapter() {
      setLoading(true);
      setError("");
      try {
        const translationExtras = await activeCollection.bibles.fetch_translation_extras(resource);
        const chapters = translationExtras.get_chapters(book);
        const safeChapter = Math.min(Math.max(chapter, 1), chapters.length || 1);
        const bibleBook = await activeCollection.bibles.fetch_book(resource, book);
        if (cancelled) return;
        setChapterCount(chapters.length || 1);
        setChapter(safeChapter);
        setChapterHtml(bibleBook.get_chapter(safeChapter));
        setAttribution(bibleBook.get_attribution());
        writeMemory({ language, resource, book, chapter: safeChapter });
      } catch (cause) {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : "This chapter could not be opened.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadChapter();
    return () => {
      cancelled = true;
    };
  }, [book, chapter, collection, language, resource]);

  const chapterOptions = useMemo(
    () => Array.from({ length: chapterCount }, (_, index) => index + 1),
    [chapterCount],
  );

  if (!open) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] overflow-y-auto ${isNight ? "bg-[#090807] text-stone-100" : "bg-[#f3efe7] text-stone-900"}`}
      role="dialog"
      aria-modal="true"
      aria-label="Bible reader"
    >
      <header className={`sticky top-0 z-10 border-b backdrop-blur-xl ${isNight ? "border-white/10 bg-black/80" : "border-stone-300/70 bg-[#f3efe7]/90"}`}>
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.24em] opacity-55">{liturgicalHour.prayer} · {liturgicalHour.commonName}</p>
            <h2 className="font-serif text-3xl text-accent">Scripture for this hour</h2>
          </div>
          <button type="button" onClick={onClose} className="hw-btn-ghost" aria-label="Close Bible reader">
            Close
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl px-5 py-6 sm:px-8 sm:py-10">
        <section className={`mb-5 rounded-2xl border px-5 py-5 ${isNight ? "border-accent/20 bg-accent/[0.06]" : "border-accent/25 bg-white/65"}`} aria-label={`${liturgicalHour.commonName} readings`}>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">Begin {liturgicalHour.commonName}</p>
          <p className="mt-2 font-serif text-xl italic leading-relaxed opacity-80">{liturgicalHour.invitation}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {[hourGuide.opening, ...hourGuide.companions].map(passage => (
              <button
                type="button"
                key={`${passage.book}-${passage.chapter}`}
                onClick={() => openGuidedPassage(passage)}
                className={`rounded-full border px-4 py-2 font-mono text-xs tracking-wide ${book === passage.book && chapter === passage.chapter ? "border-accent bg-accent/15 text-accent" : "border-current/15 opacity-75"}`}
              >
                {passage.label}
              </button>
            ))}
          </div>
        </section>

        <div className={`grid gap-3 rounded-2xl border p-4 sm:grid-cols-4 ${isNight ? "border-white/10 bg-white/[0.03]" : "border-stone-300/70 bg-white/55"}`}>
          <label className="font-mono text-xs uppercase tracking-widest opacity-70">
            Language
            <select className="mt-2 w-full bg-transparent font-serif text-lg normal-case" value={language} onChange={event => setLanguage(event.target.value)}>
              {languages.map(item => <option key={item.code} value={item.code}>{item.name_bilingual}</option>)}
            </select>
          </label>
          <label className="font-mono text-xs uppercase tracking-widest opacity-70">
            Translation
            <select className="mt-2 w-full bg-transparent font-serif text-lg normal-case" value={resource} onChange={event => setResource(event.target.value)}>
              {resources.map(item => <option key={item.id} value={item.id}>{item.name_local || item.name_english}</option>)}
            </select>
          </label>
          <label className="font-mono text-xs uppercase tracking-widest opacity-70">
            Book
            <select className="mt-2 w-full bg-transparent font-serif text-lg normal-case" value={book} onChange={event => { setBook(event.target.value); setChapter(1); }}>
              {books.map(item => <option key={item.id} value={item.id}>{item.name_local || item.name_english}</option>)}
            </select>
          </label>
          <label className="font-mono text-xs uppercase tracking-widest opacity-70">
            Chapter
            <select className="mt-2 w-full bg-transparent font-serif text-lg normal-case" value={chapter} onChange={event => setChapter(Number(event.target.value))}>
              {chapterOptions.map(value => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
        </div>

        {loading && <p className="py-12 text-center font-serif italic opacity-60">Opening the text…</p>}
        {error && (
          <div className="my-8 rounded-xl border border-red-500/25 p-5">
            <p className="font-serif">The text could not be opened.</p>
            <p className="mt-2 font-mono text-[10px] opacity-55">{error}</p>
          </div>
        )}

        {!error && chapterHtml && (
          <article className="mx-auto max-w-[42rem] py-10 sm:py-14">
            <div
              className="fetch-bible fb-plain no-notes no-red-letter font-serif text-[1.35rem] leading-[1.95] sm:text-[1.55rem]"
              dir={resources.find(item => item.id === resource)?.direction ?? "ltr"}
              dangerouslySetInnerHTML={{ __html: chapterHtml }}
            />
            {attribution && (
              <div
                className="mt-12 border-t pt-5 font-mono text-xs leading-relaxed opacity-50 [&_a]:underline [&_a]:underline-offset-4"
                dangerouslySetInnerHTML={{ __html: attribution }}
              />
            )}
          </article>
        )}

        <nav className="sticky bottom-4 mx-auto flex max-w-[42rem] items-center justify-between gap-4 rounded-full border border-accent/20 bg-black/75 px-4 py-3 text-stone-100 backdrop-blur-xl">
          <button type="button" className="font-mono text-[10px] uppercase tracking-widest disabled:opacity-25" disabled={chapter <= 1 || loading} onClick={() => setChapter(value => Math.max(1, value - 1))}>Previous</button>
          <span className="font-serif text-sm italic">Chapter {chapter}</span>
          <button type="button" className="font-mono text-[10px] uppercase tracking-widest disabled:opacity-25" disabled={chapter >= chapterCount || loading} onClick={() => setChapter(value => Math.min(chapterCount, value + 1))}>Next</button>
        </nav>
      </main>
    </div>
  );
}
