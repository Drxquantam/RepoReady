import { Link, useParams } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  Download,
  FileText,
  GraduationCap,
  ListChecks,
  ShieldAlert,
  Sparkles,
  Zap,
} from 'lucide-react';
import PageShell from '../components/PageShell.jsx';
import { downloadText, getAudit } from '../data/auditEngine.js';
import { fetchAudit } from '../lib/api.js';
import { estimateFixTime } from '../utils/fixTime.js';

const severityStyles = {
  Critical: 'border-rose-300/30 bg-rose-400/10 text-rose-100',
  High: 'border-amber-300/30 bg-amber-400/10 text-amber-100',
  Medium: 'border-cyan-300/30 bg-cyan-400/10 text-cyan-100',
  Suggestion: 'border-violet-300/30 bg-violet-400/10 text-violet-100',
};

const categoryStyles = {
  Security: 'text-rose-100',
  Deployment: 'text-amber-100',
  Docs: 'text-cyan-100',
  Structure: 'text-violet-100',
};

const checklistItems = [
  'Remove .env from repo',
  'Add .env.example',
  'Replace localhost URLs with environment variables',
  'Add setup instructions in README',
  'Add screenshots',
  'Add deployment steps',
  'Split very large files',
];

export default function Report() {
  const { id = 'latest' } = useParams();
  const [audit, setAudit] = useState(() => getAudit(id));
  const [fixed, setFixed] = useState([]);
  const [checked, setChecked] = useState([]);

  useEffect(() => {
    fetchAudit(id)
      .then(setAudit)
      .catch(() => setAudit(getAudit(id)));
  }, [id]);

  const issues = useMemo(() => prioritizeIssues(audit?.issues || []), [audit]);

  if (!audit) {
    return (
      <PageShell>
        <div className="glass-card rounded-2xl p-8 text-center">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-cyan-200">No checklist yet</p>
          <h1 className="mt-4 text-4xl font-black text-white">Run an audit to get your fix checklist.</h1>
          <p className="mx-auto mt-3 max-w-xl text-slate-400">RepoReady will turn the audit into a simple repair list.</p>
          <Link to="/new-audit" className="mt-6 inline-flex rounded-2xl bg-white px-6 py-3 font-black text-slate-950">Start New Audit</Link>
        </div>
      </PageShell>
    );
  }

  const openIssues = issues.filter((issue) => !fixed.includes(issueKey(issue)));
  const criticalIssues = openIssues.filter((issue) => issue.severity === 'Critical');
  const quickWins = getQuickWins(openIssues);
  const score = scoreValue(audit, 'Overall Project Readiness');
  const projected = audit.projectedScore || calculateProjectedScore(score, openIssues);
  const status = statusFor(score);
  const fixTime = estimateFixTime(openIssues);
  const fixList = buildFixList(audit, openIssues, checklistItems);

  return (
    <PageShell>
      <TopSummary audit={audit} score={score} projected={projected} status={status} fixTime={fixTime} />

      <div className="mt-6 grid gap-5 xl:grid-cols-[1fr_0.45fr]">
        <main className="space-y-5">
          <CriticalFirst issues={criticalIssues} onCopy={copyText} />
          <PriorityFixes issues={openIssues} fixed={fixed} setFixed={setFixed} />
        </main>
        <aside className="space-y-5">
          <FixChecklist checked={checked} setChecked={setChecked} />
          <QuickWins issues={quickWins} />
          <ActionButtons audit={audit} fixList={fixList} />
        </aside>
      </div>
    </PageShell>
  );
}

function TopSummary({ audit, score, projected, status, fixTime }) {
  return (
    <section className="glass-card rounded-2xl p-5 sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.22em] text-cyan-200">Fix Checklist</p>
          <h1 className="mt-3 text-3xl font-black text-white sm:text-5xl">{audit.name}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
            Here are the mistakes. Fix these in order, then rerun the audit.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[520px]">
          <SummaryTile label="Score" value={`${score}/100`} tone="cyan" />
          <SummaryTile label="Status" value={status} tone={status === 'Ready' ? 'emerald' : status === 'Almost Ready' ? 'amber' : 'rose'} />
          <SummaryTile label="Fix time" value={fixTime} tone="violet" />
          <SummaryTile label="After fixes" value={`${projected}/100`} tone="emerald" />
        </div>
      </div>
    </section>
  );
}

