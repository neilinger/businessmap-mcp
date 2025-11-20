# Research: Card Comments CRUD Implementation

## Overview

Research conducted to determine BusinessMap API v2 endpoints and patterns for implementing complete CRUD operations for card comments.

## API Endpoint Analysis

### Existing READ Operations (Already Implemented)

- **List Comments**: `GET /cards/{cardId}/comments`
  - Returns: `CommentListResponse` with array of `Comment` objects
  - Implementation: `src/client/modules/card-client.ts:311-314`

- **Get Single Comment**: `GET /cards/{cardId}/comments/{commentId}`
  - Returns: `CommentResponse` with single `Comment` object
  - Implementation: `src/client/modules/card-client.ts:319-322`

### Existing WRITE Operations (Implemented but Not Exposed as Tools)

- **Update Comment**: `PATCH /cards/{cardId}/comments/{commentId}`
  - Parameters: `UpdateCommentParams` (text?, attachments_to_add?)
  - Returns: `CommentResponse` with updated `Comment` object
  - Implementation: `src/client/modules/card-client.ts:327-338`
  - Status: ✅ Client implemented, ❌ Tool not registered

- **Delete Comment**: `DELETE /cards/{cardId}/comments/{commentId}`
  - Parameters: None (path params only)
  - Returns: void
  - Implementation: `src/client/modules/card-client.ts:343-346`
  - Status: ✅ Client implemented, ❌ Tool not registered

### Missing CREATE Operation

- **Create Comment**: `POST /cards/{cardId}/comments`
  - **Decision**: Endpoint inferred from RESTful patterns
  - **Rationale**:
    1. Existing pattern: `POST /cards/{cardId}/subtasks` (line 418)
    2. Microsoft Power Automate connector confirms `AddComment_V2` action exists
    3. RESTful convention: POST to collection endpoint creates new resource
  - **Required Parameters**:
    - `text` (string) - Comment content
  - **Optional Parameters**:
    - `attachments_to_add` (array) - File attachments with {file_name, link}
  - **Returns**: `CommentResponse` with new `Comment` object
  - **Status**: ❌ Not implemented

## Data Types (Already Defined)

**Location**: `src/types/card.ts`

### Comment Interface (lines 368-383)

**Last Verified**: 2025-11-20
**File Version**: commit 1eeb918 (feat: implement five-layer quality control system)
**Verification Method**: Direct file read

```typescript
export interface Comment {
  comment_id: number;
  type: string;
  text: string;
  attachments: {
    id: number;
    file_name: string;
    link: string;
  };
  created_at: string;
  last_modified: string;
  author: {
    type: string;
    value: number;
  };
}
```

### UpdateCommentParams (lines 472-478)

**Last Verified**: 2025-11-20
**File Version**: commit 1eeb918
**Verification Method**: Direct file read

```typescript
export interface UpdateCommentParams {
  text?: string;
  attachments_to_add?: Array<{
    file_name: string;
    link: string;
  }>;
}
```

### Required: CreateCommentParams
- **Decision**: Define new interface matching UpdateCommentParams structure
- **Rationale**: Microsoft connector confirms required param `text` (string), optional `attachments`

## Implementation Patterns

### Tool Registration Pattern

**Location**: `src/server/tools/card-tools.ts`

1. **Read-only tools** (lines 54-92): Registered unconditionally if enabled
2. **Write tools** (lines 94-125): Guarded by `if (!readOnlyMode)`
3. **Pattern**:
   ```typescript
   if (!readOnlyMode) {
     if (shouldRegisterTool('tool_name', enabledTools)) {
       this.registerToolName(server, clientOrFactory);
     }
   }
   ```

### Zod Schema Pattern

**Location**: `src/schemas/card-schemas.ts`

- Import base schemas from zod
- Define schema with `.object()` containing expected params
- Export schema for tool registration
- Example: `getCardCommentSchema` (line 11 import reference)

### Error Handling Pattern

**Location**: `src/server/tools/base-tool.ts`

- **Success**: `createSuccessResponse(data, message?)`
- **Error**: `createErrorResponse(error, operation)`
- **Pattern**: try/catch with descriptive operation context

## Validation Requirements

### Empty Text Validation

**Decision**: Reject empty OR whitespace-only text (Option A)

**Implementation**:
```typescript
// In create/update tool handlers
const trimmedText = text.trim();
if (!trimmedText) {
  throw new Error('Comment text cannot be empty or whitespace-only');
}
```

**Rationale**:
- Matches specification requirement FR-004a
- Prevents meaningless comments
- Consistent with typical comment system behavior
- Aligns with specification clarification: "client-side empty text validation is separate from content modification"

## Testing Strategy

**Decision**: Both unit and integration tests

**Unit Tests**:
- Tool parameter validation (empty text rejection)
- Schema validation with Zod
- Error response formatting
- Read-only mode enforcement

**Integration Tests**:
- CREATE: Post comment and verify via GET
- UPDATE: Modify existing comment, verify changes
- DELETE: Remove comment, verify 404 on subsequent GET
- Full CRUD cycle test

**Test Configuration**:
- Jest already configured (`jest.config.js`, `jest.integration.config.js`)
- Axios mock adapter available for unit tests
- Real API testing via integration tests with credentials

## Alternatives Considered

### Alternative 1: Only Expose Existing Update/Delete

**Rejected**:
- Incomplete CRUD violates Constitution Principle III (Comprehensive CRUD Coverage)
- User story P1 specifically requires CREATE functionality
- Partial implementation would require documentation workarounds

### Alternative 2: Client-Side Length Limits

