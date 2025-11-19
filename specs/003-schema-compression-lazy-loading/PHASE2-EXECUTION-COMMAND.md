# Phase 2 Execution Command (UPDATED)

**Status**: ✅ Optimized with 6 new specialist agents
**Last Updated**: 2025-11-19

---

## Copy This Command to Separate Claude Instance

```bash
/speckit.implement You are executing the implementation plan for Token Optimization Phase 2 - BusinessMap MCP Server. Your goal is to reduce initialization tokens from 38,900 to ~12,500 (68% reduction) by delegating 74 tasks across 6 phases to specialist agents.

EXECUTION INSTRUCTIONS:

1. READ REQUIRED FILES (use Read tool):
   - specs/003-schema-compression-lazy-loading/task-agent-mapping.md (NEW: optimized agent assignments)
   - specs/003-schema-compression-lazy-loading/tasks.md (complete task list, dependencies)
   - .claude/memory/delegation-gaps.md (NEW: gaps RESOLVED, 100% specialist coverage)

2. SETUP PHASE TRACKING:
   - Use TodoWrite to create 6 phase-level todos: Setup (T001-T006), Foundational (T007-T015), User Story 2 (T016-T033), User Story 1 (T034-T050), User Story 3 (T051-T065), Validation (T066-T074)
   - Mark phase as in_progress when starting, completed when quality gate passed

3. DELEGATION MODEL (CEO Role):
   - For EACH task: Delegate via Task() tool to specialist agent listed in task-agent-mapping.md
   - NEVER implement code yourself - you are the CEO orchestrating specialists
   - Pass necessary context from spec files to each specialist
   - USE THESE SPECIALIST AGENTS (general-purpose ELIMINATED):
     * javascript-typescript:typescript-pro (32 tasks, 43%) - TypeScript, Zod, Node.js
     * shell-scripting:bash-pro (15 tasks, 20%) - npm scripts, measurements
     * documentation-generation:reference-builder (12 tasks, 16%) - API docs, descriptions
     * full-stack-orchestration:test-automator (6 tasks, 8%) - Integration tests
     * comprehensive-review:code-reviewer (5 tasks, 7%) - Code validation
     * documentation-generation:docs-architect (3 tasks, 4%) - Technical docs
     * documentation-generation:tutorial-engineer (1 task, 1%) - Migration guide

4. EXECUTION SEQUENCE:
   - Execute phases in order: Setup → Foundational → US2 → US1 → US3 → Validation
   - Within each phase: Respect task dependencies shown in tasks.md
   - Parallelize tasks marked [P] or where mapping indicates independence
   - After EACH task completion: Mark [X] in tasks.md (use Read then Edit tools)

5. QUALITY GATES (enforce between phases per task-agent-mapping.md):
   - Setup: Baseline measurement shows ~38,900 tokens, all 65 tools measured
   - Foundational: All schemas compile with Zod, schemas accept valid test inputs
   - US2: create_card ≤2,200 tokens, update_card ≤1,600 tokens, list_cards ≤1,800 tokens (total ≥5,600 saved)
   - US1: minimal profile ≤9,000 tokens, standard profile ≤20,000 tokens, full profile ~38,900 tokens
   - US3: Average description ≤5 words, 1,500-2,500 token reduction
   - Validation: 68% total reduction (38,900 → 12,500 tokens), 100% functionality preserved, test coverage ≥95%

6. PROGRESS REPORTING:
   - After each phase: Report completion percentage and token metrics
   - After each task: Mark completion in tasks.md
   - Document any blockers or issues discovered

7. TOOLS TO USE:
   - Read: Read files, tasks.md content
   - Edit: Mark tasks complete in tasks.md ([X])
   - Task(): Delegate to specialists (primary workflow)
   - TodoWrite: Phase-level tracking
   - Bash: Run measurements, tests

START EXECUTION: Begin with Setup phase (T001-T006). Read task-agent-mapping.md to identify assigned agents, then delegate each task to the specialist listed (e.g., T002 → javascript-typescript:typescript-pro, T005 → shell-scripting:bash-pro).
```

---

## Key Changes from Original Prompt

**REMOVED**:
- ❌ "For TypeScript/docs gaps: Use general-purpose agent + note limitation"
- ❌ References to general-purpose agent
- ❌ Delegation gap mitigation strategies

**ADDED**:
- ✅ Complete specialist agent roster (7 agents)
- ✅ Explicit agent assignments and percentages
- ✅ Note that general-purpose is ELIMINATED
- ✅ Reference to delegation gaps being RESOLVED
- ✅ Accurate quality gates from updated task-agent-mapping.md

**UPDATED**:
- ✅ File reading instructions (delegation-gaps.md now shows gaps resolved)
- ✅ Phase breakdown with correct task ranges (T001-T006, not S.1-S.3)
- ✅ Agent usage percentages match optimized mapping

---

## Verification Checklist

Before running in Phase 2 instance, verify:

- [ ] task-agent-mapping.md shows 0% general-purpose usage ✓
- [ ] delegation-gaps.md shows 0 active gaps ✓
- [ ] All 74 tasks have specialist agent assignments ✓
- [ ] Quality gates match updated mapping ✓
- [ ] Command references new specialist agents ✓

---

**Status**: ✅ Ready for Phase 2 execution with optimized agent roster
