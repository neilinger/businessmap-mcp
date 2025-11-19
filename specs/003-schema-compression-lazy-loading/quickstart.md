# Quickstart: Token Optimization Implementation

**Feature**: 003-schema-compression-lazy-loading
**For**: Developers implementing the token optimization feature
**Est. Time**: 3-4 weeks (with pivot decision at Day 2)

## Prerequisites

- TypeScript/Node.js 18.x+ development environment
- Existing businessmap-mcp codebase cloned
- Jest test framework familiar
- Zod schema validation understanding
- Basic MCP protocol knowledge

## Day 1-2: CRITICAL RESEARCH & PIVOT DECISION

### Objective
Determine if MCP protocol supports lazy loading. This decides whether to proceed with phased approach or pivot to config-based approach.

### Steps

1. **Research MCP Protocol** (R1 - see research.md)
   ```bash
   # Read MCP SDK documentation
   open https://github.com/modelcontextprotocol

   # Review tool registration in current codebase
   code src/server/mcp-server.ts

   # Check if tools can be registered after init
   grep -r "server.tool" src/
   ```

2. **Create Prototype** (2-3 hours)
   ```bash
   # Create minimal test server
   cd tests/prototypes/
   mkdir mcp-lazy-loading-test
   cd mcp-lazy-loading-test

   # Test dynamic tool registration
   npm init -y
   npm install @modelcontextprotocol/sdk

   # Create test-lazy-loading.ts (see research/R1)
   # Run with Claude Code and observe behavior
   ```

3. **Make Pivot Decision** (end of Day 2)
   ```bash
   # Document decision
   cd specs/003-schema-compression-lazy-loading/research/
   vim R1-mcp-lazy-loading-decision.md

   # DECISION A: MCP supports lazy loading
   #   → Continue with phased approach (Phase 2 viable)
   #   → Target: 69% reduction

   # DECISION B: MCP does NOT support lazy loading
   #   → Pivot to config-based approach
   #   → Update plan.md with Alternative C details
   #   → Target: 40-55% reduction
   ```

**STOP HERE until decision is made. Do not proceed to implementation.**

---

## Phase 1: Schema Compression (Days 3-5)

**Prerequisite**: Research complete, decision made

### Day 3: Baseline & Tooling

1. **Implement Token Measurement** (R2 - see research.md)
   ```bash
   mkdir -p src/metrics

   # Create token-counter.ts
   vim src/metrics/token-counter.ts
   ```

   ```typescript
   // src/metrics/token-counter.ts
   import { tiktoken } from '@dqbd/tiktoken'; // or alternative

   export function measureToolTokens(toolSchema: any): number {
     const schemaJson = JSON.stringify(toolSchema);
     const encoding = tiktoken.get_encoding("cl100k_base");
     return encoding.encode(schemaJson).length;
   }

   export function reportToolMetrics(tools: ToolSchema[]): void {
     console.table(tools.map(t => ({
       tool: t.name,
       baseline: t.baselineTokens,
       optimized: t.optimizedTokens,
       reduction: `${((1 - t.optimizedTokens/t.baselineTokens) * 100).toFixed(1)}%`
     })));
   }
   ```

2. **Measure Baseline**
   ```bash
   # Run baseline measurement script
   npm run measure:baseline

   # Should output current token consumption per tool
   # Save to specs/003.../research/baseline-measurements.json
   ```

### Day 4: Compress Top 3 Tools

1. **Create Shared Parameter Schemas**
   ```bash
   vim src/schemas/shared-params.ts
   ```

   ```typescript
   // src/schemas/shared-params.ts
   import { z } from 'zod';

   export const SharedParams = {
     instance: z.string().optional(),
     board_id: z.number(),
     card_id: z.number(),
     workspace_id: z.number(),
     // ... other common params
   };

   export const PlacementSchema = z.object({
     lane_id: z.number(),
     position: z.number()
   }).optional();

   export const MetadataSchema = z.object({
     custom_id: z.string(),
     description: z.string(),
     deadline: z.string(),
     size: z.number(),
     priority: z.number(),
     color: z.string(),
     type_id: z.number()
   }).partial();
   ```

