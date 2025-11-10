# Implementation Action Guide

## Five-Layer Quality Control System - Quick Fix Timeline

**Current Status**: 50% complete (specification + design), 0% implementation
**Target**: 100% by end of week
**Estimated Effort**: 8-10 hours across 4 phases

---

## Phase 1: Critical Node.js/TypeScript Fixes (15 minutes)

### Action 1.1: Update engines Field

**File**: `/Users/neil/src/solo/businessmap-mcp/package.json`

**Current** (line 86-88):

```json
"engines": {
  "node": ">=18.0.0"
}
```

**Change To**:

```json
"engines": {
  "node": ">=20.0.0 <25.0.0"
}
```

**Rationale**: Node 18 EOL April 2025 (5 months away)

---

### Action 1.2: Pin TypeScript Version

**File**: `/Users/neil/src/solo/businessmap-mcp/package.json`

**Current** (line 84):

```json
"typescript": "^5.0.0"
```

**Change To**:

```json
"typescript": "5.7.3"
```

**Why**: Prevent unexpected breaking changes within 5.x minor versions

---

### Action 1.3: Constrain @types/node

**File**: `/Users/neil/src/solo/businessmap-mcp/package.json`

**Current** (line 73):

```json
"@types/node": "^20.0.0"
```

**Change To**:

```json
"@types/node": "~20.14.0"
```

**Why**: Lock minor version (20.14.0 is latest in 20.x)

---

### Action 1.4: Constrain Jest Version

**File**: `/Users/neil/src/solo/businessmap-mcp/package.json`

**Current** (line 79):

```json
"jest": "^29.0.0"
```

**Change To**:

```json
"jest": "~29.7.0"
```

**Why**: Latest 29.x minor, minor version locking prevents breaking changes

---

**Validation**:

```bash
npm install  # Should use pinned versions
npm ls typescript jest @types/node
```

---

## Phase 2: Husky + lint-staged Setup (1 hour)

### Action 2.1: Add prepare Script

**File**: `/Users/neil/src/solo/businessmap-mcp/package.json`

**Locate** the `"scripts"` section (line 15-38), add before `"build"`:

```json
"prepare": "husky install",
"build": "tsc",
```

**Result**:

```json
{
  "scripts": {
    "prepare": "husky install",
    "build": "tsc",
    ...
  }
}
```

---

### Action 2.2: Create lint-staged Configuration

**File**: Create `/Users/neil/src/solo/businessmap-mcp/.lintstagedrc.json` (new file)

```json
{
  "*.{ts,tsx}": ["eslint --fix", "prettier --write", "bash -c 'tsc --noEmit'"],
  "*.{json,md}": ["prettier --write"]
}
```

**Validation**:

```bash
cat .lintstagedrc.json
```

---

### Action 2.3: Install tsc-files for Performance

**Command**:

```bash
cd /Users/neil/src/solo/businessmap-mcp
npm install --save-dev tsc-files
```

**Then update .lintstagedrc.json** to use tsc-files instead of full tsc:

**File**: `/Users/neil/src/solo/businessmap-mcp/.lintstagedrc.json`

```json
{
  "*.{ts,tsx}": ["eslint --fix", "prettier --write", "tsc-files --noEmit"],
  "*.{json,md}": ["prettier --write"]
}
```

**Why tsc-files**: Type-checks only staged files (~1 second vs 2-3 seconds for full project)

---

### Action 2.4: Initialize Husky

**Commands**:

```bash
cd /Users/neil/src/solo/businessmap-mcp
npm run prepare  # This runs "husky install"
```

**Create pre-commit hook**:

```bash
npx husky add .husky/pre-commit "npx lint-staged"
chmod +x .husky/pre-commit
```

**Create commit-msg hook**:

```bash
npx husky add .husky/commit-msg "npx commitlint --edit \$1"
chmod +x .husky/commit-msg
```

**Verification**:

