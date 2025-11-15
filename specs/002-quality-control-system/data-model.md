# Data Model: Configuration Schemas

**Date**: 2025-11-07 (Updated with clarifications)
**Feature**: [spec.md](spec.md)
**Plan**: [plan.md](plan.md)
**Research**: [research.md](research.md)

## Overview

This document defines the configuration schemas for all five quality control layers. Since this is an infrastructure feature, the "data model" consists of configuration files rather than application entities.

**Clarification Updates (2025-11-07)**:
- Pre-push hooks added (separate from pre-commit, run integration tests)
- Dual-mode integration testing (real credentials local, mock in CI)
- CI runs mock-mode integration tests (no credentials required)
- Defense-in-depth validation architecture

---

## Entity 1: Branch Protection Configuration

**Purpose**: Define GitHub branch protection rules via API

**Schema** (JSON payload for GitHub API):
```json
{
  "required_status_checks": {
    "strict": boolean,
    "contexts": string[]
  },
  "enforce_admins": boolean,
  "required_pull_request_reviews": {
    "required_approving_review_count": number
  } | null,
  "restrictions": object | null,
  "allow_force_pushes": boolean,
  "allow_deletions": boolean
}
```

**Field Definitions**:
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| required_status_checks.strict | boolean | Yes | true/false | Require branches to be up-to-date before merge |
| required_status_checks.contexts | string[] | Yes | Non-empty array | List of required CI check names |
| enforce_admins | boolean | Yes | true/false | Apply rules to admins (false for solo dev) |
| required_pull_request_reviews | object/null | Yes | null for no review | PR approval config (null = self-merge) |
| restrictions | object/null | Yes | null for no restrictions | User/team merge restrictions |
| allow_force_pushes | boolean | Yes | true/false | Allow force pushes (false = preserve history) |
| allow_deletions | boolean | Yes | true/false | Allow branch deletion (false = prevent accidents) |

**Relationships**: None (standalone GitHub API configuration)

**Validation Rules**:
- `contexts` must match actual CI job names
- `enforce_admins: false` required for solo developer workflow (spec FR-004)
- `required_pull_request_reviews: null` enables self-merge (spec FR-004)

---

## Entity 2: Git Hook Configuration (Husky - Pre-Commit + Pre-Push)

**Purpose**: Define two-tier git hook validation (fast pre-commit + thorough pre-push)

**Schema** (package.json excerpt):
```json
{
  "scripts": {
    "prepare": "husky install",
    "test:integration": "jest --config jest.integration.config.js"
  },
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

**Husky Hook Files**:
- `.husky/pre-commit` → `npx lint-staged` (performance budget: <2s)
- `.husky/pre-push` → `npm run test:integration` (performance budget: unlimited, 30+ seconds acceptable)
- `.husky/commit-msg` → `npx --no -- commitlint --edit $1`

**Pre-Push Hook Script** (`.husky/pre-push`):
```bash
#!/bin/sh
echo "⏱️  Running integration tests (may take 30+ seconds)..."
START=$(date +%s)
npm run test:integration
EXIT_CODE=$?
END=$(date +%s)
echo "✅ Completed in $((END - START))s"
exit $EXIT_CODE
```

**Field Definitions**:
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| scripts.prepare | string | Yes | "husky install" | Auto-install hooks on npm install |
| scripts.test:integration | string | Yes | Jest command | Integration test command for pre-push hook |
| lint-staged."*.{ts,tsx}" | string[] | Yes | Command array | Commands for TypeScript files |
| lint-staged."*.{json,md}" | string[] | Yes | Command array | Commands for JSON/Markdown files |

**Validation Rules**:
- Pre-commit: <2 seconds for typical changes (spec FR-006)
- Pre-push: Unlimited time (30+ seconds acceptable per clarification Q3)
- Commands must be executable on target platform (macOS/Linux only, spec Out of Scope)
- `tsc --noEmit` requires TypeScript config allowing type-check-only mode

---

## Entity 3: Commit Message Rules (commitlint)

**Purpose**: Enforce conventional commit format

**Schema** (.commitlintrc.json):
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

**Field Definitions**:
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| extends | string[] | Yes | ["@commitlint/config-conventional"] | Base config to extend |
| rules.type-enum | [number, string, string[]] | Yes | [2, "always", types] | Allowed commit types (error level 2) |
| rules.subject-case | [number, string, string[]] | Yes | [2, "never", ["upper-case"]] | Disallow uppercase subjects |
| rules.header-max-length | [number, string, number] | Yes | [2, "always", 100] | Max 100 chars for header |

**Commit Format**:
```text
<type>(<scope>): <subject>

<body>

