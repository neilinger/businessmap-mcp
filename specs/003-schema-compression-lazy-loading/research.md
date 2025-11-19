# Research: Token Optimization Phase 2

**Feature**: 003-schema-compression-lazy-loading
**Date**: 2025-11-18
**Status**: Research Phase (Day 1-2 - CRITICAL PIVOT DECISION)

## Purpose

Resolve critical unknowns before implementation, particularly **MCP protocol lazy loading support** which determines whether to proceed with phased approach or pivot to config-based approach.

## Critical Research (PIVOT DECISION - Day 1-2)

### R1: MCP Protocol Dynamic Tool Loading Support

**Question**: Does the MCP protocol support dynamic/lazy tool registration after server initialization?

**Why Critical**: Phase 2 (lazy loading) depends entirely on this. If unsupported, must pivot to Alternative C (config-based approach).

**Research Tasks**:
1. **MCP SDK Documentation Review**
   - Read @modelcontextprotocol/sdk documentation on tool registration
   - Check if `server.tool()` can be called after `server.connect()`
   - Look for lifecycle hooks or deferred registration patterns

2. **MCP Protocol Specification**
   - Review MCP protocol spec for tool discovery timing
   - Check if client caches tool list at init or supports dynamic updates
   - Investigate protocol messages for runtime tool addition

3. **Reference Implementation Analysis**
   - Examine other MCP servers for lazy loading patterns
   - Search GitHub for MCP server implementations with conditional tool loading
   - Check MCP community forums/discussions on dynamic tools

4. **Prototype Test**
   - Create minimal MCP server that registers tools conditionally
   - Test with Claude Code: Does it discover tools added after init?
   - Measure if dynamic registration causes connection issues

**Decision Criteria**:
- ✅ **PROCEED with Phase 2 (lazy loading)** IF:
  - MCP SDK supports post-init tool registration
  - Claude Code client refreshes tool list or accepts dynamic additions
  - Prototype validates <100ms loading performance

- ❌ **PIVOT to Alternative C (config-based)** IF:
  - MCP requires all tools declared at initialization
  - Dynamic registration causes client confusion/errors
  - Performance unacceptable (>100ms per tool)

**Output**: Decision document in `research/R1-mcp-lazy-loading-decision.md`

**Timeline**: Day 1-2 (blocking for all subsequent work)

---

## Secondary Research (Parallel with R1)

### R2: Token Measurement Infrastructure

**Question**: How to accurately measure token consumption per tool?

**Why Important**: FR-012 requires per-tool breakdown. Need reliable measurement before/after optimization.

**Research Tasks**:
1. **Existing Tools**
   - Check if @modelcontextprotocol/sdk exposes token counting
   - Search for npm packages that count OpenAI-style tokens
   - Review how baseline 38,900 tokens was measured (check existing codebase/logs)

2. **Measurement Approaches**
   - Option A: JSON.stringify(toolSchema).length (approximate)
   - Option B: tiktoken library (accurate, requires native bindings)
   - Option C: @anthropic-ai/tokenizer if available
   - Option D: Manual calculation based on MCP protocol format

3. **Instrumentation Points**
   - Where to measure: server.tool() registration time
   - What to measure: Schema definition size, description length, parameter structure
   - How to aggregate: Per-tool, per-tier, per-phase

**Decision Criteria**:
- Accuracy: Within 5% of actual token consumption
- Performance: Measurement overhead <10ms per tool
- Simplicity: Preferably using existing libraries

**Output**: Token measurement utility in `src/metrics/token-counter.ts`

**Timeline**: Day 1-2 (parallel with R1)

---

### R3: Tool Usage Pattern Analysis

**Question**: Which tools belong in Core/Common/Rare tiers?

**Why Important**: Tier assignments determine which tools load immediately vs on-demand. Incorrect assignments negate optimization benefits.

**Research Tasks**:
1. **Log Analysis** (if logs available)
   - Parse Claude Code session logs for tool invocation patterns
   - Count frequency of each tool across typical workflows
   - Identify rarely/never-used tools

2. **Workflow Analysis** (if no logs)
   - Map typical user workflows (e.g., "create card", "update board", "list workspace cards")
   - Identify minimum tool set for basic operations
   - Categorize tools by usage likelihood

