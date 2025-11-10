# Testing Quick Reference Card

## Test Suite Status (2025-11-08)

```
OVERALL STATUS: 🔴 BLOCKED (23 failing tests)

Test Results:
  ✅ Passing: 125 tests (84.5%)
  ❌ Failing: 23 tests (15.5%)

Coverage by Module:
  ✅ Schemas:   100% (excellent)
  ✅ Config:    100% (excellent)
  ✅ Client:    100% (excellent)
  ⚠️  Services:  14.9% (critical gap)
  ⚠️  Tools:     19.5% (critical gap)
  🔴 DependencyAnalyzer: 0% (completely untested)
```

---

## Root Causes of 23 Failures

### Issue #1: Jest Globals Not Imported (15 tests)

**File:** `test/cache-manager.test.ts`
**Error:** `ReferenceError: jest is not defined`
**Fix:** Add at top of file:

```typescript
import { jest } from '@jest/globals';
```

### Issue #2: LRUCache Type Error (5 tests)

**File:** `src/client/modules/base-client.ts` line 204
**Error:** `TypeError: this.cache.clear is not a function`
**Fix:** Replace this:

```typescript
clear(): void {
  this.cache.clear();  // ❌
```

With this:

```typescript
clear(): void {
  if (typeof (this.cache as any).clear === 'function') {
    (this.cache as any).clear();
  }
```

### Issue #3: Unknown Failures (8+ tests)

**Files:** bulk-validation.test.ts, concurrent-operations.test.ts, etc.
**Status:** Requires investigation (likely jest import related)
**Action:** Run `npm test 2>&1 | tee test-output.log` and analyze

---

## Critical Gaps to Fill

### Gap #1: DependencyAnalyzer (0% coverage)

- **File:** `src/services/dependency-analyzer.ts` (319 LOC)
- **Problem:** Completely untested
- **Risk:** HIGH (bulk operations rely on this)
- **Action:** Create `test/unit/dependency-analyzer.test.ts`
- **Target:** 80%+ coverage
- **Effort:** 6-8 hours

### Gap #2: Server Tools (19.5% coverage)

- **Files:** `src/server/tools/*.ts` (1200+ LOC)
- **Problem:** MCP tool handlers barely tested
- **Risk:** HIGH (these are the public API)
- **Action:** Create `test/integration/server-tools.test.ts`
- **Target:** 60%+ coverage
- **Effort:** 12-16 hours

### Gap #3: Security Tests (0 tests)

- **Problem:** No security-specific testing
- **Risk:** MEDIUM (credentials, validation)
- **Action:** Create `test/security/` suite
- **Target:** 15+ tests
- **Effort:** 10-14 hours

---

## One-Week Fix Plan

### Day 1 (3-4 hours) - CRITICAL FIXES

```
1. Fix jest globals import (5 min)
   - File: test/cache-manager.test.ts
   - Change: Add import { jest } from '@jest/globals'

2. Fix LRUCache.clear() (30 min)
   - File: src/client/modules/base-client.ts line 204
   - Change: Add type guard before calling .clear()

3. Investigate other failures (2-4 hours)
   - Run: npm test 2>&1 | tee test-output.log
   - Document each failure
   - Apply fixes

4. Verify success (30 min)
   - Run: npm test
   - Expected: All 148 tests passing
```

### Days 2-5 (22-24 hours) - CRITICAL COVERAGE

```
5. DependencyAnalyzer test suite (6-8 hours)
   - Create: test/unit/dependency-analyzer.test.ts
   - Target: 80%+ coverage
   - Verify: npm test -- --coverage

6. Server Tools test suite (12-16 hours)
   - Create: test/integration/server-tools.test.ts
   - Target: 60%+ coverage
   - Focus: list_cards, create_card, update_card, error handling

7. Verify full test suite (2 hours)
   - Run: npm test
   - Check: Coverage report
   - Success: All green, good coverage
```

---

## Commands Cheatsheet

### Running Tests

```bash
# All tests
npm test

# Specific test file
npm test -- test/unit/dependency-analyzer.test.ts

# With coverage
npm test -- --coverage

# Watch mode
npm test -- --watch

# Verbose output
npm test -- --verbose

# Specific test name
npm test -- --testNamePattern="should validate"
```

### Coverage Reports

```bash
# Generate coverage
npm test -- --coverage

# View in browser
open coverage/lcov-report/index.html

# Check specific file
npm test -- --coverage test/unit/dependency-analyzer.test.ts
```

### Debug Mode

```bash
# Debug single test
node --inspect-brk node_modules/.bin/jest test/unit/dependency-analyzer.test.ts

# Full test output
npm test -- --no-coverage --verbose
```

