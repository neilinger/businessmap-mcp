import { z } from 'zod';
import { instanceParameterSchema } from './common-schemas.js';

// Schema for health check (no parameters)
export const healthCheckSchema = z.object({
  ...instanceParameterSchema,
});

// Schema for obter informações da API (no parameters)
export const getApiInfoSchema = z.object({
  ...instanceParameterSchema,
});
