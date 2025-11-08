# Feature Specification: Five-Layer Quality Control System

**Feature Branch**: `002-quality-control-system`
**Created**: 2025-11-02
**Status**: Draft
**Input**: User description: "Issue #19: Implement Five-Layer Quality Control System to Prevent Baseline Errors"

## Clarifications

### Session 2025-11-07

- Q: GitHub Actions has NO access to BUSINESSMAP_API_TOKEN_* secrets but integration tests must verify env validation. How should integration tests validate environment variables they cannot access? → A: Integration tests run in local pre-commit/pre-push hooks where developer has real credentials. CI runs mock-based validation (presence/format checks) for contributors without credentials. This catches schema bugs early while maintaining security.
- Q: What happens if developer bypasses pre-push hooks with `git push --no-verify`? → A: CI reruns integration tests in mock mode (presence/format validation). Branch protection blocks merge if CI integration tests fail. Maintains defense-in-depth (local real-credential tests + CI mock-mode backup).
- Q: Pre-push hooks run full integration tests with real server initialization (potentially 10-30+ seconds). What's acceptable performance threshold? → A: No hard time limit. Thorough testing with real server initialization prioritized over speed. Accept 30+ second delays for comprehensive validation (prevents production bugs worth the wait).

### Session 2025-11-08

- Q: What should CI mock-based integration tests validate when contributors lack real credentials? → A: Full config schema validation + server initialization with mocked external calls. Tests verify BusinessMap server can initialize, load config correctly, and validate structure without requiring actual API connectivity.
- Q: How should integration tests detect whether to run in mock mode (CI) vs real credentials mode (local)? → A: Credential presence detection. If BUSINESSMAP_API_TOKEN_* environment variables exist, run real mode. If missing, automatically run mock mode. Implicit detection eliminates configuration overhead.
- Q: How should branch protection rules be configured on the main branch? → A: GitHub Actions workflow runs on first main push to self-configure. Automated setup eliminates manual steps, ensures correct configuration, and provides idempotent updates.
- Q: How should conventional commit scopes be validated in commit messages? → A: Scope optional, freeform when provided. Both "fix(api): message" and "fix: message" valid. No maintenance overhead of scope lists. Maximum flexibility for solo developer.
- Q: When pre-commit hooks fail (lint/format/type errors), what guidance should be provided to developers? → A: Inline error with fix command suggestion. Shows specific errors plus actionable fix command (e.g., "ESLint errors found. Run: npm run lint:fix"). Fastest feedback loop.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Prevent Breaking Code from Reaching Main Branch (Priority: P1)

Developers need assurance that broken code cannot reach the main branch, eliminating the risk of production bugs from direct commits or merged PRs with failing tests.

**Why this priority**: Highest business impact - directly prevents all three historical bugs (import errors, config mismatches, env validation) from reaching production.

**Independent Test**: Create PR with intentional breaking change (e.g., wrong import statement). Verify PR cannot be merged until fixed. Delivers immediate value by blocking production bugs.

**Acceptance Scenarios**:

1. **Given** branch protection auto-configured on first main push, **When** developer attempts to push directly to main, **Then** push is rejected with "branch protection" error message
2. **Given** PR with failing CI checks exists, **When** developer clicks merge button, **Then** button is disabled with "Required checks must pass" message
3. **Given** PR with passing CI checks exists, **When** developer clicks merge button, **Then** merge succeeds without manual approval

---

### User Story 2 - Catch Errors Locally Before Commit (Priority: P2)

Developers want immediate feedback on code quality issues before committing, avoiding the slow feedback loop of waiting for CI to fail.

**Why this priority**: Improves developer productivity by catching errors in seconds vs. minutes, reducing context switching.

**Independent Test**: Make code change with linting error. Attempt commit. Verify commit blocked with actionable error. Delivers value by reducing CI failures and wait time.

**Acceptance Scenarios**:

1. **Given** developer stages files with linting errors, **When** `git commit` executes, **Then** commit blocked with specific linting errors and actionable fix command (e.g., "Run: npm run lint:fix")
2. **Given** developer stages files with TypeScript errors, **When** `git commit` executes, **Then** commit blocked with type error diagnostics and file locations
3. **Given** developer stages well-formatted, type-safe code, **When** `git commit` executes, **Then** pre-commit hooks complete in under 2 seconds and commit succeeds