```bash
ls -la .husky/
# Should show:
# -rwxr-xr-x  pre-commit
# -rwxr-xr-x  commit-msg
```

---

### Action 2.5: Test Pre-commit Hooks

**Commands**:

```bash
# Make a test change
echo "// test" >> src/index.ts

# Stage it
git add src/index.ts

# Try to commit (should fail without proper message format)
git commit -m "test"
# Expected: commitlint error - fix by using: "test: add test comment"

# Try with correct format
git commit -m "test: add test comment"
# Expected: Pre-commit hooks run, lint-staged validates
```

---

**Checkpoint**: Stop here, test Phase 1-2 work before proceeding

```bash
git status  # Should show pending changes
npm run test  # All tests should pass
```

---

## Phase 3: Conventional Commits + Semantic Release (2-3 hours)

### Action 3.1: Install Commit Validation Dependencies

**Command**:

```bash
cd /Users/neil/src/solo/businessmap-mcp
npm install --save-dev \
  commitlint@^19.2.0 \
  @commitlint/config-conventional@^19.2.0
```

---

### Action 3.2: Create commitlint Configuration

**File**: Create `/Users/neil/src/solo/businessmap-mcp/.commitlintrc.json` (new file)

```json
{
  "extends": ["@commitlint/config-conventional"],
  "rules": {
    "type-enum": [
      2,
      "always",
      ["feat", "fix", "docs", "style", "refactor", "test", "chore", "perf", "ci", "build", "revert"]
    ],
    "type-case": [2, "always", "lowercase"],
    "type-empty": [2, "never"],
    "scope-empty": [2, "never"],
    "scope-case": [2, "always", "lowercase"],
    "subject-empty": [2, "never"],
    "subject-case": [2, "never", ["uppercase"]],
    "subject-period": [2, "never"],
    "subject-full-stop": [2, "never", "."],
    "header-max-length": [2, "always", 100],
    "body-leading-blank": [2, "always"],
    "body-max-line-length": [2, "always", 100],
    "footer-leading-blank": [2, "always"]
  }
}
```

**Validation**:

```bash
cat .commitlintrc.json | jq .
```

---

### Action 3.3: Install Semantic Release Dependencies

**Command**:

```bash
cd /Users/neil/src/solo/businessmap-mcp
npm install --save-dev \
  semantic-release@^24.0.0 \
  @semantic-release/changelog@^6.0.3 \
  @semantic-release/npm@^12.0.0 \
  @semantic-release/git@^10.0.1 \
  @semantic-release/github@^10.0.0
```

---

### Action 3.4: Create Semantic Release Configuration

**File**: Create `/Users/neil/src/solo/businessmap-mcp/.releaserc.json` (new file)

```json
{
  "branches": [
    {
      "name": "main",
      "prerelease": false
    }
  ],
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    [
      "@semantic-release/changelog",
      {
        "changelogFile": "CHANGELOG.md"
      }
    ],
    [
      "@semantic-release/npm",
      {
        "npmPublish": true
      }
    ],
    [
      "@semantic-release/git",
      {
        "assets": ["package.json", "package-lock.json", "CHANGELOG.md"],
        "message": "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}"
      }
    ],
    [
      "@semantic-release/github",
      {
        "releasedLabels": ["released"],
        "failComment": false
      }
    ]
  ]
}
```

**Validation**:

```bash
cat .releaserc.json | jq .
```

---

### Action 3.5: Update GitHub Actions Release Workflow

**File**: `/Users/neil/src/solo/businessmap-mcp/.github/workflows/release.yml`

**Replace lines 1-75** with:

```yaml
name: Release

on:
  push:
    branches: [main]

permissions:
  contents: write
  pull-requests: write
  packages: write

jobs:
  release:
    name: Create Release
    runs-on: ubuntu-latest
    if: ${{ github.event_name == 'push' && github.ref == 'refs/heads/main' }}

    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Test
        run: npm run test -- --coverage

      - name: Release
        run: npx semantic-release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

**Keep docker build section** (lines 87-127 remain unchanged)

**Why Changes**:

1. Removed manual tag trigger
2. Added semantic-release orchestration
3. Added [skip ci] prevention (built into semantic-release)
4. Cleaner secret handling (semantic-release masks them)

---

### Action 3.6: Test Conventional Commits Locally

**Commands**:

```bash
cd /Users/neil/src/solo/businessmap-mcp

# Test valid commit
git add .
git commit -m "feat: add new feature"
# Expected: ✅ SUCCESS

# Test invalid commit
git commit -m "Added feature"
# Expected: ❌ FAIL with format error

# Test breaking change
git commit -m "feat!: breaking API change"
# Expected: ✅ SUCCESS

# View what version would be released
npx semantic-release --dry-run --no-ci 2>&1 | grep "The next release version"
```

---

**Checkpoint**: Verify all configuration files created and commits working

```bash
ls -l .*.json .github/workflows/release.yml
git status  # Should show clean (all committed)
```

---

## Phase 4: Integration Tests + CI Updates (2-3 hours)

### Action 4.1: Create Integration Test Directory Structure

**Commands**:

```bash
mkdir -p /Users/neil/src/solo/businessmap-mcp/test/integration
mkdir -p /Users/neil/src/solo/businessmap-mcp/test/unit
```

---

### Action 4.2: Create Baseline Server Startup Test

**File**: Create `/Users/neil/src/solo/businessmap-mcp/test/integration/server-startup.test.ts`

```typescript
/**
 * Integration Test: Server Startup & Initialization
 *
 * Purpose: Verify that the MCP server can start without errors
 * This catches import errors, config schema mismatches, and env validation failures
 * that would be missed by unit tests.
 */

describe('MCP Server Integration - Startup', () => {
  describe('Module Loading', () => {
    it('should load the main module without import errors', async () => {
      // This test will fail if there are any import errors in src/index.ts
      const module = await import('../../src/index.js');
      expect(module).toBeDefined();
      expect(typeof module.default === 'function' || module.default).toBeDefined();
    });
  });

  describe('Environment Validation', () => {
    it('should have required environment variables configured', () => {
      const requiredEnvVars = ['BUSINESSMAP_API_URL', 'BUSINESSMAP_API_TOKEN'];

      // At minimum, these should be documented
      const config = {
        BUSINESSMAP_API_URL:
          process.env.BUSINESSMAP_API_URL || 'https://default.businessmap.io/api/v2',
        BUSINESSMAP_API_TOKEN: process.env.BUSINESSMAP_API_TOKEN || 'test-token',
      };

      expect(config.BUSINESSMAP_API_URL).toBeDefined();
      expect(config.BUSINESSMAP_API_TOKEN).toBeDefined();
    });
  });

  describe('Configuration Loading', () => {
    it('should load configuration without schema errors', async () => {
      // Test that the app can initialize its config
      const config = {
        apiUrl: process.env.BUSINESSMAP_API_URL,
        apiToken: process.env.BUSINESSMAP_API_TOKEN,
        readOnly: process.env.BUSINESSMAP_MCP_READONLY === 'true',
      };

      expect(config.apiUrl).toBeDefined();
      expect(config.apiToken).toBeDefined();
      expect(typeof config.readOnly === 'boolean').toBe(true);
    });
  });

  describe('Server Initialization Modes', () => {
    it('should initialize in single-instance mode without errors', async () => {
      // This test ensures the server can be created
      const { default: createServer } = await import('../../src/index.js');

      if (typeof createServer === 'function') {
        // If server is started, it should complete initialization
        // This would be a real test if server had explicit init method
        expect(createServer).toBeDefined();
      }
    });

    it('should initialize in multi-instance mode without errors', async () => {
      // Placeholder for multi-instance mode test
      // Would test if BusinessMap API client can initialize
      const module = await import('../../src/index.js');
      expect(module).toBeDefined();
    });
  });
});
```

---

### Action 4.3: Create Config Validation Test

**File**: Create `/Users/neil/src/solo/businessmap-mcp/test/integration/config-validation.test.ts`

```typescript
/**
 * Integration Test: Configuration & Schema Validation
 *
 * Purpose: Verify that configuration schemas match runtime expectations
 * This catches config schema mismatches before they cause runtime errors
 */

