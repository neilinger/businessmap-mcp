# Quickstart: Complete CRUD Operations Implementation

**Feature**: 001-complete-crud-operations
**Date**: 2025-10-24
**For**: Developers implementing BusinessMap MCP CRUD operations

---

## Overview

This guide walks through implementing **17 new MCP tools** in two phases:
- **Phase 1**: 12 new operations (Comments, Subtasks, Custom Fields)
- **Phase 2**: 5 quick wins (expose existing client methods)

**Estimated Timeline**:
- Phase 1: 2-3 days
- Phase 2: 4-6 hours
- **Total**: ~3-4 days

---

## Prerequisites

✅ **Before Starting**:
1. Read `/specs/001-complete-crud-operations/research.md` - API capabilities
2. Review `/specs/001-complete-crud-operations/data-model.md` - Entity relationships
3. Check `/specs/001-complete-crud-operations/contracts/` - API contracts
4. Verify demo API access: `https://demo.kanbanize.com/api/v2`

✅ **Development Environment**:
```bash
# Verify Node.js version
node --version  # Should be ≥18.0.0

# Install dependencies
npm install

# Build project
npm run build

# Run tests
npm test

# Verify demo API connection
BUSINESSMAP_API_URL=https://demo.kanbanize.com/api/v2 \
BUSINESSMAP_API_TOKEN=8yqSN23saJOrkBOtKDjxxUaiieX6c1Pm2BYQRuBD \
node dist/index.js
```

---

## Phase 1: New Operations (10 tools)

### Step 1: Rate Limit Handling (Foundation)

**File**: `src/clients/base-client.ts`

```typescript
import axiosRetry from 'axios-retry';

// 1. Install axios-retry
// npm install axios-retry

// 2. Configure retry logic
export function configureRateLimiting(client: AxiosInstance) {
  axiosRetry(client, {
    retries: 3,
    retryCondition: (error) => {
      return error.response?.data?.error === 'RL02' ||
             error.response?.status === 429;
    },
    retryDelay: axiosRetry.exponentialDelay
  });

  // 3. Add response interceptor for quota monitoring
  client.interceptors.response.use(response => {
    const perMinRemaining = parseInt(
      response.headers['x-ratelimit-perminute-remaining'] || '30'
    );
    const perHourRemaining = parseInt(
      response.headers['x-ratelimit-perhour-remaining'] || '600'
    );

    if (perMinRemaining <= 6) { // 80% threshold
      console.warn(
        `[Rate Limit] Low quota: ${perMinRemaining}/30 per-minute remaining`
      );
    }

    return response;
  });
}
```

**Test**:
```bash
# Create test file: test/rate-limit.test.ts
npm test -- rate-limit
```

---

### Step 2: Comments (Update + Delete)

#### 2.1: Update Client Method

**File**: `src/clients/card-client.ts`

```typescript
/**
 * Update a comment on a card
 * @see /specs/001-complete-crud-operations/contracts/comments-api.yaml
 */
async updateCardComment(
  cardId: number,
  commentId: number,
  updates: {
    text?: string;
    mentions?: number[];
  }
): Promise<Comment> {
  const response = await this.client.patch(
    `/cards/${cardId}/comments/${commentId}`,
    updates
  );
  return response.data;
}

/**
 * Delete a comment from a card
 * @see /specs/001-complete-crud-operations/contracts/comments-api.yaml
 */
async deleteCardComment(
  cardId: number,
  commentId: number
): Promise<void> {
  await this.client.delete(`/cards/${cardId}/comments/${commentId}`);
}
```

#### 2.2: Define Schemas

**File**: `src/schemas/comment-schemas.ts`

```typescript
import { z } from 'zod';

export const UpdateCardCommentSchema = z.object({
  card_id: z.number().int().positive(),
  comment_id: z.number().int().positive(),
  text: z.string().min(1).max(10000).optional(),
  mentions: z.array(z.number().int().positive()).optional()
});

export const DeleteCardCommentSchema = z.object({
  card_id: z.number().int().positive(),
  comment_id: z.number().int().positive()
});
```

#### 2.3: Create MCP Tools

**File**: `src/tools/comment-tools.ts`

```typescript
import { UpdateCardCommentSchema, DeleteCardCommentSchema } from '../schemas/comment-schemas';

export const updateCardCommentTool = {
  name: 'update_card_comment',
  description: 'Update a comment on a BusinessMap card',
  inputSchema: zodToJsonSchema(UpdateCardCommentSchema),
  handler: async (args: z.infer<typeof UpdateCardCommentSchema>) => {
    const { card_id, comment_id, ...updates } = args;
    const result = await cardClient.updateCardComment(
      card_id,
      comment_id,
      updates
    );
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }
};

export const deleteCardCommentTool = {
  name: 'delete_card_comment',
  description: 'Delete a comment from a BusinessMap card',
  inputSchema: zodToJsonSchema(DeleteCardCommentSchema),
  handler: async (args: z.infer<typeof DeleteCardCommentSchema>) => {
    await cardClient.deleteCardComment(args.card_id, args.comment_id);
    return {
      content: [{
        type: 'text',
        text: `Comment ${args.comment_id} deleted successfully`
      }]
    };
  }
};
```

