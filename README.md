# BusinessMap MCP Server

[![npm version](https://img.shields.io/npm/v/@edicarlos.lds/businessmap-mcp.svg)](https://www.npmjs.com/package/@edicarlos.lds/businessmap-mcp)
[![GitHub release](https://img.shields.io/github/v/release/edicarloslds/businessmap-mcp)](https://github.com/edicarloslds/businessmap-mcp/releases)
[![npm downloads](https://img.shields.io/npm/dm/@edicarlos.lds/businessmap-mcp)](https://www.npmjs.com/package/@edicarlos.lds/businessmap-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![MCP](https://img.shields.io/badge/Model%20Context%20Protocol-000000?logo=anthropic&logoColor=white)](https://modelcontextprotocol.io/)

Model Context Protocol server for BusinessMap (Kanbanize) integration. Provides comprehensive access to BusinessMap's project management features including workspaces, boards, cards, subtasks, parent-child relationships, outcomes, custom fields, and more.

## Installation

### Via NPX (Recommended)

You can run the BusinessMap MCP server directly using npx without installing it globally:

```bash
npx @edicarlos.lds/businessmap-mcp
```

### Global Installation

```bash
npm install -g @edicarlos.lds/businessmap-mcp
```

## Configuration

### Environment Variables

The server requires the following environment variables:

- `BUSINESSMAP_API_TOKEN`: Your BusinessMap API token
- `BUSINESSMAP_API_URL`: Your BusinessMap API URL (e.g., `https://your-account.kanbanize.com/api/v2`)
- `BUSINESSMAP_READ_ONLY_MODE`: Set to `"true"` for read-only mode, `"false"` to allow modifications (optional, defaults to `"false"`)
- `BUSINESSMAP_DEFAULT_WORKSPACE_ID`: Set the BusinessMap workspace ID (optional)

#### Claude Desktop

Add the following configuration to your `claude_desktop_config.json` file:

```json
{
  "mcpServers": {
    "Businessmap": {
      "command": "npx",
      "args": ["-y", "@edicarlos.lds/businessmap-mcp"],
      "env": {
        "BUSINESSMAP_API_TOKEN": "your_token_here",
        "BUSINESSMAP_API_URL": "https://your-account.kanbanize.com/api/v2",
        "BUSINESSMAP_READ_ONLY_MODE": "false", // optional
        "BUSINESSMAP_DEFAULT_WORKSPACE_ID": "1" // optional
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
  "args": ["-y", "@edicarlos.lds/businessmap-mcp"],
  "env": {
    "BUSINESSMAP_API_TOKEN": "your_token_here",
    "BUSINESSMAP_API_URL": "https://your-account.kanbanize.com/api/v2",
    "BUSINESSMAP_READ_ONLY_MODE": "false",
    "BUSINESSMAP_DEFAULT_WORKSPACE_ID": "1"
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
      "args": ["-y", "@edicarlos.lds/businessmap-mcp"],
      "env": {
        "BUSINESSMAP_API_TOKEN": "your_token_here",
        "BUSINESSMAP_API_URL": "https://your-account.kanbanize.com/api/v2",
        "BUSINESSMAP_READ_ONLY_MODE": "false",
        "BUSINESSMAP_DEFAULT_WORKSPACE_ID": "1"
      }
    }
  }
}
```

#### Other MCP Clients

For other MCP clients, use the appropriate configuration format for your client, ensuring you specify:

- Command: `npx @edicarlos.lds/businessmap-mcp` (or `businessmap-mcp` if globally installed)
- Environment variables: `BUSINESSMAP_API_TOKEN`, `BUSINESSMAP_API_URL`, and optionally `BUSINESSMAP_READ_ONLY_MODE`, `BUSINESSMAP_DEFAULT_WORKSPACE_ID`

### Manual Setup

1. Clone this repository:

   ```bash
   git clone https://github.com/edicarloslds/businessmap-mcp.git
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

The BusinessMap MCP server provides **65 tools** across 9 categories:

- **Workspace Management**: 5 tools
- **Board Management**: 11 tools
- **Card Management**: 25 tools (organized in 6 subcategories)
- **Custom Field Management**: 7 tools
- **Workflow & Cycle Time Analysis**: 2 tools
- **Bulk Operations**: 6 tools
- **User Management**: 3 tools
- **System**: 2 tools

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
```
Error: Insufficient permissions. Workspace archiving requires workspace admin role.
Remediation: Contact workspace administrator to request elevated permissions.
```

#### Resource Not Found (Permanent)

**Affects**: All update and delete operations

- **Cause**: Resource ID does not exist or was already deleted
- **Message**: "[Resource] not found. Verify resource exists."
- **Remediation**: Use corresponding list/get tool to verify resource ID before retry

**Example**:
```
Error: Board not found. Verify resource exists.
Remediation: Use list_boards to retrieve current board IDs.
```

#### Rate Limit Exceeded (Transient)

**Affects**: All operations (30 requests/minute, 600 requests/hour limit)

- **Cause**: API rate limit exceeded
- **Message**: "Rate limit exceeded. Retry after [N] seconds."
- **Remediation**: Wait indicated time and retry. Consider batching operations using bulk tools.

**Example**:
```
Error: Rate limit exceeded. Retry after 60 seconds.
Remediation: Wait 60 seconds and retry. For multiple operations, use bulk_update_cards instead of individual updates.
```

#### Validation Error (Permanent)

**Affects**: All create and update operations

- **Cause**: Invalid parameter values or constraint violations
- **Message**: "Validation failed: [specific constraint]"
- **Remediation**: Review parameter requirements and adjust input

**Example**:
```
Error: Validation failed: Custom field name must be unique within board.
Remediation: Use list_board_custom_fields to check existing names, then choose a unique name.
```

#### Cascade Archive/Delete Confirmation Required (User Action Required)

**Affects**: `archive_workspace`, `delete_board`, `delete_card`, all bulk archive/delete operations

- **Cause**: Resource has dependent resources that will be archived/deleted
- **Message**: Displays dependency tree and impact summary
- **Remediation**: Review dependencies and confirm operation or cancel

**Example**:
```
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
```
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
