import React from 'react';

interface HwButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export default function HwButton({ children, className = '', ...props }: HwButtonProps) {
  return (
    <button type="button" className={`hw-btn ${className}`} {...props}>
      {children}
    </button>
  );
}
