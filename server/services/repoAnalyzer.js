import { generateJsonWithGroq, isGroqConfigured } from './groq.js';

export async function inferProjectProfile({ scan, fallbackName, projectType }) {
  const signals = scan?.repoSignals || {};
  const fallback = buildFallbackProfile({ signals, fallbackName, projectType });

  if (!isGroqConfigured() || !scan) return fallback;

  try {
    const profile = await generateJsonWithGroq(`Infer what this uploaded repository actually does from repo evidence.

Return a concise JSON projectProfile with this exact shape:
{
  "name": "project name",
  "category": "short category",
  "oneLineSummary": "one specific sentence",
  "targetUsers": ["2-4 target user groups"],
  "problemSolved": "one clear sentence",
  "coreFeatures": ["4-6 concrete features evidenced by the repo"],
  "coreWorkflow": ["ordered workflow steps evidenced by UI/routes/docs"],
  "techStack": ["main technologies"],
  "architecture": "specific architecture summary from folders/routes/configs",
  "setupCommands": ["commands derived only from detected scripts/files"],
  "envVariables": ["detected env variable names only"],
  "folderStructure": ["actual folders only"],
  "usageFlow": ["specific user flow steps"],
  "screenshotsNeeded": ["screenshots that match actual pages/features"],
  "deploymentNotes": ["deployment notes only when deployment evidence exists"],
  "testingNotes": ["testing notes only when test evidence exists"],
  "limitations": ["honest limitations from missing/weak evidence"],
  "futureScope": ["future scope based on existing features, not invented product pivots"],
  "resumeAngle": "one recruiter-facing angle",
  "confidence": 0,
  "evidence": ["4-8 evidence bullets mentioning source: README, dependencies, routes, UI text, components, endpoints"]
}

Rules:
- Use actual evidence only.
- Do not call it a generic MERN/student project unless evidence supports that.
- If evidence is weak, set confidence below 45 and say what needs confirmation.
- setupCommands must come from detected package scripts or detected project files only.
- envVariables must come from .env.example/process.env/import.meta.env/os.getenv only.
- folderStructure must use actual folders only.
- Keep claims honest and portfolio-ready.

Signals:
${JSON.stringify(summarizeSignals(signals), null, 2)}`, fallback);
    return { ...normalizeProfile(profile, fallback), inferenceSource: 'groq' };
  } catch (error) {
    return {
      ...fallback,
      inferenceSource: 'rules',
      aiStatus: `Groq unavailable: ${error.message}`,
      evidence: [...fallback.evidence, `Groq unavailable: ${error.message}`],
    };
  }
}

export function buildFallbackProfile({ signals = {}, fallbackName, projectType }) {
  const dependencies = [...(signals.dependencies || []), ...(signals.devDependencies || [])];
  const name = signals.readmeTitle || fallbackName || 'Uploaded Project';
  const techStack = inferTechStack(dependencies, projectType);
  const featureTerms = inferFeatureTerms(signals);
  const category = inferCategory(featureTerms, dependencies, projectType);
  const confidence = confidenceFor(signals);

  return {
    name,
    category,
    oneLineSummary: inferOneLineSummary(featureTerms, category),
    targetUsers: inferTargetUsers(featureTerms, category),
    problemSolved: inferProblem(featureTerms, category),
    coreFeatures: inferCoreFeatures(signals, featureTerms),
    coreWorkflow: inferWorkflow(signals, featureTerms),
    techStack,
    architecture: inferArchitecture(signals, techStack),
    setupCommands: inferSetupCommands(signals),
    envVariables: signals.envVariables || [],
    folderStructure: signals.folderStructure || [],
    usageFlow: inferWorkflow(signals, featureTerms),
    screenshotsNeeded: inferScreenshots(signals),
    deploymentNotes: inferDeploymentNotes(signals),
    testingNotes: inferTestingNotes(signals),
    limitations: inferLimitations(signals),
    futureScope: inferFutureScope(signals, category),
    resumeAngle: `Position ${name} as a ${category.toLowerCase()} project with clear user workflows, deployable architecture, and evidence-backed implementation details.`,
    confidence,
    evidence: evidenceFor(signals, dependencies),
  };
}

