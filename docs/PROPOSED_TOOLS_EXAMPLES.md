# Proposed MCP Tools - Implementation Examples

Concrete examples of how the recommended `get_help` and `setup` tools would work.

## Tool #1: `get_help`

### Purpose
Provide contextual help, troubleshooting, and best practices in-session for all MCP clients.

### TypeScript Implementation

```typescript
// src/tools/help.ts

import { z } from 'zod';

const GetHelpInputSchema = z.object({
  topic: z.enum([
    'workflows',
    'troubleshooting',
    'best-practices',
    'error-codes',
    'overview'
  ]).optional(),
  error_code: z.string().optional(),
  operation: z.string().optional()
});

type GetHelpInput = z.infer<typeof GetHelpInputSchema>;

interface HelpResponse {
  title: string;
  content: string;
  related_tools?: string[];
  documentation_link?: string;
  examples?: string[];
}

/**
 * Provides contextual help, troubleshooting guides, and best practices.
 *
 * @param input - Help request parameters
 * @returns Relevant help content with examples and links
 *
 * @example
 * // Get help for specific error
 * get_help({ topic: 'error-codes', error_code: 'BS05' })
 *
 * @example
 * // Get best practices for operation
 * get_help({ topic: 'best-practices', operation: 'bulk-delete' })
 *
 * @example
 * // Get workflow guidance
 * get_help({ topic: 'workflows', operation: 'card-migration' })
 */
export async function getHelp(input: GetHelpInput): Promise<HelpResponse> {
  const { topic, error_code, operation } = input;

  // Error code lookup
  if (topic === 'error-codes' && error_code) {
    return getErrorCodeHelp(error_code);
  }

  // Operation-specific help
  if (operation) {
    return getOperationHelp(topic || 'workflows', operation);
  }

  // Topic overview
  return getTopicOverview(topic || 'overview');
}

function getErrorCodeHelp(code: string): HelpResponse {
  const errorDocs = {
    'BS05': {
      title: 'Error BS05: Board Not Archived',
      content: `
**Cause**: Attempting to DELETE board that hasn't been archived first.

**Solution**:
The BusinessMap API requires boards to be archived before deletion.
Use the 'archive_first' parameter to handle this automatically:

\`\`\`bash
delete_board(board_id=123, archive_first=true)
\`\`\`

This will:
1. Archive the board (PATCH with is_archived=1)
2. Then delete it (DELETE)

**Manual Workflow**:
\`\`\`bash
# Step 1: Archive
update_board(board_id=123, is_archived=1)

# Step 2: Delete
delete_board(board_id=123, archive_first=false)
\`\`\`
`,
      related_tools: ['delete_board', 'bulk_delete_boards', 'update_board'],
      documentation_link: 'docs/guides/troubleshooting.md#bs05',
      examples: [
        'delete_board(board_id=123, archive_first=true)',
        'bulk_delete_boards(resource_ids=[123, 456], archive_first=true)'
      ]
    },
    '403': {
      title: 'HTTP 403: Forbidden',
      content: `
**Cause**: Insufficient permissions or invalid API token.

**Common Causes**:
1. API token invalid/expired
2. User lacks required role (workspace_admin for delete operations)
3. Read-only mode enabled

**Diagnostic Steps**:
\`\`\`bash
# 1. Verify token works
health_check()

# 2. Check current user
get_current_user()

# 3. Verify read-only mode
# Check: BUSINESSMAP_READ_ONLY_MODE environment variable
\`\`\`

**Solutions**:
- Regenerate API token in BusinessMap settings
- Request elevated permissions from workspace admin
- Disable read-only mode if intentional
`,
      related_tools: ['health_check', 'get_current_user'],
      documentation_link: 'docs/guides/troubleshooting.md#http-403'
    },
    '429': {
      title: 'HTTP 429: Rate Limit Exceeded',
      content: `
**Cause**: Exceeded API rate limits (30 req/min, 600 req/hour).

**Immediate Action**:
- Wait 60 seconds before retrying
- Check rate limit headers in response

**Prevention Strategies**:
1. **Use Bulk Operations** (max 50 resources per call):
   \`\`\`bash
   # ❌ 50 API calls
   for card_id in card_ids:
       delete_card(card_id)

   # ✅ 1 API call
   bulk_delete_cards(resource_ids=card_ids[:50])
   \`\`\`

2. **Implement Rate Limiting**:
   \`\`\`python
   import time
   for batch in chunks(card_ids, 50):
       bulk_delete_cards(resource_ids=batch)
       time.sleep(2)  # 30 calls/min = 2s between calls
   \`\`\`

3. **Use Pagination Efficiently**:
   \`\`\`bash
   # Max page size to minimize requests
   list_cards(board_id=123, per_page=1000)
   \`\`\`
`,
      related_tools: [
        'bulk_delete_cards',
        'bulk_update_cards',
        'bulk_delete_boards'
      ],
      documentation_link: 'docs/guides/best-practices.md#rate-limiting'
    }
  };

  return errorDocs[code] || {
    title: `Error Code: ${code}`,
    content: 'Error code not recognized. See docs/guides/troubleshooting.md',
    documentation_link: 'docs/guides/troubleshooting.md'
  };
}

