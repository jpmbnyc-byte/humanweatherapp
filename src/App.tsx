import React, { useState, useEffect } from 'react';
import Threshold from './screens/Threshold';
import FieldStation from './screens/FieldStation';
import FasciaView from './screens/FasciaView';
import OfficeSequence from './screens/OfficeSequence';
import PrescriptionRoom from './screens/PrescriptionRoom';
import {
  computeSolarSchedule,
  DEFAULT_COORDS,
  type SolarSchedule,
} from './lib/solarSchedule';
import type { OfficeId } from './lib/solarSchedule';
import type { PrescriptionType } from './lib/prescriptions';
import { reverseGeocode } from './utils/solar';

type View =
  | 'threshold'
  | 'field-station'
  | 'fascia'
  | 'office'
  | 'prescription';

export default function App() {
  const [view, setView] = useState<View>('threshold');
  const [schedule, setSchedule] = useState<SolarSchedule | null>(null);
  const [location, setLocation] = useState({ ...DEFAULT_COORDS, city: 'New York' });
  const [activeOfficeId, setActiveOfficeId] = useState<OfficeId | null>(null);
  const [prescriptionType, setPrescriptionType] = useState<PrescriptionType>(null);

  useEffect(() => {
    const init = async () => {
      let lat = DEFAULT_COORDS.lat;
      let lon = DEFAULT_COORDS.lon;
      let city = 'New York';

      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 });
          });
          lat = pos.coords.latitude;
          lon = pos.coords.longitude;
          city = await reverseGeocode(lat, lon);
        } catch {
          /* use defaults */
        }
      }

      setLocation({ lat, lon, city });
      setSchedule(computeSolarSchedule(lat, lon, city));
    };

    init();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setSchedule((prev) =>
        computeSolarSchedule(
          location.lat,
          location.lon,
          prev?.city ?? location.city,
        ),
      );
    }, 60_000);
    return () => clearInterval(interval);
  }, [location]);

  if (!schedule) {
    return (
      <div className="hw-screen hw-ground flex items-center justify-center">
        <p className="hw-font-serif italic hw-text-dim">Calculating solar meridian…</p>
      </div>
    );
  }

  const activeOffice = activeOfficeId
    ? schedule.offices.find((o) => o.id === activeOfficeId)
    : null;

  if (view === 'fascia') {
    return <FasciaView onExit={() => setView('threshold')} />;
  }

  if (view === 'field-station') {
    return (
      <FieldStation
        onExit={() => setView('threshold')}
        onPrescription={(type) => {
          setPrescriptionType(type);
          setView('prescription');
        }}
      />
    );
  }

  if (view === 'prescription' && prescriptionType) {
    return (
      <PrescriptionRoom
        type={prescriptionType}
        onExit={() => setView('threshold')}
      />
    );
  }

  if (view === 'office' && activeOffice) {
    return (
      <OfficeSequence
        office={activeOffice}
        onComplete={() => {
          setActiveOfficeId(null);
          setView('threshold');
        }}
        onExit={() => {
          setActiveOfficeId(null);
          setView('threshold');
        }}
      />
    );
  }

  return (
    <Threshold
      schedule={schedule}
      onEnterOffice={(office) => {
        setActiveOfficeId(office);
        setView('office');
      }}
      onEnterFieldStation={() => setView('field-station')}
      onEnterFascia={() => setView('fascia')}
    />
  );
}
