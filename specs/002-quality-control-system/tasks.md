# Tasks: Five-Layer Quality Control System

**Input**: Design documents from `/specs/002-quality-control-system/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4, US5)
- Include exact file paths in descriptions

## Path Conventions

- Single project structure: repository root with `.husky/`, `.github/`, `tests/`
- Configuration files at repository root
- Integration tests in `tests/integration/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install dependencies and initialize git hooks framework

- [x] T001 Install Husky 9.x dependency in package.json
- [x] T002 [P] Install lint-staged 15.x dependency in package.json
- [x] T003 [P] Install commitlint 19.x and @commitlint/config-conventional in package.json
- [x] T004 [P] Install semantic-release 24.x and plugins in package.json (@semantic-release/changelog, @semantic-release/git, @semantic-release/github, @semantic-release/npm, @semantic-release/commit-analyzer, @semantic-release/release-notes-generator)
- [x] T005 Add "prepare": "husky install" script to package.json
- [x] T006 [P] Add "test:integration" script to package.json
- [x] T007 Run `npm install` to initialize Husky hooks directory (.husky/)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Branch protection configuration that enforces PR workflow and blocks ALL user stories from being bypassed

**⚠️ CRITICAL**: This MUST be complete before any user story implementation. Branch protection is the enforcement mechanism for all quality layers.

- [x] T008 Create branch protection setup script in scripts/setup-branch-protection.sh using gh CLI
- [x] T009 Configure initial required status checks: ["CI / Test (Node 18.x)", "CI / Test (Node 20.x)", "CI / Test (Node 22.x)", "CI / Code Quality"] in scripts/setup-branch-protection.sh (Note: CI / Pre-commit Validation and CI / Integration Tests (Mock) will be added after those jobs are created)
- [x] T010 Set enforce_admins: false, required_pull_request_reviews: null, allow_force_pushes: false, allow_deletions: false in scripts/setup-branch-protection.sh
- [x] T011 Execute scripts/setup-branch-protection.sh to apply branch protection to main branch
- [x] T012 Verify direct commits to main are blocked (manual test: attempt git push to main)

**Checkpoint**: Branch protection active - all user stories now depend on this enforcement layer

---

## Phase 3: User Story 1 - Prevent Breaking Code from Reaching Main Branch (Priority: P1) 🎯 MVP

**Goal**: Ensure broken code cannot reach main branch through CI enforcement and branch protection

**Independent Test**: Create PR with intentional breaking change (e.g., wrong import statement). Verify PR cannot be merged until fixed.

**Note**: No tests generated (not requested in spec). This story focuses on CI workflow configuration.

### Implementation for User Story 1

- [x] T013 [P] [US1] Extend .github/workflows/ci.yml with pre-commit-validation job (job name: "Pre-commit Validation", re-runs lint-staged --no-stash to catch git commit --no-verify bypasses)
- [x] T014 [P] [US1] Add integration-tests-mock job to .github/workflows/ci.yml (job name: "Integration Tests (Mock)", matrix strategy for Node 18.x/20.x/22.x, env.CI: true)
- [x] T015 [US1] Verify ci.yml job names match required_status_checks contexts format "CI / {job name}" (e.g., "CI / Pre-commit Validation", "CI / Integration Tests (Mock)")
- [x] T016 [US1] Add checkout, setup-node, npm ci steps to pre-commit-validation job in .github/workflows/ci.yml
- [x] T017 [US1] Add checkout, setup-node, npm ci, test:integration steps to integration-tests-mock job in .github/workflows/ci.yml
- [x] T018 [US1] Document that integration-tests-mock job intentionally omits BUSINESSMAP_API_TOKEN secrets (runs in mock mode)
- [x] T018a [US1] Configure GitHub Actions job timeouts (timeout-minutes: 10 for each job) in .github/workflows/ci.yml and document baseline CI timing in README.md

