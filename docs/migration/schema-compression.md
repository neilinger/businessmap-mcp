# Migration Guide: Schema Compression v2.0

**Version**: 2.0.0
**Breaking Changes**: Yes
**Migration Difficulty**: Moderate
**Estimated Time**: 30-60 minutes

## What You'll Learn

By following this guide, you will:

- Understand the breaking schema changes in v2.0
- Update your MCP client code to use the new nested parameter structures
- Test your integration with the compressed schemas
- Handle common migration errors

## Prerequisites

- Existing BusinessMap MCP client integration
- Node.js 18.x, 20.x, or 22.x
- Basic understanding of TypeScript/JavaScript objects
- Access to test environment for validation

## Time Estimate

- **Quick Migration** (minimal profile): 15-30 minutes
- **Full Migration** (all tools): 45-60 minutes
- **Testing & Validation**: 15-30 minutes

## Final Result

After migration, your client will:

- Use nested parameter structures for better organization
- Benefit from token reduction depending on profile:
  - **Minimal profile**: 61% reduction (36,722 → 14,276 tokens)
  - **Standard profile**: 43% reduction (36,722 → 21,090 tokens)
  - **Full profile**: 14% reduction (36,722 → 31,663 tokens)
- Maintain 100% functional compatibility with v1.x behavior

---

## Overview: What Changed and Why

### The Problem

BusinessMap MCP server v1.x consumed **38,900 tokens** during initialization, making every session expensive before any productive work began. The flat parameter structures also created verbose, hard-to-maintain schemas.

### The Solution

Version 2.0 introduces:

1. **Nested Parameter Structures** - Logical grouping reduces repetition
2. **Profile-Based Tool Registration** - Load only what you need
3. **Shared Schema Definitions** - Common parameters deduplicated

### Token Savings

| Profile  | v1.x Tokens | v2.0 Tokens | Reduction |
| -------- | ----------- | ----------- | --------- |
| Minimal  | 38,900      | ~9,000      | 77%       |
| Standard | 38,900      | ~20,000     | 49%       |
| Full     | 38,900      | ~31,600     | 19%       |

---

## Breaking Changes Summary

### 1. create_card Schema

**Impact**: High - Most commonly used tool

**Before (v1.x)**: Flat structure

```typescript
createCard({
  title: 'Task name',
  column_id: 123,
  lane_id: 456,
  position: 2,
  description: 'Task details',
  custom_id: 'EXT-001',
  deadline: '2025-12-31',
  size: 5,
  priority: 8,
  color: '#ff0000',
  type_id: 789,
  user_id: 101,
  co_owners: [102, 103],
  // ... 40+ more flat parameters
});
```

**After (v2.0)**: Nested structure

```typescript
createCard({
  title: 'Task name',
  column_id: 123,

  placement: {
    lane_id: 456,
    position: 2,
    track: null, // optional
  },

  metadata: {
    description: 'Task details',
    custom_id: 'EXT-001',
    deadline: '2025-12-31',
    size: 5,
    priority: 8,
    color: '#ff0000',
    type_id: 789,
  },

  owners: {
    user_id: 101,
    co_owners: [102, 103],
  },
});
```

**Why**: Groups related parameters logically, reduces token count by 39% (3,600 → 2,200 tokens).

---

### 2. update_card Schema

**Impact**: High - Frequently used for card modifications

**Before (v1.x)**: Flat arrays with verbose names

```typescript
updateCard({
  card_id: 123,
  title: 'Updated title',
  description: 'Updated description',
  column_id: 456,
  lane_id: 789,
  position: 3,
  owner_user_id: 101,
  size: 8,
  priority: 9,
  deadline: '2025-12-31',
  co_owner_ids_to_add: [102, 103],
  co_owner_ids_to_remove: [104],
  watcher_ids_to_add: [105],
  watcher_ids_to_remove: [106],
  tag_ids_to_add: [201, 202],
  tag_ids_to_remove: [203],
  // ... more arrays
});
```

**After (v2.0)**: Compressed with nested collections

