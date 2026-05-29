const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:4000/api';

export async function apiHealth() {
  return request('/health');
}

export async function fetchAudits() {
  const data = await request('/audits');
  return data.audits || [];
}

export async function fetchAudit(id = 'latest') {
  const data = await request(`/audits/${id}`);
  return data.audit;
}

export async function createServerAudit(form) {
  const body = new FormData();
  body.append('projectName', form.projectName || '');
  body.append('repoUrl', form.repoUrl || '');
  body.append('projectType', form.projectType || 'React');
  body.append('fileName', form.fileName || '');
  body.append('checks', JSON.stringify(form.checks || {}));
  if (form.file) body.append('projectZip', form.file);

  const data = await request('/audits', {
    method: 'POST',
    body,
  });
  return data.audit;
}

export async function deleteServerAudits() {
  await request('/audits', { method: 'DELETE' });
}

export async function fetchAiStatus() {
  return request('/ai/status');
}

export async function fetchReadme(id = 'latest') {
  const response = await fetch(`${API_BASE}/audits/${id}/readme`);
  if (!response.ok) throw new Error('README generation failed');
  return response.text();
}

export async function fetchResumePack(id = 'latest', style = 'Concise') {
  const data = await request(`/audits/${id}/resume-pack?style=${encodeURIComponent(style)}`);
  return data.pack;
}

export async function updateProjectProfile(id, projectProfile) {
  const data = await request(`/audits/${id}/project-profile`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectProfile }),
  });
  return data.audit;
}

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, options);
  } catch {
    throw new Error(`Cannot reach RepoReady API at ${API_BASE}. Make sure the backend is running and refresh the page.`);
  }
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `Request failed: ${response.status}`);
  }
  if (response.status === 204) return null;
  return response.json();
}
