# Testing Remediation Guide: Action Items & Implementation

**Created:** 2025-11-08
**Target Completion:** 1 week
**Effort Estimate:** 55-68 hours (3-4 hours critical, 22-24 hours high, 30-40 hours medium)

---

## CRITICAL PHASE (Do This First - 3-4 Hours)

### Task C1: Fix Jest Globals Import

**Objective:** Unblock 15+ tests in cache-manager.test.ts

**File:** `/Users/neil/src/solo/businessmap-mcp/test/cache-manager.test.ts`

**Root Cause:** ESM modules don't have global `jest` object automatically available

**Action:**

Add this import at the very top of the file (after any license/comments):

```typescript
import { jest } from '@jest/globals';
```

**Full Example:**
```typescript
import { jest } from '@jest/globals';  // ← ADD THIS LINE

import { CacheManager } from '../src/client/modules/base-client';

describe('CacheManager', () => {
  let cache: CacheManager;

  beforeEach(() => {
    cache = new CacheManager(true, 1000);
  });

  // ... rest of tests
});
```

**Verification:**
```bash
cd /Users/neil/src/solo/businessmap-mcp
npm test -- test/cache-manager.test.ts

# Expected output: Tests run instead of ReferenceError
# Success: "PASS test/cache-manager.test.ts"
```

**Time Estimate:** 5 minutes

---

### Task C2: Fix LRUCache.clear() Type Mismatch

**Objective:** Resolve LRUCache not having `.clear()` method at runtime

**File:** `/Users/neil/src/solo/businessmap-mcp/src/client/modules/base-client.ts`

**Root Cause:** LRU-Cache v11 is CommonJS, ESM import has type mismatches

**Current Code (Line 204-208):**
```typescript
clear(): void {
  this.cache.clear();  // ❌ This fails - clear() doesn't exist on type
  this.pendingRequests.clear();
  this.keysByPrefix.clear();
  this.invalidationGeneration.clear();
}
```

**RECOMMENDED FIX - Type Guard:**

Replace the entire `clear()` method with:

```typescript
clear(): void {
  // Type guard: check if clear exists before calling
  if (this.cache && typeof (this.cache as any).clear === 'function') {
    (this.cache as any).clear();
  }
  this.pendingRequests.clear();
  this.keysByPrefix.clear();
  this.invalidationGeneration.clear();
}
```

**Why this approach:**
- ✅ Runtime safe (checks existence first)
- ✅ Doesn't break if LRU-Cache is updated
- ✅ Minimal code change
- ⚠️ Uses `any` cast (acceptable for external library quirk)

**ALTERNATIVE FIX - Recreate Cache:**

If the above doesn't work, recreate the cache:

```typescript
clear(): void {
  // For CommonJS/ESM mismatch, recreate the cache
  if (this.enabled) {
    const maxSize = this.cache.size > 0 ? this.cache.maxSize : 1000;
    this.cache = new LRUCache<string, CacheEntry<any>>({
      max: maxSize,
      disposeAfter: (value: CacheEntry<any>, key: string) => {
        setImmediate(() => {
          try {
            const parts = key.split(':');
            const prefix = parts[0] ?? key;
            this.keysByPrefix.get(prefix)?.delete(key);
            this.invalidationGeneration.delete(key);
          } catch (err) {
            console.error('Cache cleanup error:', err);
          }
        });
      },
    });
  }
  this.pendingRequests.clear();
  this.keysByPrefix.clear();
  this.invalidationGeneration.clear();
}
```

**Verification:**
```bash
npm test -- test/cache-manager.test.ts

# Expected: All cache tests pass
# Success: "✓ should execute fetcher on cache miss"
```

**Time Estimate:** 15-30 minutes

---

### Task C3: Identify Other Failing Tests

**Objective:** Understand remaining 8+ test failures

**Process:**

1. Run full test suite:
```bash
cd /Users/neil/src/solo/businessmap-mcp
npm test 2>&1 | tee test-failures.log
```

2. Analyze output and categorize failures:
```bash
# Extract failure summary
grep -A 5 "● " test-failures.log | head -100
```

3. For each failure, document:
   - Test file name
   - Test name
   - Error message
   - Stack trace (first 10 lines)
   - Root cause hypothesis

4. Create failure inventory file: `test-failure-inventory.md`

