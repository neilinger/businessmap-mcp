# Pre-Implementation Requirements Quality Checklist

**Feature**: 001-complete-crud-operations
**Type**: Author Self-Check (Pre-Implementation Validation)
**Scope**: Confirmed Operations Only (~80% CRUD Coverage)
**Focus**: Consistency + Edge Cases + Validation/Error Handling
**Generated**: 2025-10-24

---

## Overview

This checklist validates the **quality of requirements** before implementation begins. Each item tests whether the specification, data model, and contracts provide sufficient, consistent, and unambiguous information for implementation.

**NOT TESTED HERE**: Implementation behavior, runtime correctness, or actual code functionality.

**HOW TO USE**:
1. Mark each item ✅ (requirement is clear/complete) or ❌ (gap/ambiguity found)
2. For ❌ items: Document the gap/ambiguity and update spec/data-model/contracts
3. Aim for 100% ✅ before starting Phase 2 (implementation)

**TRACEABILITY**: Each item references source documents:
- `[Spec §X]` = spec.md section
- `[Data §X]` = data-model.md section
- `[Contract §X]` = contracts/*.yaml or contracts/README.md
- `[Gap]` = Missing from all sources
- `[Ambiguity]` = Conflicting information between sources

---

## Category 1: Requirement Completeness

### Comments (2 operations)

- [ ] **CHK001**: Are update and delete operations for comments explicitly defined in functional requirements? [Spec §FR-003, research.md:100-119]
- [ ] **CHK002**: Is the comment text length constraint (1-5000 chars) specified? [Contract §comments-api.yaml:163, Spec §FR-003]
- [ ] **CHK003**: Are authentication requirements for comment operations defined? [Spec §NFR-Security, Contract §comments-api.yaml]
- [ ] **CHK004**: Is the behavior for updating/deleting comments by non-authors specified? [Ambiguity - Spec §FR-003 mentions "author attribution" but no permission rules]

### Subtasks (2 operations)

- [ ] **CHK005**: Are update and delete operations for subtasks explicitly defined in functional requirements? [Spec §FR-005, research.md:122-141]
- [ ] **CHK006**: Are validation rules for all updatable subtask fields (description, owner, deadline, position) documented? [Contract §subtasks-api.yaml, Data §Subtask]
- [ ] **CHK007**: Is subtask position reordering behavior specified when position is updated? [Ambiguity - Contract has position field but no reordering rules]
- [ ] **CHK008**: Is the behavior for deleting subtasks when parent card is deleted specified? [Spec §Edge Cases, Contract §cards-api.yaml:delete_subtasks]

### Custom Fields (6 operations)

- [ ] **CHK009**: Are all 6 custom field operations (list all, list board, get, create, update, delete) explicitly defined? [Spec §FR-015, research.md:144-165]
- [ ] **CHK010**: Is the "definition vs instance" pattern for CustomField/CustomFieldValue clearly explained? [Data §CustomField Design Pattern, research.md:164]
- [ ] **CHK011**: Are validation rules for each custom field type (text, number, date, dropdown, etc.) documented? [Contract §custom-fields-api.yaml:171, Data §CustomField]
- [ ] **CHK012**: Is the composite key (card_id, field_id) for CustomFieldValue explicitly stated? [Data §CustomFieldValue, §Composite Keys]
- [ ] **CHK013**: Is the behavior when deleting a CustomField definition (cascade to all card values) specified? [Gap - Not in Spec §Edge Cases or Contract]
- [ ] **CHK014**: Are field type constraints (e.g., number min/max, text regex, dropdown options) documented? [Contract §custom-fields-api.yaml, Data §CustomField]
- [ ] **CHK015**: Is the `is_required` flag behavior explained (validation when creating/updating cards)? [Ambiguity - Contract has field but no validation spec]

### Workspaces (2 operations)

- [ ] **CHK016**: Are update and delete operations for workspaces explicitly defined? [Spec §FR-001, research.md:281]
- [ ] **CHK017**: Is the `force` parameter for workspace deletion documented with clear semantics? [Contract §workspaces-api.yaml:92, Spec §FR-021]
- [ ] **CHK018**: Is the error message content for non-empty workspace deletion specified? [Contract §workspaces-api.yaml:146, Spec §NFR-Usability]

### Boards (2 operations)

- [ ] **CHK019**: Are update and delete operations for boards explicitly defined? [Spec §FR-002, research.md:283]
- [ ] **CHK020**: Are both `force` and `archive_first` parameters for board deletion documented? [Contract §boards-api.yaml:106-108, Spec §FR-021]
- [ ] **CHK021**: Is the behavior of `workspace_id` update (moving board to different workspace) specified? [Contract §boards-api.yaml:101, Ambiguity - No spec coverage]

### Cards (1 operation)

- [ ] **CHK022**: Is card deletion with all 4 safety parameters (`force`, `archive_first`, `delete_subtasks`, `delete_comments`) documented? [Contract §cards-api.yaml:114-118, Spec §FR-004]
- [ ] **CHK023**: Is the dependency detection for card deletion (child cards, links) specified? [Spec §Edge Cases:73-85, Contract §cards-api.yaml]
- [ ] **CHK024**: Is the confirmation prompt content for card deletion with dependencies defined? [Spec §FR-021, Gap - No specific content]

---

## Category 2: Requirement Clarity

### Operation Semantics

- [ ] **CHK025**: Is the distinction between PATCH (partial update) and PUT (full replace) clearly stated? [Spec uses "update" but Contract uses PATCH - consistent]
- [ ] **CHK026**: Is idempotency of DELETE operations explicitly documented? [Contract §README:198, Spec §NFR]
- [ ] **CHK027**: Are "immediate execution" vs "confirmation required" rules clearly defined for all operations? [Spec §NFR-Usability:257-258, Spec §FR-021]
- [ ] **CHK028**: Is the meaning of "archive before delete" (archive_first parameter) explained? [Contract has parameter but no semantic explanation]

### Error Messages

- [ ] **CHK029**: Is the error response structure documented with all required fields (error, message, details, timestamp, path)? [Contract §CONTRACTS_SUMMARY:129-137]
- [ ] **CHK030**: Are specific error codes for each failure scenario defined (e.g., BOARD_NOT_EMPTY, CARD_HAS_DEPENDENCIES)? [Contract §CONTRACTS_SUMMARY:139-147]
- [ ] **CHK031**: Is the content format for transient vs permanent error messages specified? [Spec §NFR-Error Handling, Gap - No format distinction]
- [ ] **CHK032**: Are remediation steps required in error messages? [Spec §NFR-Error Handling references "remediation steps" but no examples provided]

### Parameter Semantics

- [ ] **CHK033**: Is the behavior of optional parameters when omitted documented for each operation? [Ambiguity - Contracts show optional but no default behavior]
- [ ] **CHK034**: Are query parameter defaults documented (e.g., force=false, page=1, page_size=20)? [Contract §custom-fields-api.yaml:157, Contract §CONTRACTS_SUMMARY:157]
- [ ] **CHK035**: Is the `position` field behavior explained (0-indexed? 1-indexed? reordering logic)? [Ambiguity - Data model has position but no indexing convention]

---

## Category 3: Requirement Consistency

### Cross-Document Consistency

- [ ] **CHK036**: Do FR-003 (Comments), research.md:100-119, and contracts/comments-api.yaml agree on supported operations? [Spec says partial, research says full CRUD - INCONSISTENCY FLAGGED]
- [ ] **CHK037**: Do FR-005 (Subtasks), research.md:122-141, and contracts/subtasks-api.yaml agree on supported operations? [Spec says uncertain, research says full CRUD - INCONSISTENCY FLAGGED]
- [ ] **CHK038**: Do FR-015 (CustomFields), research.md:144-165, and contracts/custom-fields-api.yaml agree on admin restrictions? [Spec says "admin verification needed", research says "no restrictions" - INCONSISTENCY FLAGGED]
- [ ] **CHK039**: Does the ERD in data-model.md match the entity definitions in §Entity Definitions? [Data model self-consistency]
- [ ] **CHK040**: Do validation rules in data-model.md match those in contracts/*.yaml? [Cross-check string lengths, enums, formats]
- [ ] **CHK041**: Do the 15 operations listed in plan.md match those in contracts/CONTRACTS_SUMMARY.md? [Plan §Scale/Scope vs Contract §Executive Summary]

### Terminology Consistency

- [ ] **CHK042**: Is "workspace" vs "project" terminology consistent across all documents? [Check spec.md, data-model.md, contracts]
- [ ] **CHK043**: Is "custom field" vs "field" vs "custom field definition" terminology consistent? [Data model uses "CustomField" and "CustomFieldValue" - check spec/contracts]
- [ ] **CHK044**: Are HTTP status codes consistently used (e.g., always 204 for successful DELETE)? [Contract review]

### Rate Limit Consistency

- [ ] **CHK045**: Do all documents agree on rate limit values (600/hr, 30/min)? [Research §Rate Limit Specifications, Plan §Performance Goals]
- [ ] **CHK046**: Is the RL02 error code handling consistent across all contracts? [All contracts should include 429 response with RL02]
- [ ] **CHK047**: Are rate limit header names consistent (X-RateLimit-* vs X-RateLimitPerHour-*)? [Research uses "PerHour", Contract uses generic - VERIFY]

---

## Category 4: Acceptance Criteria Quality

### Success Criteria

- [ ] **CHK048**: Is SC-004 (Card management 95% CRUD coverage) measurable and testable? [Spec §Success Criteria:366-368]
- [ ] **CHK049**: Is SC-006 (Custom field 100% coverage) measurable and testable? [Spec §Success Criteria:371-374]
- [ ] **CHK050**: Is SC-007 (Overall 80% coverage) broken down by resource type for verifiability? [Spec §Success Criteria:377-380, Gap - No per-resource breakdown]
- [ ] **CHK051**: Are performance targets (<2s single, <10s bulk) defined with specific operation examples? [Spec §NFR-Performance, Plan §Performance Goals]

### Test Scenarios

- [ ] **CHK052**: Are positive test scenarios provided for each of the 15 operations? [Gap - No test scenarios in spec/contracts]
- [ ] **CHK053**: Are negative test scenarios (validation failures) provided for each operation? [Contracts have error examples but not comprehensive scenarios]
- [ ] **CHK054**: Are edge case test scenarios documented? [Spec §Edge Cases has prose but no formal scenarios]

---

## Category 5: Scenario Coverage

### Basic CRUD Flows

- [ ] **CHK055**: Is the full lifecycle documented for comments (create → read → update → delete)? [Spec §FR-003, research.md:100-119]
- [ ] **CHK056**: Is the full lifecycle documented for subtasks (create → read → update → delete)? [Spec §FR-005, research.md:122-141]
- [ ] **CHK057**: Is the full lifecycle documented for custom fields (create definition → add to card → update value → delete definition)? [Spec §FR-015, Data §CustomField Pattern]

### Bulk Operations

- [ ] **CHK058**: Is the scenario of deleting a workspace with N boards documented? [Spec §Edge Cases, Contract §workspaces-api.yaml]
- [ ] **CHK059**: Is the scenario of deleting a board with N cards documented? [Spec §Edge Cases, Contract §boards-api.yaml]
- [ ] **CHK060**: Is the scenario of deleting a card with N children/subtasks/comments documented? [Spec §Edge Cases:73-85, Contract §cards-api.yaml]
- [ ] **CHK061**: Are performance expectations for bulk operations (≤50 resources, <10s) scenario-specific? [Plan §Performance Goals, Gap - No per-scenario breakdown]

### Pagination Scenarios

- [ ] **CHK062**: Is the pagination scenario for listing all custom fields (page 1, 2, ..., N) documented? [Contract §custom-fields-api.yaml:157, CONTRACTS_SUMMARY:155-158]
- [ ] **CHK063**: Is the behavior when page exceeds total pages specified? [Gap - Contract has pagination but no overflow behavior]

---

## Category 6: Edge Case Coverage

### Cascade Deletes

- [ ] **CHK064**: Is the cascade delete dependency chain explicitly documented (Workspace → Board → Card → Subtask/Comment)? [Spec §Edge Cases:73-85, Data §Entity Definitions]
- [ ] **CHK065**: Is the confirmation prompt requirement for each cascade level specified? [Spec §FR-021, Ambiguity - "dependencies exist" but what constitutes a dependency?]
- [ ] **CHK066**: Is the order of cascade deletes defined (e.g., delete comments first, then subtasks, then card)? [Gap - No delete order specified]

### Concurrent Modifications

- [ ] **CHK067**: Is the behavior when two users update the same comment concurrently specified? [Gap - No concurrency handling mentioned]
- [ ] **CHK068**: Is the behavior when a custom field is deleted while a user is updating a card value specified? [Gap - No race condition handling]
- [ ] **CHK069**: Is optimistic locking or version control mentioned for update operations? [Gap - No concurrency control specified]

### Orphaned Resources

- [ ] **CHK070**: Is the behavior when a card is moved to a column/lane in a different workflow specified? [Data model shows Card → Column/Lane FK but no cross-workflow validation]
- [ ] **CHK071**: Is the behavior when a CustomFieldValue references a deleted CustomField specified? [Gap - Cascade delete behavior not documented]
- [ ] **CHK072**: Is the behavior when a subtask owner is deleted from the system specified? [Gap - User deletion not in scope but FK constraint implications unclear]

### Composite Key Edge Cases

- [ ] **CHK073**: Is the behavior when attempting to create duplicate CustomFieldValue (same card_id + field_id) specified? [Data §Composite Keys, Gap - Duplicate handling not specified]
- [ ] **CHK074**: Is the behavior when attempting to create a card with required custom field missing specified? [Ambiguity - CustomField.is_required exists but validation not specified]

### WIP Limit Edge Cases

- [ ] **CHK075**: Is the behavior when moving a card to a column at WIP limit specified? [Spec §FR-008 mentions WIP limits but not enforcement during card operations]
- [ ] **CHK076**: Is the behavior when updating a column's WIP limit below current card count specified? [Gap - Column update not supported but constraint implications unclear]

### Rate Limit Edge Cases

- [ ] **CHK077**: Is the behavior when rate limit is hit mid-bulk-operation (e.g., deleting 50 boards) specified? [Plan §Rate Limit Strategy, Gap - Partial failure handling not documented]
- [ ] **CHK078**: Is the retry strategy for RL02 errors documented (exponential backoff parameters)? [Research §Rate Limit Strategy:28-47, Plan §axios-retry]

---

## Category 7: Validation Rules

### Field Validation

- [ ] **CHK079**: Are validation rules for all string fields documented with min/max lengths? [Contract §CONTRACTS_SUMMARY:162-168 vs Data §Entity Definitions - CROSS-CHECK]
- [ ] **CHK080**: Are validation rules for all enum fields documented with allowed values? [Data §Entity Definitions vs Contract enums - CROSS-CHECK]
- [ ] **CHK081**: Are validation rules for all date fields documented with format (ISO 8601)? [Contract §Standards Compliance:305, Data model]
- [ ] **CHK082**: Are validation rules for all numeric fields documented with min/max/precision? [CustomField number type, position fields]

### Cross-Field Validation

- [ ] **CHK083**: Is validation between `planned_start_date` and `planned_end_date` specified? [Data §Card entity mentions both but no cross-validation rule]
- [ ] **CHK084**: Is validation between `actual_start_time` and `actual_end_time` specified? [Data §Card entity, Gap - No validation rule]
- [ ] **CHK085**: Is validation between `column_id` and `lane_id` (must belong to same workflow) specified? [Data model shows FK but no cross-FK validation]

### Required vs Optional

- [ ] **CHK086**: Are required fields explicitly marked for all create operations? [Contract operations have required fields but not consistently documented]
- [ ] **CHK087**: Are optional fields explicitly marked for all update operations? [Contract PATCH operations show optional fields with `?` suffix]
- [ ] **CHK088**: Is the behavior when required field is null/empty in update operation specified? [Ambiguity - Can PATCH remove a required field?]

### Format Validation

- [ ] **CHK089**: Is the format validation for color fields specified (e.g., #RRGGBB hex)? [Data §Lane.color mentions hex but no validation regex]
- [ ] **CHK090**: Is the format validation for URL fields specified (e.g., attachment links)? [Contract mentions URI format but no validation details]

---

## Category 8: Error Handling Requirements

### Error Message Quality

- [ ] **CHK091**: Is the requirement for "specific cause" in error messages demonstrated with examples? [Spec §NFR-Error Handling, Contracts have examples but not comprehensive]
- [ ] **CHK092**: Is the distinction between transient vs permanent errors documented? [Plan §Constitution Check:56, Gap - No error classification guide]
- [ ] **CHK093**: Is the requirement for "remediation steps" demonstrated with examples? [Spec §NFR-Error Handling mentions it, Gap - No examples provided]

### Error Codes

- [ ] **CHK094**: Is a complete error code catalog provided? [Contract §CONTRACTS_SUMMARY:139-147 has 8 codes, Is this exhaustive?]
- [ ] **CHK095**: Are error codes uniquely mapped to HTTP status codes? [Contract shows ERROR_CODE → Status mapping]
- [ ] **CHK096**: Is the error code naming convention documented (e.g., RL02, VALIDATION_ERROR)? [Ambiguity - RL02 vs VALIDATION_ERROR different patterns]

### Rate Limit Error Handling

- [ ] **CHK097**: Is the RL02 error response structure specified with all required headers? [Contract §CONTRACTS_SUMMARY:149-153, Research §Rate Limit Specifications]
- [ ] **CHK098**: Is the client retry strategy (axios-retry config) specified? [Research §Rate Limit Strategy:28-35, Plan §Technical Context]
- [ ] **CHK099**: Is the 80% threshold warning behavior specified? [Research §Rate Limit Strategy:38-43, Gap - Warning destination (logs? user?) unclear]

### Validation Error Details

- [ ] **CHK100**: Is the structure of validation error `details` field specified (field name, reason, value)? [Contract §CONTRACTS_SUMMARY:130-137, Gap - No field-level detail schema]
- [ ] **CHK101**: Are validation error messages required to be actionable (e.g., "name must be 1-100 chars" not "invalid name")? [Spec §NFR-Usability:255, Gap - No message template]

---

## Category 9: Data Integrity Requirements

### Foreign Key Constraints

- [ ] **CHK102**: Are all foreign key constraints documented in data model? [Data §Entity Definitions and §ERD - VERIFY COMPLETENESS]
- [ ] **CHK103**: Is the behavior on FK constraint violation specified (e.g., 404 vs 400)? [Gap - No FK violation error handling specified]
- [ ] **CHK104**: Are cascade delete rules for all FKs specified? [Data model shows relationships but not all cascade behaviors]

### Uniqueness Constraints

- [ ] **CHK105**: Is the uniqueness constraint for composite key (card_id, field_id) in CustomFieldValue specified? [Data §Composite Keys:205-211]
- [ ] **CHK106**: Is the uniqueness constraint for CustomField.name within a board specified? [Ambiguity - Can two fields on same board have same name?]
- [ ] **CHK107**: Is the error response for uniqueness violations specified? [Gap - No DUPLICATE_KEY error code in catalog]

### Referential Integrity

- [ ] **CHK108**: Is the behavior when deleting a Board with Cards that have CustomFieldValues specified? [Data model shows relationships but cascade path unclear]
- [ ] **CHK109**: Is the behavior when deleting a Lane with Cards in that lane specified? [Data §Card shows optional FK to Lane, deletion behavior unspecified]

---

## Category 10: Non-Functional Requirements

### Performance

- [ ] **CHK110**: Are performance targets measurable for each operation category? [Spec §NFR-Performance, Plan §Performance Goals - VERIFY MEASURABILITY]
- [ ] **CHK111**: Is the 500ms overhead for dependency analysis specified with measurement approach? [Plan §Performance Goals]

### Security

- [ ] **CHK112**: Is the token authentication mechanism specified (Bearer token format, validation)? [Contract §Security:122-125, Spec §NFR-Security]
- [ ] **CHK113**: Is the requirement to never log sensitive data demonstrated with examples? [Spec §NFR-Security:263, Gap - No code examples]
- [ ] **CHK114**: Is the audit trail requirement specified with required fields (user, timestamp, operation)? [Spec §NFR-Security:265, Gap - No audit schema]

### Usability

- [ ] **CHK115**: Is the requirement for "consistent parameter names" demonstrated across operations? [Spec §NFR-Usability:253, Contracts - VERIFY CONSISTENCY]
- [ ] **CHK116**: Is the requirement for "plain language error messages" demonstrated with good/bad examples? [Spec §NFR-Usability:255, Gap - No examples]

---

## Summary Statistics

**Total Checklist Items**: 116
**Categories**: 10
**Estimated Review Time**: 3-4 hours
**Target Pass Rate**: 100% before implementation

### Traceability Breakdown

- Items with `[Spec §X]` reference: ~60%
- Items with `[Contract §X]` reference: ~45%
- Items with `[Data §X]` reference: ~35%
- Items marked `[Gap]`: ~25%
- Items marked `[Ambiguity]`: ~15%
- Items marked `[INCONSISTENCY]`: 3 (CHK036, CHK037, CHK038 - FLAGGED FOR IMMEDIATE RESOLUTION)

### High-Priority Items (Resolve Before Implementation)

1. **CHK036-038**: Spec vs Research inconsistencies on CRUD support
2. **CHK013**: CustomField cascade delete behavior
3. **CHK024**: Card deletion confirmation prompt content
4. **CHK047**: Rate limit header name consistency
5. **CHK073**: CustomFieldValue duplicate handling
6. **CHK077**: Rate limit mid-bulk-operation behavior
7. **CHK085**: Cross-FK validation (column/lane in same workflow)
8. **CHK103**: FK constraint violation error codes

---

## How to Complete This Checklist

### Step 1: Initial Pass (1-2 hours)
Go through all 116 items marking:
- ✅ if requirement is clear and complete in referenced documents
- ❌ if gap/ambiguity found

### Step 2: Gap Documentation (30-60 minutes)
For each ❌ item, document the specific gap or ambiguity:
- What information is missing?
- Which documents need updates?
- What is the blocker for implementation?

### Step 3: Resolution (1-2 hours)
Update spec.md, data-model.md, and/or contracts/*.yaml to resolve gaps:
- Add missing requirements
- Clarify ambiguous language
- Resolve cross-document inconsistencies
- Add validation rules
- Specify error handling behavior

### Step 4: Final Verification (30 minutes)
Re-check all ❌ items after updates. Goal: 100% ✅ before Phase 2 starts.

---

## Validation

This checklist itself should be validated against:
- [x] Covers all 15 operations in scope
- [x] Tests requirement quality (not implementation)
- [x] Provides 80%+ traceability to source documents
- [x] Includes edge cases from spec.md §Edge Cases
- [x] Includes validation rules from contracts/CONTRACTS_SUMMARY.md
- [x] Includes error handling requirements from spec.md §NFR
- [x] Flags known inconsistencies (CHK036-038)
- [x] Uses clear pass/fail criteria for each item

---

**Generated by**: `/speckit.checklist` command
**Date**: 2025-10-24
**Status**: Ready for use
**Next Action**: Begin Step 1 (Initial Pass)
