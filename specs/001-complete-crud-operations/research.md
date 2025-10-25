# Research: Complete CRUD Operations

**Feature**: 001-complete-crud-operations
**Date**: 2025-10-24
**Status**: Phase 0 Complete

---

## Executive Summary

Research reveals **significantly better API coverage** than initially expected, enabling ~80% overall CRUD coverage (vs. 65-75% estimated). Three major operation categories previously marked uncertain/unsupported are **fully available**:

- **Comments**: Full CRUD ✅ (spec said partial)
- **Subtasks**: Full CRUD ✅ (spec said uncertain)
- **Custom Field Definitions**: Full CRUD ✅ (spec assumed admin-only)

**Impact**: +12 new operations ready for immediate implementation.

**Rate Limits**: Documented at 600/hr, 30/min (default). Minimal viable handling strategy defined.

---

## Research Question 1: API Rate Limits & Development Environment

### Decision: Minimal Viable Rate Limit Strategy

**Chosen Approach**:
```typescript
// 1. axios-retry for automatic RL02 handling
import axiosRetry from 'axios-retry';
axiosRetry(client, {
  retries: 3,
  retryCondition: (error) => error.response?.data?.error === 'RL02',
  retryDelay: axiosRetry.exponentialDelay
});

// 2. Header monitoring (warn at 80% threshold)
client.interceptors.response.use(response => {
  const remaining = parseInt(response.headers['x-ratelimit-perminute-remaining']);
  if (remaining <= 6) { // 80% of 30
    console.warn(`Rate limit warning: ${remaining} requests remaining this minute`);
  }
  return response;
});

// 3. No request queue (YAGNI)
```

**Rationale**:
- Standard library solutions prevent reinventing complex patterns
- 50 lines of code vs. 500+ for custom queue/backoff logic
- Addresses actual failure mode (RL02 errors) without premature optimization
- Can add queue layer later if load testing reveals need

**Alternatives Considered**:
1. ❌ **Custom RequestQueue with proactive throttling**: Over-engineered without usage data proving bottleneck
2. ❌ **Startup quota detection via /apiLimits**: Lazy load on first RL02 error is sufficient
3. ❌ **Infrastructure-layer rate limiting (API gateway)**: Adds deployment complexity for uncertain benefit

---

### Rate Limit Specifications

| Metric | Default Value | Detection Method | Error Handling |
|--------|--------------|------------------|----------------|
| **Hourly Limit** | 600 requests | X-RateLimit-PerHour-Remaining header | RL02 error code |
| **Minutely Limit** | 30 requests | X-RateLimit-PerMinute-Remaining header | RL02 error code |
| **Retry After** | N/A | `retry_after` field in error response | Exponential backoff |
| **Custom Plans** | Variable (not documented) | `/apiLimits` endpoint | Lazy detection |

**Source**: OpenAPI v2 specification from `https://demo.kanbanize.com/openapi/json`

**Development Environment**:
- ✅ Demo instance: `https://demo.kanbanize.com/api/v2`
- ✅ 14-day free trial accounts (full production-like environment)
- ❌ No dedicated sandbox with elevated limits
- ❌ No test quotas for development

---

## Research Question 2: Uncertain API Operations

### Decision: Implement 10 Confirmed Operations (Phase 1)

**API Verification Results**:

| Category | Original Status | Verified Status | Coverage | New Operations |
|----------|----------------|-----------------|----------|----------------|
| **Comments** | Partial (GET/POST only) | ✅ Full CRUD | 40% → **100%** | +3 operations |
| **Subtasks** | Uncertain (update/delete) | ✅ Full CRUD | 40% → **100%** | +2 operations |
| **Custom Fields** | Assumed admin-only | ✅ Full CRUD | 16% → **100%** | +5 operations |
| **Workflows** | Uncertain | ❌ Not supported (UI-only) | 25% (read-only) | 0 operations |
| **Columns** | Uncertain | ❌ Not supported (create/update) | 33% (read-only) | 0 operations |
| **Lanes** | Known partial | ❌ Not supported (update/delete) | 60% (create/read) | 0 operations |

**Overall Coverage**: 50% → **~80%** (+30 percentage points)

---

### Comments: Full CRUD Available ✅

**Endpoints Confirmed**:
```
GET    /cards/{card_id}/comments           → List comments
GET    /cards/{card_id}/comments/{id}      → Get comment
POST   /cards/{card_id}/comments           → Create comment
PATCH  /cards/{card_id}/comments/{id}      → Update comment ✨ NEW
DELETE /cards/{card_id}/comments/{id}      → Delete comment ✨ NEW
```

