'use client';

import { getMenuBarSVG, getWhiteSVG, getMonoSVG, getColorSVG } from '@luxfi/logo';

interface LogoProps {
  size?: number;
  className?: string;
  variant?: 'default' | 'white' | 'mono' | 'color';
}

export function Logo({ size = 24, className = '', variant = 'default' }: LogoProps) {
  // Use official @luxfi/logo package
  let svg: string;
  switch (variant) {
    case 'white':
      svg = getWhiteSVG();
      break;
    case 'mono':
      svg = getMonoSVG();
      break;
    case 'color':
      svg = getColorSVG();
      break;
    default:
      // Default uses currentColor for theme-aware coloring
      svg = getMenuBarSVG();
  }

  return (
    <div
      className={`logo-container inline-block ${className}`}
      style={{ width: size, height: size }}
      dangerouslySetInnerHTML={{ __html: svg }}
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
      <div className="relative h-6">
        <span className="font-bold text-lg inline-block transition-all duration-300 ease-out group-hover:opacity-0 group-hover:-translate-y-full">
          LPs
        </span>
        <span className="font-bold text-lg absolute left-0 top-0 opacity-0 translate-y-full transition-all duration-300 ease-out group-hover:opacity-100 group-hover:translate-y-0 whitespace-nowrap">
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
