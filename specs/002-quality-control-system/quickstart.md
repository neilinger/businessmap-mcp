# Quickstart: Five-Layer Quality Control System

**Date**: 2025-11-02
**Feature**: [spec.md](spec.md)
**Plan**: [plan.md](plan.md)

## Purpose

This guide provides step-by-step setup instructions for implementing the five-layer quality control system. Follow these steps to prevent production bugs through automated quality gates.

---

## Prerequisites

- **Repository Admin Access**: Required for GitHub branch protection configuration
- **NPM Account**: For publishing packages (NPM_TOKEN secret)
- **Node.js**: Version 18.x, 20.x, or 22.x
- **Git**: Version 2.9+ (for Husky hooks support)
- **Platform**: macOS or Linux (Windows not supported per spec)

---

## Layer 1: Branch Protection (10 minutes)

### Step 1.1: Configure Branch Protection

```bash
# Navigate to repository root
cd /Users/neil/src/solo/businessmap-mcp

# Configure branch protection via GitHub API
gh api repos/neilinger/businessmap-mcp/branches/main/protection \
  -X PUT \
  --input - <<'EOF'
{
  "required_status_checks": {
    "strict": true,
    "contexts": [
      "CI / Test (Node 18.x)",
      "CI / Test (Node 20.x)",
      "CI / Test (Node 22.x)",
      "CI / Code Quality"
    ]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": null,
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
EOF
```

### Step 1.2: Verify Configuration

```bash
# Check branch protection status
gh api repos/neilinger/businessmap-mcp/branches/main/protection | jq

# Verify required status checks
gh api repos/neilinger/businessmap-mcp/branches/main/protection/required_status_checks
```

**Expected Outcome**: Direct pushes to main blocked, PR merge requires all CI checks to pass

---

## Layer 2: Pre-commit Hooks (30-60 minutes)

### Step 2.1: Install Dependencies

```bash
# Install Husky and lint-staged
npm install --save-dev husky lint-staged

# Initialize Husky
npx husky install

# Configure Husky to auto-install on npm install
npm pkg set scripts.prepare="husky install"
```

### Step 2.2: Configure lint-staged

Add to `package.json`:

```json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write",
      "bash -c 'tsc --noEmit'"
    ],
    "*.{json,md}": [
      "prettier --write"
    ]
  }
}
```

### Step 2.3: Create Pre-commit Hook

```bash
# Create pre-commit hook
npx husky add .husky/pre-commit "npx lint-staged"

# Make executable
chmod +x .husky/pre-commit
```

### Step 2.4: Test Hook

```bash
# Make a test change
echo "console.log('test')" >> test-file.ts
git add test-file.ts

# Attempt commit (should run hooks)
git commit -m "test: verify pre-commit hooks"

# Clean up
git reset HEAD~1
rm test-file.ts
```

**Expected Outcome**: Hooks run in <2 seconds, code auto-formatted and type-checked

---

## Layer 3: Conventional Commit Enforcement (15 minutes)

### Step 3.1: Install commitlint

```bash
# Install commitlint packages
npm install --save-dev @commitlint/cli @commitlint/config-conventional
```

### Step 3.2: Configure commitlint

Create `.commitlintrc.json`:

```json
{
  "extends": ["@commitlint/config-conventional"],
  "rules": {
    "type-enum": [
      2,
      "always",
      [
        "feat",
        "fix",
        "docs",
        "style",
        "refactor",
        "test",
        "chore",
        "perf",
        "ci",
        "build",
        "revert"
      ]
    ],
    "subject-case": [2, "never", ["upper-case"]],
    "header-max-length": [2, "always", 100]
  }
}
```

### Step 3.3: Create Commit-msg Hook

```bash
# Create commit-msg hook
npx husky add .husky/commit-msg 'npx --no -- commitlint --edit $1'

# Make executable
chmod +x .husky/commit-msg
```

### Step 3.4: Test Hook

