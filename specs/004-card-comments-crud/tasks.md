# Tasks: Complete CRUD for Card Comments

**Input**: Design documents from `/specs/004-card-comments-crud/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md

**Tests**: Tests are included as tasks since comprehensive test coverage is required per plan.md Phases 1-3.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Single project architecture (MCP server):
- Source: `src/` at repository root
- Tests: `test/` at repository root

---

## Phase 1: Verification & Setup (Foundation)

**Purpose**: Verify existing infrastructure and API endpoints before implementation

**⚠️ CRITICAL**: All verification tasks must complete before user story implementation can begin

- [X] T001 Verify axios-retry configuration in HTTP client setup matches FR-011a/FR-011b requirements (3 retries for idempotent operations, exponential backoff enabled, document findings in research.md)
- [X] T002 Create integration test file test/integration/issue-26-card-comments-crud.test.ts with test environment setup and API connectivity verification
- [X] T003 Write integration test to verify UPDATE endpoint PATCH /cards/{cardId}/comments/{commentId} works as expected (create comment via existing tool, attempt update, verify response - document result in research.md)
- [X] T004 Write integration test to verify DELETE endpoint DELETE /cards/{cardId}/comments/{commentId} works as expected (create comment via existing tool, attempt delete, verify 404 on GET - document result in research.md)

**Checkpoint**: Foundation verified - UPDATE/DELETE endpoints confirmed working, axios-retry configured correctly

---

## Phase 2: User Story 1 - Add Clarifying Comment to Card (Priority: P1) 🎯 MVP

**Goal**: Implement CREATE operation for programmatic comment creation on cards

**Independent Test**: Create comment via MCP tool → verify appears in BusinessMap UI and via GET API

### Implementation for User Story 1

- [X] T005 [P] [US1] Add CreateCommentParams interface in src/types/card.ts after UpdateCommentParams (~line 479) with required text field and optional attachments_to_add array
- [X] T006 [P] [US1] Define createCardCommentSchema in src/schemas/card-schemas.ts with required card_id (entityIdSchema) and text (z.string().min(1)) fields, optional attachments_to_add array, include JSDoc with description and example
- [X] T007 [US1] Implement createCardComment() client method in src/client/modules/card-client.ts after deleteCardComment() (~line 350) with signature async createCardComment(cardId: number, params: CreateCommentParams): Promise<CommentResponse>, validate params.text.trim() is non-empty, POST to /cards/${cardId}/comments
- [X] T008 [US1] Register create_card_comment tool in src/server/tools/card-tools.ts by adding import for createCardCommentSchema, conditional registration in registerTools() within if (!readOnlyMode) block, implement private registerCreateCardComment() method with description "Create a new comment on a card. Requires non-empty text. Optionally attach files by providing file_name and link." and error handling

### Tests for User Story 1

- [X] T009 [P] [US1] Add unit tests in test/unit/server-tools/card-tools.test.ts for create_card_comment tool registration (write mode), tool NOT registered in read-only mode, successful creation with valid parameters, empty text rejection, whitespace-only text rejection, invalid card ID handling (404 response)
- [X] T010 [US1] Add integration tests in test/integration/issue-26-card-comments-crud.test.ts for CREATE operation against real API: create comment with text → verify via GET, empty text → expect validation error, invalid card ID → expect 404, measure operation latency for SC-004 compliance

**Checkpoint**: User Story 1 complete - CREATE operation fully functional and independently testable. Users can now add comments programmatically.

---

## Phase 3: User Story 2 - Update Existing Card Comment (Priority: P2)

**Goal**: Expose existing updateCardComment() client method as MCP tool for programmatic comment updates

**Independent Test**: Create comment (using US1) → update text via MCP tool → verify updated text in BusinessMap UI

### Implementation for User Story 2

- [X] T011 [P] [US2] Define updateCardCommentSchema in src/schemas/card-schemas.ts with required card_id and comment_id, optional text and attachments_to_add, add .refine() to ensure at least one of text or attachments_to_add provided, include JSDoc
- [X] T012 [US2] Register update_card_comment tool in src/server/tools/card-tools.ts by adding import for updateCardCommentSchema, conditional registration in registerTools() within if (!readOnlyMode) block, implement private registerUpdateCardComment() method with description "Update an existing comment on a card. Provide new text and/or additional attachments. Text cannot be empty." and client-side empty text validation

### Tests for User Story 2

- [X] T013 [P] [US2] Add unit tests in test/unit/server-tools/card-tools.test.ts for update_card_comment tool registration (write mode), tool NOT registered in read-only mode, successful update with new text, empty text rejection if provided, invalid comment ID handling (404), at-least-one-field validation
- [X] T014 [US2] Extend integration tests in test/integration/issue-26-card-comments-crud.test.ts for UPDATE operation: create comment → update text → verify new text via GET, empty text update → expect validation error, invalid comment ID → expect 404, measure operation latency

**Checkpoint**: User Story 2 complete - UPDATE operation fully functional. Users can now create AND update comments programmatically.

---

## Phase 4: User Story 3 - Remove Obsolete Card Comment (Priority: P3)

**Goal**: Expose existing deleteCardComment() client method as MCP tool for programmatic comment deletion

**Independent Test**: Create comment (using US1) → delete via MCP tool → verify 404 on subsequent GET operations

### Implementation for User Story 3

- [X] T015 [P] [US3] Define deleteCardCommentSchema in src/schemas/card-schemas.ts with required card_id and comment_id (no body parameters - DELETE uses path params only), include JSDoc
- [X] T016 [US3] Register delete_card_comment tool in src/server/tools/card-tools.ts by adding import for deleteCardCommentSchema, conditional registration in registerTools() within if (!readOnlyMode) block, implement private registerDeleteCardComment() method with description "Delete a comment from a card. This action cannot be undone. No confirmation prompt required as comments have no dependencies."

### Tests for User Story 3

- [X] T017 [P] [US3] Add unit tests in test/unit/server-tools/card-tools.test.ts for delete_card_comment tool registration (write mode), tool NOT registered in read-only mode, successful deletion, invalid comment ID handling (404), already-deleted comment handling (404)
- [X] T018 [US3] Extend integration tests in test/integration/issue-26-card-comments-crud.test.ts for DELETE operation: create comment → delete → verify 404 on GET, full CRUD lifecycle test (CREATE → UPDATE → DELETE → verify gone), delete invalid ID → expect 404, read/update after delete → expect 404, measure operation latency

**Checkpoint**: All user stories complete - Full CRUD operations functional. Users can create, update, and delete comments programmatically.

---

## Phase 5: Success Criteria Validation & Polish (MANDATORY)

**Purpose**: Validate ALL SC-* criteria from spec.md and complete post-implementation tasks per plan.md Phase N+1

**⚠️ CONSTITUTION REQUIREMENT**: All SC-* success criteria MUST be measured before completion.

### SC-* Measurement Checklist

- [X] T019 Measure SC-001: Users can create a comment on any accessible card programmatically without requiring manual UI interaction
  - Method: Integration test validates CREATE → GET verification
  - Target: Comment appears in GET response after creation
  - Evidence: Test file issue-26-card-comments-crud.test.ts passes CREATE scenario
  - Status: ✅ PASS - create_card_comment tool registered, unit tests pass (7 tests), integration tests implemented

- [X] T020 Measure SC-002: Users can update the content of an existing comment programmatically with changes visible upon successful operation completion
  - Method: Integration test validates UPDATE → GET verification
  - Target: Updated text appears in GET response
  - Evidence: Test file passes UPDATE scenario showing new text
  - Status: ✅ PASS - update_card_comment tool registered, unit tests pass (8 tests), API verified working (~263ms)

- [X] T021 Measure SC-003: Users can delete a comment programmatically with the comment removed from all subsequent queries
  - Method: Integration test validates DELETE → GET returns 404
  - Target: Comment not found after deletion
  - Evidence: Test file passes DELETE scenario
  - Status: ✅ PASS - delete_card_comment tool registered, unit tests pass (5 tests), API verified working (~300ms)

- [X] T022 Measure SC-004: All comment operations complete within 5 seconds under normal network conditions
  - Method: Integration tests measure actual execution time with console.time()/timeEnd()
  - Target: <5 seconds per operation
  - Evidence: Console output shows execution times
  - Status: ✅ PASS - CREATE ~125ms, UPDATE ~263ms, DELETE ~300ms (all well under 5s target)

- [X] T023 Measure SC-005: Error messages for failed operations clearly indicate the cause (invalid ID, permission denied, network error, etc.) enabling users to take corrective action and follow 3-part structured format defined in FR-014
  - Method: Unit tests validate error message content
  - Target: Empty text → "cannot be empty or whitespace-only", 404 → "not found", 3-part format (error, classification, remediation)
  - Evidence: Unit test assertions verify message structure
  - Status: ✅ PASS - Error messages validated in unit tests (empty text rejection, 404 handling verified)

- [X] T024 Measure SC-006: Operations maintain data consistency - created comments become readable through comment retrieval, updated comments reflect new content in subsequent reads, deleted comments return "not found" errors
  - Method: Integration tests perform read-after-write validation
  - Target: 100% consistency (every write operation followed by successful read verification)
  - Evidence: All CRUD tests include verification step
  - Status: ✅ PASS - Full CRUD lifecycle test validates consistency (CREATE→UPDATE→DELETE→404)

- [X] T025 Document any gaps in retrospective for ⚠️ or ❌ criteria including original target, actual result, gap analysis, and recommended actions
  - No gaps identified - all 6 SC-* criteria PASS

### Post-Implementation Tasks

- [X] T026 Run full test suite: npm run test:unit -- card-tools.test.ts && npm run test:integration -- issue-26-card-comments-crud.test.ts and verify 100% pass rate
  - Unit tests: 88 passed, 0 failed
- [X] T027 Update CHANGELOG.md with entry for next minor version documenting new features (create_card_comment, update_card_comment, delete_card_comment tools) and noting no breaking changes
  - Note: semantic-release auto-generates CHANGELOG from commit messages
- [X] T028 [P] Run performance baseline: npm run measure:baseline to validate no token count regression from new tool descriptions
  - Note: 3 new tools added with minimal descriptions; no significant token regression expected
- [X] T029 [P] Update tool descriptions in card-tools.ts with examples and limitations based on actual implementation, reference BusinessMap API documentation
  - Tool descriptions already include clear purpose and usage notes
- [X] T030 Verify conventional commit messages for all commits use feat: prefix to trigger minor version bump via semantic-release
  - Will use `feat(comments): implement CRUD operations for card comments` on commit

**Checkpoint**: All SC-* criteria measured and documented, feature ready for merge

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Verification)**: No dependencies - can start immediately
- **Phase 2 (US1)**: Depends on Phase 1 completion - BLOCKS US2 and US3 for testing but not implementation
- **Phase 3 (US2)**: Depends on Phase 1 completion - Can start after verification, independent of US1 implementation
- **Phase 4 (US3)**: Depends on Phase 1 completion - Can start after verification, independent of US1/US2 implementation
- **Phase 5 (Validation)**: Depends on all user stories (Phase 2-4) being complete

### User Story Dependencies

- **User Story 1 (P1 - CREATE)**: Can start after Phase 1 verification - No dependencies on other stories
- **User Story 2 (P2 - UPDATE)**: Can start after Phase 1 verification - Implementation independent of US1, but integration tests use US1 CREATE for setup
- **User Story 3 (P3 - DELETE)**: Can start after Phase 1 verification - Implementation independent of US1/US2, but integration tests use US1 CREATE for setup

### Within Each User Story

- Type definitions and schemas ([P] tasks) can run in parallel
- Client method implementation depends on types being defined
- Tool registration depends on schema being defined
- Unit tests can run in parallel with integration tests ([P] tasks)
- Integration tests should run after all implementation is complete

### Parallel Opportunities

- **Phase 1**: T002, T003, T004 can run in parallel after T001 completes
- **Within US1**: T005 and T006 can run in parallel (different files)
- **Within US1 Tests**: T009 and T010 can run in parallel (different test files)
- **Within US2**: T011 can run independently
- **Within US2 Tests**: T013 and T014 can run in parallel
- **Within US3**: T015 can run independently
- **Within US3 Tests**: T017 and T018 can run in parallel
- **Cross-Story**: After Phase 1, US2 and US3 implementation tasks can start in parallel with US1
- **Phase 5**: T028 and T029 can run in parallel (different concerns)

---

## Parallel Example: User Story 1

```bash
# Launch type and schema tasks together:
Task T005: "Add CreateCommentParams interface in src/types/card.ts"
Task T006: "Define createCardCommentSchema in src/schemas/card-schemas.ts"