function normalizeProfile(profile = {}, fallback) {
  return {
    name: profile.name || fallback.name,
    category: profile.category || fallback.category,
    oneLineSummary: profile.oneLineSummary || fallback.oneLineSummary,
    targetUsers: toList(profile.targetUsers, fallback.targetUsers),
    problemSolved: profile.problemSolved || fallback.problemSolved,
    coreFeatures: toList(profile.coreFeatures, fallback.coreFeatures),
    coreWorkflow: toList(profile.coreWorkflow, fallback.coreWorkflow),
    techStack: toList(profile.techStack, fallback.techStack),
    architecture: profile.architecture || fallback.architecture,
    setupCommands: toList(profile.setupCommands, fallback.setupCommands),
    envVariables: toList(profile.envVariables, fallback.envVariables),
    folderStructure: toList(profile.folderStructure, fallback.folderStructure),
    usageFlow: toList(profile.usageFlow, fallback.usageFlow),
    screenshotsNeeded: toList(profile.screenshotsNeeded, fallback.screenshotsNeeded),
    deploymentNotes: toList(profile.deploymentNotes, fallback.deploymentNotes),
    testingNotes: toList(profile.testingNotes, fallback.testingNotes),
    limitations: toList(profile.limitations, fallback.limitations),
    futureScope: toList(profile.futureScope, fallback.futureScope),
    resumeAngle: profile.resumeAngle || fallback.resumeAngle,
    confidence: normalizeConfidence(profile.confidence, fallback.confidence),
    evidence: toList(profile.evidence, fallback.evidence),
  };
}

function toList(value, fallback = []) {
  if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean);
  if (typeof value === 'string') {
    const parts = value
      .split(/\n|;|(?:\s{2,})|,(?=\s*[A-Z])/)
      .map((item) => item.replace(/^[-*]\s*/, '').trim())
      .filter(Boolean);
    return parts.length ? parts : fallback;
  }
  return fallback;
}

function summarizeSignals(signals) {
  return {
    readmeTitle: signals.readmeTitle,
    readmeSummary: signals.readmeSummary,
    dependencies: signals.dependencies,
    devDependencies: signals.devDependencies,
    scripts: signals.scripts,
    packageBins: signals.packageBins,
    frameworks: signals.frameworks,
    folderStructure: signals.folderStructure,
    routeNames: signals.routeNames,
    apiEndpoints: signals.apiEndpoints,
    pageNames: signals.pageNames,
    uiText: signals.uiText?.slice(0, 50),
    componentNames: signals.componentNames,
    envVariables: signals.envVariables,
    databaseIndicators: signals.databaseIndicators,
    authenticationIndicators: signals.authenticationIndicators,
    deploymentIndicators: signals.deploymentIndicators,
    testingIndicators: signals.testingIndicators,
    dockerIndicators: signals.dockerIndicators,
    ciIndicators: signals.ciIndicators,
    keywords: signals.keywords,
    importantFiles: signals.importantFiles?.map((file) => ({ path: file.path, sample: file.sample.slice(0, 900) })).slice(0, 25),
  };
}

function inferTechStack(dependencies = [], projectType = 'Other') {
  const dep = new Set(dependencies.map((item) => item.toLowerCase()));
  const stack = [];
  if (dep.has('react')) stack.push('React');
  if (dep.has('vite')) stack.push('Vite');
  if (dep.has('next')) stack.push('Next.js');
  if (dep.has('express')) stack.push('Express');
  if (dep.has('mongoose')) stack.push('MongoDB/Mongoose');
  if (dep.has('@aws-sdk/client-s3')) stack.push('AWS S3');
  if (dep.has('@aws-sdk/client-dynamodb')) stack.push('DynamoDB');
  if (dep.has('tailwindcss')) stack.push('Tailwind CSS');
  if (dep.has('framer-motion')) stack.push('Framer Motion');
  if (dep.has('recharts')) stack.push('Recharts');
  if (dep.has('commander')) stack.push('Node.js', 'Commander.js');
  return stack.length ? stack : [];
}

