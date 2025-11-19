# Task → Agent Mapping Analysis (OPTIMIZED)
**Feature**: Token Optimization Phase 2
**Created**: 2025-11-19
**Updated**: 2025-11-19 (Added 6 new specialist agents)
**Purpose**: Strategic delegation mapping for /speckit.implement execution

---

## 🎯 New Specialist Agents Added

**TypeScript/JavaScript Specialists**:
- `javascript-typescript:typescript-pro` - TypeScript advanced types, Zod, Node.js
- `javascript-typescript:javascript-pro` - Modern JavaScript, ES6+, async patterns

**Documentation Specialists**:
- `documentation-generation:docs-architect` - Technical documentation, architecture guides
- `documentation-generation:reference-builder` - API documentation, configuration references
- `documentation-generation:tutorial-engineer` - Step-by-step tutorials, migration guides
- `api-scaffolding:api-documenter` - API documentation with OpenAPI 3.1

**Impact**: Eliminated general-purpose agent usage (was 73%, now 0%)

---

## Complexity Legend
- 🟢 **SIMPLE**: Single domain, straightforward, 1 agent
- 🟡 **MODERATE**: 2-3 domains, coordination needed, 2-3 agents
- 🔴 **COMPLEX**: Multi-domain, dependencies, 3+ agents

## Domain Tags
- `ts` - TypeScript implementation
- `zod` - Zod schema definitions
- `test` - Integration/unit testing
- `measure` - Token measurement
- `docs` - Documentation
- `bash` - Shell scripting
- `review` - Code review/validation

---

## Phase 1: Setup & Token Measurement (6 tasks)

| Task | Complexity | Domains | Agent | Rationale |
|------|------------|---------|-------|-----------|
| T001 | 🟢 SIMPLE | `bash` | shell-scripting:bash-pro | Directory creation |
| T002 | 🟡 MODERATE | `ts`, `measure` | **javascript-typescript:typescript-pro** | TypeScript + tiktoken integration |
| T003 | 🟡 MODERATE | `ts`, `measure` | **javascript-typescript:typescript-pro** | TypeScript metrics reporter |
| T004 | 🟡 MODERATE | `ts`, `bash`, `measure` | **javascript-typescript:typescript-pro** | TypeScript measurement script |
| T005 | 🟢 SIMPLE | `bash`, `measure` | shell-scripting:bash-pro | Run npm script |
| T006 | 🟢 SIMPLE | `bash`, `measure` | shell-scripting:bash-pro | Validate baseline output |

**Phase Dependencies**: None (first phase)
**Parallel Opportunities**: T002 || T003

---

## Phase 2: Foundational - Shared Schema Definitions (9 tasks)

| Task | Complexity | Domains | Agent | Rationale |
|------|------------|---------|-------|-----------|
| T007 | 🟡 MODERATE | `ts`, `zod` | **javascript-typescript:typescript-pro** | SharedParams constant with Zod |
| T008 | 🟡 MODERATE | `ts`, `zod` | **javascript-typescript:typescript-pro** | PlacementSchema with Zod |
| T009 | 🟡 MODERATE | `ts`, `zod` | **javascript-typescript:typescript-pro** | MetadataSchema with Zod |
| T010 | 🟡 MODERATE | `ts`, `zod` | **javascript-typescript:typescript-pro** | OwnersSchema with Zod |
| T011 | 🟡 MODERATE | `ts`, `zod` | **javascript-typescript:typescript-pro** | SubtaskSchema with Zod |
| T012 | 🟡 MODERATE | `ts`, `zod` | **javascript-typescript:typescript-pro** | CustomFieldUpdateSchema with Zod |
| T013 | 🟡 MODERATE | `ts`, `zod` | **javascript-typescript:typescript-pro** | CardLinkSchema with Zod |
| T014 | 🟡 MODERATE | `ts`, `zod` | **javascript-typescript:typescript-pro** | StickerSchema with Zod |
| T015 | 🟡 MODERATE | `ts`, `zod` | **javascript-typescript:typescript-pro** | AttachmentSchema with Zod |

**Phase Dependencies**: Requires T001-T006 (Setup complete)
**Parallel Opportunities**: T008 || T009 || T010, T011 || T012 || T013 || T014 || T015

---

## Phase 3: User Story 2 - Schema Compression (18 tasks)

