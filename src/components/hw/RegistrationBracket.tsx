import React from 'react';

interface RegistrationBracketProps {
  children: React.ReactNode;
  className?: string;
}

export default function RegistrationBracket({
  children,
  className = '',
}: RegistrationBracketProps) {
  return (
    <div className={`hw-bracket relative p-6 ${className}`}>{children}</div>
  );
}
