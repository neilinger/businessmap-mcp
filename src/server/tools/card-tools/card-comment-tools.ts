import { z } from 'zod/v4';
import { BusinessMapClient } from '@client/businessmap-client.js';
import { BusinessMapClientFactory } from '@client/client-factory.js';
import {
  createCardCommentSchema,
  deleteCardCommentSchema,
  getCardCommentSchema,
  getCardSchema,
  updateCardCommentSchema,
} from '@schemas/index.js';
import { createErrorResponse, createSuccessResponse, getClientForInstance } from '../base-tool.js';
import { ToolRegistrar } from '../../tool-registrar.js';

export function registerGetCardComments(
  registrar: ToolRegistrar,
  clientOrFactory: BusinessMapClient | BusinessMapClientFactory
): void {
  registrar.registerTool(
    'get_card_comments',
    {
      title: 'Get Card Comments',
      description: 'Get card comments',
      inputSchema: getCardSchema.shape,
    },
    async ({ card_id, instance }: z.infer<typeof getCardSchema>) => {
      try {
        const client = await getClientForInstance(clientOrFactory, instance);
        const comments = await client.getCardComments(card_id);
        return createSuccessResponse({
          comments,
          count: comments.length,
        });
      } catch (error: unknown) {
        return createErrorResponse(error, 'getting card comments');
      }
    }
  );
}

export function registerGetCardComment(
  registrar: ToolRegistrar,
  clientOrFactory: BusinessMapClient | BusinessMapClientFactory
): void {
  registrar.registerTool(
    'get_card_comment',
    {
      title: 'Get Card Comment',
      description: 'Get comment details',
      inputSchema: getCardCommentSchema.shape,
    },
    async ({ card_id, comment_id, instance }: z.infer<typeof getCardCommentSchema>) => {
      try {
        const client = await getClientForInstance(clientOrFactory, instance);
        const comment = await client.getCardComment(card_id, comment_id);
        return createSuccessResponse(comment);
      } catch (error: unknown) {
        return createErrorResponse(error, 'getting card comment');
      }
    }
  );
}

export function registerCreateCardComment(
  registrar: ToolRegistrar,
  clientOrFactory: BusinessMapClient | BusinessMapClientFactory
): void {
  registrar.registerTool(
    'create_card_comment',
    {
      title: 'Create Card Comment',
      description:
        'Create a new comment on a card. Requires non-empty text. Optionally attach files by providing file_name and link.',
      inputSchema: createCardCommentSchema.shape,
    },
    async ({
      card_id,
      text,
      attachments_to_add,
      instance,
    }: z.infer<typeof createCardCommentSchema>) => {
      try {
        const client = await getClientForInstance(clientOrFactory, instance);
        const comment = await client.createCardComment(card_id, {
          text,
          attachments_to_add,
        });
        return createSuccessResponse(comment, 'Comment created successfully:');
      } catch (error: unknown) {
        return createErrorResponse(error, 'creating card comment');
      }
    }
  );
}

export function registerUpdateCardComment(
  registrar: ToolRegistrar,
  clientOrFactory: BusinessMapClient | BusinessMapClientFactory
): void {
  registrar.registerTool(
    'update_card_comment',
    {
      title: 'Update Card Comment',
      description:
        'Update an existing comment on a card. Provide new text and/or additional attachments. Text cannot be empty.',
      inputSchema: updateCardCommentSchema.shape,
    },
    async ({
      card_id,
      comment_id,
      text,
      attachments_to_add,
      instance,
    }: z.infer<typeof updateCardCommentSchema>) => {
      try {
        const client = await getClientForInstance(clientOrFactory, instance);
        const params: {
          text?: string;
          attachments_to_add?: Array<{ file_name: string; link: string }>;
        } = {};
        if (text !== undefined) params.text = text;
        if (attachments_to_add !== undefined) params.attachments_to_add = attachments_to_add;
        const comment = await client.updateCardComment(card_id, comment_id, params);
        return createSuccessResponse(comment, 'Comment updated successfully:');
      } catch (error: unknown) {
        return createErrorResponse(error, 'updating card comment');
      }
    }
  );
}

export function registerDeleteCardComment(
  registrar: ToolRegistrar,
  clientOrFactory: BusinessMapClient | BusinessMapClientFactory
): void {
  registrar.registerTool(
    'delete_card_comment',
    {
      title: 'Delete Card Comment',
      description: 'Delete a comment from a card. This action cannot be undone.',
      inputSchema: deleteCardCommentSchema.shape,
    },
    async ({ card_id, comment_id, instance }: z.infer<typeof getCardCommentSchema>) => {
      try {
        const client = await getClientForInstance(clientOrFactory, instance);
        await client.deleteCardComment(card_id, comment_id);
        return createSuccessResponse({ card_id, comment_id }, 'Comment deleted successfully:');
      } catch (error: unknown) {
        return createErrorResponse(error, 'deleting card comment');
      }
    }
  );
}

/** Register all card comment tools */
export function registerCardCommentTools(
  registrar: ToolRegistrar,
  clientOrFactory: BusinessMapClient | BusinessMapClientFactory
): void {
  registerGetCardComments(registrar, clientOrFactory);
  registerGetCardComment(registrar, clientOrFactory);
  registerCreateCardComment(registrar, clientOrFactory);
  registerUpdateCardComment(registrar, clientOrFactory);
  registerDeleteCardComment(registrar, clientOrFactory);
}