**Checkpoint**: CI workflow enforces quality gates. Branch protection blocks merge if any check fails.

---

## Phase 4: User Story 2 - Catch Errors Locally Before Commit (Priority: P2)

**Goal**: Provide immediate feedback on code quality issues via pre-commit hooks (<2s target)

**Independent Test**: Make code change with linting error. Attempt commit. Verify commit blocked with actionable error.

**Note**: No tests generated (not requested in spec). This story focuses on git hook configuration.

### Implementation for User Story 2

- [x] T019 [US2] Create .husky/pre-commit hook file running npx lint-staged
- [x] T020 [US2] Create .lintstagedrc.json with patterns: "\*.{ts,tsx}": ["eslint --fix", "prettier --write", "bash -c 'tsc --noEmit'"]
- [x] T021 [P] [US2] Add "\*.{json,md}": ["prettier --write"] pattern to .lintstagedrc.json
- [x] T022 [US2] Make .husky/pre-commit executable (chmod +x .husky/pre-commit)
- [x] T023 [US2] Verify pre-commit hook runs in under 2 seconds for typical changes (manual test: stage 10 files and commit)
- [x] T024 [US2] Verify pre-commit hook blocks commit with clear error messages (manual test: introduce linting error and attempt commit)

**Checkpoint**: Pre-commit hooks catch lint/format/type errors immediately (<2s feedback loop)

---

## Phase 5: User Story 3 - Enforce Consistent Commit Messages (Priority: P3)

**Goal**: Enforce conventional commit format for automated release workflow compatibility

**Independent Test**: Attempt commit with non-conventional message (e.g., "Fixed bug"). Verify blocked with format guidance.

**Note**: No tests generated (not requested in spec). This story focuses on commit message validation.

### Implementation for User Story 3

- [x] T025 [US3] Create .commitlintrc.json extending @commitlint/config-conventional
- [x] T026 [US3] Configure rules in .commitlintrc.json: type-enum (feat, fix, docs, style, refactor, test, chore, perf, ci, build, revert), subject-case (never uppercase), header-max-length (100)
- [x] T027 [US3] Create .husky/commit-msg hook file running npx --no -- commitlint --edit $1
- [x] T028 [US3] Make .husky/commit-msg executable (chmod +x .husky/commit-msg)
- [x] T029 [US3] Verify commit-msg hook blocks invalid formats (manual test: attempt commit with "Fixed bug" message)
- [x] T030 [US3] Verify commit-msg hook allows valid formats (manual test: commit with "fix: resolve timeout error" message)

**Checkpoint**: All commits follow conventional format, enabling automated release workflow

---

## Phase 6: User Story 4 - Automated Releases Without Manual Intervention (Priority: P4)

**Goal**: Fully automated releases that eliminate manual version bumps via semantic-release

**Independent Test**: Merge PR with `feat:` commit. Verify new minor version released to npm within 5 minutes with generated changelog.

**Note**: No tests generated (not requested in spec). This story focuses on release automation configuration.

### Implementation for User Story 4

- [x] T031 [US4] Create .releaserc.json with branches: ["main"] and standard plugins array
- [x] T032 [US4] Configure @semantic-release/commit-analyzer plugin in .releaserc.json
- [x] T033 [US4] Configure @semantic-release/release-notes-generator plugin in .releaserc.json
- [x] T034 [US4] Configure @semantic-release/changelog plugin with changelogFile: "CHANGELOG.md" in .releaserc.json
- [x] T035 [US4] Configure @semantic-release/npm plugin in .releaserc.json
- [x] T036 [US4] Configure @semantic-release/git plugin with assets: ["CHANGELOG.md", "package.json", "package-lock.json"] and message with [skip ci] flag in .releaserc.json
- [x] T037 [US4] Configure @semantic-release/github plugin in .releaserc.json
- [x] T038 [US4] Create .github/workflows/release.yml triggered on push to main branch
- [x] T039 [US4] Configure release.yml with checkout (fetch-depth: 0), setup-node, npm ci, npm run build steps
- [x] T040 [US4] Add semantic-release step to release.yml with GITHUB_TOKEN and NPM_TOKEN environment variables
- [x] T041 [US4] Set release.yml permissions: contents: write, issues: write, pull-requests: write
- [x] T042 [US4] Document that NPM_TOKEN secret must be configured in repository settings (GitHub Actions secrets)
- [x] T042a [US4] Configure GitHub Actions timeout on release job: timeout-minutes: 5 in .github/workflows/release.yml and add timing metrics to release logs (echo start/end timestamps)

