import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

const s3 = new S3Client({ region: process.env.AWS_REGION || 'ap-south-1' });

export async function saveProjectZip({ auditId, fileName, buffer, contentType }) {
  if (process.env.STORAGE_DRIVER !== 'aws' || !buffer) return null;
  if (!process.env.AWS_S3_BUCKET) {
    throw Object.assign(new Error('AWS_S3_BUCKET is required when STORAGE_DRIVER=aws'), { status: 500 });
  }

  const safeName = (fileName || 'project.zip').replace(/[^\w.\-]+/g, '-');
  const key = `uploads/${auditId}/${safeName}`;

  await s3.send(new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType || 'application/zip',
    ServerSideEncryption: 'AES256',
    Metadata: {
      app: 'repoready',
      auditId,
    },
  }));

  return {
    bucket: process.env.AWS_S3_BUCKET,
    key,
  };
}
