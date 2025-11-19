#!/usr/bin/env ts-node
/**
 * Token measurement script for list_cards schema
 * Task T024 - Baseline measurement
 */

import { listCardsSchema } from '../src/schemas/card-schemas.js';

function estimateTokens(obj: any): number {
  const str = JSON.stringify(obj, null, 2);
  // Rough estimation: ~4 chars per token
  return Math.ceil(str.length / 4);
}

function main() {
  const schemaShape = listCardsSchema.shape;
  const schemaString = JSON.stringify(schemaShape, null, 2);
  const tokenCount = estimateTokens(schemaShape);

  console.log('=== list_cards Schema Token Baseline ===');
  console.log(`Characters: ${schemaString.length}`);
  console.log(`Estimated tokens: ${tokenCount}`);
  console.log(`Target: ≤1,800 tokens`);
  console.log(`Reduction needed: ${tokenCount > 1800 ? tokenCount - 1800 : 0} tokens`);
  console.log(`Properties: ${Object.keys(schemaShape).length}`);
  console.log('\n=== Property Breakdown ===');

  // Count filter categories
  const dateFilters = Object.keys(schemaShape).filter(k =>
    k.includes('_from') || k.includes('_to') || k.includes('_date')
  );
  const arrayFilters = Object.keys(schemaShape).filter(k =>
    k.includes('_ids') || k === 'priorities' || k === 'sizes' ||
    k === 'sections' || k === 'colors' || k === 'custom_ids'
  );
  const configOptions = Object.keys(schemaShape).filter(k =>
    k.includes('include_')
  );

  console.log(`Date filters: ${dateFilters.length}`);
  console.log(`Array filters: ${arrayFilters.length}`);
  console.log(`Config options: ${configOptions.length}`);
  console.log(`Other parameters: ${Object.keys(schemaShape).length - dateFilters.length - arrayFilters.length - configOptions.length}`);
}

main();