function getOperationHelp(topic: string, operation: string): HelpResponse {
  const operationDocs = {
    'bulk-delete': {
      title: 'Bulk Delete Operations - Best Practices',
      content: `
**Overview**: Delete up to 50 resources per call with dependency analysis.

**Available Tools**:
- bulk_delete_cards(resource_ids, analyze_dependencies=true)
- bulk_delete_boards(resource_ids, archive_first=true)
- bulk_archive_workspaces(resource_ids)

**Best Practices**:

1. **Batch in groups of 50**:
   \`\`\`python
   for batch in chunks(card_ids, 50):
       bulk_delete_cards(resource_ids=batch)
       time.sleep(2)  # Rate limiting
   \`\`\`

2. **Enable dependency analysis**:
   \`\`\`bash
   bulk_delete_cards(
       resource_ids=[123, 456, 789],
       analyze_dependencies=true  # Shows what will be deleted
   )
   \`\`\`

3. **Handle confirmations**:
   - Tool shows dependency tree
   - Review impact before confirming
   - Example: "12 cards → 45 subtasks, 23 comments"

**Performance**:
- 50x fewer API calls vs individual deletes
- Automatic rate limiting
- Consolidated error handling
`,
      related_tools: [
        'bulk_delete_cards',
        'bulk_delete_boards',
        'bulk_archive_workspaces'
      ],
      documentation_link: 'docs/guides/best-practices.md#bulk-operations',
      examples: [
        'bulk_delete_cards(resource_ids=[1,2,3], analyze_dependencies=true)',
        'bulk_delete_boards(resource_ids=[10,20], archive_first=true)'
      ]
    },
    'card-migration': {
      title: 'Card Migration Workflow',
      content: `
**Goal**: Migrate cards from one board to another.

**Workflow**:

1. **List source cards**:
   \`\`\`bash
   source_cards = list_cards(
       board_id=source_board_id,
       per_page=1000  # Max page size
   )
   \`\`\`

2. **Get destination board structure**:
   \`\`\`bash
   dest_structure = get_current_board_structure(board_id=dest_board_id)
   # Note: column_ids, lane_ids for placement
   \`\`\`

3. **Create cards in batches**:
   \`\`\`python
   for card in source_cards:
       create_card(
           title=card.title,
           description=card.description,
           column_id=dest_column_id,
           lane_id=dest_lane_id,
           # Preserve metadata
           priority=card.priority,
           size=card.size,
           deadline=card.deadline
       )
       time.sleep(0.1)  # Rate limiting
   \`\`\`

4. **Handle parent-child relationships**:
   \`\`\`bash
   # After creating all cards
   for parent_id, child_id in relationships:
       add_card_parent(
           card_id=new_child_id,
           parent_card_id=new_parent_id
       )
   \`\`\`

**Rate Limiting**: 30 req/min = 2s between calls minimum.
`,
      related_tools: [
        'list_cards',
        'get_current_board_structure',
        'create_card',
        'add_card_parent'
      ],
      documentation_link: 'docs/guides/workflows-and-patterns.md#card-migration'
    }
  };

  return operationDocs[operation] || {
    title: `Operation: ${operation}`,
    content: 'Operation not documented. See docs/guides/ for available patterns.',
    documentation_link: `docs/guides/${topic}.md`
  };
}

