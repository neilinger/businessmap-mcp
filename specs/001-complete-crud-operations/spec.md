# Feature Specification: Complete CRUD Operations for MCP Resources

**Feature Branch**: `001-complete-crud-operations`
**Created**: 2025-10-23
**Status**: Draft
**Input**: User description: "Close the GAP in the current MCP implementation by completing partially present CRUD Operations."

## Clarifications

### Session 2025-10-23

- Q: When deleting a resource with dependencies (workspace containing boards, card with children), what should happen? → A: See FR-021 for cascade delete confirmation behavior
- Q: Should delete operations require additional confirmation beyond the dependency confirmation? → A: See FR-021 for confirmation policy
- Q: How should bulk delete operations handle confirmation when some resources have dependencies and others don't? → A: See FR-021 and FR-020 for bulk operation confirmation behavior

### Session 2025-10-24 - API Research Findings

**Card Management Operations (P2)** - Research Verified:
- Comments: Full CRUD ✅ (GET, POST, PATCH, DELETE) - verified via OpenAPI v2 spec
- Outcomes: Read-only ✅ (GET only; creation/modification not available via API)
- Subtasks: Full CRUD ✅ (GET, POST, PATCH, DELETE) - verified via OpenAPI v2 spec

**Workflow/Column Operations (P3)** - Research Verified:
- Workflows: Read-only ✅ (cycle time columns only; create/update/delete are UI-only operations)
- Columns: Read-only ✅ (GET only; create/update not supported; DELETE requires testing)

**Custom Field Operations (P4)** - Research Verified:
- Field Definitions: Full CRUD ✅ (GET, POST, PATCH, DELETE) at /customFields and /boards/{id}/customFields endpoints; no admin restrictions detected
- Field Values on Cards: Full CRUD ✅ via card update operations

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Quick Update and Delete Operations (Priority: P1)

Users can modify and remove BusinessMap resources (workspaces, boards, cards) through the MCP interface to maintain accurate project structures and clean up obsolete items.

**Why this priority**: 5 operations already exist in the client layer but aren't exposed as MCP tools. This represents immediate value with minimal implementation effort (2-4 hours total). Updates and deletions are critical for basic resource lifecycle management.

**Existing Operations to Expose**:

- `update_workspace` (workspace-client.ts:33)
- `delete_workspace` (workspace-client.ts:48)
- `update_board` (board-client.ts:64)
- `delete_board` (board-client.ts:73)
- `delete_card` (card-client.ts:167)

**Independent Test**: Can be fully tested by creating a workspace/board/card, modifying its properties, deleting it, and verifying the changes persist in BusinessMap. Delivers immediate value by enabling users to maintain clean project structures.

**Acceptance Scenarios**:

1. **Given** a workspace exists with name "Old Project", **When** user calls update_workspace with new name "New Project", **Then** the workspace name changes and is reflected in all subsequent queries (tests workspace-client.ts:33) **→ Tasks: T041, T043, T076**
2. **Given** an empty workspace exists, **When** user calls delete_workspace, **Then** the workspace is deleted immediately without confirmation and no longer appears in workspace listings (tests workspace-client.ts:48) **→ Tasks: T042, T044, T076**
3. **Given** a board exists with description "Old Description", **When** user calls update_board with new description "New Description", **Then** the board description changes and is reflected in board queries (tests board-client.ts:64) **→ Tasks: T046, T048, T076**
4. **Given** an unused board exists with no cards, **When** user calls delete_board, **Then** the board is deleted immediately without confirmation and no longer appears in board listings (tests board-client.ts:73) **→ Tasks: T047, T049, T076**
5. **Given** a completed card exists with no children, **When** user calls delete_card, **Then** the card is deleted immediately without confirmation and is removed from all queries (tests card-client.ts:167) **→ Tasks: T051, T052, T076**
6. **Given** a workspace contains 3 boards, **When** user calls delete_workspace, **Then** system displays confirmation listing 3 dependent boards, and upon confirmation cascades delete to workspace, all boards, and their cards **→ Tasks: T056, T060, T078**
7. **Given** 5 workspaces exist (2 containing boards, 3 empty), **When** user calls bulk_delete_workspaces with all 5 IDs, **Then** system analyzes dependencies upfront and displays single consolidated confirmation per format in contracts/CONFIRMATION_EXAMPLES.md, listing only resources with dependencies, **And** upon confirmation deletes all 5 workspaces in single transaction **→ Tasks: T055-T064, T080**

