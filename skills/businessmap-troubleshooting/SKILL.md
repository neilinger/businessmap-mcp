---
name: BusinessMap Troubleshooting
description: Diagnose and resolve BusinessMap/Kanbanize API errors, authentication failures, rate limits, resource conflicts, and common integration issues. Use when encountering API errors (403, 404, 429, BS05), connection problems, or unexpected API behavior.
---

# BusinessMap Troubleshooting

Systematic error resolution for BusinessMap (Kanbanize) API integrations.

## When to Use This Skill

Auto-invoke when:
- API returns error codes (403, 404, 429, 500, BS05)
- Authentication failures
- "Rate limit exceeded" messages
- "Resource not found" errors
- Dependency conflicts
- Unexpected API responses
- Connection timeouts

## Common Error Codes

### HTTP 403 Forbidden

**Symptoms**:
```json
{
  "error": "Forbidden",
  "message": "Access denied"
}
```

**Root Causes**:
1. **Invalid or expired API token**
   - Verify: `BUSINESSMAP_API_TOKEN` is set correctly
   - Check: Token hasn't been revoked in BusinessMap settings
   - Test: Use `health_check` tool to verify connectivity

2. **Insufficient permissions**
   - User role doesn't have access to workspace/board
   - Token has read-only access but write operation attempted
   - Check: User permissions in BusinessMap UI

3. **Workspace-level restrictions**
   - Board belongs to different workspace
   - Workspace archived or deleted
   - Verify: `list_workspaces` shows accessible workspaces

**Solutions**:
```bash
# Test API connectivity
Tool: health_check

# Verify token works
Tool: get_current_user

# List accessible workspaces
Tool: list_workspaces

# Check read-only mode
Environment: BUSINESSMAP_READ_ONLY_MODE=false
```

### HTTP 404 Not Found

**Symptoms**:
```json
{
  "error": "Not Found",
  "message": "Resource with ID X not found"
}
```

**Root Causes**:
1. **Resource doesn't exist**
   - Wrong ID used
   - Resource was deleted
   - Typo in resource identifier

2. **Resource is archived**
   - Boards/cards can be archived
   - Archived resources not returned by default
   - Use `is_archived=1` filter to find

3. **Wrong endpoint or parameters**
   - Incorrect workspace_id/board_id
   - Using card_id where board_id expected
   - Check API documentation

**Solutions**:
```bash
# Search for board by name
Tool: search_board(board_name="...")

# List all boards including archived
Tool: list_boards(is_archived=1)

# List cards with filters
Tool: list_cards(board_id=X, archived_from_date="2024-01-01")

# Verify resource IDs
Tool: list_workspaces  # Get valid workspace IDs
Tool: list_boards(workspace_id=X)  # Get valid board IDs
```

### HTTP 429 Rate Limit Exceeded

**Symptoms**:
```json
{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Try again in X seconds."
}
```

**Rate Limits**:
- **Default**: 120 requests/minute per API token
- **Burst**: Short bursts tolerated, sustained traffic throttled
- **Per-token**: Each API token has separate limit

**Solutions**:

1. **Use bulk operations** (max 50 resources per call):
```bash
# Instead of 50 individual delete_card calls
Tool: bulk_delete_cards(resource_ids=[id1, id2, ..., id50])

# Instead of 30 individual update_board calls
Tool: bulk_update_boards(resource_ids=[...], updates={...})
```

2. **Implement backoff strategy**:
```python
import time

def with_retry(tool_call, max_retries=3):
    for attempt in range(max_retries):
        try:
            return tool_call()
        except RateLimitError as e:
            if attempt == max_retries - 1:
                raise
            wait_time = (2 ** attempt) * 1  # 1s, 2s, 4s
            time.sleep(wait_time)
```

3. **Batch requests**:
```bash
# Collect all card IDs first
cards = list_cards(board_id=X, per_page=1000)

# Process in batches of 50
for batch in chunks(card_ids, 50):
    bulk_delete_cards(resource_ids=batch)
    time.sleep(1)  # Rate limiting pause
```

4. **Pagination optimization**:
```bash
# Instead of page_size=10 with 100 pages (1000 requests)
Tool: list_cards(board_id=X, page=1, per_page=1000)  # 1 request

# Use maximum per_page to minimize API calls
```

### BS05 Error: Resource Must Be Archived

