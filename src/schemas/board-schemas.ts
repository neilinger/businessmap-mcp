import { z } from 'zod';
import { instanceParameterSchema } from './common-schemas.js';

// Schema para listagem de boards
export const listBoardsSchema = z.object({
  // ID filters (arrays)
  board_ids: z
    .array(z.number())
    .optional()
    .describe('A list of the board ids that you want to get'),
  workspace_ids: z
    .array(z.number())
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
  if_assigned: z
    .number()
    .optional()
    .describe('When set to 1 you will only get boards to which you are assigned (0 or 1)'),

  // Archive status
  is_archived: z
    .number()
    .optional()
    .describe(
      'When set to 0 you will only get non-archived boards. When set to 1 you will only get archived boards (0 or 1)'
    ),

  // Legacy compatibility
  workspace_id: z
    .number()
    .optional()
    .describe('Optional workspace ID to filter boards (legacy parameter)'),
  ...instanceParameterSchema,
});

// Schema para busca de boards
export const searchBoardSchema = z.object({
  board_id: z.number().optional().describe('The ID of the board to search for'),
  board_name: z.string().optional().describe('The name of the board to search for'),
  workspace_id: z.number().optional().describe('Optional workspace ID to limit search scope'),
  ...instanceParameterSchema,
});

// Schema para obter detalhes de um board específico
export const getBoardSchema = z.object({
  board_id: z.number().describe('The ID of the board'),
  ...instanceParameterSchema,
});

// Schema para obter colunas de um board
export const getColumnsSchema = z.object({
  board_id: z.number().describe('The ID of the board'),
  ...instanceParameterSchema,
});

// Schema para obter lanes de um board
export const getLanesSchema = z.object({
  board_id: z.number().describe('The ID of the board'),
  ...instanceParameterSchema,
});

// Schema para obter detalhes de uma lane específica
export const getLaneSchema = z.object({
  lane_id: z.number().describe('The ID of the lane'),
  ...instanceParameterSchema,
});

// Schema para criação de boards
export const createBoardSchema = z.object({
  name: z.string().describe('The name of the board'),
  description: z.string().optional().describe('Optional description for the board'),
  project_id: z.number().optional().describe('Optional project ID for the board'),
  workspace_id: z.number().optional().describe('The ID of the workspace'),
  ...instanceParameterSchema,
});

// Schema para criação de lanes
export const createLaneSchema = z.object({
  name: z.string().describe('The name of the lane'),
  description: z.string().optional().describe('Optional description for the lane'),
  workflow_id: z.number().describe('The workflow ID'),
  position: z.number().describe('The position of the lane'),
  color: z.string().describe('The color for the lane'),
  ...instanceParameterSchema,
});

// Schema para obter estrutura atual do board
export const getCurrentBoardStructureSchema = z.object({
  board_id: z.number().describe('The ID of the board'),
  ...instanceParameterSchema,
});

// Schema para atualização de boards
export const updateBoardSchema = z.object({
  board_id: z.number().describe('The ID of the board to update'),
  name: z.string().optional().describe('New name for the board'),
  description: z.string().optional().describe('New description for the board'),
  ...instanceParameterSchema,
});

// Schema para deleção de boards
export const deleteBoardSchema = z.object({
  board_id: z.number().describe('The ID of the board to delete'),
  archive_first: z
    .boolean()
    .optional()
    .default(true)
    .describe(
      'Archive the board before deletion to avoid API errors. Default: true. Set to false only if board is already archived.'
    ),
  ...instanceParameterSchema,
});
