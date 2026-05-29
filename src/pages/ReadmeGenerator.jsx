import { CheckCircle2, Download, Edit3, Eye, RefreshCw, Save, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import CopyButton from '../components/CopyButton.jsx';
import PageShell from '../components/PageShell.jsx';
import { downloadText, generateReadme, getAudit, saveAudit } from '../data/auditEngine.js';
import { fetchAudit, fetchReadme, updateProjectProfile } from '../lib/api.js';

export default function ReadmeGenerator() {
  const [audit, setAudit] = useState(() => getAudit('latest'));
  const [mode, setMode] = useState('preview');
  const [markdown, setMarkdown] = useState(() => generateReadme(audit));
  const [editingProfile, setEditingProfile] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [draftProfile, setDraftProfile] = useState(() => normalizeProfile(getAudit('latest')));

  useEffect(() => {
    fetchAudit('latest')
      .then((serverAudit) => {
        setAudit(serverAudit);
        setDraftProfile(normalizeProfile(serverAudit));
      })
      .catch(() => setAudit(getAudit('latest')));
  }, []);

  useEffect(() => {
    if (!audit) return;
    setDraftProfile(normalizeProfile(audit));
    fetchReadme(audit.id)
      .then(setMarkdown)
      .catch(() => setMarkdown(generateReadme(audit)));
  }, [audit?.id]);

  const regenerate = async (nextAudit = audit) => {
    if (!nextAudit) return;
    setSaving(true);
    try {
      setMarkdown(await fetchReadme(nextAudit.id));
    } catch {
      setMarkdown(generateReadme(nextAudit));
    } finally {
      setSaving(false);
    }
  };

  const saveProfile = async () => {
    if (!audit) return;
    setSaving(true);
    const projectProfile = cleanProfile(draftProfile);
    try {
      const updated = await updateProjectProfile(audit.id, projectProfile);
      setAudit(updated);
      saveAudit(updated);
      setEditingProfile(false);
      setConfirmed(true);
      await regenerate(updated);
    } catch {
      const updated = { ...audit, projectProfile, name: projectProfile.name || audit.name };
      setAudit(updated);
      saveAudit(updated);
      setEditingProfile(false);
      setConfirmed(true);
      setMarkdown(generateReadme(updated));
    } finally {
      setSaving(false);
    }
  };

  if (!audit) {
    return (
      <PageShell>
        <div className="glass-card rounded-2xl p-8 text-center">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-cyan-200">README Generator</p>
          <h1 className="mt-4 text-4xl font-black text-white">Run an audit first.</h1>
          <p className="mx-auto mt-3 max-w-xl text-slate-400">RepoReady uses your latest audit to generate project-specific README sections.</p>
          <Link to="/new-audit" className="mt-6 inline-flex rounded-2xl bg-white px-6 py-3 font-black text-slate-950">Start New Audit</Link>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.22em] text-cyan-200">README Generator</p>
          <h1 className="mt-3 text-4xl font-black text-white">{audit.name}</h1>
          <p className="mt-2 text-slate-400">README content is generated only from detected repository evidence.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="flex rounded-2xl border border-white/10 bg-white/5 p-1">
            <button onClick={() => setMode('preview')} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-black ${mode === 'preview' ? 'bg-white text-slate-950' : 'text-slate-300'}`}>
              <Eye className="h-4 w-4" /> Preview
            </button>
            <button onClick={() => setMode('edit')} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-black ${mode === 'edit' ? 'bg-white text-slate-950' : 'text-slate-300'}`}>
              <Edit3 className="h-4 w-4" /> Edit
            </button>
          </div>
          <CopyButton text={markdown} label="Copy Markdown" />
          <button
            onClick={() => downloadText('README.md', markdown)}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black text-white"
          >
            <Download className="h-4 w-4" /> Download README
          </button>
        </div>
      </div>
      <section className="glass-card mt-8 rounded-2xl p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-cyan-100">
              <Sparkles className="h-3.5 w-3.5" /> Detected Project Profile
            </div>
            <h2 className="mt-4 text-2xl font-black text-white">{draftProfile.name}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">{draftProfile.oneLineSummary || draftProfile.problemSolved}</p>
            {draftProfile.confidence < 70 && (
              <p className="mt-3 rounded-xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm font-bold text-amber-100">
                {draftProfile.confidence < 45 ? 'Low confidence: confirm or edit this profile before using the README.' : 'RepoReady inferred this from partial evidence. Please review before copying.'}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            <span className={`rounded-xl border px-4 py-2 text-sm font-black ${confidenceTone(draftProfile.confidence)}`}>
              {draftProfile.confidence}% confidence
            </span>
            <button onClick={() => setConfirmed(true)} className="inline-flex items-center gap-2 rounded-xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-2 text-sm font-black text-emerald-100">
              <CheckCircle2 className="h-4 w-4" /> Looks Correct
            </button>
            <button onClick={() => setEditingProfile((value) => !value)} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-black text-white">
              <Edit3 className="h-4 w-4" /> Edit Profile
            </button>
            <button onClick={() => regenerate()} disabled={saving || (draftProfile.confidence < 45 && !confirmed)} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-50">
              <RefreshCw className={`h-4 w-4 ${saving ? 'animate-spin' : ''}`} /> Regenerate README
            </button>
          </div>
        </div>
        {editingProfile ? (
          <ProfileEditor profile={draftProfile} setProfile={setDraftProfile} onSave={saveProfile} saving={saving} />
        ) : (
          <ProfileSummary profile={draftProfile} />
        )}
      </section>
      <section className="glass-card mt-8 rounded-2xl p-5">
        {mode === 'edit' ? (
          <textarea
            value={markdown}
            onChange={(event) => setMarkdown(event.target.value)}
            className="min-h-[720px] w-full resize-y rounded-2xl border border-white/10 bg-black/30 p-5 font-mono text-sm leading-7 text-slate-200 outline-none focus:border-cyan-300/50"
          />
        ) : (
          <article className="prose prose-invert max-w-none">
            <MarkdownPreview markdown={markdown} />
          </article>
        )}
      </section>
    </PageShell>
  );
}

function ProfileSummary({ profile }) {
  return (
    <div className="mt-6 grid gap-4 lg:grid-cols-3">
      <Info title="Category" value={profile.category} />
      <Info title="Tech Stack" items={profile.techStack} />
      <Info title="Main Features" items={profile.coreFeatures.slice(0, 5)} />
      <Info title="Setup Commands" items={profile.setupCommands} />
      <Info title="Environment Variables" items={profile.envVariables} />
      <Info title="Evidence Used" items={profile.evidence.slice(0, 6)} wide />
    </div>
  );
}

function Info({ title, value, items = [], wide }) {
  return (
    <div className={`rounded-2xl border border-white/10 bg-white/5 p-4 ${wide ? 'lg:col-span-3' : ''}`}>
      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{title}</p>
      {value && <p className="mt-3 text-sm leading-6 text-slate-200">{value}</p>}
      {!!items.length && (
        <div className="mt-3 flex flex-wrap gap-2">
          {items.map((item) => <span key={item} className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-bold text-slate-200">{item}</span>)}
        </div>
      )}
      {!value && !items.length && <p className="mt-3 text-sm text-slate-500">Not confidently detected.</p>}
    </div>
  );
}

function ProfileEditor({ profile, setProfile, onSave, saving }) {
  const update = (key, value) => setProfile((current) => ({ ...current, [key]: value }));
  return (
    <div className="mt-6 grid gap-4 lg:grid-cols-2">
      <Field label="Project name" value={profile.name} onChange={(value) => update('name', value)} />
      <Field label="Category" value={profile.category} onChange={(value) => update('category', value)} />
      <Field label="One-line summary" textarea value={profile.oneLineSummary} onChange={(value) => update('oneLineSummary', value)} />
      <Field label="Problem solved" textarea value={profile.problemSolved} onChange={(value) => update('problemSolved', value)} />
      <Field label="Core features" textarea value={profile.coreFeatures.join('\n')} onChange={(value) => update('coreFeatures', splitLines(value))} />
      <Field label="Tech stack" textarea value={profile.techStack.join('\n')} onChange={(value) => update('techStack', splitLines(value))} />
      <Field label="Setup commands" textarea value={profile.setupCommands.join('\n')} onChange={(value) => update('setupCommands', splitLines(value))} />
      <Field label="Environment variables" textarea value={profile.envVariables.join('\n')} onChange={(value) => update('envVariables', splitLines(value))} />
      <Field label="Folder structure" textarea value={profile.folderStructure.join('\n')} onChange={(value) => update('folderStructure', splitLines(value))} />
      <Field label="Evidence" textarea value={profile.evidence.join('\n')} onChange={(value) => update('evidence', splitLines(value))} />
      <button onClick={onSave} disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-black text-slate-950 disabled:cursor-wait disabled:opacity-70 lg:col-span-2">
        <Save className="h-4 w-4" /> Save Profile and Regenerate
      </button>
    </div>
  );
}

function Field({ label, value, onChange, textarea }) {
  const className = 'mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-sm text-white outline-none focus:border-cyan-300/50';
  return (
    <label className="block rounded-2xl border border-white/10 bg-black/20 p-4">
      <span className="text-sm font-bold text-slate-300">{label}</span>
      {textarea ? <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={4} className={className} /> : <input value={value} onChange={(event) => onChange(event.target.value)} className={className} />}
    </label>
  );
}

function normalizeProfile(audit) {
  const profile = audit?.projectProfile || {};
  return {
    name: profile.name || audit?.name || '',
    category: profile.category || audit?.type || '',
    oneLineSummary: profile.oneLineSummary || profile.problemSolved || '',
    problemSolved: profile.problemSolved || '',
    coreFeatures: ensureArray(profile.coreFeatures),
    techStack: ensureArray(profile.techStack),
    setupCommands: ensureArray(profile.setupCommands),
    envVariables: ensureArray(profile.envVariables),
    folderStructure: ensureArray(profile.folderStructure),
    evidence: ensureArray(profile.evidence),
    confidence: normalizeConfidence(profile.confidence),
  };
}

function cleanProfile(profile) {
  return {
    ...profile,
    coreFeatures: ensureArray(profile.coreFeatures),
    techStack: ensureArray(profile.techStack),
    setupCommands: ensureArray(profile.setupCommands),
    envVariables: ensureArray(profile.envVariables),
    folderStructure: ensureArray(profile.folderStructure),
    evidence: ensureArray(profile.evidence),
    confidence: normalizeConfidence(profile.confidence),
  };
}

function normalizeConfidence(value) {
  if (typeof value === 'number') return Math.max(0, Math.min(100, Math.round(value)));
  if (typeof value === 'string') {
    if (/high/i.test(value)) return 85;
    if (/medium/i.test(value)) return 60;
    if (/low/i.test(value)) return 35;
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return Math.max(0, Math.min(100, Math.round(parsed)));
  }
  return 35;
}

function confidenceTone(value) {
  if (value >= 70) return 'border-emerald-300/25 bg-emerald-300/10 text-emerald-100';
  if (value >= 45) return 'border-amber-300/25 bg-amber-300/10 text-amber-100';
  return 'border-rose-300/25 bg-rose-300/10 text-rose-100';
}

function ensureArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === 'string' && value.trim()) return splitLines(value);
  return [];
}

function splitLines(value) {
  return value.split(/\n|,/).map((item) => item.trim()).filter(Boolean);
}

function MarkdownPreview({ markdown }) {
  return (
    <div className="space-y-5">
      {markdown.split('\n').map((line, index) => {
        if (line.startsWith('# ')) return <h1 key={index} className="text-4xl font-black text-white">{line.replace('# ', '')}</h1>;
        if (line.startsWith('## ')) return <h2 key={index} className="pt-4 text-2xl font-black text-cyan-100">{line.replace('## ', '')}</h2>;
        if (line.startsWith('- ')) return <p key={index} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-slate-300">{line}</p>;
        if (line.startsWith('```')) return null;
        if (!line.trim()) return <div key={index} className="h-1" />;
        return <p key={index} className="leading-7 text-slate-300">{line}</p>;
      })}
    </div>
  );
}