**Spec Correction Required** (spec.md:19):
- ❌ Current: "Comments: GET ✅, POST ✅, UPDATE ❌, DELETE ❌"
- ✅ Correct: "Comments: Full CRUD supported (GET, POST, PATCH, DELETE)"

**Implementation Impact**:
- Add `updateCardComment()` to card-client.ts
- Add `deleteCardComment()` to card-client.ts
- Expose 2 new MCP tools

---

### Subtasks: Full CRUD Available ✅

**Endpoints Confirmed**:
```
GET    /cards/{card_id}/subtasks           → List subtasks
GET    /cards/{card_id}/subtasks/{id}      → Get subtask
POST   /cards/{card_id}/subtasks           → Create subtask
PATCH  /cards/{card_id}/subtasks/{id}      → Update subtask ✨ NEW
DELETE /cards/{card_id}/subtasks/{id}      → Delete subtask ✨ NEW
```

**Spec Correction Required** (spec.md:20):
- ❌ Current: "Subtasks: GET ✅, POST ✅, UPDATE ❓, DELETE ❌"
- ✅ Correct: "Subtasks: Full CRUD supported (GET, POST, PATCH, DELETE)"

**Implementation Impact**:
- Add `updateCardSubtask()` to card-client.ts
- Add `deleteCardSubtask()` to card-client.ts
- Expose 2 new MCP tools

---

### Custom Field Definitions: Full CRUD Available ✅

**Endpoints Confirmed**:
```
# Top-level endpoints
GET    /customFields                               → List all fields ✨ NEW
POST   /customFields                               → Create field ✨ NEW
GET    /customFields/{field_id}                    → Get field ✨ NEW
PATCH  /customFields/{field_id}                    → Update field ✨ NEW
DELETE /customFields/{field_id}                    → Delete field ✨ NEW

# Board-scoped endpoints
GET    /boards/{board_id}/customFields             → List board fields ✨ NEW
POST   /boards/{board_id}/customFields             → Add field to board ✨ NEW
GET    /boards/{board_id}/customFields/{field_id}  → Get board field ✨ NEW
```

**Spec Correction Required** (spec.md:28-29):
- ❌ Current: "Field Definitions: GET ✅, POST ❓ (likely admin-only), UPDATE ❓, DELETE ❓"
- ✅ Correct: "Field Definitions: Full CRUD supported (no admin restrictions found)"

**Implementation Impact**:
- Create new `custom-field-client.ts` module
- Implement 8 client methods (none exist currently): 5 top-level + 3 board-scoped
- Expose 8 new MCP tools
- **Note**: Field **values** on cards already fully supported via card update operations

---

### Workflows: Not Supported (UI-Only) ❌

**Endpoints Available**:
```
GET /boards/{id}/workflows/{id}/cycleTimeColumns  → Read cycle time config only
```

**Findings**:
- ❌ No POST /workflows endpoint
- ❌ No PATCH /workflows endpoint
- ❌ No DELETE /workflows endpoint
- Workflow creation/modification appears to be UI-only or admin-console operations

**Spec Correction Required** (spec.md:23):
- ❌ Current: "Workflows: GET ✅, POST ❓, UPDATE ❓, DELETE ❓"
- ✅ Correct: "Workflows: Read-only (cycle time columns); create/update/delete not supported by API"

**FR-007 to FR-009**: Change from "SHOULD" requirements with verification notes to explicit "NOT SUPPORTED - UI-only operations"

---

### Columns: Partially Supported ⚠️

**Endpoints Available**:
```
GET /boards/{board_id}/columns  → Read columns
```

**Findings**:
- ✅ GET confirmed
- ❌ No POST /columns endpoint (creation not supported)
- ❌ No PATCH /columns endpoint (update not supported)
- ❓ DELETE /columns/{id} mentioned in spec but not in OpenAPI → **needs testing**

**Spec Correction Required** (spec.md:24):
- ❌ Current: "Columns: GET ✅, POST ❓, UPDATE ❓, DELETE ✅"
- ✅ Correct: "Columns: GET ✅, POST ❌, UPDATE ❌, DELETE ❓ (requires testing)"

**FR-010 to FR-012**:
- FR-010/011 (create/update): Change to "NOT SUPPORTED"
- FR-012 (delete): Keep as "SHOULD" but add "requires API testing to confirm"

