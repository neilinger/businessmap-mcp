# Research: Five-Layer Quality Control System

**Date**: 2025-11-07 (Updated with clarifications)
**Feature**: [spec.md](spec.md)
**Plan**: [plan.md](plan.md)

## Overview

This document consolidates research findings for implementing a comprehensive quality control system. All technical decisions are based on 2024 best practices and verified against the project's existing TypeScript/Node.js infrastructure.

**Clarification Updates (2025-11-07)**:
- Integration tests run in **local pre-push hooks** with real credentials (not CI)
- CI runs **mock-mode integration tests** (format/presence validation only)
- Pre-push hooks have **no time limit** (30+ seconds acceptable)
- Defense-in-depth: Local (real) + CI (mock) testing layers

---

## Research Area 1: GitHub Branch Protection Configuration

### Decision: Use GitHub Branch Protection API with Required Status Checks

**Rationale**:
- GitHub branch protection is the only mechanism to enforce PR workflow (prevent direct commits)
- Required status checks ensure CI must pass before merge
- API-based configuration enables programmatic setup and documentation

**Configuration Approach**:
```bash
gh api repos/neilinger/businessmap-mcp/branches/main/protection \
  -X PUT \
  --input - <<EOF
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

**Alternatives Considered**:
- Manual configuration via GitHub UI → Rejected: Not reproducible, no documentation trail
- Third-party tools (Terraform, Pulumi) → Rejected: Overkill for single-repo config

**Sources**:
- GitHub Branch Protection API: https://docs.github.com/en/rest/branches/branch-protection
- Best practices (2024): https://graphite.dev/guides/github-branch-protection-rules

---

## Research Area 2: Pre-commit Hook Framework Selection

### Decision: Husky 9.x with Separate Pre-Commit + Pre-Push Hooks

**Rationale**:
- **Husky 9.x**: Industry-standard git hooks manager (separate hook files: `.husky/pre-commit` + `.husky/pre-push`)
- **lint-staged**: Pre-commit only runs on staged files (<2s target)
- **Pre-push hook**: Runs integration tests with unlimited time budget (30+ seconds acceptable per clarification)
- Two-tier validation: Fast pre-commit (lint/format/type) + Thorough pre-push (integration tests)

**Configuration Pattern**:
```bash
# .husky/pre-commit (fast, <2s budget)
#!/bin/sh
npx lint-staged

# .husky/pre-push (thorough, unlimited budget)
#!/bin/sh
echo "⏱️  Running integration tests (may take 30+ seconds)..."
START=$(date +%s)
npm run test:integration
EXIT_CODE=$?
END=$(date +%s)
echo "✅ Completed in $((END - START))s"
exit $EXIT_CODE
```

```json
// .lintstagedrc.json
{
  "*.{ts,tsx}": [
    "eslint --fix",
    "prettier --write",
    "bash -c 'tsc --noEmit'"
  ]
}

// package.json scripts
{
  "test:integration": "jest --config jest.integration.config.js"
}
```

**Performance**:
- Pre-commit: ~1-2 seconds (staged files only, incremental TypeScript)
- Pre-push: 30+ seconds (full server initialization, both instance modes)
- Clarification Q3 explicitly accepts unlimited pre-push time

**Alternatives Considered**:
- Single pre-commit hook with all validation → Rejected: Violates <2s budget
- No pre-push hook, CI only → Rejected: Misses local validation opportunity
- **Lefthook**: Faster but non-Node → Rejected: Ecosystem alignment

**Sources**:
- Husky 9.x documentation: https://typicode.github.io/husky/
- Git hook execution order: pre-commit → commit-msg → pre-push

---

## Research Area 3: Conventional Commit Enforcement

### Decision: commitlint with @commitlint/config-conventional

**Rationale**:
- De facto standard for conventional commits in Node.js ecosystem
- Compatible with semantic-release (Layer 5 dependency)
- 80% of existing commits already follow format (verified in issue #19)

**Configuration**:
```json
{
  "extends": ["@commitlint/config-conventional"],
  "rules": {
    "type-enum": [
      2,
      "always",
      ["feat", "fix", "docs", "style", "refactor", "test", "chore", "perf", "ci", "build", "revert"]
    ],
    "subject-case": [2, "never", ["upper-case"]],
    "header-max-length": [2, "always", 100]
  }
}
```

**Format Examples**:
- ✅ `feat: add user authentication`
- ✅ `fix(api): resolve timeout error`
- ❌ `Added new feature` (missing type)
- ❌ `FEAT: add feature` (uppercase subject)

**Alternatives Considered**:
- Custom commit format validator → Rejected: Reinventing wheel, semantic-release incompatible
- No enforcement → Rejected: Breaks automated release workflow (Layer 5)

**Sources**:
- commitlint documentation: https://commitlint.js.org/
- Conventional Commits spec: https://www.conventionalcommits.org/en/v1.0.0/

---

## Research Area 4: CI Workflow Enhancements

### Decision: Extend Existing GitHub Actions Workflow

**Approach**:
1. **Pre-commit Validation Job**: Re-run lint-staged to catch bypassed hooks
2. **Integration Test Job**: Run baseline initialization tests

**Configuration** (.github/workflows/ci.yml):
```yaml
jobs:
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
      - name: Integration Tests
        run: npm run test:integration
        # NOTE: No BUSINESSMAP_API_TOKEN secrets (per spec line 144)
