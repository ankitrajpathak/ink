# INK

**Turn your brand into the answer.** A single-project organic visibility workspace for search and AI, built with Next.js App Router, React, TypeScript, and a custom responsive design system.

## Start here

Requirements: Node.js 22 or newer and pnpm 11.25.0.

```sh
npm install -g pnpm@11.25.0
pnpm install --frozen-lockfile
pnpm dev
```

Open http://localhost:3000. No account, database, or API keys are required for the demo. Select **Explore the demo workspace** for the fictional company Forma, or enter your own company name. Without search credentials, INK honestly asks for manual URLs instead of inventing search results.

## What is included

- Company-name onboarding, domain and LinkedIn candidate selectors, and editable company context.
- Audience and topic inference when search and an LLM are configured. Unverified owners, funding and competitors remain unknown.
- Five automatic opportunities personalized to company topics and audience, including a measured keyword gap when search analytics is connected.
- Dashboard, company intelligence, article library, rules watch and settings.
- Custom briefs and opportunity-to-article generation, with metadata, sections, FAQs, citations, images, alt text, internal-link suggestions, link-earning ideas and schema recommendations.
- Markdown copy/download and a JSON workspace backup. The latest 30 articles are saved in the current browser.
- Tone preferences and default removal of em and en dashes.
- Source provenance, confidence labels, timestamps and explicit demo states.
- Server-side adapters for Brave Search, an OpenAI-compatible LLM, company enrichment and search analytics gateways.
- On-demand official guidance retrieval and change fingerprints. No unsupported "latest algorithm" claims.
- Keyboard navigation, native modal focus containment, mobile navigation, reduced-motion support, validation, loading and error states.

## Upload to GitHub

### Easiest: GitHub Desktop

1. Extract `ink-github-ready.zip` to a folder named `ink`.
2. In GitHub Desktop choose **File > Add local repository**, select the extracted folder, then choose **create a repository here** if prompted. Do not initialize a separate README or overwrite the supplied `.gitignore`.
3. Review the changes and commit them with the summary `Initial INK app`.
4. Choose **Publish repository**, name it `ink`, choose its visibility, and publish.

### Alternatively: GitHub website

1. Create an empty repository at https://github.com/new.
2. Choose **uploading an existing file**.
3. Upload the extracted folder's contents, including `app`, `components`, `lib`, `tests`, `docs`, `.github`, `.env.example`, `.gitignore`, and the configuration files. Ensure `package.json` is at the repository root. Enable hidden files in your file picker if necessary.
4. Commit the upload. Never upload `node_modules`, `.next`, `.env.local`, or real credentials.

Do not upload only the ZIP to GitHub: Vercel needs the extracted source files.

## Deploy on Vercel

1. Sign in at https://vercel.com and choose **Add New > Project**.
2. Import your GitHub repository.
3. Choose the **Next.js** framework preset. Keep the root directory at the folder containing `package.json`. Use Node.js 22 or newer.
4. Set install command to `pnpm install --frozen-lockfile` and build command to `pnpm build`. Keep the default Next.js output configuration.
5. Deploy. The no-key demo works immediately.
6. To enable live providers, add the variables from `.env.example` in Project Settings > Environment Variables and redeploy. Set a long random `INK_ACCESS_KEY` first. Enter that key in INK Settings, or in onboarding when prompted.

This is a server-rendered application with API routes. GitHub hosts its source; **GitHub Pages cannot run its server endpoints**.

## Live integrations

Copy `.env.example` to `.env.local` for local development. For Vercel, configure the same variables in its dashboard.

| Variable                                                         | Purpose                                                                |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `INK_ACCESS_KEY`                                                 | Shared workspace access key. Live requests fail closed if absent.      |
| `BRAVE_SEARCH_API_KEY`                                           | Real company search and article research excerpts.                     |
| `LLM_API_KEY`                                                    | Writing and audience/topic inference.                                  |
| `LLM_BASE_URL`                                                   | HTTPS OpenAI-compatible API base, default `https://api.openai.com/v1`. |
| `LLM_MODEL`                                                      | Model available to your provider, default `gpt-4.1-mini`.              |
| `COMPANY_ADAPTER_URL`, `COMPANY_ADAPTER_TOKEN`                   | Optional trusted enrichment gateway.                                   |
| `SEARCH_ANALYTICS_ADAPTER_URL`, `SEARCH_ANALYTICS_ADAPTER_TOKEN` | Optional Search Console/Bing gateway.                                  |

Both search and LLM keys are required for researched articles. Without either, INK returns a visibly labeled editable demo template. Configured provider failures surface as errors, not silent demo fallbacks. Full-page scraping is not implemented. Search snippets are limited evidence, and even validated citation IDs do not establish factual entailment.

See [adapter contracts](docs/ADAPTERS.md) for exact JSON schemas, integration examples and extension points.

## Architecture and honest boundaries

One Next.js project, one JSON API route, no database or separate services required. Browser state is versioned in `localStorage`; secrets remain on the server. The shared access key is held only in browser memory. Drafts do not sync between devices. JSON backup export is available; there is no backup import UI.

This is a functional single-workspace application, not a multitenant SaaS. For public paid access, add individual authentication, tenant authorization, durable persistence and a distributed rate limit or Vercel Firewall rule. Set provider spending limits. The shared key is suitable for a controlled workspace, not per-user billing.

Brave search candidates require human identity confirmation. Confidence means evidence quality, not a statistically calibrated probability. Inferred personas and opportunity priorities are editorial judgments. Search impressions shown are totals of returned query rows, not guaranteed property totals. AI answer presence and topical authority remain unmeasured until corresponding adapters are added.

`lib/rules.ts` lists official sources and retrieves page content on demand. The app compares SHA-256 fingerprints with the last successful local check. Dynamic page changes can trigger false positives. It does not interpret every changed page as an algorithm update, automatically modify editorial rules, or run a background scheduler. A production scheduler can call the rules action and persist results through a durable adapter. Review authoritative changes before adopting them.

## Commands

```sh
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm start
pnpm exec playwright install chromium
pnpm test:e2e
```

The browser tests run against the no-key demo configuration. Do not supply live provider keys during these tests. GitHub Actions runs type checks, lint, unit/API tests, production build, and desktop/mobile browser tests.

## Project map

```text
app/                   Page shell, styles, API endpoint and error screens
components/workspace.tsx  Onboarding and interactive workspace
lib/model.ts           Validated contracts, opportunity ranking and Markdown export
lib/demo.ts            Explicitly fictional profile and editorial template
lib/adapters.ts        Search, LLM, enrichment and analytics adapters
lib/rules.ts           Authoritative guidance retrieval and fingerprints
lib/security.ts        Shared-key protection for live operations
tests/                 Unit/API tests and desktop/mobile journeys
docs/                  Adapter guide and QA report
```

The UI uses local system fonts and CSS, with Lucide icons. There are no remote font or image dependencies.

## Guidance used

- [Next.js installation](https://nextjs.org/docs/app/getting-started/installation)
- [Google Search Essentials](https://developers.google.com/search/docs/essentials)
- [Google AI features guidance](https://developers.google.com/search/docs/appearance/ai-features)
- [Google people-first content guidance](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)
- [Google documentation updates](https://developers.google.com/search/updates)

These are reference sources, not a claim that all pages were retrieved or that INK guarantees ranking outcomes.
