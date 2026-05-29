import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, DeleteCommand, GetCommand, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

const client = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' }));
const tableName = process.env.AWS_DYNAMODB_TABLE;

function requireTable() {
  if (!tableName) throw Object.assign(new Error('AWS_DYNAMODB_TABLE is required when STORAGE_DRIVER=aws'), { status: 500 });
}

export async function listAudits() {
  requireTable();
  const result = await client.send(new QueryCommand({
    TableName: tableName,
    KeyConditionExpression: 'pk = :pk',
    ExpressionAttributeValues: { ':pk': 'AUDIT' },
    ScanIndexForward: false,
    Limit: 50,
  }));
  return (result.Items || []).map(fromItem);
}

export async function getAudit(id) {
  requireTable();
  const result = await client.send(new GetCommand({
    TableName: tableName,
    Key: { pk: 'AUDIT', auditId: id },
  }));
  return result.Item ? fromItem(result.Item) : null;
}

export async function saveAudit(audit) {
  requireTable();
  await client.send(new PutCommand({
    TableName: tableName,
    Item: {
      pk: 'AUDIT',
      auditId: audit.id,
      createdAt: audit.createdAt,
      ...audit,
    },
  }));
  return listAudits();
}

export async function deleteAudits() {
  requireTable();
  const audits = await listAudits();
  await Promise.all(audits.map((audit) => client.send(new DeleteCommand({
    TableName: tableName,
    Key: { pk: 'AUDIT', auditId: audit.id },
  }))));
}

function fromItem(item) {
  const { pk: _pk, auditId: _auditId, ...audit } = item;
  return audit;
}
