# Data Model: Token Optimization

**Feature**: 003-schema-compression-lazy-loading
**Date**: 2025-11-18

## Overview

This is a server optimization feature, not a traditional CRUD application. The "data model" consists of conceptual entities that define tool organization, schema structures, and metrics rather than persistent data storage.

## Core Entities

### Tool Schema

**Definition**: Representation of an MCP tool's parameter structure and metadata

**Attributes**:
- `toolName`: string (e.g., "create_card", "list_boards")
- `description`: string (≤5 words after Phase 3 optimization)
- `parameters`: Zod schema object
  - `required`: array of parameter names
  - `optional`: array of parameter names
  - `sharedParams`: reference to shared parameter definitions
  - `nestedGroups`: grouped parameter structures (e.g., placement, metadata)
- `profile`: enum (Minimal | Standard | Full) - for Phase 2 profile-based registration
- `tokenCost`: number (calculated via token measurement)

**Relationships**:
- Belongs to one `ToolProfile`
- References zero or more `SharedParameterSchema`
- Tracked by `TokenMetrics`

**State Transitions**:
```bash
Uncompressed → Compressed (Phase 1)
Eager-loaded → Lazy-loaded (Phase 2, if MCP supports)
Verbose → Concise (Phase 3 descriptions)
```

**Validation Rules**:
- All parameters MUST pass Zod validation
- Compressed schema MUST preserve 100% of functionality
- Description MUST be ≤5 words (Phase 3)
- `profile` MUST be one of: Minimal | Standard | Full

---

### ToolProfile

**Definition**: Categorization of tools by profile-based registration strategy

**Attributes**:
- `profileName`: enum (Minimal | Standard | Full)
- `loadStrategy`: enum (Immediate | OnFirstUse | OnDemand)
- `tokenBudget`: number (target token cost for this profile)
  - Minimal: ≤9,000 tokens
  - Standard: ~20,000 tokens
  - Full: ~38,900 tokens
- `tools`: array of Tool references

**Minimal Profile (12 tools - load immediately)**:
```typescript
{
  profileName: "Minimal",
  loadStrategy: "Immediate",
  tokenBudget: 9000,
  tools: [
    "list_boards",
    "list_cards",
    "list_workspaces",
    "get_card",
    "get_board",
    "get_workspace",
    "create_card",
    "update_card",
    "move_card",
    "search_board",
    "health_check",
    "list_instances"
  ]
}
```

**Validation Rules**:
- Total token cost per profile MUST not exceed budget
- Minimal profile tools MUST cover basic CRUD operations
- Tool can belong to only one profile
- All 65 tools MUST be assigned to a profile

---

### SharedParameterSchema

**Definition**: Common parameter definitions extracted to reduce duplication

**Attributes**:
- `paramName`: string (e.g., "instance", "board_id")
- `type`: Zod schema type
- `description`: string
- `namespace`: string (for conflict resolution, e.g., "source_board_id", "target_board_id")
- `usedBy`: array of tool names

**Common Shared Parameters**:
```typescript
{
  instance: z.string().optional(),  // Used by all 65 tools
  board_id: z.number(),             // Used by 35+ tools
  card_id: z.number(),              // Used by 24+ tools
  workspace_id: z.number(),         // Used by 20+ tools
  user_id: z.number(),              // Used by 15+ tools
}
```

**Validation Rules**:
- Shared parameter MUST be used by ≥2 tools to justify extraction
- Conflicting parameters MUST use namespaced versions
- Type MUST be consistent across all usages

---

### TokenMetrics

**Definition**: Measurements of token consumption per tool and per tier

**Attributes**:
- `toolName`: string
- `baselineTokens`: number (before optimization)
- `optimizedTokens`: number (after optimization)
- `reductionPercent`: number (calculated: (baseline - optimized) / baseline * 100)
- `measurementPhase`: enum (Baseline | AfterPhase1 | AfterPhase2 | AfterPhase3)
- `tier`: enum (Core | Common | Rare) - if applicable
- `timestamp`: Date

**Aggregations**:
```typescript
interface TierMetrics {
  tierName: string;
  totalTokens: number;
  toolCount: number;
  averagePerTool: number;
}

interface PhaseMetrics {
  phaseName: string;
  totalReduction: number;
  targetReduction: number;
  achieved: boolean;
}
```

**Validation Rules**:
- `optimizedTokens` MUST be ≤ `baselineTokens`
- Phase 1 target: ≥5,600 token reduction
- Phase 2 target: ≥24,300 token reduction at init
- Phase 3 target: ≥2,000 additional token reduction

---

## Conceptual Relationships

```text
ToolProfile (Minimal/Standard/Full)
   ├─► contains many Tools
   └─► has TokenBudget

Tool (65 total)
   ├─► belongs to one ToolProfile
   ├─► has one ToolSchema
   ├─► references 0+ SharedParameterSchema
   └─► tracked by TokenMetrics

ToolSchema
   ├─► defines parameters (Zod schema)
   ├─► uses SharedParameterSchema (extracted common params)
   └─► has description (≤5 words)

SharedParameterSchema
   ├─► defined once
   ├─► used by many Tools
   └─► may have namespace (conflict resolution)

TokenMetrics
   ├─► measures one Tool
   ├─► captures baseline vs optimized
   └─► aggregates by Profile and Phase
```

## Data Flow

### Phase 1: Schema Compression