**Symptoms**:
```json
{
  "error": "BS05",
  "message": "Resource must be archived before deletion"
}
```

**Root Cause**:
- BusinessMap API requires resources to be archived before permanent deletion
- Applies to: boards, cards, workspaces
- Safety mechanism to prevent accidental deletion

**Solutions**:

**Option 1: Manual two-step** (explicit):
```bash
# Step 1: Archive resource
Tool: update_board(board_id=123, is_archived=1)

# Step 2: Delete archived resource
Tool: delete_board(board_id=123, archive_first=false)
```

**Option 2: Automatic archiving** (recommended):
```bash
# Default behavior: automatically archives then deletes
Tool: delete_board(board_id=123)

# Also works for cards
Tool: delete_card(card_id=456)
```

**Option 3: Bulk deletion with auto-archive**:
```bash
# Handles archiving automatically for all resources
Tool: bulk_delete_boards(resource_ids=[123, 456, 789])
```

### HTTP 500 Internal Server Error

**Symptoms**:
```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

**Root Causes**:
1. **Invalid data in request**
   - Malformed JSON
   - Invalid field types (string where number expected)
   - Missing required fields

2. **Server-side issue**
   - Temporary BusinessMap outage
   - Database connection issues
   - Deployment in progress

3. **Data constraints violated**
   - Circular parent-child relationships
   - Duplicate unique values
   - Invalid foreign key references

**Solutions**:

1. **Validate request data**:
```bash
# Check required fields are present
create_card(
  title="Required",  # Must be present
  column_id=123      # Must be valid column ID
)

# Verify field types
custom_fields_to_add_or_update=[
  {field_id: 789, value: "100"}  # String for number field may fail
]
```

2. **Retry with exponential backoff**:
```python
# Server errors may be transient
for attempt in range(3):
    try:
        return tool_call()
    except ServerError as e:
        if attempt == 2:
            raise
        time.sleep(2 ** attempt)  # 1s, 2s, 4s
```

3. **Check BusinessMap status**:
```bash
# Use health check
Tool: health_check

# Check BusinessMap status page
# https://status.businessmap.io (if available)
```

## Authentication & Configuration Issues

### Invalid API URL

**Symptoms**:
- Connection timeout
- "Host not found" errors
- SSL certificate errors

**Root Cause**:
- Wrong `BUSINESSMAP_API_URL` environment variable
- Typo in domain (e.g., "kanbanize" vs "businessmap")
- Missing `/api/v2` suffix

**Solutions**:
```bash
# Correct formats:
BUSINESSMAP_API_URL=https://SUBDOMAIN.kanbanize.com/api/v2
BUSINESSMAP_API_URL=https://SUBDOMAIN.businessmap.io/api/v2

# Common mistakes:
# ❌ Missing /api/v2
# ❌ Using http:// instead of https://
# ❌ Wrong subdomain

# Test connectivity
Tool: health_check
```

### Missing or Invalid API Token

**Symptoms**:
```json
{
  "error": "Unauthorized",
  "message": "API token missing or invalid"
}
```

**Solutions**:
```bash
# Verify token is set
Environment: BUSINESSMAP_API_TOKEN=your_token_here

# Generate new token in BusinessMap:
# 1. Go to Settings > API
# 2. Create new API token
# 3. Copy token (only shown once!)
# 4. Set environment variable

# Test token
Tool: get_current_user
```

### Read-Only Mode Restrictions

**Symptoms**:
- Create/update/delete operations return 403
- "Read-only mode enabled" messages

**Root Cause**:
- `BUSINESSMAP_READ_ONLY_MODE=true` environment variable set
- Safety feature to prevent accidental modifications

**Solutions**:
```bash
# Disable read-only mode
Environment: BUSINESSMAP_READ_ONLY_MODE=false

# Or unset the variable entirely
unset BUSINESSMAP_READ_ONLY_MODE

# Read-only mode allows:
# ✅ list_*, get_*, search_* operations
# ❌ create_*, update_*, delete_* operations
```

## Resource Dependency Issues

### Deleting Board with Cards

**Problem**:
Attempting to delete board that contains active cards

**Solution**:
```bash
# Option 1: Archive cards first
cards = list_cards(board_id=123)
card_ids = [card.card_id for card in cards]
bulk_delete_cards(resource_ids=card_ids)  # Handles archiving
delete_board(board_id=123)

