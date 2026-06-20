import { BusinessMapClient } from '@client/businessmap-client.js';
import { BusinessMapClientFactory } from '@client/client-factory.js';
import { BaseToolHandler } from '../base-tool.js';
import { ToolRegistrar } from '../../tool-registrar.js';
import { registerCardCrudTools } from './card-crud-tools.js';
import { registerCardMoveTools } from './card-move-tools.js';
import { registerCardMetadataTools } from './card-metadata-tools.js';
import { registerCardCommentTools } from './card-comment-tools.js';
import { registerCardSubtaskTools } from './card-subtask-tools.js';
import { registerCardRelationshipTools } from './card-relationship-tools.js';
import { registerCardBulkTools } from './card-bulk-tools.js';
import { registerCardBlockerTools } from './card-blocker-tools.js';

/**
 * CardToolHandler orchestrates registration of all card-related MCP tools.
 * Tools are organized into focused modules by domain:
 * - CRUD: list, get, create, update, delete cards
 * - Move: move card, set card size (write operations)
 * - Metadata: card size, custom fields, types, history, outcomes (read queries)
 * - Comments: comment CRUD operations
 * - Subtasks: subtask operations
 * - Relationships: parents, children, linked cards
 * - Bulk: bulk delete and update operations
 * - Blocker: block_card, unblock_card (native BM blocker field)
 */
export class CardToolHandler implements BaseToolHandler {
  registerTools(
    registrar: ToolRegistrar,
    clientOrFactory: BusinessMapClient | BusinessMapClientFactory
  ): void {
    registerCardCrudTools(registrar, clientOrFactory);
    registerCardMoveTools(registrar, clientOrFactory);
    registerCardMetadataTools(registrar, clientOrFactory);
    registerCardCommentTools(registrar, clientOrFactory);
    registerCardSubtaskTools(registrar, clientOrFactory);
    registerCardRelationshipTools(registrar, clientOrFactory);
    registerCardBulkTools(registrar, clientOrFactory);
    registerCardBlockerTools(registrar, clientOrFactory);
  }
}
