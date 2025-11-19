# R1: MCP Protocol Lazy Loading Decision

**Research Date**: 2025-11-18
**Researcher**: Planning Phase Analysis
**Decision**: ❌ **PIVOT to Config-Based Approach** (Alternative C)

## Research Question

Does the MCP protocol support dynamic/lazy tool registration after server initialization?

## Findings

### 1. MCP TypeScript SDK Current Capabilities

**Tool Registration Pattern** (from official docs):
```typescript
const server = new McpServer({ name: 'my-app', version: '1.0.0' });

// Tools MUST be registered BEFORE server.connect()
server.registerTool('tool-name', schema, handler);

// After this point, tool list is fixed
await server.connect(transport);
```

**Limitation**: All tools must be registered before `server.connect()`. No evidence of dynamic registration after connection established.

**Source**: https://github.com/modelcontextprotocol/typescript-sdk

### 2. Community Enhancement Proposal

**Discussion #532**: "Hierarchical Tool Management for MCP - Solving Context Overflow at Scale"
- **Status**: Proposed enhancement, NOT implemented
- **Initiated**: August 14, 2025 by JoshMcMillen
- **Purpose**: Address context window saturation (same problem we face!)
- **Timeline**: Three-phase rollout outlined, but NO concrete dates
- **Current State**: Early feedback-gathering stage

**Proposed Capabilities** (future):
- `tools/categories` - Category-based discovery
- `tools/discover` - Dynamic tool discovery
- `tools/load` / `tools/unload` - Lazy loading
- Enhanced metadata for tool selection

**Problem They're Solving** (exactly our issue):
> "Context Window Saturation: At ~400-500 tokens per tool definition, 50 tools consume 20,000-25,000 tokens"

**Source**: https://github.com/orgs/modelcontextprotocol/discussions/532

### 3. Protocol Specification Review

**General SDK Documentation**: Mentions "Creating MCP servers that expose tools" but provides no details on dynamic registration or lazy loading capabilities.

**Conclusion**: Current MCP protocol requires all tools to be declared at initialization.

## Decision Rationale

**Why PIVOT**:
1. **Current MCP SDK**: Static registration only, no dynamic loading
2. **Future Support**: Proposed but unimplemented, no timeline
3. **Risk**: Waiting for MCP 2.0 could delay this optimization 6-12+ months
4. **Alternative Exists**: Config-based approach achieves 40-55% reduction NOW

**Why NOT Wait for MCP Enhancement**:
- No implementation timeline provided
- Proposal still in early discussion phase
- Our optimization needed now, not in future MCP version
- Can migrate to native lazy loading when available (future enhancement)

## Recommended Approach: Alternative C (Config-Based)

### Strategy

Instead of lazy loading, use **config-driven tool groups**:

**Tier 1: Minimal Profile** (load by default)
- 12 core tools: list_boards, list_cards, get_card, create_card, etc.
- ~9,000 tokens at init
- Covers 80% of basic workflows

**Tier 2: Standard Profile** (default)
- Minimal + board/workspace operations + custom fields
- ~20,000 tokens at init
- Covers 95% of typical usage

**Tier 3: Full Profile** (opt-in)
- All 65 tools
- ~38,900 tokens (current state)
- For power users needing bulk ops, analytics, etc.

### Configuration

```typescript
// .env or config
BUSINESSMAP_TOOL_PROFILE=standard  // Options: minimal | standard | full

// Or per-tool selection
BUSINESSMAP_TOOLS_ENABLED=list_boards,list_cards,create_card,...
```

### Implementation

```typescript
// src/server/mcp-server.ts
setupTools() {
  const profile = getToolProfile(); // from env/config
  const toolsToRegister = TOOL_PROFILES[profile];

  toolsToRegister.forEach(toolName => {
    this.registerTool(toolName, schemas[toolName], handlers[toolName]);
  });
}
```

### Token Savings

**Minimal Profile** (12 tools):
- Init: 9,000 tokens vs 38,900 baseline
- **Reduction**: 29,900 tokens (77%)