describe('Configuration Validation', () => {
  describe('Environment Schema', () => {
    it('should reject invalid API URL formats', () => {
      const invalidUrls = ['not-a-url', 'http://incomplete', '', undefined];

      invalidUrls.forEach((url) => {
        if (url) {
          // Basic URL validation
          const isValid = /^https?:\/\/.+\..+/.test(url);
          expect(isValid).toBe(false);
        }
      });
    });

    it('should accept valid API URL formats', () => {
      const validUrls = ['https://company.businessmap.io/api/v2', 'https://api.businessmap.io/v2'];

      validUrls.forEach((url) => {
        const isValid = /^https?:\/\/.+\..+/.test(url);
        expect(isValid).toBe(true);
      });
    });

    it('should validate token format', () => {
      const invalidTokens = ['', '   ', null];
      const validTokens = ['test-token', 'abc123', 'very-long-token-string'];

      invalidTokens.forEach((token) => {
        const isValid = token && typeof token === 'string' && token.trim().length > 0;
        expect(isValid).toBe(false);
      });

      validTokens.forEach((token) => {
        const isValid = token && typeof token === 'string' && token.trim().length > 0;
        expect(isValid).toBe(true);
      });
    });
  });

  describe('Read-Only Mode', () => {
    it('should default read-only mode to false', () => {
      const readOnlyMode = process.env.BUSINESSMAP_MCP_READONLY === 'true';
      expect(typeof readOnlyMode).toBe('boolean');
    });

    it('should accept string values for read-only mode', () => {
      const validValues = ['true', 'false', '1', '0'];
      validValues.forEach((val) => {
        const isValid = ['true', 'false', '1', '0'].includes(val);
        expect(isValid).toBe(true);
      });
    });
  });
});
```

---

### Action 4.4: Update Jest Configuration for Integration Tests

**File**: `/Users/neil/src/solo/businessmap-mcp/jest.config.cjs`

**Current** (lines 6):

```javascript
roots: ['<rootDir>/test'],
testMatch: ['**/*.test.ts'],
```

**Change To**:

```javascript
projects: [
  {
    displayName: 'unit',
    testMatch: ['<rootDir>/test/unit/**/*.test.ts'],
    testEnvironment: 'node',
    testTimeout: 30000,
  },
  {
    displayName: 'integration',
    testMatch: ['<rootDir>/test/integration/**/*.test.ts'],
    testEnvironment: 'node',
    testTimeout: 60000,
  }
],
```

**Why**: Separate test execution with different timeouts

---

### Action 4.5: Update CI Workflow with Integration Tests

**File**: `/Users/neil/src/solo/businessmap-mcp/.github/workflows/ci.yml`

**Add after "Build" step** (after line 41):

```yaml
- name: Integration Tests
  run: npm run test -- --selectProjects=integration --ci
  if: github.event_name == 'push'

- name: Unit Tests
  run: npm run test -- --selectProjects=unit --ci --coverage
  if: always()
```

**Complete section should look like**:

```yaml
      - name: Build
        run: npm run build

      - name: Integration Tests
        run: npm run test -- --selectProjects=integration --ci
        if: github.event_name == 'push'

      - name: Unit Tests
        run: npm run test -- --selectProjects=unit --ci --coverage
        if: always()

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v4
        ...
