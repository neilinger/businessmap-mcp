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

1. **Given** a workspace exists with name "Old Project", **When** user calls update_workspace with new name "New Project", **Then** the workspace name changes and is reflected in all subsequent queries (tests workspace-client.ts:33)
2. **Given** an empty workspace exists, **When** user calls delete_workspace, **Then** the workspace is deleted immediately without confirmation and no longer appears in workspace listings (tests workspace-client.ts:48)
3. **Given** a board exists with description "Old Description", **When** user calls update_board with new description "New Description", **Then** the board description changes and is reflected in board queries (tests board-client.ts:64)
4. **Given** an unused board exists with no cards, **When** user calls delete_board, **Then** the board is deleted immediately without confirmation and no longer appears in board listings (tests board-client.ts:73)
5. **Given** a completed card exists with no children, **When** user calls delete_card, **Then** the card is deleted immediately without confirmation and is removed from all queries (tests card-client.ts:167)
6. **Given** a workspace contains 3 boards, **When** user calls delete_workspace, **Then** system displays confirmation listing 3 dependent boards, and upon confirmation cascades delete to workspace, all boards, and their cards
7. **Given** 5 workspaces exist (2 containing boards, 3 empty), **When** user calls bulk_delete_workspaces with all 5 IDs, **Then** system analyzes dependencies upfront and displays single consolidated confirmation listing only the 2 workspaces with boards and their dependents, **And** upon confirmation deletes all 5 workspaces in single transaction (dependency-free workspaces included automatically without separate confirmation)

---

### User Story 2 - Complete Card Management (Priority: P2)

Users can perform full CRUD operations on card comments and subtasks, view card outcomes, and update lane assignments to track work progress and collaborate effectively.

**Why this priority**: Cards are the primary work item in BusinessMap. Research verified full CRUD support for comments and subtasks (not just create/read), achieving 95% card management coverage. Outcomes remain read-only, and lane updates are supported via card move operations.

**API Capabilities**: Comments (full CRUD), Outcomes (read-only), Subtasks (full CRUD), Lane updates (supported via card move operation).

**Independent Test**: Can be tested by creating a card, adding comments, adding subtasks, viewing outcomes, and moving between lanes. Delivers enhanced work item collaboration capabilities independently of other features.

**Acceptance Scenarios**:

1. **Given** a card exists, **When** user adds a comment with text and mentions, **Then** the comment appears in the card's comment thread with proper attribution
2. **Given** a card exists, **When** user adds a subtask with description and owner, **Then** the subtask appears in the card's subtask list and can be tracked separately
3. **Given** a card has outcomes, **When** user retrieves card outcomes, **Then** the system displays all outcome records with resolution status and details
4. **Given** a card is in lane A, **When** user updates the lane to B, **Then** the card moves to lane B and reflects the new position

---

### User Story 3 - Workflow and Column Configuration (Priority: P3)

Users can view workflows and columns, with potential support for creating and modifying them to customize board structures and match their team's specific process requirements.

**Why this priority**: Workflows and columns provide structural flexibility but are less frequently modified than cards. Currently read-only with 25% coverage. Column deletion is confirmed; other write operations require API access verification (may be admin-only or UI-only operations).

**API Status**: Read operations confirmed. Create/update operations for workflows and columns require verification with actual API access. Column deletion confirmed in documentation.

**Independent Test**: Can be tested by attempting workflow/column creation and modification operations. If supported, validates board customization capabilities. If not supported by API, maintains current read-only functionality.

**Acceptance Scenarios** *(subject to API capability verification)*:

1. **Given** a board exists, **When** user attempts to create a workflow with name "Development Process", **Then** the system either creates the workflow (if API supports it) or returns clear error indicating operation not supported
2. **Given** a workflow exists, **When** user attempts to add a column "Code Review" with WIP limit 3, **Then** the system either creates the column (if API supports it) or returns clear error indicating operation not supported
3. **Given** a column exists with no cards, **When** user deletes it, **Then** the column is removed from the workflow (confirmed supported by API)
4. **Given** workflow/column write operations are supported, **When** user updates column WIP limit, **Then** the changes are reflected in the board configuration

---

### User Story 4 - Custom Field Management (Priority: P4)

Users can read custom field definitions and manage custom field **values** on cards to capture domain-specific data within BusinessMap's configured data model.

**Why this priority**: Custom field values on cards are fully supported via card update operations, enabling domain-specific data tracking. Custom field **definitions** (creating new field types, modifying field schemas) may be admin-only or UI-only operations. Currently 25% coverage, focusing on field value management will provide practical extensibility.