```bash
1. Baseline Measurement
   Tool → TokenMetrics (baseline)

2. Schema Analysis
   Tool → identify compression opportunities
   → extract SharedParameterSchema
   → group related parameters

3. Schema Compression
   Tool → create compressed ToolSchema
   → validate with Zod
   → preserve functionality

4. Post-Compression Measurement
   Tool → TokenMetrics (Phase 1)
   → calculate reduction
   → validate ≥39% for top 3 tools
```

### Phase 2: Profile-Based Registration

```bash
1. Profile Assignment
   Tool → analyze usage patterns
   → assign to ToolProfile (Minimal/Standard/Full)

2. Registration Strategy
   Minimal tools → register immediately for minimal profile (Immediate)
   Standard tools → register immediately for standard profile (Immediate)
   Full tools → register immediately for full profile (Immediate)
   Profile selected via BUSINESSMAP_TOOL_PROFILE env var

3. Profile-Based Loading
   Tool registration → based on selected profile
   → all tools in profile register at init
   → track TokenMetrics (init cost per profile)
```

### Phase 3: Description Optimization

```text
1. Description Review
   Tool → review current description
   → compress to ≤5 words
   → validate clarity

2. Token Measurement
   Tool → TokenMetrics (Phase 3)
   → calculate final reduction
   → validate total ≥69%
```

## Non-Functional Considerations

### Performance

- Tool schema validation: <10ms per tool (Zod overhead)
- Profile-based registration: <2 seconds for any profile
- Token measurement: <10ms overhead per tool (dev mode only)

### Scale

- Total tools: 65 (fixed, based on BusinessMap API coverage)
- Top 3 tools: create_card, list_cards, update_card (9,200 tokens baseline)
- Shared parameters: Estimated 10-15 common parameters
- Profile distribution:
  - Minimal: 12 tools (~9,000 tokens)
  - Standard: ~30 tools (~20,000 tokens)
  - Full: 65 tools (~38,900 tokens)

### Constraints

- Breaking change: Schema format changes are immediate, no legacy support
- Backward compatibility: Tool functionality preserved 100%
- Test coverage: ≥95% for all schema changes
- Token measurement: Per-tool breakdown required (not just session totals)

## Schema Examples (Before/After)

### Before Compression (create_card - 3,600 tokens)

```typescript
{
  title: z.string(),
  column_id: z.number(),
  lane_id: z.number().optional(),
  position: z.number().optional(),
  custom_id: z.string().optional(),
  description: z.string().optional(),
  deadline: z.string().optional(),
  size: z.number().optional(),
  priority: z.number().optional(),
  color: z.string().optional(),
  type_id: z.number().optional(),
  owner_user_id: z.number().optional(),
  co_owner_ids_to_add: z.array(z.number()).optional(),
  co_owner_ids_to_remove: z.array(z.number()).optional(),
  tag_ids_to_add: z.array(z.number()).optional(),
  tag_ids_to_remove: z.array(z.number()).optional(),
  // ... 15+ more optional parameters
}
```

### After Compression (create_card - target 2,200 tokens, 39% reduction)

```typescript
{
  title: z.string(),
  column_id: z.number(),
  placement: z.object({
    lane_id: z.number(),
    position: z.number()
  }).optional(),
  metadata: z.object({
    custom_id: z.string(),
    description: z.string(),
    deadline: z.string(),
    size: z.number(),
    priority: z.number(),
    color: z.string(),
    type_id: z.number()
  }).partial(),
  owners: z.object({
    user_id: z.number(),
    co_owners: z.array(z.number())
  }).optional(),
  tags: z.array(z.number()).optional(),
  subtasks: z.array(SubtaskSchema).optional(),
  custom_fields: z.array(CustomFieldSchema).optional(),
  links: z.array(CardLinkSchema).optional()
}
```

**Key Compression Techniques**:
1. **Grouping**: Related params nested (placement, metadata, owners)
2. **Deduplication**: Shared schemas extracted (SubtaskSchema, CustomFieldSchema)
3. **Simplification**: Removed redundant "to_add/to_remove" in favor of arrays
4. **Partial Objects**: Used `.partial()` for all-optional groups

---

## Implementation Notes

### Tool Registration (Current - src/server/mcp-server.ts)

```typescript
// Current: All tools registered eagerly in setupTools()
setupTools() {
  this.mcpServer.tool("create_card", createCardSchema, createCardHandler);
  this.mcpServer.tool("update_card", updateCardSchema, updateCardHandler);
  // ... 63 more tools
}
```

### Tool Registration (Phase 2 - if lazy loading supported)

```typescript
// Phase 2: Core tools immediate, others lazy
setupTools() {
  // Core tier - register immediately
  CORE_TOOLS.forEach(tool => {
    this.mcpServer.tool(tool.name, tool.schema, tool.handler);
  });

  // Common/Rare tiers - register on first use
  this.mcpServer.on("tool_request", async (toolName) => {
    if (!isLoaded(toolName)) {
      await loadTool(toolName); // <100ms
    }
  });
}
```

### Token Measurement (src/metrics/token-counter.ts)

```typescript
interface TokenMeasurement {
  toolName: string;
  schemaTokens: number;
  descriptionTokens: number;
  totalTokens: number;
  phase: "baseline" | "phase1" | "phase2" | "phase3";
}

function measureToolTokens(toolSchema: ZodSchema): number {
  const schemaJson = JSON.stringify(toolSchema);
  return tiktoken.encode(schemaJson).length; // or alternative method
}
```

---

**Status**: Data model defined, pending research completion and implementation.
