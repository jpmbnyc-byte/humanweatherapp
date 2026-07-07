import React from 'react';

interface AtmosphereWashProps {
  wash?: '--hw-dawn' | '--hw-noon' | '--hw-dusk' | '--hw-fog' | '--hw-clear';
}

export default function AtmosphereWash({ wash = '--hw-dawn' }: AtmosphereWashProps) {
  return (
    <div
      className="hw-wash"
      style={{
        background: `radial-gradient(ellipse 80% 60% at 50% 30%, var(${wash}) 0%, transparent 70%)`,
      }}
      aria-hidden
    />
  );
}
