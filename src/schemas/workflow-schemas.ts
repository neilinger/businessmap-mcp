import { z } from 'zod/v4';
import { SharedParams } from './shared-params.js';

// Schema for obter colunas de cycle time do workflow
export const getWorkflowCycleTimeColumnsSchema = z.object({
  board_id: z.number().describe('The ID of the board'),
  workflow_id: z.number().describe('The ID of the workflow'),
  instance: SharedParams.shape.instance,
});

// Schema for obter colunas efetivas de cycle time do workflow
export const getWorkflowEffectiveCycleTimeColumnsSchema = z.object({
  board_id: z.number().describe('The ID of the board'),
  workflow_id: z.number().describe('The ID of the workflow'),
  instance: SharedParams.shape.instance,
});
