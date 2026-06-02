import { UploadCloud } from 'lucide-react';

export default function UploadBox({ onFileSelect, fileName }) {
  return (
    <label className="group flex min-h-64 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-cyan-300/30 bg-cyan-300/5 p-8 text-center transition hover:border-cyan-200/60 hover:bg-cyan-300/10">
      <input className="hidden" type="file" accept=".zip" onChange={(event) => onFileSelect?.(event.target.files?.[0] || null)} />
      <div className="rounded-2xl border border-white/10 bg-black/30 p-4 transition group-hover:scale-105">
        <UploadCloud className="h-9 w-9 text-cyan-200" />
      </div>
      <p className="mt-5 text-xl font-black text-white">Drop your project ZIP here</p>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
        {fileName || 'Attach a clean ZIP with README, package files, and source folders only. Do not include node_modules, .git, dist, build, .next, images/videos, or dependency caches.'}
      </p>
      <p className="mt-3 text-xs font-bold uppercase tracking-[0.16em] text-cyan-200/80">
        Smaller ZIP = faster audit
      </p>
    </label>
  );
}
