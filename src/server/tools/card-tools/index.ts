import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { BusinessMapClient } from '@client/businessmap-client.js';
import { BusinessMapClientFactory } from '@client/client-factory.js';
import { BaseToolHandler } from '../base-tool.js';
import { registerCardCrudTools } from './card-crud-tools.js';
import { registerCardMoveTools } from './card-move-tools.js';
import { registerCardMetadataTools } from './card-metadata-tools.js';
import { registerCardCommentTools } from './card-comment-tools.js';
import { registerCardSubtaskTools } from './card-subtask-tools.js';
import { registerCardRelationshipTools } from './card-relationship-tools.js';
import { registerCardBulkTools } from './card-bulk-tools.js';

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
 */
export class CardToolHandler implements BaseToolHandler {
  registerTools(
    server: McpServer,
    clientOrFactory: BusinessMapClient | BusinessMapClientFactory,
    readOnlyMode: boolean,
    enabledTools?: string[]
  ): void {
    registerCardCrudTools(server, clientOrFactory, readOnlyMode, enabledTools);
    registerCardMoveTools(server, clientOrFactory, readOnlyMode, enabledTools);
    registerCardMetadataTools(server, clientOrFactory, enabledTools);
    registerCardCommentTools(server, clientOrFactory, readOnlyMode, enabledTools);
    registerCardSubtaskTools(server, clientOrFactory, readOnlyMode, enabledTools);
    registerCardRelationshipTools(server, clientOrFactory, readOnlyMode, enabledTools);
    registerCardBulkTools(server, clientOrFactory, readOnlyMode, enabledTools);
  }
}
