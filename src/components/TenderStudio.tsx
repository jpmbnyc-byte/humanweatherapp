import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronDown,
  Download,
  ImagePlus,
  LockKeyhole,
  Pause,
  Play,
  Sparkles,
  X,
} from 'lucide-react';
import { PRESETS } from '../data/presets';
import { useSpokenProse } from '../hooks/useSpokenProse';
import { useEntitlement } from '../lib/EntitlementContext';
import PurchaseOffer from './PurchaseOffer';
import {
  saveTenderStudioCard,
  TENDER_STUDIO_WATERMARK,
  type TenderAspect,
} from '../lib/tenderStudioExport';

const ORIENTATION_KEY = 'hw-tender-studio-orientation-v1';
const SAMPLE = 'The fallow ground is where roots grow in darkness.';
const ASPECTS: TenderAspect[] = ['9:16', '4:5', '1:1', '16:9'];

export default function TenderStudio({ currentTheme }: { currentTheme: 'day' | 'night' }) {
  const isNight = currentTheme === 'night';
  const { effective, loading } = useEntitlement();
  const unlocked = effective === 'member' || effective === 'trial';
  const [source, setSource] = useState<'library' | 'own'>('library');
  const [text, setText] = useState(SAMPLE);
  const [aspect, setAspect] = useState<TenderAspect>('9:16');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [orientationOpen, setOrientationOpen] = useState(false);
  const [orientationAvailable, setOrientationAvailable] = useState(false);
  const [exportState, setExportState] = useState<'idle' | 'working' | 'shared' | 'downloaded' | 'failed'>('idle');
  const fileRef = useRef<HTMLInputElement>(null);
  const { speak, stop, status } = useSpokenProse();

  useEffect(() => {
    if (!unlocked || typeof window === 'undefined') return;
    if (!window.localStorage.getItem(ORIENTATION_KEY)) {
      setOrientationAvailable(true);
      setOrientationOpen(true);
    }
  }, [unlocked]);

  useEffect(() => () => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
  }, [imageUrl]);

  const wordCount = useMemo(() => text.trim().split(/\s+/).filter(Boolean).length, [text]);
  const estimatedSeconds = Math.max(1, Math.round((wordCount / 135) * 60));
  const panel = isNight ? 'border-white/10 bg-black/25' : 'border-stone-200 bg-white/75';
  const muted = isNight ? 'text-white/55' : 'text-stone-600';

  const dismissOrientation = () => {
    setOrientationOpen(false);
    setOrientationAvailable(false);
    window.localStorage.setItem(ORIENTATION_KEY, 'seen');
  };

  const chooseImage = (file?: File) => {
    if (!file || !file.type.startsWith('image/')) return;
    setImageUrl(previous => {
      if (previous) URL.revokeObjectURL(previous);
      return URL.createObjectURL(file);
    });
  };

  const exportCard = async () => {
    if (!text.trim()) return;
    setExportState('working');
    const result = await saveTenderStudioCard({ text: text.trim(), aspect, imageUrl });
    setExportState(result);
  };

  if (loading) return <div className={`h-64 rounded-2xl border animate-pulse ${panel}`} />;

  if (!unlocked) {
    return (
      <section className="space-y-6" id="tender-studio-preview">
        <div className={`rounded-2xl border overflow-hidden ${panel}`}>
          <div className="p-6 md:p-8 border-b border-accent/15">
            <span className="hw-eyebrow">Detailed preview · Member studio</span>
            <h3 className="font-serif text-3xl md:text-4xl mt-2">Turn meaningful words into finished, shareable media.</h3>
            <p className={`hw-section-intro mt-4 max-w-2xl ${muted}`}>
              Choose a passage from Human Weather or bring language of your own. Tender Studio guides the voice,
              visual treatment, format, and final branded export without interpreting or scoring what you write.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-px bg-accent/15">
            {[
              ['01 · Words', 'Begin with a saved passage, a Human Weather excerpt, or language you bring yourself.'],
              ['02 · Direction', 'Audition the reading, set its visual frame, and add your own image.'],
              ['03 · Finish', 'Export a platform-ready composition with quiet Tender Studio attribution.'],
            ].map(([title, copy]) => (
              <div key={title} className={`p-5 ${isNight ? 'bg-[#17140f]' : 'bg-[#faf7f0]'}`}>
                <span className="font-mono text-[10px] uppercase tracking-widest text-accent">{title}</span>
                <p className={`font-sans text-sm leading-relaxed mt-2 ${muted}`}>{copy}</p>
              </div>
            ))}
          </div>
          <div className="p-5 flex items-center gap-3">
            <LockKeyhole className="w-4 h-4 text-accent" />
            <p className={`font-sans text-sm ${muted}`}>Creation and export are available during trial access and with annual membership.</p>
          </div>
        </div>
        <PurchaseOffer currentTheme={currentTheme} />
      </section>
    );
  }

  return (
    <section className="space-y-6" id="tender-studio">
      {orientationAvailable && <div className={`rounded-2xl border ${panel}`}>
        <button
          type="button"
          onClick={() => setOrientationOpen(open => !open)}
          className="w-full flex items-center justify-between gap-4 p-5 text-left cursor-pointer"
          aria-expanded={orientationOpen}
        >
          <span>
            <span className="hw-eyebrow block">A note before the first making</span>
            <span className={`font-sans text-sm ${muted}`}>Your words stay yours. Tender Studio shapes presentation, not meaning.</span>
          </span>
          <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${orientationOpen ? 'rotate-180' : ''}`} />
        </button>
        {orientationOpen && (
          <div className="px-5 pb-5">
            <p className={`font-sans text-sm leading-relaxed max-w-2xl ${muted}`}>
              Move from words to voice, then image and format. Nothing here analyzes, scores, or interprets your language.
              You make the final choice; the studio prepares a file you can save and share yourself.
            </p>
            <button type="button" onClick={dismissOrientation} className="mt-4 font-mono text-[10px] uppercase tracking-widest text-accent cursor-pointer">
              I understand · fold this note
            </button>
          </div>
        )}
      </div>}

      <div className="grid lg:grid-cols-[1.1fr_.9fr] gap-6">
        <div className="space-y-6">
          <div className={`rounded-2xl border p-5 md:p-6 ${panel}`}>
            <div className="flex items-center justify-between gap-3 mb-5">
              <div><span className="hw-eyebrow">01 · Words</span><h3 className="font-serif text-2xl mt-1">Begin with what wants to be heard.</h3></div>
              <span className={`font-mono text-[10px] ${muted}`}>{wordCount} words · ~{estimatedSeconds}s</span>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button type="button" onClick={() => setSource('library')} className={`rounded-xl border px-3 py-3 text-sm cursor-pointer ${source === 'library' ? 'border-accent text-accent' : panel}`}>Choose from the library</button>
              <button type="button" onClick={() => setSource('own')} className={`rounded-xl border px-3 py-3 text-sm cursor-pointer ${source === 'own' ? 'border-accent text-accent' : panel}`}>Bring your own words</button>
            </div>
            {source === 'library' && (
              <div className="flex flex-wrap gap-2 mb-4">
                <button type="button" onClick={() => setText(SAMPLE)} className="rounded-full border border-accent/35 px-3 py-2 text-xs cursor-pointer">The Fallow Ground</button>
                {PRESETS.map(preset => <button key={preset.id} type="button" onClick={() => setText(preset.text)} className="rounded-full border border-accent/20 px-3 py-2 text-xs cursor-pointer">{preset.title}</button>)}
              </div>
            )}
            <textarea
              value={text}
              onChange={event => { stop(); setText(event.target.value); }}
              rows={9}
              maxLength={12000}
              aria-label="Words for Tender Studio"
              placeholder="Paste a passage, a reflection, a prayer, or a few words you want to hear differently…"
              className={`w-full rounded-xl border p-4 font-serif text-lg leading-relaxed resize-y focus:outline-none focus:border-accent ${isNight ? 'bg-black/40 border-white/10 text-white' : 'bg-[#fffdf8] border-stone-300 text-[#2c2824]'}`}
            />
          </div>

          <div className={`rounded-2xl border p-5 md:p-6 ${panel}`}>
            <span className="hw-eyebrow">02 · Voice direction</span>
            <h3 className="font-serif text-2xl mt-1 mb-2">Listen before you finish.</h3>
            <p className={`font-sans text-sm mb-5 ${muted}`}>Audition uses the most natural voice available on this device. Stop, revise, and listen again until the cadence feels true.</p>
            <button
              type="button"
              onClick={() => status === 'speaking' ? stop() : speak(text)}
              disabled={!text.trim()}
              className="inline-flex items-center gap-2 rounded-full border border-accent/45 px-5 py-3 text-accent font-mono text-xs uppercase tracking-widest cursor-pointer disabled:opacity-30"
            >
              {status === 'speaking' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {status === 'speaking' ? 'Stop audition' : 'Audition reading'}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className={`rounded-2xl border p-5 md:p-6 ${panel}`}>
            <span className="hw-eyebrow">03 · Visual frame</span>
            <h3 className="font-serif text-2xl mt-1 mb-4">Give the words a place to live.</h3>
            <div
              className={`relative overflow-hidden rounded-xl aspect-[4/5] flex items-center justify-center bg-[#211c14] bg-cover bg-center border border-accent/15`}
              style={imageUrl ? { backgroundImage: `linear-gradient(rgba(10,9,7,.52),rgba(10,9,7,.52)),url(${imageUrl})` } : undefined}
            >
              <p className="font-serif italic text-xl sm:text-2xl text-[#f6f0e4] leading-snug p-8 line-clamp-6">{text || 'Your words will appear here.'}</p>
              <span className="absolute bottom-4 right-4 font-mono text-[7px] text-white/65">{TENDER_STUDIO_WATERMARK}</span>
            </div>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={event => chooseImage(event.target.files?.[0])} />
            <div className="flex flex-wrap gap-2 mt-4">
              <button type="button" onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-2 rounded-full border border-accent/35 px-4 py-2 text-xs cursor-pointer"><ImagePlus className="w-4 h-4" />Add an image</button>
              {imageUrl && <button type="button" onClick={() => setImageUrl(null)} className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs cursor-pointer"><X className="w-4 h-4" />Remove</button>}
            </div>
          </div>

          <div className={`rounded-2xl border p-5 md:p-6 ${panel}`}>
            <span className="hw-eyebrow">04 · Finish</span>
            <h3 className="font-serif text-2xl mt-1">Prepare the share file.</h3>
            <p className={`font-sans text-sm mt-2 ${muted}`}>Choose the frame for where it will live. The quiet attribution is included automatically.</p>
            <div className="grid grid-cols-4 gap-2 my-4">
              {ASPECTS.map(value => <button key={value} type="button" onClick={() => setAspect(value)} className={`rounded-lg border py-2 text-xs cursor-pointer ${aspect === value ? 'border-accent text-accent' : panel}`}>{value}</button>)}
            </div>
            <button
              type="button"
              onClick={exportCard}
              disabled={!text.trim() || exportState === 'working'}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-accent text-[#211a0d] px-5 py-3 font-mono text-xs uppercase tracking-widest cursor-pointer disabled:opacity-40"
            >
              {exportState === 'working' ? <Sparkles className="w-4 h-4 animate-pulse" /> : <Download className="w-4 h-4" />}
              {exportState === 'working' ? 'Preparing file…' : 'Save or share branded visual'}
            </button>
            {exportState !== 'idle' && exportState !== 'working' && (
              <p className={`font-mono text-[10px] uppercase tracking-wide text-center mt-3 ${exportState === 'failed' ? 'text-red-400' : muted}`} aria-live="polite">
                {exportState === 'shared' ? 'Share sheet opened' : exportState === 'downloaded' ? 'File saved to this device' : 'Export could not be completed'}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