**Checkpoint**: Automated releases work on every merge to main. Zero manual version bumps required.

---

## Phase 7: User Story 5 - Verify Server Initialization Locally Before Commit (Priority: P5)

**Goal**: Catch runtime initialization errors via integration tests in local pre-push hooks (real credentials, unlimited time)

**Independent Test**: Add integration test that loads server modules. Introduce import error. Attempt push. Verify blocked with clear error.

**Note**: No tests generated (not requested in spec). This story CREATES the integration test infrastructure itself.

### Implementation for User Story 5

- [x] T043 [US5] Create jest.integration.config.js with testEnvironment: 'node', testMatch: ['**/tests/integration/**/*.test.ts']
- [x] T044 [US5] Create tests/integration/setup.ts with TEST_MODE detection logic (real if BUSINESSMAP_API_TOKEN_FIMANCIA present and not CI, else mock)
- [x] T044a [US5] Add clear error message in tests/integration/setup.ts when BUSINESSMAP_API_TOKEN_FIMANCIA or BUSINESSMAP_API_TOKEN_KERKOW missing: "Integration tests require real credentials locally. See docs/ONBOARDING.md for setup instructions. CI runs in mock mode automatically."
- [x] T045 [US5] Create tests/integration/fixtures/valid-multi-instance.json with fimancia and kerkow instances (apiTokenEnv field, not apiTokenEnvVar)
- [x] T046 [P] [US5] Create tests/integration/fixtures/valid-single-instance.json with single instance configuration
- [x] T047 [P] [US5] Create tests/integration/fixtures/invalid-schema.json with intentional schema error (apiTokenEnvVar instead of apiTokenEnv)
- [x] T048 [US5] Create tests/integration/server-initialization.test.ts with dual-mode tests (real: require('../../src/index') and call listTools(); mock: load config JSON and validate structure only, no server initialization)
- [x] T049 [P] [US5] Create tests/integration/config-validation.test.ts with dual-mode schema validation tests (real: full Zod schema validation + server load; mock: JSON.parse() and check instances array structure)
- [x] T050 [P] [US5] Create tests/integration/env-validation.test.ts with dual-mode environment variable tests (real: actual callTool('list*workspaces') API connection; mock: typeof check and regex match /^BUSINESSMAP_API_TOKEN*/)
- [x] T051 [US5] Create .husky/pre-push hook file running npm run test:integration with timing output (echo start time, run tests, echo elapsed time)
- [x] T052 [US5] Make .husky/pre-push executable (chmod +x .husky/pre-push)
- [x] T053 [US5] Verify pre-push hook runs integration tests in real mode locally (manual test: ensure BUSINESSMAP_API_TOKEN_FIMANCIA env var set, attempt git push)
- [x] T054 [US5] Verify integration tests catch import errors (manual test: introduce wrong import in src/, attempt git push)
- [x] T055 [US5] Verify integration tests catch config schema errors (manual test: use invalid-schema.json fixture)
- [x] T056 [US5] Verify integration tests run in mock mode in CI (manual test: check CI logs for "Integration tests running in MOCK mode" message)
- [x] T056a [US5] Create comprehensive validation test verifying all three historical bug types caught: (1) import error test with explicit LRUCache import assertion, (2) config schema test with apiTokenEnvVar rejection, (3) env validation test with missing BUSINESSMAP_API_TOKEN assertion
- [x] T056b Update branch protection to add remaining required status checks: ["CI / Pre-commit Validation", "CI / Integration Tests (Mock)"] in scripts/setup-branch-protection.sh and re-execute

