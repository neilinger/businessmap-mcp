import { BusinessMapClient } from '../client/businessmap-client.js';
import { Board } from '../types/board.js';
import { ChildCardItem } from '../types/card.js';

/**
 * Base properties shared by all resource dependency types
 */
interface BaseResourceDependency {
  id: number;
  name: string;
  hasDependencies: boolean;
  dependents: Dependent[];
}

/**
 * Workspace dependency - may contain board dependents
 */
interface WorkspaceDependency extends BaseResourceDependency {
  type: 'workspace';
}

/**
 * Board dependency - may contain card dependents
 */
interface BoardDependency extends BaseResourceDependency {
  type: 'board';
}

/**
 * Card dependency - may contain child_card, comment, subtask dependents
 */
interface CardDependency extends BaseResourceDependency {
  type: 'card';
}

/**
 * Discriminated union for resource dependencies.
 * Enables exhaustive type narrowing via switch statements:
 *
 * @example
 * ```typescript
 * function formatResource(dep: ResourceDependency) {
 *   switch (dep.type) {
 *     case 'workspace':
 *       return `Workspace: ${dep.name}`; // TypeScript knows this is WorkspaceDependency
 *     case 'board':
 *       return `Board: ${dep.name}`;     // TypeScript knows this is BoardDependency
 *     case 'card':
 *       return `Card: ${dep.name}`;      // TypeScript knows this is CardDependency
 *   }
 * }
 * ```
 */
export type ResourceDependency = WorkspaceDependency | BoardDependency | CardDependency;

/**
 * Base properties shared by all dependent types
 */
interface BaseDependentFields {
  id?: number;
  name?: string;
  count: number;
}

/**
 * Item details for dependents that list individual items
 */
interface DependentItem {
  id: number;
  name: string;
  additionalInfo?: string;
}

/**
 * Board dependent - includes item list with board details
 */
interface BoardDependent extends BaseDependentFields {
  type: 'board';
  items?: DependentItem[];
}

/**
 * Card dependent - count only, no item details
 */
interface CardDependent extends BaseDependentFields {
  type: 'card';
}

/**
 * Comment dependent - count only
 */
interface CommentDependent extends BaseDependentFields {
  type: 'comment';
}

/**
 * Subtask dependent - count only
 */
interface SubtaskDependent extends BaseDependentFields {
  type: 'subtask';
}

/**
 * Child card dependent - includes item list with card details
 */
interface ChildCardDependent extends BaseDependentFields {
  type: 'child_card';
  items?: DependentItem[];
}

/**
 * Discriminated union for dependent resources.
 * Enables type narrowing based on the `type` discriminant.
 *
 * @example
 * ```typescript
 * function formatDependent(dep: Dependent) {
 *   switch (dep.type) {
 *     case 'board':
 *       return dep.items?.map(i => i.name); // TypeScript knows items exists
 *     case 'child_card':
 *       return dep.items?.map(i => i.additionalInfo);
 *     default:
 *       return `${dep.count} ${dep.type}(s)`;
 *   }
 * }
 * ```
 */
export type Dependent =
  | BoardDependent
  | CardDependent
  | CommentDependent
  | SubtaskDependent
  | ChildCardDependent;

/**
 * Aggregated dependency analysis for bulk operations
 */
export interface BulkDependencyAnalysis {
  resourcesWithDeps: ResourceDependency[];
  resourcesWithoutDeps: ResourceDependency[];
  totalImpact: ImpactSummary;
  /**
   * Pre-extracted resource names from list API responses (best-effort optimization).
   * Maps resource ID to name. Used to avoid read-after-delete API calls.
   * May contain undefined values if name extraction failed.
   */
  nameMap: Map<number, string | undefined>;
}

/**
 * Summary of total impact across all resources
 */
export interface ImpactSummary {
  workspaces: number;
  boards: number;
  cards: number;
  comments?: number;
  subtasks?: number;
  childCards?: number;
}

/**
 * DependencyAnalyzer service (T056)
 *
 * Per data-model.md "Cascade Delete Dependencies" section:
 * - Workspace → Boards (check board count via listBoards)
 * - Card → Children (check child cards via getCardChildren)
 *
 * API-Handled cascades (no MCP analysis needed):
 * - Board → Cards (API handles cascade)
 * - Board → Lanes/Columns (API handles cascade)
 * - Card → Comments/Subtasks/Outcomes (API handles cascade)
 */
export class DependencyAnalyzer {
  constructor(private client: BusinessMapClient) {}

  /**
   * Analyze dependencies for multiple workspaces
   */
  async analyzeWorkspaces(workspaceIds: number[]): Promise<BulkDependencyAnalysis> {
    const results = await Promise.all(workspaceIds.map((id) => this.analyzeWorkspace(id)));

    // Extract names from analysis results for post-delete display
    const nameMap = new Map<number, string | undefined>();
    results.forEach((result) => {
      nameMap.set(result.id, result.name);
    });

    return this.aggregateResults(results, nameMap);
  }

