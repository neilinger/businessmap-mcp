import { z } from 'zod';
import { instanceParameterSchema } from './common-schemas.js';

// Schema para obter colunas de cycle time do workflow
export const getWorkflowCycleTimeColumnsSchema = z.object({
  board_id: z.number().describe('The ID of the board'),
  workflow_id: z.number().describe('The ID of the workflow'),
  ...instanceParameterSchema,
});

// Schema para obter colunas efetivas de cycle time do workflow
export const getWorkflowEffectiveCycleTimeColumnsSchema = z.object({
  board_id: z.number().describe('The ID of the board'),
  workflow_id: z.number().describe('The ID of the workflow'),
  ...instanceParameterSchema,
});
