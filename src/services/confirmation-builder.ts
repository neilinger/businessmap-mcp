import {
  BulkDependencyAnalysis,
  Dependent,
  ImpactSummary,
  ResourceDependency,
} from './dependency-analyzer.js';

/**
 * Confirmation message structure
 */
export interface ConfirmationMessage {
  hasConfirmation: boolean; // false for simple deletes
  message?: string; // formatted confirmation text
  resourcesWithDeps: ResourceDependency[];
  resourcesWithoutDeps: ResourceDependency[];
  totalImpact: ImpactSummary;
}

/**
 * ConsolidatedConfirmation service (T060)
 *
 * Formats dependency trees per contracts/CONFIRMATION_EXAMPLES.md
 * - Groups resources by has_dependencies vs dependency-free
 * - Formats hierarchical display with impact summary
 */
export class ConfirmationBuilder {
  /**
   * Build confirmation message from dependency analysis
   * Returns null for simple deletes (no dependencies)
   */
  buildConfirmation(analysis: BulkDependencyAnalysis): ConfirmationMessage | null {
    // If no resources have dependencies, return simple confirmation
    if (analysis.resourcesWithDeps.length === 0) {
      return null; // Caller will execute immediately without confirmation
    }

    const message = this.formatConfirmationMessage(analysis);

    return {
      hasConfirmation: true,
      message,
      resourcesWithDeps: analysis.resourcesWithDeps,
      resourcesWithoutDeps: analysis.resourcesWithoutDeps,
      totalImpact: analysis.totalImpact,
    };
  }

  /**
   * Format the complete confirmation message
   */
  private formatConfirmationMessage(analysis: BulkDependencyAnalysis): string {
    const parts: string[] = [];

    // Header
    parts.push('⚠️  Delete Confirmation Required\n');

    // Resources with dependencies
    const withDepsCount = analysis.resourcesWithDeps.length;
    if (withDepsCount > 0) {
      parts.push(
        `The following ${withDepsCount} resource${withDepsCount > 1 ? 's have' : ' has'} dependencies and will be deleted along with all dependent resources:\n`
      );

      analysis.resourcesWithDeps.forEach((resource) => {
        parts.push(this.formatResourceTree(resource));
      });
    }

    // Resources without dependencies
    const withoutDepsCount = analysis.resourcesWithoutDeps.length;
    if (withoutDepsCount > 0) {
      const resourceType =
        analysis.resourcesWithDeps[0]?.type || analysis.resourcesWithoutDeps[0]?.type || 'resource';
      const dependencyType = resourceType === 'workspace' ? 'boards' : 'dependencies';
      parts.push(
        `\nAdditionally, ${withoutDepsCount} ${resourceType}${withoutDepsCount > 1 ? 's' : ''} with no ${dependencyType} will be deleted automatically:`
      );

      analysis.resourcesWithoutDeps.forEach((resource) => {
        parts.push(`  • "${resource.name}" (ID: ${resource.id})`);
      });
      parts.push('');
    }

    // Total impact summary
    parts.push('\n' + this.formatImpactSummary(analysis.totalImpact));

    // Confirmation prompt
    parts.push('\nProceed with deletion? (yes/no): ');

    return parts.join('\n');
  }

  /**
   * Format a single resource dependency tree
   */
  private formatResourceTree(resource: ResourceDependency): string {
    const parts: string[] = [];

    // Resource header
    const resourceType = resource.type.charAt(0).toUpperCase() + resource.type.slice(1);
    parts.push(`\n${resourceType} "${resource.name}" (ID: ${resource.id})`);

    // Dependents
    if (resource.dependents.length > 0) {
      resource.dependents.forEach((dep, index) => {
        const isLast = index === resource.dependents.length - 1;
        const connector = isLast ? '└─' : '├─';

        parts.push(this.formatDependent(dep, connector));
      });
    }

    return parts.join('\n');
  }

