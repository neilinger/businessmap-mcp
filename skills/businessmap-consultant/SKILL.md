---
name: BusinessMap API Consultant
description: Interactive BusinessMap/Kanbanize API guidance for workflows, migrations, integrations, and usage patterns. Use when user asks about BusinessMap operations, card migrations, board setup, custom fields, workflow configuration, or API usage patterns.
---

# BusinessMap API Consultant

Expert guidance for BusinessMap (formerly Kanbanize) API operations through MCP tools.

## When to Use This Skill

Trigger when user asks:
- "How do I [work with boards/cards/workspaces]?"
- "Show me how to [migrate/setup/configure] in BusinessMap"
- "What's the workflow for [card operations/board structure]?"
- "Help me understand BusinessMap [custom fields/workflows/APIs]"
- Any BusinessMap/Kanbanize-related workflow questions

## Available MCP Tools

**Workspaces** (7 tools):
- `list_workspaces`, `get_workspace`, `create_workspace`, `update_workspace`
- `archive_workspace`, `bulk_archive_workspaces`, `bulk_update_workspaces`

**Boards** (12 tools):
- `list_boards`, `search_board`, `get_current_board_structure`
- `get_columns`, `get_lanes`, `get_lane`
- `create_board`, `create_lane`, `update_board`
- `delete_board`, `bulk_delete_boards`, `bulk_update_boards`

**Cards** (26 tools):
- `list_cards`, `get_card`, `create_card`, `move_card`, `update_card`, `delete_card`
- `get_card_size`, `set_card_size`
- `get_card_comments`, `get_card_comment`
- `get_card_custom_fields`, `get_card_types`
- `get_card_subtasks`, `get_card_subtask`, `create_card_subtask`
- `get_card_parents`, `get_card_parent`, `get_card_parent_graph`, `get_card_children`
- `add_card_parent`, `remove_card_parent`
- `get_card_linked_cards`, `get_card_history`, `get_card_outcomes`
- `bulk_delete_cards`, `bulk_update_cards`

**Custom Fields** (6 tools):
- `list_custom_fields`, `list_board_custom_fields`, `get_custom_field`
- `create_custom_field`, `update_custom_field`, `delete_custom_field`

**Users** (3 tools):
- `list_users`, `get_user`, `get_current_user`

**Workflows** (2 tools):
- `get_workflow_cycle_time_columns`, `get_workflow_effective_cycle_time_columns`

**Utilities** (2 tools):
- `health_check`, `get_api_info`

## Common Workflows

### 1. Board Setup Workflow

```markdown
1. List available workspaces:
   - Use `list_workspaces` to see all workspaces

2. Create or select board:
   - Use `create_board` with workspace_id, name, description
   - Or `search_board` to find existing board

3. Get board structure:
   - Use `get_current_board_structure` to see workflows, columns, lanes

4. Configure lanes (swimlanes):
   - Use `create_lane` to add swimlanes
   - Specify workflow_id, name, position, color

5. Set up custom fields:
   - Use `create_custom_field` for board-specific fields
   - Types: text, number, date, dropdown, checkbox, user, card
```

### 2. Card Migration Workflow

```markdown
1. Prepare source cards:
   - Use `list_cards` with board_id and filters
   - Export card data including custom fields, parents, children

2. Analyze dependencies:
   - Use `get_card_parent_graph` to map hierarchies
   - Use `get_card_linked_cards` for relationships

3. Create target board structure:
   - Ensure columns/lanes match using `get_current_board_structure`
   - Create missing custom fields with `create_custom_field`

4. Migrate cards:
   - Use `create_card` with full card data
   - Preserve custom fields, deadlines, assignees

5. Restore relationships:
   - Use `add_card_parent` to recreate hierarchies
   - Update linked cards

6. Verify migration:
   - Use `list_cards` to count and verify
   - Check custom field values with `get_card_custom_fields`
```

### 3. Bulk Operations Workflow

```markdown
1. Identify target cards/boards:
   - Use `list_cards` or `list_boards` with filters
   - Collect resource IDs

2. Use bulk operations:
   - `bulk_update_cards` - Update multiple cards (max 50)
   - `bulk_delete_cards` - Delete with dependency analysis
   - `bulk_update_boards` - Update multiple boards (max 50)
   - `bulk_delete_boards` - Delete boards with confirmation

3. Verify results:
   - Check updated resources
   - Handle any errors from bulk operations
```

### 4. Custom Field Management

```markdown
1. List existing fields:
   - Use `list_board_custom_fields` for board-specific
   - Use `list_custom_fields` for all fields

2. Create custom field:
   - Use `create_custom_field` with:
     - board_id, name, field_type
     - Optional: description, is_required, position, validation
     - For dropdown: include options array with value/color

3. Update field definition:
   - Use `update_custom_field` to modify
   - Can update name, description, options, validation

4. Delete field (careful!):
   - Use `delete_custom_field`
   - Shows dependency impact (boards, cards)
   - Requires confirmation
   - Cascades to all card values
```

## API Constraints & Best Practices

### Rate Limits
- **Default**: 120 requests/minute per API token
- **Strategy**: Batch operations when possible
- **Bulk tools**: Use for >5 resources (max 50 per request)