| Task | Complexity | Domains | Agent | Rationale |
|------|------------|---------|-------|-----------|
| T016 | 🟢 SIMPLE | `ts`, `review` | **javascript-typescript:typescript-pro** | Read and analyze TypeScript schema |
| T017 | 🔴 COMPLEX | `ts`, `zod` | **javascript-typescript:typescript-pro** | Compress create_card schema |
| T018 | 🟡 MODERATE | `zod`, `review` | comprehensive-review:code-reviewer | Validate compressed schema |
| T019 | 🟢 SIMPLE | `measure` | shell-scripting:bash-pro | Run token measurement |
| T020 | 🟢 SIMPLE | `ts`, `review` | **javascript-typescript:typescript-pro** | Read and analyze TypeScript schema |
| T021 | 🔴 COMPLEX | `ts`, `zod` | **javascript-typescript:typescript-pro** | Compress update_card schema |
| T022 | 🟡 MODERATE | `zod`, `review` | comprehensive-review:code-reviewer | Validate compressed schema |
| T023 | 🟢 SIMPLE | `measure` | shell-scripting:bash-pro | Run token measurement |
| T024 | 🟢 SIMPLE | `ts`, `review` | **javascript-typescript:typescript-pro** | Read and analyze TypeScript schema |
| T025 | 🔴 COMPLEX | `ts`, `zod` | **javascript-typescript:typescript-pro** | Compress list_cards schema |
| T026 | 🟡 MODERATE | `zod`, `review` | comprehensive-review:code-reviewer | Validate compressed schema |
| T027 | 🟢 SIMPLE | `measure` | shell-scripting:bash-pro | Run token measurement |
| T028 | 🔴 COMPLEX | `ts` | **javascript-typescript:typescript-pro** | Update create_card handler logic |
| T029 | 🔴 COMPLEX | `ts` | **javascript-typescript:typescript-pro** | Update update_card handler logic |
| T030 | 🔴 COMPLEX | `ts` | **javascript-typescript:typescript-pro** | Update list_cards handler logic |
| T031 | 🟡 MODERATE | `test` | full-stack-orchestration:test-automator | Integration tests for card ops |
| T032 | 🔴 COMPLEX | `ts` | **javascript-typescript:typescript-pro** | Extract instance param (65 tools) |
| T033 | 🟢 SIMPLE | `measure` | shell-scripting:bash-pro | Measure total reduction |

**Phase Dependencies**: Requires T007-T015 (Foundational complete)
**Parallel Opportunities**:
- T016-T019 || T020-T023 || T024-T027 (different tools)
- T028 || T029 || T030 (handler updates)

---

## Phase 4: User Story 1 - Profile-Based Registration (17 tasks)

| Task | Complexity | Domains | Agent | Rationale |
|------|------------|---------|-------|-----------|
| T034 | 🟡 MODERATE | `ts` | **javascript-typescript:typescript-pro** | Create tool-profiles.ts structure |
| T035 | 🟢 SIMPLE | `ts` | **javascript-typescript:typescript-pro** | Define minimal profile array |
| T036 | 🟢 SIMPLE | `ts` | **javascript-typescript:typescript-pro** | Define standard profile array |
| T037 | 🟢 SIMPLE | `ts` | **javascript-typescript:typescript-pro** | Define full profile array |
| T038 | 🟡 MODERATE | `ts` | **javascript-typescript:typescript-pro** | Implement getToolProfile() |
| T039 | 🟡 MODERATE | `ts` | **javascript-typescript:typescript-pro** | Implement getToolsForProfile() |
| T040 | 🔴 COMPLEX | `ts` | **javascript-typescript:typescript-pro** | Update setupTools() for profiles |
| T041 | 🔴 COMPLEX | `ts` | **javascript-typescript:typescript-pro** | Selective tool registration logic |
| T042 | 🟢 SIMPLE | `ts` | **javascript-typescript:typescript-pro** | Add console logging |
| T043 | 🟡 MODERATE | `test` | full-stack-orchestration:test-automator | Test minimal profile |
| T044 | 🟡 MODERATE | `test` | full-stack-orchestration:test-automator | Test standard profile (default) |
| T045 | 🟡 MODERATE | `test` | full-stack-orchestration:test-automator | Test full profile |
| T046 | 🟡 MODERATE | `test` | full-stack-orchestration:test-automator | Test invalid profile error |
| T047 | 🟢 SIMPLE | `measure` | shell-scripting:bash-pro | Measure minimal profile tokens |
| T048 | 🟢 SIMPLE | `measure` | shell-scripting:bash-pro | Measure standard profile tokens |
| T049 | 🟢 SIMPLE | `measure` | shell-scripting:bash-pro | Measure full profile tokens |
| T050 | 🟡 MODERATE | `docs` | **documentation-generation:docs-architect** | Update README with env var docs |

