'use client';

import Link from 'next/link';
import { Search, GitFork, MessageSquare, ExternalLink } from 'lucide-react';
import { LogoWithText } from '@/components/logo';
import { ThemeToggle } from '@/components/theme-toggle';

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
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
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
