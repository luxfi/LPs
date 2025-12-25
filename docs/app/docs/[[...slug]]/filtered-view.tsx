'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Filter, ArrowUpDown, X, Search, Calendar } from 'lucide-react';
import { Suspense, useState, useMemo } from 'react';

// LP Page interface
interface LPPage {
  slug: string[];
  data: {
    title: string;
    description?: string;
    frontmatter: {
      lp?: number | string;
      status?: string;
      type?: string;
      category?: string;
      tags?: string[];
      author?: string;
      created?: string;
      updated?: string;
    };
  };
}

// Sort options
const SORT_OPTIONS = [
  { value: 'number', label: 'LP Number (ascending)' },
  { value: 'number-desc', label: 'LP Number (descending)' },
  { value: 'title', label: 'Title (A-Z)' },
  { value: 'title-desc', label: 'Title (Z-A)' },
  { value: 'status', label: 'Status' },
  { value: 'created', label: 'Date Created (newest first)' },
  { value: 'updated', label: 'Date Updated (newest first)' },
];

// Status options
const STATUS_OPTIONS = ['All', 'Draft', 'Review', 'Last Call', 'Final', 'Stagnant', 'Withdrawn', 'Superseded'];

// Type options
const TYPE_OPTIONS = ['All', 'Standards Track', 'Meta', 'Informational'];

// Status badge color
function getStatusBadgeClass(status: string | undefined): string {
  if (!status) return 'bg-gray-500/10 text-gray-500';
  switch (status) {
    case 'Final': return 'bg-green-500/10 text-green-500';
    case 'Draft': return 'bg-yellow-500/10 text-yellow-500';
    case 'Review': return 'bg-blue-500/10 text-blue-500';
    case 'Last Call': return 'bg-purple-500/10 text-purple-500';
    default: return 'bg-gray-500/10 text-gray-500';
  }
}

// Format LP number without leading zeros for display (LP-0 instead of LP-0000)
function formatLPNumber(lp: number | string | undefined): string {
  if (lp === undefined || lp === null) return 'LP-0';
  const num = typeof lp === 'string' ? parseInt(lp, 10) : lp;
  return `LP-${num}`;
}