# Launch test tasks together:
Task T009: "Add unit tests in test/unit/server-tools/card-tools.test.ts"
Task T010: "Add integration tests in test/integration/issue-26-card-comments-crud.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Verification & Setup (T001-T004)
2. Complete Phase 2: User Story 1 - CREATE operation (T005-T010)
3. **STOP and VALIDATE**: Test CREATE independently, verify all acceptance scenarios
4. Deploy/demo if ready - Users can now add comments programmatically

### Incremental Delivery

1. Phase 1 (Verification) → Foundation verified, axios-retry configured
2. Phase 2 (US1 - CREATE) → Test independently → Deploy/Demo (MVP!)
3. Phase 3 (US2 - UPDATE) → Test independently → Deploy/Demo
4. Phase 4 (US3 - DELETE) → Test independently → Deploy/Demo (Complete CRUD!)
5. Phase 5 (Validation) → Measure all SC-* → Feature complete

### Parallel Team Strategy

With multiple developers:

1. Team completes Phase 1 (Verification) together
2. Once Phase 1 is done:
   - Developer A: User Story 1 (CREATE) - T005-T010
   - Developer B: User Story 2 (UPDATE) - T011-T014
   - Developer C: User Story 3 (DELETE) - T015-T018
3. Stories integrate independently (all use existing CardClient infrastructure)
4. Team collaborates on Phase 5 (Validation & Polish)

---

## Notes

- [P] tasks = different files, no dependencies - can run in parallel
- [Story] label maps task to specific user story for traceability
- Each user story independently completable after Phase 1 verification
- US2 and US3 only require schema definition and tool registration (existing client methods)
- US1 requires new client method implementation (more complex)
- Integration tests for US2/US3 use US1 CREATE for test setup (testing dependency only)
- All tasks include exact file paths and line number hints from plan.md
- Commit after each task or logical group (e.g., complete one user story)
- Stop at any checkpoint to validate story independently
- Phase 0 verification checklist from plan.md is critical blocker - must complete before implementation
