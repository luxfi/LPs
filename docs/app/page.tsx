import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col justify-center text-center">
      <h1 className="mb-4 text-4xl font-bold">Lux Proposals (LPs)</h1>
      <p className="text-fd-muted-foreground mb-8">
        Standards and improvement proposals for the Lux Network
      </p>
      <div>
        <Link
          href="/docs"
          className="rounded-lg bg-fd-primary px-6 py-2 text-fd-primary-foreground hover:bg-fd-primary/90"
        >
          Browse Proposals
        </Link>
      </div>
    </main>
  );
}
