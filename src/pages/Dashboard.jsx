import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  ExternalLink,
  FileText,
  GraduationCap,
  ListChecks,
  Rocket,
  ShieldAlert,
  Target,
  Wrench,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PageShell from '../components/PageShell.jsx';
import { getAudits } from '../data/auditEngine.js';
import { fetchAudits } from '../lib/api.js';
import { estimateFixTime, estimateIssueTime } from '../utils/fixTime.js';

const checklist = [
  'No exposed secrets',
  'Live demo link added',
  'README has setup steps',
  'Screenshots included',
  'Resume bullets generated',
  'Production start command works',
];

const toneStyles = {
  cyan: 'from-cyan-400/15 to-cyan-400/5 text-cyan-100',
  emerald: 'from-emerald-400/15 to-emerald-400/5 text-emerald-100',
  rose: 'from-rose-400/15 to-rose-400/5 text-rose-100',
  violet: 'from-violet-400/15 to-violet-400/5 text-violet-100',
};

const severityStyles = {
  Critical: 'border-rose-300/25 bg-rose-400/10 text-rose-100',
  Important: 'border-amber-300/25 bg-amber-400/10 text-amber-100',
  'Quick Win': 'border-cyan-300/25 bg-cyan-400/10 text-cyan-100',
};

export default function Dashboard() {
  const [audits, setAudits] = useState(() => getAudits());

  useEffect(() => {
    fetchAudits()
      .then(setAudits)
      .catch(() => setAudits(getAudits()));
  }, []);

  const data = useMemo(() => buildDashboardData(audits), [audits]);

  return (
    <PageShell>
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.22em] text-cyan-200">Dashboard</p>
          <h1 className="mt-3 text-4xl font-black text-white sm:text-5xl">Welcome back, builder.</h1>
          <p className="mt-3 max-w-2xl text-slate-400">Track your portfolio readiness and continue fixing project blockers.</p>
        </div>
        <Link to="/new-audit" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 font-black text-slate-950 transition hover:bg-cyan-100">
          New Audit <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      {data.latest ? <ContinueCard latest={data.latest} /> : <EmptyStart />}

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {data.health.map((item) => <HealthCard key={item.label} {...item} />)}
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-200">Fix Queue Across Projects</p>
              <h2 className="mt-2 text-2xl font-black text-white">Highest leverage actions</h2>
            </div>
            <Target className="h-6 w-6 text-cyan-200" />
          </div>
          <div className="mt-5 space-y-3">
            {data.fixQueue.length ? data.fixQueue.map((fix) => <FixQueueRow key={`${fix.project}-${fix.title}`} fix={fix} />) : <EmptyFuture label="No fixes queued yet. Run an audit to generate project-specific actions." />}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-200">Portfolio Launch Checklist</p>
              <h2 className="mt-2 text-2xl font-black text-white">Share-ready basics</h2>
            </div>
            <ListChecks className="h-6 w-6 text-emerald-200" />
          </div>
          <div className="mt-5 space-y-3">
            {checklist.map((item) => (
              <label key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-3 text-sm font-bold text-slate-300">
                <input type="checkbox" checked={data.checklistStatus[item]} readOnly className="h-4 w-4 accent-emerald-300" />
                {item}
              </label>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-200">Best Projects for Resume</p>
              <h2 className="mt-2 text-2xl font-black text-white">Ranking</h2>
            </div>
            <GraduationCap className="h-6 w-6 text-violet-200" />
          </div>
          <div className="mt-5 space-y-3">
            {data.resumeProjects.length ? data.resumeProjects.map((project, index) => (
              <div key={project.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Rank #{index + 1}</p>
                    <h3 className="mt-2 font-black text-white">{project.project}</h3>
                    <p className="mt-1 text-sm text-slate-400">{project.note}</p>
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-sm font-black ${riskClass(project.risk)}`}>{project.score}/100</span>
                </div>
              </div>
            )) : <EmptyFuture label="Future projects will appear here after more audits." />}
          </div>
        </div>

        <RecentAuditsTable audits={data.recentAudits} />
      </section>
    </PageShell>
  );
}

function ContinueCard({ latest }) {
  return (
    <section className="glass-card mt-8 rounded-2xl p-6">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm font-black text-cyan-100">
            <Wrench className="h-4 w-4" />
            Continue Where You Left Off
          </div>
          <h2 className="mt-5 text-3xl font-black text-white">{latest.project}</h2>
          <p className="mt-2 text-slate-400">Next best fix: {latest.nextFix}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-4 xl:min-w-[620px]">
          <MiniMetric label="Current score" value={latest.score} />
          <MiniMetric label="Projected" value={latest.projected} />
          <MiniMetric label="Critical blockers" value={latest.criticalBlockers} tone="rose" />
          <MiniMetric label="Fix time" value={latest.estimatedFixTime} tone="amber" />
        </div>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link to={latest.reportHref} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-100">
          Continue Fixing <ArrowRight className="h-4 w-4" />
        </Link>
        <Link to={latest.reportHref} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black text-white transition hover:bg-white/10">
          Open Report <ExternalLink className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

function EmptyStart() {
  return (
    <section className="glass-card mt-8 rounded-2xl p-8 text-center">
      <Rocket className="mx-auto h-10 w-10 text-cyan-200" />
      <h2 className="mt-4 text-3xl font-black text-white">No audits yet.</h2>
      <p className="mx-auto mt-2 max-w-xl text-slate-400">Upload a project ZIP to create a real portfolio readiness dashboard.</p>
      <Link to="/new-audit" className="mt-6 inline-flex rounded-2xl bg-white px-6 py-3 font-black text-slate-950">Start New Audit</Link>
    </section>
  );
}

function MiniMetric({ label, value, tone = 'cyan' }) {
  const style = tone === 'rose' ? 'text-rose-100 bg-rose-400/10 border-rose-300/20' : tone === 'amber' ? 'text-amber-100 bg-amber-400/10 border-amber-300/20' : 'text-cyan-100 bg-cyan-400/10 border-cyan-300/20';
  return (
    <div className={`rounded-2xl border p-4 ${style}`}>
      <p className="text-xs font-black uppercase tracking-[0.14em] opacity-75">{label}</p>
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
    </div>
  );
}

function HealthCard({ label, value, icon: Icon, tone }) {
  return (
    <div className={`glass-card rounded-2xl bg-gradient-to-br p-5 ${toneStyles[tone]}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-slate-400">{label}</p>
          <p className="mt-3 text-3xl font-black text-white">{value}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function FixQueueRow({ fix }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-cyan-300/20 hover:bg-white/[0.055] md:flex-row md:items-center md:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-black ${severityStyles[fix.severity]}`}>{fix.severity}</span>
        <div className="min-w-0">
          <p className="font-black text-white">{fix.title}</p>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-400">
            <span>{fix.project}</span>
            <span className="text-slate-600">-</span>
            <Clock3 className="h-3.5 w-3.5" />
            <span>{fix.time}</span>
          </p>
        </div>
      </div>
      <Link to={fix.reportHref} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-black text-white transition hover:bg-white/10">
        View Fix <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

function RecentAuditsTable({ audits }) {
  return (
    <section className="glass-card overflow-hidden rounded-2xl">
      <div className="border-b border-white/10 p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-200">Recent Audits</p>
            <h2 className="mt-2 text-2xl font-black text-white">Saved project checks</h2>
          </div>
          <ClipboardCheck className="h-6 w-6 text-cyan-200" />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="text-slate-500">
            <tr>
              {['Project', 'Score', 'Risk', 'Date', 'Status', 'Action'].map((head) => <th key={head} className="px-5 py-4 font-bold">{head}</th>)}
            </tr>
          </thead>
          <tbody>
            {audits.length ? audits.map((row) => (
              <tr key={row.id} className="border-t border-white/10">
                <td className="px-5 py-4 font-black text-white">{row.project}</td>
                <td className="px-5 py-4 text-cyan-200">{row.score}/100</td>
                <td className="px-5 py-4">
                  <span className={`rounded-full border px-3 py-1 text-xs font-black ${riskClass(row.risk)}`}>{row.risk}</span>
                </td>
                <td className="px-5 py-4 text-slate-400">{row.date}</td>
                <td className="px-5 py-4 text-slate-300">{row.status}</td>
                <td className="px-5 py-4">
                  <Link to={row.action} className="text-sm font-black text-cyan-200 hover:text-cyan-100">Open</Link>
                </td>
              </tr>
            )) : (
              <tr className="border-t border-white/10">
                <td colSpan="6" className="px-5 py-10 text-center text-slate-400">No saved audits yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function EmptyFuture({ label }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-4 text-center text-sm text-slate-500">
      {label}
    </div>
  );
}

function buildDashboardData(audits) {
  const normalized = audits.map(normalizeAudit);
  const latest = normalized[0] || null;
  const allIssues = normalized.flatMap((audit) => audit.issues.map((issue) => ({ ...issue, project: audit.name, reportHref: audit.reportHref })));
  const criticalProjects = normalized.filter((audit) => audit.risk === 'High').length;

  return {
    latest: latest ? {
      project: latest.name,
      score: latest.score,
      projected: latest.projected,
      criticalBlockers: latest.criticalIssues,
      nextFix: latest.nextFix,
      estimatedFixTime: latest.estimatedFixTime,
      reportHref: latest.reportHref,
    } : null,
    health: [
      { label: 'Projects audited', value: normalized.length, icon: FileText, tone: 'cyan' },
      { label: 'Ready to share', value: normalized.filter((audit) => audit.score >= 82 && audit.criticalIssues === 0).length, icon: Rocket, tone: 'emerald' },
      { label: 'High-risk projects', value: criticalProjects, icon: ShieldAlert, tone: 'rose' },
      { label: 'Issues fixed', value: 0, icon: CheckCircle2, tone: 'violet' },
    ],
    fixQueue: allIssues
      .sort((a, b) => severityRank(a.severity) - severityRank(b.severity))
      .slice(0, 8)
      .map((issue) => ({
        severity: queueSeverity(issue.severity),
        title: issue.fix || issue.problem,
        project: issue.project,
        time: estimateIssueTime(issue),
        reportHref: issue.reportHref,
      })),
    checklistStatus: buildChecklistStatus(normalized),
    resumeProjects: normalized
      .slice()
      .sort((a, b) => b.resumeScore - a.resumeScore)
      .slice(0, 3)
      .map((audit) => ({ id: audit.id, project: audit.name, score: audit.score, risk: audit.risk, note: resumeNote(audit) })),
    recentAudits: normalized.map((audit) => ({
      id: audit.id,
      project: audit.name,
      score: audit.score,
      risk: audit.risk,
      date: audit.date,
      status: audit.status,
      action: audit.reportHref,
    })),
  };
}

function normalizeAudit(audit) {
  const scoreByLabel = Object.fromEntries((audit.scores || []).map((score) => [score.label, score]));
  const overall = scoreByLabel['Overall Project Readiness']?.value || 0;
  const securityScore = scoreByLabel['Security Risk']?.value || 0;
  const criticalIssues = audit.issues.filter((issue) => issue.severity === 'Critical').length;
  const highIssues = audit.issues.filter((issue) => issue.severity === 'High').length;
  const mediumIssues = audit.issues.filter((issue) => issue.severity === 'Medium').length;
  const projected = audit.projectedScore ?? calculateProjectedScore(overall, audit.issues);
  const sortedIssues = audit.issues.slice().sort((a, b) => severityRank(a.severity) - severityRank(b.severity));
  const nextIssue = sortedIssues[0];

  return {
    id: audit.id,
    name: audit.name,
    score: overall,
    projected,
    criticalIssues,
    risk: riskLabel(securityScore, criticalIssues),
    status: audit.status,
    date: audit.updatedAt,
    issues: audit.issues,
    reportHref: `/report/${audit.id}`,
    nextFix: nextIssue?.fix || nextIssue?.problem || 'No open blockers',
    nextFixTime: nextIssue ? estimateIssueTime(nextIssue) : '0 min',
    estimatedFixTime: estimateFixTime(audit.issues || []),
    resumeScore: scoreByLabel['Resume Readiness']?.value || overall,
  };
}

function buildChecklistStatus(audits) {
  const latest = audits[0];
  if (!latest) return Object.fromEntries(checklist.map((item) => [item, false]));
  const text = latest.issues.map((issue) => `${issue.problem} ${issue.file}`).join(' ').toLowerCase();
  return {
    'No exposed secrets': !/secret|api key|\.env/.test(text),
    'Live demo link added': false,
    'README has setup steps': !/readme is missing setup|setup instructions/.test(text),
    'Screenshots included': !/screenshots/.test(text),
    'Resume bullets generated': true,
    'Production start command works': !/start script|production start/.test(text),
  };
}

function severityRank(severity) {
  return { Critical: 0, High: 1, Medium: 2, Suggestion: 3 }[severity] ?? 4;
}

function queueSeverity(severity) {
  if (severity === 'Critical') return 'Critical';
  if (severity === 'High') return 'Important';
  return 'Quick Win';
}

function riskLabel(securityScore, criticalIssues) {
  if (criticalIssues > 0 || securityScore < 45) return 'High';
  if (securityScore < 70) return 'Medium';
  return 'Low';
}

function riskClass(risk) {
  if (risk === 'High') return 'border-rose-300/20 bg-rose-400/10 text-rose-100';
  if (risk === 'Medium') return 'border-amber-300/20 bg-amber-400/10 text-amber-100';
  return 'border-emerald-300/20 bg-emerald-400/10 text-emerald-100';
}

function resumeNote(audit) {
  if (audit.risk === 'High') return 'Risky but strong idea';
  if (audit.score >= 82) return 'Ready to highlight on resume';
  return 'Good candidate after polish';
}

function calculateProjectedScore(overall, issues) {
  const fixValue = { Critical: 7, High: 5, Medium: 3, Suggestion: 1 };
  const improvement = issues
    .slice()
    .sort((a, b) => (fixValue[b.severity] || 0) - (fixValue[a.severity] || 0))
    .slice(0, 5)
    .reduce((sum, issue) => sum + (fixValue[issue.severity] || 1), 0);
  return Math.min(96, Math.max(overall, overall + improvement));
}
