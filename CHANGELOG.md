# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.7.0] - 2025-10-29

### Fixed

#### Performance Optimization: Eliminate Read-After-Delete (Issue #7)

**Problem**: Bulk delete operations performed unnecessary read-after-delete API calls, causing:
- 100% 404 error rate attempting to read deleted resources
- 38-77% API call overhead on bulk operations
- Performance degradation on large bulk deletes

**Solution**: Pre-extract resource names during dependency analysis phase
- Added `nameMap` to `BulkDependencyAnalysis` for cached name lookups
- Removed read-after-delete pattern from `bulk_delete_boards` and `bulk_delete_cards`
- Implemented defensive fallback pattern for missing names

**Impact**:
- 38% API call reduction for small operations (5 boards: 26→16 calls)
- 33% API call reduction for large operations (50 boards: 300→200 calls)
- 100% elimination of post-delete 404 errors
- Zero breaking changes (backward compatible)

**Files Changed**:
- `src/services/dependency-analyzer.ts` - Extract names into nameMap
- `src/server/tools/board-tools.ts` - Use nameMap instead of re-fetch
- `src/server/tools/card-tools.ts` - Use nameMap instead of re-fetch
- `src/services/confirmation-builder.ts` - Defensive fallbacks for missing names

**Test Coverage**:
- 31 unit tests for name extraction and fallback handling
- 7 integration tests validating API call reduction
- 100% regression-free (38/38 tests passing)

See `docs/ISSUE-7-FIX-SUMMARY.md` for detailed analysis.

## [1.6.0] - 2025-10-25

### Added

#### Complete CRUD Operations (Feature 001)

**Comments Management**
- `update_card_comment` - Update existing card comment text and formatting
- `delete_card_comment` - Remove comment from card

**Subtasks Management**
- `update_card_subtask` - Update subtask description, owner, or status
- `delete_card_subtask` - Remove subtask from card

**Custom Field Definitions (6 new tools)**
- `list_custom_fields` - Get all custom field definitions across system
- `list_board_custom_fields` - Get custom field definitions for specific board
- `get_custom_field` - Enhanced details for specific custom field by ID
- `create_custom_field` - Define new custom field with type and options
- `update_custom_field` - Modify custom field label, type, or constraints
- `delete_custom_field` - Remove custom field definition with cascade to card values

**Workspace Management (Quick Wins)**
- `update_workspace` - Modify workspace name or description
- `delete_workspace` - Remove workspace with cascade confirmation if contains boards

**Board Management (Quick Wins)**
- `update_board` - Modify board name, description, or settings
- `delete_board` - Remove board with cascade confirmation if contains cards

**Card Management (Quick Wins)**
- `delete_card` - Remove card with cascade confirmation for children/comments/subtasks

**Bulk Operations (6 new tools)**
- `bulk_delete_workspaces` - Delete multiple workspaces with consolidated confirmation
- `bulk_update_workspaces` - Update multiple workspaces in single transaction
- `bulk_delete_boards` - Delete multiple boards with consolidated confirmation
- `bulk_update_boards` - Update multiple boards in single transaction
- `bulk_delete_cards` - Delete multiple cards with consolidated confirmation
- `bulk_update_cards` - Update multiple cards in single transaction

**Infrastructure Improvements**
- Dependency analysis service for cascade delete operations
- Consolidated confirmation builder with hierarchical dependency tree display
- Enhanced error messages with FR-016 compliance:
  - Specific failure cause identification
  - Transient vs permanent error classification
  - Actionable remediation steps for all error scenarios
- Rate limit handling with automatic retry logic and exponential backoff
- Read-only mode support for all new write operations

### Changed

- CRUD coverage increased from ~50% to ~80% (+30 percentage points)
- Total tool count increased from 43 to 65 tools (+22 new tools)
- Delete operations now include cascade dependency analysis and confirmation prompts
- Bulk operations support up to 50 resources per request with detailed per-resource status reporting
- Custom Field Management expanded from 1 tool to 7 tools (full CRUD support)
- Tool categories expanded from 7 to 9 with new Bulk Operations category

### Technical Details

- All new tools respect `BUSINESSMAP_READ_ONLY_MODE` environment variable
- Cascade delete confirmations follow formats defined in `contracts/CONFIRMATION_EXAMPLES.md`
- Error handling includes transient/permanent classification per FR-016 specification
- Custom field deletion includes pre-delete dependency analysis showing affected boards and cards
- Bulk operations provide consolidated confirmations grouping resources by dependency status
- Rate limit detection via HTTP 429 responses and `X-RateLimit-*` headers

### Performance

- Bulk operations optimize API usage by batching requests
- Dependency analysis performed once upfront for bulk operations
- P95 latency < 5s for single-resource operations
- P95 latency < 10s for bulk operations (up to 50 resources)

## [1.1.0] - Previous Release

(Previous release notes - if they exist, preserve them here)

## [1.0.0] - Initial Release

(Initial release notes - if they exist, preserve them here)

---

## Release Links

- [1.2.0](https://github.com/edicarloslds/businessmap-mcp/releases/tag/v1.2.0) - Complete CRUD Operations
- [NPM Package](https://www.npmjs.com/package/@edicarlos.lds/businessmap-mcp)
- [GitHub Repository](https://github.com/edicarloslds/businessmap-mcp)
