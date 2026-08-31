export type EvidenceLevel = 'explicit' | 'inferred' | 'missing'

export type Requirement = {
  id: string
  label: string
  must: boolean
}

export type ResumeEvidence = {
  reqId: string
  level: EvidenceLevel
  note: string
}

export type OralAnswer = {
  questionId: string
  answer: string
  note: string
}

export type DimensionScores = {
  problemSolving: number
  communication: number
  collaboration: number
}

export type Candidate = {
  id: string
  name: string
  initials: string
  accent: 'coral' | 'gold' | 'blue' | 'green'
  stage: string
  match: string
  assessed: boolean
  resume: string
  highlights: string[]
  evidence: ResumeEvidence[]
  dim: DimensionScores
  oral: OralAnswer[]
  written: string
  strengths: string[]
  concerns: string[]
  followUps: string[]
}

export type Question = {
  id: string
  tag: string
  competency: string
  text: string
  expected: string
}

// ---------------------------------------------------------------------------
// Role requirements
// ---------------------------------------------------------------------------
export const roleTitle = 'Senior Product Designer'

export const roleBrief =
  'We are looking for a senior product designer who can lead complex, user-centered work from discovery through launch. Strong systems thinking, product judgment, and close collaboration with engineering are essential.'

export const requirements: Requirement[] = [
  { id: 'product-design', label: '5+ years of product/UX design for digital products', must: true },
  { id: 'end-to-end', label: 'Owns work end to end — discovery through shipped outcome', must: true },
  { id: 'systems', label: 'Systems thinking / design-system fluency', must: true },
  { id: 'eng-collab', label: 'Proven collaboration with engineering', must: true },
  { id: 'mobile', label: 'Mobile product experience', must: false },
  { id: 'prototyping', label: 'Prototyping and user testing', must: false },
  { id: 'leadership', label: 'Mentoring or leading designers', must: false },
  { id: 'b2b-saas', label: 'B2B SaaS domain experience', must: false },
]

// ---------------------------------------------------------------------------
// Objective rubric (weights total 100%)
// ---------------------------------------------------------------------------
export const rubric = {
  roleEvidence: { weight: 0.4, label: 'Role evidence', note: 'Resume evidence against the job requirements above.' },
  problemSolving: { weight: 0.3, label: 'Problem solving', note: 'Quality of reasoning across oral + written answers.' },
  communication: { weight: 0.2, label: 'Communication', note: 'Clarity, structure, and written quality.' },
  collaboration: { weight: 0.1, label: 'Collaboration', note: 'Working with engineering and stakeholders.' },
}

export const MUST_WEIGHT = 2
export const PREF_WEIGHT = 1

const LEVEL_VALUE: Record<EvidenceLevel, number> = { explicit: 1, inferred: 0.5, missing: 0 }

export function computeRoleEvidence(evidence: ResumeEvidence[]): number {
  const totalWeight = requirements.reduce((sum, r) => sum + (r.must ? MUST_WEIGHT : PREF_WEIGHT), 0)
  const earned = evidence.reduce((sum, e) => {
    const req = requirements.find((r) => r.id === e.reqId)
    if (!req) return sum
    return sum + (req.must ? MUST_WEIGHT : PREF_WEIGHT) * LEVEL_VALUE[e.level]
  }, 0)
  return Math.round((100 * earned) / totalWeight)
}

export function computeTotal(c: Candidate): number {
  const roleEvidence = computeRoleEvidence(c.evidence)
  return Math.round(
    rubric.roleEvidence.weight * roleEvidence +
      rubric.problemSolving.weight * c.dim.problemSolving +
      rubric.communication.weight * c.dim.communication +
      rubric.collaboration.weight * c.dim.collaboration,
  )
}

export function verdict(total: number): string {
  if (total >= 85) return 'Strong hire'
  if (total >= 70) return 'Hire'
  if (total >= 55) return 'Promising — follow up'
  return 'Not a match for this role'
}

