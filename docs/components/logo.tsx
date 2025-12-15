'use client';

interface LogoProps {
  size?: number;
  className?: string;
}

// SVG Lux logo that adapts to theme
export function Logo({ size = 24, className = '' }: LogoProps) {
  return (
    <div className={`logo-container ${className}`}>
      {/* Dark mode: white logo */}
      <svg
        className="hidden dark:block"
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M50 5L95 50L50 95L5 50L50 5Z"
          fill="white"
        />
        <path
          d="M50 20L80 50L50 80L20 50L50 20Z"
          fill="black"
        />
        <path
          d="M50 35L65 50L50 65L35 50L50 35Z"
          fill="white"
        />
      </svg>
      {/* Light mode: black logo */}
      <svg
        className="dark:hidden block"
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M50 5L95 50L50 95L5 50L50 5Z"
          fill="black"
        />
        <path
          d="M50 20L80 50L50 80L20 50L50 20Z"
          fill="white"
        />
        <path
          d="M50 35L65 50L50 65L35 50L50 35Z"
          fill="black"
        />
      </svg>
    </div>
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
