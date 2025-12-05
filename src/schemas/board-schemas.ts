import { z } from 'zod/v4';
import { SharedParams } from './shared-params.js';
import {
  entityIdSchema,
  entityNameSchema,
  positionSchema,
  colorSchema,
  optionalEntityId,
  optionalDescription,
  optionalBooleanFlag,
  secureArray,
  SECURITY_LIMITS,
} from './security-validation.js';

// Schema for listagem de boards
export const listBoardsSchema = z.object({
  // ID filters (arrays) with size limits
  board_ids: secureArray(entityIdSchema, {
    maxItems: SECURITY_LIMITS.MAX_ARRAY_ITEMS,
  })
    .optional()
    .describe('A list of the board ids that you want to get'),
  workspace_ids: secureArray(entityIdSchema, {
    maxItems: SECURITY_LIMITS.MAX_ARRAY_ITEMS,
  })
    .optional()
    .describe('A list of the workspace ids holding the boards that you want to get'),

  // Expansion options
  expand: z
    .array(z.enum(['workflows', 'settings', 'structure']))
    .optional()
    .describe(
      'A list of properties for which you want to get additional details. Allowed: workflows, settings, structure'
    ),

  // Field selection
  fields: z
    .array(z.enum(['board_id', 'workspace_id', 'is_archived', 'name', 'description', 'revision']))
    .optional()
    .describe(
      'A list of fields that you want in the response. Allowed: board_id, workspace_id, is_archived, name, description, revision'
    ),

  // Assignment filter
  if_assigned: optionalBooleanFlag.describe(
    'When set to 1 you will only get boards to which you are assigned (0 or 1)'
  ),

  // Archive status
  is_archived: optionalBooleanFlag.describe(
    'When set to 0 you will only get non-archived boards. When set to 1 you will only get archived boards (0 or 1)'
  ),

  // Legacy compatibility
  workspace_id: optionalEntityId.describe(
    'Optional workspace ID to filter boards (legacy parameter)'
  ),
  instance: SharedParams.shape.instance,
});

// Schema for busca de boards
export const searchBoardSchema = z.object({
  board_id: optionalEntityId.describe('The ID of the board to search for'),
  board_name: entityNameSchema.optional().describe('The name of the board to search for'),
  workspace_id: optionalEntityId.describe('Optional workspace ID to limit search scope'),
  instance: SharedParams.shape.instance,
});

// Schema for obter detalhes de um board específico
export const getBoardSchema = z.object({
  board_id: entityIdSchema.describe('The ID of the board'),
  instance: SharedParams.shape.instance,
});

// Schema for obter colunas de um board
export const getColumnsSchema = z.object({
  board_id: entityIdSchema.describe('The ID of the board'),
  instance: SharedParams.shape.instance,
});

// Schema for obter lanes de um board
export const getLanesSchema = z.object({
  board_id: entityIdSchema.describe('The ID of the board'),
  instance: SharedParams.shape.instance,
});

// Schema for obter detalhes de uma lane específica
export const getLaneSchema = z.object({
  lane_id: entityIdSchema.describe('The ID of the lane'),
  instance: SharedParams.shape.instance,
});

// Schema for criação de boards
export const createBoardSchema = z.object({
  name: entityNameSchema.describe('The name of the board'),
  description: optionalDescription.describe('Optional description for the board'),
  project_id: optionalEntityId.describe('Optional project ID for the board'),
  workspace_id: optionalEntityId.describe('The ID of the workspace'),
  instance: SharedParams.shape.instance,
});

// Schema for criação de lanes
export const createLaneSchema = z.object({
  name: entityNameSchema.describe('The name of the lane'),
  description: optionalDescription.describe('Optional description for the lane'),
  workflow_id: entityIdSchema.describe('The workflow ID'),
  position: positionSchema.describe('The position of the lane'),
  color: colorSchema.describe('The color for the lane'),
  instance: SharedParams.shape.instance,
});

// Schema for obter estrutura atual do board
export const getCurrentBoardStructureSchema = z.object({
  board_id: entityIdSchema.describe('The ID of the board'),
  instance: SharedParams.shape.instance,
});

// Schema for atualização de boards
export const updateBoardSchema = z.object({
  board_id: entityIdSchema.describe('The ID of the board to update'),
  name: entityNameSchema.optional().describe('New name for the board'),
  description: optionalDescription.describe('New description for the board'),
  instance: SharedParams.shape.instance,
});

// Schema for deleção de boards
export const deleteBoardSchema = z.object({
  board_id: entityIdSchema.describe('The ID of the board to delete'),
  archive_first: z
    .boolean()
    .optional()
    .default(true)
    .describe(
      'Archive the board before deletion to avoid API errors. Default: true. Set to false only if board is already archived.'
    ),
  instance: SharedParams.shape.instance,
});
