import { Download, FileText, GraduationCap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { downloadText, reportText } from '../data/auditEngine.js';
import CopyButton from './CopyButton.jsx';

export default function ReportHeader({ project }) {
  const text = reportText(project);
  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-cyan-200">Audit Report</p>
        <h1 className="mt-3 text-3xl font-black text-white sm:text-5xl">{project.name}</h1>
        <p className="mt-3 text-slate-400">{project.type} project audit updated {project.updatedAt}</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-black text-slate-950"
        >
          <Download className="h-4 w-4" /> Export PDF
        </button>
        <button
          onClick={() => downloadText(`${project.name.replace(/\W+/g, '-').toLowerCase()}-repoready-report.txt`, text)}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black text-white"
        >
          <Download className="h-4 w-4" /> TXT
        </button>
        <CopyButton text={text} label="Copy Report" />
        <Link to="/readme-generator" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black text-white">
          <FileText className="h-4 w-4" /> Generate README
        </Link>
        <Link to="/resume-pack" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black text-white">
          <GraduationCap className="h-4 w-4" /> Resume Pack
        </Link>
      </div>
    </div>
  );
}
