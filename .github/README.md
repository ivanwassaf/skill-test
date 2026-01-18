# CI/CD Pipeline Documentation

## Overview

This project uses GitHub Actions for continuous integration and deployment. The pipeline ensures code quality, runs tests, builds artifacts, and deploys to staging/production environments.

## Workflows

### 1. **CI/CD Pipeline** (`.github/workflows/ci-cd.yml`)

Main workflow that runs on every push and pull request to `main` and `develop` branches.

**Jobs:**
- **Lint** - Code quality checks (ESLint)
- **Unit Tests** - Run unit tests for backend
- **Integration Tests** - Run integration tests with PostgreSQL and Redis
- **Coverage** - Generate test coverage reports (minimum 70%)
- **Security** - NPM audit for vulnerabilities
- **Build Backend** - Build and package backend application
- **Build Frontend** - Build and bundle frontend application
- **Docker Build** - Build Docker images (on main branch only)
- **Deploy** - Deploy to staging (on main branch only)
- **Notify** - Send notifications on completion

**Services:**
- PostgreSQL 15 (for integration tests)
- Redis 7 (for cache tests)

**Artifacts:**
- Test results (unit & integration)
- Coverage reports
- Build artifacts (backend & frontend)
- Security audit reports

### 2. **Pull Request Checks** (`.github/workflows/pr-checks.yml`)

Runs additional quality checks on pull requests.

**Checks:**
- ✅ PR title follows conventional commits format
- ✅ PR has description
- ✅ No merge conflicts
- ✅ Bundle size check
- ✅ Dependency review
- ✅ Coverage comment on PR

**Required PR Title Format:**
```
feat: add new feature
fix: resolve bug
docs: update documentation
style: formatting changes
refactor: code restructuring
test: add tests
chore: maintenance
perf: performance improvements
```

### 3. **Release** (`.github/workflows/release.yml`)

Automated release process triggered by version tags.

**Triggers:**
```bash
git tag v1.0.0
git push origin v1.0.0
```

**Actions:**
- Create GitHub release with changelog
- Build and publish Docker images with version tag
- Deploy to production environment
- Send release notifications

## Environment Variables

### Required Secrets

Set these in GitHub repository settings: **Settings → Secrets → Actions**

```bash
# Docker Hub (for image publishing)
DOCKER_USERNAME=your_dockerhub_username
DOCKER_PASSWORD=your_dockerhub_token

# Codecov (optional - for coverage reports)
CODECOV_TOKEN=your_codecov_token

# Deployment (if using cloud providers)
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret

# Notifications (optional)
SLACK_WEBHOOK_URL=your_slack_webhook
```

### Environment-Specific Variables

**Staging:**
```bash
VITE_API_URL=https://api-staging.yourapp.com
DATABASE_URL=postgresql://user:pass@staging-db:5432/db
```

**Production:**
```bash
VITE_API_URL=https://api.yourapp.com
DATABASE_URL=postgresql://user:pass@prod-db:5432/db
```

## Running Locally

### Prerequisites
```bash
# Install dependencies
cd backend && npm install
cd frontend && npm install
```

### Tests
```bash
# Unit tests
npm run test:unit

# Integration tests (requires PostgreSQL & Redis)
npm run test:integration

# Coverage
npm run test:coverage
```

### Build
```bash
# Backend
cd backend
npm run build

# Frontend
cd frontend
npm run build
```

## Coverage Requirements

- **Minimum threshold:** 70%
- **Target:** 80%+
- Pipeline fails if coverage drops below 70%

View coverage reports:
- Local: `backend/coverage/index.html`
- CI: Check workflow artifacts

## Branch Protection

Recommended branch protection rules for `main`:

- ✅ Require pull request reviews (1+ approvals)
- ✅ Require status checks to pass:
  - `Lint Code`
  - `Unit Tests`
  - `Integration Tests`
  - `Test Coverage`
  - `Security Audit`
- ✅ Require branches to be up to date
- ✅ Require signed commits
- ✅ Include administrators

## Deployment

### Staging
- **Trigger:** Push to `main` branch
- **URL:** https://staging.yourapp.com
- **Auto-deploy:** Yes

### Production
- **Trigger:** Tag with version (e.g., `v1.0.0`)
- **URL:** https://yourapp.com
- **Manual approval:** Required

## Notifications

Configure notifications in workflow files:

**Slack:**
```yaml
- name: Notify Slack
  uses: slackapi/slack-github-action@v1
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
```

**Discord:**
```yaml
- name: Notify Discord
  uses: sarisia/actions-status-discord@v1
  with:
    webhook: ${{ secrets.DISCORD_WEBHOOK }}
```

## Troubleshooting

### Tests Failing
1. Check test logs in workflow artifacts
2. Run tests locally with same environment
3. Verify database/Redis services are healthy

### Build Failures
1. Check Node.js version (18.x required)
2. Clear npm cache: `npm ci` instead of `npm install`
3. Verify all dependencies are in `package.json`

### Coverage Below Threshold
1. Add more tests for uncovered code
2. Check `coverage/lcov-report/index.html` for details
3. Focus on critical business logic

### Docker Build Issues
1. Verify Dockerfile syntax
2. Check Docker Hub credentials
3. Ensure base images are accessible

## Best Practices

1. **Conventional Commits** - Use semantic commit messages
2. **Small PRs** - Keep PRs focused and under 50 files
3. **Tests First** - Write tests before merging
4. **Coverage** - Maintain >70% coverage
5. **Security** - Fix high/critical vulnerabilities immediately
6. **Dependencies** - Keep dependencies up to date (Dependabot)
7. **Documentation** - Update docs with code changes

## Monitoring

### Pipeline Health
- View status: https://github.com/your-org/your-repo/actions
- Success rate: Target >95%
- Average duration: <10 minutes

### Metrics to Track
- ✅ Test success rate
- ✅ Coverage trend
- ✅ Build time
- ✅ Deployment frequency
- ✅ Mean time to recovery (MTTR)

## Support

For CI/CD issues:
1. Check workflow logs
2. Review this documentation
3. Contact DevOps team
4. Create issue with `ci/cd` label