<footer>
```

**Examples**:
- ✅ `feat: add user authentication`
- ✅ `fix(api): resolve timeout error`
- ✅ `docs: update README with examples`
- ❌ `Added new feature` (missing type)
- ❌ `FEAT: add feature` (uppercase subject)

**Validation Rules**:
- Type must be in allowed list (spec FR-007)
- Subject must be lowercase (spec FR-008)
- Header must be ≤100 characters (spec FR-008)

---

## Entity 4: CI Workflow Configuration (Dual-Mode Validation)

**Purpose**: Define GitHub Actions jobs for quality validation + hook bypass detection

**Schema** (.github/workflows/ci.yml excerpt):
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

  integration-tests-mock:
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
      - name: Integration Tests (Mock Mode)
        run: npm run test:integration
        env:
          CI: true  # Forces mock mode (no real credentials)
    # NO BUSINESSMAP_API_TOKEN_* secrets (intentionally omitted for security)
```

**Field Definitions**:
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| jobs.pre-commit-validation | object | Yes | Valid job config | Re-runs pre-commit checks in CI (catches `git commit --no-verify`) |
| jobs.integration-tests-mock | object | Yes | Valid job config | Runs integration tests in mock mode (catches `git push --no-verify`) |
| strategy.matrix.node-version | string[] | Yes | [18.x, 20.x, 22.x] | Node versions to test |
| env.CI | string | Yes | "true" | Forces mock mode (no server initialization) |

**Test Mode Determination**:
- `CI=true` environment variable forces mock mode
- Mock mode validates config structure + env var presence (no real API calls)
- Real mode (local pre-push hook) performs full server initialization

**Validation Rules**:
- Job names must match `required_status_checks.contexts` from Entity 1
- `npm run test:integration` script must exist in package.json
- NO BUSINESSMAP_API_TOKEN secrets in CI (per spec + clarifications)
- Mock mode completes within CI budget (<10 minutes total per spec SC-008)

---

## Entity 5: Release Configuration (semantic-release)

**Purpose**: Automate version bumping, changelog generation, and publishing

**Schema** (.releaserc.json):
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

**Field Definitions**:
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| branches | string[] | Yes | ["main"] | Branches to release from |
| plugins | array | Yes | Plugin config array | Plugins to execute in order |

**Plugin Responsibilities**:
| Plugin | Purpose | Output |
|--------|---------|--------|
| commit-analyzer | Determine version bump type | next version (major/minor/patch) |
| release-notes-generator | Generate changelog content | Release notes markdown |
| changelog | Write CHANGELOG.md | CHANGELOG.md file |
| npm | Publish to npm registry | npm package |
| git | Commit version bump | Git commit + tag |
| github | Create GitHub release | GitHub release with notes |

**Version Determination Rules**:
- `fix:` commits → patch version (1.0.0 → 1.0.1)
- `feat:` commits → minor version (1.0.0 → 1.1.0)
- `BREAKING CHANGE:` footer → major version (1.0.0 → 2.0.0)

**Validation Rules**:
- Message must include `[skip ci]` to prevent infinite loop (spec FR-015)
- NPM_TOKEN secret must be configured in GitHub Actions (spec FR-013)
- Git history must be fetched with `fetch-depth: 0` (spec FR-012)

---

## Entity 6: Integration Test Fixtures (Dual-Mode Support)

**Purpose**: Provide test configurations for initialization validation in both real and mock modes

**Schema** (tests/integration/fixtures/valid-multi-instance.json):
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
    },
    {
      "name": "kerkow",
      "apiUrl": "https://kerkow.kanbanize.com/api/v2",
      "apiTokenEnv": "BUSINESSMAP_API_TOKEN_KERKOW",
      "description": "Kerkow test instance"
    }
  ]
}
```

**Invalid Schema Example** (tests/integration/fixtures/invalid-schema.json):
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

**Test Mode Usage**:

| Fixture | Real Mode (Local Pre-Push) | Mock Mode (CI) |
|---------|----------------------------|----------------|
| valid-multi-instance.json | Full server initialization + API call test | Config structure validation only |
| valid-single-instance.json | Full server initialization + API call test | Config structure validation only |
| invalid-schema.json | Config loading fails (schema error) | Config loading fails (schema error) |

**Field Definitions**:
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| version | string | Yes | "1.0" | Config schema version |
| defaultInstance | string | Yes | Must match instance name | Default instance to use |
| instances[].name | string | Yes | Non-empty | Instance identifier |
| instances[].apiUrl | string | Yes | Valid URL | BusinessMap API endpoint |
| instances[].apiTokenEnv | string | Yes | Env var name | **Correct field name** |
| instances[].apiTokenEnvVar | string | N/A | Invalid | **Wrong field name** (catches historical bug) |

**Validation Rules**:
- `apiTokenEnv` is correct field name (catches historical bug from spec)
- `apiTokenEnvVar` is invalid and should trigger config loading failure in both modes
- Real mode: Requires actual environment variables (BUSINESSMAP_API_TOKEN_*)
- Mock mode: Only validates config structure (no env var values required)
- All fixtures must work in both test modes

**Mode Detection** (tests/integration/setup.ts):
```typescript
export const TEST_MODE: 'real' | 'mock' =
  process.env.CI || !process.env.BUSINESSMAP_API_TOKEN_FIMANCIA
    ? 'mock'
    : 'real';
