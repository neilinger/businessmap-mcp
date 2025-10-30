import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createLoggerSync } from '@toolprint/mcp-logger';
import { BusinessMapClient } from '../../client/businessmap-client.js';
import { BusinessMapClientFactory } from '../../client/client-factory.js';
import { getWorkflowCycleTimeColumnsSchema } from '../../schemas/workflow-schemas.js';
import { BaseToolHandler, createErrorResponse, createSuccessResponse, getClientForInstance } from './base-tool.js';

const logger = createLoggerSync({ level: 'debug' });

export class WorkflowToolHandler implements BaseToolHandler {
  registerTools(server: McpServer, clientOrFactory: BusinessMapClient | BusinessMapClientFactory, readOnlyMode: boolean): void {
    this.registerGetWorkflowCycleTimeColumns(server, clientOrFactory);
    this.registerGetWorkflowEffectiveCycleTimeColumns(server, clientOrFactory);
  }

  private registerGetWorkflowCycleTimeColumns(server: McpServer, clientOrFactory: BusinessMapClient | BusinessMapClientFactory): void {
    server.registerTool(
      'get_workflow_cycle_time_columns',
      {
        title: 'Get Workflow Cycle Time Columns',
        description: "Get workflow's cycle time columns",
        inputSchema: getWorkflowCycleTimeColumnsSchema.shape,
      },
      async ({ board_id, workflow_id, instance }: any) => {
        try {
          const client = await getClientForInstance(clientOrFactory, instance);
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
    clientOrFactory: BusinessMapClient | BusinessMapClientFactory
  ): void {
    server.registerTool(
      'get_workflow_effective_cycle_time_columns',
      {
        title: 'Get Workflow Effective Cycle Time Columns',
        description:
          "Get workflow's effective cycle time columns (the columns actually used for cycle time calculation with applied filters/logic)",
        inputSchema: getWorkflowCycleTimeColumnsSchema.shape,
      },
      async ({ board_id, workflow_id, instance }: any) => {
        try {
          const client = await getClientForInstance(clientOrFactory, instance);
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
