# S3 Upload Bucket

Create a private S3 bucket such as `repoready-project-uploads`.

Recommended settings:

- Block all public access: enabled
- Default encryption: SSE-S3 or SSE-KMS
- Versioning: optional for v1
- Lifecycle rule: expire raw ZIP uploads after 30-90 days

The App Runner service role needs:

```json
{
  "Effect": "Allow",
  "Action": ["s3:PutObject"],
  "Resource": "arn:aws:s3:::repoready-project-uploads/uploads/*"
}
```
