# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

#### Claude Code Skills (Issue #10)

**Interactive API Guidance Skills**
- `businessmap-consultant` - Interactive workflow guidance for board setup, card migrations, and bulk operations
- `businessmap-troubleshooting` - Error diagnosis and resolution for API errors (403, 404, 429, BS05)
- `businessmap-best-practices` - Performance optimization, rate limiting strategies, and production patterns

These skills provide comprehensive, context-aware guidance for BusinessMap API usage, automatically invoking when users ask relevant questions.

### Changed

#### Token Optimization (Issue #10)

**MCP Tool Description Refactoring**
- Reduced all 58 tool descriptions from verbose (avg 9.1 words) to concise (avg 2.5 words)
- **Token savings**: ~385 tokens per MCP connection (~73% reduction)
- **Improved efficiency**: Moved detailed usage patterns from tool descriptions to Claude Code skills
- Maintained full functionality and clarity while optimizing for token usage

**Before**: "Get a list of boards with optional filters" (8 words)
**After**: "List boards" (2 words) ✅

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