# Option 2: Archive board with cards
# (Cards remain accessible in archived state)
update_board(board_id=123, is_archived=1)
```

### Deleting Custom Field with Data

**Problem**:
Custom field used in many cards, deletion will cascade

**Warning System**:
```bash
Tool: delete_custom_field(custom_field_id=789)

# System prompts:
# "This will delete custom field 'Priority' from:
#  - 5 boards
#  - 342 cards
#  All card data will be permanently lost. Confirm? (yes/no)"
```

**Solutions**:
```bash
# Before deletion:
1. Export card data with custom field values
2. Confirm business approval for data loss
3. Verify no reports/dashboards depend on field

# Alternative: Archive instead of delete
# (BusinessMap doesn't support field archiving natively)
# Rename field to "_DEPRECATED_FieldName"
Tool: update_custom_field(
  custom_field_id=789,
  name="_DEPRECATED_Priority"
)
```

### Circular Parent-Child Relationships

**Problem**:
```
Card A → parent of Card B
Card B → parent of Card A
(Infinite loop)
```

**Detection**:
```bash
# Check parent graph before adding relationship
Tool: get_card_parent_graph(card_id=A)

# If B is already an ancestor of A, adding A as parent of B creates cycle
```

**Solution**:
```bash
# Remove existing relationship first
Tool: remove_card_parent(card_id=B, parent_card_id=A)

# Then add new relationship
Tool: add_card_parent(card_id=A, parent_card_id=B)
```

## Performance Issues

### Slow Queries

**Problem**:
`list_cards` taking >10 seconds for large boards

**Optimization**:
```bash
# Use filters to reduce dataset
Tool: list_cards(
  board_id=123,
  column_ids=[456, 789],  # Specific columns only
  created_from_date="2024-01-01",  # Recent cards only
  owner_user_ids=[42],  # Specific assignees only
  per_page=1000  # Maximum page size
)

# Avoid fetching all cards if you only need count
# Instead of:
all_cards = list_cards(board_id=123)
count = len(all_cards)

# Use pagination metadata:
response = list_cards(board_id=123, per_page=1)
total = response.pagination.total  # Total count without fetching all
```

### Large Bulk Operations

**Problem**:
Bulk operation on 1000+ resources times out

**Solution**:
```bash
# Split into batches of 50 (API maximum)
resource_ids = [id1, id2, ..., id1000]

for batch in chunks(resource_ids, 50):
    bulk_delete_cards(resource_ids=batch)
    time.sleep(1)  # Rate limiting
```

## Diagnostic Workflow

When troubleshooting unknown issues:

1. **Verify connectivity**:
```bash
Tool: health_check
```

2. **Test authentication**:
```bash
Tool: get_current_user
```

3. **Check resource exists**:
```bash
Tool: list_workspaces
Tool: list_boards(workspace_id=X)
Tool: search_board(board_id=Y)
```

4. **Verify permissions**:
```bash
Tool: list_boards(if_assigned=1)  # Boards user has access to
```

5. **Review API response**:
- Check error message carefully
- Look for specific error codes (BS05, etc.)
- Note any suggested actions in response

6. **Check environment**:
```bash
echo $BUSINESSMAP_API_URL
echo $BUSINESSMAP_API_TOKEN | head -c 10  # First 10 chars only
echo $BUSINESSMAP_READ_ONLY_MODE
```

## Error Message Reference

| Error | HTTP Code | Cause | Solution |
|-------|-----------|-------|----------|
| Forbidden | 403 | Invalid token or insufficient permissions | Verify token, check user role |
| Not Found | 404 | Resource doesn't exist or is archived | Search by name, check is_archived filter |
| Too Many Requests | 429 | Rate limit exceeded | Use bulk ops, add delays, implement backoff |
| BS05 | 400 | Resource must be archived before deletion | Archive first or use auto-archive |
| Unauthorized | 401 | Missing or invalid API token | Set BUSINESSMAP_API_TOKEN |
| Internal Server Error | 500 | Server-side issue or invalid data | Retry with backoff, validate request data |

## Getting Help

If issue persists:
1. Review BusinessMap API documentation
2. Check BusinessMap knowledge base
3. Contact BusinessMap support with:
   - Error message and code
   - API request details (sanitized)
   - Timestamp and frequency
   - Expected vs actual behavior
