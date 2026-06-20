import { z } from 'zod/v4';
import { BusinessMapClient } from '@client/businessmap-client.js';
import { BusinessMapClientFactory } from '@client/client-factory.js';
import {
  addCardParentSchema,
  getCardChildrenSchema,
  getCardLinkedCardsSchema,
  getCardParentGraphSchema,
  getCardParentSchema,
  getCardParentsSchema,
  getCardSchema,
  removeCardParentSchema,
} from '@schemas/index.js';
import { createErrorResponse, createSuccessResponse, getClientForInstance } from '../base-tool.js';
import { ToolRegistrar } from '../../tool-registrar.js';

export function registerGetCardLinkedCards(
  registrar: ToolRegistrar,
  clientOrFactory: BusinessMapClient | BusinessMapClientFactory
): void {
  registrar.registerTool(
    'get_card_linked_cards',
    {
      title: 'Get Card Linked Cards',
      description: 'Get card linked cards',
      inputSchema: getCardLinkedCardsSchema.shape,
    },
    async ({ card_id, instance }: z.infer<typeof getCardSchema>) => {
      try {
        const client = await getClientForInstance(clientOrFactory, instance);
        const linkedCards = await client.getCardLinkedCards(card_id);
        return createSuccessResponse({
          linkedCards,
          count: linkedCards.length,
        });
      } catch (error: unknown) {
        return createErrorResponse(error, 'getting card linked cards');
      }
    }
  );
}

export function registerGetCardParents(
  registrar: ToolRegistrar,
  clientOrFactory: BusinessMapClient | BusinessMapClientFactory
): void {
  registrar.registerTool(
    'get_card_parents',
    {
      title: 'Get Card Parents',
      description: 'Get card parents',
      inputSchema: getCardParentsSchema.shape,
    },
    async ({ card_id, instance }: z.infer<typeof getCardSchema>) => {
      try {
        const client = await getClientForInstance(clientOrFactory, instance);
        const parents = await client.getCardParents(card_id);
        return createSuccessResponse({
          parents,
          count: parents.length,
        });
      } catch (error: unknown) {
        return createErrorResponse(error, 'getting card parents');
      }
    }
  );
}

export function registerGetCardParent(
  registrar: ToolRegistrar,
  clientOrFactory: BusinessMapClient | BusinessMapClientFactory
): void {
  registrar.registerTool(
    'get_card_parent',
    {
      title: 'Get Card Parent',
      description: 'Get card parent',
      inputSchema: getCardParentSchema.shape,
    },
    async ({ card_id, parent_card_id, instance }: z.infer<typeof addCardParentSchema>) => {
      try {
        const client = await getClientForInstance(clientOrFactory, instance);
        const parent = await client.getCardParent(card_id, parent_card_id);
        return createSuccessResponse(parent);
      } catch (error: unknown) {
        return createErrorResponse(error, 'getting card parent');
      }
    }
  );
}

export function registerAddCardParent(
  registrar: ToolRegistrar,
  clientOrFactory: BusinessMapClient | BusinessMapClientFactory
): void {
  registrar.registerTool(
    'add_card_parent',
    {
      title: 'Add Card Parent',
      description: 'Add card parent',
      inputSchema: addCardParentSchema.shape,
    },
    async ({ card_id, parent_card_id, instance }: z.infer<typeof addCardParentSchema>) => {
      try {
        const client = await getClientForInstance(clientOrFactory, instance);
        const result = await client.addCardParent(card_id, parent_card_id);
        return createSuccessResponse(result, 'Card parent added successfully:');
      } catch (error: unknown) {
        return createErrorResponse(error, 'adding card parent');
      }
    }
  );
}

export function registerRemoveCardParent(
  registrar: ToolRegistrar,
  clientOrFactory: BusinessMapClient | BusinessMapClientFactory
): void {
  registrar.registerTool(
    'remove_card_parent',
    {
      title: 'Remove Card Parent',
      description: 'Remove card parent',
      inputSchema: removeCardParentSchema.shape,
    },
    async ({ card_id, parent_card_id, instance }: z.infer<typeof addCardParentSchema>) => {
      try {
        const client = await getClientForInstance(clientOrFactory, instance);
        await client.removeCardParent(card_id, parent_card_id);
        return createSuccessResponse(
          { card_id, parent_card_id },
          'Card parent removed successfully:'
        );
      } catch (error: unknown) {
        return createErrorResponse(error, 'removing card parent');
      }
    }
  );
}

export function registerGetCardParentGraph(
  registrar: ToolRegistrar,
  clientOrFactory: BusinessMapClient | BusinessMapClientFactory
): void {
  registrar.registerTool(
    'get_card_parent_graph',
    {
      title: 'Get Card Parent Graph',
      description: 'Get card parent graph',
      inputSchema: getCardParentGraphSchema.shape,
    },
    async ({ card_id, instance }: z.infer<typeof getCardSchema>) => {
      try {
        const client = await getClientForInstance(clientOrFactory, instance);
        const parentGraph = await client.getCardParentGraph(card_id);
        return createSuccessResponse({
          parentGraph,
          count: parentGraph.length,
        });
      } catch (error: unknown) {
        return createErrorResponse(error, 'getting card parent graph');
      }
    }
  );
}

export function registerGetCardChildren(
  registrar: ToolRegistrar,
  clientOrFactory: BusinessMapClient | BusinessMapClientFactory
): void {
  registrar.registerTool(
    'get_card_children',
    {
      title: 'Get Card Children',
      description: 'Get card children',
      inputSchema: getCardChildrenSchema.shape,
    },
    async ({ card_id, instance }: z.infer<typeof getCardSchema>) => {
      try {
        const client = await getClientForInstance(clientOrFactory, instance);
        const children = await client.getCardChildren(card_id);
        return createSuccessResponse({
          children,
          count: children.length,
        });
      } catch (error: unknown) {
        return createErrorResponse(error, 'getting card children');
      }
    }
  );
}

/** Register all card relationship tools */
export function registerCardRelationshipTools(
  registrar: ToolRegistrar,
  clientOrFactory: BusinessMapClient | BusinessMapClientFactory
): void {
  registerGetCardLinkedCards(registrar, clientOrFactory);
  registerGetCardParents(registrar, clientOrFactory);
  registerGetCardParent(registrar, clientOrFactory);
  registerGetCardParentGraph(registrar, clientOrFactory);
  registerGetCardChildren(registrar, clientOrFactory);
  registerAddCardParent(registrar, clientOrFactory);
  registerRemoveCardParent(registrar, clientOrFactory);
}
