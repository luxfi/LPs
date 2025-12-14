interface LogoProps {
  size?: number;
  variant?: 'color' | 'white' | 'mono';
  className?: string;
}

export function Logo({ size = 24, variant = 'white', className = '' }: LogoProps) {
  // Inline SVG for the Lux triangle logo
  const color = variant === 'white' ? 'currentColor' : variant === 'mono' ? '#888' : '#0ba5ec';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path d="M50 10 L90 85 L10 85 Z" fill={color} />
    </svg>
  );
}

export function LogoWithText({ size = 24 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2">
      <Logo size={size} variant="white" />
      <span className="font-bold text-lg">Lux Proposals</span>
    </div>
  );
}