---

### User Story 2 - Complete Card Management (Priority: P2)

Users can perform full CRUD operations on card comments and subtasks, view card outcomes, and update lane assignments to track work progress and collaborate effectively.

**Why this priority**: Cards are the primary work item in BusinessMap. Research verified full CRUD support for comments and subtasks (not just create/read), achieving 95% card management coverage. Outcomes remain read-only, and lane updates are supported via card move operations.

**API Capabilities**: Comments (full CRUD), Outcomes (read-only), Subtasks (full CRUD), Lane updates (supported via card move operation).

**Independent Test**: Can be tested by creating a card, adding comments, adding subtasks, viewing outcomes, and moving between lanes. Delivers enhanced work item collaboration capabilities independently of other features.

**Acceptance Scenarios**:

1. **Given** a card exists, **When** user adds a comment with text and mentions, **Then** the comment appears in the card's comment thread with proper attribution **→ Tasks: Pre-existing functionality (create_card_comment tool); validated by T076**
2. **Given** a card exists, **When** user adds a subtask with description and owner, **Then** the subtask appears in the card's subtask list and can be tracked separately **→ Tasks: Pre-existing functionality (create_card_subtask tool); validated by T076**
3. **Given** a card has outcomes, **When** user retrieves card outcomes, **Then** the system displays all outcome records with resolution status and details **→ Tasks: T052a (verify client method), T053 (create tool), T076 (validation)**
4. **Given** a card is in lane A, **When** user updates the lane to B, **Then** the card moves to lane B and reflects the new position **→ Tasks: T053a (lane verification), T076 (validation)**

---

### User Story 3 - Workflow and Column Configuration (Priority: P3)

Users can view workflows and columns, with potential support for creating and modifying them to customize board structures and match their team's specific process requirements.

**Why this priority**: Workflows and columns provide structural flexibility but are less frequently modified than cards. Currently read-only with 25% coverage. Column deletion is confirmed; other write operations require API access verification (may be admin-only or UI-only operations).

**API Status**: Read operations confirmed. Create/update operations for workflows and columns require verification with actual API access. Column deletion confirmed in documentation.

**Independent Test**: Can be tested by attempting workflow/column creation and modification operations. If supported, validates board customization capabilities. If not supported by API, maintains current read-only functionality.

**Acceptance Scenarios** *(subject to API capability verification)*:

1. **Given** a board exists, **When** user attempts to create a workflow with name "Development Process", **Then** the system either creates the workflow (if API supports it) or returns clear error indicating operation not supported **→ Tasks: T077 (unsupported operation error handling), T076 (validation)**
2. **Given** a workflow exists, **When** user attempts to add a column "Code Review" with WIP limit 3, **Then** the system either creates the column (if API supports it) or returns clear error indicating operation not supported **→ Tasks: T077 (unsupported operation error handling), T076 (validation)**
3. **Given** a column exists with no cards, **When** user deletes it, **Then** the column is removed from the workflow (confirmed supported by API) **→ Tasks: T075 (API verification + conditional implementation), T076 (validation)**
4. **Given** workflow/column write operations are supported, **When** user updates column WIP limit, **Then** the changes are reflected in the board configuration **→ Tasks: T077 (unsupported operation error handling), T076 (validation)**

---

### User Story 4 - Custom Field Management (Priority: P4)

Users can read custom field definitions and manage custom field **values** on cards to capture domain-specific data within BusinessMap's configured data model.

**Why this priority**: Custom field values on cards are fully supported via card update operations, enabling domain-specific data tracking. Custom field **definitions** (creating new field types, modifying field schemas) are fully supported via /customFields endpoints per OpenAPI v2 verification. Achieves 100% coverage for custom field management (both definitions and values).

