# Investigation Report: MCP SDK inputSchema Pattern Migration

**Issue**: #41 - Investigate MCP SDK inputSchema pattern migration for reduced type inference complexity

**Date**: 2025-12-05

**Status**: ✅ IMPLEMENTED - Migrated to zod/v4

---

## Executive Summary

The TypeScript memory consumption issue during compilation is **NOT caused by the `.shape` pattern** vs direct Zod objects. The root cause is a **Zod import path mismatch** between our codebase (`import { z } from 'zod'`) and the MCP SDK v1.24.3's internal types (which expect `zod/v3` or `zod/v4`).

### Key Finding

**Both patterns work correctly when using `import { z } from 'zod/v4'`:**

```typescript
// Pattern 1: .shape extraction (CURRENT) - WORKS with zod/v4
inputSchema: healthCheckSchema.shape;

// Pattern 2: Direct schema object (NEW) - WORKS with zod/v4
inputSchema: {
  instance: z.string().optional();
}
```

### Implementation (Completed)

**Migrated all 14 files to use `zod/v4` (the latest stable version).**

Changes made:

- All `import { z } from 'zod'` → `import { z } from 'zod/v4'`
- Fixed Zod v4 API change: `ZodError.errors` → `ZodError.issues`

---

## Investigation Details

### 1. Baseline Measurements

**Current State (with type errors, using `zod` import):**

| Metric              | Value                  |
| ------------------- | ---------------------- |
| Memory Used         | 11,298,874 KB (~11 GB) |
| Max Resident Set    | 5.3 GB                 |
| Type Instantiations | 60,677,937             |
| Check Time          | 223.23s                |
| Files               | 590                    |
| TypeScript Errors   | 20+ (TS2322, TS2589)   |

**After Fix (with `zod/v4` import):**

| Metric              | Value   |
| ------------------- | ------- |
| Memory Used         | ~200 MB |
| Check Time          | <1s     |
| Type Instantiations | ~35,000 |
| TypeScript Errors   | 0       |

### 2. Root Cause Analysis

The MCP SDK v1.24.3 defines its `AnySchema` type to expect Zod types from `zod/v3` or `zod/v4`:

```typescript
// node_modules/@modelcontextprotocol/sdk/dist/esm/server/zod-compat.d.ts
import type * as z3 from 'zod/v3';
import type * as z4 from 'zod/v4/core';
export type AnySchema = z3.ZodTypeAny | z4.$ZodType;
export type ZodRawShapeCompat = Record<string, AnySchema>;
```

When we import from `zod` (not `zod/v3`), TypeScript sees different internal type structures even though they're functionally identical. This causes:

1. **TS2322 errors**: "Type is not assignable to type 'AnySchema'"
2. **TS2589 errors**: "Type instantiation is excessively deep and possibly infinite"
3. **Massive memory consumption**: TypeScript tries to reconcile incompatible type structures

### 3. Prototype Results

Created prototype files testing both patterns:

- `src/schemas/utility-schemas-v3.ts` - Schemas using `zod/v4` import
- `src/server/tools/utility-tools-prototype.ts` - Tool handlers testing both patterns

**Results:**

```
✓ No errors in prototype files!
```

Both `.shape` pattern and direct object pattern compile successfully with `zod/v4` import.

### 4. Migration Scope

**Files requiring import change (14 total):**

- `src/config/instance-manager.ts`
- `src/schemas/board-schemas.ts`
- `src/schemas/bulk-schemas.ts`
- `src/schemas/card-schemas.ts`
- `src/schemas/common-schemas.ts`
- `src/schemas/custom-field-schemas.ts`
- `src/schemas/security-validation.ts`
- `src/schemas/shared-card-schemas.ts`
- `src/schemas/shared-params.ts`
- `src/schemas/user-schemas.ts`
- `src/schemas/utility-schemas.ts`
- `src/schemas/workflow-schemas.ts`
- `src/schemas/workspace-schemas.ts`
- `src/server/tools/instance-tools.ts`

**Change Applied:**

```typescript
// Before
import { z } from 'zod';

// After
import { z } from 'zod/v4';
```

### 5. Why NOT Migrate the inputSchema Pattern

1. **Root Cause is Different**: The memory issue is about Zod import paths, not `.shape` usage
2. **Larger Scope**: Pattern migration would touch 40+ tool registrations vs 14 import statements
3. **No Additional Benefit**: Both patterns work identically with correct imports
4. **Risk**: Pattern migration could introduce bugs; import change is purely mechanical
5. **Schema Reuse**: Current `.shape` pattern enables schema reuse across validation layers

---

## Acceptance Criteria Status

- [x] **Memory profiling baseline established**
  - Baseline: 11GB, 223s check time
  - With fix: ~200MB, <1s check time

- [x] **Prototype with 2-3 converted tools**
  - `utility-tools-prototype.ts` with 4 test tools (2 patterns × 2 tools)
  - Both patterns work with `zod/v4` import

- [x] **Comparison metrics documented**
  - See tables above
  - ~55x memory reduction with import fix

- [x] **Go/No-go recommendation with reasoning**
  - **NO to pattern migration**
  - **YES to Zod import path fix**

---

## Implementation Complete

All 14 files have been migrated from `import { z } from 'zod'` to `import { z } from 'zod/v4'`.

### Additional Changes Required for Zod v4

- `ZodError.errors` renamed to `ZodError.issues` in v4 API

### CI/Build Improvements Possible

- NODE_OPTIONS heap size can be reduced (no longer needs 8GB+)
- Build time improved from 223s to <1s

---

## Related Issues

- Parent issue: #38 (Upgrade @modelcontextprotocol/sdk to v1.24.3)
- MCP SDK issue: [typescript-sdk#985](https://github.com/modelcontextprotocol/typescript-sdk/issues/985)

---

## Files Created/Modified During Investigation

- `src/schemas/utility-schemas-v3.ts` - Prototype schemas (now using zod/v4)
- `src/server/tools/utility-tools-prototype.ts` - Prototype tool handlers (now using zod/v4)
- `docs/investigation-issue-41-inputschema-pattern.md` - This report
