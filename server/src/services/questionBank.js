import { BANK as BASE_BANK } from "../data/questionData.js";

// Clone the original question banks so we can add custom roles.
const ROLE_BANK = Object.fromEntries(
  Object.entries(BASE_BANK || {}).map(([role, questions]) => [
    role,
    Array.isArray(questions)
      ? questions.map((question) => ({ ...question }))
      : [],
  ])
);

// --------------------------------------------------
// Role-specific question presets
// --------------------------------------------------

const ROLE_PRESETS = {
  devops: [
    {
      q: "How do you design a CI/CD pipeline for reliable deployments?",
      a: "Automated build, test, staging, and rollback with monitoring.",
    },
    {
      q: "Explain your approach to infrastructure as code.",
      a: "Version-controlled templates, idempotent provisioning, and peer review.",
    },
    {
      q: "How do you handle production incidents and postmortems?",
      a: "Triage, communicate, fix, document root cause, and prevent recurrence.",
    },
    {
      q: "What is your strategy for container orchestration at scale?",
      a: "Kubernetes workloads, resource limits, health checks, and autoscaling.",
    },
    {
      q: "How do you manage secrets and configuration across environments?",
      a: "Secret managers, least privilege, rotation, and environment separation.",
    },
    {
      q: "How do you monitor system health and SLOs?",
      a: "Metrics, logs, alerts, error budgets, and on-call runbooks.",
    },
    {
      q: "How do you balance speed and stability in releases?",
      a: "Feature flags, canary deploys, automated tests, and blast-radius control.",
    },
  ],

  "product manager": [
    {
      q: "How do you prioritize features on a crowded roadmap?",
      a: "User impact, business value, effort, and data-driven tradeoffs.",
    },
    {
      q: "Describe how you gather and validate customer requirements.",
      a: "Interviews, analytics, prototypes, and iterative feedback loops.",
    },
    {
      q: "How do you define success metrics for a new product?",
      a: "Clear KPIs, baselines, experiments, and outcome over output.",
    },
    {
      q: "How do you work with engineering when scope slips?",
      a: "Re-scope MVP, align on must-haves, and transparent stakeholder updates.",
    },
    {
      q: "Explain a go-to-market plan you have driven.",
      a: "Positioning, launch phases, channels, and post-launch iteration.",
    },
    {
      q: "How do you handle conflicting stakeholder priorities?",
      a: "Facilitate alignment, document decisions, and tie back to strategy.",
    },
    {
      q: "What frameworks do you use for product discovery?",
      a: "Jobs-to-be-done, opportunity solution trees, and rapid experimentation.",
    },
  ],

  ux: [
    {
      q: "Walk through your end-to-end design process.",
      a: "Research, personas, wireframes, testing, and handoff with developers.",
    },
    {
      q: "How do you validate designs before development?",
      a: "Usability tests, prototypes, A/B tests, and heuristic evaluation.",
    },
    {
      q: "How do you balance user needs with business goals?",
      a: "Evidence from research, prioritization, and measurable UX outcomes.",
    },
    {
      q: "Describe how you build and maintain a design system.",
      a: "Reusable components, documentation, accessibility, and governance.",
    },
    {
      q: "How do you design for accessibility?",
      a: "WCAG guidelines, contrast, keyboard flow, and inclusive patterns.",
    },
    {
      q: "How do you collaborate with product and engineering?",
      a: "Shared specs, critiques, iteration, and clear acceptance criteria.",
    },
    {
      q: "Tell us about a redesign that improved key metrics.",
      a: "Problem, hypothesis, solution, measurement, and lessons learned.",
    },
  ],

  cyber: [
    {
      q: "How do you perform a risk assessment for a new system?",
      a: "Asset inventory, threats, likelihood, impact, and mitigation plan.",
    },
    {
      q: "Explain defense in depth in modern architectures.",
      a: "Layered controls across network, identity, data, and application.",
    },
    {
      q: "How do you respond to a suspected security breach?",
      a: "Contain, preserve evidence, eradicate, recover, and report.",
    },
    {
      q: "What is your approach to vulnerability management?",
      a: "Scanning, prioritization by exploitability, patching, and verification.",
    },
    {
      q: "How do you implement least-privilege access?",
      a: "Role-based access, MFA, periodic reviews, and just-in-time elevation.",
    },
    {
      q: "How do you secure cloud workloads?",
      a: "Hardening, encryption, logging, IAM policies, and compliance checks.",
    },
    {
      q: "How do you promote security awareness in an organization?",
      a: "Training, phishing simulations, policies, and secure SDLC practices.",
    },
  ],

  marketing: [
    {
      q: "How do you build a multi-channel marketing campaign?",
      a: "Audience segmentation, messaging, budget, channels, and KPI tracking.",
    },
    {
      q: "How do you measure campaign ROI?",
      a: "Attribution, conversion funnels, CAC, LTV, and incrementality tests.",
    },
    {
      q: "Describe your content strategy for brand growth.",
      a: "Audience insights, editorial calendar, SEO, and performance optimization.",
    },
    {
      q: "How do you use data to improve acquisition?",
      a: "Analytics, cohort analysis, A/B tests, and channel optimization.",
    },
    {
      q: "How do you manage brand positioning versus competitors?",
      a: "Differentiation, messaging pillars, and consistent voice.",
    },
    {
      q: "How do you align marketing with sales goals?",
      a: "SLAs, lead scoring, shared dashboards, and feedback loops.",
    },
    {
      q: "What trends are shaping digital marketing today?",
      a: "Privacy changes, AI tools, short-form video, and first-party data.",
    },
  ],

  hr: [
    {
      q: "How do you design an effective hiring process?",
      a: "Structured interviews, scorecards, diversity goals, and candidate experience.",
    },
    {
      q: "How do you handle employee performance issues?",
      a: "Documented feedback, PIP, support, and fair consistent policy.",
    },
    {
      q: "Describe your approach to employee engagement.",
      a: "Surveys, listening sessions, recognition, and manager enablement.",
    },
    {
      q: "How do you stay compliant with labor regulations?",
      a: "Policy updates, training, audits, and legal partnership.",
    },
    {
      q: "How do you support learning and development?",
      a: "Skills frameworks, budgets, mentorship, and career paths.",
    },
    {
      q: "How do you manage conflict between team members?",
      a: "Neutral facilitation, clear expectations, and follow-up.",
    },
    {
      q: "How do you build an inclusive workplace culture?",
      a: "Inclusive policies, ERGs, bias training, and equitable practices.",
    },
  ],

  sales: [
    {
      q: "Walk through your sales methodology from lead to close.",
      a: "Qualify, discover needs, demonstrate value, handle objections, and negotiate.",
    },
    {
      q: "How do you handle a major deal at risk of slipping?",
      a: "Identify blockers, multi-thread stakeholders, and create urgency with value.",
    },
    {
      q: "How do you build long-term client relationships?",
      a: "Trust, regular check-ins, success metrics, and expansion opportunities.",
    },
    {
      q: "How do you forecast pipeline accurately?",
      a: "Stage definitions, historical conversion, and disciplined CRM hygiene.",
    },
    {
      q: "Describe a time you lost a deal and what you learned.",
      a: "Honest post-mortem, process fix, and improved qualification.",
    },
    {
      q: "How do you collaborate with marketing on leads?",
      a: "ICP alignment, lead scoring, feedback on quality, and SLAs.",
    },
    {
      q: "How do you negotiate without damaging the relationship?",
      a: "Focus on mutual value, trade concessions, and clear terms.",
    },
  ],
};

