const STORAGE_KEY = 'repoready_audits';
const SETTINGS_KEY = 'repoready_settings';

const colors = {
  Security: '#fb7185',
  Deployment: '#f59e0b',
  Docs: '#22d3ee',
  Structure: '#8b5cf6',
};

const issueBank = {
  secrets: [
    {
      severity: 'Critical',
      category: 'Security',
      file: 'src/config/api.js',
      problem: 'Provider API key may be exposed in frontend code.',
      why: 'Keys shipped to browsers can be copied from DevTools and abused immediately.',
      fix: 'Move provider calls to a backend route and read the API key from server-side environment variables.',
    },
    {
      severity: 'Critical',
      category: 'Security',
      file: '.env',
      problem: '.env appears to be part of the submitted project files.',
      why: 'Secrets, database URLs, and private tokens should never be committed or shared in ZIP uploads.',
      fix: 'Remove .env from the repo, add it to .gitignore, and create a sanitized .env.example.',
    },
  ],
  deployment: [
    {
      severity: 'Critical',
      category: 'Deployment',
      file: 'src/config.js',
      problem: 'Backend URL is hardcoded to localhost.',
      why: 'The deployed frontend will keep calling your local machine and fail for reviewers.',
      fix: 'Replace localhost URLs with environment variables such as VITE_API_BASE_URL.',
    },
    {
      severity: 'High',
      category: 'Deployment',
      file: 'package.json',
      problem: 'Production start or build scripts need review.',
      why: 'Deployment platforms rely on predictable scripts to build and serve the app.',
      fix: 'Add clear build, preview, and start scripts for the selected hosting platform.',
    },
    {
      severity: 'High',
      category: 'Deployment',
      file: 'server.js',
      problem: 'CORS configuration may fail after deployment.',
      why: 'Local-only CORS settings often block requests between deployed frontend and backend URLs.',
      fix: 'Read allowed origins from an environment variable and include the production frontend URL.',
    },
  ],
  docs: [
    {
      severity: 'High',
      category: 'Docs',
      file: 'README.md',
      problem: 'README needs complete setup instructions.',
      why: 'Recruiters and evaluators need a fast path to run, inspect, and trust the project.',
      fix: 'Add install, environment, development, build, and deployment sections with exact commands.',
    },
    {
      severity: 'High',
      category: 'Docs',
      file: '.env.example',
      problem: 'No environment variable template is documented.',
      why: 'A safe env template lets others configure the app without exposing real keys.',
      fix: 'Create .env.example with required variable names and placeholder values.',
    },
    {
      severity: 'Medium',
      category: 'Docs',
      file: 'public/screenshots',
      problem: 'Project screenshots are missing from the portfolio package.',
      why: 'Screenshots make the repository easier to scan and more convincing as a resume project.',
      fix: 'Add screenshots for the main workflow and reference them in the README.',
    },
  ],
  structure: [
    {
      severity: 'Medium',
      category: 'Structure',
      file: 'src/App.jsx',
      problem: 'Main app file is likely doing too much.',
      why: 'Large components are harder to explain, test, and defend in interviews.',
      fix: 'Split routes, layout, data fetching, and feature screens into focused components.',
    },
    {
      severity: 'Medium',
      category: 'Structure',
      file: 'src/components',
      problem: 'Generated or unused component files should be reviewed.',
      why: 'Dead files make the project look unfinished and confuse reviewers.',
      fix: 'Remove unused generated components or wire them into the app deliberately.',
    },
    {
      severity: 'Suggestion',
      category: 'Structure',
      file: 'docs/deployment.md',
      problem: 'Deployment guide is missing.',
      why: 'A deployment guide proves that the project can survive outside localhost.',
      fix: 'Document frontend and backend deployment steps, environment variables, and test URLs.',
    },
  ],
};

export function getAudits() {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveAudit(audit) {
  const audits = [audit, ...getAudits().filter((item) => item.id !== audit.id)].slice(0, 20);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(audits));
  return audits;
}

export function getAudit(id) {
  const audits = getAudits();
  if (id === 'latest') return audits[0] || null;
  return audits.find((audit) => audit.id === id) || null;
}

export function clearAudits() {
  window.localStorage.removeItem(STORAGE_KEY);
}

export function getSettings() {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(window.localStorage.getItem(SETTINGS_KEY) || '{}');
  } catch {
    return {};
  }
}

