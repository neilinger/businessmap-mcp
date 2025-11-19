# Implementation Plan: Token Optimization Phase 2 - Schema Compression and Profile-Based Tool Registration

**Branch**: `003-schema-compression-lazy-loading` | **Date**: 2025-11-18 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/003-schema-compression-lazy-loading/spec.md`

**Note**: This plan uses **Alternative B (Phased Approach)** from ULTRATHINK analysis with MCP protocol research as Day 1 pivot point.

## Summary

Reduce MCP server initialization token consumption from 38,900 to ~12,500 tokens (68% reduction) through three-phase optimization:
- **Phase 1**: Schema compression for top 3 tools + parameter deduplication (14% reduction, 2-3 days)
- **Phase 2**: Three-tier profile-based tool registration (config-driven) (additional 54% reduction, 3-5 days)
- **Phase 3**: Description cleanup + remaining tool optimization (additional polish, 3-5 days)

**PIVOT DECISION**: MCP protocol research completed (R1) - lazy loading NOT supported. Pivoted to config-based profiles (minimal/standard/full) selectable via BUSINESSMAP_TOOL_PROFILE environment variable.

## Technical Context

**Language/Version**: TypeScript (Node.js 18.x, 20.x, 22.x)
**Primary Dependencies**: @modelcontextprotocol/sdk, Zod (schema validation), axios (API client)
**Storage**: N/A (stateless MCP server, token metrics collected during dev/test only)
**Testing**: Jest, existing integration test suite
**Target Platform**: Node.js MCP server (runs in Claude Code environment)
**Project Type**: Single project (MCP server)
**Performance Goals**:
- Initialization: <2 seconds
- Profile-based registration: <2 seconds for any profile
- Token reduction: 68% from baseline (38,900 → 12,500 tokens)
**Constraints**:
- **RESOLVED**: MCP protocol does NOT support lazy loading (R1 complete - pivoted to config-based)
- Breaking change deployment: Immediate (no legacy format support)
- Backward compatibility: Functionality preserved, schema format changes
- Token measurement: Per-tool breakdown for all 65 tools
**Scale/Scope**:
- 65 tools total (card: 24, board: 14, workspace: 7, custom fields: 6, users/utilities: 8, workflow: 6)
- Top 3 tools: create_card (3.6k tokens), list_cards (2.9k), update_card (2.7k)
- Target profiles: minimal (12 tools, 9k tokens), standard (~30 tools, 20k tokens), full (65 tools, 38.9k tokens)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Core Principles Alignment

**I. API-First Integration** ✅ COMPLIANT
- This is a server optimization, not API functionality change
- All BusinessMap API operations remain unchanged
- Tool schemas compressed, but API calls identical

**II. Read-Only Mode Safety** ✅ COMPLIANT
- Optimization doesn't affect read-only mode enforcement
- Tool registration (profile-based) respects read-only configuration

**III. Comprehensive CRUD Coverage** ✅ COMPLIANT
- All CRUD operations remain exposed (just registered differently based on profile)
- Schema compression preserves all parameters and functionality
- Tool availability unchanged (profile-based registration is transparent to user)

**IV. Explicit Confirmation for Destructive Operations** ✅ COMPLIANT
- Confirmation logic unchanged by optimization
- Schema compression doesn't affect confirmation flow

**V. Type Safety and Validation** ⚠️ **REQUIRES ATTENTION**
- **Challenge**: Schema compression changes parameter structures (nested objects)
- **Mitigation**: All compressed schemas MUST pass Zod validation before deployment
- **Gate**: 95% test coverage required for schema changes

### Development Workflow Compliance

**Specification-Driven Development** ✅ COMPLIANT
- Feature specified via /speckit.specify
- Clarifications completed via /speckit.clarify
- Planning via /speckit.plan
- Implementation via /speckit.tasks (pending)

**API Research Before Implementation** ✅ **RESOLVED**
- **Resolution**: Research R1 completed - MCP lazy loading not supported, pivoted to config-based approach

**Incremental Tool Exposure** ✅ COMPLIANT
- Tools already implemented, only changing registration/schema
- Schema changes validated via Zod before tool re-registration
- Read-only mode respected at registration time

### Quality Standards Compliance

**Error Handling Excellence** ✅ COMPLIANT (with additions)
- Invalid profile selection: Fail fast with detailed errors listing valid options
- Schema validation failures: Clear error indicating parameter structure changes
- MCP protocol errors: Explicit messages about profile configuration

**Performance Targets** ✅ ENHANCED
- Existing targets maintained (<2s operations, <10s bulk ops)
- NEW: Profile registration target <2 seconds for any profile
- NEW: Initialization target ≤9,000 tokens (minimal profile only)

**Documentation Standards** ⚠️ **REQUIRES UPDATE**
- **Challenge**: Tool descriptions changing (≤5 words target)
- **Mitigation**: Descriptions must remain clear despite brevity
- **Gate**: Description changes reviewed for clarity before deployment

### GATE RESULTS

**Status**: ✅ **CONDITIONAL PASS** - proceed to Phase 0 research with gates

**Gates to Pass Before Implementation**:
1. ✅ **Phase 0 Gate**: MCP protocol research validates lazy loading feasibility OR pivot decision made - RESOLVED (pivoted to config-based)
2. ⚠️ **Phase 1 Gate**: All compressed schemas pass Zod validation with 95% test coverage
3. ⚠️ **Phase 1 Gate**: Tool descriptions reviewed and approved for clarity (≤5 words)

**No Constitution Violations** - all changes align with existing principles.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── server/
│   ├── mcp-server.ts          # Main MCP server (initialize, setupTools methods)
│   └── tools/
│       ├── base-tool.ts       # Base tool class (shared parameter extraction target)
│       ├── card-tools.ts      # 24 card tools (create_card, update_card, list_cards - TOP PRIORITY)
│       ├── board-tools.ts     # 14 board tools
│       ├── workspace-tools.ts # 7 workspace tools
│       ├── custom-field-tools.ts # 6 custom field tools
│       ├── user-tools.ts      # User operations
│       ├── workflow-tools.ts  # 6 workflow tools
│       ├── utility-tools.ts   # Utility operations
│       ├── instance-tools.ts  # Instance management
│       └── index.ts           # Tool registry/exports
├── schemas/                   # Zod schema definitions (compression targets)
├── services/                  # BusinessMap API client
├── config/                    # Configuration (tool profiles)
├── types/                     # TypeScript type definitions
├── utils/                     # Shared utilities
└── index.ts                   # Entry point

tests/
├── integration/               # Integration tests (schema validation, tool registration)
└── unit/                      # Unit tests (schema compression, token measurement)

# NEW for this feature:
src/
├── metrics/                   # Token measurement infrastructure (NEW - Phase 0)
│   ├── token-counter.ts       # Per-tool token counting
│   └── metrics-reporter.ts    # Token metrics reporting
└── config/
    └── tool-profiles.ts       # Profile definitions (minimal/standard/full - NEW - Phase 2)
```

**Structure Decision**: Single project (MCP server). Primary modifications in `src/server/tools/` for schema compression and `src/server/mcp-server.ts` for profile-based registration. New `src/metrics/` directory for token measurement infrastructure and `src/config/tool-profiles.ts` for profile definitions.

## Complexity Tracking

**No Constitution violations** - this section not applicable.