**Example Inventory Entry:**
```markdown
## Failure ID: F001
- **File:** test/bulk-validation.test.ts
- **Test:** should validate bulk operations
- **Error:** Cannot read property 'listCards' of undefined
- **Root Cause:** Mock not set up correctly, missing jest import likely
- **Fix:** Add jest globals import + review mock setup
```

5. Fix each failure:
   - Most are likely jest globals import (like cache-manager)
   - Some may be mock setup issues
   - Some may be environment configuration issues

**Time Estimate:** 2-4 hours (depending on number of unique failure types)

---

## VERIFICATION (30 Minutes)

### Task C4: Confirm All Tests Pass

**Objective:** Verify fix completeness

**Commands:**
```bash
# Run full test suite
npm test

# Expected output:
#   PASS test/cache-manager.test.ts
#   PASS test/bulk-validation.test.ts
#   PASS test/concurrent-operations.test.ts
#   PASS test/integration/...
#   ...
#   Test Suites: 14 passed, 14 total
#   Tests: 148 passed, 148 total
```

**Success Criteria:**
- ✅ All test files show PASS
- ✅ 148 tests passing
- ✅ 0 tests failing
- ✅ Coverage reports generated

**If tests still fail:**
1. Check coverage report: `coverage/coverage-final.json`
2. Document any remaining failures
3. Escalate with full error output

---

## HIGH PRIORITY PHASE (Do After Critical Phase - 22-24 Hours)

### Task H1: Create DependencyAnalyzer Test Suite

**Objective:** Bring DependencyAnalyzer from 0% → 80%+ coverage

**File Location:** Create `/Users/neil/src/solo/businessmap-mcp/test/unit/dependency-analyzer.test.ts`

**Test Structure Template:**

