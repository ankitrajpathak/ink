# QA report

Validated on September 25, 2026.

## Passed

- Strict TypeScript check: `tsc --noEmit`.
- ESLint: no errors or warnings.
- Production build: `next build --webpack`, including type checking and static page generation.
- Nine unit and adapter tests: demo honesty, five tailored opportunities, measured keyword gaps, article export fields, dash removal, unsafe URL rejection, live-key protection, company candidate classification, and fabricated citation rejection.
- HTTP smoke checks: no-key integration status, invalid input returns 400, cross-origin POST returns 403.
- Browser walkthrough: company-name onboarding, honest empty discovery, optional empty URLs, dashboard with five opportunities, custom article generation, article modal, full Markdown clipboard copy, and workspace restoration after reload.
- Desktop layout reviewed at 1440 x 1000. Phone layout reviewed at 390 x 844. No horizontal document overflow in the tested views.
- Mobile navigation and persisted article library checked.
- Rules watch exercised against official sources. One source was retrieved successfully; three were unavailable during the check and were labeled unavailable without a freshness claim.
- Integration settings show not-connected states, memory-only access key entry, tone selection, and the default no-dash preference.

## Environment-specific test execution

This Windows workspace blocks nested child-process creation (`spawn EPERM`). The production build uses supported Next.js worker-thread and TypeScript API options. The exact build configuration is committed.

The nine test cases were compiled with TypeScript and executed with Node's test isolation disabled, using the same test files included in the repository. The normal `pnpm test` command uses tsx on an unrestricted development machine or CI runner.

The standalone Playwright runner could not download/launch its browser helper because of this restriction. Its desktop/mobile suites are included in `tests/e2e` and the GitHub Actions workflow, but are not represented as locally passed. The browser walkthrough above was performed using the available connected browser against the production server.

## Not verified with live credentials

No paid search, LLM, company enrichment or analytics credentials were supplied. Search and citation behavior were tested with deterministic mocked provider responses. Real account quotas, provider model access, Google/Bing OAuth, licensed enrichment data, and Vercel deployment must be verified with the owner's account.

## Scope boundaries

- Browser-local single-workspace persistence, not cloud sync or multitenant accounts.
- Search snippets support researched drafting; full-page retrieval and semantic citation verification are not implemented.
- Company and analytics gateway contracts are implemented, but third-party OAuth gateways are not bundled.
- Official guidance checks are on demand. A background scheduling service is not configured.
- AI answer presence, authority scores, and disconnected rankings remain unmeasured.
- The app was packaged for GitHub and Vercel. It was not published to a user account.
