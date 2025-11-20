# Feature Specification: Complete CRUD for Card Comments

**Feature Branch**: `004-card-comments-crud`
**Created**: 2025-11-19
**Status**: Draft
**Input**: User description: "Issue #26: Incomplete CRUD implementation for card comments"

## Clarifications

### Session 2025-11-19

- Q: Empty comment text handling - Should the system reject, allow, or warn when creating a comment with empty text? → A: Reject empty comments with validation error (return clear error message)
- Q: Comment text length limits - Should the system enforce explicit character limits or rely on API limits? → A: Pass through to API and handle API limit errors if they occur
- Q: Network failure handling - Should the system automatically retry failed operations or return errors immediately? → A: Automatically retry idempotent operations (update, delete, read) up to 3 times with exponential backoff; create operations fail immediately on network errors to prevent duplicates
- Q: Concurrent update handling - Should the system implement conflict detection or delegate to API behavior? → A: Delegate to API behavior (use whatever BusinessMap API does for concurrency)
- Q: Special characters and formatting - Should the system sanitize/escape, validate, or pass through comment text as-is? → A: Pass through as-is without sanitization or content modification; rely on API for escaping and validation (client-side empty text validation is separate from content modification)

## User Scenarios & Testing [MANDATORY]

### User Story 1 - Add Clarifying Comment to Card (Priority: P1)

A user working with cards programmatically needs to add contextual information, documentation, or updates to a card through comments without manually opening the BusinessMap UI.

**Why this priority**: This is the most common use case - adding new information to cards as workflows progress. This forms the foundation for programmatic card documentation and enables automation of card updates with context.

**Independent Test**: Can be fully tested by creating a comment on an existing card via the MCP tool and verifying it appears in the BusinessMap UI, delivering immediate value for automated documentation workflows.

**Acceptance Scenarios**:

1. **Given** a valid card exists in BusinessMap, **When** user creates a comment with text content, **Then** the comment is added to the card and visible in BusinessMap UI
2. **Given** a user has a card ID and comment text, **When** they invoke the create comment operation, **Then** the operation returns success with the new comment ID
3. **Given** an invalid card ID is provided, **When** user attempts to create a comment, **Then** the operation fails with a clear error message indicating the card was not found
4. **Edge Case - Empty text**: **Given** empty or whitespace-only text, **When** user attempts to create a comment, **Then** the operation is rejected with error "Comment text cannot be empty or whitespace-only"
5. **Edge Case - Very long text**: **Given** comment text exceeding API limits, **When** user attempts to create a comment, **Then** the operation fails with API error message (e.g., "Comment text exceeds maximum length")
6. **Edge Case - Network failure**: **Given** network connectivity is lost during create operation, **When** the request fails, **Then** the operation returns network error immediately without retry (to prevent duplicate comments) with message indicating manual retry needed
7. **Edge Case - Operations on deleted card**: **Given** a card has been deleted, **When** user attempts to create a comment on it, **Then** API returns appropriate error indicating card not found

---

### User Story 2 - Update Existing Card Comment (Priority: P2)

A user needs to correct or enhance previously added comments programmatically, such as updating documentation as requirements change or fixing typos in automated messages.

**Why this priority**: Secondary to creation but essential for maintaining accurate information. Supports iterative documentation and correction workflows without manual intervention.

**Independent Test**: Can be tested by first creating a comment (using P1 functionality), then updating its content via the MCP tool, and verifying the updated text appears in BusinessMap UI.

**Acceptance Scenarios**:

1. **Given** a comment exists on a card, **When** user updates the comment text, **Then** the comment content is modified and the change is reflected in BusinessMap UI
2. **Given** a valid comment ID and new text, **When** user invokes the update operation, **Then** the operation succeeds and returns confirmation
3. **Given** an invalid comment ID, **When** user attempts to update, **Then** the operation fails with a clear error message indicating the comment was not found
4. **Edge Case - Empty text in update**: **Given** empty or whitespace-only text provided for update, **When** user attempts to update comment, **Then** the operation is rejected with error "Comment text cannot be empty or whitespace-only"
5. **Edge Case - Network failure with retry**: **Given** network connectivity is lost during update operation, **When** the request fails, **Then** the system automatically retries up to 3 times with exponential backoff before returning error
6. **Edge Case - Concurrent updates**: **Given** multiple users update the same comment simultaneously, **When** updates occur, **Then** system delegates to BusinessMap API's concurrency handling (no client-side conflict detection)

---

### User Story 3 - Remove Obsolete Card Comment (Priority: P3)

A user needs to remove outdated or incorrect comments from cards programmatically, such as cleaning up temporary notes or removing automated messages that are no longer relevant.

**Why this priority**: Least critical as workarounds exist (leaving comments as-is or manually deleting). However, completes the CRUD capability set and enables full programmatic comment lifecycle management.

**Independent Test**: Can be tested by creating a comment (using P1 functionality), then deleting it via the MCP tool, and verifying it no longer appears in BusinessMap UI or subsequent read operations.

**Acceptance Scenarios**:

1. **Given** a comment exists on a card, **When** user deletes the comment, **Then** the comment is removed and no longer visible in BusinessMap UI or API responses
2. **Given** a valid comment ID, **When** user invokes the delete operation, **Then** the operation succeeds and returns confirmation
3. **Given** an invalid comment ID, **When** user attempts to delete, **Then** the operation fails with a clear error message
4. **Given** a comment has been deleted, **When** user attempts to read or update it, **Then** the operation fails with appropriate "not found" error
5. **Edge Case - Network failure with retry**: **Given** network connectivity is lost during delete operation, **When** the request fails, **Then** the system automatically retries up to 3 times with exponential backoff before returning error (delete is idempotent)
6. **Edge Case - Special characters in comment**: **Given** a comment contains special characters or formatting, **When** system processes the comment, **Then** text is passed through without modification or sanitization; API handles escaping and validation

## Requirements [MANDATORY]

### Functional Requirements

- **FR-001**: System MUST provide an operation to create a new comment on a card given a valid card ID and comment text
- **FR-001a**: System MUST pass comment text to BusinessMap API without client-side sanitization or modification of special characters, relying on API to handle escaping and validation
- **FR-002**: System MUST provide an operation to update an existing comment given a valid comment ID and new text content
- **FR-003**: System MUST provide an operation to delete an existing comment given a valid comment ID
- **FR-004**: All comment operations (create, update, delete) MUST validate input parameters and return clear error messages for invalid inputs
- **FR-004a**: System MUST reject create and update operations with empty or whitespace-only comment text, returning a clear validation error
- **FR-005**: System MUST handle BusinessMap API authentication and authorization for all comment operations
- **FR-006**: System MUST return appropriate success/failure responses with relevant data (e.g., new comment ID on creation)
- **FR-007**: Create operation MUST preserve all comment metadata provided by the BusinessMap API (author, timestamp, etc.)
- **FR-008**: Update operation MUST preserve comment ID and metadata while only modifying the comment text
- **FR-009**: Delete operation MUST ensure complete removal of the comment from BusinessMap
- **FR-010**: All operations MUST maintain data consistency - created comments become immediately readable, updated comments reflect new content, deleted comments are no longer accessible
- **FR-011**: System MUST handle API errors (rate limits, connection failures, validation errors including length limits) gracefully by returning the API error messages to users
- **FR-011a**: System MUST automatically retry failed network operations for idempotent operations (read, update, delete) up to 3 times using exponential backoff before returning error to user
- **FR-011b**: System MUST NOT retry create operations to prevent duplicate comment creation; create operations MUST fail immediately on network errors
- **FR-012**: All operations MUST pass through BusinessMap API authentication and authorization; system returns any permission errors from API to user without modification
- **FR-013**: System MUST NOT log comment text content in client-side logs to protect confidential business information; only comment IDs and operation metadata may be logged
- **FR-014**: All error messages MUST follow 3-part structured format: (1) Specific failure cause with precise description, (2) Error classification as transient (retry suggested) or permanent (user action required), (3) Actionable remediation describing next steps. This format must be enforced via pre-commit test validation.

**FR-014 Error Message Examples**:
```json
// Empty text error (permanent)
{
  "error": "Comment text cannot be empty or whitespace-only",
  "classification": "permanent",
  "remediation": "Provide non-empty comment text. Example: 'Updated requirements based on feedback'"
}

// Network error for idempotent operation (transient)
{
  "error": "Network connection failed after 3 retry attempts",
  "classification": "transient",
  "remediation": "Check network connectivity and retry operation"
}

// Permission error (permanent)
{
  "error": "Insufficient permissions to modify comment 12345",
  "classification": "permanent",
  "remediation": "Verify account has write access to card comments or contact workspace administrator"
}

// Invalid card ID (permanent)
{
  "error": "Card not found (ID: 98765)",
  "classification": "permanent",
  "remediation": "Verify card ID exists and is accessible in your workspace"
}
```

### Key Entities

- **Card Comment**: A text-based annotation attached to a BusinessMap card, containing:
  - `comment_id` (number): Unique identifier assigned by API
  - `card_id` (number): Reference to parent card
  - `type` (string): Comment type classification (e.g., "comment", "system_comment")
  - `text` (string): Comment message content (1-10000 characters estimated)
  - `attachments` (array of objects): File attachments metadata with {id, file_name, link} structure (read-only)
  - `created_at` (string): Creation timestamp in ISO 8601 format
  - `last_modified` (string): Last modification timestamp in ISO 8601 format
  - `author` (object): Comment author with {type: string, value: number} structure containing user ID

## Success Criteria [MANDATORY]

### Measurable Outcomes

- **SC-001**: Users can create a comment on any accessible card programmatically without requiring manual UI interaction
- **SC-002**: Users can update the content of an existing comment programmatically with changes visible upon successful operation completion
- **SC-003**: Users can delete a comment programmatically with the comment removed from all subsequent queries
- **SC-004**: All comment operations complete within 5 seconds under normal network conditions
- **SC-005**: Error messages for failed operations clearly indicate the cause (invalid ID, permission denied, network error, etc.) enabling users to take corrective action and follow 3-part structured format defined in FR-014
- **SC-006**: Operations maintain data consistency - created comments become readable through comment retrieval, updated comments reflect new content in subsequent reads, deleted comments return "not found" errors
