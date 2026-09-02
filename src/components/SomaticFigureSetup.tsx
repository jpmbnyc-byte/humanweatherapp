import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { Check, X } from "lucide-react";
import { saveSomaticFigure, SomaticFigurePreference, StandardFigure } from "../lib/somaticFigure";
import SomaticBodyFigure from "./SomaticBodyFigure";

type Props = { currentTheme: "day" | "night"; open: boolean; preference: SomaticFigurePreference; onClose: () => void; onSave: (preference: SomaticFigurePreference) => void };

export default function SomaticFigureSetup({ currentTheme, open, preference, onClose, onSave }: Props) {
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [open]);
  if (!open || typeof document === "undefined") return null;
  const choose = (standard: StandardFigure) => {
    const next: SomaticFigurePreference = { kind: "standard", standard };
    saveSomaticFigure(next); onSave(next); onClose();
  };
  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/45 backdrop-blur-sm sm:items-center sm:p-5" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section role="dialog" aria-modal="true" aria-labelledby="somatic-figure-title" className={`max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-t-[2rem] border p-6 shadow-2xl sm:rounded-[2rem] sm:p-8 ${currentTheme === "night" ? "border-white/10 bg-[#171713] text-[#f3efe8]" : "border-stone-200 bg-[#f4efe5] text-[#302a24]"}`}>
        <div className="flex items-start justify-between gap-5">
          <div><span className="hw-eyebrow mb-2 block">Body field</span><h2 id="somatic-figure-title" className="font-serif text-3xl">Choose your figure.</h2></div>
          <button type="button" onClick={onClose} aria-label="Close figure selection" className="hw-pressable rounded-full border border-current/15 p-2"><X className="h-5 w-5" /></button>
        </div>
        <p className="mt-3 font-sans text-base leading-relaxed opacity-70">Your choice stays on this device and remains the same each time you return.</p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          {(["woman", "man"] as StandardFigure[]).map((standard) => {
            const selected = preference.kind === "standard" && preference.standard === standard;
            return <button key={standard} type="button" onClick={() => choose(standard)} className={`hw-pressable relative overflow-hidden rounded-[1.5rem] border p-3 ${selected ? "border-accent bg-accent/10" : "border-current/15"}`}>
              <div className="relative mx-auto aspect-[3/5] w-full max-w-40 overflow-hidden rounded-xl bg-[#eee5d7]"><SomaticBodyFigure currentTheme="day" preference={{ kind: "standard", standard }} /></div>
              <span className="mt-3 flex items-center justify-center gap-2 font-mono text-xs uppercase tracking-[0.16em]">{standard}{selected && <Check className="h-4 w-4 text-accent" />}</span>
            </button>;
          })}
        </div>
      </section>
    </div>, document.body,
  );
}