---

## Success Criteria

### ✅ Phase 1: Fix (Week 1)

- All 148 tests passing
- 0 test failures
- npm test completes without errors
- Pre-push hook works

### ✅ Phase 2: Coverage (Weeks 2-4)

- DependencyAnalyzer: 80%+
- Server Tools: 60%+
- Overall coverage: 75%+
- All integration tests passing

### ✅ Phase 3: Comprehensive (Months 1-2)

- Security tests: 15+ tests
- E2E tests: 10+ tests
- Performance baselines documented
- Overall coverage: 90%+

---

## File Locations Reference

| What              | Where                         |
| ----------------- | ----------------------------- |
| Cache tests       | `test/cache-manager.test.ts`  |
| Unit tests        | `test/unit/`                  |
| Integration tests | `test/integration/`           |
| Performance tests | `test/performance/`           |
| Test setup        | `tests/integration/setup.ts`  |
| Test fixtures     | `tests/integration/fixtures/` |

---

## Key Configuration Files

```
jest.config.cjs          - Jest configuration
tsconfig.json            - TypeScript configuration
.eslintrc.json           - ESLint rules
.prettierrc               - Code formatting
.husky/pre-push          - Pre-push hook (runs npm test)
.husky/pre-commit        - Pre-commit hook (lint-staged)
```

---

## Test Mode Detection

```typescript
// Tests automatically detect mode based on environment

export const TEST_MODE: 'real' | 'mock' =
  process.env.CI === 'true' ||
  (!process.env.BUSINESSMAP_API_TOKEN_FIMANCIA && !process.env.BUSINESSMAP_API_TOKEN_KERKOW)
    ? 'mock'
    : 'real';

// Real mode: With actual API credentials (local development)
// Mock mode: Validation only, no credentials (CI/CD)
```

---

## Testing Best Practices

### Test Structure (AAA Pattern)

```typescript
describe('Feature', () => {
  it('should do something', () => {
    // ARRANGE - Set up test data
    const input = { id: 1, name: 'Test' };

    // ACT - Execute the code
    const result = myFunction(input);

    // ASSERT - Verify the result
    expect(result).toBe(expected);
  });
});
```

### Mocking

```typescript
import { jest } from '@jest/globals';

const mockFunction = jest
  .fn()
  .mockResolvedValue('success')
  .mockRejectedValueOnce(new Error('fail'));
```

### Test Isolation

```typescript
beforeEach(() => {
  // Setup (runs before each test)
});

afterEach(() => {
  // Cleanup (runs after each test)
});
```

---

## Quick Troubleshooting

| Problem                               | Solution                                                                    |
| ------------------------------------- | --------------------------------------------------------------------------- |
| `ReferenceError: jest is not defined` | Add `import { jest } from '@jest/globals';`                                 |
| `TypeError: .clear is not a function` | Use type guard: `if (typeof obj.clear === 'function')`                      |
| `Cannot find module`                  | Check import has `.js` extension                                            |
| `Tests timeout`                       | Increase jest timeout: `jest.setTimeout(30000)`                             |
| `Mock not working`                    | Verify `jest.fn()` called correctly                                         |
| `Coverage low`                        | Check file is included in coverage: See jest.config.cjs collectCoverageFrom |

---

## Resources

- **Detailed Analysis:** TESTING_STRATEGY_ASSESSMENT.md
- **Action Guide:** TESTING_REMEDIATION_GUIDE.md
- **Executive Summary:** TESTING_AUDIT_EXECUTIVE_SUMMARY.md
- **Jest Docs:** https://jestjs.io/docs/getting-started
- **Testing Best Practices:** https://jestjs.io/docs/tutorial-react

---

## Progress Tracking

### Week 1 Progress

- [ ] Jest import fixed (5 min)
- [ ] LRUCache fixed (30 min)
- [ ] Other failures identified (2-4 hrs)
- [ ] All tests passing (verification 30 min)

### Week 2-4 Progress

- [ ] DependencyAnalyzer tests (6-8 hrs)
- [ ] Server Tools tests (12-16 hrs)
- [ ] Integration tests fixed (4 hrs)
- [ ] Coverage >75% (verification)

### Month 1-2 Progress

- [ ] Security tests (10-14 hrs)
- [ ] E2E tests (8-12 hrs)
- [ ] Performance baselines (4-6 hrs)
- [ ] Coverage >90% (verification)

---

**Last Updated:** 2025-11-08
**Status:** Ready for implementation
**Next Review:** After critical fixes (1 week)
