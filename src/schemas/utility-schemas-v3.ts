/**
 * Prototype: utility-schemas using zod/v4 import
 *
 * Tests whether using zod/v4 import resolves type compatibility
 * with MCP SDK v1.24.3. (Updated: v4 is the latest stable version)
 */
import { z } from 'zod/v4';

// Direct schema definition for SDK compatibility
export const instanceParamV3 = z
  .string()
  .min(1)
  .max(100)
  .trim()
  .optional()
  .describe(
    'Optional instance name to target a specific BusinessMap instance. If not provided, uses the default instance.'
  );

// Schema for health check (no parameters) - v3 compatible
export const healthCheckSchemaV3 = z.object({
  instance: instanceParamV3,
});

// Schema for API info (no parameters) - v3 compatible
export const getApiInfoSchemaV3 = z.object({
  instance: instanceParamV3,
});

// Export shape for current pattern comparison
export type HealthCheckInputV3 = z.infer<typeof healthCheckSchemaV3>;
export type ApiInfoInputV3 = z.infer<typeof getApiInfoSchemaV3>;