function getTopicOverview(topic: string): HelpResponse {
  const topicDocs = {
    'overview': {
      title: 'BusinessMap MCP - Help System',
      content: `
**Available Help Topics**:

1. **Workflows** - Common patterns and integration workflows
   \`get_help(topic='workflows', operation='card-migration')\`

2. **Troubleshooting** - Error codes and diagnostics
   \`get_help(topic='error-codes', error_code='BS05')\`

3. **Best Practices** - Performance and production patterns
   \`get_help(topic='best-practices', operation='bulk-delete')\`

**Quick Links**:
- Full documentation: docs/guides/
- Troubleshooting: docs/guides/troubleshooting.md
- Best practices: docs/guides/best-practices.md
- Workflows: docs/guides/workflows-and-patterns.md

**Common Operations**:
- bulk-delete, card-migration, board-setup
- custom-fields, parent-child-relationships
`,
      documentation_link: 'README.md'
    }
  };

  return topicDocs[topic] || topicDocs['overview'];
}
```

### MCP Tool Registration

```typescript
// src/index.ts

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    // ... existing 65 tools ...

    {
      name: 'get_help',
      description: 'Get contextual help, troubleshooting guides, and best practices',
      inputSchema: {
        type: 'object',
        properties: {
          topic: {
            type: 'string',
            enum: ['workflows', 'troubleshooting', 'best-practices', 'error-codes', 'overview'],
            description: 'Help topic category'
          },
          error_code: {
            type: 'string',
            description: 'Specific error code (BS05, 403, 404, 429)'
          },
          operation: {
            type: 'string',
            description: 'Specific operation (bulk-delete, card-migration, etc.)'
          }
        }
      }
    }
  ]
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === 'get_help') {
    const input = GetHelpInputSchema.parse(request.params.arguments);
    const result = await getHelp(input);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  // ... handle other tools ...
});
```

### Usage Examples

#### Example 1: Error Encountered

```bash
# User gets BS05 error during delete_board
> delete_board(board_id=123)
Error: BS05 - Board must be archived before deletion

# User asks for help
> get_help(topic='error-codes', error_code='BS05')

Returns:
{
  "title": "Error BS05: Board Not Archived",
  "content": "...[solution with code examples]...",
  "related_tools": ["delete_board", "bulk_delete_boards"],
  "documentation_link": "docs/guides/troubleshooting.md#bs05",
  "examples": [
    "delete_board(board_id=123, archive_first=true)"
  ]
}
```

#### Example 2: Planning Bulk Operations

```bash
# User planning to delete 100 cards
> get_help(topic='best-practices', operation='bulk-delete')

Returns:
{
  "title": "Bulk Delete Operations - Best Practices",
  "content": "...[batching strategy, rate limiting]...",
  "related_tools": ["bulk_delete_cards", "bulk_delete_boards"],
  "examples": [
    "bulk_delete_cards(resource_ids=[1,2,3], analyze_dependencies=true)"
  ]
}
```

---

## Tool #2: `setup`

### Purpose
Interactive setup, validation, and onboarding for new users.

### TypeScript Implementation

```typescript
// src/tools/setup.ts

import { z } from 'zod';
import { businessmapClient } from './client';

const SetupInputSchema = z.object({
  action: z.enum(['validate', 'diagnose', 'quickstart'])
});

type SetupInput = z.infer<typeof SetupInputSchema>;

interface SetupResponse {
  action: string;
  status: 'success' | 'warning' | 'error';
  message: string;
  details?: any;
  next_steps?: string[];
}

/**
 * Setup and validation tool for new BusinessMap MCP users.
 *
 * Actions:
 * - validate: Check API connection, authentication, and permissions
 * - diagnose: Run comprehensive diagnostics with resource counts
 * - quickstart: Provide step-by-step onboarding workflow
 *
 * @example
 * // Validate configuration
 * setup({ action: 'validate' })
 *
 * @example
 * // Get diagnostic info
 * setup({ action: 'diagnose' })
 *
 * @example
 * // Onboarding workflow
 * setup({ action: 'quickstart' })
 */
export async function setup(input: SetupInput): Promise<SetupResponse> {
  const { action } = input;

  switch (action) {
    case 'validate':
      return await validateSetup();

    case 'diagnose':
      return await diagnoseSetup();

    case 'quickstart':
      return getQuickstart();
  }
}

