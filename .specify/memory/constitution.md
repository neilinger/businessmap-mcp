<!--
Version: 1.0.0 → 1.1.0 (Process Integrity Principles)
Modified Principles: None (existing principles unchanged)
Added Sections: Process Integrity (Success Criteria Immutability, Measurement Completeness, Honest Documentation)
Removed Sections: None
Templates Requiring Updates:
  - ✅ .specify/templates/spec-template.md (added SC-* checklist reminder and constitution requirements)
  - ✅ .specify/templates/tasks-template.md (added Phase N+1: Success Criteria Validation with measurement checklist)
  - ✅ .specify/templates/plan-template.md (no changes needed)
Follow-up TODOs: None (all templates updated)
-->

# BusinessMap MCP Server Constitution

## Core Principles

### I. API-First Integration

The BusinessMap MCP Server MUST maintain complete fidelity with the BusinessMap API v2. All operations MUST be validated against official API capabilities before implementation. When API limitations exist, the system MUST provide clear error messages indicating unsupported operations rather than simulating functionality.

**Rationale**: Prevents misleading users with operations that appear to work but fail against the actual API. Maintains trust and predictability in the integration layer.

### II. Read-Only Mode Safety

The system MUST support a read-only mode that completely disables all write operations (Create, Update, Delete). This mode MUST be enforceable via environment configuration (`BUSINESSMAP_READ_ONLY_MODE=true`) and MUST be respected at the tool registration level.

**Rationale**: Enables safe exploration and testing in production environments without risk of accidental data modification. Critical for enterprise adoption and user confidence.

### III. Comprehensive CRUD Coverage

The system MUST expose all CRUD operations supported by the BusinessMap API with clear documentation of capabilities and limitations. When operations are partially supported (e.g., comments: create/read only), this MUST be explicitly documented in tool descriptions and error messages.

**Rationale**: Users need complete visibility into what operations are available. Partial support without clear communication leads to frustration and support burden.

### IV. Explicit Confirmation for Destructive Operations

Delete operations with dependencies (workspace→boards, card→children) MUST display confirmation prompts listing all dependent resources before execution. Simple deletes (no dependencies) and all update operations MAY execute immediately. Bulk operations MUST analyze dependencies upfront and present a single consolidated confirmation.

**Rationale**: Prevents accidental data loss while minimizing friction for routine operations. Balances safety with usability through dependency-aware confirmation strategy.

### V. Type Safety and Validation

All tool parameters and responses MUST be validated using Zod schemas. Type definitions MUST be co-located with implementation code. Invalid inputs MUST result in clear, actionable error messages indicating the specific validation failure.

**Rationale**: Prevents runtime errors and provides clear feedback at the MCP protocol boundary. Strong typing enables better IDE support and prevents common integration mistakes.

## Development Workflow

### Specification-Driven Development

All features MUST begin with a specification document (`/speckit.specify`) that defines user stories, acceptance criteria, and success metrics. Specifications MUST undergo clarification (`/speckit.clarify`) to resolve ambiguities before planning. Implementation planning (`/speckit.plan`) MUST decompose specifications into concrete, independently testable tasks.

**Rationale**: Prevents scope creep and ensures shared understanding between developers and stakeholders. Specification artifacts serve as living documentation and provide traceability from requirements to implementation.

### API Research Before Implementation

For operations with uncertain API support, research MUST be conducted using official documentation, existing integrations (Power Automate, Make), and the OpenAPI specification before marking features as MUST requirements. Operations requiring verification MUST be marked as SHOULD requirements with clear research notes.

**Rationale**: Avoids wasted implementation effort on unsupported operations. Sets realistic expectations and enables graceful degradation when API capabilities are limited.

### Incremental Tool Exposure

Operations already implemented in the client layer MUST be prioritized for tool exposure over net-new implementations. Each tool MUST have a corresponding Zod schema and error handling before registration. Tools MUST respect read-only mode configuration at registration time.

**Rationale**: Maximizes value delivery by leveraging existing, tested code. Ensures consistent quality standards across all exposed tools.

## Quality Standards

### Error Handling Excellence

All operations MUST return meaningful error messages that indicate:

1. The specific failure cause (e.g., "Operation not supported by BusinessMap API")
2. Whether the error is transient (retry suggested) or permanent (user action required)
3. Actionable remediation steps where applicable

