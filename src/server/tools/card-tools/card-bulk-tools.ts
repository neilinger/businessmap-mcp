import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod/v4';
import { BusinessMapClient } from '@client/businessmap-client.js';
import { BusinessMapClientFactory } from '@client/client-factory.js';
import { bulkDeleteCardsSchema, bulkUpdateCardsSchema } from '@schemas/bulk-schemas.js';
import { BulkUpdateCardFields } from '@defs/card.js';
import { DependencyAnalyzer } from '@services/dependency-analyzer.js';
import { ConfirmationBuilder } from '@services/confirmation-builder.js';
import {
  createErrorResponse,
  createSuccessResponse,
  getClientForInstance,
  shouldRegisterTool,
} from '../base-tool.js';

export function registerBulkDeleteCards(
  server: McpServer,
  clientOrFactory: BusinessMapClient | BusinessMapClientFactory
): void {
  server.registerTool(
    'bulk_delete_cards',
    {
      title: 'Bulk Delete Cards',
      description: 'Delete multiple cards',
      inputSchema: bulkDeleteCardsSchema.shape,
    },
    async ({
      resource_ids,
      analyze_dependencies = true,
      instance,
    }: z.infer<typeof bulkDeleteCardsSchema>) => {
      try {
        const client = await getClientForInstance(clientOrFactory, instance);
        const analyzer = new DependencyAnalyzer(client);
        const confirmationBuilder = new ConfirmationBuilder();

        // Analyze dependencies if requested
        if (analyze_dependencies) {
          const analysis = await analyzer.analyzeCards(resource_ids);
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
              'Confirmation required before deletion:'
            );
          }
        }

        // Execute bulk delete
        const results = await client.bulkDeleteCards(resource_ids);

        const successes = results.filter((r) => r.success);
        const failures = results.filter((r) => !r.success);

        if (failures.length === 0) {
          // All successful
          const cards = await Promise.all(
            successes.map(async (r) => {
              try {
                const card = await client.getCard(r.id);
                return { id: r.id, name: card.title };
              } catch {
                return { id: r.id, name: `Card ${r.id}` };
              }
            })
          );

          const message = confirmationBuilder.formatSimpleSuccess('card', successes.length, cards);
          return createSuccessResponse({ deleted: successes.length, results }, message);
        } else if (successes.length > 0) {
          // Partial success
          const message = confirmationBuilder.formatPartialSuccess(
            'card',
            successes.map((s) => ({ id: s.id, name: `Card ${s.id}` })),
            failures.map((f) => ({
              id: f.id,
              name: `Card ${f.id}`,
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
            new Error(`All ${failures.length} deletions failed`),
            'bulk deleting cards'
          );
        }
      } catch (error: unknown) {
        return createErrorResponse(error, 'bulk deleting cards');
      }
    }
  );
}

export function registerBulkUpdateCards(
  server: McpServer,
  clientOrFactory: BusinessMapClient | BusinessMapClientFactory
): void {
  server.registerTool(
    'bulk_update_cards',
    {
      title: 'Bulk Update Cards',
      description: 'Update multiple cards',
      inputSchema: bulkUpdateCardsSchema.shape,
    },
    async (params: z.infer<typeof bulkUpdateCardsSchema>) => {
      const {
        resource_ids,
        title,
        description,
        column_id,
        lane_id,
        priority,
        owner_user_id,
        instance,
      } = params;
      try {
        const client = await getClientForInstance(clientOrFactory, instance);
        const updates: Partial<BulkUpdateCardFields> = {};
        if (title !== undefined) updates.title = title;
        if (description !== undefined) updates.description = description;
        if (column_id !== undefined) updates.column_id = column_id;
        if (lane_id !== undefined) updates.lane_id = lane_id;
        if (priority !== undefined) updates.priority = String(priority);
        if (owner_user_id !== undefined) updates.owner_user_id = owner_user_id;

        const results = await client.bulkUpdateCards(resource_ids, updates);

        const successes = results.filter((r) => r.success);
        const failures = results.filter((r) => !r.success);

        if (failures.length === 0) {
          return createSuccessResponse(
            { updated: successes.length, cards: successes.map((s) => s.card) },
            `Successfully updated ${successes.length} card${successes.length > 1 ? 's' : ''}`
          );
        } else if (successes.length > 0) {
          const confirmationBuilder = new ConfirmationBuilder();
          const message = confirmationBuilder.formatPartialSuccess(
            'card',
            successes.map((s) => ({ id: s.id, name: s.card?.title || `Card ${s.id}` })),
            failures.map((f) => ({
              id: f.id,
              name: `Card ${f.id}`,
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
            'bulk updating cards'
          );
        }
      } catch (error: unknown) {
        return createErrorResponse(error, 'bulk updating cards');
      }
    }
  );
}

/** Conditionally register all card bulk operation tools */
export function registerCardBulkTools(
  server: McpServer,
  clientOrFactory: BusinessMapClient | BusinessMapClientFactory,
  readOnlyMode: boolean,
  enabledTools?: string[]
): void {
  // All bulk tools are write operations
  if (!readOnlyMode) {
    if (shouldRegisterTool('bulk_delete_cards', enabledTools)) {
      registerBulkDeleteCards(server, clientOrFactory);
    }
    if (shouldRegisterTool('bulk_update_cards', enabledTools)) {
      registerBulkUpdateCards(server, clientOrFactory);
    }
  }
}
