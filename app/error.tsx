'use client';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="onboarding">
      <section className="setup-card">
        <h1>Something interrupted your workspace.</h1>
        <p>Your saved browser data has not been removed.</p>
        <button onClick={reset}>Try again</button>
      </section>
    </main>
  );
}
