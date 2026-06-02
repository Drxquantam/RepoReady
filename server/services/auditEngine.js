import { v4 as uuid } from 'uuid';
import { generateJsonWithGroq, isGroqConfigured } from './groq.js';
import { buildIssuesFromScan } from './projectScanner.js';

const colors = {
  Security: '#fb7185',
  Deployment: '#f59e0b',
  Docs: '#22d3ee',
  Structure: '#8b5cf6',
};

const issueBank = {
  secrets: [
    ['Critical', 'Security', 'src/config/api.js', 'Provider API key may be exposed in frontend code.', 'Keys shipped to browsers can be copied from DevTools and abused immediately.', 'Move provider calls to a backend route and read the API key from server-side environment variables.'],
    ['Critical', 'Security', '.env', '.env appears to be part of the submitted project files.', 'Secrets, database URLs, and private tokens should never be committed or shared in ZIP uploads.', 'Remove .env from the repo, add it to .gitignore, and create a sanitized .env.example.'],
  ],
  deployment: [
    ['Critical', 'Deployment', 'src/config.js', 'Backend URL is hardcoded to localhost.', 'The deployed frontend will keep calling your local machine and fail for reviewers.', 'Replace localhost URLs with environment variables such as VITE_API_BASE_URL.'],
    ['High', 'Deployment', 'package.json', 'Production start or build scripts need review.', 'Deployment platforms rely on predictable scripts to build and serve the app.', 'Add clear build, preview, and start scripts for the selected hosting platform.'],
    ['High', 'Deployment', 'server.js', 'CORS configuration may fail after deployment.', 'Local-only CORS settings often block requests between deployed frontend and backend URLs.', 'Read allowed origins from an environment variable and include the production frontend URL.'],
  ],
  docs: [
    ['High', 'Docs', 'README.md', 'README needs complete setup instructions.', 'Recruiters and evaluators need a fast path to run, inspect, and trust the project.', 'Add install, environment, development, build, and deployment sections with exact commands.'],
    ['High', 'Docs', '.env.example', 'No environment variable template is documented.', 'A safe env template lets others configure the app without exposing real keys.', 'Create .env.example with required variable names and placeholder values.'],
    ['Medium', 'Docs', 'public/screenshots', 'Project screenshots are missing from the portfolio package.', 'Screenshots make the repository easier to scan and more convincing as a resume project.', 'Add screenshots for the main workflow and reference them in the README.'],
  ],
  structure: [
    ['Medium', 'Structure', 'src/App.jsx', 'Main app file is likely doing too much.', 'Large components are harder to explain, test, and defend in interviews.', 'Split routes, layout, data fetching, and feature screens into focused components.'],
    ['Medium', 'Structure', 'src/components', 'Generated or unused component files should be reviewed.', 'Dead files make the project look unfinished and confuse reviewers.', 'Remove unused generated components or wire them into the app deliberately.'],
    ['Suggestion', 'Structure', 'docs/deployment.md', 'Deployment guide is missing.', 'A deployment guide proves that the project can survive outside localhost.', 'Document frontend and backend deployment steps, environment variables, and test URLs.'],
  ],
};

export function createAudit(input) {
  const projectName = input.projectName?.trim() || input.projectProfile?.name || repoName(input.repoUrl) || cleanZipName(input.fileName) || 'Untitled Portfolio Project';
  const selected = input.checks || {};
  const scanIssues = buildIssuesFromScan(input.scan);
  const issues = scanIssues.length ? scanIssues : [
    selected.secrets && issueBank.secrets,
    selected.deployment && issueBank.deployment,
    selected.readme && issueBank.docs,
    selected.structure && issueBank.structure,
  ].filter(Boolean).flat().map(toIssue);

  const critical = count(issues, 'Critical');
  const high = count(issues, 'High');
  const medium = count(issues, 'Medium');
  const categoryScores = scoreCategories(issues, input.scan);
  const overall = clamp(Math.round((categoryScores.github + categoryScores.deployment + categoryScores.security + categoryScores.readme + categoryScores.resume) / 5), 8, 96);
  const projectedScore = calculateProjectedScore(overall, issues);
  const now = new Date();

  return {
    id: uuid(),
    name: projectName,
    repoUrl: input.repoUrl?.trim() || '',
    type: input.projectType || 'React',
    fileName: input.fileName || '',
    fileSize: input.fileSize || 0,
    projectProfile: input.projectProfile || null,
    scanSummary: input.scan ? summarizeScan(input.scan) : null,
    updatedAt: now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    createdAt: now.toISOString(),
    status: statusFromScore(overall),
    projectedScore,
    scores: [
      { label: 'Overall Project Readiness', value: overall, accent: 'cyan' },
      { label: 'GitHub Readiness', value: categoryScores.github, accent: 'violet' },
      { label: 'Deployment Readiness', value: categoryScores.deployment, accent: 'amber' },
      { label: 'Security Risk', value: categoryScores.security, display: riskLabel(categoryScores.security), accent: 'rose', inverse: categoryScores.security < 55 },
      { label: 'Resume Readiness', value: categoryScores.resume, accent: 'emerald' },
    ],
    issues,
    roadmap: Array.from(new Set(issues.map((issue) => issue.fix))).slice(0, 5),
    issueDistribution: distribution(issues),
    readinessBars: [
      { area: 'GitHub', value: categoryScores.github },
      { area: 'Deploy', value: categoryScores.deployment },
      { area: 'Security', value: categoryScores.security },
      { area: 'README', value: categoryScores.readme },
      { area: 'Resume', value: categoryScores.resume },
    ],
  };
}

