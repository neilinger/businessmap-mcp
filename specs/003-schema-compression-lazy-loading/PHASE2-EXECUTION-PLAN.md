# Phase 2 Execution Plan - Token Optimization

**Feature**: Token Optimization Phase 2 - Schema Compression and Lazy Loading
**Created**: 2025-11-19
**Status**: ✅ Strategic Planning Complete - Ready for Phase 2 Execution

---

## Executive Summary

Phase 1 (Strategic Planning) has completed analysis of 74 implementation tasks and designed a CEO-delegation execution strategy for Phase 2.

**Goal**: Reduce MCP server initialization from 38,900 to ~12,500 tokens (68% reduction)

**Approach**: Delegate each task to specialist agents following CEO model

**Status**: All planning deliverables ready for Phase 2 execution in separate Claude instance

---

## Deliverables Created

### 1. Task→Agent Mapping Analysis ✅
**Location**: `task-agent-mapping.md`
**Contents**:
- 74 tasks categorized by complexity (🟢 Simple, 🟡 Moderate, 🔴 Complex)
- Domain tags (TypeScript, Zod, Testing, Measurement, Docs, Bash, Review)
- Specialist agent assignments for each task
- Rationale for agent selection
- Quality gates by phase
- Parallelization opportunities

**Key Findings**:
- 37 Simple tasks (50%)
- 29 Moderate tasks (39%)
- 8 Complex tasks (11%)
- 42 parallelizable tasks (56.7%)

**Agent Distribution**:
- `general-purpose`: 54 tasks (73%)
- `shell-scripting:bash-pro`: 14 tasks (19%)
- `comprehensive-review:code-reviewer`: 4 tasks (5%)
- `full-stack-orchestration:test-automator`: 5 tasks (7%)

### 2. Delegation Gaps Documentation ✅
**Location**: `.claude/memory/delegation-gaps.md`
**Contents**:
- Critical gap: TypeScript/Node.js specialist (affects 48 tasks, 65%)
- Moderate gap: Documentation specialist (affects 11 tasks, 15%)
- Mitigation strategies (use general-purpose + code review validation)
- Recommendations for future agent development

### 3. Parameter-Prompt for /speckit.implement ✅
**Location**: See "Execution Command" section below
**Design**: Optimized by `llm-application-dev:prompt-engineer`
**Features**:
- Clear CEO delegation instructions
- Phase-by-phase execution guidance
- Quality gate enforcement
- Progress tracking with serena
- Tool usage protocols (TodoWrite, Task, serena, sequential-thinking)

---

## Execution Command for Phase 2

Copy and paste this command into a **separate Claude instance**:

```bash
/speckit.implement You are executing the implementation plan for Token Optimization Phase 2 - BusinessMap MCP Server. Your goal is to reduce initialization tokens from 38,900 to ~12,500 (68% reduction) by delegating 74 tasks across 6 phases to specialist agents.

EXECUTION INSTRUCTIONS:

1. READ REQUIRED FILES (use serena tools):
   - specs/003-schema-compression-lazy-loading/task-agent-mapping.md (agent assignments, quality gates)
   - specs/003-schema-compression-lazy-loading/tasks.md (complete task list, dependencies)
   - .claude/memory/delegation-gaps.md (specialist gaps, mitigations)

2. SETUP PHASE TRACKING:
   - Use TodoWrite to create 6 phase-level todos: Setup, Foundational Infrastructure, User Story 2, User Story 1, User Story 3, Validation & Documentation
   - Mark phase as in_progress when starting, completed when quality gate passed

3. DELEGATION MODEL (CEO Role):
   - For EACH task: Delegate via Task() tool to specialist agent listed in task-agent-mapping.md
   - NEVER implement code yourself - you are the CEO orchestrating specialists
   - Pass necessary context from spec files to each specialist
   - For TypeScript/docs gaps: Use general-purpose agent + note limitation in delegation-gaps.md

4. EXECUTION SEQUENCE:
   - Execute phases in order: Setup → Foundational → US2 → US1 → US3 → Validation
   - Within each phase: Respect task dependencies shown in tasks.md
   - Parallelize tasks marked [P] or where mapping indicates independence
   - After EACH task completion: Use serena to mark [X] in tasks.md

5. QUALITY GATES (enforce between phases per task-agent-mapping.md):
   - Setup: Build succeeds, no TypeScript errors
   - Foundational: Token measurements infrastructure working, baseline captured
   - US2: Schema validation tests pass, token reduction measured
   - US1: Lazy loading tests pass, initialization tokens <15,000
   - US3: Cache tests pass, repeated calls optimized
   - Validation: All tests pass, documentation complete, target <12,500 tokens achieved

6. PROGRESS REPORTING:
   - After each phase: Report completion percentage and token metrics
   - Use serena to verify task status in tasks.md
   - Document any blockers or delegation gaps discovered

7. TOOLS TO USE:
   - serena: Read specs, mark tasks complete, track progress
   - Task(): Delegate to specialists (primary workflow)
   - TodoWrite: Phase-level tracking
   - sequential-thinking: Complex decisions only

START EXECUTION: Begin with Setup phase (tasks S.1-S.3). Read task-agent-mapping.md to identify assigned agents, then delegate each task sequentially.
```

---

## Phase 2 Execution Overview

### Phase 1: Setup & Token Measurement (6 tasks)
**Goal**: Establish baseline measurements
**Quality Gate**: Baseline shows ~38,900 tokens across 65 tools
**Estimated Time**: 1-2 hours
**Key Tasks**: Create metrics infrastructure, run baseline measurement

