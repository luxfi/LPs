'use client';

import { LuxLogo } from '@luxfi/logo/react';

type LogoVariant = 'color' | 'mono' | 'white' | 'black';

interface LogoProps {
  size?: number;
  variant?: LogoVariant;
  className?: string;
  adaptive?: boolean;
}

export function Logo({ size = 24, variant = 'white', className = '', adaptive = true }: LogoProps) {
  if (adaptive) {
    return (
      <div className={`logo-container ${className}`}>
        <div className="hidden dark:block lux-logo lux-logo-dark">
          <LuxLogo
            size={size}
            variant="white"
          />
        </div>
        <div className="dark:hidden block lux-logo lux-logo-light">
          <LuxLogo
            size={size}
            variant="mono"
          />
        </div>
      </div>
    );
  }

  // Determine color based on variant
  const logoVariant = variant === 'black' ? 'mono' : 'white';

  return (
    <LuxLogo
      size={size}
      variant={logoVariant}
      className={`logo-container lux-logo ${className}`}
    />
  );
}

export function LogoWithText({ size = 24 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2 group logo-with-text">
      <Logo
        size={size}
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

export function LogoStatic({ size = 24, text = 'LPs' }: { size?: number; text?: string }) {
  return (
    <div className="flex items-center gap-2">
      <Logo size={size} />
      <span className="font-bold text-lg">{text}</span>
    </div>
  );
}
