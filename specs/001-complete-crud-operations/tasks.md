# Tasks: Complete CRUD Operations

**Feature**: 001-complete-crud-operations
**Input**: Design documents from `/specs/001-complete-crud-operations/`
**Prerequisites**: ✅ plan.md, ✅ spec.md, ✅ research.md, ✅ data-model.md, ✅ contracts/

**Tests**: Not requested - Implementation-focused

**Organization**: Tasks organized by resource type (Comments, Subtasks, Custom Fields, Quick Wins) since operations are independent

## Format: `[ID] [P?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

---

## Phase 1: Setup & Foundation

**Purpose**: Rate limit handling and infrastructure

- [ ] T001 Install axios-retry dependency with npm install axios-retry
- [ ] T002 Implement rate limit handling with axios-retry and header monitoring in src/clients/base-client.ts
- [ ] T003 [P] Add rate limit warning threshold logging (80% of 30/min) in src/clients/base-client.ts

---

## Phase 2: Comments CRUD (2 operations)

**Goal**: Full CRUD support for card comments (UPDATE, DELETE)

**Independent Test**: Create card → Add comment → Update comment → Delete comment → Verify

### Implementation

- [ ] T004 [P] Define UpdateCardCommentSchema in src/schemas/comment-schemas.ts
- [ ] T005 [P] Define DeleteCardCommentSchema in src/schemas/comment-schemas.ts
- [ ] T006 [P] Implement updateCardComment method in src/clients/card-client.ts
- [ ] T007 [P] Implement deleteCardComment method in src/clients/card-client.ts
- [ ] T008 [P] Create update_card_comment MCP tool in src/tools/comment-tools.ts
- [ ] T009 [P] Create delete_card_comment MCP tool in src/tools/comment-tools.ts
- [ ] T010 Register 2 comment tools in src/index.ts (add update_card_comment, delete_card_comment to ListToolsRequest tools array; add 2 cases to CallToolRequest switch statement)

---

## Phase 3: Subtasks CRUD (2 operations)

**Goal**: Full CRUD support for card subtasks (UPDATE, DELETE)

**Independent Test**: Create card → Add subtask → Update subtask → Delete subtask → Verify

### Implementation

- [ ] T011 [P] Define UpdateCardSubtaskSchema in src/schemas/subtask-schemas.ts
- [ ] T012 [P] Define DeleteCardSubtaskSchema in src/schemas/subtask-schemas.ts
- [ ] T013 [P] Implement updateCardSubtask method in src/clients/card-client.ts
- [ ] T014 [P] Implement deleteCardSubtask method in src/clients/card-client.ts
- [ ] T015 [P] Create update_card_subtask MCP tool in src/tools/subtask-tools.ts
- [ ] T016 [P] Create delete_card_subtask MCP tool in src/tools/subtask-tools.ts
- [ ] T017 Register 2 subtask tools in src/index.ts (add update_card_subtask, delete_card_subtask to ListToolsRequest tools array; add 2 cases to CallToolRequest switch statement)

---

## Phase 4: Custom Field Definitions CRUD (6 operations)

**Goal**: Full CRUD support for custom field definitions (field schemas, types, options, constraints)

**Note**: Custom field **values** on cards are managed via card update operations (existing functionality - no new tasks required).

**Independent Test**: Create board → Define custom field → Update field → Delete field → Verify cascade to values

### Foundation

- [ ] T018 Create CustomField interface in src/clients/custom-field-client.ts
- [ ] T019 Create CustomFieldClient class with constructor in src/clients/custom-field-client.ts

### Schemas

- [ ] T020 [P] Define CustomFieldTypeSchema enum in src/schemas/custom-field-schemas.ts
- [ ] T021 [P] Define ListCustomFieldsSchema in src/schemas/custom-field-schemas.ts
- [ ] T022 [P] Define ListBoardCustomFieldsSchema in src/schemas/custom-field-schemas.ts
- [ ] T023 [P] Define GetCustomFieldSchema in src/schemas/custom-field-schemas.ts
- [ ] T024 [P] Define CreateCustomFieldSchema in src/schemas/custom-field-schemas.ts
- [ ] T025 [P] Define UpdateCustomFieldSchema in src/schemas/custom-field-schemas.ts
- [ ] T026 [P] Define DeleteCustomFieldSchema in src/schemas/custom-field-schemas.ts

### Client Methods

