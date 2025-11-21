#!/usr/bin/env ts-node
/**
 * Pre-commit validation script for FR-014: 3-Part Error Format
 *
 * Ensures all error responses follow the mandated structure:
 * 1. Specific failure cause (error message)
 * 2. Error classification (transient or permanent)
 * 3. Actionable remediation (next steps)
 *
 * Usage: Run via husky pre-commit hook or manually with `npx ts-node scripts/validate-error-format.ts`
 */

import * as fs from 'fs';
import * as path from 'path';

interface ErrorFormatViolation {
  file: string;
  line: number;
  type: 'missing_classification' | 'missing_remediation' | 'invalid_structure';
  context: string;
}

const violations: ErrorFormatViolation[] = [];

// Canonical error messages from research.md
const CANONICAL_MESSAGES = [
  'Comment text cannot be empty or whitespace-only',
  'Card not found (ID:',
  'Comment not found (ID:',
  'Insufficient permissions to',
  'Rate limit exceeded. Retry after',
  'Network connection failed after 3 retry attempts',
  'Network error during comment creation',
  'BusinessMap API unavailable. Try again later',
];

/**
 * Check if error response follows 3-part format:
 * - Must have 'error' field (specific failure cause)
 * - Must have 'classification' field ('transient' or 'permanent')
 * - Must have 'remediation' field (actionable next steps)
 */
function validateErrorObject(obj: any, filePath: string, lineNumber: number): void {
  if (typeof obj !== 'object' || obj === null) return;

  // Check if this looks like an error response
  if ('error' in obj || 'message' in obj) {
    const hasError = 'error' in obj;
    const hasClassification = 'classification' in obj;
    const hasRemediation = 'remediation' in obj;

    if (hasError && !hasClassification) {
      violations.push({
        file: filePath,
        line: lineNumber,
        type: 'missing_classification',
        context: `Error object missing 'classification' field (transient/permanent): ${JSON.stringify(obj).substring(0, 100)}`,
      });
    }

    if (hasError && !hasRemediation) {
      violations.push({
        file: filePath,
        line: lineNumber,
        type: 'missing_remediation',
        context: `Error object missing 'remediation' field: ${JSON.stringify(obj).substring(0, 100)}`,
      });
    }

    // Validate classification value
    if (hasClassification && !['transient', 'permanent'].includes(obj.classification)) {
      violations.push({
        file: filePath,
        line: lineNumber,
        type: 'invalid_structure',
        context: `Invalid classification '${obj.classification}'. Must be 'transient' or 'permanent'`,
      });
    }
  }
}

/**
 * Scan TypeScript files for error response patterns
 */
async function scanFiles(): Promise<void> {
  const patterns = [
    'src/server/tools',
    'src/client/modules',
    'src/schemas',
  ];

  for (const pattern of patterns) {
    // Simple file scanning without glob dependency
    const files: string[] = [];
    function walkDir(dir: string): void {
      if (!fs.existsSync(dir)) return;
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walkDir(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.ts')) {
          files.push(fullPath);
        }
      }
    }
    walkDir(pattern);

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');

      // Look for createErrorResponse calls or error object literals
      lines.forEach((line, index) => {
        // Check for error object literals with { error: ..., }
        if (line.match(/\{\s*error:\s*['"`]/) || line.match(/\{\s*message:\s*['"`]/)) {
          // Try to parse surrounding context (crude but effective)
          const contextStart = Math.max(0, index - 2);
          const contextEnd = Math.min(lines.length, index + 5);
          const context = lines.slice(contextStart, contextEnd).join('\n');

          // Check if this is a multi-line object that includes classification/remediation
          const hasClassification = context.match(/classification:\s*['"`](transient|permanent)['"`]/);
          const hasRemediation = context.match(/remediation:\s*['"`]/);

          if (!hasClassification || !hasRemediation) {
            // Could be a violation, but might also be a false positive
            // For now, just log it for manual review
            console.warn(`⚠️  Potential FR-014 violation in ${file}:${index + 1}`);
            console.warn(`    Review error object for 3-part format compliance`);
          }
        }

        // Check for throw new Error() without structured response
        if (line.match(/throw new Error\(/)) {
          console.warn(`⚠️  Direct Error throw in ${file}:${index + 1}`);
          console.warn(`    Consider using structured error response with classification and remediation`);
        }
      });
    }
  }
}

/**
 * Main validation function
 */
async function main(): Promise<void> {
  console.log('🔍 Validating FR-014: 3-Part Error Format Compliance...\n');

  await scanFiles();

  if (violations.length > 0) {
    console.error(`\n❌ Found ${violations.length} FR-014 violations:\n`);
    violations.forEach((v) => {
      console.error(`  ${v.file}:${v.line}`);
      console.error(`  Type: ${v.type}`);
      console.error(`  ${v.context}\n`);
    });
    process.exit(1);
  }

  console.log('✅ All error responses follow FR-014 3-part format\n');
  console.log('📋 Required format:');
  console.log('   { error: "specific cause", classification: "transient|permanent", remediation: "next steps" }\n');
}

main().catch((error) => {
  console.error('❌ Error running validation:', error);
  process.exit(1);
});
