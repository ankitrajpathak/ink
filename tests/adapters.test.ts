import test from 'node:test';
import assert from 'node:assert/strict';
import { discover, researchArticle } from '../lib/adapters';
import { demoArticle, demoCompany } from '../lib/demo';

test('discovery without search credentials returns no fabricated candidates', async () => {
  const key = process.env.BRAVE_SEARCH_API_KEY;
  delete process.env.BRAVE_SEARCH_API_KEY;
  try {
    const result = await discover('A brand');
    assert.equal(result.mode, 'demo');
    assert.deepEqual(result.domains, []);
    assert.deepEqual(result.linkedins, []);
  } finally {
    if (key) process.env.BRAVE_SEARCH_API_KEY = key;
  }
});
test('search candidate classification keeps website and LinkedIn separate', async () => {
  const fetchOriginal = globalThis.fetch;
  const key = process.env.BRAVE_SEARCH_API_KEY;
  process.env.BRAVE_SEARCH_API_KEY = 'test';
  globalThis.fetch = async () =>
    Response.json({
      web: {
        results: [
          {
            title: 'Acme official',
            url: 'https://acme.example/about',
            description: 'Acme company',
          },
          { title: 'Acme second', url: 'https://acme.example/contact' },
          { title: 'Acme LinkedIn', url: 'https://www.linkedin.com/company/acme/' },
          { title: 'Unsafe', url: 'javascript:alert(1)' },
        ],
      },
    });
  try {
    const result = await discover('Acme');
    assert.equal(result.mode, 'live');
    assert.equal(result.domains.length, 1);
    assert.equal(result.domains[0].url, 'https://acme.example');
    assert.equal(result.linkedins.length, 1);
    assert.equal(result.sources.length, 3);
  } finally {
    globalThis.fetch = fetchOriginal;
    if (key) process.env.BRAVE_SEARCH_API_KEY = key;
    else delete process.env.BRAVE_SEARCH_API_KEY;
  }
});
test('generation rejects fabricated citations instead of returning false evidence', async () => {
  const originalFetch = globalThis.fetch;
  const searchKey = process.env.BRAVE_SEARCH_API_KEY;
  const llmKey = process.env.LLM_API_KEY;
  process.env.BRAVE_SEARCH_API_KEY = 'test';
  process.env.LLM_API_KEY = 'test';
  const draft = demoArticle(
    demoCompany('Forma'),
    'Practical collaboration guide',
    'Clear and confident',
  );
  draft.sections[0].body += ' [S99]';
  draft.citationIds = ['S99'];
  globalThis.fetch = async (input) =>
    String(input).includes('search.brave.com')
      ? Response.json({
          web: {
            results: [
              {
                title: 'Evidence',
                url: 'https://example.com/evidence',
                description: 'An excerpt.',
              },
            ],
          },
        })
      : Response.json({ choices: [{ message: { content: JSON.stringify(draft) } }] });
  try {
    await assert.rejects(
      () =>
        researchArticle(
          demoCompany('Forma'),
          'Practical collaboration guide',
          'Clear and confident',
        ),
      /source validation/,
    );
  } finally {
    globalThis.fetch = originalFetch;
    if (searchKey) process.env.BRAVE_SEARCH_API_KEY = searchKey;
    else delete process.env.BRAVE_SEARCH_API_KEY;
    if (llmKey) process.env.LLM_API_KEY = llmKey;
    else delete process.env.LLM_API_KEY;
  }
});
