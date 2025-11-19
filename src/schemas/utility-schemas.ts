import { z } from 'zod';
import { SharedParams } from './shared-params.js';

// Schema for health check (no parameters)
export const healthCheckSchema = z.object({
  instance: SharedParams.shape.instance,
});

// Schema for obter informações da API (no parameters)
export const getApiInfoSchema = z.object({
  instance: SharedParams.shape.instance,
});
