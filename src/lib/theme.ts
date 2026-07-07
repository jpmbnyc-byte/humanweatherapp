export type AppTheme = 'day' | 'night';

/** Warm gallery neutrals — canvas, not color wash */
export const PALETTE = {
  cream: '#faf8f5',
  parchment: '#f3efe8',
  stone: '#e8e2d8',
  charcoal: '#1a1814',
  ink: '#2c2824',
  warmGray: '#6b6560',
  gold: '#c4a044',
  goldLight: '#d4b85a',
  goldMuted: '#b8956b',
} as const;

export function getAccentHex(theme: AppTheme): string {
  return theme === 'night' ? PALETTE.goldLight : PALETTE.gold;
}

export function getAccentLightHex(theme: AppTheme): string {
  return theme === 'night' ? '#e8cc6a' : PALETTE.goldMuted;
}

export function getThemeStyles(theme: AppTheme) {
  const isNight = theme === 'night';

  return {
    bg: isNight
      ? 'bg-[#141210]'
      : 'bg-[#faf8f5]',
    text: isNight ? 'text-[#f5f0e8]' : 'text-[#2c2824]',
    textMuted: isNight ? 'text-[#a8a096]' : 'text-[#6b6560]',
    accent: isNight ? 'text-[#d4b85a]' : 'text-[#8a6f2e]',
    accentBody: isNight ? 'text-[#d4b85a]' : 'text-[#2c2824]',
    border: isNight ? 'border-white/[0.07]' : 'border-stone-300/50',
    cardBg: isNight
      ? 'bg-[#1e1c18]/90 border-white/[0.06]'
      : 'bg-white/90 border-stone-200/60 shadow-sm shadow-stone-900/5',
    innerBg: isNight
      ? 'bg-black/25 border-white/[0.05]'
      : 'bg-[#f3efe8]/60 border-stone-200/40',
    tabActive: isNight
      ? 'bg-white/[0.07] text-[#f5f0e8] border-[#d4b85a]/35 ring-1 ring-[#d4b05a]/25'
      : 'bg-white text-[#2c2824] border-stone-200/70 shadow-sm ring-1 ring-[#c4a044]/25',
    tabInactive: isNight
      ? 'bg-transparent hover:bg-white/[0.04] text-[#a8a096] border-transparent'
      : 'bg-transparent hover:bg-white/60 text-[#6b6560] border-transparent',
    pillActive: isNight
      ? 'bg-[#d4b05a]/15 border-[#d4b05a]/40 text-[#e8cc6a]'
      : 'bg-[#c4a044]/10 border-[#c4a044]/35 text-[#8a6f2e]',
    pillInactive: isNight
      ? 'bg-transparent border-white/10 text-[#a8a096] hover:border-[#d4b05a]/25 hover:text-[#d4b85a]'
      : 'bg-transparent border-stone-300/50 text-[#6b6560] hover:border-stone-400/60 hover:text-[#2c2824]',
    accentHex: getAccentHex(theme),
    accentLightHex: getAccentLightHex(theme),
  };
}
