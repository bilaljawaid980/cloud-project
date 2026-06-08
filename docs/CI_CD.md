# ClipForge CI/CD

ClipForge now includes a GitHub Actions workflow for production deployment:

```text
.github/workflows/deploy.yml
```

The workflow runs on:

- every push to `main`
- manual `workflow_dispatch`

## What The Workflow Does

1. Checks out the repository.
2. Installs Bun.
3. Configures AWS credentials from GitHub secrets.
4. Installs root and `infra` dependencies.
5. Runs TypeScript type-checking.
6. Bootstraps AWS CDK in the active AWS account and region.
7. Deploys `ClipForgeStack`.
8. Reads stack outputs:
   - frontend S3 bucket
   - frontend CloudFront distribution ID
   - raw Lambda Function URL
9. Builds the frontend with:
   - primary API URL: `https://api.clipforged.xyz`
   - fallback API URL: raw Lambda Function URL from stack output
10. Uploads frontend assets to S3.
11. Uploads `index.html` with no-cache headers.
12. Invalidates the frontend CloudFront distribution.
13. Runs a health check against `https://api.clipforged.xyz/health`.

## Required GitHub Secrets

Add these in GitHub:

```text
Repository -> Settings -> Secrets and variables -> Actions -> New repository secret
```

Required secrets:

| Secret | Purpose |
| --- | --- |
| `AWS_ACCESS_KEY_ID` | AWS IAM access key used by GitHub Actions. |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM secret key used by GitHub Actions. |
| `JWT_SECRET` | 32+ character production JWT signing secret. |

The AWS IAM user/role used by these secrets must be allowed to deploy CDK, create/update CloudFormation stacks, publish Docker image assets to ECR, manage Lambda, S3, CloudFront, DynamoDB, Route53, ACM, SQS, IAM roles/policies, SSM bootstrap parameters, and CloudWatch logs.

## Domain Requirement

The workflow expects a Route53 hosted zone for:

```text
clipforged.xyz
```

Important after teardown: the previous hosted zone was deleted, so a fresh hosted zone must exist before the custom-domain deployment can succeed.

Before running CI/CD for a full custom-domain redeploy:

1. Create or restore a Route53 hosted zone for `clipforged.xyz`.
2. Copy the hosted zone nameservers.
3. Update Porkbun custom nameservers to those Route53 nameservers.
4. Wait until public DNS resolves the Route53 nameservers.
5. Run the GitHub Actions workflow.

Why this matters:

- CDK creates DNS-validated ACM certificates for `clipforged.xyz`, `www.clipforged.xyz`, `api.clipforged.xyz`, and `lambda.clipforged.xyz`.
- ACM certificate validation only succeeds if Porkbun delegates the domain to the active Route53 hosted zone.

## Current Workflow Environment

The workflow uses these production values:

| Variable | Value |
| --- | --- |
| `AWS_REGION` | `us-east-1` |
| `STACK_NAME` | `ClipForgeStack` |
| `NODE_ENV` | `production` |
| `DEV_MODE` | `false` |
| `APP_DOMAIN_NAME` | `clipforged.xyz` |
| `APP_HOSTED_ZONE_NAME` | `clipforged.xyz` |
| `API_DOMAIN_NAME` | `api.clipforged.xyz` |
| `LAMBDA_DOMAIN_NAME` | `lambda.clipforged.xyz` |
| `APP_ORIGIN` | `https://clipforged.xyz,https://www.clipforged.xyz` |
| `API_BASE_URL` | `https://api.clipforged.xyz` |

## Manual Run

To run CI/CD manually:

1. Open GitHub repository.
2. Go to **Actions**.
3. Select **ClipForge CI/CD**.
4. Click **Run workflow**.
5. Choose branch `main`.

## Notes

- The workflow does not store AWS secrets in the repo.
- The workflow discovers bucket and distribution IDs from CloudFormation outputs after deploy.
- If the domain has not been delegated to Route53, the workflow can fail during ACM certificate validation.
- If only code checks are needed without deployment, create a separate PR-only CI workflow later.