```typescript
updateCard({
  card_id: 123,
  title: 'Updated title',
  description: 'Updated description',
  column_id: 456,
  lane_id: 789,
  position: 3,
  owner_user_id: 101,
  size: 8,
  priority: 9,
  deadline: '2025-12-31',

  collections: {
    co_owner_ids_to_add: [102, 103],
    co_owner_ids_to_remove: [104],
    watcher_ids_to_add: [105],
    watcher_ids_to_remove: [106],
    tag_ids_to_add: [201, 202],
    tag_ids_to_remove: [203],
  },
});
```

**Why**: Separates frequently-used fields from collections, reduces token count by 41% (2,700 → 1,600 tokens).

---

### 3. list_cards Schema

**Impact**: Medium - Used for querying/filtering

**Before (v1.x)**: 40+ flat date filter parameters

```typescript
listCards({
  board_id: 123,
  created_from: '2025-01-01',
  created_to: '2025-12-31',
  deadline_from: '2025-06-01',
  deadline_to: '2025-06-30',
  archived_from: '2025-01-01',
  archived_to: '2025-12-31',
  // ... 30+ more date filters
  owner_user_ids: [101, 102],
  priorities: [8, 9, 10],
  type_ids: [1, 2, 3],
});
```

**After (v2.0)**: Nested date_filters object

```typescript
listCards({
  board_id: 123,

  date_filters: {
    created: {
      from: '2025-01-01',
      to: '2025-12-31',
    },
    deadline: {
      from: '2025-06-01',
      to: '2025-06-30',
    },
    archived: {
      from: '2025-01-01',
      to: '2025-12-31',
    },
  },

  owner_user_ids: [101, 102],
  priorities: [8, 9, 10],
  type_ids: [1, 2, 3],
});
```

**Why**: Groups date filters logically, reduces token count by 38% (2,900 → 1,800 tokens).

**Note**: Flat parameters still supported temporarily for backward compatibility but will be removed in v3.0.

---

### 4. instance Parameter

**Impact**: Low - All tools affected but simple change

**Before (v1.x)**: Defined per-tool

```typescript
// Each tool defined instance independently
createCard({ instance: "prod", ... })
getCard({ instance: "prod", ... })
listBoards({ instance: "prod", ... })
```

**After (v2.0)**: Shared definition via SharedParams

```typescript
// Same syntax, just internally optimized
createCard({ instance: "prod", ... })
getCard({ instance: "prod", ... })
listBoards({ instance: "prod", ... })
```

**Why**: No code changes needed, internal deduplication saves 650-975 tokens across all 65 tools.

---

## Step-by-Step Migration

### Step 1: Identify Your Tool Usage

Before migrating, determine which tools your client uses:

```bash
# Review your codebase for MCP tool calls
grep -r "createCard\|updateCard\|listCards" your-client-code/
```

**Minimal Profile Users** (most common):

- Only basic card/board operations
- No bulk operations or advanced features
- **Migration time**: 15-30 minutes

**Standard Profile Users** (recommended):

- Card, board, workspace operations
- Custom fields and workflows
- **Migration time**: 30-45 minutes

**Full Profile Users** (power users):

- All 65 tools including bulk operations
- **Migration time**: 45-60 minutes

---

### Step 2: Update create_card Calls

#### 2.1: Simple Card Creation

**Before**:

```typescript
const result = await client.callTool('create_card', {
  title: 'Implement feature X',
  column_id: 123,
  lane_id: 456,
  position: 0,
  description: 'Feature requirements...',
});
```

**After**:

```typescript
const result = await client.callTool('create_card', {
  title: 'Implement feature X',
  column_id: 123,

  placement: {
    lane_id: 456,
    position: 0,
  },

  metadata: {
    description: 'Feature requirements...',
  },
});
```

#### 2.2: Card with Full Metadata

**Before**:

```typescript
await client.callTool('create_card', {
  title: 'Critical bug fix',
  column_id: 123,
  lane_id: 456,
  description: 'Bug details...',
  custom_id: 'BUG-001',
  deadline: '2025-12-31',
  size: 8,
  priority: 10,
  color: '#ff0000',
  type_id: 789,
  user_id: 101,
});
```

**After**:

```typescript
await client.callTool('create_card', {
  title: 'Critical bug fix',
  column_id: 123,

  placement: {
    lane_id: 456,
  },

  metadata: {
    description: 'Bug details...',
    custom_id: 'BUG-001',
    deadline: '2025-12-31',
    size: 8,
    priority: 10,
    color: '#ff0000',
    type_id: 789,
  },

  owners: {
    user_id: 101,
  },
});
```

#### 2.3: Card with Co-owners

**Before**:

```typescript
await client.callTool('create_card', {
  title: 'Team task',
  column_id: 123,
  user_id: 101,
  co_owners: [102, 103, 104],
});
```

**After**:

```typescript
await client.callTool('create_card', {
  title: 'Team task',
  column_id: 123,

  owners: {
    user_id: 101,
    co_owners: [102, 103, 104],
  },
});
```

---

### Step 3: Update update_card Calls

#### 3.1: Basic Updates

**Before**:

```typescript
await client.callTool('update_card', {
  card_id: 123,
  title: 'New title',
  description: 'New description',
  size: 5,
  priority: 8,
});
```

**After**:

```typescript
// Top-level fields unchanged for simple updates
await client.callTool('update_card', {
  card_id: 123,
  title: 'New title',
  description: 'New description',
  size: 5,
  priority: 8,
});
```

**Note**: Basic scalar updates remain at top level for convenience.

#### 3.2: Managing Collections (Co-owners, Watchers, Tags)

**Before**:

```typescript
await client.callTool('update_card', {
  card_id: 123,
  co_owner_ids_to_add: [102, 103],
  co_owner_ids_to_remove: [104],
  watcher_ids_to_add: [105, 106],
  tag_ids_to_add: [201, 202],
  tag_ids_to_remove: [203],
});
```

**After**:

```typescript
await client.callTool('update_card', {
  card_id: 123,

  collections: {
    co_owner_ids_to_add: [102, 103],
    co_owner_ids_to_remove: [104],
    watcher_ids_to_add: [105, 106],
    tag_ids_to_add: [201, 202],
    tag_ids_to_remove: [203],
  },
});
```

#### 3.3: Mixed Updates

**Before**:

```typescript
await client.callTool('update_card', {
  card_id: 123,
  title: 'Updated title',
  priority: 9,
  co_owner_ids_to_add: [102],
  tag_ids_to_add: [201],
});
```

**After**:

```typescript
await client.callTool('update_card', {
  card_id: 123,
  title: 'Updated title',
  priority: 9,

  collections: {
    co_owner_ids_to_add: [102],
    tag_ids_to_add: [201],
  },
});
```

---

### Step 4: Update list_cards Calls

#### 4.1: Simple Filtering (No Date Filters)

**Before**:

```typescript
await client.callTool('list_cards', {
  board_id: 123,
  owner_user_ids: [101, 102],
  priorities: [8, 9, 10],
});
```

**After**:

```typescript
// No changes needed - non-date filters remain at top level
await client.callTool('list_cards', {
  board_id: 123,
  owner_user_ids: [101, 102],
  priorities: [8, 9, 10],
});
```

#### 4.2: Date Range Filtering

**Before**:

```typescript
await client.callTool('list_cards', {
  board_id: 123,
  created_from: '2025-01-01',
  created_to: '2025-12-31',
  deadline_from: '2025-06-01',
  deadline_to: '2025-06-30',
});
```

**After**:

```typescript
await client.callTool('list_cards', {
  board_id: 123,

  date_filters: {
    created: {
      from: '2025-01-01',
      to: '2025-12-31',
    },
    deadline: {
      from: '2025-06-01',
      to: '2025-06-30',
    },
  },
});
```

#### 4.3: Complex Filtering (Dates + IDs)

**Before**:

```typescript
await client.callTool('list_cards', {
  board_id: 123,
  created_from: '2025-01-01',
  archived_from: '2025-06-01',
  archived_to: '2025-06-30',
  owner_user_ids: [101, 102],
  type_ids: [1, 2, 3],
});
```

**After**:

```typescript
await client.callTool('list_cards', {
  board_id: 123,

  date_filters: {
    created: {
      from: '2025-01-01',
    },
    archived: {
      from: '2025-06-01',
      to: '2025-06-30',
    },
  },

  owner_user_ids: [101, 102],
  type_ids: [1, 2, 3],
});
```