#### 2.4: Register Tools

**File**: `src/index.ts`

```typescript
import { updateCardCommentTool, deleteCardCommentTool } from './tools/comment-tools';

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    // ... existing tools ...
    updateCardCommentTool,
    deleteCardCommentTool
  ]
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    // ... existing cases ...
    case 'update_card_comment':
      return updateCardCommentTool.handler(args);
    case 'delete_card_comment':
      return deleteCardCommentTool.handler(args);
  }
});
```

#### 2.5: Test

```bash
# Integration test against demo API
npm test -- comment-crud

# Manual test with MCP inspector
npx @modelcontextprotocol/inspector dist/index.js
```

**Repeat Steps 2.1-2.5 for Subtasks** (same pattern, different endpoints)

---

### Step 3: Custom Fields (6 operations)

#### 3.1: Create Client Module

**File**: `src/clients/custom-field-client.ts` (NEW FILE)

```typescript
import { AxiosInstance } from 'axios';

export interface CustomField {
  field_id: number;
  board_id: number;
  name: string;
  label: string;
  field_type: 'text' | 'number' | 'date' | 'dropdown' | 'checkbox' | 'user';
  is_required: boolean;
  options?: string[];
  default_value?: any;
  position: number;
  is_visible: boolean;
}

export class CustomFieldClient {
  constructor(private client: AxiosInstance) {}

  /**
   * List all custom field definitions across workspace
   * @see /specs/001-complete-crud-operations/contracts/custom-fields-api.yaml
   */
  async listCustomFields(): Promise<CustomField[]> {
    const response = await this.client.get('/customFields');
    return response.data;
  }

  /**
   * List custom field definitions for a specific board
   */
  async listBoardCustomFields(boardId: number): Promise<CustomField[]> {
    const response = await this.client.get(`/boards/${boardId}/customFields`);
    return response.data;
  }

  /**
   * Get single custom field definition details
   */
  async getCustomField(
    boardId: number,
    fieldId: number
  ): Promise<CustomField> {
    const response = await this.client.get(
      `/boards/${boardId}/customFields/${fieldId}`
    );
    return response.data;
  }

  /**
   * Create new custom field definition
   */
  async createCustomField(
    boardId: number,
    field: Omit<CustomField, 'field_id'>
  ): Promise<CustomField> {
    const response = await this.client.post(
      `/boards/${boardId}/customFields`,
      field
    );
    return response.data;
  }

  /**
   * Update custom field definition
   */
  async updateCustomField(
    boardId: number,
    fieldId: number,
    updates: Partial<Omit<CustomField, 'field_id' | 'board_id'>>
  ): Promise<CustomField> {
    const response = await this.client.patch(
      `/boards/${boardId}/customFields/${fieldId}`,
      updates
    );
    return response.data;
  }

  /**
   * Delete custom field definition (cascades to values)
   */
  async deleteCustomField(
    boardId: number,
    fieldId: number
  ): Promise<void> {
    await this.client.delete(`/boards/${boardId}/customFields/${fieldId}`);
  }
}
```

#### 3.2: Define Schemas

**File**: `src/schemas/custom-field-schemas.ts` (NEW FILE)

```typescript
import { z } from 'zod';

export const CustomFieldTypeSchema = z.enum([
  'text',
  'number',
  'date',
  'dropdown',
  'checkbox',
  'user'
]);

export const CreateCustomFieldSchema = z.object({
  board_id: z.number().int().positive(),
  name: z.string().min(1).max(255),
  label: z.string().min(1).max(255),
  field_type: CustomFieldTypeSchema,
  is_required: z.boolean().default(false),
  options: z.array(z.string()).optional(),
  default_value: z.any().optional(),
  position: z.number().int().nonnegative(),
  is_visible: z.boolean().default(true)
});

export const UpdateCustomFieldSchema = z.object({
  board_id: z.number().int().positive(),
  field_id: z.number().int().positive(),
  name: z.string().min(1).max(255).optional(),
  label: z.string().min(1).max(255).optional(),
  is_required: z.boolean().optional(),
  options: z.array(z.string()).optional(),
  default_value: z.any().optional(),
  position: z.number().int().nonnegative().optional(),
  is_visible: z.boolean().optional()
});

// ... similar schemas for list, get, delete
```

