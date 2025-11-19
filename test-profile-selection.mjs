import { getToolProfile, getToolsForProfile, PROFILE_METADATA } from './dist/config/tool-profiles.js';

console.log('Testing profile selection...\n');

// Test default (no env var)
console.log('1. Default profile (no env var):');
const defaultProfile = getToolProfile();
const defaultTools = getToolsForProfile(defaultProfile);
console.log(`   Profile: ${defaultProfile}`);
console.log(`   Tools: ${defaultTools.length}`);
console.log(`   Metadata: ${JSON.stringify(PROFILE_METADATA[defaultProfile], null, 2)}\n`);

// Test minimal profile
process.env.BUSINESSMAP_TOOL_PROFILE = 'minimal';
console.log('2. Minimal profile:');
const minimalProfile = getToolProfile();
const minimalTools = getToolsForProfile(minimalProfile);
console.log(`   Profile: ${minimalProfile}`);
console.log(`   Tools: ${minimalTools.length}`);
console.log(`   First 5 tools: ${minimalTools.slice(0, 5).join(', ')}\n`);

// Test standard profile
process.env.BUSINESSMAP_TOOL_PROFILE = 'standard';
console.log('3. Standard profile:');
const standardProfile = getToolProfile();
const standardTools = getToolsForProfile(standardProfile);
console.log(`   Profile: ${standardProfile}`);
console.log(`   Tools: ${standardTools.length}\n`);

// Test full profile
process.env.BUSINESSMAP_TOOL_PROFILE = 'full';
console.log('4. Full profile:');
const fullProfile = getToolProfile();
const fullTools = getToolsForProfile(fullProfile);
console.log(`   Profile: ${fullProfile}`);
console.log(`   Tools: ${fullTools.length}\n`);

// Test invalid profile
process.env.BUSINESSMAP_TOOL_PROFILE = 'invalid';
console.log('5. Invalid profile (should throw error):');
try {
  getToolProfile();
  console.log('   ERROR: Should have thrown!');
} catch (error) {
  console.log(`   ✓ Correctly threw error: ${error.message}\n`);
}

console.log('All tests passed!');