```typescript
/**
 * Unit Tests: DependencyAnalyzer Service
 *
 * Tests the dependency analysis logic for workspaces, boards, and cards
 * including error handling and edge cases.
 */

import { DependencyAnalyzer } from '../../src/services/dependency-analyzer.js';
import { BusinessMapClient } from '../../src/client/businessmap-client.js';
import type { Workspace, Board, Card } from '../../src/types/index.js';

describe('DependencyAnalyzer', () => {
  let analyzer: DependencyAnalyzer;
  let mockClient: jest.Mocked<BusinessMapClient>;

  beforeEach(() => {
    // Create mock client with all required methods
    mockClient = {
      getWorkspace: jest.fn(),
      listBoards: jest.fn(),
      listCards: jest.fn(),
      getCard: jest.fn(),
      // Add other required methods
    } as any;

    analyzer = new DependencyAnalyzer(mockClient);
  });

  // SECTION 1: Constructor & Initialization
  describe('constructor', () => {
    it('should initialize with a BusinessMapClient', () => {
      const analyzer = new DependencyAnalyzer(mockClient);
      expect(analyzer).toBeDefined();
      expect(analyzer).toBeInstanceOf(DependencyAnalyzer);
    });

    it('should throw error if client is null', () => {
      expect(() => {
        new DependencyAnalyzer(null as any);
      }).toThrow();
    });
  });

  // SECTION 2: analyzeWorkspaces
  describe('analyzeWorkspaces()', () => {
    it('should extract workspace names into nameMap', async () => {
      // Arrange
      const workspaceIds = [1, 2, 3];
      mockClient.getWorkspace
        .mockResolvedValueOnce({ workspace_id: 1, name: 'Alpha' } as Workspace)
        .mockResolvedValueOnce({ workspace_id: 2, name: 'Beta' } as Workspace)
        .mockResolvedValueOnce({ workspace_id: 3, name: 'Gamma' } as Workspace);

      // Act
      const result = await analyzer.analyzeWorkspaces(workspaceIds);

      // Assert
      expect(result.nameMap).toBeDefined();
      expect(result.nameMap instanceof Map).toBe(true);
      expect(result.nameMap.get(1)).toBe('Alpha');
      expect(result.nameMap.get(2)).toBe('Beta');
      expect(result.nameMap.get(3)).toBe('Gamma');
    });

    it('should handle empty workspace list', async () => {
      // Act
      const result = await analyzer.analyzeWorkspaces([]);

      // Assert
      expect(result.nameMap.size).toBe(0);
      expect(mockClient.getWorkspace).not.toHaveBeenCalled();
    });

    it('should propagate errors from getWorkspace', async () => {
      // Arrange
      const error = new Error('API Error: Rate limit exceeded');
      mockClient.getWorkspace.mockRejectedValueOnce(error);

      // Act & Assert
      await expect(analyzer.analyzeWorkspaces([1])).rejects.toThrow('API Error');
      expect(mockClient.getWorkspace).toHaveBeenCalledWith(1);
    });

    it('should handle partial failures gracefully', async () => {
      // Arrange: First succeeds, second fails
      mockClient.getWorkspace
        .mockResolvedValueOnce({ workspace_id: 1, name: 'Alpha' } as Workspace)
        .mockRejectedValueOnce(new Error('Second workspace failed'));

      // Act & Assert
      await expect(analyzer.analyzeWorkspaces([1, 2])).rejects.toThrow();
    });

    it('should call getWorkspace for each workspace ID', async () => {
      // Arrange
      mockClient.getWorkspace.mockResolvedValue({
        workspace_id: 1,
        name: 'Test'
      } as Workspace);

      // Act
      await analyzer.analyzeWorkspaces([1, 2, 3]);

      // Assert
      expect(mockClient.getWorkspace).toHaveBeenCalledTimes(3);
      expect(mockClient.getWorkspace).toHaveBeenNthCalledWith(1, 1);
      expect(mockClient.getWorkspace).toHaveBeenNthCalledWith(2, 2);
      expect(mockClient.getWorkspace).toHaveBeenNthCalledWith(3, 3);
    });

    it('should handle workspaces with special characters in names', async () => {
      // Arrange
      mockClient.getWorkspace.mockResolvedValueOnce({
        workspace_id: 1,
        name: 'Test™ Space™ (Beta) v2.0'
      } as Workspace);

      // Act
      const result = await analyzer.analyzeWorkspaces([1]);

      // Assert
      expect(result.nameMap.get(1)).toBe('Test™ Space™ (Beta) v2.0');
    });
  });

  // SECTION 3: analyzeBoards
  describe('analyzeBoards()', () => {
    it('should list and analyze boards for workspace', async () => {
      // Arrange
      const boards = [
        { board_id: 10, name: 'Board 1' },
        { board_id: 20, name: 'Board 2' },
      ] as Board[];
      mockClient.listBoards.mockResolvedValueOnce(boards);

      // Act
      const result = await analyzer.analyzeBoards(1);

      // Assert
      expect(result).toBeDefined();
      expect(mockClient.listBoards).toHaveBeenCalledWith(1);
    });

    it('should handle empty board list', async () => {
      // Arrange
      mockClient.listBoards.mockResolvedValueOnce([]);

      // Act
      const result = await analyzer.analyzeBoards(1);

      // Assert
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('should propagate errors from listBoards', async () => {
      // Arrange
      mockClient.listBoards.mockRejectedValueOnce(new Error('API Error'));

      // Act & Assert
      await expect(analyzer.analyzeBoards(1)).rejects.toThrow('API Error');
    });
  });

  // SECTION 4: analyzeCardLinks
  describe('analyzeCardLinks()', () => {
    it('should analyze links between cards', async () => {
      // Arrange
      mockClient.getCard.mockResolvedValueOnce({
        card_id: 100,
        linked_cards: [200, 300]
      } as any);

      // Act
      const result = await analyzer.analyzeCardLinks([100]);

      // Assert
      expect(result).toBeDefined();
      expect(mockClient.getCard).toHaveBeenCalled();
    });

    it('should handle cards with no links', async () => {
      // Arrange
      mockClient.getCard.mockResolvedValueOnce({
        card_id: 100,
        linked_cards: []
      } as any);

      // Act
      const result = await analyzer.analyzeCardLinks([100]);

      // Assert
      expect(result).toBeDefined();
    });
  });

  // SECTION 5: Error Scenarios
  describe('error handling', () => {
    it('should handle network timeouts gracefully', async () => {
      // Arrange
      const timeoutError = new Error('Request timeout');
      mockClient.getWorkspace.mockRejectedValueOnce(timeoutError);

      // Act & Assert
      await expect(analyzer.analyzeWorkspaces([1])).rejects.toThrow('timeout');
    });

    it('should handle authentication errors', async () => {
      // Arrange
      const authError = new Error('Unauthorized: Invalid token');
      mockClient.getWorkspace.mockRejectedValueOnce(authError);

      // Act & Assert
      await expect(analyzer.analyzeWorkspaces([1])).rejects.toThrow(
        'Unauthorized'
      );
    });

    it('should handle concurrent API errors', async () => {
      // Arrange
      mockClient.getWorkspace
        .mockRejectedValueOnce(new Error('Error 1'))
        .mockRejectedValueOnce(new Error('Error 2'));

      // Act & Assert
      await expect(analyzer.analyzeWorkspaces([1, 2])).rejects.toThrow();
    });
  });

  // SECTION 6: Performance Characteristics
  describe('performance', () => {
    it('should complete workspace analysis within reasonable time', async () => {
      // Arrange
      mockClient.getWorkspace.mockResolvedValue({
        workspace_id: 1,
        name: 'Test'
      } as Workspace);

      // Act
      const start = performance.now();
      await analyzer.analyzeWorkspaces(Array.from({ length: 100 }, (_, i) => i));
      const duration = performance.now() - start;

      // Assert: Should complete in reasonable time (< 5 seconds with mocked calls)
      expect(duration).toBeLessThan(5000);
    });

    it('should efficiently handle large card link analysis', async () => {
      // Arrange
      mockClient.getCard.mockResolvedValue({
        card_id: 100,
        linked_cards: Array.from({ length: 50 }, (_, i) => i)
      } as any);

      // Act
      const start = performance.now();
      await analyzer.analyzeCardLinks(
        Array.from({ length: 100 }, (_, i) => i)
      );
      const duration = performance.now() - start;

      // Assert
      expect(duration).toBeLessThan(10000);
    });
  });
});
```