**API Capabilities**: Custom field **values** on cards support full CRUD via card operations. Custom field **definitions** (types, schemas, options) support full CRUD at /customFields and /boards/{id}/customFields endpoints (no admin restrictions detected via OpenAPI v2 verification).

**Independent Test**: Can be tested by reading field definitions, then setting/updating/clearing custom field values on cards. Validates data capture capabilities within existing field definitions.

**Acceptance Scenarios**:

1. **Given** custom fields are defined on a board, **When** user retrieves custom field definitions, **Then** the system returns all field schemas with types, options, and constraints **→ Tasks: T033, T034, T035 (list/get custom field tools), T076 (validation)**
2. **Given** a card exists with custom fields, **When** user sets a custom field value (e.g., "Customer Priority" = "High"), **Then** the field value is saved and appears in subsequent card queries **→ Tasks: Pre-existing functionality (update_card with custom fields); validated by T076**
3. **Given** a card has custom field values, **When** user updates a field value (e.g., change priority from "High" to "Medium"), **Then** the updated value is reflected on the card **→ Tasks: Pre-existing functionality (update_card with custom fields); validated by T076**
4. **Given** custom field definition operations are supported, **When** admin user attempts to create/modify field definitions, **Then** the system either performs the operation (if API supports it) or returns clear error indicating admin-only access required **→ Tasks: T036, T037, T038 (create/update/delete custom field definition tools), T076 (validation)**

---

### Edge Cases