---

### Lanes: Partially Supported ⚠️

**Endpoints Available**:
```
GET  /boards/{board_id}/lanes  → List lanes
GET  /lanes/{lane_id}           → Get lane
POST /lanes                     → Create lane
```

**Findings**:
- ✅ Create/Read confirmed (already implemented)
- ❌ No PATCH /lanes endpoint (update not supported)
- ❌ No DELETE /lanes endpoint (delete not supported)

**Note**: Lane updates for cards (moving cards between lanes) are supported via card move operations. This refers to lane **definition** updates (name, color, position).

---

## Research Question 3: Best Practices for MCP Tool Design

### Decision: Maintain Existing Patterns

**Chosen Approach**:
1. **Client Layer**: Implement operation in `{resource}-client.ts` first
2. **Schema Layer**: Define Zod schema in `{resource}-schemas.ts`
3. **Tool Layer**: Expose as MCP tool in `{resource}-tools.ts`
4. **Testing**: Integration test against demo API instance

**Rationale**:
- Existing codebase follows this pattern consistently
- Separation of concerns (client logic vs. MCP protocol)
- Enables reuse of client methods in bulk operations
- Facilitates testing at multiple layers

**Alternatives Considered**:
- ❌ **Direct tool-to-API coupling**: Harder to test, violates existing architecture
- ❌ **Shared schema layer**: Over-abstraction for current scale

---

## Implementation Recommendations

### Phase 1: High-Priority Operations (Immediate)

**Comments** (2 new):
1. `update_card_comment` → `PATCH /cards/{card_id}/comments/{comment_id}`
2. `delete_card_comment` → `DELETE /cards/{card_id}/comments/{comment_id}`

**Subtasks** (2 new):
3. `update_card_subtask` → `PATCH /cards/{card_id}/subtasks/{subtask_id}`
4. `delete_card_subtask` → `DELETE /cards/{card_id}/subtasks/{subtask_id}`

**Custom Fields** (8 new):
5. `list_custom_fields` → `GET /customFields`
6. `create_custom_field` → `POST /customFields`
7. `get_custom_field` → `GET /customFields/{field_id}`
8. `update_custom_field` → `PATCH /customFields/{field_id}`
9. `delete_custom_field` → `DELETE /customFields/{field_id}`
10. `list_board_custom_fields` → `GET /boards/{board_id}/customFields`
11. `add_board_custom_field` → `POST /boards/{board_id}/customFields`
12. `get_board_custom_field` → `GET /boards/{board_id}/customFields/{field_id}`

**Total Phase 1**: 12 client methods + 12 MCP tools

**Estimated Effort**: 2-3 days (following existing patterns)

---

### Phase 2: Existing Operations (Quick Wins)

Expose 5 existing client methods as MCP tools (spec.md:39-45):
1. `update_workspace` (workspace-client.ts:33)
2. `delete_workspace` (workspace-client.ts:48)
3. `update_board` (board-client.ts:64)
4. `delete_board` (board-client.ts:73)
5. `delete_card` (card-client.ts:167)

**Total Phase 2**: 5 MCP tools (client methods already exist)

**Estimated Effort**: 4-6 hours (schema + tool wiring only)

---

### Phase 3: Verification Testing (Optional)

**Column Delete**: Test `DELETE /columns/{id}` against demo API
- If confirmed: Add client method + tool
- If not supported: Update spec to mark as unavailable

**Estimated Effort**: 1-2 hours

---

## Specification Updates Required

### Clarifications Section (spec.md:18-29)

**Session 2025-10-24 - API Research Findings** needs complete rewrite:

```markdown
### Session 2025-10-24 - API Verification Results

**Confirmed CRUD Operations (via OpenAPI v2 spec)**:
- Comments: Full CRUD ✅ (GET, POST, PATCH, DELETE)
- Subtasks: Full CRUD ✅ (GET, POST, PATCH, DELETE)
- Custom Field Definitions: Full CRUD ✅ (GET, POST, PATCH, DELETE)
- Outcomes: Read-only ✅ (GET only; creation/modification not available)

**Not Supported by API**:
- Workflows: Read-only (cycle time columns only); create/update/delete are UI-only operations
- Columns: Read-only (GET only); create/update not available; delete requires testing
- Lanes: Partial (create/read only); update/delete not available

**Overall Coverage**: ~80% (up from 50% initial estimate)
```

---

### Functional Requirements Updates