2. **Compress create_card Schema** (Target: 3,600 → 2,200 tokens)
   ```bash
   vim src/server/tools/card-tools.ts
   ```

   ```typescript
   // Before: Flat 30+ parameters
   const createCardSchema = z.object({
     title: z.string(),
     column_id: z.number(),
     lane_id: z.number().optional(),
     position: z.number().optional(),
     // ... 25+ more optional params
   });

   // After: Grouped parameters
   const createCardSchemaCompressed = z.object({
     title: z.string(),
     column_id: z.number(),
     placement: PlacementSchema,
     metadata: MetadataSchema,
     owners: OwnersSchema,
     tags: z.array(z.number()).optional(),
     // ... nested schemas
   });
   ```

3. **Test & Validate**
   ```bash
   # Run tests for create_card
   npm test -- card-tools.test.ts

   # Measure post-compression tokens
   npm run measure:tools -- create_card

   # Should show ~39% reduction (3,600 → 2,200)
   ```

4. **Repeat for update_card and list_cards**
   ```bash
   # update_card: 2,700 → 1,600 tokens (41% reduction)
   # list_cards: 2,900 → 1,800 tokens (38% reduction)
   ```

### Day 5: Parameter Deduplication

1. **Extract Instance Parameter**
   ```bash
   # All 65 tools currently define:
   # instance?: string (15-20 tokens each = 975-1,300 total)

   # After extraction:
   # Define once in SharedParams = 15-20 tokens
   # Reference in tools = 5 tokens each = 325 total
   # Savings: 650-975 tokens
   ```

2. **Run Full Measurement**
   ```bash
   npm run measure:all

   # Validate Phase 1 target:
   # Total reduction ≥ 5,600 tokens (14%)
   # Baseline: 38,900 → Target: 33,300
   ```

3. **Commit Phase 1**
   ```bash
   git add src/schemas src/server/tools src/metrics
   git commit -m "feat(optimization): Phase 1 schema compression

   - Compress top 3 tools: create_card, update_card, list_cards
   - Extract shared parameters to reduce duplication
   - Add token measurement infrastructure

   Results:
   - create_card: 3,600 → 2,200 tokens (39% reduction)
   - update_card: 2,700 → 1,600 tokens (41% reduction)
   - list_cards: 2,900 → 1,800 tokens (38% reduction)
   - Total Phase 1 reduction: 5,600+ tokens (14%)

   Ref: #28"
   ```

---

## Phase 2: Config-Based Tool Profiles (Days 6-10)

**PIVOT DECISION** (Research R1 Complete): MCP protocol does NOT support lazy loading. Using config-based profiles (minimal/standard/full) instead.

**See**: `research/R1-mcp-lazy-loading-decision.md` for full analysis.

### Day 6-7: Tool Profile Assignment

1. **Analyze Usage Patterns** (R3 - see research.md)
   ```bash
   # If logs available:
   grep "tool_request" .claude/data/*.log | sort | uniq -c | sort -nr

   # Otherwise, use educated guesses from research/R3
   ```

2. **Define Profiles**
   ```bash
   vim src/config/tool-profiles.ts
   ```

   ```typescript
   export const TOOL_PROFILES = {
     minimal: [
       "list_boards", "list_cards", "list_workspaces",
       "get_card", "get_board", "get_workspace",
       "create_card", "update_card", "move_card",
       "search_board", "health_check", "list_instances"
     ], // ~9,000 tokens

     standard: [
       // Minimal tools +
       // Board/lane/column operations
       // Custom field CRUD
       // User operations
     ], // ~20,000 tokens

     full: [
       // All 65 tools
     ] // ~38,900 tokens
   };

   export function getToolProfile(): string {
     return process.env.BUSINESSMAP_TOOL_PROFILE || 'standard';
   }

   export function getToolsForProfile(profile: string): string[] {
     const profileTools = TOOL_PROFILES[profile];
     if (!profileTools) {
       throw new Error(`Invalid profile: ${profile}. Valid: minimal, standard, full`);
     }
     return profileTools;
   }
   ```