export function generateReadme(audit) {
  const projectProfile = normalizedProfile(audit);
  return buildReadmeFromProfile(projectProfile);
}

export async function generateAiReadme(audit) {
  return generateReadme(audit);
}

export function generateResumePack(audit, options = {}) {
  const profile = normalizedProfile(audit);
  if (!hasUsableProfile(profile)) return needsProfilePack(profile);

  const stack = profile.techStack.slice(0, 4).join(', ');
  const features = profile.coreFeatures.slice(0, 4);
  const workflow = (profile.coreWorkflow.length ? profile.coreWorkflow : profile.usageFlow).slice(0, 3);
  const category = singularCategory(profile.category);
  const style = normalizeBulletStyle(options.style);
  return {
    bullets: buildResumeBullets(profile, audit, style),
    pitch: `${profile.name} is ${articleFor(category)} ${category} for ${profile.targetUsers.join(', ')}. ${profile.problemSolved} The main implementation evidence is ${shortEvidence(profile)}, and the strongest resume angle is ${profile.resumeAngle.toLowerCase()}.`,
    questions: [
      ['What problem does this solve?', profile.problemSolved],
      ['Who are the target users?', `${profile.name} is aimed at ${profile.targetUsers.join(', ')} based on the detected project profile.`],
      ['Why this tech stack?', `${stack} is present in the repository evidence and supports features such as ${features.slice(0, 3).join(', ')}.`],
      ['How does the architecture work?', profile.architecture || `The architecture explanation is based on detected folders and files: ${profile.folderStructure.slice(0, 6).join(', ')}.`],
      ['What is the main user workflow?', workflow.length ? workflow.join(' -> ') : `The detected workflow centers on ${features.slice(0, 3).join(', ')}.`],
      ['How did you handle configuration or API keys?', profile.envVariables.length ? `The project uses environment variables such as ${profile.envVariables.join(', ')}. Real values should stay outside source control.` : 'No environment variable evidence was detected, so configuration handling should be verified manually.'],
      ['What are the limitations?', profile.limitations.length ? profile.limitations.join(' ') : `The audit still needs top fixes completed: ${audit.roadmap?.slice(0, 2).join(' ') || 'documentation, testing, and deployment polish'}.`],
      ['How would you improve or scale it?', profile.futureScope.length ? profile.futureScope.join(' ') : `I would improve ${profile.name} by adding tests, monitoring, deployment automation, and stronger validation around the detected workflow.`],
      ['What evidence supports this explanation?', profile.evidence.join(' ')],
    ],
    source: 'profile',
    style,
    confidence: profile.confidence,
  };
}

export async function generateAiResumePack(audit, options = {}) {
  const profile = normalizedProfile(audit);
  if (!hasUsableProfile(profile)) return needsProfilePack(profile);
  const style = normalizeBulletStyle(options.style);
  if (!isGroqConfigured()) return generateResumePack(audit, { style });

  const fallback = generateResumePack(audit, { style });
  try {
    const generated = await generateJsonWithGroq(`Generate a detailed, project-specific placement resume pack using only this detected project profile.

Detected project profile:
${JSON.stringify(profile, null, 2)}

Audit context:
${JSON.stringify({ topIssues: audit.issues?.slice(0, 6), roadmap: audit.roadmap }, null, 2)}

JSON shape:
{
  "bullets": ["4 to 5 resume bullets"],
  "pitch": "30 second project pitch",
  "questions": [["question", "detailed answer"], ["8 total question-answer pairs"]],
  "source": "groq",
  "style": "${style}",
  "confidence": ${profile.confidence}
}

Rules:
- Bullet style: ${style}.
- Each bullet must be 1 to 2 lines only.
- Start each bullet with Built, Developed, Implemented, Designed, Integrated, Optimized, Created, or Automated.
- Do not dump raw dependency lists, raw endpoint names, file lists, or package names.
- Convert repo evidence into professional student/fresher resume language.
- Focus on what was built, the important feature, and the user/project value.
- Avoid phrases like "prepared recruiter-facing project material" and "evidence-backed implementation details".
- Do not use generic phrases like "main workflow", "ordinary project", "MERN project", or "project reviewers".
- Do not start bullets with "Built X, a category project"; write achievement bullets with concrete implementation details.
- Every bullet and answer must mention actual detected features, workflow, stack, routes, env vars, folders, or evidence.
- If a detail is not in the profile, do not invent it.
- Make answers useful for placement interviews: technical, specific, and defensible.`, fallback);
    return { ...generated, bullets: buildResumeBullets(profile, audit, style), style };
  } catch (error) {
    return {
      ...fallback,
      source: 'profile',
      aiStatus: `Groq unavailable: ${error.message}`,
    };
  }
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

export function reportText(audit) {
  return [`RepoReady Report: ${audit.name}`, `Type: ${audit.type}`, `Overall: ${audit.scores[0].value}/100`, '', 'Top issues:', ...audit.issues.slice(0, 8).map((issue) => `- [${issue.severity}] ${issue.problem} (${issue.file})`), '', 'Roadmap:', ...audit.roadmap.map((item, index) => `${index + 1}. ${item}`)].join('\n');
}

function toIssue([severity, category, file, problem, why, fix]) {
  return { severity, category, file, problem, why, fix };
}

function distribution(issues) {
  const counts = issues.reduce((acc, issue) => ({ ...acc, [issue.category]: (acc[issue.category] || 0) + 1 }), {});
  return Object.entries(counts).map(([name, value]) => ({ name, value, color: colors[name] || '#22d3ee' }));
}

function count(issues, severity) {
  return issues.filter((issue) => issue.severity === severity).length;
}

function repoName(repoUrl = '') {
  return repoUrl.replace(/\/$/, '').split('/').pop()?.replace(/[-_]/g, ' ');
}

function cleanZipName(fileName = '') {
  return fileName.replace(/\.zip$/i, '').replace(/[-_]/g, ' ');
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Math.round(value)));
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

