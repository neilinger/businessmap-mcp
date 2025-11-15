# Implementation Plan: Five-Layer Quality Control System

**Branch**: `002-quality-control-system` | **Date**: 2025-11-07 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-quality-control-system/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Implement a five-layer quality control system to prevent baseline errors (import errors, config mismatches, env validation failures) from reaching production. System enforces PR workflow via branch protection, validates code quality via git hooks (pre-commit: <2s for lint/format/type-check; pre-push: unlimited for integration tests with real credentials), re-validates in CI (mock-mode integration tests as bypass backstop), enforces conventional commits, and automates releases via semantic-release. Integration tests run locally with real credentials, CI runs mock-based validation for security.

## Technical Context

**Language/Version**: TypeScript with Node.js 18.x, 20.x, 22.x (existing project requirement)
**Primary Dependencies**:
  - Git hooks: Husky 9.x (pre-commit + pre-push), lint-staged 15.x
  - Commit validation: commitlint 19.x with conventional config
  - Automated releases: semantic-release 24.x
  - Testing: Jest 29.x (unit + integration tests)
  - Code quality: ESLint 9.x, Prettier 3.x, TypeScript 5.x compiler
**Storage**: N/A (configuration and workflow files only)
**Testing**: Jest 29.x with dual-mode integration tests (real-credential local, mock-credential CI)
**Target Platform**: macOS/Linux development environment + GitHub Actions CI (Node 18.x/20.x/22.x matrix)
**Project Type**: Single project (MCP server + tooling infrastructure)
**Performance Goals**:
  - Pre-commit hooks: <2 seconds for ≤10 files (lint, format, type-check)
  - Pre-push hooks: No hard limit (expect 30-60s typical for integration tests, thoroughness prioritized)
  - CI workflow: <10 minutes total (all jobs including mock-mode integration tests)
  - Automated releases: <5 minutes post-merge
**Constraints**:
  - Real credentials (BUSINESSMAP_API_TOKEN_*) only in local environment (not CI)
  - Mock-mode validation in CI (format/presence checks only, no actual API calls)
  - Branch protection blocks merge if any CI check fails (defense-in-depth)
  - Bash-based hooks (macOS/Linux only, no Windows/PowerShell support)
**Scale/Scope**:
  - Existing codebase ~10k LOC TypeScript
  - 3 historical bug types to prevent (import errors, config mismatches, env validation)
  - 2-tier hook system (fast pre-commit + thorough pre-push)
  - Dual-mode integration tests (real + mock fixtures)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### ✅ Aligned with Core Principles

**API-First Integration**: N/A - No BusinessMap API integration in this feature
**Read-Only Mode Safety**: N/A - No MCP tool changes
**Comprehensive CRUD Coverage**: N/A - No CRUD operations
**Explicit Confirmation for Destructive Operations**: N/A - No destructive operations
**Type Safety and Validation**: ✅ Jest integration tests use TypeScript, Zod validation inherited from existing codebase

### ✅ Aligned with Development Workflow

**Specification-Driven Development**: ✅ Followed `/speckit.specify` → `/speckit.clarify` → `/speckit.plan` workflow
**API Research Before Implementation**: N/A - No API dependencies
**Incremental Tool Exposure**: N/A - No new MCP tools

### ✅ Aligned with Quality Standards

**Error Handling Excellence**: ✅ Clear error messages required (pre-commit failures, missing credentials guidance)
**Performance Targets**: ✅ Explicit targets set (pre-commit <2s, CI <10m, releases <5m)
**Documentation Standards**: ✅ Onboarding docs required for local credential setup

### ⚠️ Constitution Concerns Identified

**Developer Experience Friction** (see Complexity Tracking below):
- 30+ second pre-push hooks may frustrate developers
- Missing local credentials blocks push entirely
- **Mitigation**: Spec explicitly accepts delays; Edge Case 5 addresses credential guidance

**CI Duplication Complexity**:
- Integration tests run twice (local real + CI mock) increases maintenance
- **Justification**: Required for security (no CI secrets) + defense-in-depth (bypass detection)

**Hook Bypass Detection Gap**:
- `--no-verify` bypass only caught in CI (delayed feedback)
- **Mitigation**: Branch protection blocks merge; clear CI error messages

### 🟢 GATE PASSED

All constitutional principles respected. Complexity concerns documented and justified. Proceed to Phase 0 research.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
# Git Hooks (Husky-managed)
.husky/
├── pre-commit           # Fast validation: lint, format, type-check (<2s)
└── pre-push            # Thorough validation: integration tests (unlimited)

# Integration Tests (dual-mode: real credentials local, mock CI)
tests/
└── integration/
    ├── server-initialization.test.ts   # Import error detection
    ├── config-validation.test.ts       # Schema mismatch detection
    ├── env-validation.test.ts          # Environment variable validation
    └── fixtures/
        ├── valid-multi-instance.json   # Real + mock modes
        ├── valid-single-instance.json  # Real + mock modes
        └── invalid-schema.json         # Real + mock modes

# Configuration Files (root)
├── .husky/
├── .lintstagedrc.json                  # Pre-commit file patterns
├── .commitlintrc.json                  # Conventional commit rules
├── .releaserc.json                     # Semantic-release config
├── jest.integration.config.js          # Integration test config
└── package.json                        # Scripts: prepare, test:integration

# CI Workflow
.github/
└── workflows/
    └── ci.yml                          # Extended with integration-tests-mock job
```

**Structure Decision**: Single project structure (Option 1). This feature adds git hooks, integration tests, and CI workflow extensions to existing MCP server codebase. No new src/ code required - only tooling infrastructure (hooks, tests, configs). Integration tests run against existing src/ modules to validate server initialization, config loading, and environment validation.

## Complexity Tracking

| Concern | Why Needed | Simpler Alternative Rejected Because |
|---------|------------|-------------------------------------|
| Dual-mode integration tests (real + mock) | CI cannot have BUSINESSMAP_API_TOKEN secrets (security). Local tests need real validation (catch actual bugs). | Single mode insufficient: Real-only blocks CI contributors; Mock-only misses actual initialization bugs |
| Two-tier hook system (pre-commit + pre-push) | Pre-commit must be <2s (developer flow). Integration tests take 30+ seconds (server initialization). | Single pre-commit hook insufficient: Would violate <2s budget. No hooks insufficient: Misses local validation entirely |
| CI validation duplication (re-run hooks) | Developers can bypass hooks with `--no-verify`. Branch protection needs enforcement backstop. | Trust-based approach insufficient: Historical bugs show need for defense-in-depth. Git server-side hooks unavailable (GitHub limitation) |
