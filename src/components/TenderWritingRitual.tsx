import React, { useEffect, useRef, useState } from 'react';
import {
  ChevronDown,
  Clock3,
  LockKeyhole,
  Play,
  RotateCcw,
  Square,
  Trash2,
} from 'lucide-react';
import {
  keepTenderPage,
  loadTenderPages,
  removeTenderPage,
  tenderPageText,
  type TenderPage,
  type TenderPromptId,
} from '../lib/tenderPages';

type Props = {
  currentTheme: 'day' | 'night';
  isSpeaking: boolean;
  onHear: (text: string) => void;
  onStop: () => void;
};

type Phase = 'arrive' | 'write' | 'turn' | 'close';

const DURATIONS = [5, 10, 15] as const;
const PROMPTS: ReadonlyArray<{
  id: TenderPromptId;
  title: string;
  line: string;
  depth: string;
}> = [
  { id: 'present', title: 'What is present?', line: 'Begin with what you notice now.', depth: 'Gentle' },
  { id: 'returning', title: 'What keeps returning?', line: 'Follow the thought asking for attention.', depth: 'Open' },
  { id: 'unsaid', title: 'What have I not said?', line: 'Only enter what feels safe to meet today.', depth: 'Deeper' },
  { id: 'open', title: 'Write without a prompt', line: 'Let the first true sentence choose the direction.', depth: 'Free' },
];

const TURNS = [
  'What do I understand now?',
  'How might tomorrow’s self see this?',
  'What would compassion notice?',
] as const;

