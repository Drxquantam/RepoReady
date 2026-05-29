import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Copy,
  Eye,
  FileText,
  Github,
  GraduationCap,
  Rocket,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import FeatureCard from '../components/FeatureCard.jsx';
import PageShell from '../components/PageShell.jsx';
import PricingCard from '../components/PricingCard.jsx';
import ProgressBar from '../components/ProgressBar.jsx';
import TopNav from '../components/TopNav.jsx';
import { features } from '../data/appContent.js';

const trust = ['GitHub Ready', 'Deployment Safe', 'Resume Worthy', 'Student Friendly'];
const auditTabs = [
  { label: 'Overview', icon: TrendingUp },
  { label: 'GitHub', icon: Github },
  { label: 'Security', icon: ShieldAlert },
  { label: 'Deployment', icon: Rocket },
  { label: 'Resume', icon: GraduationCap },
];

const previewMetrics = [
  {
    label: 'GitHub Readiness',
    value: 84,
    accent: 'cyan',
    reason: 'README found, but missing license and contribution guide.',
  },
  {
    label: 'Deployment',
    value: 72,
    accent: 'amber',
    reason: 'Build script exists, but production env setup needs clarity.',
  },
  {
    label: 'Resume Value',
    value: 88,
    accent: 'emerald',
    reason: 'Strong project idea with clear problem and measurable outputs.',
  },
  {
    label: 'Docs Quality',
    value: 76,
    accent: 'violet',
    reason: 'Setup flow is close, but screenshots and env guide are thin.',
  },
];

const donutLegend = [
  { name: 'GitHub', value: 84, color: '#22d3ee' },
  { name: 'Deployment', value: 72, color: '#f59e0b' },
  { name: 'Security', value: 64, color: '#fb7185' },
  { name: 'Resume', value: 88, color: '#10b981' },
  { name: 'Docs', value: 76, color: '#8b5cf6' },
];

const recommendations = [
  {
    label: 'Critical',
    title: 'Move secrets to backend .env',
    reason: 'API keys should not be exposed in frontend bundles.',
    fix: 'Move secrets to backend and use environment variables.',
    command: 'git rm --cached .env && add server-side env variables',
  },
  {
    label: 'Important',
    title: 'Replace localhost API URLs',
    reason: 'Production users cannot call services running on your machine.',
    fix: 'Use VITE_API_URL for frontend requests and document it.',
    command: 'VITE_API_URL=https://api.yourapp.com npm run build',
  },
  {
    label: 'Quick Fix',
    title: 'Add setup screenshots',
    reason: 'Recruiters scan visuals before reading long instructions.',
    fix: 'Add dashboard, report, and upload screenshots to README.',
    command: 'mkdir -p public/screenshots',
  },
];