### Day 8-9: Implement Profile-Based Registration

1. **Update MCP Server**
   ```bash
   vim src/server/mcp-server.ts
   ```

   ```typescript
   import { getToolProfile, getToolsForProfile } from '../config/tool-profiles';

   setupTools() {
     const profile = getToolProfile();
     const toolsToRegister = getToolsForProfile(profile);

     console.log(`Loading ${profile} profile: ${toolsToRegister.length} tools`);

     toolsToRegister.forEach(toolName => {
       this.registerTool(toolName);
     });

     console.log(`Registered ${toolsToRegister.length} tools successfully`);
   }
   ```

2. **Add Environment Variable**
   ```bash
   # .env or Claude Code MCP config
   BUSINESSMAP_TOOL_PROFILE=standard  # Options: minimal | standard | full
   ```

### Day 10: Test & Validate

1. **Integration Tests**
   ```bash
   vim tests/integration/profile-based-registration.test.ts
   ```

   ```typescript
   describe("Profile-Based Registration", () => {
     it("loads minimal profile tools", () => {
       process.env.BUSINESSMAP_TOOL_PROFILE = 'minimal';
       const server = new BusinessMapMcpServer();
       server.initialize();

       const registeredTools = server.listTools();
       expect(registeredTools).toHaveLength(12);
       expect(registeredTools).toContain('list_boards');
       expect(registeredTools).toContain('create_card');
     });

     it("loads standard profile by default", () => {
       delete process.env.BUSINESSMAP_TOOL_PROFILE;
       const server = new BusinessMapMcpServer();
       server.initialize();

       const registeredTools = server.listTools();
       expect(registeredTools.length).toBeGreaterThan(12);
       expect(registeredTools.length).toBeLessThan(65);
     });

     it("fails fast on invalid profile", () => {
       process.env.BUSINESSMAP_TOOL_PROFILE = 'invalid';
       const server = new BusinessMapMcpServer();

       expect(() => server.initialize())
         .toThrow(/Invalid profile: invalid. Valid: minimal, standard, full/);
     });
   });
   ```

2. **Performance Validation**
   ```bash
   # Measure init tokens for each profile
   BUSINESSMAP_TOOL_PROFILE=minimal npm run measure:init  # Should be ≤9,000
   BUSINESSMAP_TOOL_PROFILE=standard npm run measure:init # Should be ~20,000
   BUSINESSMAP_TOOL_PROFILE=full npm run measure:init     # Should be ~38,900

   # Measure registration time (should be <2s for any profile)
   npm run benchmark:profile-registration
   ```

3. **Commit Phase 2**
   ```bash
   git add src/config/tool-profiles.ts src/server/mcp-server.ts tests/
   git commit -m "feat(optimization): Phase 2 config-based profiles

   - Implement 3-tier profile system (minimal/standard/full)
   - Minimal profile (12 tools): ~9,000 tokens
   - Standard profile (~30 tools): ~20,000 tokens
   - Full profile (65 tools): ~38,900 tokens
   - Profile selection via BUSINESSMAP_TOOL_PROFILE env var

   Results:
   - Init tokens: 38,900 → 20,000 (standard, 49% reduction)
   - Init tokens: 38,900 → 9,000 (minimal, 77% reduction)
   - Average session: ~12,500 tokens (68% total reduction)

   Ref: #28"
   ```

---

## Phase 3: Description Optimization (Days 13-15)

### Day 13-14: Compress Descriptions

1. **Review & Compress**
   ```bash
   # Current descriptions average 8-12 words
   # Target: ≤5 words while maintaining clarity

   # Before: "Create a new card on the specified board with optional parameters"
   # After: "Create card with parameters"

   # Before: "Retrieve a list of all cards matching the specified filter criteria"
   # After: "List cards by filters"
   ```

2. **Batch Update**
   ```bash
   vim scripts/compress-descriptions.ts

   # Script to update all tool descriptions
   npm run compress:descriptions

   # Manual review for clarity
   git diff src/server/tools/
   ```

