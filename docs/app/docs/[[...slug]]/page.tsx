import { source } from '@/lib/source';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default async function Page({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await params;
  const page = source.getPage(slug);
  if (!page) notFound();

  return (
    <article className="prose prose-slate dark:prose-invert max-w-none">
      <h1>{page.data.title}</h1>
      {page.data.description && (
        <p className="lead">{page.data.description}</p>
      )}
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {page.data.content}
      </ReactMarkdown>
    </article>
  );
}

export async function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await params;
  const page = source.getPage(slug);
  if (!page) return {};

  return {
    title: page.data.title || 'Lux Proposal',
    description: page.data.description,
  };
}
