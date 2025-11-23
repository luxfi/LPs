import type { ReactNode } from 'react';
import Link from 'next/link';

export default function RootDocsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <nav className="border-b bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/docs" className="text-2xl font-bold hover:text-blue-600 dark:hover:text-blue-400">
            Lux Proposals
          </Link>
          <div className="flex gap-4 text-sm">
            <Link href="/docs/index" className="hover:text-blue-600 dark:hover:text-blue-400">
              Home
            </Link>
            <a
              href="https://github.com/luxfi/lux"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-600 dark:hover:text-blue-400"
            >
              GitHub
            </a>
          </div>
        </div>
      </nav>
      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>
      <footer className="border-t bg-gray-50 dark:bg-gray-900 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>Lux Proposals (LPs) - Community-driven standards and improvements</p>
        </div>
      </footer>
    </div>
  );
}