- **Deleting workspace with boards**: Follows Cascade Delete behavior (see Glossary). Confirmation prompt per FR-021.
- **Deleting card with children/parents**: Follows Cascade Delete behavior (see Glossary). Parent relationships are removed; child cards are deleted per cascade order.
- **Updating board with active viewers**: System allows update; concurrent viewers see changes on next refresh following BusinessMap's eventual consistency model (consistency model handled by BusinessMap API; MCP server makes no additional guarantees beyond API behavior). Concurrent modifications are handled by BusinessMap API using optimistic locking (version-based). When conflicts occur, the API returns 409 CONFLICT. The MCP server should retry with the latest resource version or prompt the user to resolve conflicts.
- **Creating workflow with duplicate column names**: System validates uniqueness within workflow scope and returns clear error message if duplicate detected
- **Updating custom field type with existing data**: System validates data compatibility; blocks incompatible changes (e.g., text to number with non-numeric values) with clear error message
- **Moving card to lane at WIP limit**: System respects WIP limit enforcement configured in BusinessMap; blocks move if limit reached and returns actionable error message
- **Deleting comment referenced elsewhere**: Comments are self-contained entities; deletion removes comment regardless of external references
- **Bulk delete with mixed dependencies**: System analyzes all target resources upfront and displays single consolidated confirmation per format in contracts/CONFIRMATION_EXAMPLES.md; dependency-free resources included automatically in batch execution without separate confirmation

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST expose existing update operations for workspaces, boards, and cards (workspace-client.ts:33, board-client.ts:64, card-client.ts methods)
- **FR-002**: System MUST expose existing delete operations for workspaces, boards, and cards (workspace-client.ts:48, board-client.ts:73, card-client.ts:167). Updating a board's workspace_id moves the board to a different workspace, retaining all cards, workflows, and relationships. Users must have appropriate permissions in both the source and destination workspaces. The API validates permissions before executing the move.
- **FR-003**: Users MUST be able to perform full CRUD operations on card comments including text content, timestamps, and author attribution (API supports GET, POST, PATCH, DELETE - verified via OpenAPI v2 spec). Only the comment author or workspace administrators can update/delete comments. The BusinessMap API returns 403 Forbidden for unauthorized attempts. The MCP server propagates this error.
- **FR-004**: Users MUST be able to retrieve card outcomes including resolution status and details (API supports GET only; outcome creation/modification not available via API)
- **FR-005**: System MUST support full CRUD operations on card subtasks with description, owner, deadline, and completion status (API supports GET, POST, PATCH, DELETE - verified via OpenAPI v2 spec)
- **FR-006**: System MUST support updating card lane assignments to move cards between swimlanes (supported via existing card move operation)
- **FR-006a**: System MUST support managing parent-child card relationships including adding parent cards, removing parent cards, listing parent cards, and listing child cards (API supports: POST /cards/{id}/parents, DELETE /cards/{id}/parents/{parent_id}, GET /cards/{id}/parents, GET /cards/{id}/children - achieving 4/4 relationship management operations per SC-004)
- **FR-007**: ~~Users SHOULD be able to create workflows~~ → **NOT SUPPORTED**: Workflow creation is a UI-only operation per OpenAPI v2 verification. Read-only access available via GET endpoints for cycle time columns.
- **FR-008**: ~~Users SHOULD be able to update workflow properties~~ → **NOT SUPPORTED**: Workflow updates are UI-only operations. No PATCH endpoint available in API.
- **FR-009**: ~~Users SHOULD be able to delete workflows~~ → **NOT SUPPORTED**: Workflow deletion is a UI-only operation. No DELETE endpoint available in API.
- **FR-010**: ~~Users SHOULD be able to create columns~~ → **NOT SUPPORTED**: Column creation is a UI-only operation. No POST endpoint available in API.
- **FR-011**: ~~Users SHOULD be able to update column properties~~ → **NOT SUPPORTED**: Column updates are UI-only operations. No PATCH endpoint available in API.
- **FR-012**: ~~Users SHOULD be able to delete columns~~ → **REQUIRES VERIFICATION**: DELETE endpoint mentioned in documentation but not in OpenAPI spec. Mandatory task T074 will confirm support before implementation decision. If confirmed, promote to MUST and implement in Phase 3; otherwise mark NOT SUPPORTED (see research.md line 205).
- **FR-013**: System MUST support reading custom field definitions including field types, options, and constraints (API supports GET operations)
- **FR-014**: Users MUST be able to set, update, and clear custom field **values** on cards via card update operations (full CRUD supported for field values). Cards cannot be created or updated if they are missing values for custom fields marked as is_required=true. The BusinessMap API validates required fields and returns 400 VALIDATION_ERROR. The MCP server propagates validation errors with field-specific details.
- **FR-015**: Users MUST be able to create, update, and delete custom field **definitions** (including field types and options) at /customFields and /boards/{id}/customFields endpoints (API supports full CRUD - verified via OpenAPI v2 spec). Authorization is enforced by BusinessMap API via API key permissions; MCP server propagates 403 Forbidden errors. **Cascade Behavior**: Deleting a CustomField definition cascades to all associated CustomFieldValue instances across all cards. The MCP server MUST display confirmation prompt listing: (1) field name and type, (2) number of boards affected, (3) number of cards with values for this field, (4) explicit warning "This will permanently delete [N] custom field values across [M] cards." User must explicitly confirm before execution.
- **FR-016**: System MUST validate all operations per Validation Boundary defined in Glossary and return error messages per Constitution Quality Standards (lines 62-65): (1) specific failure cause, (2) transient vs permanent indicator, (3) actionable remediation steps. Remediation steps example: 'Workspace contains 12 boards. Use --force flag to delete anyway, or move boards to another workspace first.' Error messages must provide actionable next steps. MCP server translates API error responses into actionable user messages (satisfied by tasks T004-T066).
- **FR-017**: System MUST preserve referential integrity through cascade delete operations (satisfied by BusinessMap API cascade delete behavior; MCP server delegates to API per FR-021 confirmation logic)
- **FR-018**: System MUST handle concurrent modification scenarios with appropriate conflict detection (satisfied by BusinessMap API optimistic locking; MCP server propagates API conflict errors to user)
- **FR-019**: All operations MUST maintain audit trail information including timestamp and user attribution (satisfied by BusinessMap API audit trail; all mutations automatically tracked by API with user context from authentication token)
- **FR-020**: System MUST support bulk operations for efficiency when operating on multiple resources (workspace, board, card only in v1.2.0; comments, subtasks, custom fields deferred). Bulk operations execute as a batch of sequential API calls with consolidated dependency analysis and confirmation. Operations complete independently; partial success scenarios return detailed per-resource status report (successful operations remain committed, failed operations report specific errors). Bulk delete operations MUST analyze resources upfront and display single confirmation listing only resources with dependencies and their dependents; dependency-free resources included automatically in the batch execution. When bulk operations encounter rate limit errors (RL02) mid-execution, all completed operations remain committed. Remaining operations retry using exponential backoff (configured in axios-retry). The final response includes a partial success report indicating which operations completed and which were retried.
- **FR-021**: Delete operations with dependencies MUST display confirmation prompt listing all dependent resources; upon confirmation, MUST cascade delete all dependents (workspace→boards→cards; card→children). **Confirmation Mechanism**: MCP server returns structured response containing dependency tree and awaits user confirmation via subsequent tool call with `confirmed: true` parameter (stateless confirmation pattern). **Timeout**: No server-side timeout; confirmation decision delegated to MCP client/user. **Large Dependency Sets**: When >100 dependent resources exist, prompt MUST summarize with counts (e.g., "Workspace contains 250 cards across 15 boards") rather than listing all individual resources; detailed breakdown available via separate `analyze_dependencies` tool call if user requests. Simple deletions (no dependencies) and all update operations execute immediately without confirmation. For bulk delete operations: analyze all resources upfront and display single consolidated confirmation per format examples in contracts/CONFIRMATION_EXAMPLES.md listing only resources with dependencies and their dependents; dependency-free resources included automatically in the batch execution. Confirmation prompt formats and examples are defined in contracts/CONFIRMATION_EXAMPLES.md. Prompts must include resource counts, dependency information, and clear action consequences. The archive_first parameter, when set to true, archives the resource before deletion. This provides a soft-delete workflow where archived resources can be restored before permanent deletion.