**Checklist:**
- [ ] Create test file at correct location
- [ ] Import jest and all required types
- [ ] Implement all test sections above
- [ ] Add additional tests for any public methods not covered
- [ ] Verify all mocks are properly configured
- [ ] Run tests: `npm test -- test/unit/dependency-analyzer.test.ts`
- [ ] Check coverage: `npm test -- --coverage test/unit/dependency-analyzer.test.ts`
- [ ] Target: Coverage >80%

**Time Estimate:** 4-6 hours

---

### Task H2: Create Server Tools Integration Tests

**Objective:** Bring server tools from 19.5% → 60%+ coverage

**Focus on highest-impact tools first:**
1. `list_cards` (most used)
2. `create_card` (critical write)
3. `update_card` (critical write)
4. Error handling across all tools

**File Location:** Create `/Users/neil/src/solo/businessmap-mcp/test/integration/server-tools.test.ts`

**Test Structure Template:**

```typescript
/**
 * Integration Tests: Server Tool Handlers
 *
 * Tests MCP tool handlers for correctness, error handling,
 * and multi-instance functionality.
 */

import { jest } from '@jest/globals';
import type { Server as MCPServer } from '@modelcontextprotocol/sdk/server/index.js';

describe('Server Tool Handlers', () => {
  let server: MCPServer;
  let mockFactory: any;

  beforeEach(() => {
    // Mock MCP server and client factory
    server = {
      registerTool: jest.fn(),
      // ... other server methods
    } as any;

    mockFactory = {
      getClient: jest.fn(),
      getAvailableInstances: jest.fn().mockReturnValue(['default']),
    };
  });

  describe('list_cards tool', () => {
    beforeEach(() => {
      // Register the list_cards tool handler
      // For now, get the handler function from the actual registration
    });

    it('should list cards with valid parameters', async () => {
      // Arrange
      const mockCards = [
        { card_id: 1, title: 'Card 1' },
        { card_id: 2, title: 'Card 2' },
      ];
      mockFactory.getClient.mockResolvedValueOnce({
        listCards: jest.fn().mockResolvedValueOnce(mockCards),
      });

      // Act
      // Call the tool handler with valid params

      // Assert
      // Verify response structure and content
    });

    it('should handle missing required board_id', async () => {
      // Test validation of required parameters
    });

    it('should support pagination', async () => {
      // Test page and per_page parameters
    });

    it('should filter by card properties', async () => {
      // Test filtering functionality
    });

    it('should work across multiple instances', async () => {
      // Test with instance parameter
    });
  });

  describe('create_card tool', () => {
    it('should create card with required fields', async () => {
      // Test minimal card creation
    });

    it('should validate required parameters', async () => {
      // Test parameter validation
    });

    it('should reject in read-only mode', async () => {
      // Test read-only instance protection
    });

    it('should handle API errors gracefully', async () => {
      // Test error handling
    });

    it('should support optional fields', async () => {
      // Test with all optional fields
    });
  });

  describe('update_card tool', () => {
    it('should update card with valid parameters', async () => {
      // Test update operation
    });

    it('should require card_id', async () => {
      // Test required parameter
    });

    it('should reject in read-only mode', async () => {
      // Test read-only protection
    });
  });

  describe('Error handling across tools', () => {
    it('should not expose API token in error messages', async () => {
      // Critical security test
    });

    it('should handle API timeouts gracefully', async () => {
      // Test timeout handling
    });

    it('should provide helpful error messages', async () => {
      // Test error message quality
    });

    it('should log errors for debugging', async () => {
      // Test logging
    });
  });

  describe('Multi-instance functionality', () => {
    it('should route requests to correct instance', async () => {
      // Test instance parameter
    });

    it('should use default instance when not specified', async () => {
      // Test default instance selection
    });

    it('should reject requests for unavailable instances', async () => {
      // Test error handling for invalid instance
    });
  });

  describe('Tool parameter validation', () => {
    it('should validate board_id is numeric', async () => {
      // Test input validation
    });

    it('should validate enum values', async () => {
      // Test enum validation
    });

    it('should handle malformed JSON in custom fields', async () => {
      // Test robustness
    });
  });

  describe('Performance characteristics', () => {
    it('should complete list_cards within timeout', async () => {
      // Test performance
    });

    it('should handle bulk operations efficiently', async () => {
      // Test throughput
    });
  });
});
```

