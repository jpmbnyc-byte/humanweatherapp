import { calculateSunPosition } from '../utils/solar';

export type OfficeId = 'vault' | 'meridian' | 'marrow';

export interface OfficeWindow {
  id: OfficeId;
  name: string;
  designation: string;
  startTime: string;
  endTime: string;
  wash: '--hw-dawn' | '--hw-noon' | '--hw-dusk';
  question: string;
  durationHint: string;
}

export interface SolarSchedule {
  sunrise: string;
  noon: string;
  sunset: string;
  city: string;
  activeOffice: OfficeId | null;
  offices: OfficeWindow[];
  locationLabel: string;
}

function parseTimeToMinutes(time: string): number {
  if (time === '--:--') return -1;
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(mins: number): string {
  const h = Math.floor((mins + 1440) % 1440 / 60);
  const m = Math.floor((mins + 1440) % 1440 % 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

function isInWindow(nowMins: number, startMins: number, endMins: number): boolean {
  if (startMins < 0 || endMins < 0) return false;
  if (endMins < startMins) {
    return nowMins >= startMins || nowMins <= endMins;
  }
  return nowMins >= startMins && nowMins <= endMins;
}

export function computeSolarSchedule(
  lat: number,
  lon: number,
  city = 'Your meridian',
  date = new Date(),
): SolarSchedule {
  const sun = calculateSunPosition(lat, lon, date);
  const sunriseMins = parseTimeToMinutes(sun.sunrise);
  const noonMins = parseTimeToMinutes(sun.noon);
  const sunsetMins = parseTimeToMinutes(sun.sunset);

  const vaultEnd = sunriseMins + 90;
  const meridianStart = noonMins - 30;
  const meridianEnd = noonMins + 30;
  const marrowStart = sunsetMins - 60;
  const marrowEnd = sunsetMins + 90;

  const nowMins = date.getHours() * 60 + date.getMinutes();

  const offices: OfficeWindow[] = [
    {
      id: 'vault',
      name: 'THE VAULT',
      designation: 'OBS/01 · SUNRISE · THORACIC OPENING',
      startTime: sun.sunrise,
      endTime: minutesToTime(vaultEnd),
      wash: '--hw-dawn',
      question: 'What is rising in your chest this morning?',
      durationHint: '~60s',
    },
    {
      id: 'meridian',
      name: 'THE MERIDIAN',
      designation: 'OBS/02 · SOLAR NOON · STANDING COLUMN',
      startTime: minutesToTime(meridianStart),
      endTime: minutesToTime(meridianEnd),
      wash: '--hw-noon',
      question: 'Where does the light fall on you at this hour?',
      durationHint: '<30s',
    },
    {
      id: 'marrow',
      name: 'THE MARROW',
      designation: 'OBS/03 · SUNSET · DEEP INTERIOR',
      startTime: minutesToTime(marrowStart),
      endTime: minutesToTime(marrowEnd),
      wash: '--hw-dusk',
      question: 'What settled in you today?',
      durationHint: '2–3 min',
    },
  ];

  let activeOffice: OfficeId | null = null;
  if (isInWindow(nowMins, sunriseMins, vaultEnd)) activeOffice = 'vault';
  else if (isInWindow(nowMins, meridianStart, meridianEnd)) activeOffice = 'meridian';
  else if (isInWindow(nowMins, marrowStart, marrowEnd)) activeOffice = 'marrow';

  return {
    sunrise: sun.sunrise,
    noon: sun.noon,
    sunset: sun.sunset,
    city,
    activeOffice,
    offices,
    locationLabel: city,
  };
}

export const DEFAULT_COORDS = { lat: 40.7128, lon: -74.006 };