// --------------------------------------------------
// Generic questions for custom job roles
// --------------------------------------------------

const GENERIC_TEMPLATES = [
  [
    "What core skills and experience are essential for a {role}?",
    "Relevant domain knowledge, proven tools, and hands-on project experience.",
  ],
  [
    "Describe a difficult challenge you faced as a {role} and how you solved it.",
    "Define the problem, take structured action, and deliver measurable results.",
  ],
  [
    "Which tools, methods, or frameworks do you rely on most as a {role}?",
    "Industry-standard tools with practical examples and continuous improvement.",
  ],
  [
    "How do you collaborate with teammates and stakeholders in a {role} position?",
    "Clear communication, shared goals, accountability, and constructive feedback.",
  ],
  [
    "How do you prioritize work when facing tight deadlines as a {role}?",
    "Impact and urgency analysis, stakeholder alignment, and focused execution.",
  ],
  [
    "How do you stay current with trends and best practices for a {role}?",
    "Learning plans, communities, certifications, and applying new knowledge.",
  ],
  [
    "Why are you a strong fit for this {role} opportunity?",
    "Relevant achievements, motivation, cultural alignment, and growth potential.",
  ],
];

// --------------------------------------------------
// Match roles to the relevant preset
// --------------------------------------------------

const matchPreset = (role) => {
  const roleLower = role.toLowerCase();

  const keys = Object.keys(ROLE_PRESETS).sort(
    (a, b) => b.length - a.length
  );

  for (const key of keys) {
    if (roleLower.includes(key)) {
      return ROLE_PRESETS[key].map((item) => ({ ...item }));
    }
  }

  if (roleLower.includes("designer") || roleLower.includes("ui ")) {
    return ROLE_PRESETS.ux.map((item) => ({ ...item }));
  }

  if (roleLower.includes("security") || roleLower.includes("infosec")) {
    return ROLE_PRESETS.cyber.map((item) => ({ ...item }));
  }

  if (
    roleLower.includes("sre") ||
    roleLower.includes("site reliability")
  ) {
    return ROLE_PRESETS.devops.map((item) => ({ ...item }));
  }

  if (
    roleLower.includes("human resources") ||
    roleLower.startsWith("hr")
  ) {
    return ROLE_PRESETS.hr.map((item) => ({ ...item }));
  }

  return null;
};

// --------------------------------------------------
// Build a question bank for a custom role
// --------------------------------------------------

export const buildCustomRoleQuestions = (role) => {
  const cleanRole = String(role || "Professional").trim();

  const preset = matchPreset(cleanRole);

  if (preset) {
    return preset;
  }

  return GENERIC_TEMPLATES.map(([question, answer]) => ({
    q: question.replaceAll("{role}", cleanRole),
    a: answer,
  }));
};

