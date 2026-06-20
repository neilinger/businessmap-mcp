import { z } from 'zod/v4';
import { BusinessMapClient } from '@client/businessmap-client.js';
import { BusinessMapClientFactory } from '@client/client-factory.js';
import {
  archiveWorkspaceSchema,
  createWorkspaceSchema,
  getWorkspaceSchema,
  listWorkspacesSchema,
  updateWorkspaceSchema,
} from '@schemas/workspace-schemas.js';
import { bulkArchiveWorkspacesSchema, bulkUpdateWorkspacesSchema } from '@schemas/bulk-schemas.js';
import { DependencyAnalyzer } from '@services/dependency-analyzer.js';
import { ConfirmationBuilder } from '@services/confirmation-builder.js';
import {
  BaseToolHandler,
  createErrorResponse,
  createSuccessResponse,
  getClientForInstance,
} from './base-tool.js';
import { ToolRegistrar } from '../tool-registrar.js';

export class WorkspaceToolHandler implements BaseToolHandler {
  registerTools(
    registrar: ToolRegistrar,
    clientOrFactory: BusinessMapClient | BusinessMapClientFactory
  ): void {
    this.registerListWorkspaces(registrar, clientOrFactory);
    this.registerGetWorkspace(registrar, clientOrFactory);
    this.registerCreateWorkspace(registrar, clientOrFactory);
    this.registerUpdateWorkspace(registrar, clientOrFactory);
    this.registerArchiveWorkspace(registrar, clientOrFactory);
    this.registerBulkArchiveWorkspaces(registrar, clientOrFactory);
    this.registerBulkUpdateWorkspaces(registrar, clientOrFactory);
  }

  private registerListWorkspaces(
    registrar: ToolRegistrar,
    clientOrFactory: BusinessMapClient | BusinessMapClientFactory
  ): void {
    registrar.registerTool(
      'list_workspaces',
      {
        title: 'List Workspaces',
        description: 'List workspaces',
        inputSchema: listWorkspacesSchema.shape,
      },
      async ({ instance }: z.infer<typeof listWorkspacesSchema>) => {
        try {
          const client = await getClientForInstance(clientOrFactory, instance);
          const workspaces = await client.getWorkspaces();
          return createSuccessResponse(workspaces);
        } catch (error: unknown) {
          return createErrorResponse(error, 'fetching workspaces');
        }
      }
    );
  }

  private registerGetWorkspace(
    registrar: ToolRegistrar,
    clientOrFactory: BusinessMapClient | BusinessMapClientFactory
  ): void {
    registrar.registerTool(
      'get_workspace',
      {
        title: 'Get Workspace',
        description: 'Get workspace details',
        inputSchema: getWorkspaceSchema.shape,
      },
      async ({ workspace_id, instance }: z.infer<typeof getWorkspaceSchema>) => {
        try {
          const client = await getClientForInstance(clientOrFactory, instance);
          const workspace = await client.getWorkspace(workspace_id);
          return createSuccessResponse(workspace);
        } catch (error: unknown) {
          return createErrorResponse(error, 'fetching workspace');
        }
      }
    );
  }

  private registerCreateWorkspace(
    registrar: ToolRegistrar,
    clientOrFactory: BusinessMapClient | BusinessMapClientFactory
  ): void {
    registrar.registerTool(
      'create_workspace',
      {
        title: 'Create Workspace',
        description: 'Create workspace',
        inputSchema: createWorkspaceSchema.shape,
      },
      async ({ name, description, instance }: z.infer<typeof createWorkspaceSchema>) => {
        try {
          const client = await getClientForInstance(clientOrFactory, instance);
          const workspace = await client.createWorkspace({ name, description });
          return createSuccessResponse(workspace, 'Workspace created successfully:');
        } catch (error: unknown) {
          return createErrorResponse(error, 'creating workspace');
        }
      }
    );
  }

  private registerUpdateWorkspace(
    registrar: ToolRegistrar,
    clientOrFactory: BusinessMapClient | BusinessMapClientFactory
  ): void {
    registrar.registerTool(
      'update_workspace',
      {
        title: 'Update Workspace',
        description: 'Update workspace',
        inputSchema: updateWorkspaceSchema.shape,
      },
      async ({
        workspace_id,
        name,
        description,
        instance,
      }: z.infer<typeof updateWorkspaceSchema>) => {
        try {
          const client = await getClientForInstance(clientOrFactory, instance);
          const workspace = await client.updateWorkspace(workspace_id, { name, description });
          return createSuccessResponse(workspace, 'Workspace updated successfully:');
        } catch (error: unknown) {
          return createErrorResponse(error, 'updating workspace');
        }
      }
    );
  }

  private registerArchiveWorkspace(
    registrar: ToolRegistrar,
    clientOrFactory: BusinessMapClient | BusinessMapClientFactory
  ): void {
    registrar.registerTool(
      'archive_workspace',
      {
        title: 'Archive Workspace',
        description: 'Archive workspace',
        inputSchema: archiveWorkspaceSchema.shape,
      },
      async ({ workspace_id, instance }: z.infer<typeof archiveWorkspaceSchema>) => {
        try {
          const client = await getClientForInstance(clientOrFactory, instance);
          const workspace = await client.archiveWorkspace(workspace_id);
          return createSuccessResponse(workspace, 'Workspace archived successfully:');
        } catch (error: unknown) {
          return createErrorResponse(error, 'archiving workspace');
        }
      }
    );
  }

