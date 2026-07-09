// Solar astronomy calculation based on Jean Meeus' astronomical algorithms.

export interface SunData {
  latitude: number;
  longitude: number;
  city: string;
  altitude: number; // degrees above horizon
  azimuth: number; // degrees from North
  sunrise: string; // HH:MM
  noon: string; // HH:MM
  sunset: string; // HH:MM
  uvbStart: string | null;
  uvbEnd: string | null;
  activeRay: string;
  isUvbActive: boolean;
  timeString: string;
}

// Convert degrees to radians
const rad = (deg: number) => (deg * Math.PI) / 180;
// Convert radians to degrees
const deg = (rad: number) => (rad * 180) / Math.PI;

export function calculateSunPosition(
  lat: number,
  lon: number,
  date: Date = new Date()
): SunData {
  // Get time in UTC
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  const seconds = date.getUTCSeconds();

  // Julian Date
  let A = Math.floor(year / 100);
  let B = 2 - A + Math.floor(A / 4);
  let jdY = year;
  let jdM = month;
  if (month <= 2) {
    jdY = year - 1;
    jdM = month + 12;
  }
  let jd = Math.floor(365.25 * (jdY + 4716)) + Math.floor(30.6001 * (jdM + 1)) + day + B - 1524.5;
  
  // Add fraction of the day
  const dayFrac = (hours + minutes / 60 + seconds / 3600) / 24;
  jd += dayFrac;

  // Centuries since J2000.0
  const T = (jd - 2451545.0) / 36525;

  // Sun's mean anomaly (g)
  let g = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
  g = g % 360;

  // Sun's mean longitude (L0)
  let L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
  L0 = L0 % 360;

  // Sun's equation of center (C)
  const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(rad(g)) +
            (0.019993 - 0.000101 * T) * Math.sin(rad(2 * g)) +
            0.000289 * Math.sin(rad(3 * g));

  // Sun's true longitude (lambda)
  const lambda = L0 + C;

  // Obliquity of the ecliptic (epsilon)
  const epsilon = 23.439291 - 0.013004167 * T - 0.00000016399 * T * T;

  // Right Ascension (alpha)
  let alpha = deg(Math.atan2(Math.cos(rad(epsilon)) * Math.sin(rad(lambda)), Math.cos(rad(lambda))));
  alpha = (alpha + 360) % 360;

  // Declination (delta)
  const delta = deg(Math.asin(Math.sin(rad(epsilon)) * Math.sin(rad(lambda))));

  // Greenwich Mean Sidereal Time (GMST) in degrees
  let GMST = 280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * T * T - T * T * T / 38710000;
  GMST = (GMST + 360) % 360;

  // Local Hour Angle (H) in degrees
  let H = GMST + lon - alpha;
  H = (H + 360) % 360;
  if (H > 180) H -= 360;

  // Solar Altitude (a)
  const altRad = Math.asin(
    Math.sin(rad(lat)) * Math.sin(rad(delta)) +
    Math.cos(rad(lat)) * Math.cos(rad(delta)) * Math.cos(rad(H))
  );
  const altitude = deg(altRad);

  // Solar Azimuth (A)
  let azimuth = deg(Math.atan2(
    -Math.sin(rad(H)),
    Math.tan(rad(delta)) * Math.cos(rad(lat)) - Math.sin(rad(lat)) * Math.cos(rad(H))
  ));
  azimuth = (azimuth + 360) % 360;

  // Equation of Time (EoT) in minutes
  // EoT = 4 * (L0 - C - alpha) ... approximate
  // More accurate:
  const yVar = Math.tan(rad(epsilon) / 2) * Math.tan(rad(epsilon) / 2);
  const eot = 4 * deg(
    yVar * Math.sin(2 * rad(L0)) -
    2 * 0.016708 * Math.sin(rad(g)) +
    4 * 0.016708 * yVar * Math.sin(rad(g)) * Math.cos(2 * rad(L0)) -
    0.5 * yVar * yVar * Math.sin(4 * rad(L0)) -
    1.25 * 0.016708 * 0.016708 * Math.sin(2 * rad(g))
  );

  // Standard calculations for Sunrise, Sunset, Solar Noon
  // Local Time Zone Offset in hours
  const localOffset = -date.getTimezoneOffset() / 60;

  // Solar Noon in local decimal hours
  let solarNoonDec = 12 - lon / 15 + localOffset - eot / 60;
  solarNoonDec = (solarNoonDec + 24) % 24;

  // Hour Angle for Sunrise/Sunset at -0.83 degrees altitude
  const cosH0 = (Math.sin(rad(-0.83)) - Math.sin(rad(lat)) * Math.sin(rad(delta))) /
                (Math.cos(rad(lat)) * Math.cos(rad(delta)));

  let sunriseDec: number | null = null;
  let sunsetDec: number | null = null;

  if (cosH0 >= -1 && cosH0 <= 1) {
    const H0 = deg(Math.acos(cosH0));
    sunriseDec = solarNoonDec - H0 / 15;
    sunsetDec = solarNoonDec + H0 / 15;
  }

  const formatTime = (decimalHours: number | null): string => {
    if (decimalHours === null) return '--:--';
    const hrs = Math.floor((decimalHours + 24) % 24);
    const mins = Math.floor((decimalHours * 60) % 60);
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const parseDecimalToMinutes = (dec: number) => {
    return Math.floor(dec * 60);
  };

  // UVB Window: Elevation > 35 degrees
  let uvbStart: string | null = null;
  let uvbEnd: string | null = null;
  let isUvbActive = false;

  const cosH_uvb = (Math.sin(rad(35)) - Math.sin(rad(lat)) * Math.sin(rad(delta))) /
                   (Math.cos(rad(lat)) * Math.cos(rad(delta)));

  if (cosH_uvb >= -1 && cosH_uvb <= 1) {
    const H_uvb = deg(Math.acos(cosH_uvb));
    const uvbStartDec = solarNoonDec - H_uvb / 15;
    const uvbEndDec = solarNoonDec + H_uvb / 15;
    uvbStart = formatTime(uvbStartDec);
    uvbEnd = formatTime(uvbEndDec);

    const currentLocalDec = date.getHours() + date.getMinutes() / 60;
    if (currentLocalDec >= uvbStartDec && currentLocalDec <= uvbEndDec) {
      isUvbActive = true;
    }
  }

  // Determine Active Ray type
  let activeRay = 'Night';
  if (altitude < -0.83) {
    activeRay = 'Night';
  } else if (altitude >= -0.83 && altitude < 6) {
    activeRay = 'The Dawn Protocol (Full Spectrum)';
  } else if (altitude >= 6 && altitude < 20) {
    activeRay = 'Red & Near-Infrared Active';
  } else if (altitude >= 20 && altitude < 35) {
    activeRay = 'UV-A & Visible Light Active';
  } else if (altitude >= 35) {
    activeRay = 'UV-B & Full Solar active';
  }

  return {
    latitude: lat,
    longitude: lon,
    city: 'Detecting...',
    altitude,
    azimuth,
    sunrise: formatTime(sunriseDec),
    noon: formatTime(solarNoonDec),
    sunset: formatTime(sunsetDec),
    uvbStart,
    uvbEnd,
    activeRay,
    isUvbActive,
    timeString: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  };
}

/** Local decimal hours for today's solar marks (sunrise, noon, sunset, astronomical dark). */
export interface DailySolarMarks {
  sunrise: number;
  noon: number;
  sunset: number;
  dark: number;
}

function solarJulianDay(date: Date): number {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  const seconds = date.getUTCSeconds();

  let A = Math.floor(year / 100);
  let B = 2 - A + Math.floor(A / 4);
  let jdY = year;
  let jdM = month;
  if (month <= 2) {
    jdY = year - 1;
    jdM = month + 12;
  }
  let jd = Math.floor(365.25 * (jdY + 4716)) + Math.floor(30.6001 * (jdM + 1)) + day + B - 1524.5;
  jd += (hours + minutes / 60 + seconds / 3600) / 24;
  return jd;
}

export function computeDailySolarMarks(
  lat: number,
  lon: number,
  date: Date = new Date(),
): DailySolarMarks {
  const jd = solarJulianDay(date);
  const T = (jd - 2451545.0) / 36525;

  let g = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
  g = g % 360;

  let L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
  L0 = L0 % 360;

  const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(rad(g)) +
            (0.019993 - 0.000101 * T) * Math.sin(rad(2 * g)) +
            0.000289 * Math.sin(rad(3 * g));

  const lambda = L0 + C;
  const epsilon = 23.439291 - 0.013004167 * T - 0.00000016399 * T * T;
  let alpha = deg(Math.atan2(Math.cos(rad(epsilon)) * Math.sin(rad(lambda)), Math.cos(rad(lambda))));
  alpha = (alpha + 360) % 360;
  const delta = deg(Math.asin(Math.sin(rad(epsilon)) * Math.sin(rad(lambda))));

  const yVar = Math.tan(rad(epsilon) / 2) * Math.tan(rad(epsilon) / 2);
  const eot = 4 * deg(
    yVar * Math.sin(2 * rad(L0)) -
    2 * 0.016708 * Math.sin(rad(g)) +
    4 * 0.016708 * yVar * Math.sin(rad(g)) * Math.cos(2 * rad(L0)) -
    0.5 * yVar * yVar * Math.sin(4 * rad(L0)) -
    1.25 * 0.016708 * 0.016708 * Math.sin(2 * rad(g))
  );

  const localOffset = -date.getTimezoneOffset() / 60;
  let noon = 12 - lon / 15 + localOffset - eot / 60;
  noon = ((noon % 24) + 24) % 24;

  const hourAngleAt = (altDeg: number): number | null => {
    const cosH = (Math.sin(rad(altDeg)) - Math.sin(rad(lat)) * Math.sin(rad(delta))) /
      (Math.cos(rad(lat)) * Math.cos(rad(delta)));
    if (cosH < -1 || cosH > 1) return null;
    return deg(Math.acos(cosH));
  };

  const H0 = hourAngleAt(-0.83);
  let sunrise = H0 !== null ? noon - H0 / 15 : 6;
  let sunset = H0 !== null ? noon + H0 / 15 : 18;

  const HDark = hourAngleAt(-18);
  let dark = HDark !== null ? noon + HDark / 15 : 24;
  if (dark <= sunset) dark = 24;

  return { sunrise, noon, sunset, dark };
}

// Simple OSM Nominatim reverse geocoder
export async function reverseGeocode(lat: number, lon: number): Promise<string> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=en`,
      {
        headers: {
          'User-Agent': 'HumanWeatherApplet/1.0 (jpmbnyc@gmail.com)'
        }
      }
    );
    if (!response.ok) throw new Error('OSM geocoding failed');
    const data = await response.json();
    if (data && data.address) {
      return (
        data.address.city ||
        data.address.town ||
        data.address.village ||
        data.address.suburb ||
        data.address.county ||
        'Somatic Meridian'
      );
    }
    return 'Somatic Meridian';
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    return 'Somatic Meridian';
  }
}