**Phase Dependencies**: Requires T007-T015 (Foundational complete)
**Parallel Opportunities**:
- T035 || T036 || T037 (profile definitions)
- T043 || T044 || T045 || T046 (tests)
- T047 || T048 || T049 (measurements)

---

## Phase 5: User Story 3 - Description Optimization (15 tasks)

| Task | Complexity | Domains | Agent | Rationale |
|------|------------|---------|-------|-----------|
| T051 | 🟢 SIMPLE | `docs`, `review` | **documentation-generation:reference-builder** | Audit all tool descriptions |
| T052 | 🟢 SIMPLE | `ts`, `docs` | **documentation-generation:reference-builder** | Compress create_card description |
| T053 | 🟢 SIMPLE | `ts`, `docs` | **documentation-generation:reference-builder** | Compress update_card description |
| T054 | 🟢 SIMPLE | `ts`, `docs` | **documentation-generation:reference-builder** | Compress list_cards description |
| T055 | 🟢 SIMPLE | `ts`, `docs` | **documentation-generation:reference-builder** | Compress move_card description |
| T056 | 🟢 SIMPLE | `ts`, `docs` | **documentation-generation:reference-builder** | Compress get_card description |
| T057 | 🟡 MODERATE | `ts`, `docs` | **documentation-generation:reference-builder** | Compress 19 card tool descriptions |
| T058 | 🟡 MODERATE | `ts`, `docs` | **documentation-generation:reference-builder** | Compress 14 board tool descriptions |
| T059 | 🟡 MODERATE | `ts`, `docs` | **documentation-generation:reference-builder** | Compress 7 workspace tool descriptions |
| T060 | 🟡 MODERATE | `ts`, `docs` | **documentation-generation:reference-builder** | Compress 6 custom field descriptions |
| T061 | 🟡 MODERATE | `ts`, `docs` | **documentation-generation:reference-builder** | Compress 6 workflow tool descriptions |
| T062 | 🟡 MODERATE | `ts`, `docs` | **documentation-generation:reference-builder** | Compress user/utility/instance descriptions |
| T063 | 🟡 MODERATE | `review` | comprehensive-review:code-reviewer | Review all descriptions for clarity |
| T064 | 🟢 SIMPLE | `measure` | shell-scripting:bash-pro | Measure description token count |
| T065 | 🟢 SIMPLE | `measure` | shell-scripting:bash-pro | Calculate average description length |

**Phase Dependencies**: Requires T007-T015 (Foundational complete)
**Parallel Opportunities**: T052-T062 (all compression tasks across different files)

---

## Phase 6: Final Validation & Polish (9 tasks)

| Task | Complexity | Domains | Agent | Rationale |
|------|------------|---------|-------|-----------|
| T066 | 🟢 SIMPLE | `measure` | shell-scripting:bash-pro | Complete token measurement |
| T067 | 🟢 SIMPLE | `measure` | shell-scripting:bash-pro | Validate 68% reduction |
| T068 | 🟡 MODERATE | `test` | full-stack-orchestration:test-automator | Full integration test suite |
| T069 | 🟢 SIMPLE | `test` | shell-scripting:bash-pro | Check coverage ≥95% |
| T070 | 🟡 MODERATE | `docs` | **documentation-generation:docs-architect** | Update CHANGELOG.md |
| T071 | 🟡 MODERATE | `docs` | **documentation-generation:tutorial-engineer** | Create migration guide (step-by-step) |
| T072 | 🟡 MODERATE | `zod`, `review` | comprehensive-review:code-reviewer | Validate all schemas compile |
| T073 | 🟡 MODERATE | `measure`, `test` | **javascript-typescript:typescript-pro** | Performance benchmark script |
| T074 | 🟢 SIMPLE | `docs`, `measure` | **documentation-generation:docs-architect** | Document final metrics |