---

### User Story 3 - Enforce Consistent Commit Messages (Priority: P3)

Project maintains automated release workflow requiring conventional commit format for accurate version bumping and changelog generation.

**Why this priority**: Enables Layer 5 (automated releases), but doesn't directly prevent bugs. Lower priority than direct quality gates.

**Independent Test**: Attempt commit with non-conventional message (e.g., "Fixed bug"). Verify blocked with format guidance. Delivers value by ensuring release automation works correctly.

**Acceptance Scenarios**:

1. **Given** developer attempts commit with message "Fixed bug", **When** commit executes, **Then** commit blocked with conventional format examples
2. **Given** developer attempts commit with message "fix: resolve timeout error" or "fix(api): resolve timeout error", **When** commit executes, **Then** commit succeeds (scope optional, freeform)
3. **Given** developer attempts commit with message "FEAT: add new feature", **When** commit executes, **Then** commit blocked with "subject must be lowercase" error

---

### User Story 4 - Automated Releases Without Manual Intervention (Priority: P4)

Team needs fully automated releases that eliminate manual version bumps, which historically required direct commits to main (bypassing quality checks).

**Why this priority**: Important for operational efficiency but doesn't directly prevent bugs. Depends on P3 (conventional commits).

**Independent Test**: Merge PR with `feat:` commit. Verify new minor version released to npm within 5 minutes with generated changelog. Delivers value by eliminating manual release errors.

**Acceptance Scenarios**:

1. **Given** PR with `fix:` commits merged to main, **When** 5 minutes elapse, **Then** patch version released (e.g., 1.0.0 → 1.0.1) with changelog entry
2. **Given** PR with `feat:` commits merged to main, **When** 5 minutes elapse, **Then** minor version released (e.g., 1.0.0 → 1.1.0) with changelog entry
3. **Given** PR with `BREAKING CHANGE:` commits merged to main, **When** 5 minutes elapse, **Then** major version released (e.g., 1.0.0 → 2.0.0) with changelog entry

---

### User Story 5 - Verify Server Initialization Locally Before Commit (Priority: P5)

Integration tests must catch runtime errors that only manifest during server startup, config loading, or environment validation - errors missed by unit tests. Tests run in local pre-commit/pre-push hooks with real credentials.

**Why this priority**: Catches specific historical bugs but depends on P1 (branch protection) to enforce. Lower priority than enforcement mechanisms.

**Independent Test**: Add integration test that loads server modules. Introduce import error. Attempt commit/push. Verify blocked with clear error. Delivers value by catching initialization bugs before CI.

**Acceptance Scenarios**:

1. **Given** code with import error (e.g., named import vs default), **When** pre-push hook runs integration tests, **Then** push blocked at module loading with import error message
2. **Given** code with config schema error (e.g., wrong field name), **When** pre-push hook runs integration tests, **Then** push blocked at config validation with schema mismatch error
3. **Given** code with env validation bug (e.g., requires wrong env vars), **When** pre-push hook runs integration tests, **Then** push blocked at environment check with validation error (using real credentials from local environment)

---

### Edge Cases