function SummaryTile({ label, value, tone }) {
  const tones = {
    cyan: 'border-cyan-300/20 bg-cyan-300/10',
    rose: 'border-rose-300/20 bg-rose-300/10',
    amber: 'border-amber-300/20 bg-amber-300/10',
    emerald: 'border-emerald-300/20 bg-emerald-300/10',
    violet: 'border-violet-300/20 bg-violet-300/10',
  };
  return (
    <div className={`rounded-2xl border p-4 ${tones[tone]}`}>
      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
    </div>
  );
}

function CriticalFirst({ issues, onCopy }) {
  return (
    <section className="glass-card rounded-2xl p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-rose-200">Critical First</p>
          <h2 className="mt-2 text-2xl font-black text-white">Fix dangerous issues before anything else</h2>
        </div>
        <ShieldAlert className="h-6 w-6 text-rose-200" />
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {issues.length ? issues.slice(0, 3).map((issue) => (
          <button
            key={issueKey(issue)}
            onClick={() => onCopy(simpleFix(issue))}
            className="rounded-2xl border border-white/10 bg-black/20 p-4 text-left transition hover:border-rose-300/30 hover:bg-rose-300/10"
          >
            <AlertTriangle className="h-5 w-5 text-rose-200" />
            <p className="mt-3 text-sm font-black text-white">{studentMistake(issue)}</p>
            <p className="mt-2 text-xs leading-5 text-slate-400">{issue.file}</p>
          </button>
        )) : (
          <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-4 md:col-span-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-200" />
            <p className="mt-3 text-sm font-black text-white">No critical issues detected.</p>
            <p className="mt-2 text-xs leading-5 text-slate-300">RepoReady did not find exposed secrets, uploaded `.env` files, or hardcoded localhost URLs in this scan.</p>
          </div>
        )}
      </div>
    </section>
  );
}

function PriorityFixes({ issues, fixed, setFixed }) {
  return (
    <section className="glass-card rounded-2xl p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-200">Priority Fixes</p>
          <h2 className="mt-2 text-2xl font-black text-white">Fix these in this order</h2>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-black text-slate-300">
          {issues.length} open
        </span>
      </div>
      <div className="mt-5 space-y-4">
        {issues.map((issue, index) => (
          <IssueFixCard
            key={issueKey(issue)}
            issue={issue}
            index={index}
            fixed={fixed.includes(issueKey(issue))}
            onFixed={() => setFixed((current) => current.includes(issueKey(issue)) ? current : [...current, issueKey(issue)])}
          />
        ))}
        {!issues.length && (
          <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-6 text-center">
            <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-200" />
            <p className="mt-3 text-xl font-black text-white">No open fixes left.</p>
          </div>
        )}
      </div>
    </section>
  );
}

function IssueFixCard({ issue, index, fixed, onFixed }) {
  const fix = simpleFix(issue);
  return (
    <article className={`rounded-2xl border p-4 transition ${fixed ? 'border-emerald-300/20 bg-emerald-300/10 opacity-70' : 'border-white/10 bg-white/5 hover:border-cyan-300/30 hover:bg-white/10'}`}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-xs font-black text-slate-300">#{index + 1}</span>
            <span className={`rounded-full border px-3 py-1 text-xs font-black ${severityStyles[issue.severity] || severityStyles.Suggestion}`}>{issue.severity}</span>
            <span className={`rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-black ${categoryStyles[issue.category] || 'text-slate-300'}`}>{categoryLabel(issue.category)}</span>
          </div>
          <p className="mt-3 text-xs font-bold text-slate-500">File: <code>{issue.file}</code></p>
          <h3 className="mt-3 text-xl font-black text-white">{studentMistake(issue)}</h3>
        </div>
        <button onClick={onFixed} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-black text-slate-950 transition hover:bg-emerald-100">
          <CheckCircle2 className="h-4 w-4" />
          Mark Fixed
        </button>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <MiniExplain title="Why this matters" text={studentWhy(issue)} />
        <MiniExplain title="Simple fix" text={fix} />
      </div>
      <button
        onClick={() => copyText(fix)}
        className="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-4 py-2 text-sm font-black text-white transition hover:bg-white/10"
      >
        <Copy className="h-4 w-4" />
        Copy Fix
      </button>
    </article>
  );
}

