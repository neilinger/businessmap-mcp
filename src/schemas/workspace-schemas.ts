import { z } from 'zod';
import { instanceParameterSchema } from './common-schemas.js';

// Basic schema for listar workspaces (no parameters)
export const listWorkspacesSchema = z.object({
  ...instanceParameterSchema,
});

// Schema for obter detalhes de um workspace específico
export const getWorkspaceSchema = z.object({
  workspace_id: z.number().describe('The ID of the workspace'),
  ...instanceParameterSchema,
});

// Schema for criação de workspaces
export const createWorkspaceSchema = z.object({
  name: z.string().describe('The name of the workspace'),
  description: z.string().optional().describe('Optional description for the workspace'),
  ...instanceParameterSchema,
});

// Schema for atualização de workspaces
export const updateWorkspaceSchema = z.object({
  workspace_id: z.number().describe('The ID of the workspace to update'),
  name: z.string().optional().describe('New name for the workspace'),
  description: z.string().optional().describe('New description for the workspace'),
  ...instanceParameterSchema,
});

// Schema for arquivamento de workspaces
export const archiveWorkspaceSchema = z.object({
  workspace_id: z.number().describe('The ID of the workspace to archive'),
  ...instanceParameterSchema,
});