**Rationale**: Reduces user frustration and support burden. Clear error messages enable self-service problem resolution and improve overall user experience.

### Performance Targets

- Single-resource operations: Complete within 2 seconds
- Bulk operations (≤50 resources): Complete within 10 seconds
- Dependency analysis overhead: <500ms for bulk deletes
- API rate limiting: Exponential backoff with max 3 retry attempts

**Rationale**: Provides measurable performance standards. Ensures responsive user experience while respecting BusinessMap API rate limits.

### Documentation Standards

Tool descriptions MUST include:

- Supported CRUD operations with explicit limitations
- Required vs. optional parameters
- Example usage for common scenarios
- Links to relevant BusinessMap API documentation

**Rationale**: Enables self-service adoption and reduces onboarding friction. Clear documentation reduces support burden and improves user satisfaction.

## Process Integrity

### Success Criteria Immutability

Success criteria defined in specifications MUST NOT be changed during implementation without explicit stakeholder approval and formal spec revision. When targets prove unreachable, teams MUST report honest progress against original criteria and request stakeholder decision on: (1) Accept current results, (2) Continue work to meet original target, or (3) Revise specification with documented rationale.

**Rationale**: Prevents "goal post moving" that undermines trust. Changing success criteria post-facto to match achieved results is dishonest success. Better to fail honestly at difficult targets than succeed dishonestly at easy targets.

**Examples**:

- ❌ Bad: Achieve 42.6% reduction, change target in final report to "30-40%", claim success
- ✅ Good: Achieve 42.6% reduction against 68% target, report gap, request stakeholder decision

### Measurement Completeness

All success criteria (SC-\*) explicitly stated in specifications MUST be measured and reported before declaring implementation complete. When criteria require collective measurements (e.g., "top 3 tools collectively ≤X"), individual measurements are insufficient - the collective sum MUST be calculated and validated.

**Rationale**: Prevents selective measurement that hides failures. Explicit requirements exist for a reason - skipping measurements often indicates awareness that criteria would fail.

**Implementation**:

- Extract all SC-\* criteria into checklist during planning
- Validate each measurement before final sign-off
- Report any unmeasured criteria as incomplete work

### Honest Documentation

User-facing documentation MUST accurately reflect implementation reality. Claims about features, performance, or compatibility MUST be verified and match actual behavior. When gaps exist between targets and achievements, documentation MUST report both the target and actual result with clear gap analysis.

**Rationale**: Documentation is a user contract. False claims (zero breaking changes when breaks exist, 68% reduction when 42.6% achieved) violate user trust and create support burden when reality doesn't match promises.

**Examples**:

- ❌ Bad: "Zero breaking changes" when schema changes are breaking
- ✅ Good: "Breaking changes in create_card, update_card (see migration guide)"
- ❌ Bad: "68% token reduction" when 42.6% achieved
- ✅ Good: "42.6% reduction (target 68%, see retrospective for gap analysis)"
- ❌ Bad: "100% test coverage" when actually 57% coverage
- ✅ Good: "57% coverage (target 95%, priority: tool-profiles.ts at 0%)"

## Governance

### Constitution Authority

This constitution supersedes all other development practices and documentation. All pull requests MUST verify compliance with constitutional principles before merge. Violations MUST be documented and justified with explicit rationale.

### Amendment Process

1. Proposed amendments MUST be documented with clear rationale and impact analysis
2. Version numbering follows semantic versioning:
   - MAJOR: Removal or redefinition of core principles (breaking changes)
   - MINOR: Addition of new principles or material expansions
   - PATCH: Clarifications, wording improvements, non-semantic refinements
3. All dependent templates (spec, plan, tasks) MUST be updated to reflect amendments
4. Amendment history MUST be preserved in version control

### Compliance Review

- All features MUST demonstrate alignment with Core Principles before implementation
- Specifications MUST reference applicable constitutional principles in scope/assumptions sections
- Implementation reviews MUST verify adherence to Quality Standards
- CLAUDE.md provides runtime guidance and delegates to this constitution for governance authority

**Version**: 1.1.0 | **Ratified**: 2025-10-24 | **Last Amended**: 2025-11-19
