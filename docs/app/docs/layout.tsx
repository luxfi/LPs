import { DocsLayout } from '@hanzo/docs/ui/layouts/docs';
import type { ReactNode } from 'react';
import { FileText, GitPullRequest, Users, BookOpen, ExternalLink } from 'lucide-react';
import { LogoWithText } from '../../components/logo';
import { SearchTrigger } from '../../components/search-trigger';
import { source } from '@/lib/source';

export default function Layout({ children }: { children: ReactNode }) {
  const pageTree = source.getPageTree();
  const stats = source.getStats();

  return (
    <DocsLayout
      tree={pageTree}
      nav={{
        title: <LogoWithText size={24} />,
      }}
      sidebar={{
        defaultOpenLevel: 1,
        banner: (
          <div className="flex flex-col gap-3">
            {/* Search Trigger */}
            <SearchTrigger />

            {/* Statistics */}
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="size-4" />
                <span className="text-sm font-semibold">LP Statistics</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Total:</span>
                  <span className="ml-1 font-medium">{stats.total}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Final:</span>
                  <span className="ml-1 font-medium text-green-500">{stats.byStatus['Final'] || 0}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Draft:</span>
                  <span className="ml-1 font-medium text-yellow-500">{stats.byStatus['Draft'] || 0}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Review:</span>
                  <span className="ml-1 font-medium text-blue-500">{stats.byStatus['Review'] || 0}</span>
                </div>
              </div>
            </div>
          </div>
        ),
        footer: (
          <div className="flex flex-col gap-2 p-4 text-xs border-t border-border">
            <a
              href="https://github.com/luxfi/lps"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <GitPullRequest className="size-4" />
              Contribute on GitHub
            </a>
            <a
              href="https://github.com/luxfi/lps/discussions"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Users className="size-4" />
              Discussions
            </a>
            <a
              href="https://lux.help"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <BookOpen className="size-4" />
              Help
            </a>
          </div>
        ),
      }}
      links={[
        {
          text: 'All LPs',
          url: '/docs',
          icon: <FileText className="size-4" />,
        },
        {
          text: 'Contribute',
          url: '/contribute',
          icon: <GitPullRequest className="size-4" />,
        },
        {
          text: 'GitHub',
          url: 'https://github.com/luxfi/lps',
          icon: <ExternalLink className="size-4" />,
          external: true,
        },
      ]}
    >
      {children}
    </DocsLayout>
  );
}