#### 3.3: Create Tools (follow comment pattern)

**File**: `src/tools/custom-field-tools.ts` (NEW FILE)

- `list_custom_fields`
- `list_board_custom_fields`
- `get_custom_field`
- `create_custom_field`
- `update_custom_field`
- `delete_custom_field`

#### 3.4: Test

```bash
npm test -- custom-field-crud
```

---

## Phase 2: Quick Wins (5 tools)

**Goal**: Expose existing client methods as MCP tools (client code already exists)

### Step 1: Workspace Update/Delete

**Files to modify**:
- `src/schemas/workspace-schemas.ts` - Add update/delete schemas
- `src/tools/workspace-tools.ts` - Add tools
- `src/index.ts` - Register tools

**Pattern** (same for all Phase 2 operations):

```typescript
// 1. Schema (if not exists)
export const UpdateWorkspaceSchema = z.object({
  workspace_id: z.number().int().positive(),
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional()
});

// 2. Tool definition
export const updateWorkspaceTool = {
  name: 'update_workspace',
  description: 'Update a BusinessMap workspace',
  inputSchema: zodToJsonSchema(UpdateWorkspaceSchema),
  handler: async (args: z.infer<typeof UpdateWorkspaceSchema>) => {
    const { workspace_id, ...updates } = args;
    const result = await workspaceClient.updateWorkspace(workspace_id, updates);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }
};

// 3. Register in index.ts (add to tools array + switch case)
```

**Repeat for**:
- Workspace: update, delete
- Board: update, delete
- Card: delete

---

## Testing Strategy

### Unit Tests

**File**: `test/unit/client-methods.test.ts`

```typescript
import { CardClient } from '../../src/clients/card-client';
import MockAdapter from 'axios-mock-adapter';

describe('CardClient - Comments', () => {
  let client: CardClient;
  let mock: MockAdapter;

  beforeEach(() => {
    const axios = createAxiosInstance();
    mock = new MockAdapter(axios);
    client = new CardClient(axios);
  });

  it('should update comment', async () => {
    mock.onPatch('/cards/123/comments/456').reply(200, {
      comment_id: 456,
      text: 'Updated text'
    });

    const result = await client.updateCardComment(123, 456, {
      text: 'Updated text'
    });

    expect(result.comment_id).toBe(456);
    expect(result.text).toBe('Updated text');
  });

  it('should delete comment', async () => {
    mock.onDelete('/cards/123/comments/456').reply(204);

    await expect(
      client.deleteCardComment(123, 456)
    ).resolves.not.toThrow();
  });
});
```

### Integration Tests

**File**: `test/integration/crud-operations.test.ts`

```typescript
import { setupTestEnvironment, cleanupTestData } from './test-helpers';

describe('CRUD Operations - Integration', () => {
  beforeAll(async () => {
    await setupTestEnvironment();
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  it('should complete full comment lifecycle', async () => {
    // 1. Create card
    const card = await cardClient.createCard({
      board_id: TEST_BOARD_ID,
      column_id: TEST_COLUMN_ID,
      title: 'Test Card for Comments'
    });

    // 2. Create comment
    const comment = await cardClient.createCardComment(card.card_id, {
      text: 'Initial comment'
    });
    expect(comment.text).toBe('Initial comment');

    // 3. Update comment
    const updated = await cardClient.updateCardComment(
      card.card_id,
      comment.comment_id,
      { text: 'Updated comment' }
    );
    expect(updated.text).toBe('Updated comment');

    // 4. Delete comment
    await cardClient.deleteCardComment(card.card_id, comment.comment_id);

    // 5. Verify deletion
    const comments = await cardClient.getCardComments(card.card_id);
    expect(comments).not.toContainEqual(
      expect.objectContaining({ comment_id: comment.comment_id })
    );

    // Cleanup
    await cardClient.deleteCard(card.card_id);
  });
});
```

### MCP Tool Tests

**File**: `test/integration/mcp-tools.test.ts`

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';

describe('MCP Tools - Integration', () => {
  let server: McpServer;

  beforeAll(() => {
    server = createMcpServer();
  });

  it('should update comment via MCP tool', async () => {
    const request: CallToolRequest = {
      method: 'tools/call',
      params: {
        name: 'update_card_comment',
        arguments: {
          card_id: TEST_CARD_ID,
          comment_id: TEST_COMMENT_ID,
          text: 'MCP updated comment'
        }
      }
    };

    const response = await server.handleRequest(request);
    const result = JSON.parse(response.content[0].text);

    expect(result.comment_id).toBe(TEST_COMMENT_ID);
    expect(result.text).toBe('MCP updated comment');
  });
});
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] All unit tests passing (`npm test`)
- [ ] All integration tests passing against demo API
- [ ] MCP tools tested with inspector
- [ ] Rate limit handling verified (trigger RL02 error intentionally)
- [ ] OpenAPI contracts validated (`cd contracts && ./validate-all.sh`)
- [ ] TypeScript types generated from contracts
- [ ] Documentation updated (README.md, CHANGELOG.md)
- [ ] Version bumped in package.json

