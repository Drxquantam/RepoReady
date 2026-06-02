import PageShell from '../components/PageShell.jsx';
import { clearAudits, getSettings, saveSettings } from '../data/auditEngine.js';
import { useEffect, useState } from 'react';
import { deleteServerAudits, fetchAiStatus } from '../lib/api.js';

export default function Settings() {
  const [settings, setSettings] = useState(() => ({
    theme: 'Dark',
    exportFormat: 'PDF',
    projectType: 'MERN',
    provider: 'Groq',
    ...getSettings(),
  }));
  const [saved, setSaved] = useState(false);
  const [aiStatus, setAiStatus] = useState(null);
  const update = (key, value) => setSettings((current) => ({ ...current, [key]: value }));
  const persist = () => {
    saveSettings(settings);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1400);
  };

  useEffect(() => {
    fetchAiStatus().then(setAiStatus).catch(() => setAiStatus(null));
  }, []);

  return (
    <PageShell>
      <p className="text-sm font-black uppercase tracking-[0.22em] text-cyan-200">Settings</p>
      <h1 className="mt-3 text-4xl font-black text-white">Workspace preferences</h1>
      <section className="glass-card mt-8 max-w-4xl rounded-2xl p-6">
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Theme">
            <select value={settings.theme} onChange={(event) => update('theme', event.target.value)} className="input"><option>Dark</option><option>System</option></select>
          </Field>
          <Field label="Export format">
            <select value={settings.exportFormat} onChange={(event) => update('exportFormat', event.target.value)} className="input"><option>PDF</option><option>Markdown</option></select>
          </Field>
          <Field label="Default project type">
            <select value={settings.projectType} onChange={(event) => update('projectType', event.target.value)} className="input"><option>MERN</option><option>React</option><option>Node/Express</option><option>Python/Flask</option><option>Next.js</option><option>Other</option></select>
          </Field>
          <Field label="AI provider placeholder">
            <select value={settings.provider} onChange={(event) => update('provider', event.target.value)} className="input"><option>Groq</option><option>OpenAI</option></select>
          </Field>
        </div>
        <div className="mt-5">
          <Field label="API key">
            <input disabled className="input opacity-60" value={aiStatus?.configured ? 'Groq connected on backend' : 'Add GROQ_API_KEY in server .env'} readOnly />
          </Field>
          <p className="mt-2 text-sm text-slate-500">
            Groq runs server-side with model {aiStatus?.model || 'llama-3.3-70b-versatile'}. API keys stay disabled in the browser.
          </p>
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <button onClick={persist} className="rounded-2xl bg-white px-6 py-3 font-black text-slate-950">{saved ? 'Saved' : 'Save settings'}</button>
          <button
            onClick={async () => {
              await deleteServerAudits().catch(() => {});
              clearAudits();
              window.location.reload();
            }}
            className="rounded-2xl border border-rose-300/20 bg-rose-400/10 px-6 py-3 font-black text-rose-100"
          >
            Clear audits
          </button>
        </div>
      </section>
    </PageShell>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-slate-300">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}
