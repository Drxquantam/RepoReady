# RepoReady AWS Plan

## Implemented First AWS Architecture

- Frontend: AWS Amplify Hosting using `amplify.yml`.
- API: AWS App Runner using `apprunner.yaml` or the included `Dockerfile`.
- Uploads: private S3 bucket through `server/storage/s3Store.js`.
- Audit records: DynamoDB through `server/storage/dynamoStore.js`.
- Logs: structured JSON logs to stdout/stderr, collected by CloudWatch in App Runner.
- Auth: intentionally skipped for v1; add Cognito later.

## Local To AWS Migration

1. Create a private S3 bucket and DynamoDB table.
2. Deploy the backend to App Runner.
3. Set `STORAGE_DRIVER=aws`, `AWS_REGION`, `AWS_S3_BUCKET`, `AWS_DYNAMODB_TABLE`, `CLIENT_URL`, and `GEMINI_API_KEY` in App Runner environment variables.
4. Deploy the frontend to Amplify.
5. Set `VITE_API_URL=https://your-app-runner-url/api` in Amplify environment variables.
6. Add Cognito once user-specific audit history is needed.

## Suggested Environment Variables

```env
AWS_REGION=ap-south-1
AWS_S3_BUCKET=repoready-project-uploads
AWS_DYNAMODB_TABLE=repoready-audits
CLIENT_URL=https://your-frontend-domain.com
```
