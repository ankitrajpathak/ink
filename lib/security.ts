import { timingSafeEqual } from 'node:crypto';
export function hasLiveConfiguration() {
  return !!(
    process.env.LLM_API_KEY ||
    process.env.BRAVE_SEARCH_API_KEY ||
    process.env.COMPANY_ADAPTER_URL ||
    process.env.SEARCH_ANALYTICS_ADAPTER_URL
  );
}
export function authorized(request: Request) {
  if (!hasLiveConfiguration()) return true;
  const expected = process.env.INK_ACCESS_KEY;
  if (!expected) return false;
  const actual = request.headers.get('authorization')?.replace(/^Bearer /, '') || '';
  const a = Buffer.from(actual),
    b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