**Rejected**:
- Specification clarification 2 explicitly states: "Pass through to API and handle API limit errors if they occur"
- Avoids hardcoding limits that may change
- API is source of truth for validation rules

### Alternative 3: Skip Read-Only Mode for Comment Tools

**Rejected**:
- Violates Constitution Principle II (Read-Only Mode Safety)
- All write operations MUST respect read-only mode
- Consistency with existing tool patterns required

## Dependencies

### External
- BusinessMap API v2 (requires valid API key)
- Existing axios HTTP client with retry logic

### Internal
- `src/client/modules/card-client.ts` - Add createCardComment method
- `src/types/card.ts` - Add CreateCommentParams interface
- `src/schemas/card-schemas.ts` - Add create/update/delete schemas
- `src/server/tools/card-tools.ts` - Add tool registrations

## Success Criteria Mapping

### SC-001: Create programmatically
- Implement `POST /cards/{cardId}/comments`
- Register `create_card_comment` tool
- Validate with integration test

### SC-002: Update with changes visible
- Expose existing updateCardComment via tool
- Register `update_card_comment` tool
- Verify via GET after update

### SC-003: Delete programmatically
- Expose existing deleteCardComment via tool
- Register `delete_card_comment` tool
- Verify 404 after delete

### SC-004: Operations complete within 5 seconds
- Leverage existing axios-retry configuration
- Monitor via integration tests
- No additional retry logic needed (already in place)

### SC-005: Clear error messages
- Use existing `createErrorResponse` pattern
- Include operation context in all errors
- Validate error format in tests

### SC-006: Reliable success under normal conditions
- Implement proper error handling
- Use existing retry logic
- Exclude infrastructure failures from success measurement

### SC-007: Data consistency
- CREATE returns new comment_id → verifiable via GET
- UPDATE preserves comment_id → test read-after-write
- DELETE returns not found → test read-after-delete

## Implementation Complexity Assessment

Based on existing patterns and infrastructure:

- **CREATE operation**: Moderate complexity (requires new code)
  - New client method implementation
  - Schema definition
  - Tool registration following existing pattern
  - Comprehensive unit and integration tests

- **UPDATE/DELETE tools**: Low complexity (client methods exist)
  - Schema definition only
  - Tool registration following existing pattern
  - Test coverage for existing client methods

**Note**: All phases blocked until integration tests verify endpoints work as expected

## Risks & Mitigations

### Risk 1: CREATE endpoint assumption
**Mitigation**: Add clear error handling; if 404/405, update research and notify user

### Risk 2: Attachment handling complexity
**Mitigation**: Implement text-only first (MVP), add attachments as enhancement

### Risk 3: Permission model undefined
**Mitigation**: Per specification, pass through API errors unchanged; document in tool descriptions

## Standard Error Messages

**Canonical Wording** (use exactly in all code and documentation):

| Error Scenario | Exact Message | Classification | Remediation |
|----------------|---------------|----------------|-------------|
| Empty text | `"Comment text cannot be empty or whitespace-only"` | permanent | Provide non-empty comment text with example |
| Invalid card | `"Card not found (ID: {cardId})"` | permanent | Verify card ID exists and is accessible |
| Invalid comment | `"Comment not found (ID: {commentId})"` | permanent | Verify comment ID exists |
| Permission denied | `"Insufficient permissions to {operation} comment {commentId}"` | permanent | Verify account has write access or contact admin |
| Rate limit | `"Rate limit exceeded. Retry after {seconds} seconds"` | transient | Wait specified duration and retry |
| Network error (idempotent) | `"Network connection failed after 3 retry attempts"` | transient | Check network connectivity and retry operation |
| Network error (create) | `"Network error during comment creation"` | transient | Check network and manually retry (no auto-retry) |
| API unavailable | `"BusinessMap API unavailable. Try again later"` | transient | Wait and retry; check API status |

**Note**: All errors must follow 3-part format from FR-014: error + classification + remediation

## API Documentation Sources

**Primary Documentation**:
- BusinessMap OpenAPI Spec: https://demo.kanbanize.com/openapi
- Official API Documentation: https://businessmap.io/api

**Secondary Sources**:
- Microsoft Power Automate Connector: https://learn.microsoft.com/en-us/connectors/kanbanize/
- BusinessMap Knowledge Base: https://knowledgebase.businessmap.io/
- BusinessMap REST API Article: https://knowledgebase.kanbanize.com/hc/en-us/articles/360012393692-Kanbanize-REST-API-

**Verification Status**:
- ✅ Microsoft connector verified (`AddComment_V2` exists for CREATE)
- ⚠️ UPDATE/DELETE endpoints: Codebase has implementations, testing via integration tests required
- ⚠️ Direct OpenAPI spec consultation pending

## References

- [Specification](./spec.md)
- [Data Model](./data-model.md)
- [Implementation Plan](./plan.md)
- [Project Constitution](../../.specify/memory/constitution.md)

## Decisions Log

| Decision | Rationale | Date |
|----------|-----------|------|
| CREATE endpoint: `POST /cards/{cardId}/comments` | RESTful pattern + existing subtask pattern | 2025-11-20 |
| Empty text validation: Reject whitespace-only | Matches spec FR-004a + typical comment behavior | 2025-11-20 |
| Testing: Both unit + integration | Comprehensive coverage per user request | 2025-11-20 |
| No client-side length limits | Spec clarification: delegate to API | 2025-11-20 |
| Retry only idempotent operations | Spec requirement: no CREATE retry (prevent duplicates) | 2025-11-20 |
