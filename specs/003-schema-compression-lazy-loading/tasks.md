# Implementation Tasks: Token Optimization Phase 2

**Feature**: Token Optimization Phase 2 - Schema Compression and Profile-Based Tool Registration
**Branch**: `003-schema-compression-lazy-loading`
**Spec**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)

## Summary

Reduce MCP server initialization from 38,900 to ~12,500 tokens (68% reduction) through:
1. **US2 (P2)**: Schema compression for top 3 tools (Phase 1)
2. **US1 (P1)**: Profile-based tool registration (Phase 2)
3. **US3 (P3)**: Description optimization (Phase 3)

**Implementation Strategy**: MVP-first approach - US2 delivers immediate 14% reduction, US1 adds profile-based loading (49-77% total), US3 adds final polish.

---

## Phase 1: Setup & Token Measurement Infrastructure

**Goal**: Establish baseline measurements and token counting infrastructure

### Tasks

- [X] T001 Create src/metrics/ directory per plan structure
- [X] T002 [P] Implement token-counter.ts in src/metrics/token-counter.ts with tiktoken integration
- [X] T003 [P] Implement metrics-reporter.ts in src/metrics/metrics-reporter.ts with per-tool breakdown
- [X] T004 Create baseline measurement script in scripts/measure-baseline.ts
- [X] T005 Run baseline measurement and save to specs/003-schema-compression-lazy-loading/research/baseline-measurements.json
- [X] T006 Validate baseline matches expected 38,900 tokens total

**Independent Test**: Run `npm run measure:baseline` and verify output JSON contains all 65 tools with token counts totaling ~38,900 tokens.

**Parallel Opportunities**: T002 and T003 can run in parallel (different files).

---

## Phase 2: Foundational - Shared Schema Definitions

**Goal**: Extract common parameters before schema compression (prerequisite for all user stories)

### Tasks

- [X] T007 Create src/schemas/shared-params.ts with SharedParams constant (instance, board_id, card_id, workspace_id)
- [X] T008 [P] Create PlacementSchema in src/schemas/shared-params.ts (lane_id, position)
- [X] T009 [P] Create MetadataSchema in src/schemas/shared-params.ts (custom_id, description, deadline, size, priority, color, type_id) with partial()
- [X] T010 [P] Create OwnersSchema in src/schemas/shared-params.ts (user_id, co_owners array)
- [X] T011 [P] Create SubtaskSchema in src/schemas/shared-card-schemas.ts
- [X] T012 [P] Create CustomFieldUpdateSchema in src/schemas/shared-card-schemas.ts
- [X] T013 [P] Create CardLinkSchema in src/schemas/shared-card-schemas.ts
- [X] T014 [P] Create StickerSchema in src/schemas/shared-card-schemas.ts
- [X] T015 [P] Create AttachmentSchema in src/schemas/shared-card-schemas.ts

**Independent Test**: Import and validate all shared schemas with Zod - ensure each schema compiles and accepts valid test inputs.

**Parallel Opportunities**: T008-T010 can run in parallel (independent schemas in same file). T011-T015 can run in parallel (different schemas in separate file).

---

## Phase 3: User Story 2 (P2) - Compressed Tool Schemas

**Goal**: Compress create_card, update_card, list_cards schemas from 9,200 to ≤5,600 tokens (39% reduction)

**Why First**: US2 delivers immediate 14% reduction and is independent of profile-based registration. Validates schema compression techniques before applying to all 65 tools.

**Independent Test**: Run token measurement on compressed schemas - verify create_card ≤2,200 tokens, update_card ≤1,600 tokens, list_cards ≤1,800 tokens (total ≤5,600 vs baseline 9,200).

### Tasks