// ---------------------------------------------------------------------------
// Assessment: oral + written
// ---------------------------------------------------------------------------
export const oralQuestions: Question[] = [
  {
    id: 'craft',
    tag: 'Craft & judgment',
    competency: 'Product judgment / problem solving',
    text: 'Walk me through a product decision you changed your mind about. What changed it?',
    expected:
      'A concrete example with the candidate’s own actions, the evidence that changed their mind, the tradeoff they accepted, and a measurable outcome.',
  },
  {
    id: 'systems',
    tag: 'Systems thinking',
    competency: 'Systems thinking',
    text: 'How do you create a design system that stays useful as a product grows?',
    expected:
      'A point of view on tokens, governance, contribution, and documentation — plus evidence the candidate has built or maintained one under real constraints.',
  },
  {
    id: 'collaboration',
    tag: 'Collaboration',
    competency: 'Cross-functional collaboration',
    text: 'Tell me about a time you brought engineering into the design process early.',
    expected:
      'A specific moment where early engineering input changed the design, not just the implementation, and what the candidate did to make it happen.',
  },
]

export const writtenTask = {
  title: 'Written assessment',
  prompt:
    'Design a “guided onboarding” plan for a fast-growing B2B SaaS product. Cover: goals, your approach, the key risks, and how you would measure success.',
  constraints: 'Suggested 45 minutes, ~500 words. Graded on structured problem solving, realistic tradeoffs, and clarity.',
}