**Phase Dependencies**: Requires ALL previous phases complete
**Parallel Opportunities**: Limited (validation tasks are sequential)

---

## Summary Statistics (OPTIMIZED)

**Total Tasks**: 74
- 🟢 SIMPLE: 37 tasks (50%)
- 🟡 MODERATE: 29 tasks (39%)
- 🔴 COMPLEX: 8 tasks (11%)

**Agent Usage (DRAMATICALLY IMPROVED)**:
- `javascript-typescript:typescript-pro`: **32 tasks (43%)** ⭐ PRIMARY AGENT
- `documentation-generation:reference-builder`: **12 tasks (16%)** ⭐ NEW
- `shell-scripting:bash-pro`: **15 tasks (20%)**
- `comprehensive-review:code-reviewer`: **5 tasks (7%)**
- `full-stack-orchestration:test-automator`: **6 tasks (8%)**
- `documentation-generation:docs-architect`: **3 tasks (4%)** ⭐ NEW
- `documentation-generation:tutorial-engineer`: **1 task (1%)** ⭐ NEW
- `general-purpose`: **0 tasks (0%)** ✅ ELIMINATED

**Key Improvements**:
- ✅ TypeScript specialist handles all TS/Zod work (43%)
- ✅ Documentation specialists handle all docs work (21%)
- ✅ General-purpose eliminated entirely (was 73%)
- ✅ Better specialist coverage = higher quality output
- ✅ Delegation gaps RESOLVED

**Domain Distribution**:
- TypeScript (`ts`): 48 tasks (65%) → typescript-pro
- Documentation (`docs`): 16 tasks (22%) → docs specialists
- Measurement (`measure`): 18 tasks (24%) → bash-pro
- Zod schemas (`zod`): 17 tasks (23%) → typescript-pro
- Testing (`test`): 7 tasks (9%) → test-automator
- Review (`review`): 6 tasks (8%) → code-reviewer
- Bash (`bash`): 6 tasks (8%) → bash-pro

**Parallelization Potential**: 42 tasks marked [P] in tasks.md (56.7%)

---

## Quality Gates by Phase (UNCHANGED)

### Phase 1 Gate
- ✅ Baseline measurement shows ~38,900 tokens
- ✅ All 65 tools measured

### Phase 2 Gate
- ✅ All schemas compile with Zod
- ✅ Schemas accept valid test inputs

### Phase 3 Gate
- ✅ create_card ≤2,200 tokens (39% reduction)
- ✅ update_card ≤1,600 tokens (41% reduction)
- ✅ list_cards ≤1,800 tokens (38% reduction)
- ✅ Total ≥5,600 tokens saved

### Phase 4 Gate
- ✅ minimal profile ≤9,000 tokens (77% reduction)
- ✅ standard profile ≤20,000 tokens (49% reduction)
- ✅ full profile ~38,900 tokens (unchanged)

### Phase 5 Gate
- ✅ Average description ≤5 words
- ✅ 1,500-2,500 token reduction

### Phase 6 Gate
- ✅ 68% total reduction (38,900 → 12,500 tokens)
- ✅ 100% functionality preserved
- ✅ Test coverage ≥95%

---

## Delegation Status

### ✅ RESOLVED: TypeScript/Node.js Specialist Gap
- **Agent**: `javascript-typescript:typescript-pro`
- **Coverage**: 32 tasks (43%)
- **Expertise**: TypeScript 5.x, Zod schemas, Node.js, advanced types
- **Impact**: HIGH - All TypeScript implementation now handled by specialist

### ✅ RESOLVED: Documentation Specialist Gap
- **Agents**:
  - `documentation-generation:docs-architect` (3 tasks)
  - `documentation-generation:reference-builder` (12 tasks)
  - `documentation-generation:tutorial-engineer` (1 task)
- **Coverage**: 16 tasks (22%)
- **Expertise**: Technical docs, API references, migration guides
- **Impact**: MEDIUM - All documentation now handled by specialists

### ✅ NO REMAINING GAPS
All tasks have optimal specialist coverage!

---

**Status**: ✅ Optimized with 6 new specialist agents, ready for Phase 2 execution
**Last Updated**: 2025-11-19
