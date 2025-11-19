#!/usr/bin/env node
/**
 * Runtime Validation Tests - T072
 *
 * Tests runtime validation of critical schemas with actual data.
 */

import { z } from 'zod';

async function main() {
  console.log('🧪 Runtime Validation Tests - T072\n');
  console.log('═'.repeat(80));

  const tests: Array<{ name: string; passed: boolean; error?: string }> = [];

  // Test 1: SharedParams with instance
  try {
    const { SharedParams } = await import('./src/schemas/shared-params.js');
    const data = { instance: 'kerkow' };
    const result = SharedParams.parse(data);
    if (result.instance === 'kerkow') {
      tests.push({ name: 'SharedParams with instance', passed: true });
    } else {
      throw new Error('Instance not parsed correctly');
    }
  } catch (error) {
    tests.push({
      name: 'SharedParams with instance',
      passed: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  // Test 2: createCardSchema with nested structures
  try {
    const { createCardSchema } = await import('./src/schemas/card-schemas.js');
    const data = {
      title: 'Test Card',
      column_id: 123,
      placement: { lane_id: 456, position: 0 },
      metadata: { description: 'Test description', size: 5 },
      owners: { user_id: 789 },
      instance: 'kerkow',
    };
    const result = createCardSchema.parse(data);
    if (
      result.title === 'Test Card' &&
      result.placement?.lane_id === 456 &&
      result.metadata?.size === 5
    ) {
      tests.push({ name: 'createCardSchema with nested structures', passed: true });
    } else {
      throw new Error('Nested structures not parsed correctly');
    }
  } catch (error) {
    tests.push({
      name: 'createCardSchema with nested structures',
      passed: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  // Test 3: updateCardSchema with compressed format
  try {
    const { updateCardSchema } = await import('./src/schemas/card-schemas.js');
    const data = {
      card_id: 123,
      title: 'Updated Title',
      description: 'Updated description',
      size: 8,
      co_owner_ids_to_add: [1, 2, 3],
      tag_ids_to_remove: [10, 20],
      instance: 'fimancia',
    };
    const result = updateCardSchema.parse(data);
    if (
      result.card_id === 123 &&
      result.title === 'Updated Title' &&
      result.co_owner_ids_to_add?.length === 3
    ) {
      tests.push({ name: 'updateCardSchema with compressed format', passed: true });
    } else {
      throw new Error('Compressed format not parsed correctly');
    }
  } catch (error) {
    tests.push({
      name: 'updateCardSchema with compressed format',
      passed: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  // Test 4: listCardsSchema with nested date filters
  try {
    const { listCardsSchema } = await import('./src/schemas/card-schemas.js');
    const data = {
      board_id: 100,
      date_filters: {
        created: { from: '2024-01-01', to: '2024-12-31' },
        deadline: { from_date: '2024-06-01' },
      },
      card_ids: [1, 2, 3, 4, 5],
      instance: 'kerkow',
    };
    const result = listCardsSchema.parse(data);
    if (
      result.board_id === 100 &&
      result.date_filters?.created?.from === '2024-01-01' &&
      result.card_ids?.length === 5
    ) {
      tests.push({ name: 'listCardsSchema with nested date filters', passed: true });
    } else {
      throw new Error('Nested date filters not parsed correctly');
    }
  } catch (error) {
    tests.push({
      name: 'listCardsSchema with nested date filters',
      passed: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  // Test 5: SubtaskSchema validation
  try {
    const { SubtaskSchema } = await import('./src/schemas/shared-card-schemas.js');
    const data = {
      text: 'Test subtask',
      completed: true,
      position: 2,
    };
    const result = SubtaskSchema.parse(data);
    if (result.text === 'Test subtask' && result.completed === true) {
      tests.push({ name: 'SubtaskSchema validation', passed: true });
    } else {
      throw new Error('Subtask not parsed correctly');
    }
  } catch (error) {
    tests.push({
      name: 'SubtaskSchema validation',
      passed: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  // Test 6: Security limits on arrays
  try {
    const { updateCardSchema } = await import('./src/schemas/card-schemas.js');
    const data = {
      card_id: 123,
      co_owner_ids_to_add: Array.from({ length: 150 }, (_, i) => i), // Exceeds MAX_USER_IDS (100)
      instance: 'kerkow',
    };
    try {
      updateCardSchema.parse(data);
      tests.push({
        name: 'Security limits on arrays',
        passed: false,
        error: 'Should have rejected array exceeding MAX_USER_IDS',
      });
    } catch (validationError) {
      // Expected to fail
      tests.push({ name: 'Security limits on arrays', passed: true });
    }
  } catch (error) {
    tests.push({
      name: 'Security limits on arrays',
      passed: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  // Test 7: Instance parameter extraction in all schemas
  try {
    const { getCardSchema } = await import('./src/schemas/card-schemas.js');
    const { getBoardSchema } = await import('./src/schemas/board-schemas.js');
    const { getCurrentUserSchema } = await import('./src/schemas/user-schemas.js');

    const cardData = { card_id: 1, instance: 'test' };
    const boardData = { board_id: 1, instance: 'test' };
    const userData = { instance: 'test' };

    const card = getCardSchema.parse(cardData);
    const board = getBoardSchema.parse(boardData);
    const user = getCurrentUserSchema.parse(userData);

    if (card.instance === 'test' && board.instance === 'test' && user.instance === 'test') {
      tests.push({ name: 'Instance parameter in all schemas', passed: true });
    } else {
      throw new Error('Instance parameter not consistent across schemas');
    }
  } catch (error) {
    tests.push({
      name: 'Instance parameter in all schemas',
      passed: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  // Test 8: Optional fields handling
  try {
    const { createCardSchema } = await import('./src/schemas/card-schemas.js');
    const minimalData = {
      title: 'Minimal Card',
      column_id: 100,
      instance: 'kerkow',
    };
    const result = createCardSchema.parse(minimalData);
    if (result.title === 'Minimal Card' && !result.placement && !result.metadata) {
      tests.push({ name: 'Optional fields handling', passed: true });
    } else {
      throw new Error('Optional fields not handled correctly');
    }
  } catch (error) {
    tests.push({
      name: 'Optional fields handling',
      passed: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  // Print results
  console.log('\n📊 Runtime Validation Results:\n');

  const passed = tests.filter(t => t.passed);
  const failed = tests.filter(t => !t.passed);

  if (passed.length > 0) {
    console.log('✅ PASSED TESTS:');
    passed.forEach(t => console.log(`   • ${t.name}`));
  }

  if (failed.length > 0) {
    console.log('\n❌ FAILED TESTS:');
    failed.forEach(t => {
      console.log(`   • ${t.name}`);
      if (t.error) console.log(`     Error: ${t.error}`);
    });
  }

  console.log('\n' + '═'.repeat(80));
  console.log(`\n📈 Summary: ${passed.length}/${tests.length} tests passed`);
  console.log(`   ✅ Passed: ${passed.length}`);
  console.log(`   ❌ Failed: ${failed.length}`);
  console.log('\n' + '═'.repeat(80));

  if (failed.length > 0) {
    console.log('\n❌ RUNTIME VALIDATION FAILED\n');
    process.exit(1);
  } else {
    console.log('\n✅ ALL RUNTIME VALIDATIONS PASSED\n');
    process.exit(0);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
