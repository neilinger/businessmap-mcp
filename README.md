# BusinessMap MCP Server

[![npm version](https://img.shields.io/npm/v/@neilinger/businessmap-mcp.svg)](https://www.npmjs.com/package/@neilinger/businessmap-mcp)
[![GitHub release](https://img.shields.io/github/v/release/neilinger/businessmap-mcp)](https://github.com/neilinger/businessmap-mcp/releases)
[![npm downloads](https://img.shields.io/npm/dm/@neilinger/businessmap-mcp)](https://www.npmjs.com/package/@neilinger/businessmap-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![MCP](https://img.shields.io/badge/Model%20Context%20Protocol-000000?logo=anthropic&logoColor=white)](https://modelcontextprotocol.io/)

Model Context Protocol server for BusinessMap (Kanbanize) integration. Provides comprehensive access to BusinessMap's project management features including workspaces, boards, cards, subtasks, parent-child relationships, outcomes, custom fields, and more.

## Installation

### Via NPX (Recommended)

You can run the BusinessMap MCP server directly using npx without installing it globally:

```bash
npx @neilinger/businessmap-mcp
```

### Global Installation

```bash
npm install -g @neilinger/businessmap-mcp
```

## Configuration

### Environment Variables

The server requires the following environment variables:

- `BUSINESSMAP_API_TOKEN`: Your BusinessMap API token
- `BUSINESSMAP_API_URL`: Your BusinessMap API URL (e.g., `https://your-account.kanbanize.com/api/v2`)
- `BUSINESSMAP_READ_ONLY_MODE`: Set to `"true"` for read-only mode, `"false"` to allow modifications (optional, defaults to `"false"`)
- `BUSINESSMAP_DEFAULT_WORKSPACE_ID`: Set the BusinessMap workspace ID (optional)
- `BUSINESSMAP_TOOL_PROFILE`: Token optimization profile for tool registration (optional, defaults to `"standard"`)

#### Tool Profile Configuration

The `BUSINESSMAP_TOOL_PROFILE` environment variable controls which tools are registered with the MCP server, allowing you to optimize token consumption based on your workflow needs.

**Available Profiles:**

| Profile    | Tools | Token Count | Use Case                                                                                              |
| ---------- | ----- | ----------- | ----------------------------------------------------------------------------------------------------- |
| `minimal`  | 10    | ~14,276     | Basic card and board operations only. Ideal for simple workflows or token-constrained environments.   |
| `standard` | 24    | ~18,500     | Most common workflows including cards, boards, workspaces, and users. **Default if not specified.**   |
| `full`     | 59    | ~31,663     | All available tools including advanced features (custom fields, subtasks, outcomes, bulk operations). |

**Profile Contents:**

- **Minimal** (10 tools): `list_boards`, `list_cards`, `get_card`, `get_workspace`, `create_card`, `update_card`, `move_card`, `search_board`, `health_check`
- **Standard** (24 tools): Minimal + workspace management, board creation/updates/structure, card comments, card parents/children, custom field viewing, users, system tools
- **Full** (59 tools): Standard + advanced card features (subtasks, outcomes, history, linked cards), custom field management, workflow analysis, bulk operations

**Note:** Ghost tools (`list_instances`, `get_instance_info`, `get_board`) were defined but never properly registered. Tool counts reflect actual registered tools in `src/config/tool-profiles.ts`.

**Example Usage:**

```json
{
  "mcpServers": {
    "Businessmap": {
      "command": "npx",
      "args": ["-y", "@neilinger/businessmap-mcp"],
      "env": {
        "BUSINESSMAP_API_TOKEN": "your_token_here",
        "BUSINESSMAP_API_URL": "https://your-account.kanbanize.com/api/v2",
        "BUSINESSMAP_TOOL_PROFILE": "minimal"
      }
    }
  }
}
```

**Token Optimization Benefits:**

- **Reduced Context Size**: Lower token counts mean more room for conversation history and responses
- **Faster Tool Discovery**: Fewer tools make it easier for the AI to select appropriate actions
- **Cost Efficiency**: Lower token usage per request reduces API costs (especially important for Claude Desktop and Cursor)
- **Progressive Enhancement**: Start with `minimal`, upgrade to `standard` or `full` as needed

**Choosing a Profile:**

- Use **minimal** if you primarily work with cards and boards, or in token-constrained environments
- Use **standard** (default) for typical project management workflows covering 80% of common use cases
- Use **full** when you need advanced features like custom fields, bulk operations, or detailed card relationships

#### Claude Desktop

Add the following configuration to your `claude_desktop_config.json` file:

```json
{
  "mcpServers": {
    "Businessmap": {
      "command": "npx",
      "args": ["-y", "@neilinger/businessmap-mcp"],
      "env": {
        "BUSINESSMAP_API_TOKEN": "your_token_here",
        "BUSINESSMAP_API_URL": "https://your-account.kanbanize.com/api/v2",
        "BUSINESSMAP_READ_ONLY_MODE": "false", // optional, defaults to false
        "BUSINESSMAP_DEFAULT_WORKSPACE_ID": "1", // optional
        "BUSINESSMAP_TOOL_PROFILE": "standard" // optional, defaults to standard (minimal|standard|full)
      }
    }
  }
}
```

#### Cursor

To use the BusinessMap MCP server with Cursor, add the following configuration to your Cursor settings:

1. Open Cursor Settings (Cmd/Ctrl + ,)
2. Click on "MCP & Integrations" and then "Add Custom MCP"
3. Add a new MCP server with the following configuration:

```json
{
  "name": "BusinessMap",
  "command": "npx",
  "args": ["-y", "@neilinger/businessmap-mcp"],
  "env": {
    "BUSINESSMAP_API_TOKEN": "your_token_here",
    "BUSINESSMAP_API_URL": "https://your-account.kanbanize.com/api/v2",
    "BUSINESSMAP_READ_ONLY_MODE": "false",
    "BUSINESSMAP_DEFAULT_WORKSPACE_ID": "1",
    "BUSINESSMAP_TOOL_PROFILE": "standard"
  }
}
```

#### VSCode

To use the BusinessMap MCP server with VSCode, add the following configuration:

1. Edit or create `.vscode/mcp.json` and add the MCP extension settings:

```json
{
  "servers": {
    "businessmap": {
      "command": "npx",
      "args": ["-y", "@neilinger/businessmap-mcp"],
      "env": {
        "BUSINESSMAP_API_TOKEN": "your_token_here",
        "BUSINESSMAP_API_URL": "https://your-account.kanbanize.com/api/v2",
        "BUSINESSMAP_READ_ONLY_MODE": "false",
        "BUSINESSMAP_DEFAULT_WORKSPACE_ID": "1",
        "BUSINESSMAP_TOOL_PROFILE": "standard"
      }
    }
  }
}
```

#### Other MCP Clients

For other MCP clients, use the appropriate configuration format for your client, ensuring you specify:

- Command: `npx @neilinger/businessmap-mcp` (or `businessmap-mcp` if globally installed)
- Environment variables: `BUSINESSMAP_API_TOKEN`, `BUSINESSMAP_API_URL`, and optionally `BUSINESSMAP_READ_ONLY_MODE`, `BUSINESSMAP_DEFAULT_WORKSPACE_ID`, `BUSINESSMAP_TOOL_PROFILE`

### Manual Setup

1. Clone this repository:

   ```bash
   git clone https://github.com/neilinger/businessmap-mcp.git
   cd businessmap-mcp
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file with your BusinessMap credentials (for development/testing):

   ```env
   BUSINESSMAP_API_TOKEN=your_token_here
   BUSINESSMAP_API_URL=https://your-account.kanbanize.com/api/v2
   BUSINESSMAP_READ_ONLY_MODE=false
   BUSINESSMAP_DEFAULT_WORKSPACE_ID=1
   BUSINESSMAP_TOOL_PROFILE=standard
   ```

   > **Note**: When using as an MCP server with Claude Desktop, you don't need a `.env` file. Configure the environment variables directly in your MCP client configuration instead.

4. Build the project:

   ```bash
   npm run build
   ```

5. Start the server:

   ```bash
   npm start
   ```

## Quality Control System

This project implements a **five-layer defense-in-depth quality control architecture** designed to ensure code quality, prevent regressions, and maintain security throughout the development lifecycle.

### Five-Layer Architecture

The quality control system operates as a cascading defense mechanism, where each layer provides increasingly thorough validation:

```text
┌─────────────────────────────────────────────────────────────────┐
│ Layer 1: Branch Protection                                      │
│ ├─ Blocks direct commits to main branch                        │
│ └─ Requires all checks to pass before merge                    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Layer 2: Pre-commit Hooks (< 2s)                               │
│ ├─ ESLint: Code quality and style enforcement                  │
│ ├─ Prettier: Automatic code formatting                         │
│ └─ TypeScript: Type checking and compilation                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Layer 3: Commit Message Validation                             │
│ ├─ Conventional Commits: Semantic versioning support           │
│ └─ Commitlint: Message format enforcement                      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Layer 4: Pre-push Hooks (30-90s)                               │
│ ├─ Unit Tests: Fast component validation                       │
│ └─ Integration Tests (REAL mode): Live API validation          │
│    └─ Requires BUSINESSMAP_API_TOKEN credentials               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Layer 5: CI Enforcement                                         │
│ ├─ Hook Bypass Detection: Catches --no-verify attempts         │
│ ├─ Pre-commit Validation: Re-runs Layer 2 checks               │
│ └─ Integration Tests (MOCK mode): Schema validation            │
│    └─ No credentials required                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Layer Details

#### Layer 1: Branch Protection

**Purpose**: Prevent unauthorized direct commits to protected branches

- Blocks direct pushes to `main` branch
- Requires status checks to pass before merge:
  - `CI / Build and Test` - Core compilation and unit tests
  - `CI / Pre-commit Validation` - Detects pre-commit hook bypasses
  - `CI / Integration Tests (Mock)` - Detects pre-push hook bypasses
- Enforced by GitHub branch protection rules
- **Maintenance**: Run `bash scripts/setup-branch-protection.sh` periodically to verify configuration

#### Layer 2: Pre-commit Hooks (< 2s)

**Purpose**: Fast feedback on code quality before commit creation

Implemented via Husky + lint-staged:

- **ESLint**: Enforces code quality rules and catches common errors
- **Prettier**: Automatically formats code to project standards
- **TypeScript**: Validates types and catches compilation errors

Performance target: Complete in under 2 seconds for rapid iteration.

#### Layer 3: Commit Message Validation

**Purpose**: Ensure consistent commit messages for semantic versioning

- **Commitlint**: Enforces Conventional Commits format (`feat:`, `fix:`, `docs:`, etc.)
- **Semantic Release**: Automatically determines version bumps from commit messages
- **Format**: `type(scope): description`
  - `feat`: New features (minor version bump)
  - `fix`: Bug fixes (patch version bump)
  - `BREAKING CHANGE`: Breaking changes (major version bump)

#### Layer 4: Pre-push Hooks (30-90s)

**Purpose**: Thorough validation before code reaches remote repository

- **Unit Tests**: Fast component-level validation
- **Integration Tests (REAL mode)**: Live API validation with actual BusinessMap credentials
  - Requires `BUSINESSMAP_API_TOKEN` environment variable
  - Tests full CRUD workflows against real API
  - Performance: 30-90 seconds for comprehensive validation

#### Layer 5: CI Enforcement

**Purpose**: Detect hook bypasses and provide final validation gate

Catches developers who use `git commit --no-verify` or `git push --no-verify`:

| Bypass Attempt           | Caught By                | CI Job                          |
| ------------------------ | ------------------------ | ------------------------------- |
| `git commit --no-verify` | Pre-commit Validation    | `CI / Pre-commit Validation`    |
| `git push --no-verify`   | Integration Tests (Mock) | `CI / Integration Tests (Mock)` |

**CI runs in MOCK mode** (no credentials required):

- Schema and structure validation only
- No actual API calls to BusinessMap
- Fast execution (< 1 minute)
- Prevents credential exposure in CI environment

### Hook Bypass Detection (T059)

The system detects and blocks two common bypass attempts:

**1. Pre-commit Hook Bypass**

```bash
git commit --no-verify  # Skips Layer 2 + Layer 3
```

**Detection**: `CI / Pre-commit Validation` job re-runs ESLint, Prettier, TypeScript, and Commitlint
**Outcome**: PR merge blocked if violations found

**2. Pre-push Hook Bypass**

```bash
git push --no-verify  # Skips Layer 4
```

**Detection**: `CI / Integration Tests (Mock)` job runs schema validation
**Outcome**: PR merge blocked if integration test structure invalid

### Dual-Mode Testing (T060)

Integration tests support two operational modes:

| Mode     | Environment         | Credentials                        | API Calls             | Performance | Use Case                         |
| -------- | ------------------- | ---------------------------------- | --------------------- | ----------- | -------------------------------- |
| **REAL** | Local (pre-push)    | Required (`BUSINESSMAP_API_TOKEN`) | Live API validation   | 30-90s      | Developer validation before push |
| **MOCK** | CI (GitHub Actions) | Not required                       | Schema/structure only | < 1min      | Hook bypass detection            |

**Security**: Production credentials never exposed in CI environment. MOCK mode provides structural validation without requiring sensitive tokens.

**Configuration**:

```bash
# Local .env (REAL mode)
BUSINESSMAP_API_TOKEN=your_token_here
BUSINESSMAP_API_URL=https://your-account.kanbanize.com/api/v2

# CI environment (MOCK mode)
# No credentials configured - tests run in mock mode automatically
```

### Setup and Maintenance

#### Initial Setup

The quality control system is automatically configured during project setup:

```bash
npm install  # Installs Husky, commitlint, lint-staged
```

Husky git hooks are installed automatically via the `prepare` script.

#### Branch Protection Setup

Configure GitHub branch protection rules:

```bash
bash scripts/setup-branch-protection.sh
```

This script requires a GitHub personal access token with `repo` scope. Follow the interactive prompts to configure branch protection.

#### Periodic Maintenance

**Branch Protection Verification** (Monthly):

```bash
bash scripts/setup-branch-protection.sh
```

Verifies that branch protection rules remain correctly configured.

**NPM Token Rotation** (Every 90 days):

1. Generate new NPM automation token
2. Update `NPM_TOKEN` secret in GitHub repository settings
3. See [docs/ONBOARDING.md](docs/ONBOARDING.md) for detailed instructions

### Workflow Example

```bash
# 1. Developer makes changes
git add src/index.ts

# 2. Attempts to commit
git commit -m "feat: add new feature"
# → Layer 2: Pre-commit hooks run (ESLint, Prettier, TypeScript)
# → Layer 3: Commitlint validates message format
# ✓ Commit created if all checks pass

# 3. Attempts to push
git push origin feature-branch
# → Layer 4: Pre-push hooks run (tests + integration tests with REAL API)
# ✓ Push succeeds if all tests pass

# 4. Creates pull request
# → Layer 1: Branch protection requires status checks
# → Layer 5: CI runs all validations (including bypass detection)
# ✓ PR can be merged if all CI checks pass
```

### Troubleshooting

**Pre-commit hooks not running?**

```bash
npm run prepare  # Reinstall Husky hooks
```

**Integration tests failing locally?**

```bash
# Verify credentials are configured
echo $BUSINESSMAP_API_TOKEN
# Should output your API token

# Run tests manually to see detailed output
npm run test:integration
```

**CI integration tests failing?**

- CI runs in MOCK mode - verify test structure is valid
- Check that schema validation logic is correct
- MOCK mode failures indicate structural issues, not credential problems

### Documentation

For comprehensive implementation details, see:

- **[docs/ONBOARDING.md](docs/ONBOARDING.md)**: Complete setup guide and maintenance procedures
- **[docs/specs/T058-T060-five-layer-quality-control.md](docs/specs/T058-T060-five-layer-quality-control.md)**: Technical specification
- **[.husky/](.husky/)**: Git hook implementations
- **[scripts/hooks/](scripts/hooks/)**: Hook execution scripts

## Claude Code Skills

For Claude Code users, this project includes specialized skills for interactive API guidance and best practices.

### Installation

Copy the skills to your Claude Code skills directory:

```bash
cp -r skills/businessmap-* ~/.claude/skills/
```

Or for project-specific skills, copy to `.claude/skills/` in your project root.

### BusinessMap API Consultant

**When to use**: Ask "How do I [work with boards/cards/workspaces]?" or any BusinessMap workflow questions.

The consultant skill provides:

- Interactive workflow guidance for board setup, card migrations, bulk operations
- Tool usage demonstrations with actual MCP tool calls
- Common patterns: board structure, card hierarchies, custom fields
- Error handling and troubleshooting assistance

**Example**: "How do I migrate 50 cards from board A to board B?"

### BusinessMap Troubleshooting

**When to use**: Encountering API errors (403, 404, 429, BS05) or unexpected behavior.

The troubleshooting skill provides:

- Error code diagnosis (HTTP 403/404/429/500, BS05)
- Authentication and configuration issue resolution
- Rate limiting strategies and solutions
- Resource dependency conflict resolution
- Performance optimization recommendations

**Example**: "I'm getting BS05 error when deleting a board"

### BusinessMap Best Practices

**When to use**: Optimizing API usage, implementing production deployments, or bulk operations.

The best practices skill provides:

- Performance optimization patterns (bulk operations, pagination strategies)
- Rate limiting strategies (token bucket, exponential backoff, circuit breaker)
- Caching strategies (board structure, user data, custom fields)
- Security best practices (token management, input validation, audit logging)
- Production deployment checklist

**Example**: "What's the best way to handle rate limiting for 1000+ card updates?"

These skills auto-invoke based on your questions and provide comprehensive guidance using the MCP tools.

## Usage

The BusinessMap MCP server provides the following tools:

### Workspace Management

- `list_workspaces` - Get all workspaces
- `get_workspace` - Get workspace details
- `create_workspace` - Create new workspace
- `update_workspace` - Modify workspace name or description
- `archive_workspace` - Archive workspace (soft delete). Note: The API does not support permanent deletion (DELETE returns 405). Only archiving is available.

### Board Management

- `list_boards` - List boards in workspace(s)
- `search_board` - Search for boards by ID or name
- `get_current_board_structure` - Get the complete current structure of a board including workflows, columns, lanes, and configurations
- `create_board` - Create new board (if not in read-only mode)
- `update_board` - Modify board name, description, or settings
- `delete_board` - Remove board (requires archive-first workflow: boards must be archived before deletion, automatically handled via archive_first parameter)
- `get_columns` - Get all columns for a board
- `get_lanes` - Get all lanes for a board
- `get_lane` - Get details of a specific lane/swimlane
- `create_lane` - Create new lane/swimlane (if not in read-only mode)

### Card Management

#### Basic Card Operations

- `list_cards` - Get cards from a board with optional filters
- `get_card` - Get detailed card information
- `get_card_size` - Get the size/points of a specific card
- `create_card` - Create new card
- `move_card` - Move card to different column/swimlane
- `update_card` - Update card properties
- `set_card_size` - Set the size/points of a specific card
- `delete_card` - Remove card (with cascade confirmation if has children/comments/subtasks)

#### Card Comments

- `get_card_comments` - Get all comments for a specific card
- `get_card_comment` - Get details of a specific comment from a card
- `update_card_comment` - Update existing card comment text and formatting
- `delete_card_comment` - Remove comment from card

#### Card Custom Fields & Types

- `get_card_custom_fields` - Get all custom fields for a specific card
- `get_card_types` - Get all available card types

#### Card Outcomes & History

- `get_card_outcomes` - Get all outcomes for a specific card
- `get_card_history` - Get the history of a specific card outcome

#### Card Relationships

- `get_card_linked_cards` - Get all linked cards for a specific card

#### Card Subtasks

- `get_card_subtasks` - Get all subtasks for a specific card
- `get_card_subtask` - Get details of a specific subtask from a card
- `create_card_subtask` - Create a new subtask for a card
- `update_card_subtask` - Update subtask description, owner, or status
- `delete_card_subtask` - Remove subtask from card

#### Card Parent Relationships

- `get_card_parents` - Get a list of parent cards for a specific card
- `get_card_parent` - Check if a card is a parent of a given card
- `add_card_parent` - Make a card a parent of a given card
- `remove_card_parent` - Remove the link between a child card and a parent card
- `get_card_parent_graph` - Get a list of parent cards including their parent cards too
- `get_card_children` - Get a list of child cards of a specified parent card

### Custom Field Management

- `list_custom_fields` - Get all custom field definitions across system
- `list_board_custom_fields` - Get custom field definitions for specific board
- `get_custom_field` - Get details of a specific custom field by ID
- `create_custom_field` - Define new custom field with type and options
- `update_custom_field` - Modify custom field label, type, or constraints
- `delete_custom_field` - Remove custom field definition (cascades to all card values)

### Workflow & Cycle Time Analysis

- `get_workflow_cycle_time_columns` - Get workflow's cycle time columns
- `get_workflow_effective_cycle_time_columns` - Get workflow's effective cycle time columns

### Bulk Operations

- `bulk_archive_workspaces` - Archive multiple workspaces with consolidated confirmation (soft delete only)
- `bulk_update_workspaces` - Update multiple workspaces in single transaction
- `bulk_delete_boards` - Delete multiple boards with consolidated confirmation (automatically archives boards before deletion)
- `bulk_update_boards` - Update multiple boards in single transaction
- `bulk_delete_cards` - Delete multiple cards with consolidated confirmation
- `bulk_update_cards` - Update multiple cards in single transaction

### User Management

- `list_users` - Get all users
- `get_user` - Get user details
- `get_current_user` - Get current logged user details

### System

- `health_check` - Check API connection
- `get_api_info` - Get API information

## Tool Summary

The BusinessMap MCP server provides **59 registered tools** across 9 categories (in full profile):

- **Workspace Management**: 5 tools
- **Board Management**: 10 tools (`get_board` removed in favor of `get_current_board_structure`)
- **Card Management**: 25 tools (organized in 6 subcategories)
- **Custom Field Management**: 7 tools
- **Workflow & Cycle Time Analysis**: 2 tools (`calculate_card_cycle_time` removed)
- **Bulk Operations**: 6 tools
- **User Management**: 3 tools
- **System**: 1 tool (`health_check` only; `list_instances`/`get_instance_info` never registered)

## Key Features

### Advanced Card Management

- **Complete CRUD operations** for cards, subtasks, and relationships
- **Parent-child card hierarchies** with full graph traversal
- **Outcome tracking and history** for detailed progress monitoring
- **Linked cards management** for cross-project dependencies
- **Custom fields and types** support for flexible workflows

### Comprehensive Board Operations

- **Multi-workspace board management** with search capabilities
- **Column and lane (swimlane) operations** for workflow customization
- **Board structure analysis** with detailed metadata

### Workflow Intelligence

- **Cycle time analysis** with configurable column sets
- **Effective cycle time tracking** for performance optimization
- **Custom field integration** for enhanced reporting

### Enterprise Features

- **Read-only mode** for safe data exploration
- **Robust error handling** with detailed error messages
- **Automatic connection verification** with retry logic
- **Docker support** for containerized deployments
- **Bulk operations** with dependency analysis and consolidated confirmations
- **Cascade delete protection** with impact previews

### DELETE Behavior by Resource Type

The API enforces different deletion workflows depending on resource type:

- **Workspaces**: Cannot be permanently deleted via API (DELETE returns 405). Only archiving is supported using `archive_workspace` or `bulk_archive_workspaces`.
- **Boards**: Require archive-first workflow. Boards must be archived (PATCH with `is_archived=1`) before DELETE succeeds. Attempting to DELETE an active board returns 400 "BS05 - The board has not been archived". The `delete_board` and `bulk_delete_boards` tools handle this automatically via the `archive_first` parameter (defaults to true).
- **Cards**: Support direct deletion with cascade confirmation for dependent resources (children, comments, subtasks).

## Error Handling

All tools follow consistent error handling patterns with specific failure causes, transient/permanent indicators, and actionable remediation steps.

### Common Error Scenarios

#### Insufficient Permissions (Permanent)

**Affects**: `archive_workspace`, `delete_board`, `delete_custom_field`, all bulk archive/delete operations

- **Cause**: User lacks required admin role for the operation
- **Message**: "Insufficient permissions. [Operation] requires [role] role."
- **Remediation**: Contact workspace/board administrator to request elevated permissions or have admin perform the operation

**Example**:

```text
Error: Insufficient permissions. Workspace archiving requires workspace admin role.
Remediation: Contact workspace administrator to request elevated permissions.
```

#### Resource Not Found (Permanent)

**Affects**: All update and delete operations

- **Cause**: Resource ID does not exist or was already deleted
- **Message**: "[Resource] not found. Verify resource exists."
- **Remediation**: Use corresponding list/get tool to verify resource ID before retry

**Example**:

```text
Error: Board not found. Verify resource exists.
Remediation: Use list_boards to retrieve current board IDs.
```

#### Rate Limit Exceeded (Transient)

**Affects**: All operations (30 requests/minute, 600 requests/hour limit)

- **Cause**: API rate limit exceeded
- **Message**: "Rate limit exceeded. Retry after [N] seconds."
- **Remediation**: Wait indicated time and retry. Consider batching operations using bulk tools.

**Example**:

```text
Error: Rate limit exceeded. Retry after 60 seconds.
Remediation: Wait 60 seconds and retry. For multiple operations, use bulk_update_cards instead of individual updates.
```

#### Validation Error (Permanent)

**Affects**: All create and update operations

- **Cause**: Invalid parameter values or constraint violations
- **Message**: "Validation failed: [specific constraint]"
- **Remediation**: Review parameter requirements and adjust input

**Example**:

```bash
Error: Validation failed: Custom field name must be unique within board.
Remediation: Use list_board_custom_fields to check existing names, then choose a unique name.
```

#### Cascade Archive/Delete Confirmation Required (User Action Required)

**Affects**: `archive_workspace`, `delete_board`, `delete_card`, all bulk archive/delete operations

- **Cause**: Resource has dependent resources that will be archived/deleted
- **Message**: Displays dependency tree and impact summary
- **Remediation**: Review dependencies and confirm operation or cancel

**Example**:

```sql
⚠️  Delete Confirmation Required

Workspace "Marketing Team" (ID: 123)
  └─ 3 boards will be deleted:
     • "Q1 Campaign" (ID: 456) → 12 cards
     • "Content Calendar" (ID: 457) → 8 cards

Total impact: 1 workspace, 3 boards, 20 cards

Proceed with deletion? (yes/no):
```

#### Network/Server Error (Transient)

**Affects**: All operations

- **Cause**: Temporary network issue or server unavailability
- **Message**: "Connection failed: [details]"
- **Remediation**: Check network connection and retry. If persists, check BusinessMap status.

**Example**:

```text
Error: Connection failed: ECONNREFUSED
Remediation: Verify BUSINESSMAP_API_URL is correct and BusinessMap service is accessible. Retry after verifying connection.
```

### Error Handling by Tool Category

#### Workspace Operations

- `update_workspace`, `archive_workspace`: Permissions, NotFound, RateLimit
- `bulk_archive_workspaces`, `bulk_update_workspaces`: All above + CascadeConfirmation for workspaces with boards

#### Board Operations

- `update_board`, `delete_board`: Permissions, NotFound, RateLimit
- `bulk_delete_boards`, `bulk_update_boards`: All above + CascadeConfirmation for boards with cards

#### Card Operations

- `delete_card`: NotFound, RateLimit, CascadeConfirmation (if has children/comments/subtasks)
- `update_card_comment`, `delete_card_comment`: NotFound, RateLimit, Permissions
- `update_card_subtask`, `delete_card_subtask`: NotFound, RateLimit
- `bulk_delete_cards`, `bulk_update_cards`: All above + CascadeConfirmation

#### Custom Field Operations

- `create_custom_field`, `update_custom_field`: Validation (name uniqueness, type constraints), RateLimit
- `delete_custom_field`: Permissions, NotFound, CascadeConfirmation (shows affected boards/cards)

## Development

### Setup Development Environment

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Watch for changes
npm run watch

# Build for production
npm run build

# Run tests
npm test

# Performance benchmarks
npm run benchmark:profile  # Profile registration performance
npm run measure:profile    # Token usage by profile
npm run measure:baseline   # Baseline token metrics

# Lint code
npm run lint
```

### Docker Support

```bash
# Build Docker image
npm run docker:build

# Run with Docker Compose
npm run docker:up

# View logs
npm run docker:logs

# Stop containers
npm run docker:down
```

## Troubleshooting

### Connection Issues

The server now includes automatic connection verification during startup. If you encounter connection issues:

1. **Check your environment variables**:

   ```bash
   echo $BUSINESSMAP_API_URL
   echo $BUSINESSMAP_API_TOKEN
   ```

2. **Test the connection manually**:

   ```bash
   chmod +x scripts/test-connection.sh
   ./scripts/test-connection.sh
   ```

3. **Common issues**:
   - **Invalid API URL**: Ensure your URL follows the format `https://your-account.kanbanize.com/api/v2`
   - **Invalid API Token**: Verify your token has the necessary permissions

### Startup Process

The server now performs the following steps during initialization:

1. **Configuration validation** - Checks all required environment variables
2. **API connection verification** - Tests connectivity with up to 3 retry attempts
3. **Authentication check** - Verifies API token permissions
4. **Server startup** - Starts the MCP server only after successful connection

If the connection fails, the server will display detailed error messages and retry automatically.

### Release Process

This project uses an automated release process. See [RELEASE_PROCESS.md](docs/RELEASE_PROCESS.md) for detailed documentation.

**Quick Start:**

```bash
# Preview release notes
npm run preview:release

# Publish new version (interactive)
npm run publish
```

The release process automatically:

- Bumps version (patch/minor/major)
- Generates release notes from commits
- Creates GitHub tags and releases
- Publishes to NPM

### Contributing

1. Follow conventional commit format for better release notes:

   ```bash
   feat: add new feature
   fix: resolve bug
   docs: update documentation
   refactor: improve code structure
   ```

2. Ensure all tests pass before submitting PR:

   ```bash
   npm test
   npm run test:npx
   ```

## License

MIT

## Support

For issues and questions:

1. Check the [Issues](../../issues) page
2. Review BusinessMap API documentation
3. Verify your environment configuration
4. Submit a new issue with detailed information

## Related Projects

- [Model Context Protocol](https://modelcontextprotocol.io/) - Official MCP documentation
- [BusinessMap API Documentation](https://businessmap.io/api) - Official API reference
- [BusinessMap Demo API](https://demo.kanbanize.com/openapi#/) - Interactive API documentation and testing environment
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk) - Official MCP SDK
