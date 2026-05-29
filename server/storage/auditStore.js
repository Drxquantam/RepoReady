import * as dynamoStore from './dynamoStore.js';
import * as fileStore from './fileStore.js';

const isAws = () => process.env.STORAGE_DRIVER === 'aws';

export function listAudits() {
  return isAws() ? dynamoStore.listAudits() : fileStore.listAudits();
}

export function getAudit(id) {
  return isAws() ? dynamoStore.getAudit(id) : fileStore.getAudit(id);
}

export function saveAudit(audit) {
  return isAws() ? dynamoStore.saveAudit(audit) : fileStore.saveAudit(audit);
}

export function deleteAudits() {
  return isAws() ? dynamoStore.deleteAudits() : fileStore.deleteAudits();
}
