import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, '..', 'data');
const dataFile = path.join(dataDir, 'audits.json');

export async function listAudits() {
  try {
    const content = await readFile(dataFile, 'utf8');
    return JSON.parse(content);
  } catch {
    return [];
  }
}

export async function getAudit(id) {
  const audits = await listAudits();
  return audits.find((audit) => audit.id === id) || null;
}

export async function saveAudit(audit) {
  const audits = [audit, ...(await listAudits()).filter((item) => item.id !== audit.id)].slice(0, 50);
  await mkdir(dataDir, { recursive: true });
  await writeFile(dataFile, JSON.stringify(audits, null, 2));
  return audits;
}

export async function deleteAudits() {
  await mkdir(dataDir, { recursive: true });
  await writeFile(dataFile, '[]');
}