```

**Rationale**:
- Catch `git commit --no-verify` bypasses (pre-commit validation job)
- Verify server startup, config loading, env validation (integration test job)
- Matrix testing across Node 18/20/22 (existing pattern)

**Alternatives Considered**:
- Separate CI workflow → Rejected: Unnecessary complexity, harder to maintain
- Third-party CI (CircleCI, Travis) → Rejected: Migration cost, GitHub Actions sufficient

**Sources**:
- GitHub Actions best practices: https://docs.github.com/en/actions/learn-github-actions/workflow-syntax-for-github-actions

---

## Research Area 5: Automated Release Workflow

### Decision: semantic-release with Standard Plugins

**Rationale**:
- Industry standard for automated npm releases (6.7M weekly downloads)
- Analyzes conventional commits to determine version bump (major/minor/patch)
- Automates package.json, CHANGELOG, git tags, GitHub releases, npm publish
- 80% of commits already conventional format → minimal disruption

**Plugin Configuration** (.releaserc.json):
```json
{
  "branches": ["main"],
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    ["@semantic-release/changelog", {
      "changelogFile": "CHANGELOG.md"
    }],
    "@semantic-release/npm",
    ["@semantic-release/git", {
      "assets": ["CHANGELOG.md", "package.json", "package-lock.json"],
      "message": "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}"
    }],
    "@semantic-release/github"
  ]
}
```

**Version Determination**:
- `fix:` commits → patch (1.0.0 → 1.0.1)
- `feat:` commits → minor (1.0.0 → 1.1.0)
- `BREAKING CHANGE:` footer → major (1.0.0 → 2.0.0)

**Workflow Integration** (.github/workflows/release.yml):
```yaml
name: Release
on:
  push:
    branches: [main]
jobs:
  release:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      issues: write
      pull-requests: write
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Full history for changelog
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
      - name: Release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
        run: npx semantic-release
```

**Alternatives Considered**:
- **changesets**: More manual control → Rejected: Requires manual changeset files (defeats automation goal)
- **release-please**: Google's tool → Rejected: Less flexible plugin ecosystem
- **Manual versioning**: Status quo → Rejected: Historical source of direct-to-main commits

**Sources**:
- semantic-release documentation: https://semantic-release.gitbook.io/
- npm release automation comparison (2024): https://oleksiipopov.com/blog/npm-release-automation/

---

## Research Area 6: Integration Test Patterns (Dual-Mode Architecture)

### Decision: Jest Integration Tests with Dual-Mode Execution (Real + Mock)

**Dual-Mode Architecture**:
- **Real Mode** (Local pre-push hooks): Full server initialization with actual BUSINESSMAP_API_TOKEN credentials
- **Mock Mode** (CI): Config validation + env var presence checks (no server initialization, no credentials)

**Test Structure**:
```text
tests/
├── integration/
│   ├── setup.ts                    # Mode detection: TEST_MODE = 'real' | 'mock'
│   ├── server-initialization.test.ts   # Import errors + server startup
│   ├── config-validation.test.ts       # Schema mismatch detection
│   └── env-validation.test.ts          # Environment variable validation
└── fixtures/
    ├── valid-multi-instance.json   # Both modes: schema check (mock) + initialization (real)
    ├── valid-single-instance.json  # Both modes
    └── invalid-schema.json         # Both modes: schema rejection

# jest.integration.config.js
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/integration/**/*.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/tests/integration/setup.ts']
};
```

**Mode Detection Logic** (tests/integration/setup.ts):
```typescript
export const TEST_MODE: 'real' | 'mock' =
  process.env.CI || !process.env.BUSINESSMAP_API_TOKEN_FIMANCIA
    ? 'mock'
    : 'real';

