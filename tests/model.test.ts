import test from 'node:test';
import assert from 'node:assert/strict';
import {
  articleMarkdown,
  articleSchema,
  cleanDashes,
  companySchema,
  opportunities,
} from '../lib/model';
import { demoArticle, demoCompany } from '../lib/demo';
import { authorized } from '../lib/security';
test('demo company never invents domains, funding or founders', () => {
  const c = demoCompany('Unknown Brand');
  assert.equal(c.domain, '');
  assert.deepEqual(c.founders, []);
  assert.equal(c.funding, 'Not verified');
  assert.equal(c.mode, 'demo');
  assert.ok(companySchema.safeParse(c).success);
});
test('five opportunities adapt to company context and measured gaps', () => {
  const c = demoCompany('Forma', '', '', true);
  const ideas = opportunities(c, null);
  assert.equal(ideas.length, 5);
  assert.match(ideas[0].title, /team collaboration/);
  assert.ok(ideas.every((i) => i.evidence.includes('not measured')));
  const live = opportunities(c, {
    provider: 'Search Console',
    startDate: '2026-01-01',
    endDate: '2026-01-31',
    retrievedAt: new Date().toISOString(),
    sources: [],
    keywords: [{ query: 'async teams', position: 14, clicks: 2, impressions: 40 }],
  });
  assert.match(live[2].title, /async teams/);
  assert.match(live[2].evidence, /Measured gap/);
});
test('article template includes publication package and honest source state', () => {
  const a = demoArticle(
    demoCompany('Forma'),
    'A practical guide to async work',
    'Clear and confident',
  );
  assert.ok(articleSchema.safeParse(a).success);
  assert.equal(a.sources.length, 0);
  const md = articleMarkdown(a);
  for (const section of [
    'Meta title:',
    'Meta description:',
    'Slug:',
    'Audience:',
    'Intent:',
    'Frequently asked questions',
    'Image recommendations',
    'Internal links',
    'Link-earning ideas',
    'Schema recommendation',
    'Sources',
    'Editorial review',
  ])
    assert.ok(md.includes(section), section);
  assert.match(md, /Not an evidence-backed/);
});
test('dash cleaning applies recursively without damaging ordinary hyphens', () => {
  assert.deepEqual(cleanDashes({ a: 'one\u2014two', nested: ['a\u2013b', 'step-by-step'] }), {
    a: 'one, two',
    nested: ['a, b', 'step-by-step'],
  });
});
test('rejects unsafe URLs', () => {
  assert.equal(
    companySchema.safeParse({ ...demoCompany('Brand'), domain: 'javascript:alert(1)' }).success,
    false,
  );
});
test('live integrations fail closed without a workspace key', () => {
  const old = { llm: process.env.LLM_API_KEY, key: process.env.INK_ACCESS_KEY };
  try {
    process.env.LLM_API_KEY = 'test';
    delete process.env.INK_ACCESS_KEY;
    assert.equal(authorized(new Request('https://example.com')), false);
    process.env.INK_ACCESS_KEY = 'secret';
    assert.equal(
      authorized(
        new Request('https://example.com', { headers: { authorization: 'Bearer wrong' } }),
      ),
      false,
    );
    assert.equal(
      authorized(
        new Request('https://example.com', { headers: { authorization: 'Bearer secret' } }),
      ),
      true,
    );
  } finally {
    if (old.llm === undefined) delete process.env.LLM_API_KEY;
    else process.env.LLM_API_KEY = old.llm;
    if (old.key === undefined) delete process.env.INK_ACCESS_KEY;
    else process.env.INK_ACCESS_KEY = old.key;
  }
});
