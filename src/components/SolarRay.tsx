import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { calculateSunPosition, reverseGeocode, SunData } from '../utils/solar';
import { SOLAR_PROTOCOLS } from '../data';
import { Sun, Compass, MapPin, AlertCircle, Sparkles, CheckCircle2, Circle } from 'lucide-react';

interface SolarRayProps {
  currentTheme: 'day' | 'night';
  isActive?: boolean;
}

export default function SolarRay({ currentTheme, isActive = true }: SolarRayProps) {
  // Default fallback: New York
  const [coords, setCoords] = useState({ lat: 40.7128, lon: -74.0060 });
  const [city, setCity] = useState('New York City');
  const [solarData, setSolarData] = useState<SunData | null>(null);
  const [geoStatus, setGeoStatus] = useState<'idle' | 'loading' | 'success' | 'denied' | 'error'>('idle');
  const [manualCityInput, setManualCityInput] = useState('');

  // 1. Fetch Geolocation on load
  useEffect(() => {
    setGeoStatus('loading');
    if (!navigator.geolocation) {
      setGeoStatus('error');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: latitude, lon: longitude });
        setGeoStatus('success');

        // Reverse geocode
        const cityName = await reverseGeocode(latitude, longitude);
        setCity(cityName);
      },
      (err) => {
        console.warn('Geolocation access denied/failed:', err);
        setGeoStatus('denied');
        // Fallback to New York calculations on load
        setCity('New York (Default)');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  // 2. Compute solar data on demand when this section is active (no interval timer)
  useEffect(() => {
    if (!isActive) return;
    const data = calculateSunPosition(coords.lat, coords.lon, new Date());
    setSolarData({
      ...data,
      city: city,
    });
  }, [coords, city, isActive]);

  // 3. Manual coordinate lookup
  const handleManualSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCityInput.trim()) return;

    try {
      setGeoStatus('loading');
      // Forward geocode city name via OpenStreetMap
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(manualCityInput)}&format=json&limit=1&accept-language=en`,
        { headers: { 'User-Agent': 'HumanWeatherApplet/1.0' } }
      );
      if (!response.ok) throw new Error('Geocoding search failed');
      const data = await response.json();
      if (data && data.length > 0) {
        const first = data[0];
        const newLat = parseFloat(first.lat);
        const newLon = parseFloat(first.lon);
        setCoords({ lat: newLat, lon: newLon });
        setCity(first.display_name.split(',')[0]);
        setGeoStatus('success');
      } else {
        alert('Location not found. Please try again.');
        setGeoStatus('success');
      }
    } catch (err) {
      console.error(err);
      setGeoStatus('error');
    }
  };

  if (!solarData) {
    return (
      <div className="flex justify-center items-center py-12 text-accent font-serif italic">
        Calculating solar vectors...
      </div>
    );
  }

  // Calculate Sun Arc positions
  const isDaytime = solarData.altitude > 0;
  
  // Calculate relative solar position on path
  const getSunCoordinates = () => {
    const now = new Date();
    const currentDec = now.getHours() + now.getMinutes() / 60;

    // Parse Sunrise/Sunset back to decimals
    const parseTimeToDec = (timeStr: string) => {
      if (timeStr === '--:--') return 12;
      const [h, m] = timeStr.split(':').map(Number);
      return h + m / 60;
    };

    const riseDec = parseTimeToDec(solarData.sunrise);
    const setDec = parseTimeToDec(solarData.sunset);

    if (currentDec >= riseDec && currentDec <= setDec) {
      // Daytime arc
      const progress = (currentDec - riseDec) / (setDec - riseDec);
      const angle = Math.PI * (1 - progress); // 180 degrees down to 0 degrees
      const x = 100 + 80 * Math.cos(angle);
      const y = 80 - 60 * Math.sin(angle); // Parabolic rise
      return { x, y, below: false };
    } else {
      // Nighttime position (below horizon)
      let progress = 0.5;
      if (currentDec > setDec) {
        progress = (currentDec - setDec) / (24 - setDec + riseDec);
      } else {
        progress = (24 - setDec + currentDec) / (24 - setDec + riseDec);
      }
      const angle = Math.PI * (progress); // Night sweep below line
      const x = 100 + 80 * Math.cos(angle);
      const y = 80 + 35 * Math.sin(angle); // Slower, compressed sweep underneath
      return { x, y, below: true };
    }
  };

  const sunPos = getSunCoordinates();

  // Create Daily Solar Weathergrams with real calculated times
  const parseDecimalToTimeString = (dec: number) => {
    const hrs = Math.floor((dec + 24) % 24);
    const mins = Math.floor((dec * 60) % 60);
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const parseTimeToDec = (timeStr: string) => {
    if (timeStr === '--:--') return 12;
    const [h, m] = timeStr.split(':').map(Number);
    return h + m / 60;
  };

  const riseDec = parseTimeToDec(solarData.sunrise);
  const noonDec = parseTimeToDec(solarData.noon);
  const setDec = parseTimeToDec(solarData.sunset);

  const weathergramsList = [
    {
      id: 'dawn_rise',
      time: solarData.sunrise,
      title: 'Dawn Rise Protocol',
      recommendation: 'Step out for first light. Captures high-ratio red and blue photons to set master clock.',
      timeDec: riseDec,
      duration: 0.5 // 30 mins
    },
    {
      id: 'morning_light',
      time: parseDecimalToTimeString(riseDec + 1.2),
      title: 'Morning Light Window',
      recommendation: 'Circadian blue absorption. Inhibits remaining sleepiness and elevates morning focus.',
      timeDec: riseDec + 1.2,
      duration: 1.0 // 1 hour
    },
    {
      id: 'uvb_window',
      time: solarData.uvbStart || '--:--',
      title: 'UV-B Vitamin D Window',
      recommendation: 'Biological midday. Synthesizes active vitamin D3 through bare skin exposure.',
      timeDec: riseDec + (noonDec - riseDec) * 0.8, // midpoint before noon
      duration: 2.0
    },
    {
      id: 'solar_noon',
      time: solarData.noon,
      title: 'Solar Noon Reflection',
      recommendation: 'Peak solar meridian. Deep breathwork in peak natural illumination.',
      timeDec: noonDec,
      duration: 0.5
    },
    {
      id: 'evening_gold',
      time: parseDecimalToTimeString(setDec - 1.0),
      title: 'Evening Gold NIR Protocol',
      recommendation: 'Pure near-infrared skin cell charging. Builds natural red-light photo-protection.',
      timeDec: setDec - 1.0,
      duration: 1.0
    },
    {
      id: 'sunset_watch',
      time: solarData.sunset,
      title: 'Sunset Sun Watch',
      recommendation: 'Unfiltered twilight exposure. signals the master brain center to release melatonin.',
      timeDec: setDec,
      duration: 0.5
    }
  ];

  // Helper to get status of recommendation
  const getRecommendationStatus = (timeDec: number, duration: number) => {
    const now = new Date();
    const currentDec = now.getHours() + now.getMinutes() / 60;

    if (currentDec >= timeDec && currentDec <= timeDec + duration) {
      return 'NOW';
    } else if (currentDec > timeDec + duration) {
      return 'DONE';
    } else {
      return 'SOON';
    }
  };

  const activeWindow = weathergramsList.find(w => getRecommendationStatus(w.timeDec, w.duration) === 'NOW');

  return (
    <div className={`flex flex-col w-full max-w-4xl mx-auto p-6 rounded-2xl border backdrop-blur-md ${
      currentTheme === 'night' 
        ? 'bg-[#1e1c18]/90 border-white/[0.06]' 
        : 'bg-white/90 border-stone-200/60 shadow-sm shadow-stone-900/5'
    }`}
         id="solar-ray-therapy-section">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <span className="hw-eyebrow block mb-1">Circadian sunlight</span>
          <h2 className="font-serif text-2xl text-accent font-medium">Solar Ray Therapy</h2>
          <p className="hw-caption mt-1">
            Align with the sun's natural cycles. Track solar angles, UV light ranges, and healing windows computed for your local time.
          </p>
        </div>

        {/* Location Display */}
        <div className="flex flex-col items-end shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-accent">
            <MapPin className="w-3.5 h-3.5" />
            <span className="font-serif italic font-medium">{city}</span>
          </div>
          <span className="hw-meta text-white/40 mt-1">
            {coords.lat.toFixed(4)}°N · {coords.lon.toFixed(4)}°E
          </span>
        </div>
      </div>

      {/* Manual Coordinates Input to bypass sandbox restrictions */}
      <form onSubmit={handleManualSearch} className="flex gap-2 max-w-xs mb-6" id="manual-coords-form">
        <input
          type="text"
          placeholder="Override city (e.g. Paris, Tokyo)..."
          value={manualCityInput}
          onChange={(e) => setManualCityInput(e.target.value)}
          className={`flex-1 px-3 py-1.5 rounded-lg border text-xs sm:text-sm focus:outline-none ${
            currentTheme === 'night'
              ? 'border-accent/20 bg-black/40 text-white placeholder-gold/30 focus:border-accent/50'
              : 'border-[#d4b05a]/40 bg-white/85 text-slate-800 placeholder-slate-400 focus:border-[#d4b05a] shadow-inner'
          }`}
        />
        <button
          type="submit"
          className={`px-3 py-1.5 border rounded-lg font-mono text-xs uppercase tracking-wider cursor-pointer transition-all ${
            currentTheme === 'night'
              ? 'bg-accent/10 hover:bg-accent/20 border-accent/30 text-accent'
              : 'bg-[#d4b05a]/10 hover:bg-[#d4b05a]/20 border-[#d4b05a]/30 text-[#b8956b] font-medium'
          }`}
        >
          Override
        </button>
      </form>

      {/* Active Gold Alert Callout */}
      <AnimatePresence>
        {activeWindow && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`flex items-start gap-2.5 p-4 rounded-xl border mb-6 ${
              currentTheme === 'night'
                ? 'bg-accent/10 border-accent/30'
                : 'bg-[#d4b05a]/10 border-[#b8956b]/30 shadow-sm'
            }`}
            id="active-solar-alert"
          >
            <AlertCircle className="w-5 h-5 text-accent mt-0.5 shrink-0 animate-pulse" />
            <div>
              <h4 className="font-serif text-sm sm:text-base font-semibold text-accent uppercase tracking-wide">
                Step outside now.
              </h4>
              <p className={`font-serif text-xs sm:text-sm italic leading-relaxed mt-1 ${
                currentTheme === 'night' ? 'text-white/90' : 'text-slate-850'
              }`}>
                The {activeWindow.title} is currently active ({activeWindow.time}). The light is doing something highly specific to your body right now.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Solar Live Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        {/* Dashboard Column 1: Sun Arc SVG */}
        <div className={`p-5 rounded-xl border flex flex-col items-center justify-between min-h-[220px] ${
          currentTheme === 'night' 
            ? 'bg-black/35 border-white/[0.06]' 
            : 'bg-stone-100/40 border-stone-200/50 shadow-sm'
        }`}>
          <span className="font-mono text-xs uppercase tracking-widest text-accent font-semibold self-start">Live Sun Arc</span>
          
          {/* SVG Sun Tracker */}
          <div className="w-full max-w-[180px] h-32 relative">
            <svg viewBox="0 0 200 100" className="w-full h-full overflow-visible">
              {/* Horizon line */}
              <line x1="10" y1="80" x2="190" y2="80" stroke="rgba(196,168,74,0.15)" strokeWidth="1" />
              
              {/* Sun trajectory arc */}
              <path
                d="M 20 80 Q 100 -20 180 80"
                fill="none"
                stroke="rgba(196,168,74,0.3)"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />

              {/* Day Glow background */}
              {isDaytime && (
                <path
                  d="M 20 80 Q 100 -20 180 80"
                  fill="none"
                  stroke="rgba(196,168,74,0.05)"
                  strokeWidth="24"
                  className="blur-md"
                />
              )}

              {/* Night shadow indicator (below horizon) */}
              <path
                d="M 180 80 Q 100 120 20 80"
                fill="none"
                stroke="rgba(36,113,163,0.1)"
                strokeWidth="1"
                strokeDasharray="2 4"
              />

              {/* Sunrise / Sunset text markers */}
              <text x="12" y="93" fill={currentTheme === 'night' ? 'rgba(255,255,255,0.45)' : 'rgba(15, 23, 42, 0.55)'} fontSize="8" fontFamily="monospace" textAnchor="middle">RISE</text>
              <text x="188" y="93" fill={currentTheme === 'night' ? 'rgba(255,255,255,0.45)' : 'rgba(15, 23, 42, 0.55)'} fontSize="8" fontFamily="monospace" textAnchor="middle">SET</text>

              {/* The Sun Dot */}
              <motion.circle
                cx={sunPos.x}
                cy={sunPos.y}
                r="6"
                fill={currentTheme === 'night' ? '#d4b05a' : '#b8956b'}
                filter={`drop-shadow(0px 0px 8px ${currentTheme === 'night' ? '#d4b05a' : '#b8956b'})`}
                animate={{ r: [6, 9, 6], opacity: [1, 0.75, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              />
            </svg>

            {/* Sun Info overlays */}
            <div className="absolute inset-0 flex flex-col justify-center items-center pointer-events-none mt-4">
              <span className={`font-mono text-2xl font-bold tracking-tighter ${currentTheme === 'night' ? 'text-white' : 'text-slate-800'}`}>
                {solarData.altitude.toFixed(1)}°
              </span>
              <span className="hw-footnote text-accent font-bold">
                Altitude
              </span>
            </div>
          </div>

          <span className="hw-footnote">ASTRONOMICAL ALIGNED</span>
        </div>

        {/* Dashboard Column 2: Exact Sun Markers & UV-B Window */}
        <div className={`p-5 rounded-xl border flex flex-col justify-between min-h-[220px] ${
          currentTheme === 'night' 
            ? 'bg-black/35 border-white/[0.06]' 
            : 'bg-stone-100/40 border-stone-200/50 shadow-sm'
        }`}>
          <span className="font-mono text-xs uppercase tracking-widest text-accent font-semibold">Astrological Metrics</span>
          
          <div className="flex flex-col gap-3.5 my-4">
            {/* Sunrise */}
            <div className={`flex justify-between items-center border-b pb-2 ${currentTheme === 'night' ? 'border-white/5' : 'border-slate-100'}`}>
              <span className={`font-serif text-xs sm:text-sm ${currentTheme === 'night' ? 'text-slate-300' : 'text-slate-700'}`}>Sunrise Today</span>
              <span className="font-mono text-xs sm:text-sm font-semibold text-accent">{solarData.sunrise}</span>
            </div>
            
            {/* Solar Noon */}
            <div className={`flex justify-between items-center border-b pb-2 ${currentTheme === 'night' ? 'border-white/5' : 'border-slate-100'}`}>
              <span className={`font-serif text-xs sm:text-sm ${currentTheme === 'night' ? 'text-slate-300' : 'text-slate-700'}`}>Solar Noon</span>
              <span className="font-mono text-xs sm:text-sm font-semibold text-accent">{solarData.noon}</span>
            </div>

            {/* Sunset */}
            <div className={`flex justify-between items-center border-b pb-2 ${currentTheme === 'night' ? 'border-white/5' : 'border-slate-100'}`}>
              <span className={`font-serif text-xs sm:text-sm ${currentTheme === 'night' ? 'text-slate-300' : 'text-slate-700'}`}>Sunset Today</span>
              <span className="font-mono text-xs sm:text-sm font-semibold text-accent">{solarData.sunset}</span>
            </div>

            {/* UV-B Window status */}
            <div className="flex justify-between items-center pt-1">
              <span className={`font-serif text-xs sm:text-sm ${currentTheme === 'night' ? 'text-slate-300' : 'text-slate-700'}`}>UV-B Synthesis Window</span>
              <span className="font-mono text-xs sm:text-sm font-semibold text-accent">
                {solarData.uvbStart && solarData.uvbEnd 
                  ? `${solarData.uvbStart} – ${solarData.uvbEnd}`
                  : 'Unavailable today'}
              </span>
            </div>
          </div>

          <span className="hw-footnote">UPDATED EVERY MINUTE</span>
        </div>

        {/* Dashboard Column 3: Now Active Ray */}
        <div className={`p-5 rounded-xl border flex flex-col justify-between min-h-[220px] ${
          currentTheme === 'night' 
            ? 'bg-black/35 border-white/[0.06]' 
            : 'bg-stone-100/40 border-stone-200/50 shadow-sm'
        }`}>
          <span className="font-mono text-xs uppercase tracking-widest text-accent font-semibold">Now Active Ray</span>
          
          <div className="my-auto flex flex-col items-center text-center py-2">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
              className="mb-3"
            >
              <Sun className="w-10 h-10 text-accent" />
            </motion.div>
            <h3 className={`font-serif text-sm sm:text-base font-semibold mb-1 ${currentTheme === 'night' ? 'text-white' : 'text-slate-800'}`}>
              {solarData.activeRay}
            </h3>
            <p className="hw-body-muted text-accent/75 italic px-2">
              {solarData.isUvbActive 
                ? 'Synthesizing vitamin D. Protect skin if exposure exceeds 20 minutes.'
                : 'Safe light exposure window. Highly recommended for ocular circadian resetting.'}
            </p>
          </div>

          <span className="hw-footnote">ATMOSPHERIC CONSTANT</span>
        </div>

      </div>

      {/* Daily Solar Weathergrams (Time-stamped recommendations checklist) */}
      <div className="w-full mt-2">
        <span className="font-mono text-xs sm:text-sm tracking-widest uppercase opacity-60 block mb-4">
          Daily Solar Weathergrams™
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
          {weathergramsList.map((gram) => {
            const status = getRecommendationStatus(gram.timeDec, gram.duration);
            return (
              <div
                key={gram.id}
                className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                  currentTheme === 'night' 
                    ? 'bg-black/35 border-white/[0.06]' 
                    : 'bg-stone-100/40 border-stone-200/50 shadow-sm'
                }`}
                style={{
                  borderLeft: status === 'NOW' 
                    ? `3px solid ${currentTheme === 'night' ? '#d4b05a' : '#b8956b'}` 
                    : undefined
                }}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs sm:text-sm font-bold text-accent">{gram.time}</span>
                    
                    {/* Status badge */}
                    <div className="flex items-center gap-1">
                      {status === 'NOW' && (
                        <span className="flex items-center gap-1 hw-badge font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-full border border-accent/30">
                          <span className="h-1.5 w-1.5 rounded-full bg-accent animate-ping"></span>
                          ● NOW
                        </span>
                      )}
                      {status === 'DONE' && (
                        <span className={`flex items-center gap-1 hw-badge ${currentTheme === 'night' ? 'text-white/40' : 'text-slate-400'}`}>
                          ✓ DONE
                        </span>
                      )}
                      {status === 'SOON' && (
                        <span className={`flex items-center gap-1 hw-badge ${currentTheme === 'night' ? 'text-white/60' : 'text-slate-500'}`}>
                          ○ SOON
                        </span>
                      )}
                    </div>
                  </div>

                  <h4 className={`font-serif text-sm sm:text-base font-semibold leading-snug ${currentTheme === 'night' ? 'text-white' : 'text-slate-800'}`}>{gram.title}</h4>
                  <p className={`font-serif text-xs sm:text-sm leading-relaxed italic mt-1.5 ${currentTheme === 'night' ? 'text-slate-300' : 'text-slate-650'}`}>
                    {gram.recommendation}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