- **Edge Case 1 - Developer Bypasses Hooks**: Developer runs `git commit --no-verify` or `git push --no-verify`. CI re-runs pre-commit validation and integration tests (full config schema validation + server initialization with mocked external calls). Branch protection blocks merge if any CI checks fail.
- **Edge Case 2 - CI Passes But Runtime Error**: Bug only appears during MCP server startup. Local pre-push hook integration tests catch this with real server initialization (both single and multi-instance modes). CI runs full config schema validation + server initialization with mocked external calls as backup.
- **Edge Case 3 - Breaking Change Wrong Commit Type**: Developer commits breaking change with `fix:` instead of `BREAKING CHANGE:`. Commit message validation enforces format but cannot detect semantic mismatch. Post-release correction required.
- **Edge Case 4 - NPM Token Expired**: Automated release fails due to expired NPM_TOKEN. GitHub Actions workflow fails with authentication error. Manual token refresh and workflow re-run required.
- **Edge Case 5 - Developer Missing Local Credentials**: Developer lacks BUSINESSMAP_API_TOKEN_* environment variables locally. Integration tests automatically switch to mock mode (credential presence detection). Tests run successfully with mocked external calls. Same behavior as CI environment.
- **Edge Case 6 - Branch Protection Setup Fails**: First main push triggers branch protection workflow but GitHub API call fails (rate limit/permissions). Workflow logs error with actionable guidance. Developer retries by pushing empty commit to main. Idempotent workflow safely re-runs.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST automatically configure branch protection on first main push via GitHub Actions workflow (prevent direct commits, enforce PR workflow)
- **FR-002**: System MUST require all status checks to pass before allowing PR merge (configured automatically)
- **FR-003**: System MUST block force pushes and branch deletions on main branch (configured automatically)
- **FR-004**: System MUST allow solo developer to self-merge PRs without manual approval (no required reviewers in auto-config)
- **FR-005**: System MUST run pre-commit hooks on every commit attempt (lint, format, type-check) and provide inline errors with fix command suggestions on failure (e.g., "ESLint errors found. Run: npm run lint:fix")
- **FR-006**: System MUST complete pre-commit hooks in under 2 seconds for typical changes (10 or fewer staged files) (measured by SC-002)
- **FR-007**: System MUST validate commit messages against conventional commit format (type required, scope optional and freeform, subject required)
- **FR-008**: System MUST block commits with invalid format and provide format examples (both "fix: message" and "fix(scope): message" shown as valid)
- **FR-009**: System MUST re-run pre-commit validation and integration tests in CI to catch bypassed hooks (`git commit --no-verify` or `git push --no-verify`)
- **FR-010**: System MUST run integration tests verifying server startup, config loading, and env validation in local pre-push hooks (with real credentials). CI MUST run full config schema validation + server initialization with mocked external calls (validates structure without actual API connectivity) for contributors without credentials. Pre-push integration tests have no hard time limit (expect 30-60s typical, thoroughness prioritized over speed). Test mode detection MUST use credential presence (BUSINESSMAP_API_TOKEN_* exist → real mode, missing → mock mode).
- **FR-011**: System MUST provide integration test fixtures for valid and invalid configurations with automatic mode switching based on credential presence
- **FR-012**: System MUST analyze commits since last release to determine version bump type
- **FR-013**: System MUST update package.json, generate CHANGELOG, create git tag, publish GitHub release, and publish to npm - all automated
- **FR-014**: System MUST complete automated releases within 5 minutes of merge to main (measured by SC-006)
- **FR-015**: System MUST skip CI on release commits (prevent infinite loop with `[skip ci]` flag)
- **FR-016**: Branch protection self-configuration workflow MUST be idempotent (safe to run multiple times, updates config if needed)

### Key Entities

- **Branch Protection Rules**: Main branch configuration including required status checks, force push settings, deletion settings (auto-configured via GitHub API)
- **Branch Protection Setup Workflow**: GitHub Actions workflow triggered on main push, calls GitHub API to configure protection rules, requires GITHUB_TOKEN with admin permissions
- **Pre-commit Hook Configuration**: Husky hook definitions, lint-staged file pattern rules, command sequences, error message templates with fix command suggestions
- **Commit Message Rules**: Allowed types (feat, fix, docs, etc.), subject case rules, header length limits, optional freeform scope (e.g., "fix(api): message" or "fix: message" both valid)
- **CI Workflow Definitions**: Job configurations (build, test, code quality, integration tests, branch protection setup), environment secrets, status check names, trigger conditions
- **Release Configuration**: Semantic-release plugins, version calculation rules (feat→minor, fix→patch, BREAKING CHANGE→major), CHANGELOG generation templates, asset file patterns, npm publish settings
- **Integration Test Fixtures**: Multi-instance valid config, single-instance valid config, invalid schema config (apiTokenEnvVar error), test environment variables, expected error patterns, mock factory for external API calls (auto-activated when credentials absent), credential presence detector

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 0 direct commits to main branch possible (100% rejected)
- **SC-002**: Pre-commit hooks (lint, format, type-check) complete in under 2 seconds for changes affecting up to 10 files. Pre-push hooks (integration tests) have no time limit.
- **SC-003**: 100% of commits follow conventional format (enforced by commitlint)
- **SC-004**: 100% of three historical bug types (import errors, config mismatches, env validation) caught before merge
- **SC-005**: 100% of releases automated (zero manual version bumps required)
- **SC-006**: Automated releases complete within 5 minutes of merge to main
- **SC-007**: 100% of initialization code paths covered by integration tests in local pre-push hooks (server startup, config loading, env validation with real credentials)
- **SC-008**: CI completes all jobs within 10 minutes for typical PR
- **SC-009**: Branch protection auto-configured successfully on first main push (100% automation, zero manual UI configuration)