- [ ] T027 [P] Implement listCustomFields method in src/clients/custom-field-client.ts
- [ ] T028 [P] Implement listBoardCustomFields method in src/clients/custom-field-client.ts
- [ ] T029 [P] Implement getCustomField method in src/clients/custom-field-client.ts
- [ ] T030 [P] Implement createCustomField method in src/clients/custom-field-client.ts
- [ ] T031 [P] Implement updateCustomField method in src/clients/custom-field-client.ts
- [ ] T032 [P] Implement deleteCustomField method in src/clients/custom-field-client.ts

### MCP Tools

- [ ] T033 [P] Create list_custom_fields tool in src/tools/custom-field-tools.ts
- [ ] T034 [P] Create list_board_custom_fields tool in src/tools/custom-field-tools.ts
- [ ] T035 [P] Create get_custom_field tool in src/tools/custom-field-tools.ts
- [ ] T036 [P] Create create_custom_field tool in src/tools/custom-field-tools.ts
- [ ] T037 [P] Create update_custom_field tool in src/tools/custom-field-tools.ts
- [ ] T038 [P] Create delete_custom_field tool in src/tools/custom-field-tools.ts
- [ ] T039 Register 6 custom field tools in src/index.ts (add list_custom_fields, list_board_custom_fields, get_custom_field, create_custom_field, update_custom_field, delete_custom_field to ListToolsRequest tools array; add 6 cases to CallToolRequest switch statement)
- [ ] T040 Instantiate CustomFieldClient in src/index.ts and wire to tools

---

## Phase 5: Quick Wins - Workspace (2 operations)

**Goal**: Expose existing workspace update/delete client methods as MCP tools

**Independent Test**: Create workspace → Update name → Delete workspace

### Implementation

- [ ] T041 [P] Define UpdateWorkspaceSchema in src/schemas/workspace-schemas.ts
- [ ] T042 [P] Define DeleteWorkspaceSchema in src/schemas/workspace-schemas.ts
- [ ] T043 [P] Create update_workspace MCP tool in src/tools/workspace-tools.ts
- [ ] T044 [P] Create delete_workspace MCP tool in src/tools/workspace-tools.ts
- [ ] T045 Register 2 workspace tools in src/index.ts (add update_workspace, delete_workspace to ListToolsRequest tools array; add 2 cases to CallToolRequest switch statement)

---

## Phase 6: Quick Wins - Board (2 operations)

**Goal**: Expose existing board update/delete client methods as MCP tools

**Independent Test**: Create board → Update description → Delete board

### Implementation

- [ ] T046 [P] Define UpdateBoardSchema in src/schemas/board-schemas.ts
- [ ] T047 [P] Define DeleteBoardSchema in src/schemas/board-schemas.ts
- [ ] T048 [P] Create update_board MCP tool in src/tools/board-tools.ts
- [ ] T049 [P] Create delete_board MCP tool in src/tools/board-tools.ts
- [ ] T050 Register 2 board tools in src/index.ts (add update_board, delete_board to ListToolsRequest tools array; add 2 cases to CallToolRequest switch statement)

---

## Phase 7: Quick Wins - Card (1 operation)

**Goal**: Expose existing card delete client method as MCP tool

**Independent Test**: Create card → Delete card → Verify cascade to comments/subtasks

### Implementation

- [ ] T051 Define DeleteCardSchema in src/schemas/card-schemas.ts
- [ ] T052 Create delete_card MCP tool in src/tools/card-tools.ts
- [ ] T053 Register 1 card tool in src/index.ts (add delete_card to ListToolsRequest tools array; add 1 case to CallToolRequest switch statement)

---

## Phase 8: Bulk Operations (FR-020)

**Goal**: Support bulk delete/update operations with dependency analysis and consolidated confirmation

**Independent Test**: Delete 5 workspaces (2 with boards, 3 empty) → Single confirmation lists 2 with dependencies → All 5 deleted in transaction

### Foundation

- [ ] T054 Design bulk operation request schema (array of resource IDs) in src/schemas/bulk-schemas.ts
- [ ] T055 Implement DependencyAnalyzer service in src/services/dependency-analyzer.ts (checks workspace→boards, card→children)

### Bulk Delete Operations

- [ ] T056 [P] Implement bulkDeleteWorkspaces method in src/clients/workspace-client.ts
- [ ] T057 [P] Implement bulkDeleteBoards method in src/clients/board-client.ts
- [ ] T058 [P] Implement bulkDeleteCards method in src/clients/card-client.ts
- [ ] T059 Create ConsolidatedConfirmation service in src/services/confirmation-builder.ts (groups dependencies for display)

