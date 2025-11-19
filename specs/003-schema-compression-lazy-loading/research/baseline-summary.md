# Baseline Token Measurements Summary

**Generated**: 2025-11-19  
**Task**: T004 - Baseline Measurement Script  
**Phase**: Token Optimization Phase 2

## Summary Statistics

| Metric | Value |
|--------|-------|
| Total Tools | 58 |
| Total Tokens | 36,722 |
| Average per Tool | 633 |
| Baseline vs Estimated | 94.4% (estimated 38,900) |

## Tool Distribution by Category

| Category | Count | Example Tools |
|----------|-------|---------------|
| Workspace | 7 | list_workspaces, create_workspace, update_workspace |
| Board | 12 | list_boards, create_board, get_columns, get_lanes |
| Card | 26 | list_cards, create_card, update_card, get_card_* |
| Custom Field | 6 | list_custom_fields, create_custom_field, list_board_custom_fields |
| User | 3 | get_current_user, get_user, list_users |
| Workflow | 2 | get_workflow_cycle_time_columns, get_workflow_effective_cycle_time_columns |
| Utility | 2 | get_api_info, health_check |

## Top 10 Tools by Token Count

| Rank | Tool | Tokens | % of Total |
|------|------|--------|------------|
| 1 | create_card | 8,127 | 22.1% |
| 2 | list_cards | 6,124 | 16.7% |
| 3 | update_card | 1,716 | 4.7% |
| 4 | list_boards | 1,195 | 3.3% |
| 5 | create_card_subtask | 928 | 2.5% |
| 6 | create_lane | 863 | 2.4% |
| 7 | create_custom_field | 754 | 2.1% |
| 8 | create_board | 730 | 2.0% |
| 9 | update_custom_field | 712 | 1.9% |
| 10 | search_board | 620 | 1.7% |

**Top 10 Total**: 21,769 tokens (59.3% of total)

## Key Findings

### 1. High Token Concentration
- Top 3 tools (create_card, list_cards, update_card) account for 43.5% of total tokens
- Top 10 tools account for 59.3% of total tokens
- Optimization of these tools will have the highest impact

### 2. Actual vs Estimated Token Counts

**Spec Estimates vs Actual**:
- `create_card`: Estimated 3,600 → **Actual 8,127** (+125% difference)
- `list_cards`: Estimated 2,900 → **Actual 6,124** (+111% difference)
- `update_card`: Estimated 2,700 → **Actual 1,716** (-36% difference)

The actual create_card and list_cards schemas are significantly larger than estimated,
suggesting even greater potential for optimization through schema compression.

### 3. Tool Count Discrepancy
- Expected: 65 tools (from spec)
- Actual: 58 tools
- Difference: 7 tools

This suggests either:
- Some tools are conditionally registered (e.g., read-only mode)
- Spec estimate included planned tools not yet implemented
- Instance-specific tools may not be registered in single-client mode

## Optimization Targets (Phase 2)

Based on these measurements, prioritize:

1. **create_card** (8,127 tokens) - Target: ≤2,200 tokens (73% reduction)
2. **list_cards** (6,124 tokens) - Target: ≤1,800 tokens (71% reduction)
3. **update_card** (1,716 tokens) - Target: ≤1,600 tokens (7% reduction)

**Expected Savings**: 10,467 tokens (28.5% of baseline)

## Next Steps

1. ✅ T004: Baseline measurement script created
2. ✅ T005: Baseline measurements generated
3. ⏭️ T006: Validate baseline matches expected ~38,900 tokens
   - **Status**: Within 6% of estimate (36,722 vs 38,900)
   - **Action**: Investigate 7 missing tools or adjust expectations
4. ⏭️ T007+: Proceed with Phase 2 (Shared Schema Definitions)

## Files Generated

- `baseline-measurements.json` - Full tool-by-tool measurements
- `baseline-summary.md` - This summary document

## Script Usage

```bash
# Run baseline measurement
npm run measure:baseline

# Output location
specs/003-schema-compression-lazy-loading/research/baseline-measurements.json
```

---

**Note**: Measurements use tiktoken cl100k_base encoding (GPT-4) for accurate token counting.