async function validateSetup(): Promise<SetupResponse> {
  const checks = {
    environment: false,
    connection: false,
    authentication: false
  };

  const details: any = {};

  try {
    // 1. Check environment variables
    const apiUrl = process.env.BUSINESSMAP_API_URL;
    const apiToken = process.env.BUSINESSMAP_API_TOKEN;

    if (!apiUrl || !apiToken) {
      return {
        action: 'validate',
        status: 'error',
        message: 'Missing required environment variables',
        details: {
          BUSINESSMAP_API_URL: apiUrl ? 'Set' : 'Missing',
          BUSINESSMAP_API_TOKEN: apiToken ? 'Set' : 'Missing'
        },
        next_steps: [
          'Set BUSINESSMAP_API_URL in your MCP client configuration',
          'Set BUSINESSMAP_API_TOKEN with your API token',
          'Restart MCP client after configuration'
        ]
      };
    }

    checks.environment = true;
    details.environment = 'OK';

    // 2. Test API connection
    const healthResponse = await businessmapClient.get('/info');
    checks.connection = healthResponse.status === 200;
    details.connection = checks.connection ? 'OK' : 'Failed';

    // 3. Test authentication
    const userResponse = await businessmapClient.get('/users/current');
    checks.authentication = userResponse.status === 200;
    details.authentication = checks.authentication ? 'OK' : 'Failed';
    details.user = userResponse.data;

    // All checks passed
    return {
      action: 'validate',
      status: 'success',
      message: 'Configuration validated successfully',
      details: {
        environment: 'OK',
        connection: 'OK',
        authentication: 'OK',
        user: details.user.email,
        api_version: healthResponse.data.api_version
      },
      next_steps: [
        'Run setup(action="quickstart") for onboarding workflow',
        'Or start exploring with list_workspaces()'
      ]
    };

  } catch (error: any) {
    return {
      action: 'validate',
      status: 'error',
      message: 'Validation failed',
      details: {
        ...checks,
        error: error.message
      },
      next_steps: [
        'Verify BUSINESSMAP_API_URL is correct',
        'Verify BUSINESSMAP_API_TOKEN is valid',
        'Check BusinessMap service status',
        'See docs/guides/troubleshooting.md for detailed diagnostics'
      ]
    };
  }
}

async function diagnoseSetup(): Promise<SetupResponse> {
  try {
    // Gather comprehensive diagnostic info
    const [userInfo, workspaces, apiInfo] = await Promise.all([
      businessmapClient.get('/users/current'),
      businessmapClient.get('/workspaces'),
      businessmapClient.get('/info')
    ]);

    const workspaceIds = workspaces.data.map((w: any) => w.workspace_id);
    const boardCounts = await Promise.all(
      workspaceIds.map((id: number) =>
        businessmapClient.get('/boards', { params: { workspace_ids: [id] } })
      )
    );

    const totalBoards = boardCounts.reduce(
      (sum, res) => sum + (res.data?.length || 0),
      0
    );

    // Get rate limit info from headers
    const rateLimitRemaining = parseInt(
      userInfo.headers['x-ratelimit-remaining'] || '0'
    );
    const rateLimitLimit = parseInt(
      userInfo.headers['x-ratelimit-limit'] || '600'
    );

    return {
      action: 'diagnose',
      status: 'success',
      message: 'Diagnostic information gathered',
      details: {
        api: {
          url: process.env.BUSINESSMAP_API_URL,
          version: apiInfo.data.api_version,
          read_only_mode: process.env.BUSINESSMAP_READ_ONLY_MODE === 'true'
        },
        authentication: {
          user_email: userInfo.data.email,
          user_id: userInfo.data.user_id,
          is_admin: userInfo.data.is_admin
        },
        resources: {
          workspaces: workspaces.data.length,
          boards: totalBoards,
          accessible_workspace_ids: workspaceIds
        },
        rate_limits: {
          remaining: rateLimitRemaining,
          limit: rateLimitLimit,
          percentage_used: Math.round(
            ((rateLimitLimit - rateLimitRemaining) / rateLimitLimit) * 100
          )
        }
      },
      next_steps: [
        `You have access to ${workspaces.data.length} workspaces and ${totalBoards} boards`,
        'Run list_boards() to explore available boards',
        'See docs/guides/workflows-and-patterns.md for common workflows'
      ]
    };

  } catch (error: any) {
    return {
      action: 'diagnose',
      status: 'error',
      message: 'Diagnostics failed',
      details: {
        error: error.message,
        status: error.response?.status
      },
      next_steps: [
        'Run setup(action="validate") to check basic connectivity',
        'See get_help(topic="troubleshooting") for error diagnosis'
      ]
    };
  }
}