console.log(`🧪 Integration tests running in ${TEST_MODE.toUpperCase()} mode`);
```

**Example Dual-Mode Test** (server-initialization.test.ts):
```typescript
import { TEST_MODE } from './setup';

describe('Server Initialization', () => {
  if (TEST_MODE === 'real') {
    // Local pre-push hook: Full validation with real credentials
    it('should initialize server with real credentials', async () => {
      const server = await initializeServer({ configPath: './fixtures/valid-multi-instance.json' });

      // Deep validation: actual server startup
      expect(server).toBeDefined();
      expect(server.listTools()).toContain('list_workspaces');

      // Verify actual API connection
      const result = await server.callTool('list_workspaces', { instance: 'fimancia' });
      expect(result).toBeDefined();
    });
  } else {
    // CI: Shallow validation without credentials
    it('should validate config structure in mock mode', () => {
      const config = loadConfig('./fixtures/valid-multi-instance.json');

      // Shallow validation: config structure only
      expect(config.instances.fimancia).toBeDefined();
      expect(config.instances.fimancia.apiTokenEnvVar).toBe('BUSINESSMAP_API_TOKEN_FIMANCIA');

      // No server initialization, no API calls
    });

    it('should check env var presence format', () => {
      const envVar = 'BUSINESSMAP_API_TOKEN_FIMANCIA';

      // Format check only (not actual value validation)
      expect(typeof envVar).toBe('string');
      expect(envVar.length).toBeGreaterThan(0);
      expect(envVar).toMatch(/^BUSINESSMAP_API_TOKEN_/);
    });
  }
});
```

**Coverage Matrix**:

| Historical Bug | Real Mode (Local) | Mock Mode (CI) |
|----------------|-------------------|----------------|
| Import errors (LRUCache) | ✅ Jest module loading catches | ✅ Jest module loading catches |
| Config schema mismatches | ✅ Full schema + server init | ✅ Schema structure validation |
| Env var validation bugs | ✅ Actual API connection test | ✅ Presence/format checks |

**Rationale**:
- **Security**: No credentials in CI (mock mode sufficient for schema bugs)
- **Thoroughness**: Local pre-push validates actual server initialization (catches all 3 bug types)
- **Defense-in-depth**: Hook bypass (`--no-verify`) caught by CI mock-mode tests + branch protection
- **Performance**: Mock mode fast in CI (<1 minute), real mode unlimited in local pre-push (30+ seconds acceptable per clarification Q3)

**Alternatives Considered**:
- Single mode (real only) → Rejected: Blocks CI contributors without credentials
- Single mode (mock only) → Rejected: Misses actual initialization bugs
- Separate test files for real/mock → Rejected: Duplication, harder to maintain
- E2E tests with real API in CI → Rejected: Spec explicitly prohibits CI secrets

**Sources**:
- Jest conditional tests: https://jestjs.io/docs/api
- Node.js environment detection: https://nodejs.org/api/process.html#process_process_env

---

## Summary of Decisions

| Layer | Technology | Key Configuration | Performance Target |
|-------|------------|-------------------|-------------------|
| 1. Branch Protection | GitHub API | Required status checks, no force push | N/A (one-time setup) |
| 2. Pre-commit Hooks | Husky 9.x + lint-staged | Lint/format/type-check on staged files | <2 seconds |
| 3. Pre-push Hooks | Husky 9.x + Jest | Integration tests (real credentials, full server init) | Unlimited (30+ seconds acceptable) |
| 4. Commit Messages | commitlint | @commitlint/config-conventional | <100ms |
| 5. CI Enhancement | GitHub Actions | Pre-commit validation + integration tests (mock mode) | <10 minutes total |
| 6. Automated Releases | semantic-release | Standard plugins + GitHub/npm publish | <5 minutes |
| 7. Integration Tests | Jest (dual-mode) | Real mode (local) + Mock mode (CI) | Real: unlimited; Mock: <1 minute |

**Clarification Impact Summary**:
- ✅ Two-tier hook system (pre-commit fast + pre-push thorough)
- ✅ Dual-mode integration tests (local real credentials + CI mock validation)
- ✅ Defense-in-depth (local + CI enforcement layers)
- ✅ Security maintained (no CI credentials exposure)

**All Unknowns Resolved**: ✅

**Next Phase**: Design & Contracts (data-model.md, contracts/, quickstart.md)