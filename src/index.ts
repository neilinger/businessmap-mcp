#!/usr/bin/env node

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createLoggerSync } from '@toolprint/mcp-logger';
import { config, validateConfig } from './config/environment.js';
import { BusinessMapMcpServer } from './server/mcp-server.js';

const logger = createLoggerSync({ level: 'info' });

async function main() {
  try {
    // Validate configuration
    validateConfig();

    // Create and setup the MCP server
    const businessMapServer = new BusinessMapMcpServer();

    logger.info('Starting server', {
      name: config.server.name,
      version: config.server.version,
      apiUrl: config.businessMap.apiUrl,
      readOnlyMode: config.businessMap.readOnlyMode
    });

    // Initialize BusinessMap client with retry logic
    logger.info('Initializing connection to BusinessMap API');
    let retryCount = 0;
    const maxRetries = 3;
    const retryDelay = 2000; // 2 seconds

    while (retryCount < maxRetries) {
      try {
        await businessMapServer.initialize();
        logger.info('Successfully connected to BusinessMap API');
        break;
      } catch (error) {
        retryCount++;
        const message = error instanceof Error ? error.message : 'Unknown error';

        if (retryCount < maxRetries) {
          logger.warn('Connection attempt failed', {
            attempt: retryCount,
            maxRetries,
            message,
            retryingInSeconds: retryDelay / 1000
          });
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
        } else {
          logger.error('Failed to connect to BusinessMap API', {
            attempts: maxRetries,
            message,
            hint: 'Please check your API URL and token configuration'
          });
          throw error;
        }
      }
    }

    // Setup transport
    const transport = new StdioServerTransport();

    // Connect server to transport
    await businessMapServer.server.connect(transport);

    logger.info('Server initialized', {
      capabilities: ['tools', 'resources', 'prompts'],
      transport: 'stdio'
    });
  } catch (error) {
    logger.error('Failed to start server', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  logger.info('Shutting down server (SIGINT)');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Shutting down server (SIGTERM)');
  process.exit(0);
});

// Start the server
main().catch((error) => {
  logger.error('Unhandled error', {
    error: error instanceof Error ? error.message : 'Unknown error'
  });
  process.exit(1);
});