// ---------------------------------------------------------------------------
// Candidates
// ---------------------------------------------------------------------------
export const candidates: Candidate[] = [
  {
    id: 'maya',
    name: 'Maya Chen',
    initials: 'MC',
    accent: 'coral',
    stage: 'Interviewed',
    match: 'Strong craft + systems thinking',
    assessed: true,
    resume: `Maya Chen — Senior Product Designer
7 years designing complex B2B SaaS products end to end.

EXPERIENCE
Senior Product Designer, Lumen Analytics (B2B data SaaS) · 2021–Present
- Owned the end-to-end redesign of the reporting workspace: led discovery interviews with 18 enterprise users, ran two rounds of usability testing, and shipped a 32% faster time-to-first-dashboard with +18 NPS.
- Built and govern "Lumen UI", a token-based design system adopted across 4 product squads; cut design-to-dev handoff time by 40%.
- Partner with engineering from kickoff: run weekly design/eng crits and co-wrote the component API contract that reduced rework.

Product Designer, Finwell (fintech) · 2018–2021
- Shipped mobile onboarding flows that lifted activation by 22% (A/B tested).
- Mentored two junior designers and led a design-crit ritual adopted by the team.

Product Designer, Studio North (agency) · 2016–2018
- Designed and shipped web apps for retail and health clients; introduced the studio's first reusable UI kit.

SKILLS
Systems thinking · Interaction design · Prototyping (Figma, Principle) · Usability testing · Design tokens · Mobile · Data-viz

EDUCATION
B.Des, Interaction Design — 2016`,
    highlights: [
      '7 yrs end-to-end B2B SaaS product design',
      'Built + governs a cross-squad design system (40% faster handoff)',
      'Owns discovery → launch with measured outcomes (32% faster, +18 NPS)',
    ],
    evidence: [
      { reqId: 'product-design', level: 'explicit', note: '“7 years designing complex B2B SaaS products.”' },
      { reqId: 'end-to-end', level: 'explicit', note: '“Owned the end-to-end redesign… discovery interviews… shipped.”' },
      { reqId: 'systems', level: 'explicit', note: '“Built and govern Lumen UI, a token-based design system across 4 squads.”' },
      { reqId: 'eng-collab', level: 'explicit', note: '“Co-wrote the component API contract” with front-end engineers.' },
      { reqId: 'mobile', level: 'explicit', note: '“Shipped mobile onboarding flows” at Finwell.' },
      { reqId: 'prototyping', level: 'explicit', note: 'Prototyping (Figma, Principle) + two rounds of usability testing.' },
      { reqId: 'leadership', level: 'inferred', note: 'Mentored two junior designers — mentoring, not formal people management.' },
      { reqId: 'b2b-saas', level: 'explicit', note: 'Lumen Analytics (B2B data SaaS) + Finwell (fintech).' },
    ],
    dim: { problemSolving: 92, communication: 90, collaboration: 88 },
    oral: [
      {
        questionId: 'craft',
        answer:
          'During the Lumen redesign I was convinced a dense, pro-level table view was right for analysts. In the fourth usability test I watched two enterprise users miss the “save view” action entirely, and a third called it “spreadsheet anxiety.” I’d bet the launch on power users, but the data showed friction was hurting the mid-market segment we wanted. I changed course to a progressive layout — summary cards first, drill-down on demand — and I owned the tradeoff with the PM that we’d ship slower. Activation rose 22% and navigation support tickets dropped by a third. The framework I now use: if I can’t name the user, the job, and the metric, my opinion is just an opinion.',
        note: 'Concrete example, evidence that changed her mind, an accepted tradeoff, and a measurable outcome — plus a repeatable framework.',
      },
      {
        questionId: 'systems',
        answer:
          'I built Lumen UI on a token layer from day one — color, spacing, and type as the single source of truth — because I’d seen bolt-on kits collapse once a second squad joined. The turning point was governance: any designer could propose a component, but it shipped only with a usage guideline, an accessibility check, and a code owner. We federated ownership instead of centralizing it, which is the only way it scales past one team. Today four squads build on it and handoff time is down 40%. The measure of usefulness isn’t the number of components; it’s whether shipping is faster with the system than without it.',
        note: 'Deep, first-hand systems ownership with a clear governance model and a measurable outcome.',
      },
      {
        questionId: 'collaboration',
        answer:
          'On Lumen’s reporting workspace I wrote the component API contract with two front-end engineers before we designed a single screen. I brought them into a discovery debrief so they heard the enterprise users’ constraints in the users’ own words, not filtered through me. When a data-heavy interaction risked slow render times, the lead engineer proposed server-side aggregation, and I redesigned the empty and loading states around that reality. The result was a shared vocabulary that cut rework substantially. My rule: bring engineers in while the problem is still being defined — that’s when their input changes the design, not just the implementation.',
        note: 'Engineers shaped the design itself, not just the build — a clear, replicable collaboration pattern.',
      },
    ],
    written:
      'Goal: get a new team to their first “aha” moment — a live, populated workspace — in under 10 minutes without a sales call. Approach: (1) define activation with the PM as “workspace created + first report generated”; (2) interview 8–10 new customers and mine onboarding drop-off in product analytics to find the exact step where people stall; (3) design a 3-step guided flow with progress, empty-state coaching, and a sample dataset so value is visible before users import their own data; (4) prototype and test with 5 users, iterating on the two riskiest steps. Risks: over-collecting data up front (friction), showing value too late (drop-off), and confusing onboarding with training. Mitigations: ask only for what’s needed to show value, keep the path skippable, and measure each step’s drop-off. Success: activation rate, time-to-first-report, and 14-day retention, A/B tested against the current flow — accepting a slightly longer build to protect mid-funnel activation.',
    strengths: [
      'Full must-have coverage with explicit, measurable evidence',
      'Owns systems governance and engineering partnership, not just outputs',
      'Answers show a repeatable decision framework and quantified outcomes',
    ],
    concerns: [
      'Leadership is inferred (mentoring), not formal people management — verify if the role requires leading designers',
    ],
    followUps: [
      'Tell me about a project that failed or shipped late — what did you learn?',
      'Have you led hiring or formal performance reviews for designers?',
    ],
  },
  {
    id: 'jordan',
    name: 'Jordan Ellis',
    initials: 'JE',
    accent: 'gold',
    stage: 'Interviewed',
    match: 'Excellent product intuition',
    assessed: true,
    resume: `Jordan Ellis — Senior Product Designer
6 years across consumer fintech and B2B products, known for product intuition.

EXPERIENCE
Senior Product Designer, Brightpay (fintech) · 2020–Present
- Led design for the savings product: ran generative research with 20 users and shipped an auto-save feature adopted by 31% of new users in 90 days.
- Contributed components and interaction patterns to the Brightpay design system; led its accessibility audit (WCAG 2.1 AA).
- Facilitated cross-functional "design jams" with product and engineering each sprint.

Product Designer, Loop Commerce (B2B checkout) · 2018–2020
- Redesigned the checkout flow end to end, lifting conversion 9%.
- Prototyped and user-tested pricing experiments with the growth team.

Product Designer, Freelance · 2016–2018
- Designed consumer apps for early-stage startups (iOS + Android).

SKILLS
Product strategy · Prototyping (Figma, Framer) · Accessibility · Mobile · A/B testing

EDUCATION
BFA, Graphic Design — 2015`,
    highlights: [
      '6 yrs product design; owned end-to-end flows',
      'Research → shipped wins (31% adoption, +9% conversion)',
      'Led the design-system accessibility audit (WCAG 2.1 AA)',
    ],
    evidence: [
      { reqId: 'product-design', level: 'explicit', note: '6 years across consumer fintech and B2B.' },
      { reqId: 'end-to-end', level: 'explicit', note: '“Redesigned the checkout flow end to end,” “led design for the savings product.”' },
      { reqId: 'systems', level: 'inferred', note: 'Contributed components + led the accessibility audit — contributor, not system owner.' },
      { reqId: 'eng-collab', level: 'explicit', note: '“Facilitated cross-functional design jams with product and engineering each sprint.”' },
      { reqId: 'mobile', level: 'inferred', note: 'Consumer apps for iOS + Android (freelance).' },
      { reqId: 'prototyping', level: 'explicit', note: '“Prototyped and user-tested pricing experiments.”' },
      { reqId: 'leadership', level: 'missing', note: 'No mentoring or people-leadership evidence.' },
      { reqId: 'b2b-saas', level: 'inferred', note: 'Loop Commerce (B2B checkout) — a single prior role.' },
    ],
    dim: { problemSolving: 88, communication: 85, collaboration: 80 },
    oral: [
      {
        questionId: 'craft',
        answer:
          'On Brightpay’s savings product I pushed for a “round-ups” feature — I thought it was the emotional hook. The generative research changed my mind: users told us round-ups felt gimmicky, and what they actually wanted was a rules-based auto-save that matched their payday. I let go of the flashier idea and shipped the payday-linked auto-save, which 31% of new users adopted within 90 days. What changed my mind was listening for the job users were hiring the product to do rather than the feature I was excited about. The lesson I carry: excitement is a hypothesis, not a roadmap.',
        note: 'Strong, research-led reversal with a clear outcome; slightly less explicit about the tradeoff accepted.',
      },
      {
        questionId: 'systems',
        answer:
          'I’ve been a contributor rather than the owner of our system, but I learned what keeps it healthy from the accessibility audit I led. Systems die when documentation and ownership are unclear, so I pushed for every contributed component to ship with usage guidance and a documented accessibility baseline. My contribution was turning the audit findings into concrete patterns — focus states, contrast tokens, keyboard flows — that other designers could reuse instead of re-deciding each time. The lesson I’d bring: a system stays useful when it encodes decisions so teams spend effort on the product, not on reinventing buttons.',
        note: 'Candid about being a contributor; strong pattern-level thinking, but no end-to-end ownership example.',
      },
      {
        questionId: 'collaboration',
        answer:
          'I run a “design jam” with product and engineering at the start of every sprint. On the auto-save feature, engineering flagged in the first session that real-time savings math had a latency constraint — the “instant” feedback I’d sketched wasn’t possible. Because they were in the room before I’d committed to a direction, I redesigned the confirmation to a batched, end-of-day summary that was honest about timing, and we shipped without a crunch. Early collaboration turned a technical constraint into a design decision we made together instead of a surprise at handoff.',
        note: 'A recurring ritual plus a concrete example where early engineering input changed the design.',
      },
    ],
    written:
      'Goal: make the first session feel valuable fast — “see your money working” within minutes. Approach: start from drop-off data and 8 customer interviews to find where onboarding loses people; design a short guided flow with a demo/sandbox account so users experience the product before connecting a real account; A/B test against the current flow. Risks: asking for too much info too early, and a demo account that feels fake. Mitigations: collect only the minimum to personalize, and keep the sandbox clearly labeled. Success: activation (first auto-save created), time-to-value, and 30-day retention — noting retention is confounded by seasonality, so I’d hold activation as the primary metric.',
    strengths: [
      'Strong product intuition backed by research and shipped outcomes',
      'Accessibility depth (led a WCAG 2.1 AA audit) is a differentiator',
      'Honest about being a systems contributor rather than an owner',
    ],
    concerns: [
      'Systems ownership is inferred, not demonstrated end to end',
      'No mentoring/leadership evidence; B2B depth is a single prior role',
    ],
    followUps: [
      'Have you ever owned a design-system roadmap, not just contributed?',
      'Tell me about a conflict with a PM over scope — how was it resolved?',
    ],
  },
  {
    id: 'ari',
    name: 'Ari Patel',
    initials: 'AP',
    accent: 'blue',
    stage: 'Ready to interview',
    match: 'Strong visual execution',
    assessed: true,
    resume: `Ari Patel — Senior Product Designer
5 years of high-craft visual and mobile product design.

EXPERIENCE
Senior Product Designer, Sprout (consumer mobile app) · 2021–Present
- Designed the flagship mobile app's visual refresh: new illustration system, motion language, and dark mode; App Store rating rose from 4.2 to 4.6.
- Built high-fidelity Figma prototypes used in quarterly user tests.
- Prepared production-ready specs and assets for engineering handoff.

Product Designer, Halftone (design studio) · 2019–2021
- Delivered mobile UI for fintech and media clients; pixel-perfect implementation reviews.

UI Designer, Freelance · 2018–2019
- Brand and mobile UI for small businesses.

SKILLS
Visual design · Mobile UI · Motion + illustration · Figma prototyping · Design specs

EDUCATION
BFA, Visual Communication — 2018`,
    highlights: [
      '5 yrs high-craft mobile + visual design',
      'Led visual refresh — App Store rating 4.2 → 4.6',
      'Pixel-perfect specs and handoff discipline',
    ],
    evidence: [
      { reqId: 'product-design', level: 'explicit', note: '5 years of visual and mobile product design.' },
      { reqId: 'end-to-end', level: 'inferred', note: 'Visual refresh + handoff; limited discovery/strategy evidence.' },
      { reqId: 'systems', level: 'inferred', note: 'Built an illustration system and motion language — visual, not component-level.' },
      { reqId: 'eng-collab', level: 'inferred', note: 'Specs, assets, and implementation reviews — mostly at handoff.' },
      { reqId: 'mobile', level: 'explicit', note: 'Flagship mobile app + mobile UI for fintech/media clients.' },
      { reqId: 'prototyping', level: 'explicit', note: '“Built high-fidelity Figma prototypes used in quarterly user tests.”' },
      { reqId: 'leadership', level: 'missing', note: 'No mentoring or people-leadership evidence.' },
      { reqId: 'b2b-saas', level: 'missing', note: 'Consumer mobile and agency work; no B2B SaaS.' },
    ],
    dim: { problemSolving: 70, communication: 76, collaboration: 64 },
    oral: [
      {
        questionId: 'craft',
        answer:
          'I originally pitched a very expressive motion language for Sprout’s refresh — springy, bouncy transitions everywhere. User tests showed older segments found it disorienting, and it added implementation cost. I changed my mind and moved to a calmer, reduced-motion-first system, keeping the expressive moments for delight moments like completing a habit. I learned that restraint is a craft decision too. The refresh shipped and the rating improved. I changed because the users told me, through the tests, that the motion was about me, not about them.',
        note: 'Genuine reversal grounded in testing; lighter on business metrics and the explicit tradeoff.',
      },
      {
        questionId: 'systems',
        answer:
          'At Sprout I built the illustration and motion components of the system — a library with clear usage rules so other designers don’t recreate assets. What made it stick was documentation and versioning: every asset had a naming convention and a “when to use” note. I haven’t owned the full component system, but I’ve seen that a system fails when it’s a gallery of pretty assets with no rules. My approach is to make the system feel like a product: versioned, documented, and easy to contribute to.',
        note: 'Real contribution and a sensible point of view, but scoped to visual assets rather than a full system.',
      },
      {
        questionId: 'collaboration',
        answer:
          'I’m usually brought in after the direction is set, so my collaboration has been at handoff — but I changed that on the dark mode project. I invited two engineers to a spec review before finalizing, and they caught that our elevation/shadow approach wouldn’t work with the new theming tokens. We reworked it together and saved a late redesign. It convinced me to push for earlier involvement on future projects, even when the process doesn’t invite it.',
        note: 'Self-aware; shows a shift toward earlier collaboration, but the pattern is new, not established.',
      },
    ],
    written:
      'Goal: an onboarding that feels premium and gets users to their first success. Approach: establish a visual and motion system for the flow that matches the refreshed brand; design a 3-step signup with delight moments; build a high-fidelity Figma prototype and test it with users; hand off pixel-perfect specs to engineering. Risks: over-investing in polish before validating the steps, and motion that adds friction for some users. Mitigations: validate the steps first, keep motion subtle and reduced-motion-friendly, and lock the visual system before scaling to more screens. Success: completion rate of onboarding, drop-off per step, and a post-onboarding survey on perceived quality.',
    strengths: [
      'Exceptional craft with proven mobile/visual impact (App Store 4.2 → 4.6)',
      'Production discipline: specs, versioning, implementation reviews',
      'Self-aware about late involvement and committed to changing it',
    ],
    concerns: [
      'Little discovery/strategy evidence — end-to-end ownership is inferred',
      'Engineering collaboration is mostly at handoff',
      'No B2B SaaS or leadership experience',
    ],
    followUps: [
      'Walk me through a project where you set the strategy, not just the visuals.',
      'How would you handle a PM who disagrees with a design direction?',
    ],
  },
  {
    id: 'sofia',
    name: 'Sofia Rodriguez',
    initials: 'SR',
    accent: 'green',
    stage: 'New application',
    match: 'Good domain experience',
    assessed: true,
    resume: `Sofia Rodriguez — Senior Product Designer
3 years of product design grounded in 4 years of UX research; healthcare domain depth.

EXPERIENCE
Product Designer, Medchart (healthcare SaaS) · 2022–Present
- Led discovery and usability research for the clinical charting tool; ran 25+ user interviews and synthesized them into design requirements.
- Designed and shipped the medication reconciliation flow end to end with engineering.
- Built the research playbook (interview guides, synthesis templates) used across the team.

UX Researcher, Wellspring Health · 2019–2022
- Conducted mixed-methods studies (diaries, usability tests, surveys) for patient-facing products.
- Presented insights to product and executive stakeholders.

UX Researcher, Academic Lab · 2018–2019
- Ran studies on health-information seeking.

SKILLS
UX research (interviews, usability testing) · Interaction design · Prototyping · Healthcare domain · Design systems (user)

EDUCATION
MSc, Human-Computer Interaction — 2018`,
    highlights: [
      'Healthcare SaaS domain depth (Medchart, Wellspring)',
      'Research rigor: 25+ interviews, team research playbook',
      '4 yrs UX research before design — user insight is her superpower',
    ],
    evidence: [
      { reqId: 'product-design', level: 'inferred', note: '3 years in a product-design seat (+4 years research).' },
      { reqId: 'end-to-end', level: 'inferred', note: '“Led discovery… designed and shipped the medication reconciliation flow.”' },
      { reqId: 'systems', level: 'missing', note: 'Design systems listed only as “user” — no ownership evidence.' },
      { reqId: 'eng-collab', level: 'inferred', note: 'Shipped the flow “end to end with engineering.”' },
      { reqId: 'mobile', level: 'missing', note: 'No mobile product work.' },
      { reqId: 'prototyping', level: 'explicit', note: 'Prototyping + usability testing throughout both roles.' },
      { reqId: 'leadership', level: 'missing', note: 'No mentoring or people-leadership evidence.' },
      { reqId: 'b2b-saas', level: 'explicit', note: 'Medchart (healthcare SaaS) + Wellspring Health.' },
    ],
    dim: { problemSolving: 78, communication: 80, collaboration: 72 },
    oral: [
      {
        questionId: 'craft',
        answer:
          'I designed the medication reconciliation flow around a wizard — one medication at a time. In usability testing with clinicians, I watched them become frustrated; they reconcile in batches, comparing lists side by side. I changed my mind entirely and redesigned it as a side-by-side list with inline edits. Reconciliation time dropped measurably and clinician satisfaction improved. What changed my mind was observing the work in context — the wizard was my mental model, not theirs. I now start every project with contextual observation before proposing any structure.',
        note: 'Strong user-centered reversal grounded in observation; outcome stated qualitatively rather than with numbers.',
      },
      {
        questionId: 'systems',
        answer:
          'I’ve mostly been a consumer of our design system rather than its builder. From the research side I can tell you what makes a system usable: clinicians need consistency so the interface gets out of the way. When our team’s components drifted from the system, I flagged it with data — task time and error rates went up on the inconsistent screens. I’d approach building one the same way I approach research: audit what’s actually used, name the patterns teams already repeat, and document with real usage data rather than opinions. I’m candid that owning a system end to end is a growth area for me.',
        note: 'Honest about the gap; brings a distinctive data-driven lens, but no direct ownership evidence.',
      },
      {
        questionId: 'collaboration',
        answer:
          'On the medication flow, the engineering lead and I sat together before design started and mapped the clinical data model together. Because charting data has strict integrity rules, that early session shaped the interaction — certain edits had to be transactional, which changed the inline-edit design. I also invited the engineers to a clinician observation session, and it changed how they thought about the constraints. The flow shipped with fewer surprises and fewer rework cycles.',
        note: 'Concrete early collaboration where engineering constraints shaped the design itself.',
      },
    ],
    written:
      'Goal: for a B2B SaaS “guided onboarding,” get a new clinical team to their first completed workflow with minimal setup. Approach: begin with research — interview new customers and run a diary study of their first week to understand where onboarding stalls; define success with the PM as “first workflow completed”; co-design the flow with engineering so it respects data-integrity constraints; usability-test a prototype with 5 target users; instrument each step to measure drop-off. Risks: making onboarding a research project that delays value, and overloading the first session. Mitigations: timebox discovery to two weeks, ship a minimal guided path, and iterate with the data. Success: first-workflow completion rate, time-to-first-workflow, and support-ticket volume on setup, compared before and after.',
    strengths: [
      'Deep healthcare SaaS domain fit and strong research rigor',
      'Evidence-based approach to systems (audit with usage data)',
      'Transparent about growth areas (systems ownership)',
    ],
    concerns: [
      'Only 3 years in a product-design seat; fewer shipped artifacts than peers',
      'Systems-thinking evidence is missing (a must-have)',
      'No mobile or leadership experience',
    ],
    followUps: [
      'Have you built or owned any component library, however small?',
      'How do you move from research insight to a shipped decision quickly?',
    ],
  },
]

