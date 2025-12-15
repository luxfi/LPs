'use client';

type LogoVariant = 'color' | 'mono' | 'white' | 'black';

interface LogoProps {
  size?: number;
  variant?: LogoVariant;
  className?: string;
  adaptive?: boolean;
}

// Lux logo - downward-pointing triangle per @luxfi/logo
function LuxLogoSvg({ size, fill, className }: { size: number; fill: string; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
    >
      <path d="M50 85 L15 25 L85 25 Z" fill={fill} />
    </svg>
  );
}

export function Logo({ size = 24, variant = 'white', className = '', adaptive = true }: LogoProps) {
  if (adaptive) {
    return (
      <div className={className} style={{ width: size, height: size }}>
        <LuxLogoSvg size={size} fill="white" className="hidden dark:block" />
        <LuxLogoSvg size={size} fill="black" className="dark:hidden" />
      </div>
    );
  }

  const fill = variant === 'black' ? 'black' : 'white';
  return <LuxLogoSvg size={size} fill={fill} className={className} />;
}

export function LogoWithText({ size = 24 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2 group">
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
