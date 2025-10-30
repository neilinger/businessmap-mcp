# Multi-Instance Implementation Guide

This document describes the implementation pattern for adding multi-instance support to tool handlers.

## Overview

The multi-instance feature allows the MCP server to connect to multiple BusinessMap instances simultaneously. Each tool can optionally accept an `instance` parameter to target a specific instance.

## Architecture

### Key Components

1. **InstanceConfigManager** (`src/config/instance-manager.ts`)
   - Manages instance configurations
   - Supports multiple config sources (file, env, legacy)
   - Validates configurations using Zod schemas

2. **BusinessMapClientFactory** (`src/client/client-factory.ts`)
   - Creates and caches BusinessMapClient instances
   - Implements lazy initialization
   - Handles instance resolution

3. **Base Tool Handler** (`src/server/tools/base-tool.ts`)
   - Provides `getClientForInstance()` helper
   - Supports both legacy and multi-instance modes
   - Type-safe client resolution

## Implementation Pattern

### Step 1: Update Tool Handler Signature

Change the `registerTools` method to accept `BusinessMapClient | BusinessMapClientFactory`:

```typescript
// Before
export class WorkspaceToolHandler implements BaseToolHandler {
  registerTools(server: McpServer, client: BusinessMapClient, readOnlyMode: boolean): void {
    // ...
  }
}

// After
export class WorkspaceToolHandler implements BaseToolHandler {
  registerTools(
    server: McpServer,
    clientOrFactory: BusinessMapClient | BusinessMapClientFactory,
    readOnlyMode: boolean
  ): void {
    // ...
  }
}
```

### Step 2: Update Private Method Signatures

Update all private registration methods:

```typescript
// Before
private registerListWorkspaces(server: McpServer, client: BusinessMapClient): void {
  // ...
}

// After
private registerListWorkspaces(
  server: McpServer,
  clientOrFactory: BusinessMapClient | BusinessMapClientFactory
): void {
  // ...
}
```

### Step 3: Add Instance Parameter to Tool Handler

Update the async handler to extract and use the `instance` parameter:

```typescript
// Before
async ({ workspace_id }) => {
  try {
    const workspace = await client.getWorkspace(workspace_id);
    return createSuccessResponse(workspace);
  } catch (error) {
    return createErrorResponse(error, 'fetching workspace');
  }
}

// After
async ({ workspace_id, instance }: any) => {
  try {
    const client = await getClientForInstance(clientOrFactory, instance);
    const workspace = await client.getWorkspace(workspace_id);
    return createSuccessResponse(workspace);
  } catch (error) {
    return createErrorResponse(error, 'fetching workspace');
  }
}
```

### Step 4: Update Imports

Add the necessary imports:

```typescript
import { BusinessMapClient } from '../../client/businessmap-client.js';
import { BusinessMapClientFactory } from '../../client/client-factory.js';
import {
  BaseToolHandler,
  createErrorResponse,
  createSuccessResponse,
  getClientForInstance,
} from './base-tool.js';
```

## Complete Example

See `src/server/tools/workspace-tools.ts` for a complete implementation example.

### Key Points

1. **Backward Compatibility**: The `instance` parameter is optional. If not provided:
   - Multi-instance mode: Uses default instance
   - Legacy mode: Uses the single configured client

2. **Type Safety**: Use `any` for parameter types in handlers because MCP SDK doesn't provide typed parameters

3. **Error Handling**: The `getClientForInstance()` helper handles all error cases:
   - Instance not found
   - Configuration not loaded
   - Token load failures

4. **Performance**: ClientFactory caches clients, so repeated requests to the same instance reuse the existing client

## Schema Updates

All tool schemas should include the optional `instance` parameter:

```typescript
import { instanceParameterSchema } from './common-schemas.js';

export const getWorkspaceSchema = z.object({
  workspace_id: z.number().describe('The ID of the workspace'),
  ...instanceParameterSchema,
});
```

The `instanceParameterSchema` is defined in `src/schemas/common-schemas.ts`:

```typescript
export const instanceParameterSchema = {
  instance: z
    .string()
    .optional()
    .describe(
      'Optional instance name to target a specific BusinessMap instance. If not provided, uses the default instance.'
    ),
};
```

## MCP Server Integration

The MCP server (`src/server/mcp-server.ts`) should:

1. Try to load multi-instance config first
2. Fallback to legacy single-client mode if config not found
3. Pass appropriate client/factory to tool handlers

```typescript
// Try multi-instance mode first
try {
  const factory = BusinessMapClientFactory.getInstance();
  await factory.initialize();
  return factory; // Multi-instance mode
} catch (error) {
  // Fallback to legacy mode
  const client = new BusinessMapClient(config.businessMap);
  await client.initialize();
  return client; // Legacy mode
}
```

## Testing

### Unit Tests

Test each tool handler with both modes:

1. Legacy mode (single client)
2. Multi-instance mode with default instance
3. Multi-instance mode with explicit instance
4. Error cases (instance not found, etc.)

### Integration Tests

See `test/integration/multi-instance.test.ts` and `test/integration/backward-compatibility.test.ts` for comprehensive test coverage.

## Migration Guide

### For Users

1. **No Changes Required**: Existing configurations continue to work (legacy mode)
2. **Opt-in Multi-Instance**: Create `.businessmap-instances.json` to enable
3. **Gradual Migration**: Can use both modes side-by-side during transition

### For Developers

1. Update tool handlers using the pattern above
2. Add integration tests for new tools
3. Ensure backward compatibility
4. Update documentation

## Future Enhancements

1. Hot-reload of instance configurations
2. Instance-specific rate limiting
3. Cross-instance operations (e.g., move card between instances)
4. Instance health monitoring
5. Connection pooling per instance

## References

- Issue #8: Multi-Instance Configuration Support
- Phase 1: Configuration Management (completed)
- Phase 2: Tool Modifications (this phase)
- Phase 3: Testing & Documentation (in progress)
