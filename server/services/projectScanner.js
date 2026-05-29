import AdmZip from 'adm-zip';

const TEXT_FILE_PATTERN = /\.(js|jsx|ts|tsx|json|md|txt|env|example|yml|yaml|html|css|scss|py|java|go|rb|php|toml|xml|gradle|properties)$/i;
const IGNORED_PATHS = /(^|\/)(node_modules|dist|build|\.git|coverage|\.next|venv|__pycache__)\//i;
const SECRET_PATTERNS = [
  /AIza[0-9A-Za-z\-_]{20,}/,
  /sk-[A-Za-z0-9_\-]{20,}/,
  /gsk_[A-Za-z0-9_\-]{20,}/,
  /(?<!example_)(api|secret|token|password|private)[A-Z0-9_]*\s*=\s*["']?[A-Za-z0-9_\-]{16,}/i,
];

export function scanProjectZip(buffer) {
  if (!buffer) return null;

  const zip = new AdmZip(buffer);
  const entries = zip.getEntries().filter((entry) => !entry.isDirectory);
  const files = entries
    .filter((entry) => !IGNORED_PATHS.test(normalize(entry.entryName)))
    .map((entry) => ({
      path: normalize(entry.entryName),
      size: entry.header.size,
      entry,
    }));

  const textFiles = files
    .filter((file) => file.size <= 350_000 && isTextFile(file.path))
    .map((file) => ({ ...file, content: file.entry.getData().toString('utf8') }));

  const packageFiles = parsePackageFiles(textFiles);
  const readme = textFiles.find((file) => /(^|\/)readme\.md$/i.test(file.path));
  const envFiles = files.filter((file) => /(^|\/)\.env(\.|$)?/i.test(file.path) && !/\.example$/i.test(file.path));
  const envExamples = files.filter((file) => /(^|\/)\.env\.example$/i.test(file.path));
  const sourceFiles = textFiles.filter((file) => /\.(js|jsx|ts|tsx|py)$/i.test(file.path));
  const screenshots = files.filter((file) => /screenshots?\/.+\.(png|jpe?g|webp|gif)$/i.test(file.path));
  const localhostFiles = sourceFiles.filter((file) => /localhost|127\.0\.0\.1|0\.0\.0\.0/i.test(file.content));
  const secretHits = findSecretHits(textFiles);
  const frontendSecretHits = secretHits.filter((hit) => /(^|\/)(src|frontend|client|app)\//i.test(hit.file) && /\.(js|jsx|ts|tsx|env)$/i.test(hit.file));
  const largeComponents = sourceFiles.filter((file) => /\.(jsx|tsx|js|ts)$/i.test(file.path) && lineCount(file.content) > 450);
  const componentsDir = files.some((file) => /(^|\/)(components|src\/components)\//i.test(file.path));
  const docsDir = files.some((file) => /(^|\/)(docs|documentation)\//i.test(file.path));

  return {
    fileCount: files.length,
    textFileCount: textFiles.length,
    packageFiles,
    hasReadme: Boolean(readme),
    readmeQuality: readme ? analyzeReadme(readme.content) : null,
    envFiles: envFiles.map((file) => file.path),
    envExamples: envExamples.map((file) => file.path),
    secretHits,
    frontendSecretHits,
    localhostFiles: localhostFiles.map((file) => file.path).slice(0, 8),
    screenshots: screenshots.map((file) => file.path),
    largeComponents: largeComponents.map((file) => ({ file: file.path, lines: lineCount(file.content) })).slice(0, 8),
    repoSignals: extractRepoSignals(textFiles, packageFiles, readme),
    hasComponentsDir: componentsDir,
    hasDocsDir: docsDir,
    hasStartScript: packageFiles.some((pkg) => Boolean(pkg.scripts?.start)),
    hasBuildScript: packageFiles.some((pkg) => Boolean(pkg.scripts?.build)),
    hasDevScript: packageFiles.some((pkg) => Boolean(pkg.scripts?.dev)),
  };
}

function extractRepoSignals(textFiles, packageFiles, readme) {
  const importantFiles = textFiles
    .filter((file) => isImportantFile(file.path))
    .map((file) => ({
      path: file.path,
      sample: cleanText(file.content).slice(0, 2500),
    }))
    .slice(0, 60);

  const sourceFiles = textFiles.filter((file) => /\.(jsx|tsx|js|ts|html|py|java|go|rb|php)$/i.test(file.path));
  const allPaths = textFiles.map((file) => file.path);
  const routeNames = unique(sourceFiles.flatMap((file) => extractRoutes(file.content))).slice(0, 30);
  const apiEndpoints = unique(sourceFiles.flatMap((file) => extractApiEndpoints(file.content))).slice(0, 40);
  const uiText = unique(sourceFiles.flatMap((file) => extractUiText(file.content))).slice(0, 80);
  const envVariables = unique(textFiles.flatMap((file) => extractEnvVariables(file))).slice(0, 60);
  const componentNames = unique(textFiles
    .filter((file) => /(^|\/)(src\/)?(pages|components)\//i.test(file.path) && /\.(jsx|tsx|js|ts)$/i.test(file.path))
    .map((file) => file.path.split('/').pop().replace(/\.(jsx|tsx|js|ts)$/i, '')))
    .slice(0, 50);
  const pageNames = unique(textFiles
    .filter((file) => /(^|\/)(src\/)?(app|pages)\//i.test(file.path) && /\.(jsx|tsx|js|ts|mdx)$/i.test(file.path))
    .map((file) => file.path.split('/').pop().replace(/\.(jsx|tsx|js|ts|mdx)$/i, '')))
    .slice(0, 50);

  return {
    readmeTitle: readme ? extractReadmeTitle(readme.content) : '',
    readmeSummary: readme ? cleanText(readme.content).slice(0, 1200) : '',
    dependencies: unique(packageFiles.flatMap((pkg) => pkg.dependencies || [])).slice(0, 60),
    devDependencies: unique(packageFiles.flatMap((pkg) => pkg.devDependencies || [])).slice(0, 40),
    scripts: packageFiles.flatMap((pkg) => Object.entries(pkg.scripts || {}).map(([name, command]) => ({ name, command }))).slice(0, 40),
    packageBins: unique(packageFiles.flatMap((pkg) => pkg.bin || [])).slice(0, 20),
    folderStructure: buildFolderStructure(allPaths),
    frameworks: detectFrameworks(textFiles, packageFiles),
    routeNames,
    apiEndpoints,
    pageNames,
    uiText,
    componentNames,
    envVariables,
    databaseIndicators: detectByPatterns(textFiles, [
      ['MongoDB', /mongodb|mongoose|mongo_uri/i],
      ['PostgreSQL', /postgres|pg_|database_url|prisma/i],
      ['MySQL', /mysql/i],
      ['SQLite', /sqlite/i],
      ['DynamoDB', /dynamodb/i],
      ['Firebase', /firebase|firestore/i],
      ['Redis', /redis/i],
    ]),
    authenticationIndicators: detectByPatterns(textFiles, [
      ['JWT', /jwt|jsonwebtoken/i],
      ['OAuth', /oauth|passport/i],
      ['Clerk', /clerk/i],
      ['Cognito', /cognito/i],
      ['NextAuth', /next-auth|auth\.js/i],
    ]),
    deploymentIndicators: detectDeployment(textFiles),
    testingIndicators: detectByPatterns(textFiles, [
      ['Vitest', /vitest/i],
      ['Jest', /jest/i],
      ['Playwright', /playwright/i],
      ['Cypress', /cypress/i],
      ['Pytest', /pytest/i],
      ['JUnit', /junit/i],
    ]),
    dockerIndicators: textFiles.some((file) => /(^|\/)(dockerfile|docker-compose\.ya?ml)$/i.test(file.path)),
    ciIndicators: textFiles.filter((file) => /(^|\/)\.github\/workflows\/|(^|\/)(gitlab-ci|circleci|azure-pipelines)/i.test(file.path)).map((file) => file.path),
    importantFiles,
    keywords: extractKeywords([
      readme?.content || '',
      uiText.join(' '),
      routeNames.join(' '),
      apiEndpoints.join(' '),
      componentNames.join(' '),
    ].join(' ')),
  };
}

function isTextFile(path) {
  return TEXT_FILE_PATTERN.test(path) || /(^|\/)(dockerfile|docker-compose\.ya?ml|vite\.config\.[jt]s|next\.config\.[jt]s|requirements\.txt|pyproject\.toml|pom\.xml|build\.gradle)$/i.test(path);
}

function isImportantFile(path) {
  return [
    /(^|\/)readme\.md$/i,
    /(^|\/)package\.json$/i,
    /(^|\/)(vite|next)\.config\.[jt]s$/i,
    /(^|\/)tsconfig\.json$/i,
    /(^|\/)(requirements\.txt|pyproject\.toml|pom\.xml|build\.gradle)$/i,
    /(^|\/)(dockerfile|docker-compose\.ya?ml)$/i,
    /(^|\/)src\/(app|main)\.(jsx|tsx)$/i,
    /(^|\/)(src|app|pages|components|routes|controllers|server|api|public|docs)\/.+/i,
    /(^|\/)server\/index\.js$/i,
    /(^|\/)\.env\.example$/i,
    /(^|\/)public\/index\.html$/i,
  ].some((pattern) => pattern.test(path));
}

function extractRoutes(content) {
  return [
    ...content.matchAll(/<Route[^>]+path=["'`]([^"'`]+)["'`]/g),
    ...content.matchAll(/\b(?:path|href|to):\s*["'`]([^"'`]+)["'`]/g),
    ...content.matchAll(/\b(?:href|to)=["'`]([^"'`]+)["'`]/g),
  ].map((match) => match[1]).filter((item) => item && item.length <= 80 && !/\$\{/.test(item));
}

function extractApiEndpoints(content) {
  return [
    ...content.matchAll(/\b(?:app|router)\.(get|post|put|patch|delete)\(["'`]([^"'`]+)["'`]/g),
    ...content.matchAll(/@(Get|Post|Put|Patch|Delete)Mapping\(["'`]([^"'`]+)["'`]\)/g),
    ...content.matchAll(/@app\.route\(["'`]([^"'`]+)["'`]/g),
    ...content.matchAll(/\bfetch\(["'`]([^"'`]+)["'`]/g),
    ...content.matchAll(/\baxios\.(get|post|put|patch|delete)\(["'`]([^"'`]+)["'`]/g),
  ].map((match) => (match[2] || match[1]).split('?')[0]).filter((item) => item && item.length <= 100 && !/\$\{/.test(item));
}

function extractEnvVariables(file) {
  const values = [];
  if (/(^|\/)\.env\.example$/i.test(file.path)) {
    values.push(...[...file.content.matchAll(/^([A-Z0-9_]+)\s*=/gim)].map((match) => match[1]));
  }
  values.push(...[...file.content.matchAll(/\bprocess\.env\.([A-Z0-9_]+)/g)].map((match) => match[1]));
  values.push(...[...file.content.matchAll(/\bimport\.meta\.env\.([A-Z0-9_]+)/g)].map((match) => match[1]));
  values.push(...[...file.content.matchAll(/\bos\.getenv\(["'`]([A-Z0-9_]+)["'`]\)/g)].map((match) => match[1]));
  return values;
}

function buildFolderStructure(paths) {
  const folders = unique(paths.flatMap((path) => {
    const parts = path.split('/').slice(0, -1);
    return parts.map((_, index) => parts.slice(0, index + 1).join('/'));
  }));
  return folders
    .filter((folder) => folder && folder.split('/').length <= 3)
    .sort((a, b) => a.localeCompare(b))
    .slice(0, 80);
}

function detectFrameworks(textFiles, packageFiles) {
  const deps = new Set(packageFiles.flatMap((pkg) => [...(pkg.dependencies || []), ...(pkg.devDependencies || [])]).map((item) => item.toLowerCase()));
  const paths = textFiles.map((file) => file.path.toLowerCase()).join(' ');
  const frameworks = [];
  if (deps.has('react')) frameworks.push('React');
  if (deps.has('vite') || /vite\.config/.test(paths)) frameworks.push('Vite');
  if (deps.has('next') || /next\.config/.test(paths)) frameworks.push('Next.js');
  if (deps.has('express')) frameworks.push('Express');
  if (deps.has('tailwindcss')) frameworks.push('Tailwind CSS');
  if (deps.has('react-native')) frameworks.push('React Native');
  if (/requirements\.txt|pyproject\.toml/.test(paths)) frameworks.push('Python');
  if (/pom\.xml/.test(paths)) frameworks.push('Maven/Java');
  if (/build\.gradle/.test(paths)) frameworks.push('Gradle');
  return unique(frameworks);
}

function detectDeployment(textFiles) {
  const indicators = [];
  const pathText = textFiles.map((file) => file.path).join(' ');
  if (/dockerfile|docker-compose/i.test(pathText)) indicators.push('Docker');
  if (/amplify\.yml/i.test(pathText)) indicators.push('AWS Amplify');
  if (/apprunner\.yaml/i.test(pathText)) indicators.push('AWS App Runner');
  if (/vercel\.json/i.test(pathText)) indicators.push('Vercel');
  if (/netlify\.toml/i.test(pathText)) indicators.push('Netlify');
  if (/render\.ya?ml/i.test(pathText)) indicators.push('Render');
  return unique(indicators);
}

function detectByPatterns(textFiles, patterns) {
  const text = textFiles.map((file) => `${file.path}\n${file.content.slice(0, 3000)}`).join('\n');
  return patterns.filter(([, pattern]) => pattern.test(text)).map(([label]) => label);
}

function extractUiText(content) {
  const tagText = [...content.matchAll(/>([^<>{}\n][^<>{}]{3,90})</g)].map((match) => match[1]);
  const ariaText = [...content.matchAll(/\b(?:aria-label|placeholder|title)=["'`]([^"'`]{3,90})["'`]/g)].map((match) => match[1]);
  return [...tagText, ...ariaText].map(cleanText).filter((item) => /[A-Za-z]{3}/.test(item));
}

function extractReadmeTitle(content) {
  return content.match(/^#\s+(.+)$/m)?.[1]?.trim() || '';
}

function extractKeywords(text) {
  const stop = new Set(['the', 'and', 'for', 'with', 'this', 'that', 'from', 'your', 'project', 'using', 'into', 'app', 'page']);
  const counts = {};
  for (const word of cleanText(text).toLowerCase().match(/[a-z][a-z0-9-]{3,}/g) || []) {
    if (!stop.has(word)) counts[word] = (counts[word] || 0) + 1;
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 35).map(([word]) => word);
}

function unique(items) {
  return Array.from(new Set(items.filter(Boolean)));
}

function cleanText(text = '') {
  return text.replace(/\s+/g, ' ').replace(/[{}[\]<>`]/g, '').trim();
}

export function buildIssuesFromScan(scan) {
  if (!scan) return [];

  const issues = [];
  const add = (severity, category, file, problem, why, fix) => issues.push({ severity, category, file, problem, why, fix });

  if (scan.frontendSecretHits.length) {
    const hit = scan.frontendSecretHits[0];
    add(
      'Critical',
      'Security',
      hit.file,
      'Possible API key or secret detected in frontend-accessible files.',
      'Secrets inside browser bundles can be viewed, copied, and abused by anyone inspecting the app.',
      'Move provider calls to backend routes and read secrets from server-side environment variables.',
    );
  } else if (scan.secretHits.length) {
    const hit = scan.secretHits[0];
    add(
      'High',
      'Security',
      hit.file,
      'Possible secret-like value detected in project files.',
      'Credentials should not be committed to repositories or shared inside project ZIPs.',
      'Rotate the value if real, remove it from source control, and load it through environment variables.',
    );
  }

  if (scan.envFiles.length) {
    add(
      'Critical',
      'Security',
      scan.envFiles[0],
      '.env file is included in the uploaded project.',
      'Environment files often contain real credentials, database URLs, or provider API keys.',
      'Remove .env from the repo, add it to .gitignore, and keep only .env.example.',
    );
  }

  if (!scan.envExamples.length) {
    add(
      'High',
      'Docs',
      '.env.example',
      'No .env.example file found.',
      'Reviewers need to know which environment variables are required without seeing real secrets.',
      'Create .env.example with safe placeholder values for every required variable.',
    );
  }

  if (scan.localhostFiles.length) {
    add(
      'Critical',
      'Deployment',
      scan.localhostFiles[0],
      'Localhost URL found in source files.',
      'Production deployments cannot call services running on your local machine.',
      'Replace localhost URLs with environment variables such as VITE_API_URL or API_BASE_URL.',
    );
  }

  if (!scan.hasStartScript) {
    add(
      'High',
      'Deployment',
      'package.json',
      'No production start script found.',
      'Many deployment platforms require a clear start command to run the app after build.',
      'Add a production start script that matches your runtime, such as "start": "node server.js".',
    );
  }

  if (!scan.hasBuildScript) {
    add(
      'High',
      'Deployment',
      'package.json',
      'No build script found.',
      'A missing build command makes deployment and CI validation harder.',
      'Add a build script such as "build": "vite build" or the equivalent for your stack.',
    );
  }

  if (!scan.hasReadme) {
    add(
      'High',
      'Docs',
      'README.md',
      'README file is missing.',
      'A portfolio project needs a clear GitHub landing page for recruiters and reviewers.',
      'Add README.md with overview, features, setup, env variables, screenshots, and deployment steps.',
    );
  } else {
    for (const missing of scan.readmeQuality.missing) {
      add(
        missing.severity,
        'Docs',
        'README.md',
        missing.problem,
        missing.why,
        missing.fix,
      );
    }
  }

  if (!scan.screenshots.length) {
    add(
      'Medium',
      'Docs',
      'public/screenshots',
      'No project screenshots found.',
      'Screenshots help recruiters quickly understand what the project does before reading the code.',
      'Add screenshots for the main workflow and reference them in the README.',
    );
  }

  if (scan.largeComponents.length) {
    const item = scan.largeComponents[0];
    add(
      'Medium',
      'Structure',
      item.file,
      `Large source file detected (${item.lines} lines).`,
      'Very large components are harder to review, test, and explain during interviews.',
      'Split this file into smaller components, hooks, or service modules.',
    );
  }

  if (!scan.hasComponentsDir) {
    add(
      'Suggestion',
      'Structure',
      'src/components',
      'No clear components directory found.',
      'A predictable component structure makes frontend projects easier to inspect.',
      'Group reusable UI into a components directory and keep pages/routes focused.',
    );
  }

  if (!scan.hasDocsDir) {
    add(
      'Suggestion',
      'Docs',
      'docs/',
      'No docs folder found for deployment or architecture notes.',
      'Short docs make the project easier to defend in viva or interview rounds.',
      'Add docs/deployment.md or docs/architecture.md with concise notes.',
    );
  }

  return issues;
}

function parsePackageFiles(textFiles) {
  return textFiles
    .filter((file) => /(^|\/)package\.json$/i.test(file.path))
    .map((file) => {
      try {
        const pkg = JSON.parse(file.content);
        return {
          path: file.path,
          scripts: pkg.scripts || {},
          bin: typeof pkg.bin === 'string' ? [pkg.bin] : Object.keys(pkg.bin || {}),
          dependencies: Object.keys(pkg.dependencies || {}),
          devDependencies: Object.keys(pkg.devDependencies || {}),
        };
      } catch {
        return { path: file.path, scripts: {}, bin: [], dependencies: [], devDependencies: [], invalid: true };
      }
    });
}

function analyzeReadme(content) {
  const text = content.toLowerCase();
  const missing = [];
  if (!/install|setup|getting started/.test(text)) {
    missing.push({
      severity: 'High',
      problem: 'README is missing setup instructions.',
      why: 'Reviewers need exact steps to run the project locally.',
      fix: 'Add install and run commands with prerequisites.',
    });
  }
  if (!/env|environment|\.env/.test(text)) {
    missing.push({
      severity: 'High',
      problem: 'README does not document environment variables.',
      why: 'Missing env docs block deployment and make the app hard to reproduce.',
      fix: 'Add an Environment Variables section that matches .env.example.',
    });
  }
  if (!/deploy|vercel|render|railway|netlify|aws|amplify/.test(text)) {
    missing.push({
      severity: 'Medium',
      problem: 'README does not explain deployment.',
      why: 'A deployable portfolio project should show how it runs beyond localhost.',
      fix: 'Add deployment steps and production environment notes.',
    });
  }
  if (!/!\[|screenshot|image/.test(text)) {
    missing.push({
      severity: 'Medium',
      problem: 'README has no screenshots or visual preview.',
      why: 'Visual proof helps recruiters understand the project quickly.',
      fix: 'Add screenshots for the main screens and workflow.',
    });
  }
  return { missing };
}

function findSecretHits(textFiles) {
  const hits = [];
  for (const file of textFiles) {
    if (/\.example$/i.test(file.path)) continue;
    for (const pattern of SECRET_PATTERNS) {
      if (pattern.test(file.content)) {
        hits.push({ file: file.path, pattern: String(pattern) });
        break;
      }
    }
  }
  return hits.slice(0, 12);
}

function lineCount(content) {
  return content.split(/\r?\n/).length;
}

function normalize(path) {
  return path.replace(/\\/g, '/');
}