### Phase 2: Foundational - Shared Schemas (9 tasks)
**Goal**: Extract common parameters
**Quality Gate**: All schemas compile with Zod
**Estimated Time**: 2-3 hours
**Key Tasks**: Define SharedParams, PlacementSchema, MetadataSchema, card schemas
**Parallel**: T008-T010, T011-T015

### Phase 3: User Story 2 - Schema Compression (18 tasks)
**Goal**: Compress top 3 tools from 9,200 to ≤5,600 tokens
**Quality Gate**: 39% reduction verified by token measurement
**Estimated Time**: 4-6 hours
**Key Tasks**: Compress create_card, update_card, list_cards + handlers + validation
**Parallel**: T016-T019 || T020-T023 || T024-T027

### Phase 4: User Story 1 - Profile-Based Registration (17 tasks)
**Goal**: Implement three-tier profile system
**Quality Gate**: minimal ≤9k, standard ≤20k, full ~38.9k tokens
**Estimated Time**: 3-5 hours
**Key Tasks**: Create tool-profiles.ts, update setupTools(), integration tests
**Parallel**: T035-T037, T043-T046, T047-T049

### Phase 5: User Story 3 - Description Optimization (15 tasks)
**Goal**: Compress descriptions to ≤5 words
**Quality Gate**: 1,500-2,500 token reduction
**Estimated Time**: 2-3 hours
**Key Tasks**: Audit and compress all 65 tool descriptions
**Parallel**: T052-T062 (all compression tasks)

### Phase 6: Final Validation & Polish (9 tasks)
**Goal**: Verify 68% reduction, 100% functionality preserved
**Quality Gate**: Total ≤12,500 tokens, coverage ≥95%, all tests pass
**Estimated Time**: 2-3 hours
**Key Tasks**: Complete token measurement, integration tests, documentation

**Total Estimated Time**: 14-22 hours of delegated agent work

---

## Success Criteria

### Technical Targets
- ✅ 68% token reduction (38,900 → 12,500 tokens for standard profile)
- ✅ 100% functionality preserved (all existing tools work)
- ✅ Test coverage ≥95% for all modified code
- ✅ All Zod schemas compile without errors
- ✅ Profile registration time <2 seconds

### Quality Metrics
- ✅ All quality gates pass
- ✅ Code review validation complete
- ✅ Integration tests pass
- ✅ Migration guide created
- ✅ CHANGELOG updated

### Deliverables
- ✅ Compressed schemas for all 65 tools
- ✅ Profile-based registration system (minimal/standard/full)
- ✅ Optimized descriptions (≤5 words average)
- ✅ Token measurement infrastructure
- ✅ Complete documentation

---

## Risk Mitigation

### Known Risks
1. **TypeScript Specialist Gap**
   - Impact: 48 tasks (65%)
   - Mitigation: Use general-purpose + code-reviewer validation
   - Documented: `.claude/memory/delegation-gaps.md`

2. **Breaking Schema Changes**
   - Impact: Client migrations required
   - Mitigation: Create comprehensive migration guide (T071)
   - Note: No backward compatibility (coordinated deployment)

3. **Token Measurement Accuracy**
   - Impact: Validation of success criteria
   - Mitigation: Per-tool breakdown required (not just session totals)
   - Quality gate: Verify measurements at each phase

### Contingency Plans
- If quality gate fails: Debug, fix, re-validate before proceeding
- If agent delegation fails: Document gap, use closest available specialist
- If tests fail: Code review, fix implementation, re-test
- If token targets missed: Analyze measurement, optimize further

---

## Post-Execution Checklist

After Phase 2 completes, verify:

- [ ] All 74 tasks marked [X] in tasks.md
- [ ] All 6 phases show quality gate PASSED
- [ ] Token reduction ≥68% verified by measurement
- [ ] All integration tests passing
- [ ] Test coverage ≥95% confirmed
- [ ] CHANGELOG.md updated
- [ ] Migration guide created
- [ ] Final metrics documented in research/final-measurements.json
- [ ] Git commit created with all changes
- [ ] PR ready for review

---

## Notes for Phase 2 Executor

### Remember
- You are the CEO - delegate EVERYTHING
- Never write code yourself
- Use TodoWrite for phase tracking
- Use serena to mark tasks complete in tasks.md
- Enforce quality gates before phase transitions
- Report progress after each phase

### Tools Available
- `Task()`: Delegate to specialists (primary workflow)
- `TodoWrite`: Phase-level progress tracking
- `serena tools`: Read files, mark tasks complete
- `sequential-thinking`: Complex decisions only (use sparingly, KISS principle)

### Agent Roster
- `general-purpose`: TypeScript implementation, general tasks
- `shell-scripting:bash-pro`: npm scripts, measurements, bash operations
- `comprehensive-review:code-reviewer`: Validation, quality checks
- `full-stack-orchestration:test-automator`: Integration test creation

### Quality Focus
- Token measurements must be accurate (per-tool breakdown)
- All tests must pass before phase completion
- Code review validation required for complex changes
- KISS principle: Keep delegation straightforward

---

## Files Created in Phase 1

1. **task-agent-mapping.md** - Complete task analysis and agent assignments
2. **delegation-gaps.md** - Specialist gaps documentation and mitigation
3. **PHASE2-EXECUTION-PLAN.md** - This file (comprehensive execution guide)

All files located in: `/Users/neil/src/solo/businessmap-mcp/specs/003-schema-compression-lazy-loading/`

---

**Status**: ✅ Phase 1 Strategic Planning Complete
**Next Step**: Execute Phase 2 command in separate Claude instance
**Expected Outcome**: 68% token reduction, 100% functionality preserved

---

*Generated by CEO strategic planning session - 2025-11-19*