**API Capabilities**: Custom field **values** on cards support full CRUD via card operations. Custom field **definitions** (types, schemas, options) require admin API access verification.

**Independent Test**: Can be tested by reading field definitions, then setting/updating/clearing custom field values on cards. Validates data capture capabilities within existing field definitions.

**Acceptance Scenarios**:

1. **Given** custom fields are defined on a board, **When** user retrieves custom field definitions, **Then** the system returns all field schemas with types, options, and constraints
2. **Given** a card exists with custom fields, **When** user sets a custom field value (e.g., "Customer Priority" = "High"), **Then** the field value is saved and appears in subsequent card queries
3. **Given** a card has custom field values, **When** user updates a field value (e.g., change priority from "High" to "Medium"), **Then** the updated value is reflected on the card
4. **Given** custom field definition operations are supported, **When** admin user attempts to create/modify field schemas, **Then** the system either performs the operation (if API supports it) or returns clear error indicating admin-only access required

---

### Edge Cases

- **Deleting workspace with boards**: System displays confirmation prompt listing all dependent boards; upon confirmation, cascades delete to all contained boards and their cards. Empty workspaces delete immediately without confirmation.
- **Deleting card with children/parents**: System displays confirmation prompt listing all dependent cards; upon confirmation, cascades delete to all child cards and removes parent relationships. Cards without dependencies delete immediately without confirmation.
- **Updating board with active viewers**: System allows update; concurrent viewers see changes on next refresh following BusinessMap's eventual consistency model
- **Creating workflow with duplicate column names**: System validates uniqueness within workflow scope and returns clear error message if duplicate detected
- **Updating custom field type with existing data**: System validates data compatibility; blocks incompatible changes (e.g., text to number with non-numeric values) with clear error message
- **Moving card to lane at WIP limit**: System respects WIP limit enforcement configured in BusinessMap; blocks move if limit reached and returns actionable error message
- **Deleting comment referenced elsewhere**: Comments are self-contained entities; deletion removes comment regardless of external references
- **Bulk delete with mixed dependencies**: System analyzes all target resources upfront; displays single confirmation listing only resources with dependencies and their cascade impact; dependency-free resources execute automatically in same transaction without separate confirmation

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST expose existing update operations for workspaces, boards, and cards (workspace-client.ts:33, board-client.ts:64, card-client.ts methods)
- **FR-002**: System MUST expose existing delete operations for workspaces, boards, and cards (workspace-client.ts:48, board-client.ts:73, card-client.ts:167)
- **FR-003**: Users MUST be able to perform full CRUD operations on card comments including text content, timestamps, and author attribution (API supports GET, POST, PATCH, DELETE - verified via OpenAPI v2 spec)
- **FR-004**: Users MUST be able to retrieve card outcomes including resolution status and details (API supports GET only; outcome creation/modification not available via API)
- **FR-005**: System MUST support full CRUD operations on card subtasks with description, owner, deadline, and completion status (API supports GET, POST, PATCH, DELETE - verified via OpenAPI v2 spec)
- **FR-006**: System MUST support updating card lane assignments to move cards between swimlanes (supported via existing card move operation)
- **FR-007**: ~~Users SHOULD be able to create workflows~~ → **NOT SUPPORTED**: Workflow creation is a UI-only operation per OpenAPI v2 verification. Read-only access available via GET endpoints for cycle time columns.
- **FR-008**: ~~Users SHOULD be able to update workflow properties~~ → **NOT SUPPORTED**: Workflow updates are UI-only operations. No PATCH endpoint available in API.
- **FR-009**: ~~Users SHOULD be able to delete workflows~~ → **NOT SUPPORTED**: Workflow deletion is a UI-only operation. No DELETE endpoint available in API.
- **FR-010**: ~~Users SHOULD be able to create columns~~ → **NOT SUPPORTED**: Column creation is a UI-only operation. No POST endpoint available in API.
- **FR-011**: ~~Users SHOULD be able to update column properties~~ → **NOT SUPPORTED**: Column updates are UI-only operations. No PATCH endpoint available in API.
- **FR-012**: ~~Users MUST be able to delete columns~~ → **REQUIRES TESTING**: DELETE endpoint mentioned in documentation but not in OpenAPI spec. Research recommends testing against demo API to confirm availability (see research.md line 205).
- **FR-013**: System MUST support reading custom field definitions including field types, options, and constraints (API supports GET operations)
- **FR-014**: Users MUST be able to set, update, and clear custom field **values** on cards via card update operations (full CRUD supported for field values)
- **FR-015**: Users MUST be able to create, update, and delete custom field **definitions** (field types, schemas, options) at /customFields and /boards/{id}/customFields endpoints (API supports full CRUD with no admin restrictions detected - verified via OpenAPI v2 spec)
- **FR-016**: System MUST validate all operations against BusinessMap API constraints and return meaningful error messages (satisfied by Zod schema validation at MCP tool boundary per tasks T004-T066; BusinessMap API provides constraint validation)
- **FR-017**: System MUST preserve referential integrity through cascade delete operations (satisfied by BusinessMap API cascade delete behavior; MCP server delegates to API per FR-021 confirmation logic)
- **FR-018**: System MUST handle concurrent modification scenarios with appropriate conflict detection (satisfied by BusinessMap API optimistic locking; MCP server propagates API conflict errors to user)
- **FR-019**: All operations MUST maintain audit trail information including timestamp and user attribution (satisfied by BusinessMap API audit trail; all mutations automatically tracked by API with user context from authentication token)
- **FR-020**: System MUST support bulk operations for efficiency when operating on multiple resources. Bulk delete operations MUST analyze resources upfront and display single confirmation listing only resources with dependencies and their dependents; dependency-free resources included automatically in the same transaction.
- **FR-021**: Delete operations with dependencies MUST display confirmation prompt listing all dependent resources; upon confirmation, MUST cascade delete all dependents (workspace→boards→cards; card→children). Simple deletions (no dependencies) and all update operations execute immediately without confirmation. For bulk delete operations: analyze all resources upfront and display single consolidated confirmation listing only resources with dependencies and their dependents; dependency-free resources included automatically in the same transaction.

