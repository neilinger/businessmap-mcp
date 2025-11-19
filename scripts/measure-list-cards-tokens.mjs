#!/usr/bin/env node
/**
 * Token measurement script for list_cards schema
 * Task T024 - Baseline measurement
 */

import { readFileSync } from 'fs';

function estimateTokens(str) {
  // Rough estimation: ~4 chars per token
  return Math.ceil(str.length / 4);
}

function main() {
  const schemaFile = readFileSync('src/schemas/card-schemas.ts', 'utf-8');

  // Extract listCardsSchema definition
  const startMarker = 'export const listCardsSchema = z.object({';
  const endMarker = '});';

  const startIdx = schemaFile.indexOf(startMarker);
  const endIdx = schemaFile.indexOf(endMarker, startIdx);

  if (startIdx === -1 || endIdx === -1) {
    console.error('Could not find listCardsSchema definition');
    process.exit(1);
  }

  const schemaDefinition = schemaFile.substring(startIdx, endIdx + endMarker.length);
  const lines = schemaDefinition.split('\n');
  const tokenCount = estimateTokens(schemaDefinition);

  console.log('=== list_cards Schema Token Baseline (T024) ===');
  console.log(`Lines: ${lines.length}`);
  console.log(`Characters: ${schemaDefinition.length}`);
  console.log(`Estimated tokens: ${tokenCount}`);
  console.log(`Target: ≤1,800 tokens`);
  console.log(`Reduction needed: ${tokenCount > 1800 ? tokenCount - 1800 : 0} tokens`);
  console.log(`Reduction %: ${tokenCount > 1800 ? Math.round(((tokenCount - 1800) / tokenCount) * 100) : 0}%`);

  console.log('\n=== Schema Structure ===');

  // Count filter categories
  const dateFilters = schemaDefinition.match(/\w+_(from|to)(_date)?:/g) || [];
  const arrayFilters = schemaDefinition.match(/\w+_ids:|priorities:|sizes:|sections:|colors:|custom_ids:/g) || [];
  const configOptions = schemaDefinition.match(/include_\w+:/g) || [];

  console.log(`Date filters: ${dateFilters.length} properties`);
  console.log(`Array filters: ${arrayFilters.length} properties`);
  console.log(`Config options: ${configOptions.length} properties`);

  console.log('\n=== Compression Strategy ===');
  console.log('1. Group date filters into nested date_filters object');
  console.log('2. Group array filters into nested array_filters object');
  console.log('3. Remove verbose .describe() calls');
  console.log('4. Use shared schema references');
  console.log('5. Consolidate similar filter patterns');
}

main();
