/**
 * Integration Test Setup
 * Determines test mode: REAL (local with credentials) or MOCK (CI without credentials)
 *
 * Rate Limit Handling (Issue #44):
 * - Tests run sequentially (maxWorkers: 1) to reduce API pressure
 * - BusinessMapClient has axios-retry with 3 retries and retry-after support
 * - Default timeout is 90s to accommodate rate-limit recovery
 * - Rate limit warnings are logged by BusinessMapClient at 80% quota usage
 */

/* eslint-disable no-console */

// Test mode detection (T044)
export const TEST_MODE: 'real' | 'mock' =
  process.env.CI === 'true' ||
  (!process.env.BUSINESSMAP_API_TOKEN_FIMANCIA && !process.env.BUSINESSMAP_API_TOKEN_KERKOW)
    ? 'mock'
    : 'real';

// Mode-specific setup
if (TEST_MODE === 'real') {
  // Real mode: Validate credentials are present (T044a)
  const hasFimanciaToken = !!process.env.BUSINESSMAP_API_TOKEN_FIMANCIA;
  const hasKerkowToken = !!process.env.BUSINESSMAP_API_TOKEN_KERKOW;

  if (!hasFimanciaToken && !hasKerkowToken) {
    console.error('\n❌ ERROR: Integration tests require real credentials locally\n');
    console.error('Missing environment variables:');
    console.error('  - BUSINESSMAP_API_TOKEN_FIMANCIA');
    console.error('  - BUSINESSMAP_API_TOKEN_KERKOW');
    console.error('\nSetup instructions:');
    console.error('  1. See docs/ONBOARDING.md for credential setup');
    console.error('  2. Add tokens to your .env file or export them');
    console.error('  3. Re-run integration tests\n');
    console.error('Note: CI runs in mock mode automatically (no credentials required)\n');
    process.exit(1);
  }

  // Issue #44: Log rate-limit configuration for visibility
  console.log('\n📊 Rate Limit Configuration (Issue #44):');
  console.log('  • Tests run sequentially (maxWorkers: 1)');
  console.log('  • BusinessMap API limit: 30 requests/minute');
  console.log('  • axios-retry: 3 retries with exponential backoff');
  console.log('  • retry-after header respected (up to 60s)');
  console.log('  • Test timeout: 90s to allow rate-limit recovery');
  console.log('  • Rate limit warnings appear at 80% quota usage\n');
} else {
  // Mock mode: No credentials required
}
