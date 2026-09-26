import { z } from 'zod';
import { NextResponse } from 'next/server';
import { analytics, discover, enrich, researchArticle } from '@/lib/adapters';
import { cleanDashes, companySchema, safeUrl, settingsSchema } from '@/lib/model';
import { demoArticle } from '@/lib/demo';
import { checkRules } from '@/lib/rules';
import { authorized, hasLiveConfiguration } from '@/lib/security';
export const runtime = 'nodejs';
export const maxDuration = 60;
const url = z.union([safeUrl, z.literal('')]);
const input = z.discriminatedUnion('action', [
  z.object({ action: z.literal('discover'), name: z.string().trim().min(2).max(120) }),
  z.object({
    action: z.literal('enrich'),
    name: z.string().trim().min(2).max(120),
    domain: url,
    linkedin: url,
  }),
  z.object({ action: z.literal('analytics'), domain: url }),
  z.object({
    action: z.literal('article'),
    company: companySchema,
    brief: z.string().trim().min(12).max(3000),
    settings: settingsSchema,
    demo: z.boolean().optional(),
  }),
  z.object({ action: z.literal('rules') }),
]);
export async function GET() {
  return NextResponse.json(
    {
      search: !!process.env.BRAVE_SEARCH_API_KEY,
      llm: !!process.env.LLM_API_KEY,
      company: !!process.env.COMPANY_ADAPTER_URL,
      analytics: !!process.env.SEARCH_ANALYTICS_ADAPTER_URL,
      protected: hasLiveConfiguration(),
      locked: hasLiveConfiguration() && !process.env.INK_ACCESS_KEY,
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
export async function POST(request: Request) {
  try {
    const origin = request.headers.get('origin');
    if (origin && origin !== new URL(request.url).origin)
      return NextResponse.json(
        { error: 'Cross-origin requests are not allowed.' },
        { status: 403 },
      );
    if (!authorized(request))
      return NextResponse.json(
        {
          error:
            'Live integrations require the workspace access key. Add it in Settings, or ask the deployment owner to configure INK_ACCESS_KEY.',
        },
        { status: 401 },
      );
    const text = await request.text();
    if (text.length > 50000)
      return NextResponse.json({ error: 'Request is too large.' }, { status: 413 });
    const body = input.parse(JSON.parse(text));
    let result: unknown;
    switch (body.action) {
      case 'discover':
        result = await discover(body.name);
        break;
      case 'enrich':
        result = await enrich(body.name, body.domain, body.linkedin);
        break;
      case 'analytics':
        result = await analytics(body.domain);
        break;
      case 'rules':
        result = await checkRules();
        break;
      case 'article': {
        const live = process.env.LLM_API_KEY && process.env.BRAVE_SEARCH_API_KEY && !body.demo;
        result = live
          ? await researchArticle(body.company, body.brief, body.settings.tone)
          : demoArticle(body.company, body.brief, body.settings.tone);
        if (body.settings.noDashes) result = cleanDashes(result);
        break;
      }
    }
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError)
      return NextResponse.json(
        {
          error:
            'The submitted data or provider response was invalid. Check your inputs and integration format.',
        },
        { status: 400 },
      );
    console.error('INK request failed', error instanceof Error ? error.name : 'UnknownError');
    return NextResponse.json(
      {
        error:
          error instanceof Error &&
          /Provider request|Connect |No research|source validation|must use|must supply/.test(
            error.message,
          )
            ? error.message
            : 'This request could not be completed. Your saved work is safe. Try again or check your integration.',
      },
      { status: 502 },
    );
  }
}