### Assumptions _(optional)_

- GITHUB_TOKEN in Actions has admin permissions for branch protection API calls (default for repository owner)
- NPM_TOKEN secret available for automated npm publishing
- Developer local environment optionally has BUSINESSMAP_API_TOKEN_FIMANCIA and BUSINESSMAP_API_TOKEN_KERKOW for real-credential integration testing (tests auto-switch to mock mode if absent)
- 80% of existing commits already follow conventional format (verified from issue description)
- Solo developer workflow (no code review approval required)
- Git client version 2.9+ (supports Husky pre-commit hooks)
- Development environment supports Node 18.x, 20.x, and 22.x
- Existing Jest test infrastructure compatible with integration tests
- Project follows semantic versioning (major.minor.patch)
- High-frequency releases acceptable (can release on every main branch merge)

### Dependencies _(optional)_

**External Dependencies**:

- GitHub Branch Protection API (requires repository admin access)
- GitHub Actions (CI/CD execution environment)
- npm Registry (package publication target)
- Husky (git hooks management npm package)
- lint-staged (staged files processing npm package)
- commitlint (commit message validation npm package)
- semantic-release (automated release orchestration npm package)
- Jest (test framework for integration tests)

**Internal Dependencies**:

- Existing CI workflow must be extended (not replaced)
- package.json must support new scripts (prepare, test:integration)
- TypeScript configuration must allow `tsc --noEmit` for type-checking
- ESLint configuration must be compatible with auto-fix
- Prettier configuration must be compatible with staged file formatting

**Dependency Risks**:

- Husky installation requires `npm install` to initialize hooks (onboarding friction)
- Missing CI secrets cause integration test failures (operational dependency)
- Expired NPM_TOKEN breaks automated publishing (monitoring required)
- GitHub API rate limits may delay branch protection self-configuration on first main push (idempotent retry safe)
- Insufficient GITHUB_TOKEN permissions block branch protection setup (requires repository admin/owner)

### Out of Scope _(optional)_

- Required code review (solo developer can self-merge)
- Manual release override mechanism (automation-only workflow)
- Automated rollback on failed releases (manual intervention required)
- Performance/load testing in CI (only functional integration tests)
- Dependency vulnerability scanning (separate security concern)
- Automated API documentation generation (separate documentation concern)
- Cross-repository enforcement (only businessmap-mcp repository)
- Windows/PowerShell hook support (Bash-based hooks for macOS/Linux only)
- Custom release channels (only main branch releases, no beta/alpha)
- Granular hook bypass mechanism (all-or-nothing enforcement)

### Security & Compliance _(optional)_

**Secret Management**:

- NPM_TOKEN stored as GitHub Actions secret (encrypted at rest)
- `.env` files excluded from git (via .gitignore)
- Test fixtures use placeholder tokens (not real credentials)

**Access Control**:

- Branch protection prevents force push (preserves audit trail)
- Commit signatures not required (solo developer, assumed trusted environment)
- Repository admin privileges required for initial setup (elevated privileges temporary)

**Supply Chain Security**:

- Husky, lint-staged, commitlint, semantic-release are npm dependencies (supply chain risk)
- Dependencies should be audited regularly (out of scope for this feature)
- `package-lock.json` committed (ensures reproducible builds)

**Audit Trail**:

- All commits logged in git history (immutable after branch protection enabled)
- GitHub Actions logs retained for 90 days (default retention)
- Release notes provide traceability (commit → release mapping)

**Change Control**:

- Enforced PR workflow provides change approval mechanism (self-approval for solo dev)
- Conventional commits provide structured change categorization
- Automated releases ensure consistent process (no manual drift)
