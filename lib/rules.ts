import { createHash } from 'node:crypto';
export const authorities = [
  {
    id: 'essentials',
    title: 'Google Search Essentials',
    url: 'https://developers.google.com/search/docs/essentials',
    principle: 'Build useful, accessible pages and follow search policies.',
  },
  {
    id: 'ai',
    title: 'Google AI features guidance',
    url: 'https://developers.google.com/search/docs/appearance/ai-features',
    principle: 'Treat AI discoverability as part of a sound search foundation.',
  },
  {
    id: 'content',
    title: 'People-first content guidance',
    url: 'https://developers.google.com/search/docs/fundamentals/creating-helpful-content',
    principle: 'Add original value and make evidence and expertise visible.',
  },
  {
    id: 'updates',
    title: 'Google documentation updates',
    url: 'https://developers.google.com/search/updates',
    principle: 'Review documented changes before changing your publishing workflow.',
  },
];
export async function checkRules() {
  return Promise.all(
    authorities.map(async (rule) => {
      try {
        const res = await fetch(rule.url, {
          cache: 'no-store',
          redirect: 'error',
          signal: AbortSignal.timeout(12000),
        });
        if (!res.ok) throw new Error('Source unavailable');
        const html = await res.text();
        return {
          ...rule,
          status: 'retrieved' as const,
          checkedAt: new Date().toISOString(),
          hash: createHash('sha256').update(html).digest('hex'),
          modifiedAt: res.headers.get('last-modified'),
          note: 'Source retrieved. A page fingerprint change requires editorial review; it is not proof of an algorithm change.',
        };
      } catch {
        return {
          ...rule,
          status: 'unavailable' as const,
          checkedAt: new Date().toISOString(),
          hash: null,
          modifiedAt: null,
          note: 'Could not retrieve this source. No freshness claim is made.',
        };
      }
    }),
  );
}
