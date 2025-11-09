import { z } from 'zod';
import { instanceParameterSchema } from './common-schemas.js';
import { entityIdSchema, entityNameSchema, optionalDescription } from './security-validation.js';

// Schema básico para listar workspaces (sem parâmetros)
export const listWorkspacesSchema = z.object({
  ...instanceParameterSchema,
});

// Schema para obter detalhes de um workspace específico
export const getWorkspaceSchema = z.object({
  workspace_id: entityIdSchema.describe('The ID of the workspace'),
  ...instanceParameterSchema,
});

// Schema para criação de workspaces
export const createWorkspaceSchema = z.object({
  name: entityNameSchema.describe('The name of the workspace'),
  description: optionalDescription.describe('Optional description for the workspace'),
  ...instanceParameterSchema,
});

// Schema para atualização de workspaces
export const updateWorkspaceSchema = z.object({
  workspace_id: entityIdSchema.describe('The ID of the workspace to update'),
  name: entityNameSchema.optional().describe('New name for the workspace'),
  description: optionalDescription.describe('New description for the workspace'),
  ...instanceParameterSchema,
});

// Schema para arquivamento de workspaces
export const archiveWorkspaceSchema = z.object({
  workspace_id: entityIdSchema.describe('The ID of the workspace to archive'),
  ...instanceParameterSchema,
});