3. **Default Tier Assignments** (informed guess if no data)
   - **Core (12 tools, load immediately)**:
     - list_boards, list_cards, list_workspaces (discovery)
     - get_card, get_board, get_workspace (detail views)
     - create_card, update_card, move_card (basic operations)
     - search_board (common query)
     - health_check, list_instances (system)

   - **Common (load on first use)**:
     - Board/lane/column operations
     - Custom field CRUD
     - User operations
     - Card subtasks, comments, links

   - **Rare (load on demand)**:
     - Bulk operations (delete_many, update_many)
     - Card parent/child graph operations
     - Workflow cycle time analytics
     - Archive operations

**Decision Criteria**:
- Core tier: Used in >80% of sessions
- Common tier: Used in 20-80% of sessions
- Rare tier: Used in <20% of sessions

**Output**: Tier assignment table in `research/R3-tool-tier-assignments.md`

**Timeline**: Day 2-3 (can proceed with educated guesses if no hard data)

---

### R4: Schema Compression Patterns

**Question**: What are proven patterns for compressing JSON schemas without breaking functionality?

**Why Important**: Need to compress top 3 tools (create_card, update_card, list_cards) by ~40% while preserving all functionality.

**Research Tasks**:
1. **Schema Compression Techniques**
   - **Grouping**: Nest related parameters (e.g., `placement: {lane_id, position}`)
   - **Deduplication**: Extract shared parameters to base schemas
   - **Abbreviation**: Shorten parameter names (if doesn't hurt readability)
   - **Union Types**: Combine similar optional parameters

2. **Zod Schema Patterns**
   - Review Zod documentation for schema composition (`.extend()`, `.merge()`, `.pick()`)
   - Check if Zod supports shared/reusable schema fragments
   - Investigate schema inheritance for common parameters

3. **MCP Schema Best Practices**
   - Review other MCP servers for schema organization patterns
   - Check if MCP protocol has schema compression recommendations
   - Look for examples of nested parameter structures

**Decision Criteria**:
- Preserves all functionality (100% backward compatible in behavior)
- Reduces token count by ≥39% for top 3 tools
- Maintains type safety (Zod validation passes)
- Doesn't obscure parameter meaning

**Output**: Schema compression design patterns in `research/R4-schema-compression-patterns.md`

**Timeline**: Day 2-3

---

## Research Outputs

All research findings MUST be documented in:

```text
specs/003-schema-compression-lazy-loading/research/
├── R1-mcp-lazy-loading-decision.md    # CRITICAL - Day 1-2
├── R2-token-measurement-approach.md   # Day 1-2
├── R3-tool-tier-assignments.md        # Day 2-3
└── R4-schema-compression-patterns.md  # Day 2-3
```

Each document MUST include:
- **Decision**: What was chosen
- **Rationale**: Why chosen (evidence-based)
- **Alternatives Considered**: What else was evaluated
- **Risks**: Known limitations or trade-offs
- **Implementation Guidance**: How to apply the research

## Day 1-2 Decision Point

**STOP at end of Day 2** and evaluate R1 (MCP lazy loading) results:

### If MCP Supports Lazy Loading ✅
→ **PROCEED** with phased approach:
- Continue to Phase 1 (schema compression)
- Plan Phase 2 (lazy loading implementation)
- Target: 69% token reduction

### If MCP Does NOT Support Lazy Loading ❌
→ **PIVOT** to Alternative C (config-based):
- Update plan.md with config-based approach
- Phase 1: Schema compression (ALL tools, not just top 3)
- Phase 2: Config-driven tool groups (user-selectable)
- Target: 40-55% token reduction

**No implementation work starts until this decision is made.**

## Success Criteria

Research phase complete when:
- ✅ R1 decision made (proceed or pivot)
- ✅ R2 token measurement approach validated with prototype
- ✅ R3 tier assignments documented (or educated guesses with rationale)
- ✅ R4 schema compression patterns documented with examples
- ✅ All research documents committed to git

**Estimated Duration**: 2-3 days (Day 1-2 critical, Day 3 for secondary research if needed)
