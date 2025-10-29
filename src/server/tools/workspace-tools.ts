import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { BusinessMapClient } from '../../client/businessmap-client.js';
import {
  archiveWorkspaceSchema,
  createWorkspaceSchema,
  getWorkspaceSchema,
  listWorkspacesSchema,
  updateWorkspaceSchema,
} from '../../schemas/workspace-schemas.js';
import {
  bulkArchiveWorkspacesSchema,
  bulkUpdateWorkspacesSchema,
} from '../../schemas/bulk-schemas.js';
import { DependencyAnalyzer } from '../../services/dependency-analyzer.js';
import { ConfirmationBuilder } from '../../services/confirmation-builder.js';
import { BaseToolHandler, createErrorResponse, createSuccessResponse } from './base-tool.js';

export class WorkspaceToolHandler implements BaseToolHandler {
  registerTools(server: McpServer, client: BusinessMapClient, readOnlyMode: boolean): void {
    this.registerListWorkspaces(server, client);
    this.registerGetWorkspace(server, client);

    if (!readOnlyMode) {
      this.registerCreateWorkspace(server, client);
      this.registerUpdateWorkspace(server, client);
      this.registerArchiveWorkspace(server, client);
      this.registerBulkArchiveWorkspaces(server, client);
      this.registerBulkUpdateWorkspaces(server, client);
    }
  }

  private registerListWorkspaces(server: McpServer, client: BusinessMapClient): void {
    server.registerTool(
      'list_workspaces',
      {
        title: 'List Workspaces',
        description: 'Get a list of all workspaces',
        inputSchema: listWorkspacesSchema.shape,
      },
      async () => {
        try {
          const workspaces = await client.getWorkspaces();
          return createSuccessResponse(workspaces);
        } catch (error) {
          return createErrorResponse(error, 'fetching workspaces');
        }
      }
    );
  }

  private registerGetWorkspace(server: McpServer, client: BusinessMapClient): void {
    server.registerTool(
      'get_workspace',
      {
        title: 'Get Workspace',
        description: 'Get details of a specific workspace',
        inputSchema: getWorkspaceSchema.shape,
      },
      async ({ workspace_id }) => {
        try {
          const workspace = await client.getWorkspace(workspace_id);
          return createSuccessResponse(workspace);
        } catch (error) {
          return createErrorResponse(error, 'fetching workspace');
        }
      }
    );
  }

  private registerCreateWorkspace(server: McpServer, client: BusinessMapClient): void {
    server.registerTool(
      'create_workspace',
      {
        title: 'Create Workspace',
        description: 'Create a new workspace',
        inputSchema: createWorkspaceSchema.shape,
      },
      async ({ name, description }) => {
        try {
          const workspace = await client.createWorkspace({ name, description });
          return createSuccessResponse(workspace, 'Workspace created successfully:');
        } catch (error) {
          return createErrorResponse(error, 'creating workspace');
        }
      }
    );
  }


  private registerUpdateWorkspace(server: McpServer, client: BusinessMapClient): void {
    server.registerTool(
      'update_workspace',
      {
        title: 'Update Workspace',
        description: 'Update an existing workspace',
        inputSchema: updateWorkspaceSchema.shape,
      },
      async ({ workspace_id, name, description }) => {
        try {
          const workspace = await client.updateWorkspace(workspace_id, { name, description });
          return createSuccessResponse(workspace, 'Workspace updated successfully:');
        } catch (error) {
          return createErrorResponse(error, 'updating workspace');
        }
      }
    );
  }

  private registerArchiveWorkspace(server: McpServer, client: BusinessMapClient): void {
    server.registerTool(
      'archive_workspace',
      {
        title: 'Archive Workspace',
        description: 'Archive workspace (soft delete only)',
        inputSchema: archiveWorkspaceSchema.shape,
      },
      async ({ workspace_id }) => {
        try {
          const workspace = await client.archiveWorkspace(workspace_id);
          return createSuccessResponse(
            workspace,
            'Workspace archived successfully:'
          );
        } catch (error) {
          return createErrorResponse(error, 'archiving workspace');
        }
      }
    );
  }

  private registerBulkArchiveWorkspaces(server: McpServer, client: BusinessMapClient): void {
    server.registerTool(
      'bulk_archive_workspaces',
      {
        title: 'Bulk Archive Workspaces',
        description: 'Archive multiple workspaces with dependency analysis and consolidated confirmation. Maximum 50 workspaces per request.',
        inputSchema: bulkArchiveWorkspacesSchema.shape,
      },
      async ({ resource_ids, analyze_dependencies = true }) => {
        try {
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
              name: s.workspace?.name || `Workspace ${s.id}`
            }));

            const message = confirmationBuilder.formatSimpleSuccess('workspace', successes.length, workspaces);
            return createSuccessResponse({ archived: successes.length, results }, message);
          } else if (successes.length > 0) {
            // Partial success
            const message = confirmationBuilder.formatPartialSuccess(
              'workspace',
              successes.map((s) => ({ id: s.id, name: s.workspace?.name || `Workspace ${s.id}` })),
              failures.map((f) => ({ id: f.id, name: `Workspace ${f.id}`, error: f.error || 'Unknown error' }))
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
        } catch (error) {
          return createErrorResponse(error, 'bulk archiving workspaces');
        }
      }
    );
  }

  private registerBulkUpdateWorkspaces(server: McpServer, client: BusinessMapClient): void {
    server.registerTool(
      'bulk_update_workspaces',
      {
        title: 'Bulk Update Workspaces',
        description: 'Update multiple workspaces with the same changes. Maximum 50 workspaces per request.',
        inputSchema: bulkUpdateWorkspacesSchema as any,
      },
      async (params: any) => {
        const { resource_ids, name, description } = params;
        try {
          const updates: any = {};
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
              failures.map((f) => ({ id: f.id, name: `Workspace ${f.id}`, error: f.error || 'Unknown error' }))
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
        } catch (error) {
          return createErrorResponse(error, 'bulk updating workspaces');
        }
      }
    );
  }
}
