'use client';

import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchTriggerProps {
  className?: string;
}

export function SearchTrigger({ className }: SearchTriggerProps) {
  const handleClick = () => {
    // Dispatch keyboard event to trigger search dialog
    const event = new KeyboardEvent('keydown', {
      key: 'k',
      metaKey: true,
      bubbles: true,
    });
    document.dispatchEvent(event);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'flex items-center gap-2 w-full px-3 py-2 rounded-lg',
        'text-sm text-muted-foreground',
        'bg-muted/50 border border-border',
        'hover:bg-muted hover:text-foreground',
        'transition-colors cursor-pointer',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        className
      )}
    >
      <Search className="size-4" />
      <span className="flex-1 text-left">Search proposals...</span>
      <kbd className="hidden sm:inline-flex items-center gap-1 rounded bg-background px-1.5 py-0.5 text-xs font-medium text-muted-foreground border border-border">
        <span className="text-xs">⌘</span>K
      </kbd>
    </button>
  );
}