**Steps:**
1. Create test file
2. Implement core tool handler tests
3. Focus on highest-value tools first
4. Add error handling tests
5. Verify 60%+ coverage on tools

**Time Estimate:** 8-10 hours

---

### Task H3: Fix Cache-Dependent Integration Tests

**Objective:** Ensure all tests depending on cache functionality pass

**Process:**
1. Identify which integration tests use CacheManager
2. Verify they work after cache fixes
3. Add mock setup if needed
4. Run full integration test suite

**Verification:**
```bash
npm test -- test/integration/

# Expected: All integration tests pass
```

**Time Estimate:** 4 hours (mostly verification)

---

## MEDIUM PRIORITY PHASE (Do After High Priority - 30-40 Hours)

### Task M1: Create Security Testing Suite

**File:** `/Users/neil/src/solo/businessmap-mcp/test/security/`

**Tests to Create:**

1. **Credential Handling** (`credential-handling.test.ts`)
   - Token should not be exposed in error messages
   - Token should not be logged
   - Token should be cleared on logout
   - Token rotation should work correctly

2. **Input Validation** (`input-validation.test.ts`)
   - SQL injection prevention
   - Command injection prevention
   - XSS prevention (if applicable)
   - Path traversal prevention
   - Null byte injection prevention

3. **Multi-Instance Authorization** (`multi-instance-auth.test.ts`)
   - Wrong instance token rejection
   - Instance isolation
   - Cross-instance access prevention

**Example Security Test:**

```typescript
describe('Security: Credential Handling', () => {
  it('should not expose API token in error messages', async () => {
    const client = new BusinessMapClient({
      apiToken: 'secret-token-12345-do-not-expose',
      apiUrl: 'https://invalid-url.com/api/v2'
    });

    try {
      await client.getCurrentUser();
    } catch (error) {
      const errorString = error.toString();
      expect(errorString).not.toContain('secret-token-12345');
      expect(errorString).not.toContain('do-not-expose');
    }
  });

  it('should not log API tokens', () => {
    const consoleSpy = jest.spyOn(console, 'error');

    const client = new BusinessMapClient({
      apiToken: 'secret-token-xyz',
      apiUrl: 'https://test.api.com'
    });

    // Simulate error that might log
    try {
      client.validateToken();
    } catch (error) {
      // Error logged internally
    }

    const logs = consoleSpy.mock.calls.join(' ');
    expect(logs).not.toContain('secret-token-xyz');

    consoleSpy.mockRestore();
  });
});
```

