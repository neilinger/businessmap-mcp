import { z } from 'zod/v4';
import { logger } from '@utils/logger.js';
import { BusinessMapClient } from '@client/businessmap-client.js';
import { BusinessMapClientFactory } from '@client/client-factory.js';
import { getWorkflowCycleTimeColumnsSchema } from '@schemas/workflow-schemas.js';
import {
  BaseToolHandler,
  createErrorResponse,
  createSuccessResponse,
  getClientForInstance,
} from './base-tool.js';
import { ToolRegistrar } from '../tool-registrar.js';

export class WorkflowToolHandler implements BaseToolHandler {
  registerTools(
    registrar: ToolRegistrar,
    clientOrFactory: BusinessMapClient | BusinessMapClientFactory
  ): void {
    this.registerGetWorkflowCycleTimeColumns(registrar, clientOrFactory);
    this.registerGetWorkflowEffectiveCycleTimeColumns(registrar, clientOrFactory);
  }

  private registerGetWorkflowCycleTimeColumns(
    registrar: ToolRegistrar,
    clientOrFactory: BusinessMapClient | BusinessMapClientFactory
  ): void {
    registrar.registerTool(
      'get_workflow_cycle_time_columns',
      {
        title: 'Get Workflow Cycle Time Columns',
        description: 'Get cycle time columns',
        inputSchema: getWorkflowCycleTimeColumnsSchema.shape,
      },
      async ({
        board_id,
        workflow_id,
        instance,
      }: z.infer<typeof getWorkflowCycleTimeColumnsSchema>) => {
        try {
          const client = await getClientForInstance(clientOrFactory, instance);
          const columns = await client.getWorkflowCycleTimeColumns(board_id, workflow_id);
          return createSuccessResponse(columns);
        } catch (error: unknown) {
          return createErrorResponse(error, 'fetching workflow cycle time columns');
        }
      }
    );
  }

  private registerGetWorkflowEffectiveCycleTimeColumns(
    registrar: ToolRegistrar,
    clientOrFactory: BusinessMapClient | BusinessMapClientFactory
  ): void {
    registrar.registerTool(
      'get_workflow_effective_cycle_time_columns',
      {
        title: 'Get Workflow Effective Cycle Time Columns',
        description: 'Get effective cycle time columns',
        inputSchema: getWorkflowCycleTimeColumnsSchema.shape,
      },
      async ({
        board_id,
        workflow_id,
        instance,
      }: z.infer<typeof getWorkflowCycleTimeColumnsSchema>) => {
        try {
          const client = await getClientForInstance(clientOrFactory, instance);
          logger.debug('Fetching effective cycle time columns', {
            boardId: board_id,
            workflowId: workflow_id,
          });
          const columns = await client.getWorkflowEffectiveCycleTimeColumns(board_id, workflow_id);
          logger.debug('Received effective cycle time columns', {
            count: columns.length,
            boardId: board_id,
            workflowId: workflow_id,
          });
          return createSuccessResponse(
            columns,
            `Retrieved ${columns.length} effective cycle time columns for board ${board_id}, workflow ${workflow_id}`
          );
        } catch (error: unknown) {
          logger.error('Error fetching effective cycle time columns', {
            boardId: board_id,
            workflowId: workflow_id,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          return createErrorResponse(error, 'fetching workflow effective cycle time columns');
        }
      }
    );
  }
}