  /**
   * Analyze dependencies for a single workspace
   */
  async analyzeWorkspace(workspaceId: number): Promise<ResourceDependency> {
    try {
      // Get workspace details
      const workspace = await this.client.getWorkspace(workspaceId);

      // Get boards in workspace
      const boards = await this.client.getBoards({ workspace_id: workspaceId });

      const hasDependencies = boards.length > 0;
      const dependents: Dependent[] = [];

      if (hasDependencies) {
        // Get card counts for each board
        const boardDetails = await Promise.all(
          boards.map(async (board: Board) => {
            const cards = await this.client.getCards(board.board_id!, { per_page: 1 });
            return {
              id: board.board_id!,
              name: board.name,
              additionalInfo: `${cards.length || 0} cards`,
            };
          })
        );

        dependents.push({
          type: 'board',
          count: boards.length,
          items: boardDetails,
        });
      }

      return {
        id: workspaceId,
        type: 'workspace',
        name: workspace.name,
        hasDependencies,
        dependents,
      };
    } catch (error: unknown) {
      // If workspace doesn't exist, return minimal info
      return {
        id: workspaceId,
        type: 'workspace',
        name: `Workspace ${workspaceId}`,
        hasDependencies: false,
        dependents: [],
      };
    }
  }

  /**
   * Analyze dependencies for multiple boards
   */
  async analyzeBoards(boardIds: number[]): Promise<BulkDependencyAnalysis> {
    const results = await Promise.all(boardIds.map((id) => this.analyzeBoard(id)));

    // Extract names from analysis results for post-delete display
    const nameMap = new Map<number, string | undefined>();
    results.forEach((result) => {
      nameMap.set(result.id, result.name);
    });

    return this.aggregateResults(results, nameMap);
  }

  /**
   * Analyze dependencies for a single board
   * Note: API handles cascade for board→cards, we just report it
   */
  async analyzeBoard(boardId: number): Promise<ResourceDependency> {
    try {
      // Get board details
      const board = await this.client.getBoard(boardId);

      // Get cards in board
      const cards = await this.client.getCards(boardId, { per_page: 1 });
      const cardCount = cards.length || 0;

      const hasDependencies = cardCount > 0;
      const dependents: Dependent[] = [];

      if (hasDependencies) {
        dependents.push({
          type: 'card',
          count: cardCount,
        });
      }

      return {
        id: boardId,
        type: 'board',
        name: board.name,
        hasDependencies,
        dependents,
      };
    } catch (error: unknown) {
      return {
        id: boardId,
        type: 'board',
        name: `Board ${boardId}`,
        hasDependencies: false,
        dependents: [],
      };
    }
  }

  /**
   * Analyze dependencies for multiple cards
   */
  async analyzeCards(cardIds: number[]): Promise<BulkDependencyAnalysis> {
    const results = await Promise.all(cardIds.map((id) => this.analyzeCard(id)));

    // Extract names from analysis results for post-delete display
    const nameMap = new Map<number, string | undefined>();
    results.forEach((result) => {
      nameMap.set(result.id, result.name);
    });

    return this.aggregateResults(results, nameMap);
  }

  /**
   * Analyze dependencies for a single card
   */
  async analyzeCard(cardId: number): Promise<ResourceDependency> {
    try {
      // Get card details
      const card = await this.client.getCard(cardId);

      // Get child cards
      const children = await this.client.getCardChildren(cardId);

      // Get comments and subtasks for impact summary
      const comments = await this.client.getCardComments(cardId);
      const subtasks = await this.client.getCardSubtasks(cardId);

      const hasDependencies = children.length > 0 || comments.length > 0 || subtasks.length > 0;
      const dependents: Dependent[] = [];

      if (comments.length > 0) {
        dependents.push({
          type: 'comment',
          count: comments.length,
        });
      }

      if (subtasks.length > 0) {
        dependents.push({
          type: 'subtask',
          count: subtasks.length,
        });
      }

      if (children.length > 0) {
        const childDetails = children.map((child: ChildCardItem) => ({
          id: child.card_id,
          name: `Card ${child.card_id}`,
          additionalInfo: 'remains as independent card',
        }));

        dependents.push({
          type: 'child_card',
          count: children.length,
          items: childDetails,
        });
      }

      return {
        id: cardId,
        type: 'card',
        name: card.title,
        hasDependencies,
        dependents,
      };
    } catch (error: unknown) {
      return {
        id: cardId,
        type: 'card',
        name: `Card ${cardId}`,
        hasDependencies: false,
        dependents: [],
      };
    }
  }

  /**
   * Aggregate multiple resource dependencies into bulk analysis
   */
  private aggregateResults(
    results: ResourceDependency[],
    nameMap: Map<number, string | undefined>
  ): BulkDependencyAnalysis {
    const resourcesWithDeps = results.filter((r) => r.hasDependencies);
    const resourcesWithoutDeps = results.filter((r) => !r.hasDependencies);

    // Calculate total impact
    const impact: ImpactSummary = {
      workspaces: 0,
      boards: 0,
      cards: 0,
      comments: 0,
      subtasks: 0,
      childCards: 0,
    };

    results.forEach((resource) => {
      if (resource.type === 'workspace') impact.workspaces++;
      if (resource.type === 'board') impact.boards++;
      if (resource.type === 'card') impact.cards++;

      resource.dependents.forEach((dep) => {
        if (dep.type === 'board') impact.boards += dep.count;
        if (dep.type === 'card') impact.cards += dep.count;
        if (dep.type === 'comment') impact.comments = (impact.comments || 0) + dep.count;
        if (dep.type === 'subtask') impact.subtasks = (impact.subtasks || 0) + dep.count;
        if (dep.type === 'child_card') impact.childCards = (impact.childCards || 0) + dep.count;
      });
    });

    return {
      resourcesWithDeps,
      resourcesWithoutDeps,
      totalImpact: impact,
      nameMap,
    };
  }
}
