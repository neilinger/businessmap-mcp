# Integration Tests Specification

## Objective
Create comprehensive integration tests for multi-instance configuration and backward compatibility.

## File 1: test/integration/multi-instance.test.ts

### Test Structure
Follow the pattern from test/unit/instance-manager.test.ts and test/unit/client-factory.test.ts.

### Test Suites

#### Suite 1: Instance Discovery Tools
- **list_instances tool**
  - Should list all configured instances
  - Should include instance metadata (name, description, tags)
  - Should show cache status
  - Should handle empty configuration gracefully

- **get_instance_info tool**
  - Should return detailed info for specific instance
  - Should show resolution strategy
  - Should indicate default instance
  - Should return error for non-existent instance

#### Suite 2: Multi-Instance Operations
- **Workspace operations with explicit instance**
  - Should list workspaces from specified instance
  - Should create workspace in specified instance
  - Should handle instance parameter across all workspace tools (7 tools)

- **Cross-instance isolation**
  - Operations on one instance should not affect others
  - Error in one instance should not cascade to others
  - Each instance maintains separate rate limiting

#### Suite 3: Default Instance Behavior
- **When instance parameter omitted**
  - Should use default instance from configuration
  - Should work consistently across all 43 tools
  - Should handle default instance not being available

#### Suite 4: Error Handling
- **Invalid instance parameter**
  - Should return clear error message
  - Should suggest available instances
  - Should not crash the server

- **Token load failures**
  - Should handle missing environment variables
  - Should provide actionable error messages
  - Should continue working for other instances

### Mock Strategy
Use environment variables for configuration, similar to unit tests:
```typescript
process.env.BUSINESSMAP_INSTANCES = JSON.stringify(testConfig);
process.env.BUSINESSMAP_API_TOKEN_PROD = 'test-token-prod';
process.env.BUSINESSMAP_API_TOKEN_STAGING = 'test-token-staging';
```

### Test Configuration
```typescript
const testConfig: MultiInstanceConfig = {
  version: '1.0.0',
  defaultInstance: 'production',
  instances: [
    {
      name: 'production',
      apiUrl: 'https://prod.kanbanize.com/api/v2',
      apiTokenEnv: 'BUSINESSMAP_API_TOKEN_PROD',
      readOnlyMode: false,
    },
    {
      name: 'staging',
      apiUrl: 'https://staging.kanbanize.com/api/v2',
      apiTokenEnv: 'BUSINESSMAP_API_TOKEN_STAGING',
      readOnlyMode: true,
    }
  ]
};
```

## File 2: test/integration/backward-compatibility.test.ts

### Test Structure
Test that legacy single-instance configuration continues to work without changes.

### Test Suites

#### Suite 1: Legacy Environment Variables
- **Single instance configuration**
  - Should work with BUSINESSMAP_API_URL and BUSINESSMAP_API_TOKEN
  - Should not require BUSINESSMAP_INSTANCES
  - Should not require instance parameter in tool calls
  - Should maintain exact same behavior as v1.6.x

#### Suite 2: Legacy Tool Usage
- **All 43 tools without instance parameter**
  - Should work exactly as before
  - Should use the single configured client
  - Should not require any code changes from users

#### Suite 3: Migration Path
- **Gradual migration**
  - Can start with legacy mode
  - Add BUSINESSMAP_INSTANCES without breaking legacy
  - Legacy tools continue to work during migration

#### Suite 4: Dual Mode Testing
- **Server initialization**
  - Should try multi-instance mode first
  - Should fallback to legacy mode gracefully
  - Should log which mode was selected
  - Should not crash if both configurations present

### Legacy Test Configuration
```typescript
// Legacy mode - no BUSINESSMAP_INSTANCES
process.env.BUSINESSMAP_API_URL = 'https://fimancia.kanbanize.com/api/v2';
process.env.BUSINESSMAP_API_TOKEN = 'ace_legacy_token';
process.env.BUSINESSMAP_READ_ONLY_MODE = 'false';
process.env.BUSINESSMAP_DEFAULT_WORKSPACE_ID = '123';
```

## Requirements

### Both Files Must:
1. Follow Jest testing patterns from existing tests
2. Mock BusinessMapClient to avoid real API calls
3. Test error paths comprehensively
4. Include clear test descriptions
5. Clean up after each test (restore environment)
6. Use descriptive variable names
7. Include comments for complex test scenarios

### Success Criteria:
- All tests pass
- 90%+ code coverage for integration scenarios
- Clear test output showing what's being tested
- Tests run in < 30 seconds total
- No flaky tests (deterministic)

## References
- Existing unit tests: test/unit/instance-manager.test.ts (57 tests)
- Existing unit tests: test/unit/client-factory.test.ts (34 tests)
- Implementation docs: docs/MULTI_INSTANCE_IMPLEMENTATION.md
- Example config: examples/multi-instance-config.json
