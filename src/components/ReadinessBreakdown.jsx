import { CheckCircle2, CircleAlert, GitBranch, Rocket, ShieldAlert, Star, UserRoundCheck } from 'lucide-react';

const styles = {
  Strong: {
    badge: 'border-emerald-300/20 bg-emerald-400/10 text-emerald-200',
    bar: 'from-emerald-300/80 to-teal-300/70',
    icon: 'text-emerald-200',
  },
  'Needs Work': {
    badge: 'border-amber-300/20 bg-amber-400/10 text-amber-200',
    bar: 'from-amber-300/80 to-yellow-200/70',
    icon: 'text-amber-200',
  },
  Critical: {
    badge: 'border-rose-300/20 bg-rose-400/10 text-rose-200',
    bar: 'from-rose-300/85 to-pink-300/70',
    icon: 'text-rose-200',
  },
  Good: {
    badge: 'border-violet-300/20 bg-violet-400/10 text-violet-200',
    bar: 'from-blue-300/75 to-violet-300/70',
    icon: 'text-violet-200',
  },
};

const icons = {
  GitHub: GitBranch,
  Deployment: Rocket,
  Security: ShieldAlert,
  README: CheckCircle2,
  Resume: UserRoundCheck,
};

const notes = {
  GitHub: 'Repo structure exists, but portfolio polish and repo metadata need work.',
  Deployment: 'Production scripts and environment setup need polish.',
  Security: 'Potential exposed secrets or unsafe config found.',
  README: 'Setup steps exist but need clearer screenshots/examples.',
  Resume: 'Project is resume-worthy with minor wording improvements.',
};

export default function ReadinessBreakdown({ auditData }) {
  const rows = [
    { label: 'GitHub', score: auditData.scores.github, status: statusFor(auditData.scores.github), note: notes.GitHub },
    { label: 'Deployment', score: auditData.scores.deployment, status: statusFor(auditData.scores.deployment), note: notes.Deployment },
    { label: 'Security', score: auditData.scores.security, status: 'Critical', note: notes.Security },
    { label: 'README', score: auditData.scores.readme, status: statusFor(auditData.scores.readme), note: notes.README },
    { label: 'Resume', score: auditData.scores.resume, status: statusFor(auditData.scores.resume), note: notes.Resume },
  ];

  return (
    <section className="glass-card rounded-2xl p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-200">Analytics</p>
          <h2 className="mt-2 text-xl font-black text-white">Readiness Breakdown</h2>
          <p className="mt-1 text-sm text-slate-400">How your project performs across portfolio review areas.</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-2.5 text-violet-200">
          <Star className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-5 space-y-2.5">
        {rows.map((row) => {
          const Icon = icons[row.label] || CircleAlert;
          const style = styles[row.status];

          return (
            <div
              key={row.label}
              className="rounded-2xl border border-white/10 bg-black/20 p-3.5 transition hover:border-white/15 hover:bg-white/[0.055]"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex min-w-36 items-center gap-3">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-2">
                    <Icon className={`h-4 w-4 ${style.icon}`} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-white">{row.label}</p>
                    <p className="text-xs text-slate-500">{row.score}/100</p>
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div className={`h-full rounded-full bg-gradient-to-r ${style.bar}`} style={{ width: `${row.score}%` }} />
                  </div>
                </div>

                <span className={`w-fit rounded-full border px-3 py-1 text-[11px] font-black ${style.badge}`}>
                  {row.status}
                </span>
              </div>
              <p className="mt-2 pl-0 text-xs leading-5 text-slate-400 sm:pl-12">{row.note}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function statusFor(score) {
  if (score >= 80) return 'Strong';
  if (score >= 65) return 'Good';
  if (score >= 45) return 'Needs Work';
  return 'Critical';
}
