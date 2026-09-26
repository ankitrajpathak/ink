import Link from 'next/link';
export default function NotFound() {
  return (
    <main className="onboarding">
      <section className="setup-card">
        <h1>This page is not here.</h1>
        <Link href="/">Return to INK</Link>
      </section>
    </main>
  );
}
