import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { CheckCircle2, Clipboard, Download, Pencil, RefreshCw, Save, Sparkles } from 'lucide-react';
import PageShell from '../components/PageShell.jsx';
import { clearAudits, downloadText, generateResumePack, getAudit, saveAudit } from '../data/auditEngine.js';
import { fetchAudit, fetchResumePack, updateProjectProfile } from '../lib/api.js';

const bulletStyles = ['Concise', 'Technical', 'Impact-focused', 'ATS-friendly'];

export default function ResumePack() {
  const [audit, setAudit] = useState(() => getAudit('latest'));
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [style, setStyle] = useState('Concise');
  const [copied, setCopied] = useState(false);
  const [pack, setPack] = useState(() => {
    const latest = getAudit('latest');
    return latest ? generateResumePack(latest, { style: 'Concise' }) : null;
  });
  const [draftProfile, setDraftProfile] = useState(() => normalizeProfile(getAudit('latest')));

  useEffect(() => {
    fetchAudit('latest')
      .then((serverAudit) => {
        setAudit(serverAudit);
        setDraftProfile(normalizeProfile(serverAudit));
      })
      .catch((error) => {
        if (error.message === 'Audit not found' || error.message === 'No audits found') {
          clearAudits();
          setAudit(null);
          setPack(null);
          return;
        }
        setAudit(getAudit('latest'));
      });
  }, []);

  useEffect(() => {
    if (!audit) return;
    setDraftProfile(normalizeProfile(audit));
    fetchResumePack(audit.id, style)
      .then(setPack)
      .catch(() => setPack(generateResumePack(audit, { style })));
  }, [audit?.id, style]);

  const regenerate = async (nextAudit = audit) => {
    if (!nextAudit) return;
    setSaving(true);
    try {
      const nextPack = await fetchResumePack(nextAudit.id, style);
      setPack(nextPack);
    } catch {
      setPack(generateResumePack(nextAudit, { style }));
    } finally {
      setSaving(false);
    }
  };

  const bulletText = (pack?.bullets || []).map((bullet) => `• ${bullet}`).join('\n');

  const copyAllBullets = async () => {
    if (!bulletText) return;
    await navigator.clipboard.writeText(bulletText);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  const downloadBullets = () => {
    if (!bulletText) return;
    const filename = `${(draftProfile.name || audit.name || 'resume-bullets').replace(/\W+/g, '-').toLowerCase()}-resume-bullets.txt`;
    downloadText(filename, bulletText);
  };

  const saveProfile = async () => {
    if (!audit) return;
    setSaving(true);
    const nextProfile = cleanProfile(draftProfile);
    try {
      const updated = await updateProjectProfile(audit.id, nextProfile);
      setAudit(updated);
      saveAudit(updated);
      setEditing(false);
      await regenerate(updated);
    } catch {
      const updated = { ...audit, projectProfile: nextProfile, name: nextProfile.name || audit.name };
      setAudit(updated);
      saveAudit(updated);
      setEditing(false);
      setPack(generateResumePack(updated, { style }));
    } finally {
      setSaving(false);
    }
  };

  if (!audit || !pack) {
    return (
      <PageShell>
        <div className="glass-card rounded-2xl p-8 text-center">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-cyan-200">Resume Pack</p>
          <h1 className="mt-4 text-4xl font-black text-white">Run a project scan first to generate resume bullets.</h1>
          <p className="mx-auto mt-3 max-w-xl text-slate-400">RepoReady needs scanned project data before it can write project-specific resume lines.</p>
          <Link to="/new-audit" className="mt-6 inline-flex rounded-2xl bg-white px-6 py-3 font-black text-slate-950">Start New Audit</Link>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <p className="text-sm font-black uppercase tracking-[0.22em] text-cyan-200">Resume Pack</p>
      <h1 className="mt-3 text-4xl font-black text-white">Turn {audit.name} into placement-ready material.</h1>
      <section className="glass-card mt-8 rounded-2xl p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-cyan-100">
              <Sparkles className="h-3.5 w-3.5" /> Detected Project Profile
            </div>
            <h2 className="mt-4 text-2xl font-black text-white">{draftProfile.name}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">{draftProfile.problemSolved}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ConfidenceBadge value={draftProfile.confidence} />
            {pack.source && (
              <span className="inline-flex items-center rounded-xl border border-violet-300/20 bg-violet-300/10 px-4 py-2 text-sm font-black text-violet-100">
                Generated by {pack.source === 'gemini' ? 'Gemini' : 'profile rules'}
              </span>
            )}
            <button
              onClick={() => setEditing((value) => !value)}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-black text-white transition hover:border-cyan-300/40 hover:bg-white/10"
            >
              <Pencil className="h-4 w-4" /> {editing ? 'Close Edit' : 'Edit Profile'}
            </button>
            <button
              onClick={() => regenerate()}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-black text-slate-950 transition hover:bg-cyan-100 disabled:cursor-wait disabled:opacity-70"
            >
              <RefreshCw className={`h-4 w-4 ${saving ? 'animate-spin' : ''}`} /> Regenerate Bullets
            </button>
          </div>
        </div>

        {editing ? (
          <ProfileEditor profile={draftProfile} setProfile={setDraftProfile} onSave={saveProfile} saving={saving} />
        ) : (
          <ProfileSummary profile={draftProfile} />
        )}
        {pack.aiStatus && (
          <p className="mt-4 rounded-xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm font-bold text-amber-100">
            {pack.aiStatus}
          </p>
        )}
      </section>
      {pack.needsProfileConfirmation ? (
        <section className="glass-card mt-8 rounded-2xl border border-rose-300/20 p-6">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-rose-200">Resume Pack Blocked</p>
          <h2 className="mt-3 text-2xl font-black text-white">RepoReady needs real project evidence before generating placement material.</h2>
          <p className="mt-3 max-w-3xl leading-7 text-slate-300">{pack.message}</p>
          {!!pack.missing?.length && (
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {pack.missing.map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm font-bold text-slate-200">{item}</div>
              ))}
            </div>
          )}
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/new-audit" className="rounded-xl bg-white px-5 py-3 text-sm font-black text-slate-950">Upload Fresh ZIP</Link>
            <button onClick={() => setEditing(true)} className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-black text-white">Edit Detected Profile</button>
          </div>
        </section>
      ) : (
        <section className="glass-card mt-8 rounded-2xl p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-2xl font-black text-white">Resume Bullets</h2>
              <p className="mt-2 text-sm text-slate-400">Use 3-4 of these in your actual resume.</p>
            </div>
            <div className="flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-black/20 p-1.5">
              {bulletStyles.map((option) => (
                <button
                  key={option}
                  onClick={() => setStyle(option)}
                  className={`rounded-xl px-3 py-2 text-xs font-black transition ${
                    style === option
                      ? 'bg-white text-slate-950 shadow-lg shadow-cyan-950/20'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-cyan-300/[0.04] p-5 shadow-2xl shadow-black/20">
            {pack.bullets?.length ? (
              <div className="space-y-4 text-base leading-7 text-slate-100">
                {pack.bullets.map((bullet) => (
                  <p key={bullet} className="flex gap-3">
                    <span className="mt-0.5 text-cyan-200">•</span>
                    <span>{bullet}</span>
                  </p>
                ))}
              </div>
            ) : (
              <p className="text-slate-300">Run a project scan first to generate resume bullets.</p>
            )}
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={copyAllBullets}
              disabled={!bulletText}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Clipboard className="h-4 w-4" /> {copied ? 'Copied' : 'Copy All'}
            </button>
            <button
              onClick={() => regenerate()}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black text-white transition hover:border-cyan-300/40 hover:bg-white/10 disabled:cursor-wait disabled:opacity-70"
            >
              <RefreshCw className={`h-4 w-4 ${saving ? 'animate-spin' : ''}`} /> Regenerate Bullets
            </button>
            <button
              onClick={downloadBullets}
              disabled={!bulletText}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black text-white transition hover:border-emerald-300/40 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="h-4 w-4" /> Download TXT
            </button>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-5">
            {[
              'Starts with action verbs',
              'Avoids raw endpoints and package dumps',
              'Mentions tech stack naturally',
              'Focuses on project value',
              'Keep only 3-4 bullets in final resume',
            ].map((tip) => (
              <div key={tip} className="rounded-2xl border border-white/10 bg-black/20 p-3 text-xs font-bold leading-5 text-slate-300">
                <CheckCircle2 className="mb-2 h-4 w-4 text-emerald-300" />
                {tip}
              </div>
            ))}
          </div>
        </section>
      )}
    </PageShell>
  );
}

function ProfileSummary({ profile }) {
  return (
    <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_1fr_0.9fr]">
      <InfoBlock title="Target Users" items={profile.targetUsers} />
      <InfoBlock title="Core Features" items={profile.coreFeatures} />
      <InfoBlock title="Tech Stack" items={profile.techStack} />
      <div className="rounded-2xl border border-white/10 bg-black/20 p-4 lg:col-span-3">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Resume Angle</p>
        <p className="mt-2 text-sm leading-6 text-slate-200">{profile.resumeAngle}</p>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 lg:col-span-3">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Evidence Used</p>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {profile.evidence.map((item) => (
            <p key={item} className="flex gap-2 text-sm leading-6 text-slate-300">
              <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-300" /> {item}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

function InfoBlock({ title, items }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{title}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => (
          <span key={item} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-slate-200">{item}</span>
        ))}
      </div>
    </div>
  );
}

function ProfileEditor({ profile, setProfile, onSave, saving }) {
  const update = (key, value) => setProfile((current) => ({ ...current, [key]: value }));
  return (
    <div className="mt-6 grid gap-4 lg:grid-cols-2">
      <Field label="Project name" value={profile.name} onChange={(value) => update('name', value)} />
      <Field label="Category" value={profile.category} onChange={(value) => update('category', value)} />
      <Field label="What it does" textarea value={profile.problemSolved} onChange={(value) => update('problemSolved', value)} />
      <Field label="Target users" textarea value={profile.targetUsers.join('\n')} onChange={(value) => update('targetUsers', splitLines(value))} />
      <Field label="Core features" textarea value={profile.coreFeatures.join('\n')} onChange={(value) => update('coreFeatures', splitLines(value))} />
      <Field label="Tech stack" textarea value={profile.techStack.join('\n')} onChange={(value) => update('techStack', splitLines(value))} />
      <Field label="Resume angle" textarea value={profile.resumeAngle} onChange={(value) => update('resumeAngle', value)} />
      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <p className="text-sm font-bold text-slate-300">Confidence</p>
        <select
          value={profile.confidence}
          onChange={(event) => update('confidence', Number(event.target.value))}
          className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-white outline-none focus:border-cyan-300/50"
        >
          <option value={85}>High</option>
          <option value={60}>Medium</option>
          <option value={35}>Low</option>
        </select>
        <button
          onClick={onSave}
          disabled={saving}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-100 disabled:cursor-wait disabled:opacity-70"
        >
          <Save className="h-4 w-4" /> Save Profile
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, textarea }) {
  const className = 'mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-sm text-white outline-none focus:border-cyan-300/50';
  return (
    <label className="block rounded-2xl border border-white/10 bg-black/20 p-4">
      <span className="text-sm font-bold text-slate-300">{label}</span>
      {textarea ? (
        <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={4} className={className} />
      ) : (
        <input value={value} onChange={(event) => onChange(event.target.value)} className={className} />
      )}
    </label>
  );
}

function ConfidenceBadge({ value }) {
  const score = normalizeConfidence(value);
  const tone = score >= 70
    ? 'border-emerald-300/25 bg-emerald-300/10 text-emerald-100'
    : score >= 55
      ? 'border-amber-300/25 bg-amber-300/10 text-amber-100'
      : 'border-rose-300/25 bg-rose-300/10 text-rose-100';
  return <span className={`inline-flex items-center rounded-xl border px-4 py-2 text-sm font-black ${tone}`}>{score}% confidence</span>;
}

function normalizeProfile(audit) {
  const profile = audit?.projectProfile || {};
  return {
    name: profile.name || audit?.name || '',
    category: profile.category || audit?.type || 'Software project',
    targetUsers: ensureArray(profile.targetUsers, ['project reviewers']),
    problemSolved: profile.problemSolved || `Helps users complete the main workflow represented by ${audit?.name || 'the uploaded repository'}.`,
    coreFeatures: ensureArray(profile.coreFeatures),
    coreWorkflow: ensureArray(profile.coreWorkflow),
    usageFlow: ensureArray(profile.usageFlow),
    techStack: ensureArray(profile.techStack),
    architecture: profile.architecture || '',
    envVariables: ensureArray(profile.envVariables),
    folderStructure: ensureArray(profile.folderStructure),
    limitations: ensureArray(profile.limitations),
    futureScope: ensureArray(profile.futureScope),
    resumeAngle: profile.resumeAngle || 'A practical, deployable project with clear implementation evidence.',
    confidence: normalizeConfidence(profile.confidence),
    evidence: ensureArray(profile.evidence, ['RepoReady needs a fresh ZIP upload with README/routes/components to infer stronger evidence.']),
  };
}

function cleanProfile(profile) {
  return {
    ...profile,
    targetUsers: ensureArray(profile.targetUsers),
    coreFeatures: ensureArray(profile.coreFeatures),
    coreWorkflow: ensureArray(profile.coreWorkflow),
    usageFlow: ensureArray(profile.usageFlow),
    techStack: ensureArray(profile.techStack),
    envVariables: ensureArray(profile.envVariables),
    folderStructure: ensureArray(profile.folderStructure),
    limitations: ensureArray(profile.limitations),
    futureScope: ensureArray(profile.futureScope),
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

function ensureArray(value, fallback = []) {
  if (Array.isArray(value) && value.length) return value;
  if (typeof value === 'string' && value.trim()) return splitLines(value);
  return fallback;
}

function splitLines(value) {
  return value.split(/\n|,/).map((item) => item.trim()).filter(Boolean);
}