**Checkpoint**: Integration tests catch all three historical bug types (import errors, config mismatches, env validation failures) before push

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Documentation and validation across all user stories

- [x] T057 [P] Create docs/ONBOARDING.md documenting local credential setup (BUSINESSMAP_API_TOKEN_FIMANCIA, BUSINESSMAP_API_TOKEN_KERKOW) for pre-push integration tests
- [x] T058 [P] Update README.md with quality control system overview, five-layer architecture explanation, and recommendation to periodically verify branch protection active with scripts/setup-branch-protection.sh
- [x] T059 [P] Document hook bypass detection (git commit --no-verify caught by CI pre-commit-validation job, git push --no-verify caught by CI integration-tests-mock job)
- [x] T060 [P] Document dual-mode testing architecture (real mode local with credentials, mock mode CI without credentials)
- [x] T060a [P] Document NPM token rotation schedule in docs/ONBOARDING.md (recommend 90-day rotation, link to GitHub secrets page, suggest calendar reminder)
- [x] T061 Create PR with all changes and verify all five layers active (branch protection blocks merge until all CI checks pass)
- [x] T062 Test automated release workflow by merging PR with feat: commit and verifying npm publish within 5 minutes
- [x] T063 Verify quickstart.md instructions work for new developer onboarding (if quickstart.md exists)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - install packages and initialize Husky
- **Foundational (Phase 2)**: Depends on Setup - BLOCKS all user stories (branch protection must be active)
- **User Story 1 (Phase 3)**: Depends on Foundational - CI workflow that branch protection will enforce (status checks added after T056b)
- **User Story 2 (Phase 4)**: Depends on Foundational - Pre-commit hooks (blocked if branch protection allows bypass)
- **User Story 3 (Phase 5)**: Depends on Foundational - Commit message validation
- **User Story 4 (Phase 6)**: Depends on US3 (conventional commits required for release automation)
- **User Story 5 (Phase 7)**: Depends on US1 (integration-tests-mock job in CI) - Pre-push hooks complement CI validation
- **Polish (Phase 8)**: Depends on all user stories complete

### User Story Dependencies

- **User Story 1 (P1 - Branch Protection)**: Foundational phase → Can start immediately after T012
- **User Story 2 (P2 - Pre-commit hooks)**: Foundational phase → Can start after T012 (parallel with US1)
- **User Story 3 (P3 - Commit messages)**: Foundational phase → Can start after T012 (parallel with US1, US2)
- **User Story 4 (P4 - Automated releases)**: US3 complete → Requires conventional commits
- **User Story 5 (P5 - Integration tests)**: US1 complete → Depends on CI integration-tests-mock job from US1

### Critical Path

```
T001-T007 (Setup - npm dependencies)
    ↓
T008-T012 (Foundational - branch protection) ← BLOCKS EVERYTHING
    ↓
    ├─> T013-T018 (US1 - CI enforcement) ─────────────┐
    ├─> T019-T024 (US2 - Pre-commit hooks) ──────────┤
    └─> T025-T030 (US3 - Commit messages) ────────────┤
                    ↓                                  ↓
              T031-T042 (US4 - Releases)      T043-T056 (US5 - Integration tests)
                    ↓                                  ↓
                    └──────────────┬───────────────────┘
                                   ↓
                          T057-T063 (Polish)
```

### Parallel Opportunities