### Day 15: Final Validation

1. **Full Token Measurement**
   ```bash
   npm run measure:all

   # Validate final targets:
   # Total reduction: ≥69% (38,900 → 12,000)
   # Phase 1: ≥5,600 tokens
   # Phase 2: ≥24,300 tokens (at init)
   # Phase 3: ≥2,000 tokens
   ```

2. **Test Coverage**
   ```bash
   npm run test:coverage

   # Validate ≥95% coverage for:
   # - Schema changes
   # - Lazy loading mechanism
   # - Token measurement
   ```

3. **Final Commit & PR**
   ```bash
   git add .
   git commit -m "feat(optimization): Phase 3 description cleanup

   - Compress all tool descriptions to ≤5 words
   - Maintain clarity despite brevity
   - Final token reduction: 2,000+ tokens

   Complete Feature Results:
   - Total reduction: 68% (38,900 → 12,500 tokens)
   - Phase 1: Schema compression (14%)
   - Phase 2: Config-based profiles (49% for standard, 77% for minimal)
   - Phase 3: Description cleanup (4-6%)

   Closes #28"

   git push origin 003-schema-compression-lazy-loading
   gh pr create --title "Token Optimization Phase 2: 68% Reduction" \
                --body "See specs/003-schema-compression-lazy-loading/spec.md"
   ```

---

## Future Enhancement: Native Lazy Loading

**Status**: Deferred - MCP protocol does not currently support dynamic tool loading (Research R1)

**When Available**: If MCP implements native lazy loading (see Discussion #532), we can migrate to:

1. **Add "auto" profile**: Uses native lazy loading if MCP supports it
2. **Keep config-based profiles as fallback**: For MCP versions without lazy loading
3. **Gradual migration**: Transition to native lazy loading over time
4. **Deprecate manual profiles**: Once native support is stable

**Expected Benefits** (over config-based):
- True on-demand loading (tools load when first called, not at init)
- No profile selection needed (automatic based on usage)
- Potential for 77% reduction at init (only truly needed tools load)

**Migration Path**:
```typescript
// Future: src/server/mcp-server.ts
setupTools() {
  if (mcpSupportsLazyLoading()) {
    // Use native lazy loading
    this.enableLazyLoading();
  } else {
    // Fall back to config-based profiles
    const profile = getToolProfile();
    const toolsToRegister = getToolsForProfile(profile);
    toolsToRegister.forEach(toolName => this.registerTool(toolName));
  }
}
```

**Tracking**: Monitor MCP Discussion #532 for implementation timeline

---

## Troubleshooting

### Profile Registration Not Working

```bash
# Check environment variable
echo $BUSINESSMAP_TOOL_PROFILE

# Verify profile configuration
node -e "console.log(require('./dist/config/tool-profiles').getToolProfile())"

# List registered tools
npm run dev  # Then check console output for "Registered X tools successfully"

# Test with Claude Code and check logs
tail -f .claude/data/*.log | grep "Loading.*profile"
```

### Invalid Profile Error

```bash
# Fix: Use valid profile name
export BUSINESSMAP_TOOL_PROFILE=standard  # Not 'default' or other names

# Valid options:
# - minimal (12 tools, 9k tokens)
# - standard (30 tools, 20k tokens)
# - full (65 tools, 38.9k tokens)
```

### Schema Validation Failures

```bash
# Test schema individually
npm run test:schema -- create_card

# Check Zod error messages
# Ensure all required fields preserved
# Verify optional fields work with partial()
```

### Token Measurement Discrepancies

```bash
# Verify tiktoken encoding
const encoding = tiktoken.get_encoding("cl100k_base");
console.log(encoding.encode("test").length);

# Compare with manual calculation
JSON.stringify(schema).length / 4  # Rough estimate
```

---

## Next Steps

After implementation complete:
1. Run `/speckit.tasks` to break down into detailed task list
2. Execute tasks following TDD workflow
3. Continuous token measurement validation
4. Performance benchmarking at each phase

**Estimated Total Time**: 3-4 weeks (including research and validation)
