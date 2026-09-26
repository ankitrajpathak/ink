'use client';
import { useEffect, useRef, useState } from 'react';
import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  Check,
  ChevronRight,
  Copy,
  FileText,
  Globe2,
  Layers3,
  Menu,
  Plus,
  Radar,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import {
  articleMarkdown,
  storedArticleSchema,
  cleanDashes,
  companySchema,
  opportunities,
  settingsSchema,
  type Analytics,
  type Article,
  type Company,
  type Discovery,
  type Settings,
  type Source,
} from '@/lib/model';
import { demoCompany } from '@/lib/demo';

type Tab = 'Overview' | 'Company intelligence' | 'Article library' | 'Rules watch' | 'Settings';
type Status = {
  search: boolean;
  llm: boolean;
  company: boolean;
  analytics: boolean;
  protected: boolean;
  locked: boolean;
};
type Rule = {
  id: string;
  title: string;
  url: string;
  principle: string;
  status: string;
  checkedAt: string;
  hash: string | null;
  modifiedAt: string | null;
  note: string;
  changed?: boolean;
};
const navigation = [
  { name: 'Overview' as Tab, icon: Layers3 },
  { name: 'Company intelligence' as Tab, icon: Globe2 },
  { name: 'Article library' as Tab, icon: BookOpen },
  { name: 'Rules watch' as Tab, icon: Radar },
];
const defaults: Settings = { tone: 'Clear and confident', noDashes: true };
const STORE = 'ink.workspace.v1';
function date(value: string) {
  return new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}