### Key Entities

- **Workspace**: Container for boards, includes name, description, and organizational settings
- **Board**: Kanban board containing cards, workflows, and lanes; includes name, description, archive status
- **Card**: Primary work item with title, description, owner, assignees, custom fields, comments, outcomes, and relationships to other cards
- **Comment**: Text annotation on a card with author, timestamp, content, and optional mentions
- **Outcome**: Resolution record for a card including status, resolution type, and closure details
- **Lane**: Horizontal lane within a workflow for organizing cards by category, priority, or team
- **Workflow**: Process definition containing ordered columns representing work stages
- **Column**: Stage within a workflow with name, WIP limit, and position in the process flow
- **Custom Field**: User-defined data field with type, label, allowed values, and assignment to specific boards or card types

### Glossary

- **Cascade Delete**: Automatic deletion of dependent resources when parent is deleted. **Cascade Paths**: (1) workspace→boards→cards, (2) card→children (plus removal of parent relationships). **Execution Order**: Child relationships deleted first (Comments, Subtasks, CustomFieldValues), then parent resource deleted last to satisfy referential integrity constraints. Requires confirmation prompt listing all dependents per FR-021.
- **Dependency Analysis**: Pre-delete validation that identifies all resources that will be affected by cascade delete. Used for bulk operations to generate consolidated confirmation (see FR-020).
- **Validation Boundary**: MCP server validates input data structure (parameter types, required fields, format constraints) via Zod schemas at tool boundary before API calls. BusinessMap API validates business rules (WIP limits, workflow rules, permissions, referential integrity). MCP server responsibility: translate API error responses into actionable user messages per FR-016 Constitution Quality Standards.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can update workspace, board, and card properties within 5 seconds per operation
- **SC-002**: Users can delete unused resources (workspaces, boards, cards) without errors 100% of the time when no dependencies exist
- **SC-003**: 100% of existing client-layer operations (5 quick wins) are exposed as MCP tools within first implementation phase, plus 21 new operations (15 single-resource including 4 parent-child + 6 bulk) for a total of 26 tools
- **SC-004**: Card management achieves 87.5% CRUD coverage for confirmed operations, calculated as: (comments 4/4 + subtasks 4/4 + outcomes 1/4 + lane updates 4/4 + parent/child relationships 4/4 per FR-006a) / 24 total = 21/24 = 87.5%. Updated to reflect actual coverage including parent-child relationship operations.
- **SC-005**: Workflow and column management exposes read operations and column deletion; create/update operations require API verification and may achieve 25-50% coverage depending on API access level
- **SC-006**: Custom field management achieves 100% coverage for field **values** on cards and field **definition** management (create/update/delete definitions verified via OpenAPI v2)
- **SC-007**: Overall CRUD coverage across all resource types reaches 83%, calculated as: (Workspaces 4/4 + Boards 4/4 + Cards 4/4 + Parent-Child Relationships 4/4 + Comments 4/4 + Subtasks 4/4 + Custom Fields 6/6 + Custom Field Values 4/4 + Lanes 2/4 + Outcomes 1/4 + Workflows 2/8 + Columns 1/8) / 48 total operations = 40/48 = 83% (up from 50%). Overall 80% coverage breakdown by resource type: Workspaces 100% (4/4), Boards 100% (4/4), Cards 95% (19/20), Comments 100% (4/4), Subtasks 100% (4/4), Custom Fields 100% (6/6), Lanes 100% (4/4), Columns 0% (0/4 - read-only).
- **SC-008**: All operations complete within 2 seconds for single-resource actions and within 10 seconds for bulk operations
- **SC-009**: Error messages for failed operations clearly indicate the cause and suggest remediation actions in 100% of failure cases, including explicit messaging when API operations are not supported
- **SC-010**: Zero data loss or corruption events during update and delete operations when validated by integration tests

