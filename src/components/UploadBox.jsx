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
        {fileName || 'Attach a ZIP with README, package files, source folders, routes, and components. Exclude node_modules, .git, dist, and build folders for faster scans.'}
      </p>
    </label>
  );
}
