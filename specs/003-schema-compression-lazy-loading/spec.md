# Feature Specification: Token Optimization Phase 2 - Schema Compression and Profile-Based Tool Registration

**Feature Branch**: `003-schema-compression-lazy-loading`
**Created**: 2025-11-18
**Status**: Draft
**Input**: User description: "Issue #28: Token Optimization Phase 2: Schema Compression and Lazy Loading (69% reduction)"

## Clarifications

### Session 2025-11-18

- Q: When a Tier 2/3 tool is called before being loaded, should the system load it synchronously (blocking the call until ready) or asynchronously (return immediately with loading state)? → A: Research how Claude Code / MCP protocol standards handle this. If still uncertain, setup a prototype to test.
- Q: When compressed schemas receive legacy parameter formats (pre-optimization clients), should the system support both formats during a transition period or require immediate client updates? → A: Immediate breaking change
- Q: When the lazy loading mechanism fails to load a required Tier 2/3 tool, should the system retry automatically, fail fast with clear error, or fall back to loading all tools? → A: Fail fast with detailed error
- Q: For token measurement tooling (FR-012), what level of measurement granularity is needed: per-session totals only, per-tool breakdown, or real-time monitoring dashboard? → A: Per-tool breakdown
- Q: When shared parameter definitions conflict across different tools (e.g., 'board_id' means different things in different contexts), should the system use namespaced parameters, context-specific overrides, or enforce strict consistency? → A: Namespaced parameters

## Research Findings & Pivot Decision

**MCP Protocol Research** (2025-11-18): Research into MCP protocol dynamic tool loading (R1) determined that lazy loading is NOT currently supported. MCP TypeScript SDK requires all tools to be registered before `server.connect()`.

**Pivot Decision**: Changed from lazy loading approach to **config-based tool profiles** (minimal/standard/full) selectable via environment variable.

**Impact**: Target reduction adjusted from 69% to 68% (minimal change). Implementation simplified (3-5 days vs 1-2 weeks for Phase 2).

See `research/R1-mcp-lazy-loading-decision.md` for full analysis.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Reduced Initialization Cost (Priority: P1)

As a Claude Code user integrating the BusinessMap MCP server, I want the server to initialize with minimal token overhead so that I can start working without consuming excessive tokens before any actual work begins.

**Why this priority**: This delivers immediate value by reducing the upfront cost barrier. Users currently pay 38,900 tokens just to activate the MCP connection, making it expensive before any productive work happens. This is the foundation that makes all other optimizations valuable.

**Independent Test**: Can be fully tested by measuring token count during MCP server initialization (before any tool calls) and verifying it's reduced from 38,900 to target levels. Delivers immediate cost savings on every session start.

**Acceptance Scenarios**:

1. **Given** a Claude Code session starting, **When** the BusinessMap MCP server initializes, **Then** the token consumption is reduced by at least 68% from the current 38,900 token baseline
2. **Given** a typical user workflow requiring only basic card and board operations, **When** the session completes, **Then** only the tools actually used contribute to the total token count
3. **Given** a user needs advanced features like bulk operations, **When** the user selects 'full' profile, **Then** all required tools register during initialization without manual intervention

---

### User Story 2 - Compressed Tool Schemas (Priority: P2)

As a developer using the MCP server tools, I want tool parameter schemas to be concise and well-organized so that the AI assistant can understand tool capabilities without excessive token consumption.

**Why this priority**: This optimization targets the highest-impact tools (create_card, list_cards, update_card represent 23.7% of total tokens). It delivers immediate wins within 2-3 days and compounds with profile-based registration for maximum effect.

**Independent Test**: Can be tested by comparing token counts for the top 3 tools before and after schema compression, verifying at least 39% reduction. Works independently even without profile-based registration implemented.

**Acceptance Scenarios**:

1. **Given** the create_card tool definition, **When** the schema is compressed, **Then** token count reduces from 3,600 to approximately 2,200 tokens (39% reduction)
2. **Given** the update_card tool definition, **When** the schema is compressed, **Then** token count reduces from 2,700 to approximately 1,600 tokens (41% reduction)
3. **Given** the list_cards tool definition, **When** the schema is compressed, **Then** token count reduces from 2,900 to approximately 1,800 tokens (38% reduction)
4. **Given** common parameters used across multiple tools, **When** schemas are refactored, **Then** parameter definitions are deduplicated and shared efficiently