  /**
   * Format a single dependent
   */
  private formatDependent(dep: Dependent, connector: string): string {
    const parts: string[] = [];

    if (dep.type === 'board' && dep.items) {
      parts.push(`  ${connector} ${dep.count} board${dep.count > 1 ? 's' : ''} will be deleted:`);
      dep.items.forEach((item) => {
        parts.push(`     • "${item.name}" (ID: ${item.id}) → ${item.additionalInfo || ''}`);
      });
    } else if (dep.type === 'card') {
      parts.push(`  ${connector} ${dep.count} card${dep.count > 1 ? 's' : ''} will be deleted`);
    } else if (dep.type === 'comment') {
      parts.push(`  ${connector} ${dep.count} comment${dep.count > 1 ? 's' : ''} will be deleted`);
    } else if (dep.type === 'subtask') {
      parts.push(`  ${connector} ${dep.count} subtask${dep.count > 1 ? 's' : ''} will be deleted`);
    } else if (dep.type === 'child_card' && dep.items) {
      parts.push(
        `  ${connector} ${dep.count} child card${dep.count > 1 ? 's' : ''} will have parent link removed:`
      );
      dep.items.forEach((item) => {
        parts.push(
          `     • "${item.name}" (ID: ${item.id}) → ${item.additionalInfo || 'remains as independent card'}`
        );
      });
    }

    return parts.join('\n');
  }

  /**
   * Format total impact summary
   */
  private formatImpactSummary(impact: ImpactSummary): string {
    const parts: string[] = ['Total impact:'];

    if (impact.workspaces > 0) {
      parts.push(`${impact.workspaces} workspace${impact.workspaces > 1 ? 's' : ''}`);
    }
    if (impact.boards > 0) {
      parts.push(`${impact.boards} board${impact.boards > 1 ? 's' : ''}`);
    }
    if (impact.cards > 0) {
      parts.push(`${impact.cards} card${impact.cards > 1 ? 's' : ''}`);
    }
    if (impact.comments && impact.comments > 0) {
      parts.push(`${impact.comments} comment${impact.comments > 1 ? 's' : ''}`);
    }
    if (impact.subtasks && impact.subtasks > 0) {
      parts.push(`${impact.subtasks} subtask${impact.subtasks > 1 ? 's' : ''}`);
    }
    if (impact.childCards && impact.childCards > 0) {
      parts.push(`${impact.childCards} parent link${impact.childCards > 1 ? 's' : ''} removed`);
    }

    return parts.join(', ');
  }

  /**
   * Format success message for simple deletes (no confirmation needed)
   * Uses nameMap for efficient name lookup (avoids read-after-delete)
   */
  formatSimpleSuccess(
    resourceType: string,
    count: number,
    resources: Array<{ id: number; name?: string }>
  ): string {
    if (count === 1 && resources[0]) {
      const displayName = resources[0].name || `Resource ID: ${resources[0].id}`;
      return `✓ ${resourceType.charAt(0).toUpperCase() + resourceType.slice(1)} "${displayName}" (ID: ${resources[0].id}) deleted successfully`;
    }

    const parts: string[] = [];
    parts.push(
      `✓ Successfully deleted ${count} ${resourceType}${count > 1 ? 's' : ''} (all had no dependencies)\n`
    );
    parts.push(`Deleted ${resourceType}s:`);
    resources.forEach((r) => {
      const displayName = r.name || `Resource ID: ${r.id}`;
      parts.push(`  • "${displayName}" (ID: ${r.id})`);
    });

    return parts.join('\n');
  }

  /**
   * Format partial success message for bulk operations
   */
  formatPartialSuccess(
    resourceType: string,
    successes: Array<{ id: number; name: string }>,
    failures: Array<{ id: number; name: string; error: string }>
  ): string {
    const total = successes.length + failures.length;
    const parts: string[] = [];

    parts.push('⚠️  Bulk Delete Partial Success\n');

    if (successes.length > 0) {
      parts.push(`Successfully deleted (${successes.length}/${total} ${resourceType}s):`);
      successes.forEach((s) => {
        parts.push(`  ✓ "${s.name}" (ID: ${s.id})`);
      });
      parts.push('');
    }

    if (failures.length > 0) {
      parts.push(`Failed to delete (${failures.length}/${total} ${resourceType}s):`);
      failures.forEach((f) => {
        parts.push(`  ✗ "${f.name}" (ID: ${f.id}) - ${f.error}`);
      });
      parts.push('');
    }

    parts.push(
      `Summary: ${successes.length} successful, ${failures.length} failed. Successful operations are committed.`
    );

    return parts.join('\n');
  }
}
