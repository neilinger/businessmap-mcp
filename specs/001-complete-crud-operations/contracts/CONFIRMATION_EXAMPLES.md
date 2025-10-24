# Delete Confirmation Message Examples

**Purpose**: Reference implementations for FR-021 confirmation prompts
**Used by**: ConsolidatedConfirmation service (T060)
**Date**: 2025-10-24

---

## Format Principles

1. **Warning Header**: Clear indicator of destructive action
2. **Dependency Tree**: Hierarchical display of cascading deletes
3. **Impact Summary**: Total count of affected resources
4. **Explicit Prompt**: Clear yes/no question

---

## Example 1: Single Workspace with Dependencies

**Scenario**: User deletes workspace containing 3 boards with cards

```
⚠️  Delete Confirmation Required

The following resources have dependencies and will be deleted along with all dependent resources:

Workspace "Marketing Team" (ID: 123)
  └─ 3 boards will be deleted:
     • "Q1 Campaign" (ID: 456) → 12 cards
     • "Content Calendar" (ID: 457) → 8 cards
     • "Analytics" (ID: 458) → 5 cards

Total impact: 1 workspace, 3 boards, 25 cards

Proceed with deletion? (yes/no): _
```

**Implementation Notes**:
- Board count via `listBoards(workspace_id)`
- Card counts via `listCards(board_id, {per_page: 1})` (use pagination metadata)
- Tree structure with Unicode box-drawing characters

---

## Example 2: Bulk Delete with Mixed Dependencies

**Scenario**: User deletes 5 workspaces; 2 have boards, 3 are empty (primary use case from spec.md:127)

```
⚠️  Delete Confirmation Required

The following 2 resources have dependencies and will be deleted along with all dependent resources:

Workspace "Marketing Team" (ID: 123)
  └─ 3 boards will be deleted:
     • "Q1 Campaign" (ID: 456) → 12 cards
     • "Content Calendar" (ID: 457) → 8 cards
     • "Analytics" (ID: 458) → 5 cards

Workspace "Sales Pipeline" (ID: 124)
  └─ 1 board will be deleted:
     • "Leads 2024" (ID: 459) → 23 cards

Additionally, 3 workspaces with no boards will be deleted automatically:
  • "Old Archive" (ID: 125)
  • "Test Workspace" (ID: 126)
  • "Demo Space" (ID: 127)

Total impact: 5 workspaces, 4 boards, 48 cards

Proceed with deletion? (yes/no): _
```

**Implementation Notes**:
- Dependency analysis runs once upfront (T056 DependencyAnalyzer)
- Only workspaces WITH boards shown in confirmation tree
- Empty workspaces listed separately as "automatic" (no separate confirmation needed)
- Groups resources by dependency vs. dependency-free

---

## Example 3: Card with Children

**Scenario**: User deletes parent card that has 2 child cards

```
⚠️  Delete Confirmation Required

The following resources have dependencies and will be deleted along with all dependent resources:

Card "Implement Authentication System" (ID: 789)
  ├─ 5 comments will be deleted
  ├─ 3 subtasks will be deleted
  └─ 2 child cards will have parent link removed:
     • "Setup OAuth Provider" (ID: 790) → remains as independent card
     • "Implement JWT Tokens" (ID: 791) → remains as independent card

Total impact: 1 card deleted, 5 comments, 3 subtasks, 2 parent links removed

Proceed with deletion? (yes/no): _
```

**Implementation Notes**:
- Comments/subtasks counts via `getCardComments()`, `getCardSubtasks()`
- Child cards via `getCardChildren()`
- Clarify that children remain (parent link removed, not deleted)

---

## Example 4: Simple Delete (No Confirmation)

**Scenario**: User deletes empty workspace or card without dependencies

```
✓ Workspace "Empty Project" (ID: 130) deleted successfully
```

**Implementation Notes**:
- No confirmation prompt shown
- Immediate execution per FR-021: "Simple deletions (no dependencies) execute immediately"
- Success message only

---

## Example 5: Bulk Delete All Dependency-Free

**Scenario**: User bulk deletes 5 empty workspaces (none have boards)

```
✓ Successfully deleted 5 workspaces (all had no dependencies)

Deleted workspaces:
  • "Old Archive" (ID: 125)
  • "Test Workspace" (ID: 126)
  • "Demo Space" (ID: 127)
  • "Prototype Area" (ID: 128)
  • "Sandbox" (ID: 129)
```

**Implementation Notes**:
- No confirmation prompt (all dependency-free)
- Batch execution with summary result
- Lists all deleted resources for audit trail

---

## Example 6: Partial Success in Bulk Operation

**Scenario**: Bulk delete where some operations succeed, some fail

```
⚠️  Bulk Delete Partial Success

Successfully deleted (3/5 workspaces):
  ✓ "Old Archive" (ID: 125)
  ✓ "Test Workspace" (ID: 126)
  ✓ "Demo Space" (ID: 127)

Failed to delete (2/5 workspaces):
  ✗ "Marketing Team" (ID: 123) - Insufficient permissions. Check user access rights.
  ✗ "Sales Pipeline" (ID: 124) - Resource not found. Verify resource exists.

Summary: 3 successful, 2 failed. Successful operations are committed.
```

**Implementation Notes**:
- Per FR-020: "partial success scenarios return detailed per-resource status report"
- Clear success/failure indicators (✓/✗)
- Includes specific error messages per FR-016
- Clarifies committed vs. rolled-back state

---

## Technical Implementation (T060)

### ConsolidatedConfirmation Service Structure

```typescript
interface ConfirmationMessage {
  hasConfirmation: boolean;  // false for simple deletes
  message?: string;           // formatted confirmation text
  resourcesWithDeps: ResourceDependency[];
  resourcesWithoutDeps: ResourceSummary[];
  totalImpact: ImpactSummary;
}

interface ResourceDependency {
  id: number;
  type: 'workspace' | 'board' | 'card';
  name: string;
  dependents: Dependent[];
}

interface ImpactSummary {
  workspaces: number;
  boards: number;
  cards: number;
  comments?: number;
  subtasks?: number;
}
```

### Message Building Logic

1. Analyze dependencies (via DependencyAnalyzer - T056)
2. Group resources by: has_dependencies vs. dependency-free
3. Format tree structure for resources with dependencies
4. List dependency-free resources separately
5. Calculate total impact
6. Return structured confirmation or null (simple delete)

---

## References

- **FR-020**: Bulk operations specification (spec.md:152)
- **FR-021**: Cascade delete confirmation rules (spec.md:153)
- **T056**: DependencyAnalyzer implementation
- **T060**: ConsolidatedConfirmation service implementation
- **data-model.md**: Cascade delete dependency chains

---

**Version**: 1.0.0 | **Last Updated**: 2025-10-24