---

### Step 5: Configure Tool Profile (Optional)

Choose the tool profile that matches your usage pattern:

#### Environment Variable Setup

```bash
# Option 1: Minimal profile (12 core tools, ~9k tokens)
export BUSINESSMAP_TOOL_PROFILE=minimal

# Option 2: Standard profile (30 tools, ~20k tokens) [DEFAULT]
export BUSINESSMAP_TOOL_PROFILE=standard

# Option 3: Full profile (all 65 tools, ~31.6k tokens)
export BUSINESSMAP_TOOL_PROFILE=full
```

#### Profile Comparison

| Profile      | Tools | Use Case                       | Tokens  |
| ------------ | ----- | ------------------------------ | ------- |
| **minimal**  | 12    | Basic CRUD operations          | ~9,000  |
| **standard** | ~30   | Most workflows + custom fields | ~20,000 |
| **full**     | 65    | Advanced features + bulk ops   | ~31,600 |

**Minimal Profile Tools**:

- `list_boards`, `list_cards`, `list_workspaces`
- `get_card`, `get_board`, `get_workspace`
- `create_card`, `update_card`, `move_card`
- `search_board`, `health_check`, `list_instances`

**When to use each**:

- **minimal**: Simple automation, testing, read-heavy workflows
- **standard**: Production applications, typical development (recommended)
- **full**: Power users needing bulk operations and advanced features

---

## Testing Your Migration

### Test 1: Create Card End-to-End

Run this test to verify basic functionality:

```typescript
// Test file: test-migration.ts
import { Client } from '@modelcontextprotocol/sdk/client/index.js';

async function testCreateCard(client: Client) {
  try {
    const result = await client.callTool('create_card', {
      title: 'Migration Test Card',
      column_id: 123,

      placement: {
        lane_id: 456,
        position: 0,
      },

      metadata: {
        description: 'Testing v2.0 schema migration',
        priority: 5,
        size: 3,
      },

      owners: {
        user_id: 101,
      },
    });

    console.log('✅ create_card test passed:', result);
    return true;
  } catch (error) {
    console.error('❌ create_card test failed:', error);
    return false;
  }
}
```

**Expected Output**:

```json
{
  "success": true,
  "card_id": 789,
  "message": "Card created successfully"
}
```

### Test 2: Update Card Collections

```typescript
async function testUpdateCard(client: Client) {
  try {
    const result = await client.callTool('update_card', {
      card_id: 789,
      title: 'Updated via v2.0',

      collections: {
        co_owner_ids_to_add: [102, 103],
        tag_ids_to_add: [201],
      },
    });

    console.log('✅ update_card test passed:', result);
    return true;
  } catch (error) {
    console.error('❌ update_card test failed:', error);
    return false;
  }
}
```

### Test 3: List Cards with Date Filters

```typescript
async function testListCards(client: Client) {
  try {
    const result = await client.callTool('list_cards', {
      board_id: 123,

      date_filters: {
        created: {
          from: '2025-01-01',
          to: '2025-12-31',
        },
      },
    });

    console.log(`✅ list_cards test passed: ${result.cards.length} cards found`);
    return true;
  } catch (error) {
    console.error('❌ list_cards test failed:', error);
    return false;
  }
}
```

### Test 4: Profile Validation

```typescript
async function testProfileSelection() {
  // Test invalid profile (should fail fast)
  process.env.BUSINESSMAP_TOOL_PROFILE = 'invalid';

  try {
    // This should throw an error
    const client = await initializeMCPClient();
    console.error('❌ Profile validation failed - should have thrown error');
    return false;
  } catch (error) {
    if (error.message.includes('invalid profile')) {
      console.log('✅ Profile validation test passed');
      return true;
    }
    console.error('❌ Wrong error message:', error);
    return false;
  }
}
```

### Running All Tests

```bash
# Install dependencies
npm install @modelcontextprotocol/sdk

# Run migration tests
npx ts-node test-migration.ts
```

---

## Common Migration Errors

### Error 1: Flat Parameters in Nested Schema

**Error Message**:

```bash
ValidationError: Invalid parameters for create_card
  - Unexpected property: lane_id (should be in placement object)
  - Unexpected property: description (should be in metadata object)
```

**Cause**: Using v1.x flat structure with v2.0 server.

**Solution**: Nest parameters correctly:

```typescript
// ❌ Wrong
createCard({
  title: 'Task',
  lane_id: 123,
  description: 'Details',
});

// ✅ Correct
createCard({
  title: 'Task',
  placement: { lane_id: 123 },
  metadata: { description: 'Details' },
});
```

---

### Error 2: Missing Collections Wrapper

**Error Message**:

```bash
ValidationError: Invalid parameters for update_card
  - Unexpected property: co_owner_ids_to_add
  - Did you mean: collections.co_owner_ids_to_add?
```

**Cause**: Array operations not wrapped in `collections` object.

**Solution**: Wrap in collections:

```typescript
// ❌ Wrong
updateCard({
  card_id: 123,
  co_owner_ids_to_add: [101, 102],
});

// ✅ Correct
updateCard({
  card_id: 123,
  collections: {
    co_owner_ids_to_add: [101, 102],
  },
});
```

---

### Error 3: Invalid Profile Selection

**Error Message**:

```text
ProfileError: Invalid tool profile 'custom'
  Valid options: minimal, standard, full
  Current selection: custom
  Set via: BUSINESSMAP_TOOL_PROFILE environment variable
```

**Cause**: Typo or invalid profile name.

**Solution**: Use valid profile name:

```bash
# ❌ Wrong
export BUSINESSMAP_TOOL_PROFILE=custom

# ✅ Correct
export BUSINESSMAP_TOOL_PROFILE=standard
```

---

### Error 4: Tool Not Available in Profile

**Error Message**:

```bash
ToolNotFoundError: Tool 'bulk_delete_cards' not available in current profile
  Current profile: minimal
  Available tools: list_boards, list_cards, get_card, create_card, ...
  Suggestion: Use BUSINESSMAP_TOOL_PROFILE=full to enable all tools
```

**Cause**: Using advanced tool with minimal profile.

**Solution**: Switch to appropriate profile:

```bash
# Switch to full profile for bulk operations
export BUSINESSMAP_TOOL_PROFILE=full
```

---

### Error 5: Flat Date Filters (Temporary Warning)

**Warning Message**:

```bash
DeprecationWarning: Flat date filters are deprecated and will be removed in v3.0
  Please migrate to nested date_filters object
  See: docs/migration/schema-compression.md#step-4-update-list_cards-calls
```

**Cause**: Still using flat `created_from`, `created_to` parameters.

**Solution**: Migrate to nested structure (see Step 4.2 above).

---

## Rollback Strategy

If you encounter critical issues during migration:

### Option 1: Temporary Rollback

Downgrade to v1.x while fixing issues:

```bash
# Package.json
{
  "dependencies": {
    "@businessmap/mcp-server": "^1.14.0"  // Last v1.x version
  }
}

npm install
```

### Option 2: Gradual Migration

Use v1.x for production, v2.0 for testing:

```typescript
// Development/Staging
const MCP_VERSION = process.env.MCP_VERSION || 'v2';

if (MCP_VERSION === 'v2') {
  // Use v2.0 nested schemas
  const params = { placement: { lane_id: 123 } };
} else {
  // Use v1.x flat schemas
  const params = { lane_id: 123 };
}
```

---

## Migration Checklist

Use this checklist to track your progress:

### Pre-Migration

- [ ] Review tool usage in your codebase
- [ ] Choose appropriate tool profile (minimal/standard/full)
- [ ] Set up test environment
- [ ] Back up current integration

### create_card Migration

- [ ] Wrap `lane_id`, `position` in `placement` object
- [ ] Wrap metadata fields in `metadata` object
- [ ] Wrap `user_id`, `co_owners` in `owners` object
- [ ] Test card creation with new schema

### update_card Migration

- [ ] Wrap array operations in `collections` object
- [ ] Keep scalar updates at top level
- [ ] Test updates with collections

### list_cards Migration

- [ ] Convert flat date filters to `date_filters` nested object
- [ ] Keep non-date filters at top level
- [ ] Test filtering with date ranges

### Testing & Validation