function formatRemaining(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${String(remainder).padStart(2, '0')}`;
}

function formatPageDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Kept page';
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export default function TenderWritingRitual({ currentTheme, isSpeaking, onHear, onStop }: Props) {
  const [phase, setPhase] = useState<Phase>('arrive');
  const [duration, setDuration] = useState<(typeof DURATIONS)[number]>(10);
  const [promptId, setPromptId] = useState<TenderPromptId>('present');
  const [body, setBody] = useState('');
  const [turnPrompt, setTurnPrompt] = useState<(typeof TURNS)[number]>(TURNS[0]);
  const [turnText, setTurnText] = useState('');
  const [stone, setStone] = useState('');
  const [remaining, setRemaining] = useState(duration * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [pages, setPages] = useState<TenderPage[]>(() => loadTenderPages());
  const [pagesOpen, setPagesOpen] = useState(false);
  const [kept, setKept] = useState<'page' | 'stone' | null>(null);
  const [releaseArmed, setReleaseArmed] = useState(false);
  const [deleteArmedId, setDeleteArmedId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isNight = currentTheme === 'night';
  const selectedPrompt = PROMPTS.find(prompt => prompt.id === promptId) ?? PROMPTS[0];

  useEffect(() => {
    if (!timerRunning || phase !== 'write') return;
    const timer = window.setInterval(() => {
      setRemaining(previous => Math.max(0, previous - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [phase, timerRunning]);

  useEffect(() => {
    if (phase !== 'write' || remaining > 0) return;
    setTimerRunning(false);
    setPhase('turn');
  }, [phase, remaining]);

  useEffect(() => {
    if (phase === 'write') textareaRef.current?.focus();
  }, [phase]);

  const begin = () => {
    onStop();
    setRemaining(duration * 60);
    setTimerRunning(true);
    setReleaseArmed(false);
    setPhase('write');
  };

  const moveToTurn = () => {
    setTimerRunning(false);
    setPhase('turn');
  };

  const moveToClose = () => {
    setTimerRunning(false);
    setPhase('close');
  };

  const currentText = [body.trim(), turnText.trim()].filter(Boolean).join('\n\n');

  const keepPage = () => {
    if (!currentText) return;
    const next = keepTenderPage({
      promptId,
      durationMinutes: duration,
      body: body.trim(),
      turnPrompt: turnText.trim() ? turnPrompt : undefined,
      turnText: turnText.trim() || undefined,
      stone: stone.trim() || undefined,
    });
    setPages(next);
    setKept('page');
  };

  const keepStone = () => {
    if (!stone.trim()) return;
    const next = keepTenderPage({
      promptId,
      durationMinutes: duration,
      body: '',
      stone: stone.trim(),
    });
    setPages(next);
    setKept('stone');
  };

  const releaseDraft = () => {
    if (!releaseArmed) {
      setReleaseArmed(true);
      return;
    }
    onStop();
    setBody('');
    setTurnText('');
    setStone('');
    setKept(null);
    setReleaseArmed(false);
    setPhase('arrive');
  };

  const beginAgain = () => {
    onStop();
    setBody('');
    setTurnText('');
    setStone('');
    setKept(null);
    setReleaseArmed(false);
    setRemaining(duration * 60);
    setPhase('arrive');
  };

  const releaseKeptPage = (id: string) => {
    if (deleteArmedId !== id) {
      setDeleteArmedId(id);
      return;
    }
    setPages(removeTenderPage(id));
    setDeleteArmedId(null);
  };

  const panel = isNight
    ? 'border-white/10 bg-black/25 text-white'
    : 'border-stone-200 bg-[#fbfaf7] text-[#2c2824]';
  const quiet = isNight ? 'text-white/55' : 'text-stone-600';
  const choice = isNight
    ? 'border-white/10 bg-white/[0.025] hover:border-accent/35'
    : 'border-stone-200 bg-white hover:border-[#b8956b]/60';
  const activeChoice = isNight
    ? 'border-accent/60 bg-accent/10 text-accent'
    : 'border-[#8a6f2e]/55 bg-[#8a6f2e]/[0.06] text-[#59451e]';

  return (
    <section className={`relative z-10 rounded-2xl border p-5 sm:p-7 ${panel}`} aria-labelledby="tender-writing-title">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <span className="hw-eyebrow block mb-1">Private writing ritual</span>
          <h3 id="tender-writing-title" className="font-serif text-2xl sm:text-3xl leading-tight">
            Write what is here
          </h3>
        </div>
        <div className={`hidden sm:flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider ${quiet}`}>
          <LockKeyhole className="w-3.5 h-3.5" aria-hidden /> On this device
        </div>
      </div>

      {phase === 'arrive' && (
        <div className="space-y-7">
          <div className={`rounded-xl border px-4 py-3 ${isNight ? 'border-white/8 bg-white/[0.025]' : 'border-stone-200 bg-white/70'}`}>
            <p className="font-serif text-base italic">This is yours. Write honestly, imperfectly, and without an audience.</p>
            <p className={`font-sans text-sm mt-2 leading-relaxed ${quiet}`}>
              Human Weather does not analyze, score, or interpret these words. If writing becomes too much, stop and return to breath or something familiar in the room.
            </p>
          </div>

          <fieldset>
            <legend className="hw-eyebrow mb-3">Choose a container</legend>
            <div className="grid grid-cols-3 gap-2">
              {DURATIONS.map(option => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={duration === option}
                  onClick={() => setDuration(option)}
                  className={`rounded-xl border px-2 py-3 text-center cursor-pointer transition-colors ${duration === option ? activeChoice : choice}`}
                >
                  <span className="font-serif text-xl block">{option}</span>
                  <span className="font-mono text-[9px] uppercase tracking-wider opacity-60">minutes</span>
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="hw-eyebrow mb-3">Choose a doorway</legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PROMPTS.map(prompt => (
                <button
                  key={prompt.id}
                  type="button"
                  aria-pressed={promptId === prompt.id}
                  onClick={() => setPromptId(prompt.id)}
                  className={`rounded-xl border p-4 text-left cursor-pointer transition-colors ${promptId === prompt.id ? activeChoice : choice}`}
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className="font-serif text-lg">{prompt.title}</span>
                    <span className="font-mono text-[9px] uppercase tracking-wider opacity-45">{prompt.depth}</span>
                  </span>
                  <span className="font-sans text-sm opacity-60 block mt-1">{prompt.line}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <button
            type="button"
            onClick={begin}
            className={`hw-pressable w-full rounded-full px-5 py-3 font-sans font-medium cursor-pointer ${isNight ? 'bg-accent text-[#17140f]' : 'bg-[#2c2824] text-white'}`}
          >
            Enter the page
          </button>
        </div>
      )}

      {phase === 'write' && (
        <div>
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <span className="hw-eyebrow block mb-1">Pour</span>
              <p className="font-serif text-xl">{selectedPrompt.title}</p>
            </div>
            <button
              type="button"
              onClick={() => setTimerRunning(running => !running)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-xs cursor-pointer ${choice}`}
              aria-label={timerRunning ? 'Pause writing timer' : 'Continue writing timer'}
            >
              <Clock3 className="w-3.5 h-3.5" aria-hidden /> {formatRemaining(remaining)}
            </button>
          </div>
          <textarea
            ref={textareaRef}
            value={body}
            onChange={event => setBody(event.target.value)}
            className={`w-full min-h-[42vh] resize-y rounded-xl border p-4 sm:p-5 font-serif text-lg leading-relaxed outline-none focus:border-accent/50 ${isNight ? 'border-white/10 bg-black/35 text-white placeholder:text-white/25' : 'border-stone-200 bg-white text-[#2c2824] placeholder:text-stone-400'}`}
            placeholder="Begin anywhere. Spelling, order, and polish do not matter."
            aria-label="Private Tender writing page"
          />
          <div className="flex items-center justify-between gap-3 mt-4">
            <p className={`font-sans text-xs ${quiet}`}>Nothing is saved until you choose to keep it.</p>
            <button type="button" onClick={moveToTurn} className="font-sans text-sm text-accent cursor-pointer">
              {body.trim() ? 'Turn the page →' : 'Skip this page →'}
            </button>
          </div>
        </div>
      )}

      {phase === 'turn' && (
        <div>
          <span className="hw-eyebrow block mb-1">Turn · optional</span>
          <h4 className="font-serif text-2xl mb-2">A second vantage</h4>
          <p className={`font-sans text-sm leading-relaxed mb-5 ${quiet}`}>
            Do not force a lesson. Choose another angle only if it opens something new.
          </p>
          <div className="flex flex-wrap gap-2 mb-4" role="radiogroup" aria-label="Perspective prompt">
            {TURNS.map(prompt => (
              <button
                key={prompt}
                type="button"
                role="radio"
                aria-checked={turnPrompt === prompt}
                onClick={() => setTurnPrompt(prompt)}
                className={`rounded-full border px-3 py-2 font-sans text-sm cursor-pointer ${turnPrompt === prompt ? activeChoice : choice}`}
              >
                {prompt}
              </button>
            ))}
          </div>
          <textarea
            value={turnText}
            onChange={event => setTurnText(event.target.value)}
            rows={6}
            className={`w-full resize-y rounded-xl border p-4 font-serif text-lg leading-relaxed outline-none focus:border-accent/50 ${isNight ? 'border-white/10 bg-black/35 text-white placeholder:text-white/25' : 'border-stone-200 bg-white text-[#2c2824] placeholder:text-stone-400'}`}
            placeholder={turnPrompt}
          />
          <div className="flex justify-between gap-3 mt-4">
            <button type="button" onClick={() => setPhase('write')} className={`font-sans text-sm cursor-pointer ${quiet}`}>← Return</button>
            <button type="button" onClick={moveToClose} className="font-sans text-sm text-accent cursor-pointer">Close the page →</button>
          </div>
        </div>
      )}

      {phase === 'close' && (
        <div>
          <span className="hw-eyebrow block mb-1">Close</span>
          <h4 className="font-serif text-2xl mb-2">Choose what remains</h4>
          <p className={`font-sans text-sm mb-5 ${quiet}`}>Keeping, carrying one line, and releasing are equally complete endings.</p>

          <label className="block mb-5">
            <span className="hw-eyebrow block mb-2">One line to carry · optional</span>
            <input
              type="text"
              value={stone}
              onChange={event => setStone(event.target.value)}
              className={`w-full rounded-xl border px-4 py-3 font-serif text-lg outline-none focus:border-accent/50 ${isNight ? 'border-white/10 bg-black/35 text-white' : 'border-stone-200 bg-white text-[#2c2824]'}`}
              placeholder="A sentence, word, or sensation"
            />
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button type="button" onClick={keepPage} disabled={!currentText || kept !== null} className={`rounded-xl border p-4 text-left cursor-pointer disabled:opacity-45 ${choice}`}>
              <span className="font-serif text-lg block">Keep the page</span>
              <span className={`font-sans text-xs block mt-1 ${quiet}`}>Private on this device</span>
            </button>
            <button type="button" onClick={keepStone} disabled={!stone.trim() || kept !== null} className={`rounded-xl border p-4 text-left cursor-pointer disabled:opacity-45 ${choice}`}>
              <span className="font-serif text-lg block">Keep one line</span>
              <span className={`font-sans text-xs block mt-1 ${quiet}`}>Release the full page</span>
            </button>
            <button type="button" onClick={releaseDraft} disabled={kept !== null} className={`rounded-xl border p-4 text-left cursor-pointer disabled:opacity-40 ${releaseArmed ? 'border-red-400/60 text-red-500' : choice}`}>
              <span className="font-serif text-lg block">{releaseArmed ? 'Confirm release' : 'Release the page'}</span>
              <span className={`font-sans text-xs block mt-1 ${releaseArmed ? 'opacity-80' : quiet}`}>{releaseArmed ? 'This cannot be recovered' : 'Keep no written record'}</span>
            </button>
          </div>

          {kept && (
            <p className={`mt-4 font-sans text-sm ${isNight ? 'text-accent' : 'text-[#6e5623]'}`} aria-live="polite">
              {kept === 'page' ? 'Page kept privately on this device.' : 'One line kept. The full page was not stored.'}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2 mt-5 pt-5 border-t border-current/10">
            <button
              type="button"
              onClick={() => isSpeaking ? onStop() : onHear(currentText || stone.trim())}
              disabled={!(currentText || stone.trim())}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 font-sans text-sm cursor-pointer disabled:opacity-40 ${choice}`}
            >
              {isSpeaking ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              {isSpeaking ? 'Stop' : 'Hear this back'}
            </button>
            <button type="button" onClick={beginAgain} className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 font-sans text-sm cursor-pointer ${choice}`}>
              <RotateCcw className="w-3.5 h-3.5" aria-hidden /> Begin again
            </button>
          </div>
        </div>
      )}

      <div className="mt-7 pt-5 border-t border-current/10">
        <button
          type="button"
          onClick={() => setPagesOpen(open => !open)}
          aria-expanded={pagesOpen}
          className="w-full flex items-center justify-between gap-3 text-left cursor-pointer"
        >
          <span>
            <span className="hw-eyebrow block">Kept pages</span>
            <span className={`font-sans text-sm ${quiet}`}>{pages.length ? `${pages.length} private on this device` : 'Nothing kept yet'}</span>
          </span>
          <ChevronDown className={`w-4 h-4 transition-transform ${pagesOpen ? 'rotate-180' : ''}`} aria-hidden />
        </button>

        {pagesOpen && pages.length > 0 && (
          <ul className="mt-4 space-y-3" role="list">
            {pages.slice(0, 12).map(page => (
              <li key={page.id} className={`rounded-xl border p-4 ${choice}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <span className={`font-mono text-[9px] uppercase tracking-wider ${quiet}`}>{formatPageDate(page.createdAt)}</span>
                    <p className="font-serif text-base leading-relaxed mt-1 line-clamp-2">
                      {page.stone || page.body || page.turnText || 'Kept page'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button type="button" onClick={() => onHear(tenderPageText(page))} aria-label="Hear kept page" className="p-2 rounded-full cursor-pointer hover:bg-current/5">
                      <Play className="w-3.5 h-3.5" aria-hidden />
                    </button>
                    <button type="button" onClick={() => releaseKeptPage(page.id)} aria-label={deleteArmedId === page.id ? 'Confirm release kept page' : 'Release kept page'} className={`p-2 rounded-full cursor-pointer ${deleteArmedId === page.id ? 'text-red-500' : quiet}`}>
                      <Trash2 className="w-3.5 h-3.5" aria-hidden />
                    </button>
                  </div>
                </div>
                {deleteArmedId === page.id && <p className="font-sans text-xs text-red-500 mt-2">Tap release once more to permanently remove this page.</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
