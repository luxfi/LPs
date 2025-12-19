'use client';

import Link from 'next/link';
import { Search, GitFork, MessageSquare, ExternalLink } from 'lucide-react';
import { LogoWithText } from '@/components/logo';
import { ThemeToggle } from '@/components/theme-toggle';

// GitHub icon
function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
    </svg>
  );
}

// X (Twitter) icon
function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}

interface SiteHeaderProps {
  showBrowse?: boolean;
  showFork?: boolean;
  showDiscuss?: boolean;
}

export function SiteHeader({ showBrowse = true, showFork = false, showDiscuss = false }: SiteHeaderProps) {
  const handleSearchClick = () => {
    const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true });
    document.dispatchEvent(event);
  };

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <LogoWithText size={18} />
        </Link>
        <nav className="hidden items-center gap-4 text-sm md:flex">
          <Link href="/docs" className="text-muted-foreground transition-colors hover:text-foreground">
            Proposals
          </Link>
          <Link href="/contribute" className="text-muted-foreground transition-colors hover:text-foreground">
            Contribute
          </Link>
          <a 
            href="https://github.com/luxfi/lps/discussions" 
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
          >
            Discussions
            <ExternalLink className="h-3 w-3" />
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSearchClick}
            className="inline-flex h-8 items-center justify-center gap-2 rounded-md border border-border px-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:w-40 sm:justify-start sm:px-3"
            title="Search (⌘K)"
          >
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Search...</span>
            <kbd className="ml-auto hidden rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium sm:inline">⌘K</kbd>
          </button>
          {showDiscuss && (
            <a
              href="https://github.com/luxfi/lps/discussions"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:inline-flex"
              title="Join Discussion"
            >
              <MessageSquare className="h-4 w-4" />
            </a>
          )}
          {showFork && (
            <a
              href="https://github.com/luxfi/lps/fork"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:inline-flex"
              title="Fork to contribute"
            >
              <GitFork className="h-4 w-4" />
            </a>
          )}
          <a
            href="https://github.com/luxfi"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title="GitHub"
          >
            <GitHubIcon className="h-4 w-4" />
          </a>
          <a
            href="https://x.com/luxdefi"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title="X (Twitter)"
          >
            <XIcon className="h-4 w-4" />
          </a>
          <ThemeToggle />
          {showBrowse && (
            <Link
              href="/docs"
              className="inline-flex h-8 items-center justify-center rounded-md bg-foreground px-3 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
            >
              Browse
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

// Keep backward compatibility
export function HomeHeader() {
  return <SiteHeader showBrowse={true} showFork={true} showDiscuss={true} />;
}
