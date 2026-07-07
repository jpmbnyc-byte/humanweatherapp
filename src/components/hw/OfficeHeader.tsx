import React from 'react';

interface OfficeHeaderProps {
  name: string;
  designation: string;
  solarTime?: string;
}

export default function OfficeHeader({ name, designation, solarTime }: OfficeHeaderProps) {
  return (
    <header className="text-center mb-8">
      <p className="hw-designation mb-2">{designation}</p>
      <h1 className="hw-name">{name}</h1>
      {solarTime && (
        <p className="hw-font-mono text-xs hw-text-dim mt-2 tracking-widest">{solarTime}</p>
      )}
    </header>
  );
}