```bash
# Test invalid commit message
git commit --allow-empty -m "Added feature"  # Should fail

# Test valid commit message
git commit --allow-empty -m "feat: add feature"  # Should succeed
```

**Expected Outcome**: Invalid commit messages blocked with format examples

---

## Layer 4: CI Enhancement (30 minutes)

### Step 4.1: Update CI Workflow

Edit `.github/workflows/ci.yml` to add new jobs:

```yaml
jobs:
  # NEW: Pre-commit validation job
  pre-commit-validation:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - name: Validate pre-commit hooks
        run: npx lint-staged --no-stash

  # NEW: Integration tests job
  integration-tests:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18.x, 20.x, 22.x]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
      - run: npm ci
      - run: npm run build
      - name: Integration Tests
        run: npm run test:integration

  # EXISTING: Build and test jobs (preserved)
  build:
    # ... existing config ...

  code-quality:
    # ... existing config ...
```

### Step 4.2: Add Test Script

Add to `package.json`:

```json
{
  "scripts": {
    "test:integration": "NODE_OPTIONS=--experimental-vm-modules jest tests/integration"
  }
}
```

### Step 4.3: Create Integration Tests

See Layer 6 (Baseline Integration Tests) below for test implementation.

**Expected Outcome**: CI catches bypassed pre-commit hooks and runs integration tests

---

## Layer 5: Automated Release Workflow (1-2 hours)

### Step 5.1: Install semantic-release

```bash
# Install semantic-release packages
npm install --save-dev \
  semantic-release \
  @semantic-release/git \
  @semantic-release/changelog \
  @semantic-release/npm \
  @semantic-release/github
```

### Step 5.2: Configure semantic-release

Create `.releaserc.json`:

```json
{
  "branches": ["main"],
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    [
      "@semantic-release/changelog",
      {
        "changelogFile": "CHANGELOG.md"
      }
    ],
    "@semantic-release/npm",
    [
      "@semantic-release/git",
      {
        "assets": ["CHANGELOG.md", "package.json", "package-lock.json"],
        "message": "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}"
      }
    ],
    "@semantic-release/github"
  ]
}
```

### Step 5.3: Create Release Workflow

Create `.github/workflows/release.yml`:

```yaml
name: Release

on:
  push:
    branches:
      - main

jobs:
  release:
    name: Release
    runs-on: ubuntu-latest
    permissions:
      contents: write
      issues: write
      pull-requests: write
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
        run: npx semantic-release
```

### Step 5.4: Configure NPM Token

```bash
# Generate NPM token (automation type)
# Visit: https://www.npmjs.com/settings/YOUR_USERNAME/tokens

# Add to GitHub secrets
gh secret set NPM_TOKEN
# Paste token when prompted
```

### Step 5.5: Test Release (Dry Run)

```bash
# Test release without publishing
npx semantic-release --dry-run
```

**Expected Outcome**: Automated releases trigger on merge to main, complete within 5 minutes

---

## Layer 6: Baseline Integration Tests (4-6 hours)

### Step 6.1: Create Test Structure

```bash
# Create integration test directories
mkdir -p tests/integration
mkdir -p tests/fixtures/configs
```

### Step 6.2: Create Test Fixtures

Create `tests/fixtures/configs/multi-instance.json`:

```json
{
  "version": "1.0",
  "defaultInstance": "fimancia",
  "instances": [
    {
      "name": "fimancia",
      "apiUrl": "https://fimancia.kanbanize.com/api/v2",
      "apiTokenEnv": "BUSINESSMAP_API_TOKEN_FIMANCIA",
      "description": "Fimancia test instance"
    }
  ]
}
```

Create `tests/fixtures/configs/invalid-schema.json`:

```json
{
  "version": "1.0",
  "defaultInstance": "prod",
  "instances": [
    {
      "name": "prod",
      "apiUrl": "https://test.businessmap.io/api/v2",
      "apiTokenEnvVar": "PROD_TOKEN"
    }
  ]
}
```