### Key Entities

- **Workspace**: Container for boards, includes name, description, and organizational settings
- **Board**: Kanban board containing cards, workflows, and lanes; includes name, description, archive status
- **Card**: Primary work item with title, description, owner, assignees, custom fields, comments, outcomes, and relationships to other cards
- **Comment**: Text annotation on a card with author, timestamp, content, and optional mentions
- **Outcome**: Resolution record for a card including status, resolution type, and closure details
- **Lane**: Horizontal swimlane within a workflow for organizing cards by category, priority, or team
- **Workflow**: Process definition containing ordered columns representing work stages
- **Column**: Stage within a workflow with name, WIP limit, and position in the process flow
- **Custom Field**: User-defined data field with type, label, allowed values, and assignment to specific boards or card types

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can update workspace, board, and card properties within 5 seconds per operation
- **SC-002**: Users can delete unused resources (workspaces, boards, cards) without errors 100% of the time when no dependencies exist
- **SC-003**: 100% of existing client-layer operations (5 quick wins) are exposed as MCP tools within first implementation phase
- **SC-004**: Card management achieves approximately 95% CRUD coverage for confirmed operations (comments: full CRUD, subtasks: full CRUD, outcomes: read-only, lane updates: full support)
- **SC-005**: Workflow and column management exposes read operations and column deletion; create/update operations require API verification and may achieve 25-50% coverage depending on API access level
- **SC-006**: Custom field management achieves 100% coverage for field **values** on cards; field **definition** management (create/update/delete schemas) requires admin API verification
- **SC-007**: Overall CRUD coverage across all resource types reaches approximately 80% based on confirmed API capabilities (up from current 50%)
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
- System logs warning at 80% rate limit threshold (24/30 requests per minute)
- BusinessMap API default rate limits: 30 requests/minute, 600 requests/hour
- Caching strategies minimize redundant API calls for frequently accessed data

### Reliability

- Operations succeed 99.9% of the time when inputs are valid and API is available
- Failed operations provide actionable error messages with specific failure causes
- Transient failures trigger automatic retry with exponential backoff (max 3 attempts)
- Critical operations log detailed diagnostic information for troubleshooting
- Bulk operations execute as single transaction; partial success scenarios provide detailed success/failure report per resource

### Usability

- Operation signatures follow consistent patterns across all resource types
- Parameter names and types align with BusinessMap terminology and conventions
- Error messages use plain language and avoid technical jargon where possible
- Documentation includes examples for common use cases for each operation
- Update operations execute immediately without confirmation to minimize friction
- Delete operations only prompt for confirmation when dependencies exist; simple deletes execute immediately

### Security

- All operations authenticate using secure token-based authentication
- Sensitive data (tokens, credentials) never logged or exposed in error messages
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

Validation occurs through integration testing against demo API (quickstart.md validation - Task T070). No separate NFR testing phase required for MVP.