**FR-003** (Comments):
```diff
- Users MUST be able to create and read card comments with text content, timestamps, and author attribution (API supports GET and POST only; UPDATE and DELETE not available)
+ Users MUST be able to perform full CRUD operations on card comments including text content, timestamps, and author attribution (API supports GET, POST, PATCH, DELETE)
```

**FR-005** (Subtasks):
```diff
- System MUST support creating and reading card subtasks with description, owner, deadline, and completion status (API supports GET and POST; UPDATE and DELETE capabilities uncertain)
+ System MUST support full CRUD operations on card subtasks with description, owner, deadline, and completion status (API supports GET, POST, PATCH, DELETE)
```

**FR-007 to FR-009** (Workflows):
```diff
- Users SHOULD be able to create workflows with configurable columns and WIP limits (requires API access verification; may be admin-only or UI-only operation)
+ Users CAN view workflow cycle time configurations; workflow creation/modification NOT SUPPORTED (UI-only operations)
```

**FR-010 to FR-011** (Columns):
```diff
- Users SHOULD be able to create/update columns within workflows with properties including name, WIP limit, and position (requires API access verification; may be admin-only or UI-only operation)
+ Users CAN view columns; column creation/modification NOT SUPPORTED (UI-only operations)
```

**FR-015** (Custom Field Definitions):
```diff
- Users SHOULD be able to create, update, and delete custom field definitions (field types, schemas, options) subject to admin API access verification
+ Users MUST be able to perform full CRUD operations on custom field definitions including field types, schemas, options, and constraints (no admin restrictions found)
```

---

## Success Criteria Updates

**SC-004** (Card Management):
```diff
- Card management achieves approximately 70% CRUD coverage for confirmed operations (comments: create/read, subtasks: create/read, outcomes: read-only, lane updates: full support)
+ Card management achieves approximately 95% CRUD coverage (comments: full CRUD, subtasks: full CRUD, outcomes: read-only, lane updates: full support)
```

**SC-006** (Custom Field Management):
```diff
- Custom field management achieves 100% coverage for field values on cards; field definition management (create/update/delete schemas) requires admin API verification
+ Custom field management achieves 100% coverage for both field definitions and field values on cards
```

**SC-007** (Overall Coverage):
```diff
- Overall CRUD coverage across all resource types reaches approximately 65-75% based on confirmed API capabilities (up from current 50%)
+ Overall CRUD coverage across all resource types reaches approximately 80% based on confirmed API capabilities (up from current 50%)
```

---

## Risk Assessment

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|---------|------------|
| Rate limits hit in production | Medium | Medium | Implement axios-retry + header monitoring |
| Column DELETE endpoint doesn't exist | Medium | Low | Mark as optional; verify via testing |
| Custom field CRUD requires admin perms | Low | Medium | OpenAPI shows no restrictions; test early |
| Demo API differs from production | Low | High | Test against both demo + production instances |

---

## References

1. **BusinessMap OpenAPI v2 Specification** (Official API Source)
   - Interactive Docs: https://demo.kanbanize.com/openapi (for browsing endpoints)
   - JSON Schema: https://demo.kanbanize.com/openapi/json (for code generation)
   - Date: 2025-10-24
   - Confidence: High (official API schema)

2. **Rate Limit Research Report**
   - Location: Project root (generated during research phase)
   - Key findings: 600/hr, 30/min defaults; demo API available

3. **CRUD Verification Summary**
   - Location: `/CRUD_VERIFICATION_SUMMARY.md`
   - Key findings: 12 new operations confirmed; workflows/columns not supported

4. **Existing Codebase**
   - Client implementations: `src/clients/*-client.ts`
   - Schema definitions: `src/schemas/*-schemas.ts`
   - Tool implementations: `src/tools/*-tools.ts`

---

## Next Steps

1. ✅ **Research Complete** (this document)
2. ⏭️ **Design Phase**: Create data-model.md + contracts/
3. ⏭️ **Implementation**: Phase 1 (12 new operations) + Phase 2 (5 quick wins)
4. ⏭️ **Testing**: Integration tests against demo API
5. ⏭️ **Spec Updates**: Correct FR-003, FR-005, FR-007-011, FR-015, SC-004, SC-006, SC-007

---

**Research Status**: ✅ Complete
**Confidence Level**: High (based on official OpenAPI specification)
**Blockers**: None identified
**Ready for**: Phase 1 Design (data-model.md, contracts/)