---

### User Story 3 - Streamlined Tool Descriptions (Priority: P3)

As a user reading tool documentation and errors, I want tool descriptions to be clear and concise so that I can quickly understand tool purpose without verbose explanations consuming tokens.

**Why this priority**: This is a polish optimization that compounds with schema compression. While lower priority than architectural changes, it contributes 4-6% additional savings and improves overall user experience.

**Independent Test**: Can be tested by measuring description lengths across all tools and verifying they average ≤5 words while maintaining clarity. Delivers value even if implemented alone.

**Acceptance Scenarios**:

1. **Given** any tool parameter description, **When** reviewed for verbosity, **Then** the description is ≤5 words while remaining clear
2. **Given** the full set of 65 tools, **When** descriptions are optimized, **Then** total token count from descriptions reduces by 1,500-2,500 tokens
3. **Given** a user encountering a tool error, **When** the error message displays, **Then** the tool description remains understandable despite brevity

---

### Edge Cases

- **Profile selection**: When user doesn't specify BUSINESSMAP_TOOL_PROFILE environment variable, system defaults to 'standard' profile.
- How does the system handle backward compatibility for clients expecting all tools immediately?
- **Invalid profile**: When user specifies invalid profile name, system fails with clear error listing valid options (minimal/standard/full).
- **Legacy parameter format handling**: Compressed schemas will NOT support legacy parameter formats. This is an immediate breaking change requiring coordinated client updates.
- **Shared parameter conflicts**: When shared parameter definitions conflict across different tools (e.g., board_id has different meanings), use namespaced parameters with context prefixes (e.g., source_board_id, target_board_id) to ensure clear disambiguation.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST reduce total initialization token count from 38,900 to approximately 12,500 tokens for average sessions (68% reduction)
- **FR-002**: System MUST implement three-tier profile-based tool registration (minimal/standard/full profiles) with Minimal profile (~9,000 tokens), Standard profile (~20,000 tokens), and Full profile (~38,900 tokens)
- **FR-003**: System MUST register Minimal profile tools during initialization, including list_boards, list_cards, list_workspaces, get_card, get_board, get_workspace, create_card, update_card, move_card, search_board, health_check, and list_instances
- **FR-004**: System MUST selectively register tools based on user-selected profile (env var: BUSINESSMAP_TOOL_PROFILE) without manual user intervention
- **FR-005**: System MUST compress create_card schema from 3,600 to approximately 2,200 tokens through parameter consolidation and nested object restructuring
- **FR-006**: System MUST compress update_card schema from 2,700 to approximately 1,600 tokens through parameter consolidation
- **FR-007**: System MUST compress list_cards schema from 2,900 to approximately 1,800 tokens by consolidating filter parameters
- **FR-008**: System MUST extract common parameters to shared schema definitions with namespaced parameters when conflicts exist (e.g., source_board_id vs. target_board_id)
- **FR-009**: System MUST reduce tool parameter descriptions to ≤5 words while maintaining clarity (validated per US3: understandable in error messages)
- **FR-010**: System MUST preserve all existing tool functionality during schema compression, but schema format changes are breaking (clients must update synchronously)
- **FR-011**: System MUST NOT support legacy parameter formats after schema compression deployment (immediate breaking change)
- **FR-012**: System MUST measure and report actual token consumption with per-tool breakdown (initialization cost + usage cost per tool)
- **FR-013**: System MUST fail fast on invalid profile selection with detailed error messages listing valid options (no automatic retries)
- **FR-014**: System MUST support profile selection via environment variable (BUSINESSMAP_TOOL_PROFILE) with options: minimal, standard, full
- **FR-015**: System MUST default to 'standard' profile when no profile specified

### Key Entities

