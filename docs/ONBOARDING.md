# Developer Onboarding Guide

Welcome to the BusinessMap MCP Server project! This guide will help you set up your local development environment and understand the five-layer quality control system that protects production code.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Credential Setup](#local-credential-setup)
3. [Integration Test Modes](#integration-test-modes)
4. [NPM Token Setup](#npm-token-setup)
5. [Verification Steps](#verification-steps)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have the following installed:

### Required Software

- **Node.js**: Version 18.x, 20.x, or 22.x
  - Check version: `node --version`
  - Download: [nodejs.org](https://nodejs.org/)

- **Git**: Version 2.9 or higher (for Husky hooks support)
  - Check version: `git --version`
  - Download: [git-scm.com](https://git-scm.com/)

- **npm**: Comes with Node.js
  - Check version: `npm --version`
  - Should be version 8.x or higher

### Recommended Tools

- **GitHub CLI (`gh`)**: For branch protection verification
  - Install: `brew install gh` (macOS) or see [cli.github.com](https://cli.github.com/)
  - Authenticate: `gh auth login`

### Getting Started

1. **Clone the repository**:
   ```bash
   git clone https://github.com/neilinger/businessmap-mcp.git
   cd businessmap-mcp
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

   This command automatically:
   - Installs all project dependencies
   - Initializes Husky git hooks (via `prepare` script)
   - Sets up pre-commit and pre-push hooks

3. **Verify installation**:
   ```bash
   npm run build
   npm test
   ```

---

## Local Credential Setup

The BusinessMap MCP Server supports multiple instance configurations. For **pre-push integration tests** to run in **REAL mode** (with actual API connectivity), you need to configure credentials for at least one instance.

### Understanding Instance Configuration

The project uses a multi-instance architecture defined in `businessmap-instances.json`:

- **fimancia**: Test instance at `https://fimancia.kanbanize.com`
- **kerkow**: Test instance at `https://kerkow.kanbanize.com`

Each instance requires its own API token stored in a specific environment variable.

### Step 1: Obtain API Tokens

You need to obtain BusinessMap API tokens from your account administrator or directly from the BusinessMap platform:

1. **Log in to BusinessMap/Kanbanize**:
   - For Fimancia: Navigate to `https://fimancia.kanbanize.com`
   - For Kerkow: Navigate to `https://kerkow.kanbanize.com`

2. **Generate API Token**:
   - Go to **Settings** → **API** or **Account Settings** → **API Access**
   - Click **"Generate New Token"** or **"Create API Token"**
   - Copy the token (you won't be able to see it again!)
   - **Store it securely** (see next step)

3. **Contact Project Maintainer** (if you don't have access):
   - Ask for test instance credentials
   - Mention which instances you need access to (fimancia, kerkow, or both)

### Step 2: Configure Environment Variables

You have two options for storing credentials:

#### Option A: Using `.env` File (Recommended)

1. **Create a `.env` file** in the project root:
   ```bash
   touch .env
   ```

2. **Add your tokens** to `.env`:
   ```bash
   # .env file - DO NOT COMMIT THIS FILE

   # Fimancia instance credentials
   BUSINESSMAP_API_TOKEN_FIMANCIA=your_fimancia_token_here

   # Kerkow instance credentials
   BUSINESSMAP_API_TOKEN_KERKOW=your_kerkow_token_here
   ```

3. **Verify `.env` is gitignored**:
   ```bash
   grep "^\.env$" .gitignore
   ```

   ✅ The `.env` file is already listed in `.gitignore` to prevent accidental commits.

#### Option B: Shell Environment Variables (Alternative)

Add to your shell profile (`.bashrc`, `.zshrc`, etc.):

```bash
# BusinessMap MCP Server - Development Credentials
export BUSINESSMAP_API_TOKEN_FIMANCIA="your_fimancia_token_here"
export BUSINESSMAP_API_TOKEN_KERKOW="your_kerkow_token_here"
```

Then reload your shell:
```bash
source ~/.zshrc  # or ~/.bashrc
```

### Step 3: Verify Credential Setup

Test that credentials are accessible:

```bash
# Check environment variables are set
echo "FIMANCIA: ${BUSINESSMAP_API_TOKEN_FIMANCIA:0:10}..."
echo "KERKOW: ${BUSINESSMAP_API_TOKEN_KERKOW:0:10}..."
```

You should see the first 10 characters of each token (not the full token).

### Minimum Requirements

- **For local development**: At least one token (FIMANCIA or KERKOW)
- **For full integration tests**: Both tokens recommended
- **For CI/contributors**: No tokens required (tests run in MOCK mode)

---

## Integration Test Modes

The integration test suite automatically switches between **REAL** and **MOCK** modes based on credential availability.

### REAL Mode (Local Development with Credentials)

**When it runs**:
- During `git push` via the pre-push hook
- When manually running `npm run test:integration` with credentials present

**What it validates**:
- ✅ Actual server initialization with real BusinessMap API
- ✅ Complete configuration loading (multi-instance and single-instance modes)
- ✅ Environment variable validation with actual credentials
- ✅ API connectivity and authentication
- ✅ Full integration across all server components

**Requirements**:
- At least one of `BUSINESSMAP_API_TOKEN_FIMANCIA` or `BUSINESSMAP_API_TOKEN_KERKOW` must be set
- Not running in CI environment (`CI` env var not set to `"true"`)

**Expected output**:
```
🧪 Integration tests running in REAL mode

✓ Real credentials detected
  - BUSINESSMAP_API_TOKEN_FIMANCIA: present
  - BUSINESSMAP_API_TOKEN_KERKOW: present

PASS tests/integration/server-initialization.test.ts
PASS tests/integration/config-validation.test.ts
PASS tests/integration/env-validation.test.ts
```

**Performance**:
- **No hard time limit** (thoroughness prioritized over speed)
- **Typical duration**: 30-60 seconds
- **Acceptable maximum**: 90+ seconds for comprehensive validation

### MOCK Mode (CI / Contributors Without Credentials)

**When it runs**:
- In GitHub Actions CI workflows (automatically)
- When running `npm run test:integration` without credentials
- When `CI=true` environment variable is set

**What it validates**:
- ✅ Configuration schema validation (JSON structure, required fields)
- ✅ Server initialization with mocked external calls
- ✅ Environment variable presence and format (regex checks)
- ✅ No actual API connectivity required
- ✅ Security: No credentials exposed in CI logs

**Expected output**:
```
🧪 Integration tests running in MOCK mode

✓ Running in CI mode (mock validation only, no API calls)

PASS tests/integration/server-initialization.test.ts
PASS tests/integration/config-validation.test.ts
PASS tests/integration/env-validation.test.ts
```

**Performance**:
- **Timeout**: 10 minutes (CI job timeout)
- **Typical duration**: 5-15 seconds

### How Mode Detection Works

The integration test setup (`tests/integration/setup.ts`) uses **credential presence detection**:

```typescript
// Automatic mode selection
export const TEST_MODE: 'real' | 'mock' =
  process.env.CI === 'true' ||
  (!process.env.BUSINESSMAP_API_TOKEN_FIMANCIA && !process.env.BUSINESSMAP_API_TOKEN_KERKOW)
    ? 'mock'
    : 'real';
```

**Decision logic**:
1. If `CI=true` → **MOCK mode** (GitHub Actions)
2. Else if no credentials present → **MOCK mode** (contributor without access)
3. Else → **REAL mode** (developer with credentials)

### Comparison: REAL vs MOCK Mode

| Feature | REAL Mode | MOCK Mode |
|---------|-----------|-----------|
| **Credentials** | Required | Not required |
| **API Calls** | Yes (live) | No (mocked) |
| **Server Init** | Full initialization | Mocked initialization |
| **Config Validation** | Full Zod schema + API | JSON structure only |
| **Env Validation** | Actual token verification | Presence + format checks |
| **Performance** | 30-90s (unlimited) | 5-15s |
| **Runs In** | Pre-push hook (local) | CI workflows |
| **Catches** | All historical bugs | Schema/structure bugs |

---

## NPM Token Setup

For **automated releases** to work, the project requires an NPM automation token configured in GitHub repository secrets.

### Step 1: Generate NPM Automation Token

1. **Log in to npmjs.com**:
   - Go to [npmjs.com](https://www.npmjs.com/)
   - Sign in with your account credentials

2. **Navigate to Access Tokens**:
   - Click your profile icon → **"Access Tokens"**
   - Or visit: `https://www.npmjs.com/settings/YOUR_USERNAME/tokens`

3. **Generate New Token**:
   - Click **"Generate New Token"** → **"Classic Token"**
   - Select **"Automation"** token type (for CI/CD usage)
   - Enter token name: `businessmap-mcp-github-actions`
   - Click **"Generate Token"**

4. **Copy the token immediately**:
   - ⚠️ **You won't be able to see it again!**
   - Store it temporarily in a password manager

### Step 2: Add Token to GitHub Secrets

1. **Navigate to repository settings**:
   - Go to: `https://github.com/neilinger/businessmap-mcp/settings/secrets/actions`
   - Or: Repository → **Settings** → **Secrets and variables** → **Actions**

2. **Create new secret**:
   - Click **"New repository secret"**
   - Name: `NPM_TOKEN`
   - Value: Paste the token you copied
   - Click **"Add secret"**

3. **Verify secret is set**:
   - You should see `NPM_TOKEN` listed under repository secrets
   - Last updated timestamp should be recent

### Step 3: Token Rotation Schedule

**NPM automation tokens should be rotated regularly for security.**

#### Recommended Schedule

- **Rotation frequency**: Every **90 days** (quarterly)
- **Calendar reminder**: Set up recurring calendar event
- **Responsible party**: Repository maintainer or DevOps lead

#### Rotation Procedure

1. **Generate new token** (follow Step 1 above)
2. **Update GitHub secret** (follow Step 2 above)
3. **Test release workflow**:
   ```bash
   # Trigger test release by merging a fix commit
   git checkout -b test-release
   echo "# Test" >> README.md
   git add README.md
   git commit -m "fix: test npm token rotation"
   git push origin test-release
   # Create and merge PR
   ```
4. **Verify release succeeded**:
   - Check GitHub Actions workflow logs
   - Verify new version published to npm
5. **Delete old token** from npmjs.com (invalidates previous token)

#### Calendar Reminder Template

**Title**: NPM Token Rotation - businessmap-mcp
**Recurrence**: Every 90 days
**Description**:
```
Rotate NPM automation token for businessmap-mcp GitHub Actions:

1. Generate new token: https://www.npmjs.com/settings/YOUR_USERNAME/tokens
2. Update GitHub secret: https://github.com/neilinger/businessmap-mcp/settings/secrets/actions
3. Test release workflow (create test PR with fix: commit)
4. Verify release succeeded
5. Delete old token from npmjs.com

Documentation: docs/ONBOARDING.md#npm-token-setup
```

### Token Expiry Handling

**Symptoms of expired token**:
- GitHub Actions release workflow fails with authentication error
- Error message: `npm ERR! code E401` or `npm ERR! 401 Unauthorized`

**Recovery steps**:
1. Generate new token (Step 1 above)
2. Update GitHub secret (Step 2 above)
3. Re-run failed workflow:
   - Go to failed workflow run
   - Click **"Re-run all jobs"**
4. Verify release completes successfully

---

## Verification Steps

Follow these steps to verify your local development environment is properly configured.

### 1. Verify Git Hooks Are Installed

After `npm install`, hooks should be automatically installed:

```bash
# Check hooks directory exists
ls -la .husky/

# Should show:
# - pre-commit
# - commit-msg
# - pre-push
```

**Expected output**:
```
total 24
drwxr-xr-x   5 user  staff   160 Nov  8 12:00 .
drwxr-xr-x  25 user  staff   800 Nov  8 12:00 ..
drwxr-xr-x   3 user  staff    96 Nov  8 12:00 _
-rwxr-xr-x   1 user  staff   134 Nov  8 12:00 commit-msg
-rwxr-xr-x   1 user  staff   189 Nov  8 12:00 pre-commit
-rwxr-xr-x   1 user  staff   421 Nov  8 12:00 pre-push
```

### 2. Test Pre-Commit Hook (Fast Feedback)

The pre-commit hook runs **lint, format, and type checks** on staged files.

**Test with intentional error**:

```bash
# Create a file with linting error
echo "const x = 'unused variable'" > test-lint.ts

# Stage and attempt commit
git add test-lint.ts
git commit -m "test: verify pre-commit hook"
```

**Expected output** (hook blocks commit):
```
✓ Preparing lint-staged...
⚠ Running tasks for staged files...
  ❯ *.{ts,tsx}
    ✖ eslint --fix [FAILED]
    ◼ prettier --write
    ◼ bash -c 'tsc --noEmit'
✖ eslint --fix:

  /path/to/test-lint.ts
    1:7  error  'x' is assigned a value but never used  @typescript/no-unused-vars

✖ 1 problem (1 error, 0 warnings)

❌ ESLint errors found. Run: npm run lint:fix
```

**Clean up**:
```bash
git reset HEAD test-lint.ts
rm test-lint.ts
```

**Test with valid code**:
```bash
# Create a valid file
echo "export const greeting = 'Hello, world!';" > test-valid.ts

# Stage and commit
git add test-valid.ts
git commit -m "test: verify pre-commit passes"
```

**Expected output** (hook succeeds in < 2 seconds):
```
✓ Preparing lint-staged...
✓ Running tasks for staged files...
✓ Applying modifications from tasks...
✓ Cleaning up temporary files...
[branch 1a2b3c4] test: verify pre-commit passes
 1 file changed, 1 insertion(+)
```

### 3. Test Commit Message Validation

The commit-msg hook enforces **conventional commit format**.

**Test with invalid message**:
```bash
git commit --allow-empty -m "Fixed bug"
```

**Expected output** (hook blocks commit):
```
⧗   input: Fixed bug
✖   subject may not be empty [subject-empty]
✖   type may not be empty [type-empty]

✖   found 2 problems, 0 warnings
ⓘ   Get help: https://github.com/conventional-changelog/commitlint/#what-is-commitlint

❌ Commit message validation failed.

Valid formats:
  - fix: resolve timeout error
  - feat: add dark mode support
  - fix(api): correct authentication flow
  - docs(readme): update installation steps

Commit types: feat, fix, docs, style, refactor, test, chore, perf, ci, build, revert
Scope: optional and freeform (e.g., "api", "ui", "docs")
```

**Test with valid message**:
```bash
# Valid: type + description
git commit --allow-empty -m "fix: resolve timeout error"

# Valid: type + scope + description
git commit --allow-empty -m "feat(auth): add JWT token support"
```

**Expected output** (hook succeeds):
```
[branch 2b3c4d5] fix: resolve timeout error
```

### 4. Test Pre-Push Hook (Integration Tests)

The pre-push hook runs **full integration tests** (30-90 seconds with real credentials).

**Prerequisites**:
- Ensure credentials are configured (see [Local Credential Setup](#local-credential-setup))
- Commit all changes first

**Test push with credentials**:
```bash
# Ensure on a feature branch
git checkout -b test-integration

# Make a trivial change and commit
echo "# Test" >> README.md
git add README.md
git commit -m "test: verify integration tests"

# Attempt push (triggers pre-push hook)
git push origin test-integration
```

**Expected output** (REAL mode with credentials):
```
⏱️  Running integration tests (may take 30+ seconds)...

🧪 Integration tests running in REAL mode

✓ Real credentials detected
  - BUSINESSMAP_API_TOKEN_FIMANCIA: present
  - BUSINESSMAP_API_TOKEN_KERKOW: present

 PASS  tests/integration/server-initialization.test.ts (12.3s)
 PASS  tests/integration/config-validation.test.ts (8.7s)
 PASS  tests/integration/env-validation.test.ts (15.2s)

Test Suites: 3 passed, 3 total
Tests:       9 passed, 9 total
Snapshots:   0 total
Time:        38.451 s

✅ Completed in 39s
```

**Test push without credentials** (MOCK mode):
```bash
# Temporarily unset credentials
unset BUSINESSMAP_API_TOKEN_FIMANCIA
unset BUSINESSMAP_API_TOKEN_KERKOW

# Attempt push
git push origin test-integration
```

**Expected output** (MOCK mode):
```
⏱️  Running integration tests (may take 30+ seconds)...

🧪 Integration tests running in MOCK mode

✓ Running in CI mode (mock validation only, no API calls)

 PASS  tests/integration/server-initialization.test.ts (2.1s)
 PASS  tests/integration/config-validation.test.ts (1.8s)
 PASS  tests/integration/env-validation.test.ts (2.3s)

Test Suites: 3 passed, 3 total
Tests:       9 passed, 9 total
Snapshots:   0 total
Time:        6.842 s

✅ Completed in 7s
```

**Clean up**:
```bash
git checkout main
git branch -D test-integration
```

### 5. Verify Branch Protection (Main Branch)

**Check branch protection status**:
```bash
# Using GitHub CLI (recommended)
gh api repos/neilinger/businessmap-mcp/branches/main/protection | jq '.required_status_checks'

# Or run setup script (idempotent, safe to re-run)
bash scripts/setup-branch-protection.sh
```

**Expected output**:
```json
{
  "strict": true,
  "contexts": [
    "CI / Test (Node 18.x)",
    "CI / Test (Node 20.x)",
    "CI / Test (Node 22.x)",
    "CI / Code Quality",
    "CI / Pre-commit Validation",
    "CI / Integration Tests (Mock)"
  ]
}
```

**Test direct push to main** (should be blocked):
```bash
git checkout main
echo "# Test" >> README.md
git add README.md
git commit -m "test: verify branch protection"
git push origin main
```

**Expected output** (push rejected):
```
remote: error: GH006: Protected branch update failed for refs/heads/main.
remote: error: Required status checks must pass before merging
To github.com:neilinger/businessmap-mcp.git
 ! [remote rejected] main -> main (protected branch hook declined)
error: failed to push some refs to 'github.com:neilinger/businessmap-mcp.git'
```

### 6. Test Full CI Workflow

**Create a test PR**:
```bash
# Create feature branch
git checkout -b test-ci-workflow

# Make changes
echo "// Test comment" >> src/index.ts
git add src/index.ts
git commit -m "test: verify CI workflow"

# Push and create PR
git push origin test-ci-workflow
gh pr create --title "Test: CI Workflow" --body "Testing all CI checks"
```

**Monitor CI checks**:
- Go to the PR page on GitHub
- Watch the status checks run:
  - ✅ CI / Test (Node 18.x, 20.x, 22.x)
  - ✅ CI / Code Quality
  - ✅ CI / Pre-commit Validation
  - ✅ CI / Integration Tests (Mock)

**Expected behavior**:
- All checks should pass (green checkmarks)
- Merge button should be enabled after checks pass
- Merging should trigger automated release workflow

**Clean up**:
```bash
# Close PR without merging
gh pr close test-ci-workflow
git checkout main
git branch -D test-ci-workflow
git push origin --delete test-ci-workflow
```

---

## Troubleshooting

### Issue: Pre-commit hook not running

**Symptoms**:
- Commits succeed without lint/format checks
- No output from lint-staged

**Diagnosis**:
```bash
# Check if Husky is installed
ls .husky/

# Check if pre-commit hook is executable
ls -l .husky/pre-commit
```

**Solution**:
```bash
# Reinstall hooks
npm run prepare

# Make hooks executable
chmod +x .husky/*

# Verify
git commit --allow-empty -m "test: verify hooks"
```

### Issue: Integration tests fail with "Missing credentials"

**Symptoms**:
```
❌ ERROR: Integration tests require real credentials locally

Missing environment variables:
  - BUSINESSMAP_API_TOKEN_FIMANCIA
  - BUSINESSMAP_API_TOKEN_KERKOW
```

**Diagnosis**:
```bash
# Check if credentials are set
echo "FIMANCIA: ${BUSINESSMAP_API_TOKEN_FIMANCIA:+SET}"
echo "KERKOW: ${BUSINESSMAP_API_TOKEN_KERKOW:+SET}"
```

**Solution**:
1. **Add credentials to `.env` file** (see [Local Credential Setup](#local-credential-setup))
2. **Verify `.env` is loaded**:
   ```bash
   # In package.json, test:integration should load .env
   grep "test:integration" package.json
   ```
3. **Manually run with credentials**:
   ```bash
   export BUSINESSMAP_API_TOKEN_FIMANCIA="your_token"
   export BUSINESSMAP_API_TOKEN_KERKOW="your_token"
   npm run test:integration
   ```

### Issue: Integration tests timeout (> 10 minutes)

**Symptoms**:
- Tests hang or timeout in pre-push hook
- Error: `ETIMEDOUT` or `ECONNREFUSED`

**Diagnosis**:
```bash
# Test API connectivity
curl -H "Authorization: Bearer $BUSINESSMAP_API_TOKEN_FIMANCIA" \
  https://fimancia.kanbanize.com/api/v2/workspaces
```

**Solutions**:
1. **Check network connectivity** (VPN, firewall)
2. **Verify API tokens are valid** (not expired/revoked)
3. **Run tests in MOCK mode** (temporary workaround):
   ```bash
   CI=true npm run test:integration
   ```
4. **Skip pre-push hook** (NOT recommended, CI will re-run tests):
   ```bash
   git push --no-verify
   ```

### Issue: Commit message validation fails unexpectedly

**Symptoms**:
```
✖   type may not be empty [type-empty]
```

**Common mistakes**:
- Missing colon: `fix resolve bug` (should be `fix: resolve bug`)
- Uppercase type: `Fix: resolve bug` (should be `fix: resolve bug`)
- Wrong type: `fixed: resolve bug` (should be `fix: resolve bug`)

**Valid formats**:
```bash
# Correct
git commit -m "fix: resolve authentication timeout"
git commit -m "feat(api): add workspace filtering"
git commit -m "docs: update onboarding guide"

# Incorrect
git commit -m "Fixed authentication timeout"
git commit -m "fix - resolve timeout"
git commit -m "FIX: resolve timeout"
```

### Issue: Branch protection not enforced

**Symptoms**:
- Direct pushes to main succeed (should be blocked)
- PR can be merged without status checks passing

**Diagnosis**:
```bash
# Check branch protection status
gh api repos/neilinger/businessmap-mcp/branches/main/protection
```

**Solution**:
```bash
# Re-run branch protection setup (idempotent)
bash scripts/setup-branch-protection.sh

# Verify required checks are set
gh api repos/neilinger/businessmap-mcp/branches/main/protection | \
  jq '.required_status_checks.contexts'
```

### Issue: NPM token authentication fails in CI

**Symptoms**:
- Release workflow fails with `npm ERR! code E401`
- Error: `401 Unauthorized - PUT https://registry.npmjs.org/@neilinger%2fbusinessmap-mcp`

**Diagnosis**:
1. **Check token is set**:
   - Go to: `https://github.com/neilinger/businessmap-mcp/settings/secrets/actions`
   - Verify `NPM_TOKEN` exists and was updated recently

2. **Check token permissions**:
   - Go to: `https://www.npmjs.com/settings/YOUR_USERNAME/tokens`
   - Verify token type is **"Automation"**
   - Verify token is **not expired**

**Solution**:
1. **Rotate token** (see [NPM Token Setup](#npm-token-setup))
2. **Update GitHub secret** with new token
3. **Re-run failed workflow**:
   ```bash
   # From failed workflow run page
   Click "Re-run all jobs"
   ```

### Issue: Tests pass locally but fail in CI

**Symptoms**:
- `npm run test:integration` succeeds locally
- CI workflow "Integration Tests (Mock)" fails

**Diagnosis**:
```bash
# Run tests in MOCK mode locally (simulate CI)
CI=true npm run test:integration
```

**Common causes**:
1. **Tests depend on credentials** (should use mocks in CI)
2. **Tests depend on local files** (not committed to git)
3. **Tests depend on local environment** (different Node versions)

**Solution**:
1. **Review test files** (`tests/integration/*.test.ts`)
2. **Ensure tests respect TEST_MODE**:
   ```typescript
   import { TEST_MODE } from './setup';

   if (TEST_MODE === 'mock') {
     // Use mocked validation
   } else {
     // Use real API calls
   }
   ```
3. **Test across Node versions** (18.x, 20.x, 22.x):
   ```bash
   nvm use 18 && npm run test:integration
   nvm use 20 && npm run test:integration
   nvm use 22 && npm run test:integration
   ```

---

## Next Steps

After completing onboarding:

1. **Read the architecture docs**:
   - `docs/MULTI_INSTANCE_IMPLEMENTATION.md` - Multi-instance architecture
   - `specs/002-quality-control-system/spec.md` - Quality control system design

2. **Review the five-layer quality system**:
   - **Layer 1**: Pre-commit hooks (lint, format, type-check) [< 2s]
   - **Layer 2**: Commit message validation (conventional commits)
   - **Layer 3**: Pre-push hooks (integration tests) [30-90s]
   - **Layer 4**: CI workflows (all checks in parallel) [< 10 min]
   - **Layer 5**: Branch protection + automated releases [< 5 min]

3. **Explore the codebase**:
   - `src/` - TypeScript source code
   - `tests/integration/` - Integration test suite
   - `.husky/` - Git hook configurations
   - `.github/workflows/` - CI/CD workflows

4. **Join the team**:
   - Ask questions in team channels
   - Review open issues and PRs
   - Contribute improvements to this guide!

---

## Additional Resources

- **Project README**: [README.md](/README.md)
- **Quality Control Spec**: [specs/002-quality-control-system/spec.md](/specs/002-quality-control-system/spec.md)
- **Contributing Guide**: (if available)
- **GitHub Issues**: [github.com/neilinger/businessmap-mcp/issues](https://github.com/neilinger/businessmap-mcp/issues)
- **npm Package**: [npmjs.com/package/@neilinger/businessmap-mcp](https://www.npmjs.com/package/@neilinger/businessmap-mcp)

---

## Feedback

Found an issue with this guide? Please:

1. **Open an issue**: [Create Issue](https://github.com/neilinger/businessmap-mcp/issues/new)
2. **Submit a PR**: Improve this documentation directly
3. **Ask in team chat**: Get help from maintainers

**Last updated**: 2025-11-08
**Spec reference**: T057, T060a (Five-Layer Quality Control System)