function inferFeatureTerms(signals = {}) {
  return [
    ...(signals.keywords || []),
    ...(signals.routeNames || []),
    ...(signals.apiEndpoints || []),
    ...(signals.componentNames || []),
    ...(signals.uiText || []),
  ].join(' ').toLowerCase();
}

function inferCategory(text, dependencies, projectType) {
  if (/monaco|codeeditor|code editor|dry-run|dry run|trace|runtimegraph|graphvisualizer|analyze|submissions|language dropdown/.test(text)) return 'Developer education tool';
  if (/cli|command line|terminal|commander|summarize/.test(text) || dependencies?.some((item) => item.toLowerCase() === 'commander')) return 'CLI tool';
  if (/resume|ats|job|career|placement|interview/.test(text)) return 'Career tools';
  if (/audit|scan|report|readme|repository|github|deploy/.test(text)) return 'Developer tools';
  if (/expense|invoice|payment|finance|budget/.test(text)) return 'Finance productivity';
  if (/task|todo|kanban|project|workspace/.test(text)) return 'Productivity app';
  if (/chat|message|ai|llm|gemini|openai|groq/.test(text)) return 'AI application';
  if (dependencies?.some((item) => item.toLowerCase() === 'express') && dependencies?.some((item) => item.toLowerCase() === 'react')) return 'Full-stack web app';
  return `${projectType || 'Software'} project`;
}

function inferTargetUsers(text, category) {
  if (category === 'Developer education tool') return ['students learning DSA', 'coding interview candidates', 'programming learners'];
  if (/student|resume|placement|interview|job/.test(text)) return ['students', 'job seekers', 'placement candidates'];
  if (/developer|repo|github|audit|deploy/.test(text)) return ['students', 'indie developers', 'portfolio builders'];
  if (/admin|dashboard|analytics/.test(text)) return ['operators', 'admins', 'project owners'];
  return ['end users', `${category.toLowerCase()} users`, 'reviewers'];
}

function inferProblem(text, category) {
  if (category === 'Developer education tool') return 'Helps learners write, analyze, trace, and understand code execution for programming practice.';
  if (/cli|command line|terminal|summarize|report/.test(text) && category === 'CLI tool') return 'Helps users run a focused command-line workflow from the terminal.';
  if (/resume|ats|job|interview/.test(text)) return 'Helps users prepare stronger job application material and understand gaps against role expectations.';
  if (/repo|github|audit|deploy|readme/.test(text)) return 'Helps users improve repository quality, deployment readiness, and project presentation before sharing their work.';
  if (/expense|budget|invoice/.test(text)) return 'Helps users organize financial information and make routine tracking easier.';
  return `Solves a focused ${category.toLowerCase()} workflow by turning scattered user actions into a clearer digital experience.`;
}

function inferOneLineSummary(text, category) {
  if (category === 'Developer education tool') return 'An interactive coding practice tool for editing code, analyzing complexity, tracing execution, and reviewing submissions.';
  if (category === 'CLI tool') return 'A command-line tool for the workflow described in the repository.';
  if (/resume|ats|job|interview/.test(text)) return 'A career-focused tool for comparing resumes, job requirements, and preparation gaps.';
  if (/repo|github|audit|deploy|readme/.test(text)) return 'A developer tool for auditing and improving repository readiness.';
  if (/expense|budget|invoice/.test(text)) return 'A finance workflow tool for tracking and organizing money-related records.';
  return `A ${category.toLowerCase()} built around the workflows detected in the repository.`;
}