```

---

## Configuration Relationships

```
Branch Protection (GitHub)
    ├─> Requires: CI Workflow jobs (pre-commit-validation, integration-tests-mock)
    └─> Enforces: PR workflow + all status checks must pass

Git Hooks (Husky)
    ├─> pre-commit: Triggers lint-staged (fast, <2s)
    ├─> commit-msg: Triggers commitlint
    └─> pre-push: Triggers integration tests in REAL mode (unlimited time)

Commit Messages (commitlint)
    └─> Required by: semantic-release (version determination)

CI Workflow (GitHub Actions)
    ├─> pre-commit-validation: Re-runs lint-staged (catches git commit --no-verify)
    └─> integration-tests-mock: Runs integration tests in MOCK mode (catches git push --no-verify)

Integration Tests (Jest - Dual Mode)
    ├─> Real Mode (local pre-push): Full server initialization + API calls
    │   └─> Requires: BUSINESSMAP_API_TOKEN_* environment variables
    ├─> Mock Mode (CI): Config structure validation only (no server init)
    │   └─> Requires: CI=true environment variable
    └─> Uses: Test fixtures (valid/invalid configs) in both modes

Release Workflow (semantic-release)
    ├─> Analyzes: Commit messages (conventional format)
    ├─> Updates: package.json, CHANGELOG.md, git tags
    └─> Publishes: npm package, GitHub release
```

---

## State Transitions

### Local Development Workflow States (Two-Tier Hooks)

```
[Developer makes changes]
    ↓
[Stage files: git add]
    ↓
[Attempt commit: git commit]
    ↓
[Pre-commit hook runs] ──┬─> [Linting pass?] ──NO──> [Commit blocked, show errors]
                          │                     YES
                          ↓                      ↓
[Commit-msg hook runs] ──┬─> [Format valid?] ──NO──> [Commit blocked, show format]
                          │                     YES
                          ↓                      ↓
                     [Commit succeeds]
                          ↓
                     [git push]
                          ↓
[Pre-push hook runs] ──┬─> [Integration tests pass?] ──NO──> [Push blocked, show test failures]
                       │    (Real mode: 30+ seconds)    YES
                       ↓                                  ↓
                  [Push succeeds]
```

### CI Workflow States (Defense-in-Depth)

```
[PR created / Push to PR branch]
    ↓
[CI jobs run in parallel]:
├─> [pre-commit-validation] ──> Re-run lint-staged
├─> [integration-tests-mock] ──> Run tests in mock mode (CI=true)
└─> [other jobs] ──> Build, unit tests, code quality
    ↓
[All jobs complete]
    ↓
[Branch protection evaluates] ──┬─> [All checks pass?] ──NO──> [Merge blocked]
                                 │                        YES
                                 ↓                         ↓
                            [Merge allowed]
                                 ↓
                            [Merge to main]
                                 ↓
                      [Release workflow triggers]
                                 ↓
          [Analyze commits] ──> [Determine version] ──> [Update package.json]
                                 ↓
     [Generate CHANGELOG] ──> [Create git tag] ──> [Publish npm] ──> [Create GitHub release]
```

### Test Mode State Transition

```
[Integration tests execute]
    ↓
[Mode detection]:
├─> process.env.CI === 'true' ──> MOCK mode
├─> !process.env.BUSINESSMAP_API_TOKEN_FIMANCIA ──> MOCK mode
└─> Local + credentials present ──> REAL mode
    ↓
[REAL mode]:                      [MOCK mode]:
├─> Load fixtures                 ├─> Load fixtures
├─> Initialize MCP server         ├─> Validate config structure
├─> Call actual API               ├─> Check env var presence/format
└─> Validate deep responses       └─> Skip server initialization
    ↓                                 ↓
[Exit with code 0/1]              [Exit with code 0/1]
```

---

## Summary

This data model defines 6 configuration entities with clarification updates:

1. **Branch Protection**: Requires all CI jobs including integration-tests-mock
2. **Git Hooks (Two-Tier)**: Pre-commit (<2s) + Pre-push (unlimited, integration tests)
3. **Commit Messages**: Conventional format for semantic-release
4. **CI Workflow (Dual-Mode)**: Pre-commit validation + integration-tests-mock (CI=true)
5. **Release Configuration**: Automated npm publishing via semantic-release
6. **Integration Test Fixtures**: Support both real mode (local) and mock mode (CI)

**Key Clarification Impacts**:
- Pre-push hook added (separate from pre-commit, runs integration tests with real credentials)
- Dual-mode testing architecture (real mode local, mock mode CI)
- Defense-in-depth validation (local hooks + CI bypass detection)
- Security maintained (no CI credentials, mock-mode validation only)

All schemas validated against tool-specific documentation and updated with 2025-11-07 clarifications.