- [ ] Run create_card test (Test 1)
- [ ] Run update_card test (Test 2)
- [ ] Run list_cards test (Test 3)
- [ ] Run profile validation test (Test 4)
- [ ] Verify token reduction in logs

### Deployment

- [ ] Update production environment variable (BUSINESSMAP_TOOL_PROFILE)
- [ ] Deploy updated client code
- [ ] Monitor error rates
- [ ] Document migration completion

---

## Performance Validation

After migration, verify token reduction:

### Before Migration (v1.x)

```text
MCP Server Initialization:
  Total tools: 65
  Total tokens: 38,900
  Initialization time: ~2 seconds
```

### After Migration (v2.0 - Standard Profile)

```text
MCP Server Initialization:
  Profile: standard
  Total tools: 30
  Total tokens: 20,000
  Token reduction: 49%
  Initialization time: ~1.5 seconds
```

### Measuring in Your Client

```typescript
// Add token measurement
import { countTokens } from '@modelcontextprotocol/sdk/utils';

const startTokens = await client.getTokenCount();
await client.initialize();
const endTokens = await client.getTokenCount();

console.log(`Initialization cost: ${endTokens - startTokens} tokens`);
```

---

## Troubleshooting Tips

### Debug Mode

Enable detailed logging to diagnose issues:

```bash
export DEBUG=businessmap:*
export BUSINESSMAP_LOG_LEVEL=debug
```

### Schema Validation

Test parameters against schema before sending:

```typescript
import { createCardSchema } from '@businessmap/mcp-server/schemas';

function validateParams(params: unknown) {
  try {
    createCardSchema.parse(params);
    console.log('✅ Valid parameters');
    return true;
  } catch (error) {
    console.error('❌ Invalid parameters:', error.errors);
    return false;
  }
}
```

### Common Patterns

Create helper functions for common operations:

```typescript
// Helper for creating cards with nested structure
function buildCardParams(basic: {
  title: string;
  column_id: number;
  lane_id?: number;
  description?: string;
  priority?: number;
}) {
  return {
    title: basic.title,
    column_id: basic.column_id,
    ...(basic.lane_id && {
      placement: { lane_id: basic.lane_id },
    }),
    ...((basic.description || basic.priority) && {
      metadata: {
        ...(basic.description && { description: basic.description }),
        ...(basic.priority && { priority: basic.priority }),
      },
    }),
  };
}

// Usage
const params = buildCardParams({
  title: 'New task',
  column_id: 123,
  lane_id: 456,
  description: 'Details',
  priority: 8,
});
```

---

## Next Steps

After completing the migration:

1. **Monitor Performance**
   - Track token consumption over first week
   - Compare against v1.x baseline
   - Adjust tool profile if needed

2. **Update Documentation**
   - Document your chosen tool profile
   - Update internal integration guides
   - Share lessons learned with team

3. **Optimize Further**
   - Review which tools you actually use
   - Consider switching to minimal profile if possible
   - Remove unnecessary tool calls

4. **Stay Updated**
   - Watch for v3.0 announcements (flat date filters removal)
   - Subscribe to release notes
   - Join community discussions

---

## Additional Resources

- **API Documentation**: [Full schema reference](../api/schemas.md)
- **Tool Profiles**: [Detailed profile comparison](../configuration/profiles.md)
- **Examples**: [Migration examples repository](https://github.com/businessmap/mcp-migration-examples)
- **Support**: [Community forum](https://community.businessmap.io/mcp)

---

## Summary

You've successfully migrated to BusinessMap MCP v2.0! Key takeaways:

✅ **Nested structures** improve organization and reduce tokens
✅ **Profile-based loading** reduces initialization cost by 49-77%
✅ **100% functionality** preserved - only schema format changed
✅ **Easy testing** with provided test functions
✅ **Clear errors** guide you when parameters are wrong

**Token Savings**: From 38,900 to ~20,000 tokens (standard profile) = **49% reduction**

If you encountered any issues not covered in this guide, please report them at:
https://github.com/businessmap/mcp-server/issues

---

**Migration Guide Version**: 1.0
**Last Updated**: 2025-11-19
**MCP Server Version**: 2.0.0