function MiniExplain({ title, text }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-300">{text}</p>
    </div>
  );
}

function FixChecklist({ checked, setChecked }) {
  return (
    <section className="glass-card rounded-2xl p-5">
      <div className="flex items-center gap-3">
        <ListChecks className="h-5 w-5 text-cyan-200" />
        <h2 className="text-xl font-black text-white">Fix Checklist</h2>
      </div>
      <div className="mt-4 space-y-2">
        {checklistItems.map((item) => {
          const done = checked.includes(item);
          return (
            <button
              key={item}
              onClick={() => setChecked((current) => done ? current.filter((value) => value !== item) : [...current, item])}
              className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left text-sm font-bold transition ${done ? 'border-emerald-300/20 bg-emerald-300/10 text-emerald-100' : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'}`}
            >
              <span className={`flex h-5 w-5 items-center justify-center rounded-md border ${done ? 'border-emerald-300 bg-emerald-300 text-slate-950' : 'border-white/20'}`}>
                {done && <CheckCircle2 className="h-3.5 w-3.5" />}
              </span>
              {item}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function QuickWins({ issues }) {
  return (
    <section className="glass-card rounded-2xl p-5">
      <div className="flex items-center gap-3">
        <Zap className="h-5 w-5 text-amber-200" />
        <h2 className="text-xl font-black text-white">Quick Wins</h2>
      </div>
      <div className="mt-4 space-y-3">
        {issues.map((issue) => (
          <div key={issueKey(issue)} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm font-black text-white">{studentMistake(issue)}</p>
            <p className="mt-2 text-xs leading-5 text-slate-400">{simpleFix(issue)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ActionButtons({ audit, fixList }) {
  const fileName = `${audit.name.replace(/\W+/g, '-').toLowerCase()}-fix-checklist.txt`;
  return (
    <section className="glass-card rounded-2xl p-5">
      <div className="flex items-center gap-3">
        <ClipboardCheck className="h-5 w-5 text-emerald-200" />
        <h2 className="text-xl font-black text-white">Actions</h2>
      </div>
      <div className="mt-4 grid gap-3">
        <Link to="/readme-generator" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-black text-slate-950">
          <FileText className="h-4 w-4" />
          Generate README
        </Link>
        <Link to="/resume-pack" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black text-white">
          <GraduationCap className="h-4 w-4" />
          Generate Resume Bullets
        </Link>
        <button onClick={() => copyText(fixList)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black text-white">
          <Copy className="h-4 w-4" />
          Copy Fix List
        </button>
        <button onClick={() => downloadText(fileName, fixList)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black text-white">
          <Download className="h-4 w-4" />
          Export Checklist
        </button>
      </div>
    </section>
  );
}

function prioritizeIssues(issues) {
  const weight = { Critical: 0, High: 1, Medium: 2, Suggestion: 3 };
  return issues.slice().sort((a, b) => (weight[a.severity] ?? 4) - (weight[b.severity] ?? 4));
}

function getQuickWins(issues) {
  const preferred = ['screenshot', '.env.example', 'setup instructions', 'readme', 'deployment'];
  return issues
    .filter((issue) => issue.severity !== 'Critical')
    .sort((a, b) => quickScore(a, preferred) - quickScore(b, preferred))
    .slice(0, 3);
}

function quickScore(issue, preferred) {
  const text = `${issue.problem} ${issue.fix} ${issue.file}`.toLowerCase();
  const match = preferred.findIndex((item) => text.includes(item));
  return match === -1 ? 99 : match;
}

function statusFor(score) {
  if (score >= 82) return 'Ready';
  if (score >= 68) return 'Almost Ready';
  return 'Needs Cleanup';
}

function scoreValue(audit, label) {
  return audit.scores?.find((score) => score.label === label)?.value || 0;
}

function calculateProjectedScore(overall, issues) {
  const fixValue = { Critical: 7, High: 5, Medium: 3, Suggestion: 1 };
  const improvement = issues.slice(0, 5).reduce((sum, issue) => sum + (fixValue[issue.severity] || 1), 0);
  return Math.min(96, Math.max(overall, overall + improvement));
}

function categoryLabel(category) {
  return category === 'Docs' ? 'README' : category;
}

function issueKey(issue) {
  return `${issue.severity}-${issue.file}-${issue.problem}`;
}

function studentMistake(issue) {
  const text = issue.problem.toLowerCase();
  if (text.includes('.env.example') || text.includes('environment variable template')) return 'Your project is missing a safe .env.example file.';
  if (text.includes('secret') || text.includes('api key')) return 'Your API key may be exposed in the project files.';
  if (text.includes('.env')) return 'Your .env file is included in the project.';
  if (text.includes('localhost')) return 'Your app still uses localhost in code.';
  if (text.includes('start script')) return 'Your project is missing a production start command.';
  if (text.includes('build script')) return 'Your project is missing a build command.';
  if (text.includes('readme') && text.includes('setup')) return 'Your README does not explain how to run the project.';
  if (text.includes('screenshot')) return 'Your README/project has no screenshots.';
  if (text.includes('large')) return 'One file is too large and should be split.';
  if (text.includes('components directory')) return 'Your reusable components are not organized clearly.';
  return issue.problem;
}

function studentWhy(issue) {
  const text = `${issue.problem} ${issue.why}`.toLowerCase();
  if (text.includes('secret') || text.includes('api key')) return 'Anyone can inspect the website or ZIP and steal the key.';
  if (text.includes('.env')) return 'That file can contain real keys, database URLs, or private settings.';
  if (text.includes('localhost')) return 'This will break after deployment because localhost only works on your laptop.';
  if (text.includes('start script') || text.includes('build script')) return 'Hosting platforms need clear commands to build and run your app.';
  if (text.includes('readme')) return 'Recruiters and teachers need simple steps to run and understand the project.';
  if (text.includes('screenshot')) return 'Screenshots help people understand the project quickly without running it.';
  if (text.includes('large')) return 'Huge files are hard to debug, explain, and review in interviews.';
  return issue.why;
}

function simpleFix(issue) {
  const text = `${issue.problem} ${issue.fix} ${issue.file}`.toLowerCase();
  if (text.includes('.env.example')) return 'Create .env.example with variable names only, like API_KEY=replace_me.';
  if (text.includes('secret') || text.includes('api key')) return 'Move the API call to the backend. Read the key from process.env and never expose it in React.';
  if (text.includes('.env') && !text.includes('example')) return 'Remove .env from git, add it to .gitignore, and create a safe .env.example file.';
  if (text.includes('localhost')) return 'Replace localhost URLs with environment variables such as VITE_API_URL or API_BASE_URL.';
  if (text.includes('start script')) return 'Add a start script in package.json that runs your production server.';
  if (text.includes('build script')) return 'Add a build script in package.json, for example npm run build.';
  if (text.includes('setup instructions')) return 'Add install, env, run, build, and deploy steps to README.md.';
  if (text.includes('screenshot')) return 'Add screenshots of the main screens and link them in README.md.';
  if (text.includes('large')) return 'Move repeated UI, API calls, and helper logic into smaller components or utility files.';
  return issue.fix;
}

function buildFixList(audit, issues, checklist) {
  return [
    `RepoReady Fix Checklist: ${audit.name}`,
    '',
    'Priority fixes:',
    ...issues.map((issue, index) => `${index + 1}. [${issue.severity}] ${studentMistake(issue)} (${issue.file}) - ${simpleFix(issue)}`),
    '',
    'Checklist:',
    ...checklist.map((item) => `- [ ] ${item}`),
  ].join('\n');
}

function copyText(text) {
  navigator.clipboard.writeText(text);
}
