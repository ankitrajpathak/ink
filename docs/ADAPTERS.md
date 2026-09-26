# Adapter contracts

All secrets are server-only environment variables. Provider URLs come from deployment configuration, never from user-supplied company URLs. INK does not fetch user-supplied domains directly. HTTPS is required and redirects are rejected. Requests have timeouts; JSON payloads are validated with Zod.

## Search and writing

`search()` calls Brave's `GET https://api.search.brave.com/res/v1/web/search` with `X-Subscription-Token`. Results retain title, URL, description, retrieval time and a medium confidence label. These are snippets, not full-page evidence.

`complete()` uses `{LLM_BASE_URL}/chat/completions`, bearer authentication, JSON mode and `LLM_MODEL`. A different provider must support that contract. Secrets and upstream response bodies are not logged. OpenAI is the default endpoint, but this adapter is deliberately small and replaceable.

Generation treats source excerpts as untrusted content, rejects fabricated citation IDs, and attaches only cited sources. Semantic support is still a human review responsibility. A provider returning invalid JSON or a schema mismatch fails visibly.

## Company enrichment gateway

Configure `COMPANY_ADAPTER_URL` with the URL of a gateway you operate or trust, and optionally `COMPANY_ADAPTER_TOKEN`. INK sends a JSON POST with `name`, `domain`, and `linkedin`. The gateway must authenticate the request, call your licensed enrichment provider, and return this shape:

```json
{
  "name": "Example company",
  "domain": "https://example.com",
  "linkedin": "",
  "description": "A description supported by the evidence below.",
  "industry": "Software",
  "audiences": ["Operations leaders"],
  "founders": [],
  "funding": "Not verified",
  "competitors": [],
  "topics": ["Team collaboration"],
  "mode": "live",
  "updatedAt": "2026-09-25T00:00:00.000Z",
  "sources": [
    {
      "id": "C1",
      "title": "Company information",
      "url": "https://example.com/about",
      "excerpt": "An actual retrieved excerpt that supports returned facts.",
      "retrievedAt": "2026-09-25T00:00:00.000Z",
      "confidence": "high",
      "kind": "company"
    }
  ]
}
```

Example URLs and timestamps above are contract illustrations, not live facts. Return unknown fields as empty arrays or `Not verified`. At least one source is mandatory. Confidence is one of `high`, `medium`, `low`. Source kinds are `search`, `company`, `analytics`, `official`, `demo`. All non-empty URLs must be HTTPS.

Without this gateway, INK can infer description, industry, audience and topics from search excerpts using the LLM. It deliberately leaves founders, funding and competitors unverified.

## Search Console / Bing gateway

Configure `SEARCH_ANALYTICS_ADAPTER_URL` and optionally `SEARCH_ANALYTICS_ADAPTER_TOKEN`. INK posts `{"domain":"https://example.com"}`. Your gateway must restrict access to authorized properties, handle OAuth/token refresh and map Search Console or Bing data into:

```json
{
  "provider": "Google Search Console",
  "startDate": "2026-08-01",
  "endDate": "2026-08-31",
  "retrievedAt": "2026-09-01T08:00:00.000Z",
  "keywords": [{ "query": "example query", "position": 12.4, "clicks": 23, "impressions": 910 }],
  "sources": [
    {
      "id": "GSC1",
      "title": "Authorized Search Console property report",
      "url": "https://search.google.com/search-console",
      "excerpt": "Query dimension, August reporting period, authorized property.",
      "retrievedAt": "2026-09-01T08:00:00.000Z",
      "confidence": "high",
      "kind": "analytics"
    }
  ]
}
```

Maximum 100 rows. Positions are positive averages, not universal live SERP ranks. Clicks and impressions must be nonnegative. INK identifies a gap from queries beyond average position 10, ordered by impressions. This does not prove that a new article will rank. The gateway is an extension point, not a bundled Google/Bing OAuth implementation.

## Rules layer

`POST /api/ink` with `{"action":"rules"}` retrieves only the fixed official HTTPS URLs in `lib/rules.ts`. It returns status, fingerprint, check time and Last-Modified when supplied. These results can be consumed by a scheduler, but the included UI checks only on demand. Persist old fingerprints in durable storage if deploying a scheduled service. Never equate a fingerprint change with an algorithm update without reviewing the source.

## API actions

`GET /api/ink` exposes booleans for configured integrations, never secret values. POST actions: `discover`, `enrich`, `analytics`, `article`, `rules`. The discriminated Zod union in `app/api/ink/route.ts` is the canonical input schema. Live configuration requires `Authorization: Bearer <INK_ACCESS_KEY>` for all POSTs. Browser requests must use the same origin. Local demo requests require no shared key.

For durable multi-user deployments, replace the shared key with server-verified user sessions and scope every company, article and integration token to its tenant. Do not trust a submitted domain as authorization to access an analytics property.