function inferCoreFeatures(signals, text) {
  const features = [];
  const readmeFeature = firstReadmeSentence(signals.readmeSummary);
  if (readmeFeature) features.push(readmeFeature);
  if (signals.packageBins?.length) features.push(`CLI command entry point: ${signals.packageBins.join(', ')}`);
  if (signals.routeNames?.length) features.push(`Navigation/routes for ${signals.routeNames.slice(0, 4).join(', ')}`);
  if (signals.apiEndpoints?.length) features.push(`API workflows around ${signals.apiEndpoints.slice(0, 4).join(', ')}`);
  if (/monaco|codeeditor|code editor/.test(text)) features.push('In-browser code editing experience');
  if (/dry-run|dry run|trace/.test(text)) features.push('Code tracing and dry-run assistance');
  if (/complexity|analyze/.test(text)) features.push('Code analysis and complexity feedback');
  if (/mistake|notebook|submission/.test(text)) features.push('Submission history and mistake tracking');
  if (/upload|zip|file/.test(text)) features.push('File upload and project intake workflow');
  if (/dashboard|analytics|score|chart/.test(text)) features.push('Dashboard/reporting view with score-based insights');
  if (/report/.test(text) && !/dashboard|score|chart/.test(text)) features.push('Report generation workflow');
  if (/readme|resume|interview|question/.test(text)) features.push('Generated portfolio documentation and interview preparation content');
  if (/auth|login|signup/.test(text)) features.push('Authentication-oriented user flow');
  if (signals.componentNames?.length) features.push(`Reusable UI modules such as ${signals.componentNames.slice(0, 4).join(', ')}`);
  return features.slice(0, 6).length ? features.slice(0, 6) : ['Core user workflow', 'Responsive interface', 'Structured project pages', 'Reusable components'];
}

function inferWorkflow(signals, text) {
  const steps = [];
  if (signals.packageBins?.length) steps.push(`Run the CLI command ${signals.packageBins[0]}.`);
  if (/upload|file|zip|resume/.test(text)) steps.push('Upload or provide the primary input file/data.');
  if (signals.apiEndpoints?.length) steps.push(`Send data through API routes such as ${signals.apiEndpoints.slice(0, 3).join(', ')}.`);
  if (/codeeditor|code editor|language/.test(text)) steps.push('Choose a programming language and write code in the editor.');
  if (/analyze|complexity/.test(text)) steps.push('Run analysis to review complexity and implementation feedback.');
  if (/trace|dry-run|dry run/.test(text)) steps.push('Trace execution or request dry-run help for the submitted code.');
  if (/dashboard|report|score|analysis|result/.test(text)) steps.push('Review generated results or report output.');
  if (signals.routeNames?.length) steps.push(`Navigate through app routes including ${signals.routeNames.slice(0, 3).join(', ')}.`);
  return steps;
}

function inferArchitecture(signals, techStack) {
  const parts = [];
  if (signals.folderStructure?.some((folder) => /src|app|pages|components/.test(folder))) parts.push('frontend UI folders');
  if (signals.folderStructure?.some((folder) => /server|api|routes|controllers/.test(folder))) parts.push('backend/API route folders');
  if (signals.envVariables?.length) parts.push('environment-based configuration');
  if (signals.databaseIndicators?.length) parts.push(`${signals.databaseIndicators.join(', ')} persistence indicators`);
  if (!parts.length) return '';
  return techStack.length
    ? `The repository appears to combine ${parts.join(', ')} using ${techStack.join(', ')}.`
    : `The repository appears to combine ${parts.join(', ')}.`;
}

function inferSetupCommands(signals) {
  const commands = [];
  if (signals.dependencies?.length || signals.devDependencies?.length) commands.push('npm install');
  for (const script of signals.scripts || []) {
    if (['dev', 'start', 'build', 'preview', 'test'].includes(script.name)) commands.push(`npm run ${script.name}`);
  }
  for (const bin of signals.packageBins || []) commands.push(`npx ${bin}`);
  if (signals.importantFiles?.some((file) => /requirements\.txt$/i.test(file.path))) commands.unshift('pip install -r requirements.txt');
  if (signals.importantFiles?.some((file) => /pyproject\.toml$/i.test(file.path))) commands.unshift('pip install -e .');
  return Array.from(new Set(commands));
}

function inferScreenshots(signals) {
  const pages = [...(signals.pageNames || []), ...(signals.routeNames || [])].filter(Boolean).slice(0, 5);
  return pages.map((page) => `${page} screen`);
}

