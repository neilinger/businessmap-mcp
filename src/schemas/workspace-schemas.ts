import { z } from 'zod';
import { SharedParams } from './shared-params.js';
import { entityIdSchema, entityNameSchema, optionalDescription } from './security-validation.js';

// Basic schema for listar workspaces (no parameters)
export const listWorkspacesSchema = z.object({
  instance: SharedParams.shape.instance,
});

// Schema for obter detalhes de um workspace específico
export const getWorkspaceSchema = z.object({
  workspace_id: entityIdSchema.describe('The ID of the workspace'),
  instance: SharedParams.shape.instance,
});

// Schema for criação de workspaces
export const createWorkspaceSchema = z.object({
  name: entityNameSchema.describe('The name of the workspace'),
  description: optionalDescription.describe('Optional description for the workspace'),
  instance: SharedParams.shape.instance,
});

// Schema for atualização de workspaces
export const updateWorkspaceSchema = z.object({
  workspace_id: entityIdSchema.describe('The ID of the workspace to update'),
  name: entityNameSchema.optional().describe('New name for the workspace'),
  description: optionalDescription.describe('New description for the workspace'),
  instance: SharedParams.shape.instance,
});

// Schema for arquivamento de workspaces
export const archiveWorkspaceSchema = z.object({
  workspace_id: entityIdSchema.describe('The ID of the workspace to archive'),
  instance: SharedParams.shape.instance,
});