## Scope *(mandatory)*

### In Scope

- Exposing 5 existing client methods as MCP tools (update/delete for workspaces, boards, cards)
- Implementing create/read operations for card comments and subtasks (API supports GET and POST)
- Implementing read-only access to card outcomes (API supports GET only)
- Implementing lane assignment updates via card move operations
- Implementing column deletion operations (confirmed supported)
- Attempting workflow/column create/update operations with graceful error handling if not supported
- Implementing full CRUD for custom field **values** on cards
- Attempting custom field **definition** management with admin API verification
- Validating operations against BusinessMap API constraints
- Providing meaningful error messages for all failure scenarios, including unsupported operations
- Maintaining referential integrity during delete operations
- Supporting both single and bulk operations where applicable

### Out of Scope

- Outcome creation, update, or delete operations (not supported by BusinessMap API; read-only access only)
- Real-time synchronization or event streaming from BusinessMap
- Advanced workflow automation or business rules engine
- User permission and access control management (handled by BusinessMap)
- Historical versioning or rollback capabilities beyond BusinessMap's native features
- Cross-workspace operations or batch migrations
- Custom scripting or workflow extensions beyond standard CRUD operations
- Integration with external systems beyond BusinessMap API
- Performance optimization beyond standard API rate limiting and caching
- Operations that require admin-level API access beyond what is available to standard users

## Assumptions *(mandatory)*

1. BusinessMap API supports the CRUD operations confirmed by API research (see Clarifications section for detailed capability matrix)
2. Existing client layer implementations are correct and follow BusinessMap API patterns
3. Users have appropriate permissions in BusinessMap to perform requested operations
4. BusinessMap API enforces its own data validation and constraint checking
5. Network connectivity to BusinessMap API is reliable with standard retry mechanisms
6. BusinessMap API rate limits are sufficient for expected MCP usage patterns
7. MCP server will handle authentication token management and refresh
8. BusinessMap API supports cascade deletion of dependent resources when parent is deleted
9. Concurrent modification scenarios are handled by BusinessMap's optimistic locking or versioning
10. Custom field types and validation rules are defined by BusinessMap's schema capabilities
11. Some operations (workflow/column create/update, custom field definitions) may require admin-level API access or may be UI-only operations
12. API research findings are accurate based on available documentation; actual implementation may discover additional supported or unsupported operations

## Dependencies *(mandatory)*

- Existing BusinessMap MCP client layer implementation
- BusinessMap API v2 endpoint availability and stability
- Authentication credentials with appropriate permissions for all CRUD operations
- MCP protocol and tooling infrastructure
- Existing read operations for validation and testing
- BusinessMap API documentation for operation specifications and constraints