export default function Landing() {
  return (
    <PageShell className="min-h-screen overflow-hidden bg-slate-950 bg-grid-pattern grid-bg text-white">
      <TopNav />
      <div className="aurora-bg pointer-events-none fixed inset-0" />
      <section className="relative mx-auto grid min-h-screen w-full max-w-[1280px] items-center gap-8 px-4 pb-10 pt-24 sm:px-6 lg:grid-cols-[0.45fr_0.55fr] lg:gap-10 lg:px-8">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm font-bold text-cyan-100">
            <Sparkles className="h-4 w-4" /> Built for AI-era student projects
          </div>
          <h1 className="mt-6 max-w-3xl text-5xl font-black leading-[1.02] tracking-normal text-white sm:text-7xl lg:text-[76px]">
            Your project runs. But is it ready to show?
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            RepoReady audits your project for GitHub quality, deployment issues, exposed secrets, README completeness, and resume presentation - built for students using AI tools, Codex, Cursor, or ChatGPT.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/new-audit" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 font-black text-slate-950 transition hover:bg-cyan-100">
              Scan My Project <ArrowRight className="h-5 w-5" />
            </Link>
            <Link to="/dashboard" className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-6 py-4 font-black text-white transition hover:bg-white/10">
              Open Dashboard
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            {trust.map((item) => (
              <span key={item} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-slate-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-300" /> {item}
              </span>
            ))}
          </div>
        </div>
        <div className="relative flex justify-center lg:justify-end">
          <div className="absolute -inset-4 bg-gradient-to-br from-cyan-300/10 via-violet-400/5 to-emerald-300/10 blur-3xl" />
          <div className="glass-card relative w-full max-w-[700px] rounded-2xl p-3.5 shadow-glow sm:p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-cyan-300/10 p-3 text-cyan-200">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-black text-white">Project Audit</p>
                  <p className="text-sm text-slate-400">Portfolio readiness snapshot</p>
                </div>
              </div>
              <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-xs font-black text-emerald-200">Live audit</span>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-4">
              <PreviewSummary icon={Sparkles} label="RepoReady Score" value="78/100" tone="cyan" />
              <PreviewSummary icon={CheckCircle2} label="Status" value="Almost Ready" tone="emerald" />
              <PreviewSummary icon={TrendingUp} label="After fixes" value="91" tone="violet" />
              <PreviewSummary icon={Clock3} label="Fix time" value="25 min" tone="amber" />
            </div>

            <div className="mt-3 flex gap-1.5 overflow-x-auto rounded-2xl border border-white/10 bg-black/20 p-1">
              {auditTabs.map(({ label, icon: Icon }, index) => (
                <button
                  key={label}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[11px] font-black transition ${
                    index === 0 ? 'bg-white text-slate-950' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>

            <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_0.62fr]">
              <div className="grid gap-2 sm:grid-cols-2">
                {previewMetrics.map((metric) => <PreviewMetric key={metric.label} {...metric} />)}
              </div>
              <SecurityPreviewCard />
            </div>

            <div className="mt-3 grid gap-3 xl:grid-cols-[0.72fr_1.28fr]">
              <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-black text-white">Readiness mix</p>
                  <span className="rounded-full bg-cyan-300/10 px-2.5 py-1 text-[11px] font-black text-cyan-100">Score 78</span>
                </div>
                <div className="relative mt-1 h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={donutLegend} dataKey="value" innerRadius={45} outerRadius={66} paddingAngle={3}>
                        {donutLegend.map((item) => <Cell key={item.name} fill={item.color} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-3xl font-black text-white">78</p>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">overall</p>
                  </div>
                </div>
                <div className="grid gap-1.5">
                  {donutLegend.map((item) => (
                    <div key={item.name} className="flex items-center justify-between rounded-xl bg-white/5 px-2.5 py-1.5">
                      <span className="flex items-center gap-2 text-xs font-bold text-slate-300">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: item.color }} />
                        {item.name}
                      </span>
                      <span className="text-xs font-black text-white">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-2 rounded-2xl border border-white/10 bg-black/25 p-3">
                <div className="mb-1 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-white">Priority recommendations</p>
                    <p className="text-xs text-slate-500">Fix order for the fastest portfolio lift</p>
                  </div>
                  <FileText className="h-5 w-5 text-violet-200" />
                </div>
                {recommendations.map((item) => <RecommendationPreview key={item.title} {...item} />)}
              </div>
            </div>

            <div className="mt-3 rounded-2xl border border-emerald-300/15 bg-gradient-to-br from-emerald-400/10 to-cyan-400/5 p-3">
              <div className="flex items-start gap-3">
                <div className="rounded-xl border border-emerald-300/20 bg-emerald-400/10 p-2 text-emerald-200">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-black text-white">Portfolio Impact</p>
                  <p className="mt-1 text-[11px] leading-4 text-slate-300">
                    Strong project idea, but missing deployment polish and setup clarity. Fixing the top items makes it look more credible to recruiters and interviewers.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section id="features" className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-black text-white sm:text-5xl">Everything your project needs before GitHub.</h2>
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => <FeatureCard key={feature.title} {...feature} />)}
        </div>
      </section>
      <section id="how" className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-5 md:grid-cols-3">
          {['Upload project ZIP or paste GitHub repo link', 'RepoReady analyzes structure, configs, secrets, scripts, and docs', 'Get a prioritized cleanup roadmap and portfolio package'].map((step, index) => (
            <div key={step} className="glass-card rounded-2xl p-6">
              <p className="text-sm font-black text-cyan-200">Step {index + 1}</p>
              <h3 className="mt-4 text-2xl font-black text-white">{step}</h3>
            </div>
          ))}
        </div>
      </section>
      <section className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-black text-white sm:text-5xl">Not another enterprise code review tool.</h2>
        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          <Compare title="Traditional Code Review Tools" items={['PR-focused', 'Enterprise-oriented', 'Code smells and security rules', 'Hard for beginners']} muted />
          <Compare title="RepoReady" items={['Student-project focused', 'GitHub portfolio readiness', 'Deployment checklist', 'README + resume + viva prep', 'Beginner-friendly fix order']} />
        </div>
      </section>
      <section id="pricing" className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-black text-white sm:text-5xl">Simple plans for portfolio momentum.</h2>
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          <PricingCard name="Free" price="$0" features={['1 saved audit', 'Basic score', 'Top 5 issues']} />
          <PricingCard name="Pro" price="$9" highlighted features={['Full audit report', 'README generator', 'Resume pack', 'Deployment checklist', 'Project defense pack']} />
          <PricingCard name="Lifetime Student" price="$39" features={['Unlimited local scans', 'Export reports', 'Priority templates']} />
        </div>
      </section>
    </PageShell>
  );
}

function PreviewSummary({ icon: Icon, label, value, tone }) {
  const toneClass = {
    cyan: 'from-cyan-400/15 to-cyan-400/5 text-cyan-100',
    emerald: 'from-emerald-400/15 to-emerald-400/5 text-emerald-100',
    violet: 'from-violet-400/15 to-violet-400/5 text-violet-100',
    amber: 'from-amber-400/15 to-amber-400/5 text-amber-100',
  }[tone];

  return (
    <div className={`rounded-2xl border border-white/10 bg-gradient-to-br p-2.5 ${toneClass}`}>
      <Icon className="h-3.5 w-3.5" />
      <p className="mt-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-0.5 text-xs font-black text-white">{value}</p>
    </div>
  );
}

function PreviewMetric({ label, value, accent, reason }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-3 transition hover:-translate-y-0.5 hover:border-cyan-300/25 hover:bg-white/[0.07]">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-black text-white">{label}</p>
        <span className="text-sm font-black text-cyan-100">{value}</span>
      </div>
      <div className="mt-2">
        <ProgressBar value={value} accent={accent} />
      </div>
      <p className="mt-2 text-[11px] leading-4 text-slate-400">{reason}</p>
    </div>
  );
}

function SecurityPreviewCard() {
  return (
    <div className="rounded-2xl border border-amber-300/20 bg-gradient-to-br from-amber-400/12 to-rose-400/10 p-3 transition hover:-translate-y-0.5 hover:border-amber-200/35">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-200">Security Risk</p>
          <h3 className="mt-2 text-xl font-black text-white">Medium risk</h3>
        </div>
        <div className="rounded-2xl border border-amber-300/20 bg-black/25 p-2.5 text-amber-200">
          <AlertTriangle className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-3 text-xs font-bold text-amber-100">2 exposed config issues</p>
      <p className="mt-1.5 text-[11px] leading-4 text-slate-300">
        Secrets and environment setup need cleanup before this project is safe to share publicly.
      </p>
    </div>
  );
}

function RecommendationPreview({ label, title, reason, fix, command }) {
  const style = {
    Critical: 'border-rose-300/25 bg-rose-400/10 text-rose-100',
    Important: 'border-amber-300/25 bg-amber-400/10 text-amber-100',
    'Quick Fix': 'border-cyan-300/25 bg-cyan-400/10 text-cyan-100',
  }[label];

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-3 transition hover:-translate-y-0.5 hover:border-violet-300/25 hover:bg-white/[0.07]">
      <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-black ${style}`}>{label}</span>
      <h3 className="mt-2 text-xs font-black text-white">{title}</h3>
      <p className="mt-1.5 text-[11px] leading-4 text-slate-400"><span className="font-bold text-slate-300">Reason:</span> {reason}</p>
      <p className="mt-1 text-[11px] leading-4 text-slate-400"><span className="font-bold text-slate-300">Fix:</span> {fix}</p>
      <div className="mt-2.5 flex flex-wrap gap-2">
        <button className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-2.5 py-1.5 text-[10px] font-black text-white transition hover:bg-white/10">
          <Eye className="h-3.5 w-3.5" />
          View Fix
        </button>
        <button
          onClick={() => navigator.clipboard?.writeText(command)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-2.5 py-1.5 text-[10px] font-black text-white transition hover:bg-white/10"
        >
          <Copy className="h-3.5 w-3.5" />
          Copy Command
        </button>
      </div>
    </div>
  );
}

function Compare({ title, items, muted }) {
  return (
    <div className={`glass-card rounded-2xl p-6 ${muted ? 'opacity-75' : 'shadow-glow'}`}>
      <h3 className="text-2xl font-black text-white">{title}</h3>
      <div className="mt-6 space-y-3">
        {items.map((item) => (
          <p key={item} className="flex items-center gap-3 text-slate-300">
            <CheckCircle2 className={`h-5 w-5 ${muted ? 'text-slate-500' : 'text-emerald-300'}`} /> {item}
          </p>
        ))}
      </div>
    </div>
  );
}
