import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { BusinessMapClient } from '../client/businessmap-client.js';
import { BusinessMapClientFactory } from '../client/client-factory.js';
import { config } from '../config/environment.js';
import { logger } from '../utils/logger.js';
import {
  BoardToolHandler,
  CardToolHandler,
  CustomFieldToolHandler,
  InstanceToolHandler,
  UserToolHandler,
  UtilityToolHandler,
  WorkflowToolHandler,
  WorkspaceToolHandler,
} from './tools/index.js';

/**
 * BusinessMap MCP Server
 *
 * Supports two operational modes:
 * 1. Multi-Instance Mode: Uses BusinessMapClientFactory to manage multiple instances
 * 2. Legacy Mode: Uses single BusinessMapClient (backward compatible)
 *
 * The server automatically detects which mode to use based on configuration availability.
 */
export class BusinessMapMcpServer {
  private mcpServer: McpServer;
  private clientOrFactory!: BusinessMapClient | BusinessMapClientFactory;
  private isMultiInstance: boolean = false;

  constructor() {
    this.mcpServer = new McpServer({
      name: config.server.name,
      version: config.server.version,
    });

    // Client/Factory will be initialized in initialize() method
    // Using definite assignment assertion (!) to indicate initialization happens in initialize()
  }

  /**
   * Initialize the server by setting up client or factory
   */
  async initialize(): Promise<void> {
    try {
      // Try multi-instance mode first
      const factory = BusinessMapClientFactory.getInstance();

      try {
        await factory.initialize();

        // Multi-instance mode initialized successfully
        this.clientOrFactory = factory;
        this.isMultiInstance = true;

        const defaultInstance = factory.getDefaultInstanceName();
        const availableInstances = factory.getAvailableInstances();
        const isLegacy = factory.isLegacyMode();

        logger.info('BusinessMap MCP Server initialized in multi-instance mode:', {
          mode: isLegacy ? 'legacy (single instance)' : 'multi-instance',
          defaultInstance,
          availableInstances: availableInstances.join(', '),
        });

        // Setup tools with factory
        this.setupTools();
        this.setupResources();

        return;
      } catch (factoryError) {
        // Factory initialization failed, try legacy mode
        logger.warn(
          'Multi-instance configuration not found or invalid, falling back to legacy mode',
          {
            reason: factoryError instanceof Error ? factoryError.message : 'Unknown error',
          }
        );
      }

      // Fallback to legacy single-client mode
      logger.info('Initializing BusinessMap MCP Server in legacy single-client mode');
      const legacyClient = new BusinessMapClient(config.businessMap);
      await legacyClient.initialize();

      this.clientOrFactory = legacyClient;
      this.isMultiInstance = false;

      logger.info('BusinessMap MCP Server initialized:', {
        mode: 'legacy (single instance)',
        apiUrl: config.businessMap.apiUrl,
        readOnly: config.businessMap.readOnlyMode,
      });

      // Setup tools with single client
      this.setupTools();
      this.setupResources();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to initialize BusinessMap MCP Server: ${message}`);
    }
  }

  /**
   * Setup tool handlers
   * Works with both single client (legacy) and multi-instance factory
   */
  private setupTools(): void {
    const readOnlyMode = this.getReadOnlyMode();

    // Initialize tool handlers
    const toolHandlers = [
      new WorkspaceToolHandler(),
      new BoardToolHandler(),
      new CardToolHandler(),
      new CustomFieldToolHandler(),
      new UserToolHandler(),
      new UtilityToolHandler(),
      new WorkflowToolHandler(),
      new InstanceToolHandler(), // Only registers tools in multi-instance mode
    ];

    // Register all tools from handlers
    toolHandlers.forEach((handler) => {
      handler.registerTools(this.mcpServer, this.clientOrFactory, readOnlyMode);
    });

    logger.info(`Registered ${toolHandlers.length} tool handlers`, { readOnly: readOnlyMode });
  }

  /**
   * Get read-only mode setting
   * In multi-instance mode, this is the global server setting (not per-instance)
   */
  private getReadOnlyMode(): boolean {
    if (this.isMultiInstance) {
      // In multi-instance mode, use global read-only setting from environment
      // Individual instances have their own readOnlyMode that could override this
      return config.businessMap.readOnlyMode ?? false;
    } else {
      // Legacy mode uses single client config
      return config.businessMap.readOnlyMode ?? false;
    }
  }

  private setupResources(): void {
    // TODO: Implement resource endpoints for reading workspace/board/card data
    // This would allow LLMs to access current state without performing actions
  }

  get server(): McpServer {
    return this.mcpServer;
  }

  /**
   * Get information about the current server mode
   */
  getServerInfo() {
    return {
      isMultiInstance: this.isMultiInstance,
      readOnlyMode: this.getReadOnlyMode(),
      ...(this.isMultiInstance &&
        this.clientOrFactory instanceof BusinessMapClientFactory && {
        defaultInstance: this.clientOrFactory.getDefaultInstanceName(),
        availableInstances: this.clientOrFactory.getAvailableInstances(),
        cachedInstances: this.clientOrFactory.getCachedInstances(),
        isLegacyMode: this.clientOrFactory.isLegacyMode(),
      }),
    };
  }
}