### Pagination
- **list_cards**: Default 200 per page, max 1000
- **Parameters**: `page`, `per_page`
- **Strategy**: Iterate pages for large datasets

### Read-Only Mode
- **Environment**: `BUSINESSMAP_READ_ONLY_MODE=true`
- **Effect**: Disables create/update/delete operations
- **Use case**: Safe exploration, reporting, analytics

### Resource Dependencies
- **Cards**: Check parent/child relationships before deletion
- **Custom fields**: Deleting cascades to all card values
- **Boards**: Archive before deletion (API requirement)
- **Bulk operations**: Automatic dependency analysis

### Error Handling
- **403 Forbidden**: Check API token permissions, workspace access
- **404 Not Found**: Verify resource IDs, check if archived
- **BS05 Error**: Resource must be archived before deletion
- **Rate limiting**: Implement exponential backoff

## Interactive Guidance Approach

When user asks for help:

1. **Clarify intent**: Ask follow-up questions if unclear
2. **Show tool usage**: Demonstrate with actual MCP tool calls
3. **Explain workflow**: Step-by-step with reasoning
4. **Handle errors**: Troubleshoot API responses
5. **Optimize approach**: Suggest bulk operations when appropriate

## Examples

### Example 1: User wants to create cards with custom fields

```markdown
User: "How do I create cards with custom fields?"

1. First, list custom fields for the board:
   Tool: list_board_custom_fields(board_id=123)

2. Identify field IDs and types from response

3. Create card with custom_fields_to_add_or_update:
   Tool: create_card(
     title="New Card",
     column_id=456,
     custom_fields_to_add_or_update=[
       {field_id: 789, value: "Custom value"},
       {field_id: 790, value: "100"}
     ]
   )
```

### Example 2: User needs to migrate 50 cards

```markdown
User: "I need to migrate 50 cards from board A to board B"

1. Recommend bulk approach (more efficient than 50 individual calls)

2. First, get source cards:
   Tool: list_cards(board_id=A, per_page=50)

3. Check target board structure:
   Tool: get_current_board_structure(board_id=B)

4. Map columns: Source column IDs → Target column IDs

5. Create cards in batches (can't bulk create, but optimize):
   - Loop through source cards
   - Call create_card for each with mapped column_id
   - Preserve custom fields, deadlines, owners

6. If cards have parent/child relationships:
   - First create all cards (get new IDs)
   - Then restore relationships with add_card_parent
```

### Example 3: User gets BS05 error

```markdown
User: "I'm getting BS05 error when deleting a board"

Explain: BusinessMap API requires boards to be archived before deletion

Solution:
1. Archive the board first:
   Tool: update_board(board_id=123, is_archived=1)

2. Then delete:
   Tool: delete_board(board_id=123, archive_first=false)

Or use automatic archiving (default):
   Tool: delete_board(board_id=123)  # Handles archiving automatically
```

## Advanced Patterns

### Card Hierarchy Management

```markdown
Get full hierarchy tree:
1. Use get_card_parent_graph(card_id=X) for ancestors
2. Use get_card_children(card_id=X) for descendants
3. Combine for complete tree visualization

Flatten hierarchy:
1. List all cards in board
2. For each card, call remove_card_parent
3. Cards become independent
```

### Workflow Analysis

```markdown
Understanding cycle time:
1. Get workflow configuration:
   Tool: get_current_board_structure(board_id=X)

2. Get cycle time columns:
   Tool: get_workflow_cycle_time_columns(board_id=X, workflow_id=Y)

3. Get effective columns (with filters):
   Tool: get_workflow_effective_cycle_time_columns(board_id=X, workflow_id=Y)

4. Compare to understand what columns count toward cycle time
```

### Custom Field Validation

```markdown
For number fields with validation:
create_custom_field(
  board_id=123,
  name="Story Points",
  field_type="number",
  validation={
    min: 1,
    max: 21
  }
)

For dropdown with colored options:
create_custom_field(
  board_id=123,
  name="Priority",
  field_type="dropdown",
  options=[
    {value: "High", color: "#FF0000"},
    {value: "Medium", color: "#FFA500"},
    {value: "Low", color: "#00FF00"}
  ]
)
```

## Troubleshooting Quick Reference

- **Can't find board**: Use `search_board` or `list_boards`
- **Permission denied**: Check API token scope and workspace access
- **Rate limited**: Use bulk operations, add delays
- **Card not moving**: Verify column_id exists in target workflow
- **Custom field not showing**: Check `list_board_custom_fields` for board
- **Deletion fails**: Archive resource first (boards, cards)
- **Parent/child loops**: Check `get_card_parent_graph` for cycles

## Output Format

Provide guidance as:
1. **Clear explanation** of what user wants to achieve
2. **Step-by-step workflow** with tool calls
3. **Actual tool invocations** (show parameters)
4. **Expected responses** and how to use them
5. **Error handling** and common issues
6. **Optimization tips** (bulk ops, pagination, caching)

Be interactive - ask clarifying questions, demonstrate with tools, explain trade-offs.
