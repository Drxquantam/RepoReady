import { Router } from 'express';
import { createAudit, generateAiReadme, generateAiResumePack, reportText } from '../services/auditEngine.js';
import { scanProjectZip } from '../services/projectScanner.js';
import { inferProjectProfile } from '../services/repoAnalyzer.js';
import { saveProjectZip } from '../storage/s3Store.js';
import { deleteAudits, getAudit, listAudits, saveAudit } from '../storage/auditStore.js';
import upload from '../utils/upload.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    res.json({ audits: await listAudits() });
  } catch (error) {
    next(error);
  }
});

router.get('/latest', async (_req, res, next) => {
  try {
    const audits = await listAudits();
    if (!audits[0]) return res.status(404).json({ error: 'No audits found' });
    res.json({ audit: audits[0] });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const audit = await getAudit(req.params.id);
    if (!audit) return res.status(404).json({ error: 'Audit not found' });
    res.json({ audit });
  } catch (error) {
    next(error);
  }
});

router.post('/', upload.single('projectZip'), async (req, res, next) => {
  try {
    const checks = parseChecks(req.body.checks);
    const scan = req.file?.buffer ? scanProjectZip(req.file.buffer) : null;
    const projectProfile = await inferProjectProfile({
      scan,
      fallbackName: req.body.projectName || req.file?.originalname?.replace(/\.zip$/i, ''),
      projectType: req.body.projectType,
    });
    const audit = createAudit({
      projectName: req.body.projectName,
      repoUrl: req.body.repoUrl,
      projectType: req.body.projectType,
      fileName: req.file?.originalname || req.body.fileName,
      fileSize: req.file?.size || 0,
      checks,
      scan,
      projectProfile,
    });
    const archive = await saveProjectZip({
      auditId: audit.id,
      fileName: req.file?.originalname,
      buffer: req.file?.buffer,
      contentType: req.file?.mimetype,
    });
    if (archive) audit.archive = archive;
    await saveAudit(audit);
    res.status(201).json({ audit });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/project-profile', async (req, res, next) => {
  try {
    const audit = await getAudit(req.params.id);
    if (!audit) return res.status(404).json({ error: 'Audit not found' });
    const projectProfile = normalizeProjectProfile(req.body?.projectProfile, audit.projectProfile);
    const updated = {
      ...audit,
      projectProfile,
      name: projectProfile.name || audit.name,
      updatedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    };
    await saveAudit(updated);
    res.json({ audit: updated });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/readme', async (req, res, next) => {
  try {
    const audit = await getRequestedAudit(req.params.id);
    if (!audit) return res.status(404).json({ error: 'Audit not found' });
    res.type('text/plain').send(await generateAiReadme(audit));
  } catch (error) {
    next(error);
  }
});

router.get('/:id/resume-pack', async (req, res, next) => {
  try {
    const audit = await getRequestedAudit(req.params.id);
    if (!audit) return res.status(404).json({ error: 'Audit not found' });
    res.json({ pack: await generateAiResumePack(audit, { style: req.query.style }) });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/report.txt', async (req, res, next) => {
  try {
    const audit = await getRequestedAudit(req.params.id);
    if (!audit) return res.status(404).json({ error: 'Audit not found' });
    res.setHeader('Content-Disposition', `attachment; filename="${audit.name.replace(/\W+/g, '-').toLowerCase()}-report.txt"`);
    res.type('text/plain').send(reportText(audit));
  } catch (error) {
    next(error);
  }
});

router.delete('/', async (_req, res, next) => {
  try {
    await deleteAudits();
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

export default router;

function parseChecks(checks) {
  const defaults = {
    secrets: true,
    readme: true,
    deployment: true,
    structure: true,
    resume: true,
    viva: true,
  };
  if (!checks) return defaults;
  if (typeof checks === 'object') return checks;
  try {
    return JSON.parse(checks);
  } catch {
    return defaults;
  }
}

function normalizeProjectProfile(next = {}, current = {}) {
  return {
    ...current,
    ...next,
    targetUsers: toArray(next.targetUsers ?? current.targetUsers),
    coreFeatures: toArray(next.coreFeatures ?? current.coreFeatures),
    coreWorkflow: toArray(next.coreWorkflow ?? current.coreWorkflow),
    techStack: toArray(next.techStack ?? current.techStack),
    setupCommands: toArray(next.setupCommands ?? current.setupCommands),
    envVariables: toArray(next.envVariables ?? current.envVariables),
    folderStructure: toArray(next.folderStructure ?? current.folderStructure),
    usageFlow: toArray(next.usageFlow ?? current.usageFlow),
    screenshotsNeeded: toArray(next.screenshotsNeeded ?? current.screenshotsNeeded),
    deploymentNotes: toArray(next.deploymentNotes ?? current.deploymentNotes),
    testingNotes: toArray(next.testingNotes ?? current.testingNotes),
    limitations: toArray(next.limitations ?? current.limitations),
    futureScope: toArray(next.futureScope ?? current.futureScope),
    evidence: toArray(next.evidence ?? current.evidence),
  };
}

function toArray(value) {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === 'string') return value.split(/\n|,/).map((item) => item.trim()).filter(Boolean);
  return [];
}

async function getRequestedAudit(id) {
  if (id !== 'latest') return getAudit(id);
  const audits = await listAudits();
  return audits[0] || null;
}
