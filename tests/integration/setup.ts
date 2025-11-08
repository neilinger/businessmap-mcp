/**
 * Integration Test Setup
 * Determines test mode: REAL (local with credentials) or MOCK (CI without credentials)
 */

/* eslint-disable no-console */

// Test mode detection (T044)
export const TEST_MODE: 'real' | 'mock' =
  process.env.CI === 'true' ||
  (!process.env.BUSINESSMAP_API_TOKEN_FIMANCIA && !process.env.BUSINESSMAP_API_TOKEN_KERKOW)
    ? 'mock'
    : 'real';

console.log(`\n🧪 Integration tests running in ${TEST_MODE.toUpperCase()} mode\n`);

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

  console.log('✓ Real credentials detected');
  console.log(`  - BUSINESSMAP_API_TOKEN_FIMANCIA: ${hasFimanciaToken ? 'present' : 'missing'}`);
  console.log(`  - BUSINESSMAP_API_TOKEN_KERKOW: ${hasKerkowToken ? 'present' : 'missing'}`);
} else {
  // Mock mode: No credentials required
  console.log('✓ Running in CI mode (mock validation only, no API calls)');
}

console.log('');
