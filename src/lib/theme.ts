export type AppTheme = 'day' | 'night';

/** Reference palette — purple row from design system */
export const PALETTE = {
  purple950: '#08011B',
  purple900: '#29105A',
  purple800: '#46238D',
  purple700: '#654487',
  purple500: '#8C6CD0',
  purple400: '#9390FF',
  purple200: '#CCCAFF',
  purple100: '#D4D3F9',
} as const;

export function getAccentHex(theme: AppTheme): string {
  return theme === 'night' ? PALETTE.purple500 : PALETTE.purple700;
}

export function getAccentLightHex(theme: AppTheme): string {
  return theme === 'night' ? PALETTE.purple400 : PALETTE.purple500;
}

export function getThemeStyles(theme: AppTheme) {
  const isNight = theme === 'night';

  return {
    bg: isNight
      ? 'bg-gradient-to-b from-[#08011B] via-[#29105A] to-[#08011B]'
      : 'bg-gradient-to-b from-[#CCCAFF] via-[#D4D3F9] to-[#9390FF]/25',
    text: isNight ? 'text-[#D4D3F9]' : 'text-[#29105A]',
    textMuted: isNight ? 'text-[#CCCAFF]/65' : 'text-[#46238D]/70',
    accent: isNight ? 'text-[#8C6CD0]' : 'text-[#654487]',
    border: isNight ? 'border-white/[0.08]' : 'border-[#8C6CD0]/25',
    cardBg: isNight
      ? 'bg-[#29105A]/75 border-white/[0.06] backdrop-blur-md'
      : 'bg-white/80 border-[#CCCAFF]/50 backdrop-blur-md shadow-lg shadow-[#8C6CD0]/10',
    innerBg: isNight
      ? 'bg-black/40 border-white/5'
      : 'bg-[#CCCAFF]/25 border-[#8C6CD0]/15',
    tabActive: isNight
      ? 'bg-[#8C6CD0] text-white border-[#8C6CD0] shadow-md shadow-[#8C6CD0]/20'
      : 'bg-gradient-to-r from-[#654487] to-[#8C6CD0] text-white border-[#654487] shadow-md shadow-[#8C6CD0]/15 font-medium',
    tabInactive: isNight
      ? 'bg-black/20 hover:bg-[#8C6CD0]/10 text-[#CCCAFF]/55 border-transparent'
      : 'bg-white/50 hover:bg-white text-[#46238D] border-transparent',
    pillActive: isNight
      ? 'bg-[#8C6CD0] border-[#8C6CD0] text-white shadow-md shadow-[#8C6CD0]/15'
      : 'bg-gradient-to-r from-[#654487] to-[#8C6CD0] border-[#654487] text-white shadow-md shadow-[#8C6CD0]/10',
    pillInactive: isNight
      ? 'bg-transparent border-[#8C6CD0]/30 text-[#8C6CD0] hover:bg-[#8C6CD0]/10'
      : 'bg-transparent border-[#8C6CD0]/35 text-[#654487] hover:border-[#8C6CD0]/50 hover:bg-white/60',
    accentHex: getAccentHex(theme),
    accentLightHex: getAccentLightHex(theme),
  };
}