function Brand() {
  return (
    <div className="brand">
      ink<span className="brand-dot">.</span>
    </div>
  );
}
function Sources({ sources }: { sources: Source[] }) {
  return sources.length ? (
    <div className="source-list">
      {sources.map((s) => (
        <details key={s.id}>
          <summary>
            <span>
              {s.id} · {s.title}
            </span>
            <span className="badge">{s.confidence} confidence</span>
          </summary>
          <p>{s.excerpt || 'No excerpt supplied.'}</p>
          <a href={s.url} target="_blank" rel="noreferrer">
            Open source <ArrowUpRight size={14} />
          </a>
          <small>
            Retrieved {date(s.retrievedAt)} · {s.kind}
          </small>
        </details>
      ))}
    </div>
  ) : (
    <p className="muted">
      No external evidence is attached. Company context is a demo or supplied by you.
    </p>
  );
}
export default function Workspace() {
  const [company, setCompany] = useState<Company | null>(null);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<Tab>('Overview');
  const [sidebar, setSidebar] = useState(false);
  const [name, setName] = useState('');
  const [discovery, setDiscovery] = useState<Discovery | null>(null);
  const [domain, setDomain] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [brief, setBrief] = useState('');
  const [settings, setSettings] = useState<Settings>(defaults);
  const [accessKey, setAccessKey] = useState('');
  const [status, setStatus] = useState<Status | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [article, setArticle] = useState<Article | null>(null);
  const [metrics, setMetrics] = useState<Analytics | null>(null);
  const [rules, setRules] = useState<Rule[]>([]);
  const [filter, setFilter] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);
  const writer = useRef<HTMLTextAreaElement>(null);
  const main = useRef<HTMLElement>(null);
  const initialRestore = useRef(false);
  useEffect(() => {
    if (initialRestore.current) return;
    initialRestore.current = true;
    queueMicrotask(() => {
      try {
        const raw = localStorage.getItem(STORE);
        if (raw) {
          const data = JSON.parse(raw);
          const saved = companySchema.safeParse(data.company);
          if (saved.success) setCompany(saved.data);
          const prefs = settingsSchema.safeParse(data.settings);
          if (prefs.success) setSettings(prefs.data);
          if (Array.isArray(data.articles))
            setArticles(
              data.articles
                .filter((a: Article) => storedArticleSchema.safeParse(a).success)
                .slice(0, 30),
            );
        }
      } catch {
        setNotice('Saved workspace could not be restored. You can start a new one.');
      }
      setReady(true);
    });
    fetch('/api/ink')
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => setError('Integration status is unavailable. Refresh to retry.'));
    // Restore browser-owned state only after hydration.
  }, []);
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORE, JSON.stringify({ company, settings, articles }));
    } catch {
      queueMicrotask(() =>
        setError(
          'Browser storage is full or unavailable. Export your workspace to keep a copy of this session.',
        ),
      );
    }
  }, [company, settings, articles, ready]);
  useEffect(() => {
    if (article) dialog.current?.showModal();
    else dialog.current?.close();
  }, [article]);
  async function api<T>(body: unknown): Promise<T> {
    const res = await fetch('/api/ink', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(accessKey ? { Authorization: `Bearer ${accessKey}` } : {}),
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(65000),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed. Please try again.');
    return data as T;
  }
  async function run(label: string, task: () => Promise<void>) {
    if (busy) return;
    setBusy(label);
    setError('');
    setNotice('');
    try {
      await task();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Try again.');
    } finally {
      setBusy('');
    }
  }
  function go(next: Tab) {
    setTab(next);
    setSidebar(false);
    setError('');
    setNotice('');
    requestAnimationFrame(() => main.current?.focus());
  }
  function download(text: string, filename: string, type = 'text/markdown') {
    const url = URL.createObjectURL(new Blob([text], { type }));
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
  async function generate(text: string, demo = false) {
    if (!company) return;
    await run('Writing your draft', async () => {
      const result = await api<Article>({
        action: 'article',
        company,
        brief: text,
        settings,
        demo,
      });
      setArticles((a) => [result, ...a].slice(0, 30));
      setArticle(result);
      setNotice('Draft saved to your browser library.');
    });
  }
  const ideas = company ? opportunities(company, metrics) : [];
  const shownArticles = articles.filter((a) =>
    a.title.toLowerCase().includes(filter.toLowerCase()),
  );
  const alerts = (
    <>
      {error && (
        <div className="alert error" role="alert">
          {error}
          <button className="icon-button" aria-label="Dismiss error" onClick={() => setError('')}>
            <X size={16} />
          </button>
        </div>
      )}
      {notice && (
        <div className="alert" role="status">
          {notice}
        </div>
      )}
      {busy && (
        <div className="working" role="status">
          <span className="spinner" />
          {busy}...
        </div>
      )}
    </>
  );
  if (!ready)
    return (
      <main className="onboarding">
        <Brand />
        <div className="working" role="status">
          <span className="spinner" />
          Opening your workspace...
        </div>
      </main>
    );
  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      {!company ? (
        <div className="onboarding">
          <header className="setup-header">
            <Brand />
            <span className="eyebrow">ORGANIC VISIBILITY INTELLIGENCE</span>
            <span className="badge">Your next chapter starts here</span>
          </header>
          <main id="main" className="setup-main">
            <div className="setup-intro">
              <span className="pill">
                <Sparkles size={14} /> A clearer path to being found
              </span>
              <h1>
                Great work deserves
                <br />
                to be <span>discovered.</span>
              </h1>
              <p>
                Turn your company’s knowledge into a stronger presence across search and AI. Start
                with your name.
              </p>
              <div className="setup-proof">
                <span>
                  <Check size={15} /> Search + AI visibility
                </span>
                <span>
                  <Check size={15} /> Evidence before claims
                </span>
              </div>
            </div>
            <section className="setup-card">
              {alerts}
              <div className="step">
                <span>01</span> YOUR COMPANY
              </div>
              <h2>{discovery ? 'Make sure it’s you.' : 'Let’s get to know you.'}</h2>
              <p className="muted">
                {discovery
                  ? discovery.note
                  : 'We will look for your website and company profile when search is connected.'}
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!discovery)
                    void run('Finding company candidates', async () => {
                      const d = await api<Discovery>({ action: 'discover', name });
                      setDiscovery(d);
                      setDomain(d.domains[0]?.url || '');
                      setLinkedin(d.linkedins[0]?.url || '');
                    });
                  else
                    void run('Building your company profile', async () => {
                      const c = await api<Company>({ action: 'enrich', name, domain, linkedin });
                      setCompany(c);
                    });
                }}
              >
                <label>
                  Company name
                  <input
                    required
                    minLength={2}
                    maxLength={120}
                    placeholder="e.g. Forma"
                    value={name}
                    disabled={!!discovery || !!busy}
                    onChange={(e) => setName(e.target.value)}
                  />
                </label>
                {discovery && (
                  <>
                    <label>
                      Company website
                      {discovery.domains.length > 0 && (
                        <select
                          aria-label="Website candidates"
                          value={discovery.domains.some((d) => d.url === domain) ? domain : ''}
                          onChange={(e) => setDomain(e.target.value)}
                        >
                          <option value="">Enter manually</option>
                          {discovery.domains.map((d) => (
                            <option key={d.url} value={d.url}>
                              {d.label}
                            </option>
                          ))}
                        </select>
                      )}
                      <input
                        type="url"
                        pattern="https://.*"
                        placeholder="https://yourcompany.com (optional)"
                        value={domain}
                        onChange={(e) => setDomain(e.target.value)}
                      />
                    </label>
                    <label>
                      LinkedIn company page
                      {discovery.linkedins.length > 0 && (
                        <select
                          aria-label="LinkedIn candidates"
                          value={
                            discovery.linkedins.some((d) => d.url === linkedin) ? linkedin : ''
                          }
                          onChange={(e) => setLinkedin(e.target.value)}
                        >
                          <option value="">Enter manually</option>
                          {discovery.linkedins.map((d) => (
                            <option key={d.url} value={d.url}>
                              {d.label}
                            </option>
                          ))}
                        </select>
                      )}
                      <input
                        type="url"
                        pattern="https://.*"
                        placeholder="https://www.linkedin.com/company/... (optional)"
                        value={linkedin}
                        onChange={(e) => setLinkedin(e.target.value)}
                      />
                    </label>
                    <p className="fine">
                      Audiences are inferred when research is connected. You can review and edit
                      them in your workspace.
                    </p>
                  </>
                )}
                <button className="primary full" disabled={!!busy}>
                  {discovery ? 'Open my workspace' : 'Find my company'}
                  <ArrowRight size={17} />
                </button>
              </form>
              {discovery && (
                <button className="text-button" onClick={() => setDiscovery(null)}>
                  Use a different name
                </button>
              )}
              <div className="divider">or explore first</div>
              <button
                className="secondary full"
                disabled={!!busy}
                onClick={() => setCompany(demoCompany('Forma', '', '', true))}
              >
                Explore the demo workspace <ArrowUpRight size={16} />
              </button>
              <p className="fine center">
                Forma is fictional. No live rankings or company facts are implied.
              </p>
              {status?.protected && (
                <label>
                  Workspace access key
                  <input
                    type="password"
                    autoComplete="off"
                    value={accessKey}
                    onChange={(e) => setAccessKey(e.target.value)}
                    placeholder="Provided by your workspace owner"
                  />
                </label>
              )}
            </section>
          </main>
          <footer className="setup-footer">
            INK · Turn your brand into the answer.
            <span>Built on evidence. Designed for clarity.</span>
          </footer>
        </div>
      ) : (
        <div className="shell">
          <aside className={`sidebar ${sidebar ? 'open' : ''}`} aria-label="Workspace navigation">
            <div className="sidebar-brand">
              <Brand />
              <button
                className="icon-button mobile"
                aria-label="Close navigation"
                onClick={() => setSidebar(false)}
              >
                <X size={20} />
              </button>
            </div>
            <button className="company-switch" onClick={() => go('Company intelligence')}>
              <span className="avatar">{company.name.slice(0, 1).toUpperCase()}</span>
              <span>
                <strong>{company.name}</strong>
                <small>
                  {company.mode === 'live'
                    ? 'Research workspace'
                    : company.mode === 'manual'
                      ? 'Custom workspace'
                      : 'Demo workspace'}
                </small>
              </span>
              <ChevronRight size={15} />
            </button>
            <div className="nav-label">WORKSPACE</div>
            <nav>
              {navigation.map((n) => (
                <button
                  key={n.name}
                  className={tab === n.name ? 'active' : ''}
                  aria-current={tab === n.name ? 'page' : undefined}
                  onClick={() => go(n.name)}
                >
                  <n.icon size={18} />
                  {n.name}
                  {n.name === 'Article library' && articles.length > 0 && (
                    <span className="count">{articles.length}</span>
                  )}
                </button>
              ))}
            </nav>
            <div className="sidebar-bottom">
              <div className="evidence-note">
                <ShieldCheck size={19} />
                <strong>Clarity, not guesswork.</strong>
                <p>
                  Every signal has a source.
                  <br />
                  Every unknown stays visible.
                </p>
              </div>
              <button
                className={tab === 'Settings' ? 'active nav-settings' : 'nav-settings'}
                onClick={() => go('Settings')}
              >
                <Settings2 size={18} />
                Settings
              </button>
              <div className="profile">
                <span className="avatar small">Y</span>
                <span>
                  Your workspace<small>Saved on this device</small>
                </span>
              </div>
            </div>
          </aside>
          {sidebar && (
            <button
              className="scrim"
              aria-label="Close navigation"
              onClick={() => setSidebar(false)}
            />
          )}
          <div className="workspace">
            <header className="topbar">
              <div>
                <button
                  className="icon-button mobile"
                  aria-label="Toggle navigation"
                  aria-expanded={sidebar}
                  onClick={() => setSidebar(!sidebar)}
                >
                  <Menu size={19} />
                </button>
                <span className="breadcrumb">
                  Workspace <ChevronRight size={13} /> <strong>{tab}</strong>
                </span>
              </div>
              <div>
                <span className="mode-badge">
                  {company.mode === 'live'
                    ? 'Sourced profile'
                    : company.mode === 'manual'
                      ? 'Custom context'
                      : 'Demo mode'}
                </span>
                <span className="top-avatar">{company.name[0].toUpperCase()}</span>
              </div>
            </header>
            <main id="main" ref={main} tabIndex={-1} className="main-content">
              {alerts}
              {tab === 'Overview' && (
                <>
                  <div className="page-heading">
                    <div>
                      <div className="eyebrow">YOUR VISIBILITY, IN FOCUS</div>
                      <h1>Make your next move matter.</h1>
                      <p>A clearer view of {company.name}. A better idea of what comes next.</p>
                    </div>
                    <button
                      className="secondary"
                      disabled={!!busy}
                      onClick={() =>
                        void run('Refreshing search performance', async () => {
                          setMetrics(
                            await api<Analytics | null>({
                              action: 'analytics',
                              domain: company.domain,
                            }),
                          );
                          setNotice(
                            status?.analytics
                              ? 'Search performance refreshed.'
                              : 'Connect a search analytics adapter in your deployment to see measured performance.',
                          );
                        })
                      }
                    >
                      <BarChart3 size={16} />
                      Refresh signals
                    </button>
                  </div>
                  <section className="visibility-panel">
                    <div className="visibility-lead">
                      <span className="eyebrow">VISIBILITY SNAPSHOT</span>
                      <h2>
                        Your presence.
                        <br />
                        The whole picture.
                      </h2>
                      <p>Understand where people find you across search and AI answers.</p>
                      <button className="text-button light" onClick={() => go('Settings')}>
                        Connect your data <ArrowRight size={16} />
                      </button>
                    </div>
                    <div className="metric">
                      <span className="metric-icon">
                        <Search size={19} />
                      </span>
                      <span>Search visibility</span>
                      <strong>
                        {metrics
                          ? metrics.keywords.reduce((n, k) => n + k.impressions, 0).toLocaleString()
                          : 'Not measured'}
                      </strong>
                      <small>
                        {metrics
                          ? 'Impressions in returned query rows'
                          : 'Connect Search Console or Bing'}
                      </small>
                    </div>
                    <div className="metric">
                      <span className="metric-icon">
                        <Sparkles size={19} />
                      </span>
                      <span>AI answer presence</span>
                      <strong>Not measured</strong>
                      <small>No AI mention data connected</small>
                    </div>
                    <div className="metric">
                      <span className="metric-icon">
                        <FileText size={19} />
                      </span>
                      <span>Content opportunities</span>
                      <strong className="numeric">05</strong>
                      <small>Personalized editorial hypotheses</small>
                    </div>
                  </section>
                  <div className="overview-grid">
                    <section className="opportunities">
                      <div className="section-heading">
                        <div>
                          <span className="eyebrow">A PURPOSE BEHIND EVERY PIECE</span>
                          <h2>Your next five opportunities</h2>
                        </div>
                        <span className="badge">Prioritized for you</span>
                      </div>
                      <p className="section-description">
                        Built around your audience and company context. Priority is editorial, not a
                        ranking prediction.
                      </p>
                      <div className="opportunity-list">
                        {ideas.map((idea, i) => (
                          <article className="opportunity" key={idea.id}>
                            <span className="index">0{i + 1}</span>
                            <div className="opportunity-body">
                              <div className="tags">
                                <span className={i === 0 ? 'tag blue' : 'tag'}>{idea.channel}</span>
                                <span>{idea.intent} intent</span>
                                {i === 0 && <span className="recommended">Start here</span>}
                              </div>
                              <h3>{idea.title}</h3>
                              <p>{idea.reason}</p>
                              <details>
                                <summary>Why this opportunity</summary>
                                <p>{idea.evidence}</p>
                                <small>
                                  Audience: {idea.audience}
                                  <br />
                                  Editorial priority: {idea.priority}/100
                                </small>
                              </details>
                            </div>
                            <button
                              className="round-button"
                              aria-label={`Generate article: ${idea.title}`}
                              disabled={!!busy}
                              onClick={() => void generate(idea.brief)}
                            >
                              <ArrowUpRight size={20} />
                            </button>
                          </article>
                        ))}
                      </div>
                    </section>
                    <aside className="right-rail">
                      <section className="writer-card">
                        <span className="writer-icon">
                          <Sparkles size={22} />
                        </span>
                        <h2>Something on your mind?</h2>
                        <p>
                          Bring your own idea. We’ll help shape it into an article worth reading.
                        </p>
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            void generate(brief);
                          }}
                        >
                          <label className="sr-only" htmlFor="brief">
                            Article brief
                          </label>
                          <textarea
                            id="brief"
                            ref={writer}
                            required
                            minLength={12}
                            maxLength={3000}
                            rows={6}
                            value={brief}
                            onChange={(e) => setBrief(e.target.value)}
                            placeholder="What should your audience understand? Include the topic, angle and any questions to answer."
                          />
                          <div className="writer-meta">
                            <span>{settings.tone}</span>
                            <span>{brief.length}/3000</span>
                          </div>
                          <button
                            className="primary full"
                            disabled={!!busy || brief.trim().length < 12}
                          >
                            Generate article <Sparkles size={15} />
                          </button>
                        </form>
                        <p className="fine">
                          {status?.llm && status?.search
                            ? 'Research-backed draft. Human review required.'
                            : 'Demo template until research and writing are connected.'}
                        </p>
                      </section>
                      <section className="audience-card">
                        <div className="section-heading">
                          <h3>Who you’re writing for</h3>
                          <button
                            className="icon-button"
                            aria-label="Edit target audiences"
                            onClick={() => go('Company intelligence')}
                          >
                            <ArrowUpRight size={17} />
                          </button>
                        </div>
                        {company.audiences.map((a, i) => (
                          <div className="audience" key={a}>
                            <span>0{i + 1}</span>
                            <p>{a}</p>
                          </div>
                        ))}
                        <small>Inferred or supplied context. Review before publishing.</small>
                      </section>
                      <div className="rail-note">
                        <ShieldCheck size={18} />
                        <p>
                          Good content starts with something true. Sources travel with every
                          researched draft.
                        </p>
                      </div>
                    </aside>
                  </div>
                </>
              )}
              {tab === 'Company intelligence' && (
                <>
                  <PageTitle
                    eyebrow="THE CONTEXT BEHIND THE CONTENT"
                    title="Know your company’s world."
                    description="Review company facts and refine the context that shapes your recommendations."
                  />
                  <div className="two-columns">
                    <section className="panel">
                      <h2>Company profile</h2>
                      <span className="badge">
                        {company.mode} context · Updated {date(company.updatedAt)}
                      </span>
                      <form
                        className="profile-form"
                        onSubmit={(e) => {
                          e.preventDefault();
                          const f = new FormData(e.currentTarget);
                          const updated = companySchema.safeParse({
                            ...company,
                            name: f.get('name'),
                            domain: f.get('domain'),
                            linkedin: f.get('linkedin'),
                            description: f.get('description'),
                            industry: f.get('industry'),
                            audiences: String(f.get('audiences'))
                              .split('\n')
                              .map((s) => s.trim())
                              .filter(Boolean),
                            topics: String(f.get('topics'))
                              .split(',')
                              .map((s) => s.trim())
                              .filter(Boolean),
                            mode: 'manual',
                            sources: [],
                            updatedAt: new Date().toISOString(),
                          });
                          if (!updated.success) {
                            setError('Check your company details. URLs must start with https://.');
                            return;
                          }
                          setCompany(cleanDashes(updated.data));
                          setMetrics(null);
                          setNotice('Company context saved. Recommendations have been updated.');
                        }}
                      >
                        <label>
                          Company name
                          <input name="name" required maxLength={120} defaultValue={company.name} />
                        </label>
                        <label>
                          Website
                          <input
                            name="domain"
                            type="url"
                            defaultValue={company.domain}
                            placeholder="https://example.com"
                          />
                        </label>
                        <label>
                          LinkedIn
                          <input
                            name="linkedin"
                            type="url"
                            defaultValue={company.linkedin}
                            placeholder="https://www.linkedin.com/company/..."
                          />
                        </label>
                        <label>
                          Industry
                          <input name="industry" required defaultValue={company.industry} />
                        </label>
                        <label>
                          What the company does
                          <textarea
                            name="description"
                            rows={3}
                            defaultValue={company.description}
                          />
                        </label>
                        <label>
                          Target audiences, one per line
                          <textarea
                            name="audiences"
                            rows={3}
                            defaultValue={company.audiences.join('\n')}
                          />
                        </label>
                        <label>
                          Topical focus, separated by commas
                          <input name="topics" defaultValue={company.topics.join(', ')} />
                        </label>
                        <button className="primary">
                          Save company context <Check size={16} />
                        </button>
                      </form>
                    </section>
                    <div className="stack">
                      <section className="panel">
                        <h2>Company intelligence</h2>
                        <Fact
                          label="Founders and owners"
                          value={company.founders.join(', ') || 'Not verified'}
                        />
                        <Fact label="Funding or bootstrap status" value={company.funding} />
                        <Fact
                          label="Competitors"
                          value={
                            company.competitors.join(', ') || 'No verified competitors connected'
                          }
                        />
                        <Fact
                          label="Target personas"
                          value={company.audiences.join('; ') || 'Add target audiences'}
                        />
                        <Fact
                          label="Recommended channels"
                          value="Search, AI answers, owned content"
                        />
                        <Fact
                          label="Topical authority"
                          value="Not measured. Topic suggestions are not an authority score."
                        />
                        <Fact
                          label="Topics to explore"
                          value={
                            company.topics.join(', ') || 'Add topics to personalize opportunities'
                          }
                        />
                      </section>
                      <section className="panel">
                        <h2>Ranked keywords</h2>
                        {metrics?.keywords.length ? (
                          <>
                            <small>
                              {metrics.provider} · {metrics.startDate} to {metrics.endDate}
                              <br />
                              Retrieved {date(metrics.retrievedAt)}
                            </small>
                            <div className="table-scroll">
                              <table>
                                <thead>
                                  <tr>
                                    <th>Keyword</th>
                                    <th>Avg. position</th>
                                    <th>Clicks</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {metrics.keywords.map((k) => (
                                    <tr key={k.query}>
                                      <td>{k.query}</td>
                                      <td>{k.position.toFixed(1)}</td>
                                      <td>{k.clicks}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                            <Sources sources={metrics.sources} />
                          </>
                        ) : (
                          <Empty
                            icon={<BarChart3 />}
                            title="Your rankings belong here."
                            text="Connect a search analytics source and refresh signals from Overview. No ranking data is simulated."
                          />
                        )}
                      </section>
                      <section className="panel">
                        <h2>Evidence behind the profile</h2>
                        <Sources sources={company.sources} />
                      </section>
                    </div>
                  </div>
                </>
              )}
              {tab === 'Article library' && (
                <>
                  <PageTitle
                    eyebrow="YOUR IDEAS, TAKING SHAPE"
                    title="A home for your next words."
                    description="Drafts are saved in this browser. Export important work to keep a separate copy."
                  />
                  <div className="library-tools">
                    <label className="search-field">
                      <Search size={17} />
                      <input
                        aria-label="Search drafts"
                        placeholder="Search your drafts"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                      />
                    </label>
                    <button
                      className="primary"
                      onClick={() => {
                        go('Overview');
                        setTimeout(() => writer.current?.focus(), 50);
                      }}
                    >
                      <Plus size={16} />
                      New article
                    </button>
                  </div>
                  {shownArticles.length ? (
                    <div className="library-grid">
                      {shownArticles.map((a) => (
                        <button className="article-card" key={a.id} onClick={() => setArticle(a)}>
                          <div>
                            <span className="badge">
                              {a.mode === 'demo' ? 'Demo template' : 'Research draft'}
                            </span>
                            <ArrowUpRight size={19} />
                          </div>
                          <h2>{a.title}</h2>
                          <p>{a.summary}</p>
                          <small>
                            {date(a.createdAt)} · {a.sources.length} sources
                          </small>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <section className="panel">
                      <Empty
                        icon={<BookOpen />}
                        title={
                          filter ? 'No matching drafts.' : 'Your first draft is one idea away.'
                        }
                        text={
                          filter
                            ? 'Try a different search.'
                            : 'Choose an opportunity or describe your own article on Overview.'
                        }
                      />
                    </section>
                  )}
                </>
              )}
              {tab === 'Rules watch' && (
                <>
                  <PageTitle
                    eyebrow="STAY GROUNDED AS SEARCH EVOLVES"
                    title="Follow the sources."
                    description="Official guidance, with explicit freshness. A changed page is a prompt to review, not an automatic algorithm claim."
                  />
                  <section className="rules-banner">
                    <div>
                      <ShieldCheck size={26} />
                      <h2>Evidence over optimization folklore.</h2>
                      <p>
                        INK does not promise rankings or invent a single score across SEO, AEO, GEO,
                        AIO and SXO.
                      </p>
                    </div>
                    <button
                      className="primary"
                      disabled={!!busy}
                      onClick={() =>
                        void run('Checking official sources', async () => {
                          const next = await api<Rule[]>({ action: 'rules' });
                          let old: Record<string, string> = {};
                          try {
                            old = JSON.parse(localStorage.getItem('ink.rules.v1') || '{}');
                          } catch {}
                          setRules(
                            next.map((r) => ({
                              ...r,
                              changed: !!old[r.id] && !!r.hash && old[r.id] !== r.hash,
                            })),
                          );
                          try {
                            localStorage.setItem(
                              'ink.rules.v1',
                              JSON.stringify(
                                Object.fromEntries(
                                  next.filter((r) => r.hash).map((r) => [r.id, r.hash]),
                                ),
                              ),
                            );
                          } catch {}
                          setNotice(
                            'Source checks complete. Review changes before updating your editorial rules.',
                          );
                        })
                      }
                    >
                      <Radar size={16} />
                      Check official sources
                    </button>
                  </section>
                  {rules.length ? (
                    <div className="stack">
                      {rules.map((r) => (
                        <section className="panel rule" key={r.id}>
                          <div>
                            <span className="badge">
                              {r.status}
                              {r.changed ? ' · Page changed' : ''}
                            </span>
                            <h2>{r.title}</h2>
                            <p>{r.principle}</p>
                            <small>
                              {r.note}
                              <br />
                              Checked {date(r.checkedAt)}
                              {r.modifiedAt ? ` · Source last modified: ${r.modifiedAt}` : ''}
                            </small>
                          </div>
                          <a href={r.url} target="_blank" rel="noreferrer">
                            Read guidance <ArrowUpRight size={16} />
                          </a>
                        </section>
                      ))}
                    </div>
                  ) : (
                    <section className="panel">
                      <Empty
                        icon={<Radar />}
                        title="No freshness claim without a check."
                        text="Check official sources to retrieve page fingerprints and timestamps. Checks are on demand; no background scheduler is configured."
                      />
                    </section>
                  )}
                </>
              )}
              {tab === 'Settings' && (
                <>
                  <PageTitle
                    eyebrow="MAKE INK YOURS"
                    title="A little direction goes a long way."
                    description="Set your writing preferences and see which sources are connected."
                  />
                  <div className="two-columns">
                    <section className="panel">
                      <h2>Writing preferences</h2>
                      <label>
                        Tone
                        <select
                          value={settings.tone}
                          onChange={(e) =>
                            setSettings({ ...settings, tone: e.target.value as Settings['tone'] })
                          }
                        >
                          {['Clear and confident', 'Warm and helpful', 'Technical and precise'].map(
                            (t) => (
                              <option key={t}>{t}</option>
                            ),
                          )}
                        </select>
                      </label>
                      <label className="checkbox">
                        <input
                          type="checkbox"
                          checked={settings.noDashes}
                          onChange={(e) => setSettings({ ...settings, noDashes: e.target.checked })}
                        />
                        <span>
                          Remove em and en dashes from generated articles
                          <small>Enabled by default. Interface copy always avoids them.</small>
                        </span>
                      </label>
                      <label>
                        Workspace access key
                        <input
                          type="password"
                          autoComplete="off"
                          value={accessKey}
                          onChange={(e) => setAccessKey(e.target.value)}
                          placeholder="Required only for live integrations"
                        />
                        <small>
                          Held in memory for this session. Never saved to browser storage.
                        </small>
                      </label>
                      <div className="divider" />
                      <h3>Your data</h3>
                      <p className="muted">
                        The latest 30 drafts and company context stay in this browser. Clearing
                        browser data removes them. This is a single-workspace app without user
                        accounts or cloud sync.
                      </p>
                      <button
                        className="secondary"
                        onClick={() =>
                          download(
                            JSON.stringify({ company, settings, articles }, null, 2),
                            'ink-workspace.json',
                            'application/json',
                          )
                        }
                      >
                        <ArrowDownToLine size={16} />
                        Export workspace backup
                      </button>
                      <button
                        className="text-button"
                        onClick={() => {
                          if (
                            window.confirm(
                              'Switch company? Your article library will stay on this device.',
                            )
                          ) {
                            setCompany(null);
                            setDiscovery(null);
                            setName('');
                            setMetrics(null);
                            setTab('Overview');
                          }
                        }}
                      >
                        Switch company
                      </button>
                    </section>
                    <section className="panel">
                      <h2>Connections</h2>
                      <p className="muted">
                        Your deployment owner connects providers using environment variables. Keys
                        stay on the server.
                      </p>
                      {[
                        {
                          name: 'Search and research',
                          connected: status?.search,
                          detail: 'Brave Search for company candidates and source excerpts.',
                        },
                        {
                          name: 'Article intelligence',
                          connected: status?.llm,
                          detail: 'An OpenAI-compatible provider for research-assisted writing.',
                        },
                        {
                          name: 'Company enrichment',
                          connected: status?.company,
                          detail: 'A trusted company data adapter for sourced facts.',
                        },
                        {
                          name: 'Search performance',
                          connected: status?.analytics,
                          detail: 'A gateway for Google Search Console or Bing Webmaster data.',
                        },
                      ].map((c) => (
                        <div className="connection" key={c.name}>
                          <div>
                            <h3>{c.name}</h3>
                            <p>{c.detail}</p>
                          </div>
                          <span className={`badge ${c.connected ? 'blue' : ''}`}>
                            {c.connected ? 'Configured' : 'Not connected'}
                          </span>
                        </div>
                      ))}
                      {status?.locked && (
                        <p className="alert error">
                          Live requests are locked until the owner sets INK_ACCESS_KEY.
                        </p>
                      )}
                      <p className="fine">
                        Configured means credentials are present, not that a connection has passed a
                        live test. Provider errors are shown when a request is made.
                      </p>
                    </section>
                  </div>
                </>
              )}
              <footer className="workspace-footer">
                <span>INK · Organic visibility intelligence</span>
                <span>Thoughtful content. Traceable evidence.</span>
              </footer>
            </main>
          </div>
        </div>
      )}
      <dialog
        ref={dialog}
        className="article-dialog"
        aria-labelledby="article-title"
        onCancel={() => setArticle(null)}
        onClick={(e) => {
          if (e.target === dialog.current) setArticle(null);
        }}
      >
        {article && (
          <>
            <header className="article-toolbar">
              <span>
                <FileText size={18} /> INK Library / Draft
              </span>
              <div>
                <button
                  className="secondary"
                  onClick={() => {
                    void navigator.clipboard
                      .writeText(articleMarkdown(article))
                      .then(() => setNotice('Article copied to clipboard.'))
                      .catch(() => setNotice('Clipboard unavailable. Use Download instead.'));
                  }}
                >
                  {' '}
                  <Copy size={15} />
                  Copy
                </button>
                <button
                  className="secondary"
                  onClick={() =>
                    download(articleMarkdown(article), `${article.slug || 'ink-article'}.md`)
                  }
                >
                  <ArrowDownToLine size={15} />
                  Download
                </button>
                <button
                  className="icon-button"
                  aria-label="Close article"
                  onClick={() => setArticle(null)}
                >
                  <X size={21} />
                </button>
              </div>
            </header>
            <div className="article-body">
              {notice && (
                <p role="status" className="alert">
                  {notice}
                </p>
              )}
              <div className="tags">
                <span className="tag blue">
                  {article.mode === 'demo' ? 'Demo template' : 'Research-assisted draft'}
                </span>
                <span>{article.tone}</span>
              </div>
              <h1 id="article-title">{article.title}</h1>
              <p className="article-summary">{article.summary}</p>
              <div className="article-metadata">
                <Fact label="Meta title" value={article.metaTitle} />
                <Fact label="Meta description" value={article.metaDescription} />
                <Fact label="Slug" value={article.slug} />
                <Fact label="Audience" value={article.audience} />
                <Fact label="Intent" value={article.intent} />
              </div>
              {article.sections.map((s, i) => (
                <section className="prose" key={i}>
                  <h2>{s.heading}</h2>
                  {s.body.split('\n\n').map((p, j) => (
                    <p key={j}>{p}</p>
                  ))}
                </section>
              ))}
              <section className="prose">
                <h2>Frequently asked questions</h2>
                {article.faqs.map((f, i) => (
                  <div key={i}>
                    <h3>{f.question}</h3>
                    <p>{f.answer}</p>
                  </div>
                ))}
              </section>
              <section className="article-recommendations">
                <h2>Make it ready to publish</h2>
                <h3>Images and alt text</h3>
                {article.images.map((im, i) => (
                  <div key={i}>
                    <strong>{im.placement}</strong>
                    <p>{im.recommendation}</p>
                    <small>Alt text: {im.alt}</small>
                  </div>
                ))}
                <h3>Internal links</h3>
                <ul>
                  {article.internalLinks.map((v, i) => (
                    <li key={i}>{v}</li>
                  ))}
                </ul>
                <h3>Link-earning ideas</h3>
                <ul>
                  {article.linkEarning.map((v, i) => (
                    <li key={i}>{v}</li>
                  ))}
                </ul>
                <h3>Schema recommendation</h3>
                <p>{article.schema}</p>
              </section>
              <section>
                <h2>Sources and provenance</h2>
                <Sources sources={article.sources} />
              </section>
              <section className="review-notes">
                <h3>Before you publish</h3>
                <ul>
                  {article.reviewNotes.map((v, i) => (
                    <li key={i}>{v}</li>
                  ))}
                </ul>
                <small>
                  Generated {date(article.createdAt)}. Citations do not replace editorial review.
                </small>
              </section>
            </div>
          </>
        )}
      </dialog>
    </>
  );
}
function PageTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
    </div>
  );
}
function Fact({ label, value }: { label: string; value: string }) {
  return (
    <dl className="fact">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </dl>
  );
}
function Empty({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="empty">
      <div>{icon}</div>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}
