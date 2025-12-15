'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Search, FileText, ExternalLink, Github, MessageSquare, ArrowRight, Hash, BookOpen, Layers, Lock, Coins, Vote, Rocket, FlaskConical, X, Command } from 'lucide-react';

interface SearchResult {
  id: string;
  url: string;
  title: string;
  description: string;
  structuredData?: {
    lp?: number;
    status?: string;
    type?: string;
    category?: string;
  };
}

interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
  keywords?: string[];
}

export function SearchDialog() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Determine current context
  const isLPPage = pathname.startsWith('/docs/lp-');
  const currentLP = isLPPage ? pathname.split('/').pop()?.replace('lp-', '') : null;

  // Context-sensitive quick actions
  const getQuickActions = useCallback((): QuickAction[] => {
    const baseActions: QuickAction[] = [
      {
        id: 'browse-all',
        label: 'Browse All Proposals',
        description: 'View all Lux Proposals',
        icon: <FileText className="h-4 w-4" />,
        action: () => router.push('/docs'),
        keywords: ['all', 'proposals', 'list', 'browse'],
      },
      {
        id: 'category-consensus',
        label: 'Consensus Protocols',
        description: 'LP-100 to LP-199',
        icon: <Layers className="h-4 w-4" />,
        action: () => router.push('/docs#consensus'),
        keywords: ['consensus', 'snowman', 'avalanche', 'finality'],
      },
      {
        id: 'category-crypto',
        label: 'Cryptography',
        description: 'LP-200 to LP-299',
        icon: <Lock className="h-4 w-4" />,
        action: () => router.push('/docs#cryptography'),
        keywords: ['crypto', 'signature', 'encryption', 'quantum'],
      },
      {
        id: 'category-tokens',
        label: 'Token Standards',
        description: 'LP-300 to LP-399',
        icon: <Coins className="h-4 w-4" />,
        action: () => router.push('/docs#tokens'),
        keywords: ['token', 'lrc', 'erc', 'nft', 'fungible'],
      },
      {
        id: 'category-governance',
        label: 'Governance',
        description: 'LP-500 to LP-599',
        icon: <Vote className="h-4 w-4" />,
        action: () => router.push('/docs#governance'),
        keywords: ['governance', 'vote', 'proposal', 'dao'],
      },
      {
        id: 'category-upgrades',
        label: 'Network Upgrades',
        description: 'LP-600 to LP-699',
        icon: <Rocket className="h-4 w-4" />,
        action: () => router.push('/docs#upgrades'),
        keywords: ['upgrade', 'fork', 'network', 'activation'],
      },
      {
        id: 'category-research',
        label: 'Research',
        description: 'LP-700 to LP-999',
        icon: <FlaskConical className="h-4 w-4" />,
        action: () => router.push('/docs#research'),
        keywords: ['research', 'paper', 'academic', 'innovation'],
      },
    ];

    // Add page-specific actions if on an LP page
    if (isLPPage && currentLP) {
      const lpActions: QuickAction[] = [
        {
          id: 'edit-github',
          label: 'Edit on GitHub',
          description: `Edit LP-${currentLP} source`,
          icon: <Github className="h-4 w-4" />,
          action: () => window.open(`https://github.com/luxfi/lps/edit/main/LPs/lp-${currentLP}.md`, '_blank'),
          keywords: ['edit', 'github', 'source', 'modify'],
        },
        {
          id: 'view-raw',
          label: 'View Raw Markdown',
          description: 'See the raw markdown file',
          icon: <FileText className="h-4 w-4" />,
          action: () => window.open(`https://raw.githubusercontent.com/luxfi/lps/main/LPs/lp-${currentLP}.md`, '_blank'),
          keywords: ['raw', 'markdown', 'source'],
        },
        {
          id: 'discuss',
          label: 'Join Discussion',
          description: 'Discuss on forum.lux.network',
          icon: <MessageSquare className="h-4 w-4" />,
          action: () => window.open(`https://forum.lux.network/c/lps/${currentLP}`, '_blank'),
          keywords: ['discuss', 'forum', 'comment', 'feedback'],
        },
      ];
      return [...lpActions, ...baseActions];
    }

    return baseActions;
  }, [isLPPage, currentLP, router]);

  const quickActions = getQuickActions();

  // Search functionality
  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    const searchTimeout = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/search?query=${encodeURIComponent(query)}`);
        const data = await response.json();
        setResults(data);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      }
      setLoading(false);
    }, 200);

    return () => clearTimeout(searchTimeout);
  }, [query]);

  // Filter quick actions based on query
  const filteredActions = query
    ? quickActions.filter(
        (action) =>
          action.label.toLowerCase().includes(query.toLowerCase()) ||
          action.description.toLowerCase().includes(query.toLowerCase()) ||
          action.keywords?.some((k) => k.toLowerCase().includes(query.toLowerCase()))
      )
    : quickActions;

  // Combined items for navigation
  const allItems = [...filteredActions.map((a) => ({ type: 'action' as const, ...a })), ...results.map((r) => ({ type: 'result' as const, ...r }))];

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Open with Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
      // Close with Escape
      if (e.key === 'Escape' && open) {
        setOpen(false);
        setQuery('');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  // Navigation within dialog
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, allItems.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && allItems[selectedIndex]) {
        e.preventDefault();
        const item = allItems[selectedIndex];
        if (item.type === 'action') {
          item.action();
        } else {
          router.push(item.url);
        }
        setOpen(false);
        setQuery('');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, selectedIndex, allItems, router]);

  // Focus input when opened
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  // Reset selection when items change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, results]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">Search...</span>
        <kbd className="ml-2 hidden rounded bg-muted px-1.5 py-0.5 text-xs font-medium sm:inline-block">
          <Command className="inline h-3 w-3" />K
        </kbd>
      </button>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />

      {/* Dialog */}
      <div className="fixed left-1/2 top-[20%] z-50 w-full max-w-2xl -translate-x-1/2 animate-in fade-in-0 zoom-in-95 slide-in-from-top-2">
        <div className="overflow-hidden rounded-xl border border-border bg-background shadow-2xl">
          {/* Search Input */}
          <div className="flex items-center border-b border-border px-4">
            <Search className="h-5 w-5 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              placeholder={isLPPage ? `Search LPs or actions for LP-${currentLP}...` : 'Search proposals, categories, or actions...'}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent px-3 py-4 text-base outline-none placeholder:text-muted-foreground"
            />
            {query && (
              <button onClick={() => setQuery('')} className="p-1 hover:bg-muted rounded">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
            <kbd className="ml-2 rounded bg-muted px-2 py-1 text-xs text-muted-foreground">ESC</kbd>
          </div>

          {/* Results */}
          <div className="max-h-[60vh] overflow-y-auto p-2">
            {/* Quick Actions */}
            {filteredActions.length > 0 && (
              <div className="mb-2">
                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                  {isLPPage ? 'LP Actions' : 'Quick Actions'}
                </div>
                {filteredActions.map((action, index) => (
                  <button
                    key={action.id}
                    onClick={() => {
                      action.action();
                      setOpen(false);
                      setQuery('');
                    }}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                      selectedIndex === index ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                    }`}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                      {action.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{action.label}</div>
                      <div className="text-sm text-muted-foreground truncate">{action.description}</div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            )}

            {/* Search Results */}
            {loading && (
              <div className="px-3 py-8 text-center text-muted-foreground">
                <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                <p className="mt-2 text-sm">Searching...</p>
              </div>
            )}

            {!loading && results.length > 0 && (
              <div>
                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                  Proposals ({results.length})
                </div>
                {results.map((result, index) => {
                  const itemIndex = filteredActions.length + index;
                  return (
                    <button
                      key={result.id}
                      onClick={() => {
                        router.push(result.url);
                        setOpen(false);
                        setQuery('');
                      }}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                        selectedIndex === itemIndex ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                      }`}
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                        <Hash className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {result.structuredData?.lp && <span className="text-primary">LP-{result.structuredData.lp}: </span>}
                          {result.title}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {result.structuredData?.status && (
                            <span className={`rounded px-1.5 py-0.5 text-xs ${
                              result.structuredData.status === 'Final' ? 'bg-green-500/10 text-green-500' :
                              result.structuredData.status === 'Draft' ? 'bg-yellow-500/10 text-yellow-500' :
                              result.structuredData.status === 'Review' ? 'bg-blue-500/10 text-blue-500' :
                              'bg-muted text-muted-foreground'
                            }`}>
                              {result.structuredData.status}
                            </span>
                          )}
                          {result.structuredData?.category && (
                            <span className="text-xs">{result.structuredData.category}</span>
                          )}
                          <span className="truncate">{result.description}</span>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    </button>
                  );
                })}
              </div>
            )}

            {!loading && query.length >= 2 && results.length === 0 && filteredActions.length === 0 && (
              <div className="px-3 py-8 text-center text-muted-foreground">
                <BookOpen className="mx-auto h-8 w-8 opacity-50" />
                <p className="mt-2">No results found for "{query}"</p>
                <p className="text-sm">Try a different search term</p>
              </div>
            )}

            {!query && (
              <div className="px-3 py-2 text-xs text-muted-foreground border-t border-border mt-2 pt-2">
                <div className="flex items-center justify-between">
                  <span>
                    <kbd className="rounded bg-muted px-1.5 py-0.5 mr-1">↑</kbd>
                    <kbd className="rounded bg-muted px-1.5 py-0.5 mr-1">↓</kbd>
                    to navigate
                  </span>
                  <span>
                    <kbd className="rounded bg-muted px-1.5 py-0.5 mr-1">Enter</kbd>
                    to select
                  </span>
                  <span>
                    <kbd className="rounded bg-muted px-1.5 py-0.5">ESC</kbd>
                    to close
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
