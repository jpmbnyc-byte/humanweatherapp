import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Camera, ImagePlus, RefreshCw, UserRound, X } from "lucide-react";
import {
  makeSomaticPortrait,
  generateSomaticFigure,
  saveSomaticFigure,
  SomaticFigurePreference,
  StandardFigure,
} from "../lib/somaticFigure";
import SomaticBodyFigure from "./SomaticBodyFigure";

type Props = {
  currentTheme: "day" | "night";
  open: boolean;
  preference: SomaticFigurePreference;
  onClose: () => void;
  onSave: (preference: SomaticFigurePreference) => void;
};

export default function SomaticFigureSetup({
  currentTheme,
  open,
  preference,
  onClose,
  onSave,
}: Props) {
  const libraryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(
    preference.kind === "likeness" ? (preference.portrait ?? null) : null,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  const commit = (next: SomaticFigurePreference) => {
    saveSomaticFigure(next);
    onSave(next);
    onClose();
  };

  const chooseStandard = (standard: StandardFigure) => {
    setPreview(null);
    commit({ kind: "standard", standard });
  };

  const handlePhoto = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const selfie = await makeSomaticPortrait(file);
      setPreview(await generateSomaticFigure(selfie));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "That photo could not be prepared.");
    } finally {
      setBusy(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-black/45 p-0 backdrop-blur-sm sm:items-center sm:p-5"
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="somatic-figure-title"
        className={`max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-[2rem] border p-6 shadow-2xl sm:rounded-[2rem] sm:p-8 ${
          currentTheme === "night"
            ? "border-white/10 bg-[#171713] text-[#f3efe8]"
            : "border-stone-200 bg-[#f4efe5] text-[#302a24]"
        }`}
      >
        <div className="flex items-start justify-between gap-5">
          <div>
            <span className="hw-eyebrow mb-2 block">Your figure</span>
            <h2 id="somatic-figure-title" className="font-serif text-3xl leading-tight">
              Create your figure.
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close figure setup"
            className="hw-pressable rounded-full border border-current/15 p-2"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-4 font-sans text-base leading-relaxed opacity-75">
          One clear selfie becomes engraved linework for the face, hair, and beard, integrated
          into the Human Weather manuscript body entirely on this device.
        </p>

        {preview ? (
          <div className="mt-6">
            <div className="relative mx-auto aspect-[5/9] w-52 overflow-hidden rounded-[1.5rem] border border-accent/20 bg-[#eee5d7] shadow-inner">
              <SomaticBodyFigure currentTheme="day" preference={{ kind: "likeness", standard: preference.standard, portrait: preview }} />
              <span className="sr-only">Preview of your prepared somatic figure</span>
            </div>
            <div className="mt-6 grid gap-2.5">
              <button
                type="button"
                onClick={() =>
                  commit({ kind: "likeness", standard: preference.standard, portrait: preview })
                }
                className="hw-pressable min-h-12 rounded-full bg-accent px-5 py-3 font-mono text-sm uppercase tracking-[0.12em] text-[#171713]"
              >
                Use this figure
              </button>
              <button
                type="button"
                onClick={() => libraryInputRef.current?.click()}
                className="hw-pressable flex min-h-12 items-center justify-center gap-2 rounded-full border border-current/15 px-5 py-3 font-sans text-base"
              >
                <RefreshCw className="h-4 w-4" /> Choose another photo
              </button>
              <button
                type="button"
                onClick={() => setPreview(null)}
                className="hw-pressable min-h-11 rounded-full px-5 py-2.5 font-sans text-sm opacity-65"
              >
                Use a standard figure
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-6 grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => libraryInputRef.current?.click()}
                disabled={busy}
                className="hw-pressable flex min-h-14 items-center justify-center gap-2 rounded-full bg-accent px-4 py-3 font-mono text-xs uppercase tracking-[0.1em] text-[#171713] disabled:opacity-55"
              >
                <ImagePlus className="h-5 w-5" /> {busy ? "Drawing…" : "Upload photo"}
              </button>
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                disabled={busy}
                className="hw-pressable flex min-h-14 items-center justify-center gap-2 rounded-full border border-current/15 px-4 py-3 font-mono text-xs uppercase tracking-[0.1em] disabled:opacity-55"
              >
                <Camera className="h-5 w-5" /> Take selfie
              </button>
            </div>
            <div className="flex items-center gap-3 py-1 text-xs uppercase tracking-[0.14em] opacity-45">
              <span className="h-px flex-1 bg-current" />
              or
              <span className="h-px flex-1 bg-current" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => chooseStandard("woman")}
                className="hw-pressable flex min-h-12 items-center justify-center gap-2 rounded-full border border-current/15 px-4 font-sans text-base"
              >
                <UserRound className="h-4 w-4" /> Woman
              </button>
              <button
                type="button"
                onClick={() => chooseStandard("man")}
                className="hw-pressable flex min-h-12 items-center justify-center gap-2 rounded-full border border-current/15 px-4 font-sans text-base"
              >
                <UserRound className="h-4 w-4" /> Man
              </button>
            </div>
          </div>
        )}

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-xl border border-red-500/20 bg-red-500/5 p-3 font-sans text-sm text-red-500"
          >
            {error}
          </p>
        )}
        <p className="mt-6 border-t border-current/10 pt-4 font-sans text-sm leading-relaxed opacity-55">
          Your selfie never leaves this device. The completed figure is saved only on this device.
          It is never used to interpret mood,
          health, identity, or the places you touch.
        </p>
        <input
          ref={libraryInputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(event) => {
            void handlePhoto(event.target.files?.[0]);
            event.currentTarget.value = "";
          }}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="user"
          className="sr-only"
          onChange={(event) => {
            void handlePhoto(event.target.files?.[0]);
            event.currentTarget.value = "";
          }}
        />
      </section>
    </div>,
    document.body,
  );
}