- **Phase 1**: T002, T003, T004 can run in parallel (different package.json dependencies)
- **Phase 1**: T006 can run in parallel with T002-T004 (different package.json script)
- **Phase 2**: All tasks sequential (branch protection setup must complete atomically)
- **Phase 3 (US1)**: T013, T014 can run in parallel (different CI workflow jobs)
- **Phase 4 (US2)**: T021 can run in parallel with T019-T020 (different config keys in .lintstagedrc.json)
- **Phase 5 (US3)**: All tasks sequential (commit message config must be complete)
- **Phase 6 (US4)**: T032-T037 sequential (semantic-release plugin order matters)
- **Phase 7 (US5)**: T046, T047 can run in parallel (different fixture files)
- **Phase 7 (US5)**: T049, T050 can run in parallel (different test files)
- **Phase 8**: T057, T058, T059, T060 can run in parallel (different documentation files)

### Within Each User Story

- **US1**: CI jobs (T013, T014) parallel → verification tasks (T015-T018) sequential
- **US2**: Hook creation (T019-T021) → make executable (T022) → manual verification (T023-T024)
- **US3**: Config creation (T025-T026) → hook creation (T027-T028) → manual verification (T029-T030)
- **US4**: Release config (T031-T037) → workflow creation (T038-T041) → documentation (T042)
- **US5**: Test infrastructure (T043-T044) → fixtures (T045-T047 parallel) → test files (T048-T050 parallel) → hook setup (T051-T052) → verification (T053-T056)

---

## Implementation Strategy

### MVP First (User Story 1 Only - Branch Protection Enforcement)

1. Complete Phase 1: Setup (T001-T007) → npm dependencies + Husky installed
2. Complete Phase 2: Foundational (T008-T012) → Branch protection active (CRITICAL BLOCKER)
3. Complete Phase 3: User Story 1 (T013-T018) → CI enforcement active
4. **STOP and VALIDATE**: Create PR with breaking change, verify merge blocked until fixed
5. Deploy/demo if ready → MVP: Production bugs blocked by CI + branch protection

### Incremental Delivery

1. **Foundation** (Phase 1-2): Setup + Branch Protection → All future stories enforced
2. **US1** (Phase 3): CI Enforcement → Test: PR with broken code cannot merge (MVP!)
3. **US2** (Phase 4): Pre-commit Hooks → Test: Local linting error blocks commit
4. **US3** (Phase 5): Commit Messages → Test: Invalid commit message blocked
5. **US4** (Phase 6): Automated Releases → Test: Merge PR, see automated npm publish
6. **US5** (Phase 7): Integration Tests → Test: Import error blocks push
7. **Polish** (Phase 8): Documentation → Complete system operational

### Parallel Team Strategy

With multiple developers:

1. **Everyone together**: Phase 1-2 (Setup + Foundational) → Foundation ready
2. **Split after T012 (branch protection active)**:
   - Developer A: User Story 1 (T013-T018) → CI workflow
   - Developer B: User Story 2 (T019-T024) → Pre-commit hooks
   - Developer C: User Story 3 (T025-T030) → Commit messages
3. **Sequential dependencies**:
   - Developer A continues: User Story 4 (T031-T042) → Releases (needs US3)
   - Developer B continues: User Story 5 (T043-T056) → Integration tests (needs US1)
4. **Everyone together**: Phase 8 (Polish) → Documentation

---

## Notes

- [P] tasks = different files, no dependencies, can run in parallel
- [Story] label maps task to specific user story for traceability (US1-US5)
- **No test tasks generated**: Spec explicitly does not request test implementation (system tests itself via git hooks and CI)
- **Branch protection is foundational**: Must complete Phase 2 before ANY user story work (enforcement mechanism for all layers)
- **Dual-mode testing**: Real credentials local (pre-push hooks), mock validation CI (security)
- **Defense-in-depth**: Local hooks (fast feedback) + CI validation (bypass detection) + branch protection (enforcement)
- **Performance targets**: Pre-commit <2s, pre-push unlimited (30+ seconds acceptable), CI <10 minutes, releases <5 minutes
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Manual verification tasks (T012, T023-T024, T029-T030, T053-T056, T061-T063) are critical for validating quality gates work correctly
