# Schema Contracts: Token Optimization

**Feature**: 003-schema-compression-lazy-loading

## Purpose

This directory contains before/after schema contracts for the top 3 tools undergoing compression in Phase 1.

## Contracts

- `create-card-schema.md` - create_card tool (3,600 → 2,200 tokens, 39% reduction)
- `update-card-schema.md` - update_card tool (2,700 → 1,600 tokens, 41% reduction)
- `list-cards-schema.md` - list_cards tool (2,900 → 1,800 tokens, 38% reduction)

## Validation

All compressed schemas MUST:
1. **Preserve functionality**: 100% of original parameters accessible
2. **Pass Zod validation**: All schemas validate correctly
3. **Maintain type safety**: No loss of type information
4. **Achieve targets**: Meet or exceed token reduction goals
5. **Test coverage**: ≥95% coverage for schema changes

## Breaking Changes

**Format**: All schemas change from flat structure to grouped/nested structure

**Migration**: Clients must update to new parameter format (immediate breaking change, no legacy support)

**Example**:
```typescript
// BEFORE (flat)
{ lane_id: 1, position: 2 }

// AFTER (grouped)
{ placement: { lane_id: 1, position: 2 } }
```
