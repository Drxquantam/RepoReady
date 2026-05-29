import { AlertOctagon, Copy } from 'lucide-react';
import CopyButton from './CopyButton.jsx';

const badge = {
  Critical: 'border-rose-300/25 bg-rose-400/10 text-rose-200',
  High: 'border-amber-300/25 bg-amber-400/10 text-amber-200',
  Medium: 'border-cyan-300/25 bg-cyan-400/10 text-cyan-200',
  Suggestion: 'border-violet-300/25 bg-violet-400/10 text-violet-200',
};

export default function IssueCard({ issue }) {
  const copy = `${issue.file}\nProblem: ${issue.problem}\nFix: ${issue.fix}`;

  return (
    <div className="glass-card rounded-2xl p-5 transition hover:border-white/20">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
            <AlertOctagon className="h-5 w-5 text-rose-200" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full border px-3 py-1 text-xs font-black ${badge[issue.severity]}`}>
                {issue.severity}
              </span>
              <code className="text-xs text-slate-400">{issue.file}</code>
            </div>
            <h3 className="mt-3 text-lg font-bold text-white">{issue.problem}</h3>
          </div>
        </div>
        <CopyButton text={copy} label="Copy Fix" icon={Copy} />
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Why it matters</p>
          <p className="mt-2 text-sm leading-6 text-slate-300">{issue.why}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Suggested fix</p>
          <p className="mt-2 text-sm leading-6 text-slate-300">{issue.fix}</p>
        </div>
      </div>
    </div>
  );
}
