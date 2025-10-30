import { z } from 'zod';
import { instanceParameterSchema } from './common-schemas.js';

// Schema para health check (sem parâmetros)
export const healthCheckSchema = z.object({
  ...instanceParameterSchema,
});

// Schema para obter informações da API (sem parâmetros)
export const getApiInfoSchema = z.object({
  ...instanceParameterSchema,
});