// --------------------------------------------------
// Ensure that a question bank exists for the role
// --------------------------------------------------

export const ensureRoleBank = (role) => {
  const cleanRole = String(role || "").trim();

  if (!cleanRole) {
    return null;
  }

  // Reuse an existing role even if capitalization differs.
  const existingRole = Object.keys(ROLE_BANK).find(
    (key) => key.toLowerCase() === cleanRole.toLowerCase()
  );

  if (existingRole) {
    const existingQuestions = ROLE_BANK[existingRole];

    // Replace old placeholder banks containing repeated questions.
    if (
      !Array.isArray(existingQuestions) ||
      existingQuestions.length === 0 ||
      (
        existingQuestions.length === 7 &&
        new Set(existingQuestions.map((item) => item.q)).size === 1
      )
    ) {
      ROLE_BANK[existingRole] =
        buildCustomRoleQuestions(existingRole);
    }

    return existingRole;
  }

  ROLE_BANK[cleanRole] = buildCustomRoleQuestions(cleanRole);

  return cleanRole;
};

// --------------------------------------------------
// Get questions for a particular role
// --------------------------------------------------

export const getQuestionsForRole = (role) => {
  const cleanRole = ensureRoleBank(role);

  if (!cleanRole) {
    return null;
  }

  return ROLE_BANK[cleanRole].map((question) => ({ ...question }));
};

// --------------------------------------------------
// Get available roles
// --------------------------------------------------

export const getAvailableRoles = () => {
  return Object.keys(ROLE_BANK);
};

// --------------------------------------------------
// Random question selection for each new interview
// --------------------------------------------------

export const getRandomQuestionsForRole = (role, count = 7) => {
  const cleanRole = ensureRoleBank(role);

  if (!cleanRole) {
    return [];
  }

  const existingQuestions = getQuestionsForRole(cleanRole) || [];

  const roleName = cleanRole;

  // Supplement the existing role-specific bank to create
  // more possible combinations between interview sessions.
  const extraQuestions = [
    {
      q: `What are the core responsibilities of a ${roleName}?`,
      a: "Main responsibilities, required skills, and expected results.",
    },
    {
      q: `How would you prioritize competing deadlines in a ${roleName} role?`,
      a: "Urgency, business impact, dependencies, and deadlines.",
    },
    {
      q: `How would you investigate an unexpected problem in ${roleName}?`,
      a: "Gather evidence, identify root cause, test a solution, and monitor results.",
    },
    {
      q: `How would you measure success in a ${roleName} role?`,
      a: "Measurable KPIs, quality, efficiency, and business outcomes.",
    },
    {
      q: `How do you maintain accuracy and quality in your ${roleName} work?`,
      a: "Validate results, review requirements, test work, and document changes.",
    },
    {
      q: `How would you collaborate with another team on a ${roleName} project?`,
      a: "Clear communication, shared goals, ownership, and feedback.",
    },
    {
      q: `How do you handle feedback about your work as a ${roleName}?`,
      a: "Listen, clarify feedback, make improvements, and follow up.",
    },
    {
      q: `How would you learn an unfamiliar tool needed for ${roleName}?`,
      a: "Read documentation, practice, test examples, and seek feedback.",
    },
    {
      q: `How do you evaluate risks before making a decision in ${roleName}?`,
      a: "Assess impact and probability, compare options, and plan mitigation.",
    },
    {
      q: `How would you improve an inefficient workflow in ${roleName}?`,
      a: "Identify bottlenecks, measure performance, improve the process, and evaluate results.",
    },
    {
      q: `How would you handle two urgent tasks in your ${roleName} role?`,
      a: "Prioritize impact, communicate early, manage deadlines, and align expectations.",
    },
    {
      q: `How would you explain the value of your ${roleName} work to a stakeholder?`,
      a: "Explain the problem, benefits, measurable outcomes, and business value.",
    },
    {
      q: `How would you plan a project relevant to ${roleName}?`,
      a: "Define requirements, milestones, responsibilities, dependencies, and risks.",
    },
    {
      q: `What would you do after making a mistake in your ${roleName} work?`,
      a: "Take ownership, find the cause, correct the issue, and prevent recurrence.",
    },
  ];

  // Remove duplicate questions while keeping each answer paired
  // with its correct question.
  const uniqueQuestions = [
    ...new Map(
      [...existingQuestions, ...extraQuestions].map((item) => [
        String(item.q || "").trim().toLowerCase(),
        item,
      ])
    ).values(),
  ];

  // Fisher-Yates shuffle.
  for (let i = uniqueQuestions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [uniqueQuestions[i], uniqueQuestions[j]] = [
      uniqueQuestions[j],
      uniqueQuestions[i],
    ];
  }

  const requestedCount = Math.max(1, Math.floor(Number(count) || 7));

  return uniqueQuestions
    .slice(0, Math.min(requestedCount, uniqueQuestions.length))
    .map((question) => ({ ...question }));
};