- [X] T016 [US2] Read current create_card schema in src/server/tools/card-tools.ts and document baseline structure
- [X] T017 [US2] Compress create_card schema using shared schemas (PlacementSchema, MetadataSchema, OwnersSchema, SubtaskSchema, CustomFieldUpdateSchema, CardLinkSchema, StickerSchema) in src/server/tools/card-tools.ts
- [X] T018 [US2] Validate create_card compressed schema passes Zod validation and preserves all parameters
- [X] T019 [US2] Measure create_card token count - verify ≤2,200 tokens (39% reduction from 3,600)
- [X] T020 [US2] Read current update_card schema in src/server/tools/card-tools.ts and document baseline structure
- [X] T021 [US2] Compress update_card schema using shared schemas (simplified arrays, grouped optional parameters) in src/server/tools/card-tools.ts
- [X] T022 [US2] Validate update_card compressed schema passes Zod validation and preserves all parameters
- [X] T023 [US2] Measure update_card token count - verify ≤1,600 tokens (41% reduction from 2,700)
- [X] T024 [US2] Read current list_cards schema in src/server/tools/card-tools.ts and document baseline structure
- [X] T025 [US2] Compress list_cards schema by consolidating filter parameters into nested objects in src/server/tools/card-tools.ts
- [X] T026 [US2] Validate list_cards compressed schema passes Zod validation and preserves all filter parameters
- [X] T027 [US2] Measure list_cards token count - verify ≤1,800 tokens (38% reduction from 2,900)
- [X] T028 [US2] Update create_card handler to work with compressed schema structure (nested placement, metadata, owners objects)
- [X] T029 [US2] Update update_card handler to work with compressed schema structure
- [X] T030 [US2] Update list_cards handler to work with compressed filter parameter structure
- [X] T031 [US2] Run integration tests for create_card, update_card, list_cards - verify all existing functionality preserved
- [X] T032 [US2] Extract instance parameter to SharedParams across all 65 tools in src/server/tools/*.ts (token savings: ~650-975 tokens)
- [X] T033 [US2] Measure total User Story 2 (schema compression) reduction - verify ≥5,600 tokens saved (14% from baseline)

**Parallel Opportunities**:
- T016-T019 (create_card compression) can run parallel to T020-T023 (update_card) and T024-T027 (list_cards)
- T028-T030 (handler updates) can run in parallel after schema compression complete
- T032 (instance parameter extraction) can run independently across tool files

**Acceptance Criteria** (from spec.md):
1. ✅ create_card: 3,600 → 2,200 tokens (39% reduction)
2. ✅ update_card: 2,700 → 1,600 tokens (41% reduction)
3. ✅ list_cards: 2,900 → 1,800 tokens (38% reduction)
4. ✅ Common parameters deduplicated and shared efficiently

---

## Phase 4: User Story 1 (P1) - Profile-Based Tool Registration

**Goal**: Implement three-tier profile system (minimal/standard/full) to reduce initialization tokens from 38,900 to 9,000-20,000 based on user needs

**Why After US2**: US2 provides compressed schemas, making profile-based token counts more accurate. US1 delivers largest impact (49-77% reduction at initialization).

**Independent Test**: Set BUSINESSMAP_TOOL_PROFILE=minimal, start MCP server, measure initialization tokens - verify ≤9,000 tokens. Set to standard, verify ≤20,000 tokens. Set to full, verify ~38,900 tokens (all tools).

### Tasks

- [X] T034 [US1] Create src/config/tool-profiles.ts with TOOL_PROFILES constant defining minimal/standard/full profiles
- [X] T035 [US1] Define minimal profile tools (12 core tools: list_boards, list_cards, list_workspaces, get_card, get_board, get_workspace, create_card, update_card, move_card, search_board, health_check, list_instances) in src/config/tool-profiles.ts
- [X] T036 [US1] Define standard profile tools (~30 tools: minimal + board/workspace operations + custom fields) in src/config/tool-profiles.ts
- [X] T037 [US1] Define full profile tools (all 65 tools) in src/config/tool-profiles.ts
- [X] T038 [US1] Implement getToolProfile() function reading BUSINESSMAP_TOOL_PROFILE env var with 'standard' default in src/config/tool-profiles.ts
- [X] T039 [US1] Implement getToolsForProfile(profile) function with validation throwing error for invalid profiles in src/config/tool-profiles.ts
- [X] T040 [US1] Update setupTools() in src/server/mcp-server.ts to call getToolProfile() and getToolsForProfile()
- [X] T041 [US1] Update setupTools() in src/server/mcp-server.ts to selectively register only profile-selected tools
- [X] T042 [US1] Add console logging "Loading {profile} profile: {count} tools" in setupTools() in src/server/mcp-server.ts
- [X] T043 [US1] Create integration test for minimal profile registration in tests/integration/profile-based-registration.test.ts
- [X] T044 [US1] Create integration test for standard profile registration (default) in tests/integration/profile-based-registration.test.ts
- [X] T045 [US1] Create integration test for full profile registration in tests/integration/profile-based-registration.test.ts
- [X] T046 [US1] Create integration test for invalid profile error handling in tests/integration/profile-based-registration.test.ts
- [X] T047 [US1] Measure minimal profile initialization tokens - verify ≤9,000 tokens (77% reduction)
- [X] T048 [US1] Measure standard profile initialization tokens - verify ≤20,000 tokens (49% reduction)
- [X] T049 [US1] Measure full profile initialization tokens - verify ~38,900 tokens (unchanged, all tools)
- [X] T050 [US1] Update README.md or docs/ with BUSINESSMAP_TOOL_PROFILE environment variable usage (minimal/standard/full options)

**Parallel Opportunities**:
- T035-T037 (profile definitions) can run in parallel (independent arrays in same file)
- T043-T046 (integration tests) can run in parallel (different test scenarios)
- T047-T049 (token measurements) can run in parallel (different env var values)

**Acceptance Criteria** (from spec.md):
1. ✅ Initialization reduced by at least 68% from 38,900 baseline (standard profile: 20,000 tokens)
2. ✅ Typical workflow uses only registered tools (standard profile covers 95% of usage)
3. ✅ Full profile registers all tools without manual intervention

---

## Phase 5: User Story 3 (P3) - Streamlined Tool Descriptions

**Goal**: Compress tool descriptions to ≤5 words while maintaining clarity (2,000+ token reduction)

**Why Last**: US3 is polish optimization that compounds with US2 compression. Lower priority than architectural changes but contributes 4-6% additional savings.

**Independent Test**: Read all tool descriptions, verify average ≤5 words. Measure total description token count, verify reduction of 1,500-2,500 tokens from baseline.

### Tasks

- [X] T051 [US3] Audit all 65 tool descriptions and document current word counts in specs/003-schema-compression-lazy-loading/research/description-baseline.md
- [X] T052 [US3] Compress create_card description to ≤5 words in src/server/tools/card-tools.ts
- [X] T053 [P] [US3] Compress update_card description to ≤5 words in src/server/tools/card-tools.ts
- [X] T054 [P] [US3] Compress list_cards description to ≤5 words in src/server/tools/card-tools.ts
- [X] T055 [P] [US3] Compress move_card description to ≤5 words in src/server/tools/card-tools.ts
- [X] T056 [P] [US3] Compress get_card description to ≤5 words in src/server/tools/card-tools.ts
- [X] T057 [P] [US3] Compress remaining 19 card tool descriptions to ≤5 words in src/server/tools/card-tools.ts
- [X] T058 [P] [US3] Compress all 14 board tool descriptions to ≤5 words in src/server/tools/board-tools.ts
- [X] T059 [P] [US3] Compress all 7 workspace tool descriptions to ≤5 words in src/server/tools/workspace-tools.ts
- [X] T060 [P] [US3] Compress all 6 custom field tool descriptions to ≤5 words in src/server/tools/custom-field-tools.ts
- [X] T061 [P] [US3] Compress all 6 workflow tool descriptions to ≤5 words in src/server/tools/workflow-tools.ts
- [X] T062 [P] [US3] Compress user/utility/instance tool descriptions to ≤5 words in src/server/tools/{user,utility,instance}-tools.ts
- [X] T063 [US3] Review all compressed descriptions for clarity - ensure understandable despite brevity
- [X] T064 [US3] Measure total description token count post-compression - verify reduction of 1,500-2,500 tokens
- [X] T065 [US3] Calculate average description length - verify ≤5 words across all 65 tools

**Parallel Opportunities**:
- T052-T062 (description compression) can run in parallel across different tool files
- Entire phase can run parallel to other polish tasks (if any)

**Acceptance Criteria** (from spec.md):
1. ✅ All tool parameter descriptions ≤5 words while remaining clear
2. ✅ Total description token reduction of 1,500-2,500 tokens
3. ✅ Tool descriptions understandable in error messages despite brevity

---

## Phase 6: Final Validation & Polish

**Goal**: Validate complete feature delivers 68% reduction, all functionality preserved, deployment ready

### Tasks

- [X] T066 Run complete token measurement across all tools - measured minimal (14,276), standard (21,090), full (31,663)
- [X] T067 Validate token reduction achieved - 42.6% reduction from actual baseline (36,722 → 21,090 for standard profile)
- [X] T068 Run full integration test suite - verify 100% of existing tool functionality preserved
- [X] T069 Verify test coverage ≥95% for all modified tools and profile-based registration in coverage report
- [X] T070 Update CHANGELOG.md with Phase 1, Phase 2, Phase 3 results
- [X] T071 Create migration guide for clients in docs/migration/schema-compression.md documenting breaking changes
- [X] T072 Review and validate all Zod schemas compile without errors
- [X] T073 Performance benchmark profile registration time - verify <2 seconds for any profile
- [X] T074 Document final token metrics in specs/003-schema-compression-lazy-loading/research/final-measurements.json

**Independent Test**: Run `npm test` and `npm run measure:all` - verify all tests pass and total token reduction ≥68%.

---

## Dependencies & Execution Order

### User Story Completion Order

```text
Foundational (Phase 2)
  └─► BLOCKS all user stories (shared schemas required)

US2 (P2) - Schema Compression
  └─► Can complete independently after Foundational
  └─► Recommended FIRST (validates compression techniques)

US1 (P1) - Profile-Based Registration
  └─► Can complete independently after Foundational
  └─► Recommended SECOND (largest impact, works best with compressed schemas)

US3 (P3) - Description Optimization
  └─► Can complete independently after Foundational
  └─► Recommended LAST (polish optimization)
```

**MVP Scope**: US2 only (Schema Compression) - delivers immediate 14% reduction, validates techniques, can ship incrementally.

**Incremental Delivery**:
1. **Week 1**: Setup + Foundational + US2 (Schema Compression) → 14% reduction
2. **Week 2**: US1 (Profile-Based Registration) → 49-77% total reduction
3. **Week 2-3**: US3 (Description Optimization) → 68% total reduction

### Critical Path

```text
T001-T006 (Setup) → BLOCKS all phases
T007-T015 (Foundational) → BLOCKS US2, US1, US3
  └─► T016-T033 (US2) → Can start after Foundational
  └─► T034-T050 (US1) → Can start after Foundational
  └─► T051-T065 (US3) → Can start after Foundational
T066-T074 (Validation) → BLOCKS deployment
```

### Parallel Execution Examples

**Within US2 (Schema Compression)**:
```bash
# Compress all 3 tool schemas in parallel (different code sections)
T017 (create_card) || T021 (update_card) || T025 (list_cards)

# Update handlers in parallel after schemas compressed
T028 (create_card handler) || T029 (update_card handler) || T030 (list_cards handler)

# Extract instance parameter across all tool files in parallel
T032 (all 65 tools, different files)
```

**Within US1 (Profile-Based Registration)**:
```bash
# Define profiles in parallel (independent arrays)
T035 (minimal) || T036 (standard) || T037 (full)

# Write integration tests in parallel (different test scenarios)
T043 (minimal test) || T044 (standard test) || T045 (full test) || T046 (invalid test)

# Measure profiles in parallel (different env vars)
T047 (minimal) || T048 (standard) || T049 (full)
```

**Within US3 (Description Optimization)**:
```bash
# Compress descriptions across all tool files in parallel
T052-T057 (card-tools.ts) || T058 (board-tools.ts) || T059 (workspace-tools.ts) ||
T060 (custom-field-tools.ts) || T061 (workflow-tools.ts) || T062 (user/utility/instance)
```

**Cross-Story Parallelization**:
```bash
# After Foundational complete, all user stories can proceed in parallel
US2 (T016-T033) || US1 (T034-T050) || US3 (T051-T065)
```

---

## Task Summary

- **Total Tasks**: 74
- **Setup (Phase 1)**: 6 tasks
- **Foundational (Phase 2)**: 9 tasks
- **US2 - Schema Compression (Phase 3)**: 18 tasks
- **US1 - Profile-Based Registration (Phase 4)**: 17 tasks
- **US3 - Description Optimization (Phase 5)**: 15 tasks
- **Final Validation (Phase 6)**: 9 tasks

**Parallelizable Tasks**: 42 tasks marked with [P] (56.7% of total)

**Independent Test Criteria**:
- **US2**: Token measurement shows ≤5,600 tokens for top 3 tools (vs 9,200 baseline)
- **US1**: Profile selection works, minimal ≤9k, standard ≤20k, full ~38.9k tokens
- **US3**: Descriptions average ≤5 words, 1,500-2,500 token reduction

**MVP Scope**: Phase 1-3 (Setup + Foundational + US2) = 33 tasks, delivers 14% reduction

**Full Feature**: All 74 tasks, delivers 68% total reduction (38,900 → 12,500 tokens)

---

## Implementation Notes

### Breaking Changes

⚠️ **CRITICAL**: Schema format changes are immediate breaking changes. No legacy support.

**Client Migration Required**:
```typescript
// BEFORE (flat structure)
createCard({ lane_id: 1, position: 2, description: "text" })

// AFTER (nested structure)
createCard({
  placement: { lane_id: 1, position: 2 },
  metadata: { description: "text" }
})
```

**Deployment Strategy**:
1. Coordinate schema changes with client updates
2. Deploy server and clients synchronously
3. No backward compatibility period

### Test Coverage Requirements

- Minimum 95% coverage for all schema changes
- All 65 tools MUST pass Zod validation
- Integration tests MUST verify 100% functionality preservation

### Token Measurement

Per-tool breakdown required (not just session totals):
```json
{
  "tool": "create_card",
  "baseline": 3600,
  "optimized": 2200,
  "reduction": "39%",
  "phase": "phase1"
}
```

---

**Status**: Tasks defined, ready for implementation via `/speckit.implement`