### Deployment

- [ ] Merge feature branch to main
- [ ] Tag release (e.g., `v1.1.0`)
- [ ] Publish to npm (if applicable)
- [ ] Update MCP marketplace listing

### Post-Deployment

- [ ] Monitor rate limit warnings in logs
- [ ] Track error rates (especially RL02)
- [ ] Gather user feedback on new tools
- [ ] Document any API quirks discovered

---

## Troubleshooting

### Rate Limit Errors (RL02)

**Symptom**: `BusinessMapError: RL02 - Rate limit exceeded`

**Solution**:
```typescript
// Check current quota
const headers = lastResponse.headers;
console.log('Per-minute remaining:', headers['x-ratelimit-perminute-remaining']);
console.log('Per-hour remaining:', headers['x-ratelimit-perhour-remaining']);

// Adjust retry strategy if needed
axiosRetry(client, {
  retries: 5,  // Increase retries
  retryDelay: (retryCount) => retryCount * 2000  // Longer delays
});
```

### Custom Field Type Validation

**Symptom**: `Cannot update custom field - incompatible existing values`

**Solution**:
1. Check existing field values on cards
2. If migrating type (e.g., text → number), clear incompatible values first
3. Or use field type that preserves data (text → dropdown with "Other" option)

### Cascade Delete Confirmation

**Symptom**: Delete fails with "contains dependent resources"

**Solution**:
```typescript
// For workspaces
await workspaceClient.deleteWorkspace(workspace_id, { force: true });

// For boards
await boardClient.deleteBoard(board_id, {
  force: true,
  archive_first: true  // Optional: archive before delete
});

// For cards
await cardClient.deleteCard(card_id, {
  force: true,
  cascade_children: true,
  cascade_subtasks: true,
  cascade_comments: true
});
```

### Demo API vs Production Differences

**Symptom**: Works on demo, fails in production

**Solution**:
1. Check API version (demo may have newer features)
2. Verify permissions (production may have stricter access controls)
3. Check custom plan limits (production may have different rate limits)
4. Test against both environments before releasing

---

## Performance Optimization

### Batch Operations

```typescript
// BAD: Sequential with no throttling
for (const card of cards) {
  await updateCard(card.id, updates);
}

// GOOD: Sequential with rate limit awareness
for (const card of cards) {
  await updateCard(card.id, updates);
  await sleep(100);  // 100ms between requests = ~10/sec (well under 30/min)
}

// BETTER: Queue-based with automatic throttling
const queue = new PQueue({ concurrency: 1, interval: 2000, intervalCap: 1 });
await Promise.all(
  cards.map(card =>
    queue.add(() => updateCard(card.id, updates))
  )
);
```

### Caching

```typescript
// Cache board structure (rarely changes)
const boardCache = new Map<number, Board>();

async function getBoardCached(boardId: number): Promise<Board> {
  if (!boardCache.has(boardId)) {
    const board = await boardClient.getBoard(boardId);
    boardCache.set(boardId, board);
    setTimeout(() => boardCache.delete(boardId), 5 * 60 * 1000);  // 5min TTL
  }
  return boardCache.get(boardId)!;
}
```

---

## Next Steps

1. ✅ **Phase 1**: Implement 12 new operations (Comments, Subtasks, Custom Fields)
2. ✅ **Phase 2**: Expose 5 quick wins (Workspace, Board, Card)
3. ⏭️ **Phase 3**: Column DELETE testing (verify endpoint exists)
4. ⏭️ **Optimization**: Add request queue if load testing shows bottlenecks
5. ⏭️ **Documentation**: Create video tutorial for MCP tool usage

---

## References

- **BusinessMap API Documentation** (Official Source):
  - Interactive Docs: https://demo.kanbanize.com/openapi (for browsing and testing)
  - JSON Schema: https://demo.kanbanize.com/openapi/json (for code generation)
- **Research**: `/specs/001-complete-crud-operations/research.md`
- **Data Model**: `/specs/001-complete-crud-operations/data-model.md`
- **Contracts**: `/specs/001-complete-crud-operations/contracts/`
- **Spec**: `/specs/001-complete-crud-operations/spec.md`
- **MCP SDK**: https://github.com/modelcontextprotocol/typescript-sdk

---

**Guide Version**: 1.0.0
**Last Updated**: 2025-10-24
**Estimated Time**: 3-4 days total
**Difficulty**: Intermediate