- **Tool Schema**: Represents a tool's parameter definition structure, including required/optional parameters, nested objects, and descriptions. Affected by compression and deduplication optimizations.
- **Tool Profile**: Categorization of tools into Minimal (12 core tools), Standard (~30 tools), or Full (all 65 tools) based on usage frequency and criticality. Determines registration strategy.
- **Shared Parameter Schema**: Common parameter definitions extracted from multiple tools using namespaced parameters when conflicts exist (e.g., source_board_id, target_board_id instead of generic board_id).
- **Token Metrics**: Per-tool measurements of token consumption tracking initialization cost and usage cost separately for each of the 65 tools.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: MCP server initialization consumes ≤12,500 tokens for typical user sessions (68% reduction from 38,900 baseline)
- **SC-002**: Top 3 tools (create_card, list_cards, update_card) collectively consume ≤5,600 tokens (39% reduction from 9,200 baseline)
- **SC-003**: Minimal profile registers ≤9,000 tokens during initialization
- **SC-004**: Average session uses ≤12,500 total tokens including initialization and typical tool usage (excluding tool execution results)
- **SC-005**: 100% of existing tool functionality preserved (note: schema format changes ARE breaking, requiring coordinated client updates)
- **SC-007**: Tool description lengths average ≤5 words across all 65 tools while maintaining clarity
- **SC-008**: Phase 1 (schema compression) delivers ≥5,600 token reduction within 2-3 days
- **SC-009**: Phase 2 (profile-based tool registration) delivers ≥20,800 additional token reduction at initialization within 3-5 days (cumulative with Phase 1)
- **SC-010**: Phase 3 (polish) delivers ≥2,000 additional token reduction within 3-5 days

## Assumptions

1. **Usage Patterns**: Typical sessions use approximately 20 of the 65 available tools, with remaining 45 tools rarely or never called
2. **Core Tool Set**: The 12 identified Core Tools represent the minimum viable set for basic MCP server operation
3. **Profile defaults**: 'standard' profile covers 95% of typical usage without requiring user configuration
4. **Schema Compression Safety**: Consolidating parameters into nested objects (e.g., placement: { lane_id, position }) does not break existing integrations
5. **Backward Compatibility**: Existing tool consumers can adapt to schema changes through standard deprecation and migration patterns
6. **Token Measurement Accuracy**: Token counting can be reliably measured at initialization and during tool loading
7. **Three-Phase Implementation**: Optimizations can be implemented incrementally (Phase 1 → Phase 2 → Phase 3) without requiring all-at-once refactoring
8. **Industry Standards**: Current 38,900 token consumption represents an outlier compared to typical MCP server implementations

## Dependencies

1. **Issue #9** (closed 2025-11-01): Previous optimization work on JSON response formatting and tool descriptions
2. **Issue #10** (closed 2025-11-02): Previous work moving verbose API patterns to Claude Code skills/slash commands
3. **MCP Server Architecture**: Existing server initialization and tool registration mechanisms must support dynamic loading
4. **Token Measurement Tooling**: Ability to accurately measure and report token consumption during development and testing
5. **Testing Infrastructure**: Comprehensive test suite to validate backward compatibility and functional preservation during schema changes

## Out of Scope

1. **Additional Feature Development**: This optimization focuses solely on token reduction without adding new tool capabilities
2. **Alternative MCP Servers**: Optimizations target BusinessMap MCP server specifically, not generic MCP server patterns
3. **Client-Side Optimizations**: Focus is on server-side schema and loading improvements, not client usage patterns
4. **Tool Usage Analytics**: While usage patterns inform tier assignments, building analytics infrastructure is not included
5. **Automatic Schema Migration**: Clients must handle schema changes through standard versioning, no automatic migration provided
6. **Performance Optimization Beyond Loading**: Focus is on token reduction, not general execution performance improvements
7. **Documentation Rewrites**: Only tool descriptions are optimized; comprehensive documentation updates are separate work

## Constraints

1. **Breaking Change Deployment**: Schema format changes require coordinated deployment with clients (immediate breaking change, no legacy format support)
2. **Three-Phase Timeline**: Phase 1 (2-3 days), Phase 2 (3-5 days), Phase 3 (3-5 days) for total 1.5-2 week implementation
3. **Token Measurement Dependency**: All optimizations must be validated through measurable token count reductions
4. **Tool Profile Stability**: Once profile assignments are made, tools should not frequently move between profiles to avoid registration pattern instability
5. **Schema Validation**: All compressed schemas must pass existing validation tests before deployment
6. **Testing Coverage**: Minimum 95% test coverage for all modified tools and profile-based registration mechanisms
7. **Documentation Update Timing**: Tool descriptions must be updated synchronously with schema changes to avoid confusion
8. **MCP Protocol Limitation**: Current MCP protocol requires all tools registered before server initialization; dynamic loading not supported (confirmed via research R1)