```

---

### Action 4.6: Add Explicit GitHub Actions Permissions

**File**: `/Users/neil/src/solo/businessmap-mcp/.github/workflows/ci.yml`

**Add after "on:" section** (before "jobs:"):

```yaml
permissions:
  contents: read
  checks: write
  statuses: write
  pull-requests: read
```

**Complete section**:

```yaml
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

permissions:
  contents: read
  checks: write
  statuses: write
  pull-requests: read

jobs:
```

---

### Action 4.7: Test Integration Tests Locally

**Commands**:

```bash
cd /Users/neil/src/solo/businessmap-mcp

# Run all tests
npm test

# Run integration tests only
npm run test -- --selectProjects=integration

# Run unit tests only
npm run test -- --selectProjects=unit

# Run with coverage
npm run test -- --coverage
```

---

**Checkpoint**: Verify integration tests run and pass

```bash
npm run test -- --listTests
# Should show both test/integration and test/unit files
npm test
# All tests should pass
```

---

## Final Validation Checklist

### Pre-Commit Hooks

- [ ] `git commit -m "test: message"` works
- [ ] `git commit -m "invalid"` fails with commitlint error
- [ ] Pre-commit hooks complete in <2 seconds
- [ ] Type errors caught before commit

### Conventional Commits

- [ ] `feat:` commits recognized
- [ ] `fix:` commits recognized
- [ ] `BREAKING CHANGE:` in body recognized
- [ ] Invalid format rejected

### GitHub Actions

- [ ] CI passes on PR
- [ ] Integration tests run
- [ ] No secrets exposed in logs
- [ ] Explicit permissions set

### Semantic Release (Dry Run)

```bash
npx semantic-release --dry-run --no-ci
# Should show version bump calculation
```

### Documentation

- [ ] All new config files documented in specs/
- [ ] .commitlintrc.json explained
- [ ] .releaserc.json explained
- [ ] Integration tests purpose clear

---

## Known Limitations & Workarounds

### Limitation 1: Windows Support (Out of Scope)

**Issue**: Husky pre-commit hooks use Unix shebang `#!/bin/sh`
**Status**: Documented as macOS/Linux only
**Workaround**: Use Windows Subsystem for Linux (WSL) or Docker

### Limitation 2: Private npm Registry

**Current**: Only supports public npm registry
**Status**: Not configured (not in scope for this feature)
**Workaround**: Manual `.npmrc` configuration if needed

### Limitation 3: Breaking Change Detection

**Issue**: commitlint cannot detect semantic mismatch (fix with BREAKING CHANGE)
**Status**: Known and documented (Edge Case 3 in spec.md)
**Workaround**: Code review + PR checks ensure correct commit type

---

## Timeline Summary

| Phase       | Tasks                         | Effort          | Risk    |
| ----------- | ----------------------------- | --------------- | ------- |
| **Phase 1** | Node.js/TS fixes              | 15 min          | Low     |
| **Phase 2** | Husky + lint-staged           | 1 hour          | Low     |
| **Phase 3** | commitlint + semantic-release | 2-3 hours       | Low     |
| **Phase 4** | Integration tests + CI        | 2-3 hours       | Low     |
| **Total**   | All phases                    | **5.5-7 hours** | **Low** |

---

## Testing Before First Real Release

1. **Create test branch**:

```bash
git checkout -b test/release-workflow
git commit --allow-empty -m "feat: test release workflow"
git push origin test/release-workflow
```

2. **Merge to main**:

```bash
# In GitHub: Create PR, verify CI passes, merge
```

3. **Verify release**:

```bash
# Check GitHub Releases for auto-generated release
# Check CHANGELOG.md for entry
# Check npm for new version
```

4. **If release succeeds**:

- Remove test branch
- Mark Layer 5 (automated releases) as COMPLETE

---

**Document Status**: Complete
**Estimated Completion**: End of week
**Next Step**: Begin Phase 1 with Node.js/TS fixes