// ---------------------------------------------------------------------------
// Derived views
// ---------------------------------------------------------------------------
export function candidateScore(c: Candidate) {
  return {
    roleEvidence: computeRoleEvidence(c.evidence),
    total: computeTotal(c),
  }
}

export function rankedCandidates(list: Candidate[] = candidates): Candidate[] {
  return [...list].sort((a, b) => computeTotal(b) - computeTotal(a))
}

// ---------------------------------------------------------------------------
// Resume intake: deterministic, explainable parsing of a pasted resume.
// Every requirement is marked explicit / inferred / missing from keyword
// evidence, so the role-evidence score is fully traceable to the text.
// ---------------------------------------------------------------------------
const SIGNALS: Record<string, { strong: string[]; weak: string[] }> = {
  'product-design': {
    strong: ['product designer', 'ux designer', 'product design', 'ui/ux', 'interaction design', 'senior product'],
    weak: ['designer', 'design', 'ux', 'ui'],
  },
  'end-to-end': {
    strong: ['end to end', 'end-to-end', 'discovery', 'shipped', 'shipping', 'launch', 'from concept'],
    weak: ['owned', 'led', 'research', 'roadmap'],
  },
  systems: {
    strong: ['design system', 'component library', 'ui kit', 'design tokens', 'token-based', 'style guide'],
    weak: ['components', 'pattern', 'reusable', 'consistency'],
  },
  'eng-collab': {
    strong: ['engineer', 'engineering', 'developer', 'cross-functional', 'handoff', 'sprint', 'code review'],
    weak: ['stakeholder', 'team', 'collaborat', 'partner'],
  },
  mobile: {
    strong: ['mobile', 'ios', 'android', 'responsive'],
    weak: ['app', 'native'],
  },
  prototyping: {
    strong: ['prototype', 'prototyping', 'figma', 'usability test', 'usability testing', 'user test', 'user testing', 'a/b test', 'ab test'],
    weak: ['wireframe', 'mockup', 'testing', 'iteration'],
  },
  leadership: {
    strong: ['mentor', 'mentoring', 'managed', 'management', 'led a team', 'lead designer', 'hiring', 'performance review', 'coached'],
    weak: ['led', 'lead', 'coach', 'guided'],
  },
  'b2b-saas': {
    strong: ['b2b', 'saas', 'enterprise'],
    weak: ['business', 'platform', 'software'],
  },
}

function makeInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('')
}

export function parseResumeEvidence(resumeText: string): ResumeEvidence[] {
  const text = resumeText.toLowerCase()
  return requirements.map((req) => {
    const sig = SIGNALS[req.id]
    if (!sig) return { reqId: req.id, level: 'missing', note: 'No signal defined for this requirement.' }
    const strong = sig.strong.filter((s) => text.includes(s))
    const weak = sig.weak.filter((s) => text.includes(s))
    if (strong.length > 0) {
      return { reqId: req.id, level: 'explicit', note: `Found: ${strong.slice(0, 3).join(', ')}.` }
    }
    if (weak.length > 0) {
      return { reqId: req.id, level: 'inferred', note: `Partial signal only: ${weak.slice(0, 3).join(', ')}.` }
    }
    return { reqId: req.id, level: 'missing', note: 'No matching evidence in the resume.' }
  })
}

export function extractHighlights(resumeText: string): string[] {
  const lines = resumeText
    .split(/\n+/)
    .map((l) => l.trim())
    .filter((l) => l.length > 3)
  const metricLines = lines.filter((l) => /\d|%|\$|nps|retention|conversion|adoption|\bx\b/i.test(l))
  const picked = (metricLines.length ? metricLines : lines).slice(0, 4)
  const capped = picked.map((l) => (l.length > 96 ? `${l.slice(0, 96)}…` : l))
  return capped.length ? capped : ['Resume received — review the full text for details.']
}

export function buildCandidateFromResume(name: string, resumeText: string): Candidate {
  const evidence = parseResumeEvidence(resumeText)
  const must = requirements.filter((r) => r.must)
  const explicitMust = must.filter((r) => evidence.find((e) => e.reqId === r.id)?.level === 'explicit').length
  const missingMust = must.filter((r) => evidence.find((e) => e.reqId === r.id)?.level === 'missing').length
  const accents: Candidate['accent'][] = ['coral', 'gold', 'blue', 'green']
  return {
    id: `custom-${Date.now()}`,
    name: name.trim(),
    initials: makeInitials(name),
    accent: accents[Date.now() % accents.length],
    stage: 'New application',
    match: `${explicitMust} of ${must.length} must-haves explicit (parsed)`,
    assessed: false,
    resume: resumeText.trim(),
    highlights: extractHighlights(resumeText),
    evidence,
    dim: { problemSolving: 0, communication: 0, collaboration: 0 },
    oral: [],
    written: '',
    strengths: [`${explicitMust}/${must.length} must-haves evidenced explicitly in the resume`],
    concerns: [`${missingMust} must-have(s) with no evidence detected yet`],
    followUps: ['Complete the oral + written assessment to finalize the scorecard.'],
  }
}