function getQuickstart(): SetupResponse {
  return {
    action: 'quickstart',
    status: 'success',
    message: 'BusinessMap MCP Quick Start Guide',
    details: {
      workflow: [
        {
          step: 1,
          action: 'List workspaces',
          tool: 'list_workspaces()',
          description: 'See all accessible workspaces'
        },
        {
          step: 2,
          action: 'Explore boards',
          tool: 'list_boards(workspace_id=1)',
          description: 'List boards in a workspace (replace 1 with your workspace_id)'
        },
        {
          step: 3,
          action: 'View board structure',
          tool: 'get_current_board_structure(board_id=123)',
          description: 'Understand board layout (replace 123 with your board_id)'
        },
        {
          step: 4,
          action: 'List cards',
          tool: 'list_cards(board_id=123, per_page=10)',
          description: 'See cards on a board'
        },
        {
          step: 5,
          action: 'Get card details',
          tool: 'get_card(card_id=456)',
          description: 'View complete card information'
        }
      ]
    },
    next_steps: [
      'Copy and run tools from workflow above',
      'For advanced workflows: docs/guides/workflows-and-patterns.md',
      'For troubleshooting: get_help(topic="error-codes")',
      'For best practices: docs/guides/best-practices.md'
    ]
  };
}
```

### MCP Tool Registration

```typescript
// src/index.ts

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    // ... existing tools + get_help ...

    {
      name: 'setup',
      description: 'Setup, validation, and onboarding for BusinessMap MCP',
      inputSchema: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['validate', 'diagnose', 'quickstart'],
            description: 'Setup action to perform'
          }
        },
        required: ['action']
      }
    }
  ]
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === 'setup') {
    const input = SetupInputSchema.parse(request.params.arguments);
    const result = await setup(input);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  // ... handle other tools ...
});
```

### Usage Examples

#### Example 1: First-Time User

```bash
# User just installed BusinessMap MCP
> setup(action='validate')

Returns:
{
  "action": "validate",
  "status": "success",
  "message": "Configuration validated successfully",
  "details": {
    "environment": "OK",
    "connection": "OK",
    "authentication": "OK",
    "user": "user@example.com",
    "api_version": "v2"
  },
  "next_steps": [
    "Run setup(action='quickstart') for onboarding workflow",
    "Or start exploring with list_workspaces()"
  ]
}
```

#### Example 2: Configuration Issues

```bash
# User has wrong API URL
> setup(action='validate')

Returns:
{
  "action": "validate",
  "status": "error",
  "message": "Validation failed",
  "details": {
    "environment": true,
    "connection": false,
    "authentication": false,
    "error": "ENOTFOUND demo.kanbanize.com"
  },
  "next_steps": [
    "Verify BUSINESSMAP_API_URL is correct",
    "Verify BUSINESSMAP_API_TOKEN is valid",
    "Check BusinessMap service status"
  ]
}
```

#### Example 3: Onboarding Workflow

```bash
# User wants step-by-step guide
> setup(action='quickstart')

Returns:
{
  "action": "quickstart",
  "status": "success",
  "message": "BusinessMap MCP Quick Start Guide",
  "details": {
    "workflow": [
      {
        "step": 1,
        "action": "List workspaces",
        "tool": "list_workspaces()",
        "description": "See all accessible workspaces"
      },
      {
        "step": 2,
        "action": "Explore boards",
        "tool": "list_boards(workspace_id=1)",
        "description": "List boards in a workspace"
      },
      ...
    ]
  },
  "next_steps": [
    "Copy and run tools from workflow above",
    "For advanced workflows: docs/guides/workflows-and-patterns.md"
  ]
}
```

#### Example 4: Diagnostic Deep Dive

```bash
# User wants full system diagnostics
> setup(action='diagnose')

