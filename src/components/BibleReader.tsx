import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  FetchClient,
  type FetchCollection,
  type GetBooksItem,
  type GetLanguagesItem,
  type GetResourcesItem,
} from "@gracious.tech/fetch-client";
import "@gracious.tech/fetch-client/client.css";

type Theme = "day" | "night";

type ReaderMemory = {
  language?: string;
  resource?: string;
  book?: string;
  chapter?: number;
};

const MEMORY_KEY = "hw:bible-reader:v1";

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
  onClose,
}: {
  open: boolean;
  currentTheme: Theme;
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
        const nextBook =
          (memory.book && nextBooks.some(item => item.id === memory.book)
            ? memory.book
            : nextBooks[0]?.id) ?? "";
        setBooks(nextBooks);
        setBook(nextBook);
        setChapter(
          memory.resource === resource && memory.book === nextBook
            ? memory.chapter ?? 1
            : 1,
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
  }, [collection, resource]);

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
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] opacity-50">Human Weather</p>
            <h2 className="font-serif text-2xl text-accent">Scripture</h2>
          </div>
          <button type="button" onClick={onClose} className="hw-btn-ghost" aria-label="Close Bible reader">
            Close
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl px-5 py-6 sm:px-8 sm:py-10">
        <div className={`grid gap-3 rounded-2xl border p-4 sm:grid-cols-4 ${isNight ? "border-white/10 bg-white/[0.03]" : "border-stone-300/70 bg-white/55"}`}>
          <label className="font-mono text-[9px] uppercase tracking-widest opacity-60">
            Language
            <select className="mt-2 w-full bg-transparent font-serif text-sm normal-case" value={language} onChange={event => setLanguage(event.target.value)}>
              {languages.map(item => <option key={item.code} value={item.code}>{item.name_bilingual}</option>)}
            </select>
          </label>
          <label className="font-mono text-[9px] uppercase tracking-widest opacity-60">
            Translation
            <select className="mt-2 w-full bg-transparent font-serif text-sm normal-case" value={resource} onChange={event => setResource(event.target.value)}>
              {resources.map(item => <option key={item.id} value={item.id}>{item.name_local || item.name_english}</option>)}
            </select>
          </label>
          <label className="font-mono text-[9px] uppercase tracking-widest opacity-60">
            Book
            <select className="mt-2 w-full bg-transparent font-serif text-sm normal-case" value={book} onChange={event => { setBook(event.target.value); setChapter(1); }}>
              {books.map(item => <option key={item.id} value={item.id}>{item.name_local || item.name_english}</option>)}
            </select>
          </label>
          <label className="font-mono text-[9px] uppercase tracking-widest opacity-60">
            Chapter
            <select className="mt-2 w-full bg-transparent font-serif text-sm normal-case" value={chapter} onChange={event => setChapter(Number(event.target.value))}>
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
              className="fetch-bible fb-plain no-notes no-red-letter font-serif text-[1.15rem] leading-[1.9] sm:text-[1.28rem]"
              dir={resources.find(item => item.id === resource)?.direction ?? "ltr"}
              dangerouslySetInnerHTML={{ __html: chapterHtml }}
            />
            {attribution && (
              <p className="mt-12 border-t pt-5 font-mono text-[9px] leading-relaxed opacity-45">{attribution}</p>
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
