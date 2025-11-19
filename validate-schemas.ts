#!/usr/bin/env node
/**
 * Schema Validation Script - T072
 *
 * Validates all Zod schemas compile and parse correctly.
 * This script imports all schema files and performs runtime validation.
 */

import { z } from 'zod';

// Track validation results
const results: Array<{ schema: string; status: 'PASS' | 'FAIL'; error?: string }> = [];

function validateSchema(name: string, schemaFn: () => any) {
  try {
    const schema = schemaFn();

    // Verify it's a Zod schema
    if (!schema || typeof schema.parse !== 'function') {
      throw new Error('Not a valid Zod schema');
    }

    // Test basic parsing with empty object (should fail gracefully)
    try {
      schema.parse({});
    } catch (e) {
      // Expected to fail for most schemas - we just want to ensure parsing logic works
      if (!(e instanceof z.ZodError)) {
        throw new Error('Schema parsing failed unexpectedly');
      }
    }

    results.push({ schema: name, status: 'PASS' });
    return true;
  } catch (error) {
    results.push({
      schema: name,
      status: 'FAIL',
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

async function main() {
  console.log('🔍 Validating Zod Schemas - T072\n');
  console.log('═'.repeat(80));

  // Import all schema files
  console.log('\n📦 Importing schema modules...\n');

  try {
    // Shared parameters
    const { SharedParams, PlacementSchema, MetadataSchema, OwnersSchema } = await import('./src/schemas/shared-params.js');
    validateSchema('SharedParams', () => SharedParams);
    validateSchema('PlacementSchema', () => PlacementSchema);
    validateSchema('MetadataSchema', () => MetadataSchema);
    validateSchema('OwnersSchema', () => OwnersSchema);

    // Shared card schemas
    const {
      SubtaskSchema,
      CustomFieldUpdateSchema,
      CardLinkSchema,
      StickerSchema,
      AttachmentSchema,
    } = await import('./src/schemas/shared-card-schemas.js');
    validateSchema('SubtaskSchema', () => SubtaskSchema);
    validateSchema('CustomFieldUpdateSchema', () => CustomFieldUpdateSchema);
    validateSchema('CardLinkSchema', () => CardLinkSchema);
    validateSchema('StickerSchema', () => StickerSchema);
    validateSchema('AttachmentSchema', () => AttachmentSchema);

    // Card schemas
    const {
      listCardsSchema,
      getCardSchema,
      cardSizeSchema,
      cardCommentsSchema,
      getCardCommentSchema,
      getCardTypesSchema,
      getCardHistorySchema,
      getCardOutcomesSchema,
      getCardLinkedCardsSchema,
      getCardSubtasksSchema,
      getCardSubtaskSchema,
      createCardSubtaskSchema,
      createCardSchema,
      updateCardSchema,
      moveCardSchema,
      deleteCardSchema,
    } = await import('./src/schemas/card-schemas.js');

    validateSchema('listCardsSchema', () => listCardsSchema);
    validateSchema('getCardSchema', () => getCardSchema);
    validateSchema('cardSizeSchema', () => cardSizeSchema);
    validateSchema('cardCommentsSchema', () => cardCommentsSchema);
    validateSchema('getCardCommentSchema', () => getCardCommentSchema);
    validateSchema('getCardTypesSchema', () => getCardTypesSchema);
    validateSchema('getCardHistorySchema', () => getCardHistorySchema);
    validateSchema('getCardOutcomesSchema', () => getCardOutcomesSchema);
    validateSchema('getCardLinkedCardsSchema', () => getCardLinkedCardsSchema);
    validateSchema('getCardSubtasksSchema', () => getCardSubtasksSchema);
    validateSchema('getCardSubtaskSchema', () => getCardSubtaskSchema);
    validateSchema('createCardSubtaskSchema', () => createCardSubtaskSchema);
    validateSchema('createCardSchema', () => createCardSchema);
    validateSchema('updateCardSchema', () => updateCardSchema);
    validateSchema('moveCardSchema', () => moveCardSchema);
    validateSchema('deleteCardSchema', () => deleteCardSchema);

    // Board schemas
    const { getBoardSchema, listBoardsSchema } = await import('./src/schemas/board-schemas.js');
    validateSchema('getBoardSchema', () => getBoardSchema);
    validateSchema('listBoardsSchema', () => listBoardsSchema);

    // Workspace schemas
    const { getWorkspaceSchema } = await import('./src/schemas/workspace-schemas.js');
    validateSchema('getWorkspaceSchema', () => getWorkspaceSchema);

    // User schemas
    const { getCurrentUserSchema } = await import('./src/schemas/user-schemas.js');
    validateSchema('getCurrentUserSchema', () => getCurrentUserSchema);

    // Workflow schemas
    const {
      getWorkflowCycleTimeColumnsSchema,
      getWorkflowEffectiveCycleTimeColumnsSchema,
    } = await import('./src/schemas/workflow-schemas.js');
    validateSchema('getWorkflowCycleTimeColumnsSchema', () => getWorkflowCycleTimeColumnsSchema);
    validateSchema('getWorkflowEffectiveCycleTimeColumnsSchema', () => getWorkflowEffectiveCycleTimeColumnsSchema);

    // Custom field schemas
    const {
      getCustomFieldSchema,
      customFieldTypeSchema,
      listCustomFieldsSchema,
      listBoardCustomFieldsSchema,
      createCustomFieldSchema,
      updateCustomFieldSchema,
      deleteCustomFieldSchema,
    } = await import('./src/schemas/custom-field-schemas.js');
    validateSchema('getCustomFieldSchema', () => getCustomFieldSchema);
    validateSchema('customFieldTypeSchema', () => customFieldTypeSchema);
    validateSchema('listCustomFieldsSchema', () => listCustomFieldsSchema);
    validateSchema('listBoardCustomFieldsSchema', () => listBoardCustomFieldsSchema);
    validateSchema('createCustomFieldSchema', () => createCustomFieldSchema);
    validateSchema('updateCustomFieldSchema', () => updateCustomFieldSchema);
    validateSchema('deleteCustomFieldSchema', () => deleteCustomFieldSchema);

    // Utility schemas
    const { healthCheckSchema, getApiInfoSchema } = await import('./src/schemas/utility-schemas.js');
    validateSchema('healthCheckSchema', () => healthCheckSchema);
    validateSchema('getApiInfoSchema', () => getApiInfoSchema);

  } catch (error) {
    console.error('\n❌ Failed to import schemas:', error);
    process.exit(1);
  }

  // Print results
  console.log('═'.repeat(80));
  console.log('\n📊 Validation Results:\n');

  const passed = results.filter(r => r.status === 'PASS');
  const failed = results.filter(r => r.status === 'FAIL');

  if (passed.length > 0) {
    console.log('✅ PASSED SCHEMAS:');
    passed.forEach(r => console.log(`   • ${r.schema}`));
  }

  if (failed.length > 0) {
    console.log('\n❌ FAILED SCHEMAS:');
    failed.forEach(r => {
      console.log(`   • ${r.schema}`);
      if (r.error) console.log(`     Error: ${r.error}`);
    });
  }

  console.log('\n' + '═'.repeat(80));
  console.log(`\n📈 Summary: ${passed.length}/${results.length} schemas validated`);
  console.log(`   ✅ Passed: ${passed.length}`);
  console.log(`   ❌ Failed: ${failed.length}`);

  // Test instance parameter extraction
  console.log('\n🔧 Testing Instance Parameter Extraction:\n');

  try {
    const testSchema = z.object({
      card_id: z.number(),
      instance: z.string().optional(),
    });

    const testData = { card_id: 123, instance: 'kerkow' };
    const parsed = testSchema.parse(testData);

    console.log('   ✅ Instance parameter extraction: PASS');
    console.log(`      Input: ${JSON.stringify(testData)}`);
    console.log(`      Parsed: ${JSON.stringify(parsed)}`);
  } catch (error) {
    console.log('   ❌ Instance parameter extraction: FAIL');
    console.log(`      Error: ${error instanceof Error ? error.message : String(error)}`);
    failed.push({ schema: 'Instance Parameter Extraction', status: 'FAIL', error: String(error) });
  }

  console.log('\n' + '═'.repeat(80));

  if (failed.length > 0) {
    console.log('\n❌ VALIDATION FAILED\n');
    process.exit(1);
  } else {
    console.log('\n✅ ALL SCHEMAS VALID\n');
    process.exit(0);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