**Standard Profile** (~30 tools):
- Init: ~20,000 tokens vs 38,900 baseline
- **Reduction**: 18,900 tokens (49%)

**Average Expected** (with schema compression):
- Schema compression (Phase 1): 5,600 tokens saved
- Profile-based loading (Phase 2): 18,900 tokens saved (standard)
- Description cleanup (Phase 3): 2,000 tokens saved
- **Total**: ~26,500 tokens saved (**68% reduction**, close to 69% target!)

## Alternatives Considered

### Alternative A: Wait for MCP 2.0
- **Pro**: Native lazy loading support
- **Con**: Unknown timeline (6-12+ months?)
- **Con**: Delays optimization indefinitely
- **Verdict**: ❌ Rejected (too uncertain)

### Alternative B: Hack Dynamic Loading
- **Pro**: Might achieve true lazy loading
- **Con**: Violates MCP protocol expectations
- **Con**: Could break with MCP updates
- **Con**: Likely rejected by Claude Code client
- **Verdict**: ❌ Rejected (too risky)

### Alternative C: Config-Based Profiles ✅
- **Pro**: Works with current MCP protocol
- **Pro**: Delivers 68% reduction (near 69% target)
- **Pro**: User controls tool availability
- **Pro**: Can migrate to native lazy loading later
- **Verdict**: ✅ **SELECTED**

## Risks & Mitigations

### Risk 1: User Configuration Overhead
- **Mitigation**: Sane defaults (standard profile)
- **Mitigation**: Simple env var (`BUSINESSMAP_TOOL_PROFILE=standard`)
- **Mitigation**: Presets cover 95% of use cases

### Risk 2: Users Load All Tools Anyway
- **Mitigation**: Default to "standard" (not "full")
- **Mitigation**: Document token costs per profile
- **Mitigation**: Claude Code may prompt user to select profile on first use

### Risk 3: Wrong Tools in Profile
- **Mitigation**: Based on usage patterns (research/R3-tool-tier-assignments.md)
- **Mitigation**: User can customize via env var
- **Mitigation**: Easy to add tools to profiles post-launch

## Implementation Impact

### Plan Updates Required

1. **plan.md**: Update Phase 2 from "Lazy Loading" to "Config-Based Profiles"
2. **Target**: Adjust from 69% to 68% (minimal impact)
3. **Timeline**: Phase 2 reduces from 1-2 weeks to 3-5 days (simpler!)
4. **Complexity**: Medium → Low (no MCP protocol hacks)

### Dependencies Removed

- ❌ No MCP protocol research needed (complete)
- ❌ No lazy loading prototype testing
- ❌ No dynamic tool registration mechanism
- ✅ Simple config-based tool filtering

### New Dependencies

- ✅ Define tool profiles (minimal/standard/full)
- ✅ Configuration system (env vars or .env)
- ✅ Documentation for profile selection

## Next Steps

1. ✅ **Document decision** (this file)
2. ⏭️ **Update plan.md** with config-based approach
3. ⏭️ **Define tool profiles** (research/R3-tool-tier-assignments.md)
4. ⏭️ **Proceed to Phase 1** (schema compression - unchanged)
5. ⏭️ **Implement Phase 2** (config-based profiles)

## Future Migration Path

When MCP implements native lazy loading (Discussion #532):
1. Keep config-based profiles as fallback
2. Add "auto" profile: Uses native lazy loading if available
3. Gradual migration to native lazy loading
4. Deprecate manual profiles over time

**Config-based approach does NOT block future migration** - it's a bridge solution.

---

**Decision**: ✅ **PIVOT to Config-Based Approach (Alternative C)**
**Target Reduction**: 68% (38,900 → 12,500 tokens)
**Implementation**: Simpler, faster, works with current MCP
**Future-Proof**: Can migrate to native lazy loading when available

**Status**: Research complete, ready for Phase 1 (schema compression)