function inferDeploymentNotes(signals) {
  const notes = [];
  if (signals.deploymentIndicators?.length) notes.push(`Deployment files/platforms detected: ${signals.deploymentIndicators.join(', ')}.`);
  if (signals.dockerIndicators) notes.push('Docker configuration is present.');
  return notes;
}

function inferTestingNotes(signals) {
  if (!signals.testingIndicators?.length) return [];
  return [`Testing indicators detected: ${signals.testingIndicators.join(', ')}.`];
}

function inferLimitations(signals) {
  const items = [];
  if (!signals.readmeSummary) items.push('Existing README evidence is limited, so the project purpose should be confirmed.');
  if (!signals.envVariables?.length) items.push('No environment variables were confidently detected.');
  if (!signals.testingIndicators?.length) items.push('No test framework or test workflow was confidently detected.');
  if (!signals.deploymentIndicators?.length && !signals.dockerIndicators) items.push('No deployment configuration was confidently detected.');
  return items;
}

function inferFutureScope(signals, category) {
  const items = [];
  if (!signals.testingIndicators?.length) items.push('Add automated tests for the main workflow.');
  if (!signals.deploymentIndicators?.length) items.push('Document or add production deployment configuration.');
  if (signals.coreWorkflow?.length || category) items.push(`Improve the existing ${category.toLowerCase()} workflow with clearer validation and error states.`);
  return items;
}

function confidenceFor(signals = {}) {
  let score = 0;
  if (signals.readmeSummary?.length > 180) score += 25;
  if (signals.dependencies?.length || signals.frameworks?.length) score += 15;
  if (signals.routeNames?.length || signals.apiEndpoints?.length) score += 15;
  if (signals.uiText?.length >= 8) score += 15;
  if (signals.componentNames?.length >= 4 || signals.pageNames?.length) score += 10;
  if (signals.folderStructure?.length) score += 10;
  if (signals.envVariables?.length || signals.scripts?.length) score += 10;
  if (signals.packageBins?.length) score += 10;
  return Math.max(20, Math.min(95, score));
}

function evidenceFor(signals = {}, dependencies = []) {
  return [
    signals.readmeTitle ? `README title: ${signals.readmeTitle}` : null,
    dependencies.length ? `Dependencies: ${dependencies.slice(0, 8).join(', ')}` : null,
    signals.routeNames?.length ? `Routes found: ${signals.routeNames.slice(0, 6).join(', ')}` : null,
    signals.packageBins?.length ? `CLI entry points: ${signals.packageBins.slice(0, 6).join(', ')}` : null,
    signals.apiEndpoints?.length ? `API endpoints found: ${signals.apiEndpoints.slice(0, 6).join(', ')}` : null,
    signals.componentNames?.length ? `Components/pages: ${signals.componentNames.slice(0, 8).join(', ')}` : null,
    signals.pageNames?.length ? `Pages: ${signals.pageNames.slice(0, 8).join(', ')}` : null,
    signals.uiText?.length ? `UI text includes: ${signals.uiText.slice(0, 5).join(' | ')}` : null,
    signals.envVariables?.length ? `Environment variables: ${signals.envVariables.slice(0, 8).join(', ')}` : null,
    signals.folderStructure?.length ? `Folders: ${signals.folderStructure.slice(0, 10).join(', ')}` : null,
  ].filter(Boolean);
}

function firstReadmeSentence(text = '') {
  const cleaned = text.replace(/^#\s+[^.?!]+(?:\s|$)/i, '').trim();
  const sentence = cleaned.match(/[^.!?]+[.!?]/)?.[0]?.trim();
  return sentence && sentence.length > 20 ? sentence : '';
}

function normalizeConfidence(value, fallback = 35) {
  if (typeof value === 'number') return Math.max(0, Math.min(100, Math.round(value)));
  if (typeof value === 'string') {
    if (/high/i.test(value)) return 85;
    if (/medium/i.test(value)) return 60;
    if (/low/i.test(value)) return 35;
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return Math.max(0, Math.min(100, Math.round(parsed)));
  }
  return fallback;
}