### Bulk Update Operations

- [ ] T060 [P] Implement bulkUpdateWorkspaces method in src/clients/workspace-client.ts
- [ ] T061 [P] Implement bulkUpdateBoards method in src/clients/board-client.ts
- [ ] T062 [P] Implement bulkUpdateCards method in src/clients/card-client.ts

### MCP Tools & Integration

- [ ] T063 [P] Create bulk_delete_workspaces MCP tool in src/tools/workspace-tools.ts
- [ ] T064 [P] Create bulk_delete_boards MCP tool in src/tools/board-tools.ts
- [ ] T065 [P] Create bulk_delete_cards MCP tool in src/tools/card-tools.ts
- [ ] T066 Register 6 bulk operation tools in src/index.ts (add bulk_delete_workspaces, bulk_update_workspaces, bulk_delete_boards, bulk_update_boards, bulk_delete_cards, bulk_update_cards to ListToolsRequest tools array; add 6 cases to CallToolRequest switch statement)

---

## Phase 9: Polish & Cross-Cutting

**Purpose**: Documentation, validation, cleanup

- [ ] T067 [P] Update README.md with new tool descriptions (including bulk operations)
- [ ] T068 [P] Update CHANGELOG.md with version bump and feature additions
- [ ] T069 Validate all OpenAPI contracts by running ./contracts/validate-all.sh from repo root; expect zero errors from swagger-cli; if errors occur, fix contract YAML syntax/structure until validation passes (requires swagger-cli: npm install -g @apidevtools/swagger-cli)
- [ ] T070 Run quickstart.md validation against demo API
- [ ] T071 Bump version in package.json (suggest 1.2.0 due to bulk operations)
- [ ] T072 [P] Code cleanup and consistent error handling
- [ ] T073 Build project with npm run build and verify no errors
- [ ] T074 [OPTIONAL] Test column delete endpoint: attempt DELETE /columns/{id} against demo API with empty column; if successful, document as supported and create GitHub issue for future implementation; if fails, update spec.md FR-012 to mark as "NOT SUPPORTED" (see research.md line 205)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: Start immediately
- **Phase 2-7**: All can start after Phase 1 completion
  - Comments (Phase 2): Independent
  - Subtasks (Phase 3): Independent
  - Custom Fields (Phase 4): Independent (largest - 21 tasks)
  - Workspace (Phase 5): Independent
  - Board (Phase 6): Independent
  - Card (Phase 7): Independent
- **Phase 8 (Bulk Operations)**: Depends on Phases 5-7 (requires workspace/board/card clients)
- **Phase 9 (Polish)**: Start after all desired phases complete

### Within Each Phase

- Schemas before client methods (where applicable)
- Client methods before tools
- Tools before registration
- All [P] tasks can run in parallel

### Parallel Opportunities

**Phase 1** (Foundation):
- T001, T002, T003 can run sequentially (small, interdependent)

**Phase 2** (Comments):
```bash
# Parallel group 1: Schemas
Task: T004, T005

# Parallel group 2: Client methods
Task: T006, T007

# Parallel group 3: Tools
Task: T008, T009

# Sequential: Registration
Task: T010
```

**Phase 3** (Subtasks):
```bash
# Same parallel pattern as Comments
Schemas: T011, T012
Client: T013, T014
Tools: T015, T016
Registration: T017
```

**Phase 4** (Custom Fields - largest phase):
```bash
# Foundation (sequential):
Task: T018 → T019

# Parallel group 1: All schemas
Task: T020, T021, T022, T023, T024, T025, T026

# Parallel group 2: All client methods
Task: T027, T028, T029, T030, T031, T032

# Parallel group 3: All tools
Task: T033, T034, T035, T036, T037, T038

# Sequential: Registration and wiring
Task: T039 → T040
```

**Phase 5-7** (Quick Wins - can all run in parallel):
```bash
# Workspace
Task: T041, T042, T043, T044, T045

# Board (parallel with Workspace)
Task: T046, T047, T048, T049, T050

# Card (parallel with Workspace + Board)
Task: T051, T052, T053
```

**Phase 8** (Polish):
```bash
# Documentation (parallel)
Task: T054, T055

# Validation (sequential)
Task: T056 → T057

# Finalization
Task: T058, T059, T060
```

---

## Cross-Phase Parallel Execution

Once Phase 1 completes, Phases 2-7 are completely independent:

```bash
# Developer A: Comments + Subtasks
Phase 2 → Phase 3

# Developer B: Custom Fields
Phase 4 (longest - 21 tasks)

# Developer C: Quick Wins
Phase 5 → Phase 6 → Phase 7 (shortest - 14 tasks total)
```

