'use client';

import * as React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Command as CommandPrimitive } from 'cmdk';
import * as Dialog from '@radix-ui/react-dialog';
import { Search, FileText, Github, MessageSquare, ArrowRight, Hash, BookOpen, Layers, Lock, Coins, Vote, Rocket, FlaskConical } from 'lucide-react';
import { cn } from '@/lib/utils';

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
        id: 'category-core',
        label: 'Core Architecture',
        description: 'LP-0 to LP-99 • Network fundamentals',
        icon: <Layers className="h-4 w-4" />,
        action: () => router.push('/docs/category/core'),
        keywords: ['core', 'architecture', 'network', 'topology', 'nodes'],
      },
      {
        id: 'category-consensus',
        label: 'Consensus',
        description: 'LP-100 to LP-199 • Consensus protocols',
        icon: <Layers className="h-4 w-4" />,
        action: () => router.push('/docs/category/consensus'),
        keywords: ['consensus', 'snowman', 'avalanche', 'finality'],
      },
      {
        id: 'category-crypto',
        label: 'Cryptography',
        description: 'LP-200 to LP-299 • Post-quantum security',
        icon: <Lock className="h-4 w-4" />,
        action: () => router.push('/docs/category/cryptography'),
        keywords: ['crypto', 'signature', 'encryption', 'quantum', 'ml-kem'],
      },
      {
        id: 'category-tokens',
        label: 'Token Standards',
        description: 'LP-300 to LP-399 • LRC specifications',
        icon: <Coins className="h-4 w-4" />,
        action: () => router.push('/docs/category/tokens'),
        keywords: ['token', 'lrc', 'erc', 'nft', 'fungible'],
      },
      {
        id: 'category-defi',
        label: 'DeFi',
        description: 'LP-400 to LP-499 • Decentralized finance',
        icon: <Coins className="h-4 w-4" />,
        action: () => router.push('/docs/category/defi'),
        keywords: ['defi', 'amm', 'lending', 'yield', 'staking'],
      },
      {
        id: 'category-governance',
        label: 'Governance',
        description: 'LP-500 to LP-599 • On-chain governance',
        icon: <Vote className="h-4 w-4" />,
        action: () => router.push('/docs/category/governance'),
        keywords: ['governance', 'vote', 'proposal', 'dao', 'treasury'],
      },
      {
        id: 'category-upgrades',
        label: 'Network Upgrades',
        description: 'LP-600 to LP-699 • Protocol upgrades',
        icon: <Rocket className="h-4 w-4" />,
        action: () => router.push('/docs/category/upgrades'),
        keywords: ['upgrade', 'fork', 'network', 'activation'],
      },
      {
        id: 'category-research',
        label: 'Research',
        description: 'LP-700 to LP-799 • Innovation & papers',
        icon: <FlaskConical className="h-4 w-4" />,
        action: () => router.push('/docs/category/research'),
        keywords: ['research', 'paper', 'academic', 'innovation', 'quantum'],
      },
      {
        id: 'category-sustainability',
        label: 'Sustainability & ESG',
        description: 'LP-800 to LP-899 • Environmental impact',
        icon: <Layers className="h-4 w-4" />,
        action: () => router.push('/docs/category/sustainability'),
        keywords: ['sustainability', 'esg', 'carbon', 'green', 'environment', 'climate'],
      },
      {
        id: 'category-impact',
        label: 'Impact & Public Goods',
        description: 'LP-900 to LP-999 • Social benefit',
        icon: <Vote className="h-4 w-4" />,
        action: () => router.push('/docs/category/impact'),
        keywords: ['impact', 'public goods', 'charity', 'social', 'benefit', 'humanity'],
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
          action: () => window.open(`https://github.com/luxfi/LPs/edit/main/LPs/lp-${currentLP}.md`, '_blank'),
          keywords: ['edit', 'github', 'source', 'modify'],
        },
        {
          id: 'view-raw',
          label: 'View Raw Markdown',
          description: 'See the raw markdown file',
          icon: <FileText className="h-4 w-4" />,
          action: () => window.open(`https://raw.githubusercontent.com/luxfi/LPs/main/LPs/lp-${currentLP}.md`, '_blank'),
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

  // Keyboard shortcut to open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Reset state when closing
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setQuery('');
      setResults([]);
    }
  };

  const handleSelect = (callback: () => void) => {
    callback();
    handleOpenChange(false);
  };

  return (
    <>
      <Dialog.Root open={open} onOpenChange={handleOpenChange}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <Dialog.Content className="fixed left-1/2 top-[20%] z-50 w-full max-w-2xl -translate-x-1/2 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
            <CommandPrimitive
              className="overflow-hidden rounded-xl border border-border bg-background shadow-2xl"
              loop
            >
              {/* Search Input */}
              <div className="flex items-center border-b border-border px-4" cmdk-input-wrapper="">
                <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
                <CommandPrimitive.Input
                  placeholder={isLPPage ? `Search LPs or actions for LP-${currentLP}...` : 'Search proposals, categories, or actions...'}
                  value={query}
                  onValueChange={setQuery}
                  className="flex-1 h-12 bg-transparent px-3 py-4 text-base outline-none placeholder:text-muted-foreground"
                />
                <kbd className="rounded bg-muted px-2 py-1 text-xs text-muted-foreground">ESC</kbd>
              </div>

              {/* Results List */}
              <CommandPrimitive.List className="max-h-[60vh] overflow-y-auto p-2">
                <CommandPrimitive.Empty className="py-6 text-center text-sm text-muted-foreground">
                  {loading ? (
                    <div className="flex flex-col items-center">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      <p className="mt-2">Searching...</p>
                    </div>
                  ) : query.length >= 2 ? (
                    <div className="flex flex-col items-center">
                      <BookOpen className="h-8 w-8 opacity-50" />
                      <p className="mt-2">No results found for "{query}"</p>
                      <p className="text-xs">Try a different search term</p>
                    </div>
                  ) : null}
                </CommandPrimitive.Empty>

                {/* Quick Actions */}
                <CommandPrimitive.Group heading={isLPPage ? 'LP Actions' : 'Quick Actions'} className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground">
                  {quickActions.map((action) => (
                    <CommandPrimitive.Item
                      key={action.id}
                      value={`${action.label} ${action.description} ${action.keywords?.join(' ') || ''}`}
                      onSelect={() => handleSelect(action.action)}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left cursor-pointer aria-selected:bg-accent aria-selected:text-accent-foreground data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground hover:bg-muted transition-colors"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted shrink-0">
                        {action.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{action.label}</div>
                        <div className="text-sm text-muted-foreground truncate">{action.description}</div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </CommandPrimitive.Item>
                  ))}
                </CommandPrimitive.Group>

                {/* Search Results */}
                {results.length > 0 && (
                  <CommandPrimitive.Group heading={`Proposals (${results.length})`} className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground">
                    {results.map((result) => (
                      <CommandPrimitive.Item
                        key={result.id}
                        value={`${result.title} ${result.description} LP-${result.structuredData?.lp || ''}`}
                        onSelect={() => handleSelect(() => router.push(result.url))}
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left cursor-pointer aria-selected:bg-accent aria-selected:text-accent-foreground data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground hover:bg-muted transition-colors"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted shrink-0">
                          <Hash className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">
                            {result.structuredData?.lp && <span className="text-primary">LP-{result.structuredData.lp}: </span>}
                            {result.title}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {result.structuredData?.status && (
                              <span className={cn(
                                'rounded px-1.5 py-0.5 text-xs',
                                result.structuredData.status === 'Final' && 'bg-green-500/10 text-green-500',
                                result.structuredData.status === 'Draft' && 'bg-yellow-500/10 text-yellow-500',
                                result.structuredData.status === 'Review' && 'bg-blue-500/10 text-blue-500',
                                !['Final', 'Draft', 'Review'].includes(result.structuredData.status || '') && 'bg-muted text-muted-foreground'
                              )}>
                                {result.structuredData.status}
                              </span>
                            )}
                            {result.structuredData?.category && (
                              <span className="text-xs">{result.structuredData.category}</span>
                            )}
                            <span className="truncate">{result.description}</span>
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      </CommandPrimitive.Item>
                    ))}
                  </CommandPrimitive.Group>
                )}
              </CommandPrimitive.List>

              {/* Footer */}
              {!query && (
                <div className="px-4 py-2 text-xs text-muted-foreground border-t border-border flex items-center justify-between">
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
              )}
            </CommandPrimitive>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