### Step 6.3: Create Server Startup Test

Create `tests/integration/server-startup.test.ts`:

```typescript
import path from 'path';

describe('Server Startup', () => {
  it('should load all modules without import errors', () => {
    // Catches: LRUCache named import vs default import
    expect(() => require('../../src/index')).not.toThrow();
  });

  it('should start server in multi-instance mode', async () => {
    const configPath = path.join(__dirname, '../fixtures/configs/multi-instance.json');

    // Note: Uses placeholder tokens in CI (no real secrets)
    process.env.BUSINESSMAP_API_TOKEN_FIMANCIA = 'test-token';

    const { startServer } = require('../../src/index');
    const server = await startServer({ configPath });

    expect(server).toBeDefined();
    // Add assertions based on actual server interface
  });
});
```

### Step 6.4: Create Config Loading Test

Create `tests/integration/config-loading.test.ts`:

```typescript
import path from 'path';

describe('Config Loading', () => {
  it('should accept valid multi-instance config', async () => {
    const configPath = path.join(__dirname, '../fixtures/configs/multi-instance.json');
    const { loadConfig } = require('../../src/config/instance-manager');

    const config = await loadConfig({ configPath });

    expect(config.instances).toHaveLength(1);
    expect(config.instances[0]).toHaveProperty('apiTokenEnv');
  });

  it('should REJECT config with wrong field names', async () => {
    const configPath = path.join(__dirname, '../fixtures/configs/invalid-schema.json');
    const { loadConfig } = require('../../src/config/instance-manager');

    await expect(loadConfig({ configPath }))
      .rejects.toThrow(/apiTokenEnv/);
  });
});
```

### Step 6.5: Run Integration Tests

```bash
# Run integration tests locally
npm run test:integration

# Verify tests catch all 3 historical bugs
```

**Expected Outcome**: Integration tests catch import errors, config mismatches, env validation bugs

---

## Verification Checklist

After completing all layers, verify:

- [ ] **Layer 1**: Direct push to main rejected (test: `git push origin main`)
- [ ] **Layer 2**: Pre-commit hooks run in <2 seconds (test: `git commit`)
- [ ] **Layer 3**: Invalid commit messages blocked (test: `git commit -m "Invalid"`)
- [ ] **Layer 4**: CI validates pre-commit hooks + runs integration tests
- [ ] **Layer 5**: Merge to main triggers automated release within 5 minutes
- [ ] **Layer 6**: Integration tests catch all 3 historical bug types

---

## Troubleshooting

### Hooks Not Running

```bash
# Reinstall Husky
npm run prepare

# Verify hook files exist
ls -la .husky/

# Check permissions
chmod +x .husky/pre-commit
chmod +x .husky/commit-msg
```

### CI Failing on Hook Validation

```bash
# Ensure lint-staged works without git
npx lint-staged --no-stash
```

### Release Not Triggering

```bash
# Check NPM_TOKEN secret
gh secret list

# Verify conventional commit format
git log --oneline main

# Dry run release
npx semantic-release --dry-run
```

### Integration Tests Failing

```bash
# Check Node version
node --version  # Should be 18.x, 20.x, or 22.x

# Verify test files exist
ls tests/integration/
ls tests/fixtures/configs/

# Run with verbose output
npm run test:integration -- --verbose
```

---

## Next Steps

After setup:
1. Create test PR with intentional error (verify blocks merge)
2. Create valid PR (verify auto-merge after CI passes)
3. Merge to main (verify automated release)
4. Monitor first few releases for issues

## Support

- GitHub Branch Protection Docs: https://docs.github.com/en/rest/branches/branch-protection
- Husky Documentation: https://typicode.github.io/husky/
- commitlint Documentation: https://commitlint.js.org/
- semantic-release Documentation: https://semantic-release.gitbook.io/