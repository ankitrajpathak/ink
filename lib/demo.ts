import type { Article, Company } from './model';
export function demoCompany(name: string, domain = '', linkedin = '', sample = false): Company {
  return {
    name,
    domain,
    linkedin,
    industry: sample ? 'collaborative workspace software' : 'your category',
    description: sample
      ? 'A fictional workspace platform that helps distributed teams turn scattered projects into focused work.'
      : 'Company details are not connected. Edit this profile to make your content recommendations relevant.',
    audiences: sample
      ? [
          'Operations leaders at growing teams',
          'Founders of distributed companies',
          'Project managers',
        ]
      : ['Prospective customers (unverified)'],
    founders: [],
    funding: 'Not verified',
    competitors: [],
    topics: sample ? ['team collaboration', 'async work', 'project planning'] : [],
    sources: [],
    mode: 'demo',
    updatedAt: new Date().toISOString(),
  };
}
export function demoArticle(company: Company, brief: string, tone: string): Article {
  const topic = company.topics[0] || company.industry;
  const title = brief
    .replace(/^Write\s+/i, '')
    .split(/\n/)[0]
    .slice(0, 110);
  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    mode: 'demo',
    tone,
    title,
    metaTitle: title.slice(0, 60),
    metaDescription:
      `A practical framework for ${company.audiences[0] || 'your team'} to evaluate ${topic}, make decisions and plan their next step.`.slice(
        0,
        160,
      ),
    slug: title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, ''),
    audience: company.audiences[0] || 'Prospective customers',
    intent: 'Informational',
    summary: `This editable example shows how ${company.name} could structure an article around your brief. It contains general editorial guidance, not researched claims about this company or its market.`,
    sections: [
      {
        heading: 'Start with the problem you need to solve',
        body: `Before choosing an approach to ${topic}, write down the outcome you want and the constraint that makes it difficult today. Describe a real situation in plain language. Who is involved, what are they trying to do, and where does progress stop?\n\nUse this problem statement as your starting point: our team needs to achieve a specific outcome, but a specific obstacle gets in the way. Ask the people doing the work to review the statement before deciding on a solution.`,
      },
      {
        heading: 'Build a decision framework',
        body: 'Create a short list of requirements and divide them into essential and optional criteria. For each essential criterion, decide what evidence would demonstrate that it has been met. A product demonstration, documented process or small trial can be more useful than an unsupported promise.\n\nCompare options using the same scenario. Record setup effort, ongoing responsibilities, accessibility needs and the total resources required. Keep unknowns visible instead of assigning them optimistic scores.',
      },
      {
        heading: 'Run a small, measurable trial',
        body: 'Choose one workflow and define a starting point. Agree on a review date and decide who will collect feedback. Track the outcome that matters to the people using the workflow, alongside any time or resources it takes to maintain.\n\nAt the end of the trial, document what improved, what did not and what remains uncertain. If the trial exposes a new constraint, update the approach before expanding it. A useful trial produces a decision, even when that decision is to stop.',
      },
      {
        heading: 'Turn learning into a repeatable process',
        body: `Create a concise guide that explains the process, the owner of each step and how to ask for help. Review it with someone who did not design the process. Their questions can reveal unclear assumptions.\n\nFor ${company.name}, the next editorial step is to replace this example with verified product details, a real customer scenario and relevant primary sources. Keep statements proportional to the evidence and make limitations easy to find.`,
      },
    ],
    faqs: [
      {
        question: 'Where should a team start?',
        answer:
          'Choose one concrete problem, agree on what success means and test a small change before expanding it.',
      },
      {
        question: 'How should options be compared?',
        answer:
          'Use the same requirements and trial scenario for every option. Document evidence, costs and unanswered questions.',
      },
      {
        question: 'When is this article ready to publish?',
        answer:
          'After a subject expert adds company-specific evidence, verifies every factual claim and approves the final draft.',
      },
    ],
    images: [
      {
        placement: 'After the decision framework',
        recommendation:
          'An original comparison worksheet with essential criteria and evidence columns.',
        alt: `Decision worksheet for evaluating ${topic}`,
      },
      {
        placement: 'After the trial section',
        recommendation: 'An original diagram showing baseline, trial, review and decision.',
        alt: 'Four stages of a small evaluation trial',
      },
    ],
    internalLinks: [
      `Link to an existing ${topic} product or service page after confirming its URL.`,
      `Link to a relevant ${company.name} case study only if one exists.`,
    ],
    linkEarning: [
      'Publish an original, downloadable decision worksheet.',
      'Invite a subject expert to contribute a documented example with permission.',
    ],
    schema:
      'Consider Article markup with truthful author, headline and publication dates. FAQ content does not guarantee a rich result.',
    citationIds: [],
    sources: [],
    reviewNotes: [
      'Demo template: no research sources were retrieved.',
      'Connect search and an LLM for a researched draft.',
      'Add verified company facts and real examples before publishing.',
    ],
  };
}
