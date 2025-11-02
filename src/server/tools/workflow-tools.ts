import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createLoggerSync } from '@toolprint/mcp-logger';
import { BusinessMapClient } from '../../client/businessmap-client.js';
import { getWorkflowCycleTimeColumnsSchema } from '../../schemas/workflow-schemas.js';
import { BaseToolHandler, createErrorResponse, createSuccessResponse } from './base-tool.js';

const logger = createLoggerSync({ level: 'debug' });

export class WorkflowToolHandler implements BaseToolHandler {
  registerTools(server: McpServer, client: BusinessMapClient, readOnlyMode: boolean): void {
    this.registerGetWorkflowCycleTimeColumns(server, client);
    this.registerGetWorkflowEffectiveCycleTimeColumns(server, client);
  }

  private registerGetWorkflowCycleTimeColumns(server: McpServer, client: BusinessMapClient): void {
    server.registerTool(
      'get_workflow_cycle_time_columns',
      {
        title: 'Get Workflow Cycle Time Columns',
        description: 'Get cycle time columns',
        inputSchema: getWorkflowCycleTimeColumnsSchema.shape,
      },
      async ({ board_id, workflow_id }) => {
        try {
          const columns = await client.getWorkflowCycleTimeColumns(board_id, workflow_id);
          return createSuccessResponse(columns);
        } catch (error) {
          return createErrorResponse(error, 'fetching workflow cycle time columns');
        }
      }
    );
  }

  private registerGetWorkflowEffectiveCycleTimeColumns(
    server: McpServer,
    client: BusinessMapClient
  ): void {
    server.registerTool(
      'get_workflow_effective_cycle_time_columns',
      {
        title: 'Get Workflow Effective Cycle Time Columns',
        description: 'Get effective cycle time columns',
        inputSchema: getWorkflowCycleTimeColumnsSchema.shape,
      },
      async ({ board_id, workflow_id }) => {
        try {
          logger.debug('Fetching effective cycle time columns', {
            boardId: board_id,
            workflowId: workflow_id
          });
          const columns = await client.getWorkflowEffectiveCycleTimeColumns(board_id, workflow_id);
          logger.debug('Received effective cycle time columns', {
            count: columns.length,
            boardId: board_id,
            workflowId: workflow_id
          });
          return createSuccessResponse(
            columns,
            `Retrieved ${columns.length} effective cycle time columns for board ${board_id}, workflow ${workflow_id}`
          );
        } catch (error) {
          logger.error('Error fetching effective cycle time columns', {
            boardId: board_id,
            workflowId: workflow_id,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          return createErrorResponse(error, 'fetching workflow effective cycle time columns');
        }
      }
    );
  }
}
