import { z } from 'zod';

// Schema básico para listar workspaces (sem parâmetros)
export const listWorkspacesSchema = z.object({});

// Schema para obter detalhes de um workspace específico
export const getWorkspaceSchema = z.object({
  workspace_id: z.number().describe('The ID of the workspace'),
});

// Schema para criação de workspaces
export const createWorkspaceSchema = z.object({
  name: z.string().describe('The name of the workspace'),
  description: z.string().optional().describe('Optional description for the workspace'),
});

// Schema para atualização de workspaces
export const updateWorkspaceSchema = z.object({
  workspace_id: z.number().describe('The ID of the workspace to update'),
  name: z.string().optional().describe('New name for the workspace'),
  description: z.string().optional().describe('New description for the workspace'),
});

// Schema para arquivamento de workspaces
export const archiveWorkspaceSchema = z.object({
  workspace_id: z.number().describe('The ID of the workspace to archive'),
});
