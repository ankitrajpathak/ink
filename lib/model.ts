import { z } from 'zod';
export const safeUrl = z
  .string()
  .url()
  .refine((v) => {
    try {
      return new URL(v).protocol === 'https:';
    } catch {
      return false;
    }
  }, 'Use an HTTPS URL');
export const sourceSchema = z.object({
  id: z.string(),
  title: z.string(),
  url: safeUrl,
  excerpt: z.string().max(12000),
  retrievedAt: z.string().datetime(),
  confidence: z.enum(['high', 'medium', 'low']),
  kind: z.enum(['search', 'company', 'analytics', 'official', 'demo']),
});
export type Source = z.infer<typeof sourceSchema>;
export const companySchema = z.object({
  name: z.string().min(1).max(120),
  domain: z.union([safeUrl, z.literal('')]),
  linkedin: z.union([safeUrl, z.literal('')]),
  description: z.string().max(4000),
  industry: z.string(),
  audiences: z.array(z.string()).max(12),
  founders: z.array(z.string()).max(20),
  funding: z.string(),
  competitors: z.array(z.string()).max(20),
  topics: z.array(z.string()).max(20),
  sources: z.array(sourceSchema).max(30),
  mode: z.enum(['demo', 'live', 'manual']),
  updatedAt: z.string().datetime(),
});
export type Company = z.infer<typeof companySchema>;
export const candidateSchema = z.object({ label: z.string(), url: safeUrl, evidence: z.string() });
export const discoverySchema = z.object({
  domains: z.array(candidateSchema).max(10),
  linkedins: z.array(candidateSchema).max(10),
  sources: z.array(sourceSchema).max(30),
  mode: z.enum(['demo', 'live']),
  note: z.string(),
});
export type Discovery = z.infer<typeof discoverySchema>;
export const analyticsSchema = z.object({
  provider: z.string(),
  startDate: z.iso.date(),
  endDate: z.iso.date(),
  retrievedAt: z.string().datetime(),
  keywords: z
    .array(
      z.object({
        query: z.string(),
        position: z.number().positive(),
        clicks: z.number().nonnegative(),
        impressions: z.number().nonnegative(),
      }),
    )
    .max(100),
  sources: z.array(sourceSchema).min(1),
});
export type Analytics = z.infer<typeof analyticsSchema>;
export type Opportunity = {
  id: string;
  title: string;
  intent: string;
  audience: string;
  channel: string;
  priority: number;
  reason: string;
  evidence: string;
  brief: string;
};
export const articleSchema = z.object({
  title: z.string().min(1),
  metaTitle: z.string(),
  metaDescription: z.string(),
  slug: z.string(),
  audience: z.string(),
  intent: z.string(),
  summary: z.string(),
  sections: z
    .array(z.object({ heading: z.string(), body: z.string().min(1) }))
    .min(3)
    .max(12),
  faqs: z
    .array(z.object({ question: z.string(), answer: z.string() }))
    .min(2)
    .max(6),
  images: z.array(z.object({ placement: z.string(), recommendation: z.string(), alt: z.string() })),
  internalLinks: z.array(z.string()),
  linkEarning: z.array(z.string()),
  schema: z.string(),
  citationIds: z.array(z.string()),
  reviewNotes: z.array(z.string()),
});
export const storedArticleSchema = articleSchema.extend({
  id: z.string().min(1),
  createdAt: z.string().datetime(),
  mode: z.enum(['demo', 'live']),
  sources: z.array(sourceSchema),
  tone: z.string(),
});
export type Article = z.infer<typeof storedArticleSchema>;
export const settingsSchema = z.object({
  tone: z.enum(['Clear and confident', 'Warm and helpful', 'Technical and precise']),
  noDashes: z.boolean(),
});
export type Settings = z.infer<typeof settingsSchema>;
export function cleanDashes<T>(value: T): T {
  return JSON.parse(JSON.stringify(value).replace(/[\u2013\u2014]/g, ', ')) as T;
}
export function opportunities(company: Company, analytics: Analytics | null): Opportunity[] {
  const topic = company.topics[0] || company.industry || 'your category';
  const audience = company.audiences[0] || 'prospective customers';
  const gap = analytics?.keywords
    .filter((k) => k.position > 10)
    .sort((a, b) => b.impressions - a.impressions)[0];
  const rows = [
    [
      `The practical guide to ${topic}`,
      'Learn',
      'SEO + AEO',
      `Help ${audience.toLowerCase()} answer the core questions before choosing a solution.`,
    ],
    [
      `How to choose the right ${topic} solution`,
      'Compare',
      'GEO + SERP',
      'Build a transparent decision framework with criteria, tradeoffs and verifiable evidence.',
    ],
    [
      gap
        ? `A clearer answer to: ${gap.query}`
        : `${topic}: your most important questions, answered`,
      'Understand',
      'AEO + AIO',
      gap
        ? `Average position ${gap.position.toFixed(1)} with ${gap.impressions} impressions in the connected reporting period.`
        : 'Create concise answers that can stand alone, then explain the detail.',
    ],
    [
      `A step-by-step ${topic} implementation checklist`,
      'Act',
      'SXO + SEO',
      'Turn research into an actionable workflow with accessible, easy-to-follow steps.',
    ],
    [
      `What to measure when investing in ${topic}`,
      'Evaluate',
      'GEO + SEO',
      'Offer an original measurement template that earns useful references.',
    ],
  ];
  return rows.map(([title, intent, channel, reason], i) => ({
    id: `op-${i}`,
    title,
    intent,
    audience,
    channel,
    priority: 95 - i * 7,
    reason,
    evidence:
      i === 2 && gap
        ? `Measured gap: ${analytics!.provider}`
        : 'Editorial hypothesis. Demand and ranking potential are not measured.',
    brief: `Write ${title} for ${audience}. Company: ${company.name}. ${reason} Use only supplied evidence for factual claims.`,
  }));
}
export function articleMarkdown(a: Article): string {
  return [
    `# ${a.title}`,
    `> ${a.mode === 'demo' ? 'Demo template. Not an evidence-backed research article.' : 'AI-assisted draft. Verify source support before publishing.'}`,
    `Meta title: ${a.metaTitle}`,
    `Meta description: ${a.metaDescription}`,
    `Slug: ${a.slug}`,
    `Audience: ${a.audience}`,
    `Intent: ${a.intent}`,
    a.summary,
    ...a.sections.map((s) => `## ${s.heading}\n\n${s.body}`),
    '## Frequently asked questions',
    ...a.faqs.map((f) => `### ${f.question}\n\n${f.answer}`),
    '## Image recommendations',
    ...a.images.map((i) => `- ${i.placement}: ${i.recommendation}\n  Alt text: ${i.alt}`),
    '## Internal links',
    ...a.internalLinks.map((v) => `- ${v}`),
    '## Link-earning ideas',
    ...a.linkEarning.map((v) => `- ${v}`),
    `## Schema recommendation\n\n${a.schema}`,
    '## Sources',
    ...a.sources.map(
      (s) =>
        `[${s.id}] ${s.title}\n${s.url}\nRetrieved: ${s.retrievedAt}. Confidence: ${s.confidence}.`,
    ),
    '## Editorial review',
    ...a.reviewNotes.map((v) => `- ${v}`),
  ].join('\n\n');
}