**Time Estimate:** 10-14 hours

---

### Task M2: Create End-to-End Workflow Tests

**Objective:** Test complete user workflows

**Example Workflows:**

1. **Complete Card Management Flow**
   - Create board
   - Create card
   - Update card
   - Move card
   - Link cards
   - Archive card

2. **Workspace Analysis Flow**
   - Analyze workspace
   - Extract dependencies
   - Validate relationships
   - Report results

3. **Multi-Instance Operations**
   - Query instance 1
   - Query instance 2
   - Compare results
   - Ensure isolation

**File:** `/Users/neil/src/solo/businessmap-mcp/test/e2e/workflow-tests.test.ts`

**Time Estimate:** 8-12 hours

---

### Task M3: Establish Performance Baselines

**Objective:** Measure and document performance characteristics

**File:** `/Users/neil/src/solo/businessmap-mcp/test/performance/baselines.test.ts`

**Metrics to Capture:**
- Hook execution time (pre-commit, pre-push)
- Test suite execution time
- API response times
- Cache hit ratio
- Request deduplication benefit

**Example:**

```typescript
describe('Performance Baselines', () => {
  it('should document hook performance impact', async () => {
    const metrics = {
      preCommit: 0,
      prePush: 0,
      lintStaged: 0,
      typeCheck: 0,
    };

    // Measure pre-commit hook time
    const preCommitStart = performance.now();
    // ... run hook simulation
    metrics.preCommit = performance.now() - preCommitStart;

    // Document for regression tracking
    console.log('Hook Performance Baselines:', metrics);

    expect(metrics.preCommit).toBeLessThan(30000); // 30 second threshold
  });

  it('should measure cache effectiveness', async () => {
    const cache = new CacheManager(true, 5000);
    const fetcher = jest.fn().mockResolvedValue('data');

    // Prime cache
    await cache.get('test-key', fetcher);
    const stats1 = cache.getStats();

    // Use cache
    await cache.get('test-key', fetcher);
    const stats2 = cache.getStats();

    // Verify cache working
    expect(stats2.hitCount).toBeGreaterThan(stats1.hitCount);
    expect(fetcher).toHaveBeenCalledTimes(1); // Still 1, cache hit
  });
});
```

**Time Estimate:** 4-6 hours

---

## DOCUMENTATION TASKS

### Task D1: Document Test Coverage Matrix

**Create File:** `test-coverage-matrix.md`

**Content:**
```markdown
# Test Coverage Matrix

## By Module

| Module | Unit | Integration | E2E | Status |
|--------|------|-------------|-----|--------|
| schemas/ | ✅ 100% | ✅ 100% | - | EXCELLENT |
| config/ | ✅ 100% | ✅ 100% | - | EXCELLENT |
| client/ | ✅ 100% | ✅ 100% | - | EXCELLENT |
| services/dependency-analyzer | ✅ 80% | ✅ 20% | - | IMPROVED |
| server/tools | ✅ 60% | ✅ 40% | - | IMPROVED |
| ...

## By Test Type

- Unit Tests: 100+ tests ✅
- Integration Tests: 25+ tests ✅
- E2E Tests: 10+ tests 🟡
- Performance Tests: 5+ tests ✅
- Security Tests: 15+ tests 🟡
```

**Time Estimate:** 1 hour

---

### Task D2: Create Test Running Guide

**Create File:** `TEST_RUNNING_GUIDE.md`

**Content:**
```markdown
# Test Running Guide

## Quick Start

Run all tests:
```bash
npm test
```

Run specific test file:
```bash
npm test -- test/unit/dependency-analyzer.test.ts
```

Run tests with coverage:
```bash
npm test -- --coverage
```

## Test Modes

Tests run in two modes:

### Real Mode (Local Development)
```bash
BUSINESSMAP_API_TOKEN_FIMANCIA=your-token npm test
```

### Mock Mode (CI/CD)
```bash
npm test
# Automatically uses mock mode if no tokens available
```

## Debugging

Run with detailed output:
```bash
npm test -- --verbose
```

Run single test:
```bash
npm test -- --testNamePattern="should validate"
```

## Performance Testing

Run performance tests:
```bash
npm test -- test/performance/
```

Check hook performance:
```bash
npm test -- test/performance/hook-performance.test.ts
```

## Security Testing

Run security tests:
```bash
npm test -- test/security/
```

## Coverage Reports

Generate coverage report:
```bash
npm test -- --coverage
open coverage/lcov-report/index.html
```

## Continuous Integration

Tests run automatically on:
- Pre-commit hook (requires all tests pass before commit)
- Pre-push hook (blocks push if tests fail)

You can bypass hooks in emergencies:
```bash
git push --no-verify  # NOT RECOMMENDED
```
```