export function saveSettings(settings) {
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function createAudit(input) {
  const projectName = input.projectName?.trim() || repoName(input.repoUrl) || 'Untitled Portfolio Project';
  const projectType = input.projectType || 'React';
  const selected = input.checks || {};
  const issueGroups = [
    selected.secrets && issueBank.secrets,
    selected.deployment && issueBank.deployment,
    selected.readme && issueBank.docs,
    selected.structure && issueBank.structure,
  ].filter(Boolean);
  const issues = issueGroups.flat().map((issue) => adaptIssue(issue, projectType));
  const totalIssues = issues.length || 1;
  const critical = issues.filter((issue) => issue.severity === 'Critical').length;
  const high = issues.filter((issue) => issue.severity === 'High').length;
  const medium = issues.filter((issue) => issue.severity === 'Medium').length;
  const base = 88 - critical * 12 - high * 7 - medium * 3;
  const overall = clamp(base + nameScore(projectName), 8, 94);
  const github = clamp(overall + (selected.readme ? -2 : 5) + (selected.structure ? -1 : 4), 35, 96);
  const deployment = clamp(overall - (selected.deployment ? 12 : 0), 30, 94);
  const securityValue = clamp(100 - critical * 28 - high * 8, 8, 92);
  const resume = clamp(overall + (selected.resume ? 11 : 2), 45, 98);
  const now = new Date();

  return {
    id: `audit-${Date.now()}`,
    name: projectName,
    repoUrl: input.repoUrl?.trim() || '',
    type: projectType,
    fileName: input.fileName || '',
    updatedAt: now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    createdAt: now.toISOString(),
    status: statusFromScore(overall),
    projectedScore: calculateProjectedScore(overall, issues),
    scores: [
      { label: 'Overall Project Readiness', value: overall, accent: 'cyan' },
      { label: 'GitHub Readiness', value: github, accent: 'violet' },
      { label: 'Deployment Readiness', value: deployment, accent: 'amber' },
      { label: 'Security Risk', value: securityValue, display: riskLabel(securityValue), accent: 'rose', inverse: securityValue < 55 },
      { label: 'Resume Readiness', value: resume, accent: 'emerald' },
    ],
    issues,
    roadmap: buildRoadmap(issues),
    issueDistribution: buildDistribution(issues),
    readinessBars: [
      { area: 'GitHub', value: github },
      { area: 'Deploy', value: deployment },
      { area: 'Security', value: securityValue },
      { area: 'README', value: selected.readme ? clamp(github - 8, 25, 96) : github },
      { area: 'Resume', value: resume },
    ],
  };
}

export function getStats(audits) {
  const projects = audits.length;
  const avg = projects ? Math.round(audits.reduce((sum, audit) => sum + audit.scores[0].value, 0) / projects) : 0;
  const critical = audits.reduce((sum, audit) => sum + audit.issues.filter((issue) => issue.severity === 'Critical').length, 0);
  return [
    { label: 'Projects Audited', value: String(projects), delta: projects ? 'Saved in this browser' : 'Run your first audit', accent: 'cyan' },
    { label: 'Average Readiness Score', value: `${avg}%`, delta: projects ? 'Across saved reports' : 'No reports yet', accent: 'emerald' },
    { label: 'Critical Issues Found', value: String(critical), delta: critical ? 'Fix these first' : 'Clean so far', accent: 'rose' },
    { label: 'Reports Generated', value: String(projects), delta: 'Available offline', accent: 'violet' },
  ];
}

export function getTrendData(audits) {
  const source = audits.slice().reverse().slice(-6);
  if (!source.length) return [{ week: 'Now', score: 0 }];
  return source.map((audit, index) => ({ week: `A${index + 1}`, score: audit.scores[0].value }));
}

export function generateReadme(audit) {
  return buildReadmeFromProfile(normalizedProfile(audit));
}

export function generateResumePack(audit, options = {}) {
  const profile = normalizedProfile(audit);
  if (!hasUsableProfile(profile)) return needsProfilePack(profile);

  const name = profile.name;
  const stack = profile.techStack.slice(0, 4).join(', ');
  const workflow = (profile.coreWorkflow.length ? profile.coreWorkflow : profile.usageFlow).slice(0, 3);
  const category = singularCategory(profile.category);
  const style = normalizeBulletStyle(options.style);
  const bullets = buildResumeBullets(profile, audit, style);
  const pitch = `${name} is ${articleFor(category)} ${category} for ${profile.targetUsers.join(', ')}. ${profile.problemSolved} The main implementation evidence is ${shortEvidence(profile)}, and its strongest resume angle is ${profile.resumeAngle.toLowerCase()}.`;
  const questions = [
    ['What problem does this solve?', profile.problemSolved],
    ['Who are the target users?', `${name} is aimed at ${profile.targetUsers.join(', ')} based on the detected project profile.`],
    ['Why this tech stack?', `${stack} is present in the repository evidence and supports features such as ${profile.coreFeatures.slice(0, 3).join(', ')}.`],
    ['How does the architecture work?', profile.architecture || `The architecture explanation is based on detected folders and files: ${profile.folderStructure.slice(0, 6).join(', ')}.`],
    ['What is the main user workflow?', workflow.length ? workflow.join(' -> ') : `The detected workflow centers on ${profile.coreFeatures.slice(0, 3).join(', ')}.`],
    ['How did you handle configuration or API keys?', profile.envVariables.length ? `The project uses environment variables such as ${profile.envVariables.join(', ')}. Real values should stay outside source control.` : 'No environment variable evidence was detected, so configuration handling should be verified manually.'],
    ['What are the limitations?', profile.limitations.length ? profile.limitations.join(' ') : `The audit still needs top fixes completed: ${audit?.roadmap?.slice(0, 2).join(' ') || 'documentation, testing, and deployment polish'}.`],
    ['How would you improve or scale it?', profile.futureScope.length ? profile.futureScope.join(' ') : `I would improve ${name} by adding tests, monitoring, deployment automation, and stronger validation around the detected workflow.`],
    ['What evidence supports this explanation?', profile.evidence.join(' ')],
  ];
  return { bullets, pitch, questions, source: 'profile', style, confidence: profile.confidence };
}

function buildResumeBullets(profile, audit, style) {
  const category = readableCategory(profile.category);
  const stack = naturalList(profile.techStack.slice(0, 3));
  const users = cleanAudience(profile.targetUsers);
  const purpose = cleanSentence(profile.problemSolved || profile.oneLineSummary);
  const features = profile.coreFeatures.map(cleanFeature).filter(Boolean);
  const workflow = [...profile.coreWorkflow, ...profile.usageFlow].map(cleanFeature).filter(Boolean);
  const mainFeature = features[0] || workflow[0] || 'the primary project workflow';
  const secondaryFeature = features.find((item) => item !== mainFeature) || workflow.find((item) => item !== mainFeature);
  const uiFeature = pickByWords([...features, ...workflow], ['dashboard', 'editor', 'visual', 'page', 'interface', 'responsive', 'upload', 'form']);
  const backendFeature = pickByWords([...features, ...workflow], ['api', 'backend', 'server', 'route', 'analysis', 'submission', 'database', 'auth', 'parse']);
  const integration = detectIntegration(profile);
  const readinessFix = detectReadinessFix(audit);
  const stylePrefix = {
    Concise: '',
    Technical: 'with a focus on maintainable architecture',
    'Impact-focused': `to improve ${users || 'the user workflow'}`,
    'ATS-friendly': 'using production-minded implementation patterns',
  }[style];

  return cleanBullets([
    `Built ${articleFor(category)} ${category}${stack ? ` using ${stack}` : ''} to ${purpose || `support ${users || 'users'} with a focused project workflow`}.`,
    `Implemented ${mainFeature}${secondaryFeature ? ` and ${secondaryFeature}` : ''}${users ? ` to support ${users}` : ''}.`,
    uiFeature ? `Designed ${uiFeature} for a clearer, smoother user experience across the core workflow.` : '',
    backendFeature ? `Developed ${backendFeature}${integration ? ` with ${integration}` : ''} to make the project functionality practical and reusable.` : '',
    readinessFix ? `Improved deployment and portfolio readiness by addressing ${readinessFix}.` : '',
    stylePrefix ? `Optimized the project ${stylePrefix}.` : '',
  ], profile, audit, style);
}

function cleanBullets(bullets = [], profile, audit, style) {
  const fallback = fallbackBullet(profile, audit);
  const actionVerb = /^(Built|Developed|Implemented|Designed|Integrated|Optimized|Created|Automated|Improved)\b/i;
  const seen = new Set();
  const cleaned = bullets
    .map((bullet) => String(bullet || '').replace(/^[•\-\s]+/, '').trim())
    .map((bullet) => bullet.replace(/\s+/g, ' '))
    .map(removeRawTechnicalDump)
    .map((bullet) => (actionVerb.test(bullet) ? bullet : `Implemented ${bullet.charAt(0).toLowerCase()}${bullet.slice(1)}`))
    .map((bullet) => (/[.!?]$/.test(bullet) ? bullet : `${bullet}.`))
    .filter((bullet) => bullet.length > 35 && !/evidence-backed|recruiter-facing|main workflow represented/i.test(bullet))
    .filter((bullet) => {
      const key = bullet.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  while (cleaned.length < 4 && fallback.length) {
    const next = fallback.shift();
    if (!seen.has(next.toLowerCase())) cleaned.push(next);
  }
  return cleaned.slice(0, style === 'Concise' ? 4 : 5);
}

function fallbackBullet(profile, audit) {
  const category = readableCategory(profile.category);
  const stack = naturalList(profile.techStack.slice(0, 3));
  const feature = cleanFeature(profile.coreFeatures[0]) || 'the core project workflow';
  const users = cleanAudience(profile.targetUsers) || 'target users';
  const readinessFix = detectReadinessFix(audit) || 'documentation, deployment, and security gaps';
  return [
    `Built ${articleFor(category)} ${category}${stack ? ` using ${stack}` : ''} to solve ${cleanSentence(profile.problemSolved) || 'a clearly defined user problem'}.`,
    `Implemented ${feature} to help ${users} complete the main task with less friction.`,
    `Designed the project structure around focused features, readable screens, and practical portfolio presentation.`,
    `Improved project quality by identifying and planning fixes for ${readinessFix}.`,
  ];
}

function normalizeBulletStyle(style = 'Concise') {
  return ['Concise', 'Technical', 'Impact-focused', 'ATS-friendly'].includes(style) ? style : 'Concise';
}

function cleanAudience(items = []) {
  return items
    .filter((item) => !/project reviewers/i.test(item))
    .slice(0, 2)
    .join(' and ');
}

function cleanSentence(value = '') {
  return value
    .replace(/^helps users\s+/i, 'help users ')
    .replace(/^helps\s+/i, 'help ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\.$/, '');
}

function cleanFeature(value = '') {
  const cleaned = String(value)
    .replace(/API workflows around\s*/i, '')
    .replace(/\/api\/[\w-]+(\s*,\s*\/api\/[\w-]+)*/gi, 'API-backed workflows')
    .replace(/\b(main workflow|structured pages and components)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[.:;,\s]+$/, '');
  if (/^API\b/.test(cleaned)) return cleaned;
  return cleaned.replace(/^[A-Z]/, (letter) => letter.toLowerCase());
}

function removeRawTechnicalDump(value = '') {
  return value
    .replace(/around\s+(\/api\/[\w-]+[, ]*)+/gi, 'for API-backed workflows')
    .replace(/\/api\/[\w-]+/gi, 'API workflow')
    .replace(/\bdependencies?:\s*[^.]+/gi, 'important technologies')
    .replace(/\s+/g, ' ')
    .trim();
}

function pickByWords(items, words) {
  return items.find((item) => words.some((word) => item.toLowerCase().includes(word))) || '';
}

function detectIntegration(profile) {
  const all = [...profile.techStack, ...profile.envVariables, ...profile.evidence, profile.architecture].join(' ').toLowerCase();
  if (/openai|groq|gemini|llm|ai/.test(all)) return 'AI-assisted feedback';
  if (/postgres|database|mongodb|mysql|sqlite|dynamodb|prisma|drizzle/.test(all)) return 'database-backed storage';
  if (/auth|jwt|clerk|cognito|oauth/.test(all)) return 'authentication-ready flows';
  return '';
}

function detectReadinessFix(audit) {
  const issues = audit?.issues || [];
  const labels = [];
  if (issues.some((issue) => issue.category === 'Security')) labels.push('secure environment variable handling');
  if (issues.some((issue) => issue.category === 'Deployment')) labels.push('deployment configuration');
  if (issues.some((issue) => issue.category === 'Docs')) labels.push('README clarity');
  if (issues.some((issue) => issue.category === 'Structure')) labels.push('large-file structure cleanup');
  return naturalList(labels.slice(0, 3));
}

function naturalList(items = []) {
  const values = items.filter(Boolean);
  if (values.length <= 1) return values[0] || '';
  if (values.length === 2) return `${values[0]} and ${values[1]}`;
  return `${values.slice(0, -1).join(', ')}, and ${values.at(-1)}`;
}

function readableCategory(value = '') {
  return singularCategory(value || 'software project').replace(/\bproject project\b/i, 'project');
}

export function downloadText(filename, content) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function reportText(audit) {
  return [
    `RepoReady Report: ${audit.name}`,
    `Type: ${audit.type}`,
    `Overall: ${audit.scores[0].value}/100`,
    '',
    'Top issues:',
    ...audit.issues.slice(0, 8).map((issue) => `- [${issue.severity}] ${issue.problem} (${issue.file})`),
    '',
    'Roadmap:',
    ...audit.roadmap.map((item, index) => `${index + 1}. ${item}`),
  ].join('\n');
}

function buildRoadmap(issues) {
  const fixes = issues.map((issue) => issue.fix);
  return Array.from(new Set(fixes)).slice(0, 5);
}

function buildDistribution(issues) {
  const counts = issues.reduce((acc, issue) => ({ ...acc, [issue.category]: (acc[issue.category] || 0) + 1 }), {});
  return Object.entries(counts).map(([name, value]) => ({ name, value, color: colors[name] || '#22d3ee' }));
}

function adaptIssue(issue, projectType) {
  const prefix = projectType === 'MERN' ? 'frontend/' : projectType === 'Python/Flask' ? 'app/' : '';
  if (issue.file.startsWith('.') || issue.file.includes('/') === false) return issue;
  return { ...issue, file: `${prefix}${issue.file}` };
}

function repoName(repoUrl = '') {
  const clean = repoUrl.replace(/\/$/, '');
  return clean.split('/').pop()?.replace(/[-_]/g, ' ');
}

function nameScore(name) {
  return name.length % 9;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Math.round(value)));
}

function calculateProjectedScore(overall, issues) {
  const fixValue = { Critical: 7, High: 5, Medium: 3, Suggestion: 1 };
  const improvement = issues
    .slice()
    .sort((a, b) => (fixValue[b.severity] || 0) - (fixValue[a.severity] || 0))
    .slice(0, 5)
    .reduce((sum, issue) => sum + (fixValue[issue.severity] || 1), 0);
  return clamp(overall + improvement, overall, 96);
}

function riskLabel(value) {
  if (value < 45) return 'High';
  if (value < 70) return 'Medium';
  return 'Low';
}

function statusFromScore(score) {
  if (score >= 82) return 'Portfolio ready';
  if (score >= 68) return 'Needs polish';
  if (score >= 55) return 'Fix priority issues';
  return 'High risk';
}

function articleFor(value = '') {
  return /^[aeiou]/i.test(value.trim()) ? 'an' : 'a';
}

function singularCategory(value = '') {
  return value.toLowerCase().replace(/\btools\b/g, 'tool').replace(/\bapps\b/g, 'app');
}

function hasUsableProfile(profile) {
  return profile.confidence >= 55
    && profile.evidence.length >= 2
    && profile.coreFeatures.length >= 1
    && profile.techStack.length >= 1
    && !/main workflow represented by/i.test(profile.problemSolved);
}

function needsProfilePack(profile) {
  return {
    needsProfileConfirmation: true,
    confidence: profile.confidence,
    bullets: [],
    pitch: '',
    questions: [],
    message: 'RepoReady does not have enough repository evidence to generate a useful resume pack. Upload a fresh ZIP with README/source files or edit the detected profile first.',
    missing: [
      profile.evidence.length < 2 ? 'Repo evidence is too thin.' : null,
      !profile.coreFeatures.length ? 'Core features were not detected.' : null,
      !profile.techStack.length ? 'Tech stack was not detected.' : null,
      /main workflow represented by/i.test(profile.problemSolved) ? 'Project purpose is still generic.' : null,
    ].filter(Boolean),
  };
}

function shortEvidence(profile) {
  return profile.evidence.slice(0, 3).join('; ');
}

function normalizedProfile(audit) {
  const profile = audit?.projectProfile || {};
  const confidence = normalizeConfidence(profile.confidence);
  return {
    name: profile.name || audit?.name || 'Uploaded Project',
    category: profile.category || `${audit?.type || 'Software'} project`,
    oneLineSummary: profile.oneLineSummary || profile.problemSolved || '',
    targetUsers: ensureArray(profile.targetUsers, ['project reviewers']),
    problemSolved: profile.problemSolved || `Helps users complete the main workflow represented by ${audit?.name || 'the uploaded repository'}.`,
    coreFeatures: ensureArray(profile.coreFeatures),
    coreWorkflow: ensureArray(profile.coreWorkflow),
    techStack: ensureArray(profile.techStack),
    architecture: profile.architecture || '',
    setupCommands: ensureArray(profile.setupCommands),
    envVariables: ensureArray(profile.envVariables),
    folderStructure: ensureArray(profile.folderStructure),
    usageFlow: ensureArray(profile.usageFlow),
    screenshotsNeeded: ensureArray(profile.screenshotsNeeded),
    deploymentNotes: ensureArray(profile.deploymentNotes),
    testingNotes: ensureArray(profile.testingNotes),
    limitations: ensureArray(profile.limitations),
    futureScope: ensureArray(profile.futureScope),
    resumeAngle: profile.resumeAngle || 'a practical, deployable project with clear implementation evidence',
    confidence,
    evidence: ensureArray(profile.evidence, ['No detailed repo evidence was available for this fallback profile.']),
  };
}

function ensureArray(value, fallback = []) {
  if (Array.isArray(value) && value.length) return value;
  if (typeof value === 'string' && value.trim()) return value.split(/\n|,/).map((item) => item.trim()).filter(Boolean);
  return fallback;
}

function normalizeConfidence(value) {
  if (typeof value === 'number') return Math.max(0, Math.min(100, Math.round(value)));
  if (typeof value === 'string') {
    if (/high/i.test(value)) return 85;
    if (/medium/i.test(value)) return 60;
    if (/low/i.test(value)) return 35;
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return Math.max(0, Math.min(100, Math.round(parsed)));
  }
  return 35;
}

function buildReadmeFromProfile(profile) {
  if (profile.confidence < 45) {
    return [
      `# ${profile.name}`,
      '',
      '> RepoReady could not confidently infer enough project details to generate a polished README.',
      '> Please edit and confirm the detected project profile before copying this README.',
      '',
      section('Detected Evidence', profile.evidence),
    ].filter(Boolean).join('\n');
  }

  const lines = [`# ${profile.name}`];
  if (profile.confidence < 70) lines.push('', '> RepoReady inferred this from partial evidence. Please review before copying.');
  appendText(lines, 'One-line Summary', profile.oneLineSummary);
  appendText(lines, 'Overview', profile.problemSolved);
  appendList(lines, 'Key Features', profile.coreFeatures);
  appendList(lines, 'How It Works', profile.coreWorkflow.length ? profile.coreWorkflow : profile.usageFlow);
  appendList(lines, 'Tech Stack', profile.techStack);
  appendText(lines, 'Architecture', profile.architecture);
  appendList(lines, 'Folder Structure', profile.folderStructure.map((item) => `\`${item}\``));
  appendCode(lines, 'Getting Started', profile.setupCommands.length ? profile.setupCommands.join('\n') : 'Setup commands could not be confidently detected. Please verify manually.', profile.setupCommands.length ? 'bash' : '');
  appendCode(lines, 'Environment Variables', profile.envVariables.map((item) => `${item}=...`).join('\n'), 'env');
  appendList(lines, 'Usage Flow', profile.usageFlow);
  appendList(lines, 'Screenshots', profile.screenshotsNeeded);
  appendList(lines, 'Deployment', profile.deploymentNotes);
  appendList(lines, 'Testing', profile.testingNotes);
  appendList(lines, 'Limitations', profile.limitations);
  appendList(lines, 'Future Scope', profile.futureScope);
  appendText(lines, 'Resume/Portfolio Value', profile.resumeAngle);
  appendList(lines, 'Evidence Used', profile.evidence);
  return lines.join('\n');
}

function appendText(lines, title, text) {
  if (!text) return;
  lines.push('', `## ${title}`, text);
}

function appendList(lines, title, items = []) {
  if (!items.length) return;
  lines.push('', `## ${title}`, ...items.map((item) => `- ${item}`));
}

function appendCode(lines, title, content, lang = '') {
  if (!content) return;
  lines.push('', `## ${title}`, `\`\`\`${lang}`, content, '```');
}

function section(title, items = []) {
  if (!items.length) return '';
  return [`## ${title}`, ...items.map((item) => `- ${item}`)].join('\n');
}