Returns:
{
  "action": "diagnose",
  "status": "success",
  "message": "Diagnostic information gathered",
  "details": {
    "api": {
      "url": "https://demo.kanbanize.com/api/v2",
      "version": "v2",
      "read_only_mode": false
    },
    "authentication": {
      "user_email": "user@example.com",
      "user_id": 123,
      "is_admin": true
    },
    "resources": {
      "workspaces": 3,
      "boards": 12,
      "accessible_workspace_ids": [1, 2, 3]
    },
    "rate_limits": {
      "remaining": 595,
      "limit": 600,
      "percentage_used": 1
    }
  },
  "next_steps": [
    "You have access to 3 workspaces and 12 boards",
    "Run list_boards() to explore available boards"
  ]
}
```

---

## Testing Across MCP Clients

### Test Suite

```bash
# tests/tools/help.test.ts

describe('get_help tool', () => {
  it('returns error code help', async () => {
    const result = await getHelp({
      topic: 'error-codes',
      error_code: 'BS05'
    });

    expect(result.title).toContain('BS05');
    expect(result.content).toContain('archive_first');
    expect(result.related_tools).toContain('delete_board');
  });

  it('returns operation help', async () => {
    const result = await getHelp({
      topic: 'best-practices',
      operation: 'bulk-delete'
    });

    expect(result.title).toContain('Bulk Delete');
    expect(result.content).toContain('50 resources');
  });

  it('returns overview without params', async () => {
    const result = await getHelp({});

    expect(result.title).toContain('Help System');
    expect(result.content).toContain('workflows');
  });
});

# tests/tools/setup.test.ts

describe('setup tool', () => {
  it('validates configuration successfully', async () => {
    const result = await setup({ action: 'validate' });

    expect(result.status).toBe('success');
    expect(result.details.environment).toBe('OK');
    expect(result.details.connection).toBe('OK');
  });

  it('provides quickstart workflow', async () => {
    const result = await setup({ action: 'quickstart' });

    expect(result.details.workflow).toHaveLength(5);
    expect(result.details.workflow[0].tool).toBe('list_workspaces()');
  });

  it('runs comprehensive diagnostics', async () => {
    const result = await setup({ action: 'diagnose' });

    expect(result.details.api).toBeDefined();
    expect(result.details.resources).toBeDefined();
    expect(result.details.rate_limits).toBeDefined();
  });
});
```

### Client Compatibility Matrix

| Client | `get_help` | `setup` | Skills | Notes |
|--------|-----------|---------|--------|-------|
| Claude Desktop | ✅ | ✅ | ✅ Manual | All features work |
| Cursor | ✅ | ✅ | ❌ | Tools work, no skills |
| Claude Code | ✅ | ✅ | ✅ Auto | Best experience |
| Cline (VSCode) | ✅ | ✅ | ❌ | Tools work, no skills |
| Continue | ✅ | ✅ | ❌ | Tools work, no skills |

---

## Token Budget Analysis

### `get_help` Tool

**Average Response Sizes**:
- Error code help: ~300-500 tokens
- Operation help: ~400-600 tokens
- Topic overview: ~200-300 tokens

**Maximum**: <600 tokens per response (well within limits)

### `setup` Tool

**Response Sizes**:
- `validate`: ~150-200 tokens
- `diagnose`: ~300-400 tokens
- `quickstart`: ~250-350 tokens

**Maximum**: <400 tokens per response

---

## Documentation Structure

After implementing tools, documentation should be structured:

```
docs/
├── guides/
│   ├── troubleshooting.md       # Error codes, diagnostics
│   ├── best-practices.md        # Performance, security
│   └── workflows-and-patterns.md # Common workflows
├── COMPATIBILITY.md              # Client compatibility matrix
└── PROPOSED_TOOLS_EXAMPLES.md   # This document
```

Skills should reference docs:

```markdown
<!-- skills/businessmap-troubleshooting/SKILL.md -->

For detailed troubleshooting, see:
- [Error Code Reference](docs/guides/troubleshooting.md)
- Or use MCP tool: `get_help(topic='error-codes', error_code='BS05')`
```

This creates a single source of truth (docs/) with multiple access paths (skills, MCP tools, web).

---

## Conclusion

These two tools (`get_help` and `setup`) provide:

1. **Universal Knowledge Access**: All MCP clients can access skills content
2. **In-Session Help**: No need to browse external documentation
3. **Guided Onboarding**: Reduces time-to-first-successful-call
4. **Diagnostic Tooling**: Self-service troubleshooting

Combined with extracted documentation (Recommendation #1), this closes the DX gap for non-Claude Code users while maintaining the excellent architecture.
