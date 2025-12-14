'use client';

import { LuxLogo } from '@luxfi/logo/react';

type LogoVariant = 'color' | 'mono' | 'white' | 'black';

interface LogoProps {
  size?: number;
  variant?: LogoVariant;
  className?: string;
  adaptive?: boolean; // Auto-switch between white (dark mode) and black (light mode)
}

// Custom black filled logo SVG (not available in @luxfi/logo yet)
function BlackLogo({ size, className }: { size: number; className?: string }) {
  return (
    <div className={className} style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width={size} height={size}>
        <path d="M50 85 L15 25 L85 25 Z" fill="black" />
      </svg>
    </div>
  );
}

export function Logo({ size = 24, variant = 'white', className = '', adaptive = true }: LogoProps) {
  if (adaptive) {
    // Use CSS to show different variants based on theme
    // Dark mode: white filled logo, Light mode: black filled logo
    return (
      <div className={className} style={{ width: size, height: size }}>
        <LuxLogo size={size} variant="white" className="hidden dark:block" />
        <BlackLogo size={size} className="dark:hidden" />
      </div>
    );
  }

  // Non-adaptive: use specified variant
  if (variant === 'black') {
    return <BlackLogo size={size} className={className} />;
  }
  return <LuxLogo size={size} variant={variant as 'color' | 'mono' | 'white'} className={className} />;
}

// Logo with "LPs" text that expands to "Lux Proposals" on hover
export function LogoWithText({ size = 24 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2 group">
      <Logo
        size={size}
        variant="white"
        className="transition-transform duration-200 group-hover:scale-110"
      />
      <div className="relative overflow-hidden">
        <span className="font-bold text-lg inline-block transition-all duration-300 ease-out group-hover:opacity-0 group-hover:-translate-y-full">
          LPs
        </span>
        <span className="font-bold text-lg absolute inset-0 opacity-0 translate-y-full transition-all duration-300 ease-out group-hover:opacity-100 group-hover:translate-y-0 whitespace-nowrap">
          Lux Proposals
        </span>
      </div>
    </div>
  );
}

// Simple logo with static text
export function LogoStatic({ size = 24, text = 'LPs' }: { size?: number; text?: string }) {
  return (
    <div className="flex items-center gap-2">
      <Logo size={size} variant="white" />
      <span className="font-bold text-lg">{text}</span>
    </div>
  );
}
