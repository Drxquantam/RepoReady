import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from '../components/PageShell.jsx';
import UploadBox from '../components/UploadBox.jsx';
import { createAudit, saveAudit } from '../data/auditEngine.js';
import { createServerAudit } from '../lib/api.js';

const checks = [
  ['secrets', 'Check secrets'],
  ['readme', 'Check README'],
  ['deployment', 'Check deployment readiness'],
  ['structure', 'Check folder structure'],
  ['resume', 'Generate resume bullets'],
  ['viva', 'Generate viva questions'],
];

export default function NewAudit() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    projectName: '',
    repoUrl: '',
    projectType: 'MERN',
    fileName: '',
    file: null,
    checks: {
      secrets: true,
      readme: true,
      deployment: true,
      structure: true,
      resume: true,
      viva: true,
    },
  });
  const navigate = useNavigate();

  const runAudit = async () => {
    setLoading(true);
    setError('');
    try {
      const audit = await createServerAudit(form);
      saveAudit(audit);
      window.setTimeout(() => navigate(`/report/${audit.id}`), 1500);
    } catch (err) {
      if (form.file) {
        setLoading(false);
        setError(err.message || 'Upload failed. Please try again with a smaller project ZIP.');
        return;
      }
      const audit = createAudit(form);
      saveAudit(audit);
      window.setTimeout(() => navigate(`/report/${audit.id}`), 1500);
    }
  };

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const updateCheck = (key) => setForm((current) => ({ ...current, checks: { ...current.checks, [key]: !current.checks[key] } }));
  const selectFile = (file) => {
    const cleanName = file?.name?.replace(/\.zip$/i, '').replace(/[-_]/g, ' ') || '';
    setForm((current) => ({ ...current, file, fileName: file?.name || '', projectName: current.projectName || cleanName }));
  };

  return (
    <PageShell>
      <p className="text-sm font-black uppercase tracking-[0.22em] text-cyan-200">New Audit</p>
      <h1 className="mt-3 text-4xl font-black text-white">Upload a messy project. Get a clean roadmap.</h1>
      <div className="mt-8 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="glass-card rounded-2xl p-5">
          <UploadBox onFileSelect={selectFile} fileName={form.fileName ? `Selected: ${form.fileName}` : ''} />
          {error && (
            <div className="mt-4 rounded-2xl border border-rose-300/20 bg-rose-300/10 p-4 text-sm font-bold leading-6 text-rose-100">
              {error}
            </div>
          )}
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="block md:col-span-2">
              <span className="text-sm font-bold text-slate-300">Project name</span>
              <input
                value={form.projectName}
                onChange={(event) => update('projectName', event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-cyan-300/50"
                placeholder="RepoReady Portfolio Auditor"
              />
            </label>
            <label className="block">
              <span className="text-sm font-bold text-slate-300">GitHub repo URL</span>
              <input
                value={form.repoUrl}
                onChange={(event) => update('repoUrl', event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-cyan-300/50"
                placeholder="https://github.com/student/project-name"
              />
            </label>
            <label className="block">
              <span className="text-sm font-bold text-slate-300">Project type</span>
              <select
                value={form.projectType}
                onChange={(event) => update('projectType', event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-cyan-300/50"
              >
                {['MERN', 'React', 'Node/Express', 'Python/Flask', 'Next.js', 'Other'].map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
          </div>
        </section>
        <section className="glass-card rounded-2xl p-6">
          <h2 className="text-2xl font-black text-white">Before scan</h2>
          <div className="mt-6 space-y-4">
            {checks.map(([key, item]) => (
              <label key={key} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm font-bold text-slate-200">
                <input checked={form.checks[key]} onChange={() => updateCheck(key)} type="checkbox" className="h-5 w-5 accent-cyan-300" />
                {item}
              </label>
            ))}
          </div>
          <button
            onClick={runAudit}
            disabled={loading}
            className="mt-6 w-full rounded-2xl bg-white px-5 py-4 font-black text-slate-950 transition hover:bg-cyan-100 disabled:cursor-wait disabled:opacity-70"
          >
            {loading ? 'Analyzing project...' : 'Run Audit'}
          </button>
        </section>
      </div>
    </PageShell>
  );
}
