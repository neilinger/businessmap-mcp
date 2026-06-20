import { z } from 'zod/v4';
import { BusinessMapClient } from '@client/businessmap-client.js';
import { BusinessMapClientFactory } from '@client/client-factory.js';
import { InstanceConfigManager } from '@config/instance-manager.js';
import { BaseToolHandler, createErrorResponse, createSuccessResponse } from './base-tool.js';
import { ToolRegistrar } from '../tool-registrar.js';

/**
 * Tool handler for instance management operations.
 * These tools only work when the server is running in multi-instance mode.
 */
export class InstanceToolHandler implements BaseToolHandler {
  registerTools(
    registrar: ToolRegistrar,
    clientOrFactory: BusinessMapClient | BusinessMapClientFactory
  ): void {
    // Only register instance tools in multi-instance mode
    if (clientOrFactory instanceof BusinessMapClientFactory) {
      this.registerListInstances(registrar, clientOrFactory);
      this.registerGetInstanceInfo(registrar, clientOrFactory);
    }
  }

  private registerListInstances(registrar: ToolRegistrar, factory: BusinessMapClientFactory): void {
    registrar.registerTool(
      'list_instances',
      {
        title: 'List Instances',
        description: 'List all configured instances',
        inputSchema: z.object({}).shape,
      },
      async () => {
        try {
          const configManager = InstanceConfigManager.getInstance();
          const instances = configManager.getAllInstances();
          const defaultInstance = configManager.getDefaultInstanceName();
          const isLegacy = configManager.isLegacyMode();

          const instancesInfo = instances.map((inst) => ({
            name: inst.name,
            description: inst.description || 'No description',
            apiUrl: inst.apiUrl,
            isDefault: inst.name === defaultInstance,
            readOnlyMode: inst.readOnlyMode || false,
            defaultWorkspaceId: inst.defaultWorkspaceId,
            tags: inst.tags || [],
            cached: factory.isCached(inst.name),
          }));

          const response = {
            mode: isLegacy ? 'legacy' : 'multi-instance',
            defaultInstance,
            totalInstances: instances.length,
            instances: instancesInfo,
          };

          return createSuccessResponse(response);
        } catch (error: unknown) {
          return createErrorResponse(error, 'listing instances');
        }
      }
    );
  }

  private registerGetInstanceInfo(
    registrar: ToolRegistrar,
    factory: BusinessMapClientFactory
  ): void {
    const schema = z.object({
      instance: z.string().describe('The name of the instance to get information about'),
    });

    registrar.registerTool(
      'get_instance_info',
      {
        title: 'Get Instance Info',
        description: 'Get instance details',
        inputSchema: schema.shape,
      },
      async ({ instance }) => {
        try {
          const configManager = InstanceConfigManager.getInstance();

          // Check if instance exists
          if (!configManager.hasInstance(instance)) {
            return createErrorResponse(
              new Error(`Instance '${instance}' not found`),
              'getting instance info'
            );
          }

          // Get instance configuration (without token)
          const resolution = configManager.getActiveInstance(instance);
          const defaultInstance = configManager.getDefaultInstanceName();

          // Get cache information if available
          const cacheInfo = factory.getCacheInfo(instance);

          const info = {
            name: resolution.instance.name,
            description: resolution.instance.description || 'No description',
            apiUrl: resolution.instance.apiUrl,
            tokenEnvVar: resolution.instance.apiTokenEnv,
            readOnlyMode: resolution.instance.readOnlyMode || false,
            defaultWorkspaceId: resolution.instance.defaultWorkspaceId,
            tags: resolution.instance.tags || [],
            isDefault: resolution.instance.name === defaultInstance,
            resolutionStrategy: resolution.strategy,
            cached: factory.isCached(instance),
            cacheInfo: cacheInfo
              ? {
                  createdAt: cacheInfo.createdAt.toISOString(),
                  initialized: cacheInfo.initialized,
                  strategy: cacheInfo.strategy,
                }
              : null,
          };

          return createSuccessResponse(info);
        } catch (error: unknown) {
          return createErrorResponse(error, 'getting instance info');
        }
      }
    );
  }
}