---

## Implementation Strategy

### Sequential Approach (Single Developer)

1. **Foundation First**: Complete Phase 1 (3 tasks)
2. **Incremental by Resource**:
   - Phase 2: Comments (7 tasks) → Test independently
   - Phase 3: Subtasks (7 tasks) → Test independently
   - Phase 4: Custom Fields (21 tasks) → Test independently
   - Phase 5: Workspace (5 tasks) → Test independently
   - Phase 6: Board (5 tasks) → Test independently
   - Phase 7: Card (3 tasks) → Test independently
3. **Polish**: Phase 8 (7 tasks)

**Total**: 58 tasks, ~3-4 days

### Parallel Approach (Multiple Developers)

1. **Team**: Complete Phase 1 together (3 tasks)
2. **Split Work**:
   - Dev A: Comments + Subtasks (14 tasks)
   - Dev B: Custom Fields (21 tasks)
   - Dev C: Quick Wins (13 tasks)
3. **Team**: Complete Phase 8 together (7 tasks)

**Total**: ~1-2 days with 3 developers

### MVP Delivery Options

**Option 1 - Comments Only** (quickest value):
- Phase 1 → Phase 2 → Test → Deploy
- **Deliverable**: update_card_comment + delete_card_comment
- **Time**: ~4-6 hours

**Option 2 - Card-Related Operations** (logical grouping):
- Phase 1 → Phase 2 → Phase 3 → Phase 7 → Test → Deploy
- **Deliverable**: Full comments + subtasks + card delete
- **Time**: ~1 day

**Option 3 - Full Feature** (all 17 operations):
- All phases → Test → Deploy
- **Deliverable**: Complete CRUD coverage (~80% overall)
- **Time**: 3-4 days

---

## Validation Checkpoints

### After Phase 1 (Foundation)
- [ ] Rate limit retry triggers on RL02 error
- [ ] Header monitoring logs warning at 80% threshold
- [ ] Build succeeds with no errors

### After Phase 2 (Comments)
- [ ] Create test card with comment
- [ ] Update comment text via MCP tool
- [ ] Delete comment via MCP tool
- [ ] Verify comment removed

### After Phase 3 (Subtasks)
- [ ] Create test card with subtask
- [ ] Update subtask description via MCP tool
- [ ] Delete subtask via MCP tool
- [ ] Verify subtask removed

### After Phase 4 (Custom Fields)
- [ ] List all custom fields
- [ ] Create new field definition
- [ ] Update field label
- [ ] Delete field (verify cascade to values)

### After Phase 5-7 (Quick Wins)
- [ ] Update workspace name
- [ ] Update board description
- [ ] Delete card (verify cascade to comments/subtasks)
- [ ] Delete board (verify cascade confirmation)
- [ ] Delete workspace (verify cascade confirmation)

### After Phase 8 (Polish)
- [ ] All contracts validate successfully
- [ ] Quickstart.md validation passes
- [ ] README reflects all 17 new tools
- [ ] Version bumped to 1.1.0

---

## Notes

- **Contracts**: All 15 endpoints documented in `/specs/001-complete-crud-operations/contracts/`
- **Data Model**: Entity relationships defined in `data-model.md`
- **Research**: API capabilities confirmed in `research.md` (80% CRUD coverage achieved)
- **Rate Limits**: 30/min, 600/hr with RL02 error code on exceed
- **Demo API**: `https://demo.kanbanize.com/api/v2` for testing
- **Total Operations**: 12 new + 5 quick wins + 6 bulk = 23 tools added
- **Coverage Impact**: 50% → ~80% (+30 percentage points)
- **Bulk Operations**: Phase 8 adds dependency analysis and consolidated confirmation for workspace/board/card bulk delete/update

---

## Statistics

- **Total Tasks**: 74 (was 60; +13 for bulk operations, +1 optional column delete test)
- **Parallelizable Tasks**: 56 (76%)
- **Sequential Tasks**: 18 (24%)
- **Optional Tasks**: 1 (T074 - column delete testing)
- **Estimated Time**:
  - Sequential: 4-5 days (was 3-4; +1 day for bulk operations)
  - Parallel (3 devs): 2-3 days (was 1-2; +1 day for bulk operations)
  - MVP (Comments): 4-6 hours
  - MVP with Bulk Operations: Add +1-2 days
  - Optional column test: +1-2 hours (if executed)