## Non-Functional Requirements *(optional)*

### Performance

- Single-resource operations complete within 2 seconds
- Bulk operations handle up to 50 resources within 10 seconds
- Bulk delete operations analyze all resources upfront for dependencies before confirmation, adding <500ms overhead
- API calls respect rate limits with exponential backoff retry logic (max 3 retries, intervals: 1s, 2s, 4s)
- Rate limit errors (RL02 error code) trigger automatic retry with exponential backoff
- System logs warning at 80% rate limit threshold (24/30 requests per minute). When remaining rate limit capacity falls below 80% threshold, the MCP server logs a warning to the application log (not user-visible). Monitoring systems can alert on repeated threshold warnings.
- BusinessMap API default rate limits: 30 requests/minute, 600 requests/hour

### Reliability

- Operations succeed 99.9% of the time when inputs are valid and API is available
- Failed operations provide actionable error messages with specific failure causes
- Transient failures trigger automatic retry with exponential backoff (max 3 attempts)
- Errors are classified as transient (network failures, rate limits, temporary API unavailability) or permanent (validation failures, permission denials, resource not found). Transient errors include retry guidance; permanent errors include remediation steps.

**Error Classification Table**:
| Error Type | Examples | Retry? | Client Action |
|------------|----------|--------|---------------|
| Transient | Network timeout, 429 rate limit, 503 service unavailable | Yes | Retry with exponential backoff |
| Permanent | 400 validation error, 403 forbidden, 404 not found | No | Fix request parameters or permissions |

- Critical operations log detailed diagnostic information for troubleshooting
- Bulk operations follow transaction semantics defined in FR-020 (sequential batch execution, partial success handling, retry behavior)

### Usability

- Operation signatures follow consistent patterns across all resource types
- Parameter names and types align with BusinessMap terminology and conventions
- Error messages use plain language and avoid technical jargon where possible. Error message formats follow the structure defined in contracts/*.yaml (error, message, details, timestamp, path fields).

**Error Message Examples**:
- ❌ Bad: "Invalid input"
- ✅ Good: "Board name must be between 1 and 100 characters. Received: 0 characters."

- Documentation includes examples for common use cases for each operation
- Update operations execute immediately without confirmation to minimize friction
- Delete operations only prompt for confirmation when dependencies exist; simple deletes execute immediately

### Security

- All operations authenticate using secure token-based authentication
- Sensitive data (tokens, credentials) never logged or exposed in error messages. Never log: API tokens, user passwords, full error responses containing PII. Always log: timestamp, operation name, resource ID (not content), success/failure status.
- Operations respect BusinessMap's permission model and user access controls
- Audit trail captures all mutation operations with user and timestamp information

### Context Efficiency (FUTURE ENHANCEMENT)

- MCP server responses SHOULD minimize context consumption to ≤5,000 tokens per operation
- Tool descriptions SHOULD be concise while remaining actionable
- Error messages SHOULD provide essential information without verbose stack traces
- Bulk operation results SHOULD summarize outcomes rather than listing all resource details
- **Note**: Not implemented in current release; tracked as optimization goal for future iterations to maintain effective context usage as tool count scales

### Implementation Note

Non-functional requirements are satisfied by existing infrastructure and design decisions:

- **Performance**: BusinessMap API response times + axios-retry rate limit handling (Phase 1 tasks T001-T003)
- **Reliability**: axios-retry automatic retry logic (max 3 attempts) configured in base-client.ts (Task T002)
- **Rate Limit Compliance**: Exponential backoff via axios-retry + header monitoring (Tasks T002-T003)
- **Validation**: Zod schema validation at MCP tool boundary (Tasks T004-T066)
- **Security**: Token-based authentication delegated to BusinessMap API; MCP server propagates user context
- **Idempotency**: All DELETE operations are idempotent. Deleting a non-existent resource returns 404 NOT_FOUND on first call and 404 on subsequent calls (same response).

Validation occurs through integration testing against demo API (quickstart.md validation - Task T070). No separate NFR testing phase required for MVP.