**Time Estimate:** 2 hours

---

## SUMMARY OF ACTIONS

### Critical Phase Checklist (Week 1)

- [ ] **C1:** Add jest globals import to cache-manager.test.ts (5 min)
- [ ] **C2:** Fix LRUCache.clear() method (30 min)
- [ ] **C3:** Identify other failing tests (2-4 hours)
- [ ] **C4:** Confirm all tests pass (30 min)

**Critical Phase Success:** All 148 tests passing, npm test → All green

---

### High Priority Phase Checklist (Weeks 2-4)

- [ ] **H1:** Create DependencyAnalyzer test suite (4-6 hours)
  - Target: 80%+ coverage
  - 50+ test cases

- [ ] **H2:** Create Server Tools test suite (8-10 hours)
  - Target: 60%+ coverage
  - Focus on highest-impact tools

- [ ] **H3:** Fix cache integration tests (4 hours)
  - Verify all cache-dependent tests pass
  - Add mock setup as needed

**High Priority Phase Success:** DependencyAnalyzer 80%, Tools 60%, coverage <80%

---

### Medium Priority Phase Checklist (Months 1-2)

- [ ] **M1:** Create security testing suite (10-14 hours)
  - Credential handling tests
  - Input validation tests
  - Auth tests

- [ ] **M2:** Create E2E workflow tests (8-12 hours)
  - Complete user workflows
  - Error scenarios
  - Edge cases

- [ ] **M3:** Establish performance baselines (4-6 hours)
  - Hook performance measurement
  - Cache effectiveness metrics
  - API response time tracking

**Medium Priority Phase Success:** 90%+ coverage, comprehensive testing infrastructure

---

## ESTIMATED TOTAL EFFORT

| Phase | Tasks | Hours | Priority |
|-------|-------|-------|----------|
| **Critical** | C1-C4 | 3-4 | 🔴 IMMEDIATE |
| **High** | H1-H3 | 22-24 | 🟠 WEEK 2-4 |
| **Medium** | M1-M3 | 22-32 | 🟡 MONTH 1-2 |
| **Documentation** | D1-D2 | 3 | 🔵 PARALLEL |
| **TOTAL** | | **50-63 hours** | |

---

## SUCCESS CRITERIA

### Phase 1 (Critical) - MUST COMPLETE
- ✅ npm test → 148 passing, 0 failing
- ✅ All test suites execution without errors
- ✅ Pre-push hook working correctly

### Phase 2 (High) - SHOULD COMPLETE
- ✅ DependencyAnalyzer coverage: 80%+
- ✅ Server Tools coverage: 60%+
- ✅ Overall coverage: 75%+
- ✅ All integration tests passing

### Phase 3 (Medium) - NICE TO COMPLETE
- ✅ Security test suite: 15+ tests
- ✅ E2E test suite: 10+ tests
- ✅ Performance baselines documented
- ✅ Overall coverage: 90%+

---

## NOTES

**Important Reminders:**
1. Always run tests after changes: `npm test`
2. Check coverage: `npm test -- --coverage`
3. Use jest globals import in new test files: `import { jest } from '@jest/globals';`
4. Follow AAA pattern: Arrange-Act-Assert
5. Mock external dependencies properly
6. Test error scenarios, not just happy path
7. Document test purpose with comments
8. Keep tests independent and isolated

**Common Issues:**
- `ReferenceError: jest is not defined` → Add jest globals import
- `TypeError: this.cache.clear is not a function` → Use type guard or recreate cache
- `Cannot find module` → Check import paths end with `.js`
- `Tests timing out` → Increase timeout or check mock setup

---

**Created:** 2025-11-08
**Updated:** 2025-11-08
**Status:** Ready for Implementation
**Contact:** Neil Scholten (neil@scholten.io)