function scoreCategories(issues, scan) {
  const byCategory = (category) => issues.filter((issue) => issue.category === category);
  const penalty = (items) => items.reduce((total, issue) => total + severityPenalty(issue.severity), 0);
  const githubIssues = [...byCategory('Docs'), ...byCategory('Structure')];
  const deploymentIssues = byCategory('Deployment');
  const securityIssues = byCategory('Security');
  const readmeIssues = issues.filter((issue) => issue.file.toLowerCase().includes('readme') || issue.category === 'Docs');
  const repoSignals = scan ? projectSignalBonus(scan) : 0;
  const readmeSignals = scan?.hasReadme ? 10 : 0;
  const screenshotSignals = scan?.screenshots?.length ? 6 : 0;
  const scriptSignals = (scan?.hasBuildScript ? 7 : 0) + (scan?.hasStartScript ? 7 : 0);
  const envSignals = scan?.envExamples?.length ? 6 : 0;

  return {
    github: clamp(72 + repoSignals + readmeSignals / 2 - penalty(githubIssues), 5, 96),
    deployment: clamp(70 + scriptSignals + envSignals - penalty(deploymentIssues), 5, 96),
    security: clamp(88 + envSignals - penalty(securityIssues), 5, 98),
    readme: clamp(52 + readmeSignals + screenshotSignals + envSignals - penalty(readmeIssues), 5, 96),
    resume: clamp(58 + readmeSignals + screenshotSignals + repoSignals - penalty(githubIssues) / 2, 10, 96),
  };
}

function severityPenalty(severity) {
  return { Critical: 24, High: 14, Medium: 7, Suggestion: 3 }[severity] || 4;
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

function projectSignalBonus(scan) {
  let bonus = 0;
  if (scan.fileCount > 20) bonus += 4;
  if (scan.packageFiles?.length) bonus += 4;
  if (scan.hasComponentsDir) bonus += 4;
  if (scan.hasDocsDir) bonus += 3;
  return bonus;
}

function summarizeScan(scan) {
  return {
    fileCount: scan.fileCount,
    textFileCount: scan.textFileCount,
    packageFiles: scan.packageFiles.map((pkg) => ({ path: pkg.path, scripts: Object.keys(pkg.scripts || {}) })),
    hasReadme: scan.hasReadme,
    envFiles: scan.envFiles,
    envExamples: scan.envExamples,
    secretHitCount: scan.secretHits.length,
    localhostFiles: scan.localhostFiles,
    screenshots: scan.screenshots,
    largeComponents: scan.largeComponents,
    inferredSignals: scan.repoSignals ? {
      readmeTitle: scan.repoSignals.readmeTitle,
      dependencies: scan.repoSignals.dependencies?.slice(0, 20),
      routeNames: scan.repoSignals.routeNames?.slice(0, 20),
      apiEndpoints: scan.repoSignals.apiEndpoints?.slice(0, 20),
      componentNames: scan.repoSignals.componentNames?.slice(0, 20),
      keywords: scan.repoSignals.keywords?.slice(0, 20),
    } : null,
  };
}

function summarizeAudit(audit) {
  return {
    name: audit.name,
    type: audit.type,
    projectProfile: audit.projectProfile,
    repoUrl: audit.repoUrl,
    scores: audit.scores,
    topIssues: audit.issues?.slice(0, 8),
    roadmap: audit.roadmap,
    scanSummary: audit.scanSummary,
  };
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
