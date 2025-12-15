'use client';

import Link from 'next/link';
import { Logo } from './logo';

export function DocsFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-card/30 mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <Logo size={20} />
            <span className="text-sm text-muted-foreground">
              &copy; {currentYear} Lux Network
            </span>
          </div>

          {/* Ecosystem */}
          <div className="flex items-center gap-4 text-sm">
            <span className="text-muted-foreground">Part of</span>
            <div className="flex items-center gap-3">
              <a
                href="https://lux.network"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Lux
              </a>
              <span className="text-border">|</span>
              <a
                href="https://hanzo.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Hanzo
              </a>
              <span className="text-border">|</span>
              <a
                href="https://zoo.ngo"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Zoo
              </a>
            </div>
          </div>

          {/* Links */}
          <div className="flex items-center gap-4 text-sm">
            <Link
              href="/docs"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              All LPs
            </Link>
            <a
              href="https://github.com/luxfi/lps"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              GitHub
            </a>
            <a
              href="https://forum.lux.network"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Forum
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