  private registerBulkArchiveWorkspaces(
    registrar: ToolRegistrar,
    clientOrFactory: BusinessMapClient | BusinessMapClientFactory
  ): void {
    registrar.registerTool(
      'bulk_archive_workspaces',
      {
        title: 'Bulk Archive Workspaces',
        description: 'Archive multiple workspaces',
        inputSchema: bulkArchiveWorkspacesSchema.shape,
      },
      async ({
        resource_ids,
        analyze_dependencies = true,
        instance,
      }: z.infer<typeof bulkArchiveWorkspacesSchema>) => {
        try {
          const client = await getClientForInstance(clientOrFactory, instance);
          const analyzer = new DependencyAnalyzer(client);
          const confirmationBuilder = new ConfirmationBuilder();

          // Analyze dependencies if requested
          if (analyze_dependencies) {
            const analysis = await analyzer.analyzeWorkspaces(resource_ids);
            const confirmation = confirmationBuilder.buildConfirmation(analysis);

            if (confirmation && confirmation.hasConfirmation) {
              // Return confirmation message for user approval
              return createSuccessResponse(
                {
                  requires_confirmation: true,
                  confirmation_message: confirmation.message,
                  resources_with_dependencies: confirmation.resourcesWithDeps.length,
                  resources_without_dependencies: confirmation.resourcesWithoutDeps.length,
                  total_impact: confirmation.totalImpact,
                },
                'Confirmation required before archiving:'
              );
            }
          }

          // Execute bulk archive
          const results = await client.bulkArchiveWorkspaces(resource_ids);

          const successes = results.filter((r) => r.success);
          const failures = results.filter((r) => !r.success);

          if (failures.length === 0) {
            // All successful
            const workspaces = successes.map((s) => ({
              id: s.id,
              name: s.workspace?.name || `Workspace ${s.id}`,
            }));

            const message = confirmationBuilder.formatSimpleSuccess(
              'workspace',
              successes.length,
              workspaces
            );
            return createSuccessResponse({ archived: successes.length, results }, message);
          } else if (successes.length > 0) {
            // Partial success
            const message = confirmationBuilder.formatPartialSuccess(
              'workspace',
              successes.map((s) => ({ id: s.id, name: s.workspace?.name || `Workspace ${s.id}` })),
              failures.map((f) => ({
                id: f.id,
                name: `Workspace ${f.id}`,
                error: f.error || 'Unknown error',
              }))
            );
            return createSuccessResponse(
              { successful: successes.length, failed: failures.length, results },
              message
            );
          } else {
            // All failed
            return createErrorResponse(
              new Error(`All ${failures.length} archiving operations failed`),
              'bulk archiving workspaces'
            );
          }
        } catch (error: unknown) {
          return createErrorResponse(error, 'bulk archiving workspaces');
        }
      }
    );
  }

  private registerBulkUpdateWorkspaces(
    registrar: ToolRegistrar,
    clientOrFactory: BusinessMapClient | BusinessMapClientFactory
  ): void {
    registrar.registerTool(
      'bulk_update_workspaces',
      {
        title: 'Bulk Update Workspaces',
        description: 'Update multiple workspaces',
        inputSchema: bulkUpdateWorkspacesSchema.shape,
      },
      async (params: z.infer<typeof bulkUpdateWorkspacesSchema>) => {
        const { resource_ids, name, description, instance } = params;
        try {
          const client = await getClientForInstance(clientOrFactory, instance);
          const updates: Partial<{ name: string; description: string }> = {};
          if (name !== undefined) updates.name = name;
          if (description !== undefined) updates.description = description;

          const results = await client.bulkUpdateWorkspaces(resource_ids, updates);

          const successes = results.filter((r) => r.success);
          const failures = results.filter((r) => !r.success);

          if (failures.length === 0) {
            return createSuccessResponse(
              { updated: successes.length, workspaces: successes.map((s) => s.workspace) },
              `✓ Successfully updated ${successes.length} workspace${successes.length > 1 ? 's' : ''}`
            );
          } else if (successes.length > 0) {
            const confirmationBuilder = new ConfirmationBuilder();
            const message = confirmationBuilder.formatPartialSuccess(
              'workspace',
              successes.map((s) => ({ id: s.id, name: s.workspace?.name || `Workspace ${s.id}` })),
              failures.map((f) => ({
                id: f.id,
                name: `Workspace ${f.id}`,
                error: f.error || 'Unknown error',
              }))
            );
            return createSuccessResponse(
              { successful: successes.length, failed: failures.length, results },
              message
            );
          } else {
            return createErrorResponse(
              new Error(`All ${failures.length} updates failed`),
              'bulk updating workspaces'
            );
          }
        } catch (error: unknown) {
          return createErrorResponse(error, 'bulk updating workspaces');
        }
      }
    );
  }
}
