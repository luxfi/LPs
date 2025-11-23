import { redirect } from 'next/navigation';

export default function DocsIndexPage() {
  // Redirect /docs to /docs/lp-0 (first LP)
  redirect('/docs/lp-0');
}