function FilteredContent({ allPages }: { allPages: LPPage[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Get filter values from URL
  const tag = searchParams.get('tag');
  const status = searchParams.get('status') || 'All';
  const type = searchParams.get('type') || 'All';
  const sortBy = searchParams.get('sort') || 'number';
  const q = searchParams.get('q') || '';

  // Local state for filter dropdowns
  const [showFilters, setShowFilters] = useState(false);
  const [searchInput, setSearchInput] = useState(q);

  // Collect all unique tags from all pages
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    allPages.forEach(page => {
      (page.data.frontmatter.tags || []).forEach((t: string) => tags.add(t));
    });
    return Array.from(tags).sort();
  }, [allPages]);

  // Build filter URL
  const buildFilterUrl = (params: Record<string, string | null>) => {
    const newParams = new URLSearchParams(searchParams.toString());
    Object.entries(params).forEach(([key, value]) => {
      if (value === null || value === 'All' || value === '') {
        newParams.delete(key);
      } else {
        newParams.set(key, value);
      }
    });
    return `${pathname}?${newParams.toString()}`;
  };

  // Handle filter change
  const handleFilterChange = (key: string, value: string) => {
    router.push(buildFilterUrl({ [key]: value === 'All' ? null : value }));
  };

  // Handle sort change
  const handleSortChange = (sortValue: string) => {
    router.push(buildFilterUrl({ sort: sortValue === 'number' ? null : sortValue }));
  };

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(buildFilterUrl({ q: searchInput || null }));
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchInput('');
    router.push(pathname);
  };

  // Filter and search pages
  const filteredPages = useMemo(() => {
    let result = [...allPages];

    // Text search
    if (q) {
      const query = q.toLowerCase();
      result = result.filter(page =>
        page.data.title.toLowerCase().includes(query) ||
        page.data.description?.toLowerCase().includes(query) ||
        String(page.data.frontmatter.lp).includes(query)
      );
    }

    // Filter by tag
    if (tag) {
      result = result.filter(page => {
        const tags = page.data.frontmatter.tags || [];
        return tags.some((t: string) => t.toLowerCase() === tag.toLowerCase());
      });
    }

    // Filter by status
    if (status !== 'All') {
      result = result.filter(page => page.data.frontmatter.status === status);
    }

    // Filter by type
    if (type !== 'All') {
      result = result.filter(page => page.data.frontmatter.type === type);
    }

    // Sort pages
    const [sortField, sortAsc] = sortBy.includes('-')
      ? [sortBy.split('-')[0], false]
      : [sortBy, true];

    result.sort((a, b) => {
      switch (sortField) {
        case 'number':
          const numA = Number(a.data.frontmatter.lp) || 0;
          const numB = Number(b.data.frontmatter.lp) || 0;
          return sortAsc ? numA - numB : numB - numA;

        case 'title':
          const titleA = a.data.title.toLowerCase();
          const titleB = b.data.title.toLowerCase();
          return sortAsc ? titleA.localeCompare(titleB) : titleB.localeCompare(titleA);

        case 'status':
          const statusOrder: Record<string, number> = {
            'Draft': 0, 'Review': 1, 'Last Call': 2, 'Final': 3,
            'Stagnant': 4, 'Withdrawn': 5, 'Superseded': 6
          };
          const statusA = statusOrder[a.data.frontmatter.status || 'Draft'] || 0;
          const statusB = statusOrder[b.data.frontmatter.status || 'Draft'] || 0;
          return sortAsc ? statusA - statusB : statusB - statusA;

        case 'created':
        case 'updated':
          const dateA = String(a.data.frontmatter[sortField as keyof typeof a.data.frontmatter] || '');
          const dateB = String(b.data.frontmatter[sortField as keyof typeof b.data.frontmatter] || '');
          // Handle empty dates - put them at the end when descending
          if (!dateA && !dateB) return 0;
          if (!dateA) return 1;
          if (!dateB) return -1;
          return sortAsc ? dateA.localeCompare(dateB) : dateB.localeCompare(dateA);

        default:
          return 0;
      }
    });

    return result;
  }, [allPages, q, tag, status, type, sortBy]);

  // Get active filter count
  const activeFilterCount = [q, tag, status !== 'All', type !== 'All', sortBy !== 'number'].filter(Boolean).length;

  // Get filter label for header
  const getFilterLabel = () => {
    if (q) return `Search: "${q}"`;
    if (tag) return `Tag: ${tag}`;
    const parts = [];
    if (status !== 'All') parts.push(status);
    if (type !== 'All') parts.push(type.replace(' Standards Track', ''));
    return parts.length > 0 ? parts.join(' + ') : 'All Proposals';
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          {activeFilterCount > 0 && (
            <button
              onClick={handleClearFilters}
              className="text-muted-foreground hover:text-foreground transition-colors"
              title="Clear all filters"
            >
              <ArrowLeft className="size-4" />
            </button>
          )}
          <h1 className="text-2xl font-bold">{getFilterLabel()}</h1>
          <span className="text-sm text-muted-foreground px-2 py-0.5 rounded-full bg-accent">
            {filteredPages.length}
          </span>
        </div>

        {/* Filter Toggle Button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors ${
            showFilters || activeFilterCount > 0
              ? 'bg-primary/10 border-primary/30 text-primary'
              : 'border-border hover:border-foreground/30'
          }`}
        >
          <Filter className="size-4" />
          <span className="text-sm">Filters</span>
          {activeFilterCount > 0 && (
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Search Bar (always visible) */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by title, description, or LP number..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                router.push(buildFilterUrl({ q: null }));
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </form>

      {/* Filter Panel */}
      {showFilters && (
        <div className="mb-6 p-4 rounded-lg border border-border bg-card">
          <div className="flex flex-wrap items-end gap-4">
            {/* Sort Dropdown */}
            <div className="min-w-[160px]">
              <label className="block text-xs text-muted-foreground mb-1">
                <ArrowUpDown className="inline size-3 mr-1" />
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {SORT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="min-w-[140px]">
              <label className="block text-xs text-muted-foreground mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {STATUS_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            {/* Type Filter */}
            <div className="min-w-[160px]">
              <label className="block text-xs text-muted-foreground mb-1">Type</label>
              <select
                value={type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {TYPE_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            {/* Tag Filter */}
            <div className="min-w-[140px]">
              <label className="block text-xs text-muted-foreground mb-1">Tag</label>
              <select
                value={tag || ''}
                onChange={(e) => handleFilterChange('tag', e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">All Tags</option>
                {allTags.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Clear Filters Button */}
            {activeFilterCount > 0 && (
              <button
                onClick={handleClearFilters}
                className="flex items-center gap-1 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="size-4" />
                Clear all
              </button>
            )}
          </div>
        </div>
      )}

      {/* Results */}
      {filteredPages.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No proposals match your filters.</p>
          <button
            onClick={handleClearFilters}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredPages.map((lp) => (
            <Link
              key={lp.slug.join('/')}
              href={`/docs/${lp.slug.join('/')}`}
              className="flex items-center gap-4 p-4 rounded-lg border border-border hover:border-foreground/20 hover:bg-accent/50 transition-colors group"
            >
              <span className="text-sm font-mono text-muted-foreground w-16 shrink-0">
                {formatLPNumber(lp.data.frontmatter.lp)}
              </span>
              <div className="flex-1 min-w-0">
                <span className="font-medium text-sm block truncate group-hover:text-foreground">
                  {lp.data.title}
                </span>
                {lp.data.description && (
                  <span className="text-xs text-muted-foreground truncate block mt-0.5">
                    {lp.data.description}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {lp.data.frontmatter.type && (
                  <span className="text-xs px-2 py-0.5 rounded bg-accent text-muted-foreground hidden sm:inline">
                    {lp.data.frontmatter.type.replace(' Standards Track', '')}
                  </span>
                )}
                {lp.data.frontmatter.status && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusBadgeClass(lp.data.frontmatter.status)}`}>
                    {lp.data.frontmatter.status}
                  </span>
                )}
                {(lp.data.frontmatter.updated || lp.data.frontmatter.created) && (
                  <span className="text-xs text-muted-foreground hidden md:inline-flex items-center gap-1">
                    <Calendar className="size-3" />
                    {lp.data.frontmatter.updated || lp.data.frontmatter.created}
                  </span>
                )}
              </div>
              <ArrowRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function FilteredView({ allPages }: { allPages: LPPage[] }) {
  return (
    <Suspense fallback={null}>
      <FilteredContent allPages={allPages} />
    </Suspense>
  );
}
