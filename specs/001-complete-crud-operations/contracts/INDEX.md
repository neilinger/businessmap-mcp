# OpenAPI Contracts Index

Quick reference guide for BusinessMap CRUD operations OpenAPI contracts.

## Contract Files

| File | Resource | Operations | Size | Endpoints |
|------|----------|------------|------|-----------|
| [comments-api.yaml](./comments-api.yaml) | Comments | 2 | 9.3KB | PATCH, DELETE |
| [subtasks-api.yaml](./subtasks-api.yaml) | Subtasks | 2 | 12KB | PATCH, DELETE |
| [custom-fields-api.yaml](./custom-fields-api.yaml) | Custom Fields | 6 | 23KB | GET×3, POST, PATCH, DELETE |
| [workspaces-api.yaml](./workspaces-api.yaml) | Workspaces | 2 | 11KB | PATCH, DELETE |
| [boards-api.yaml](./boards-api.yaml) | Boards | 2 | 12KB | PATCH, DELETE |
| [cards-api.yaml](./cards-api.yaml) | Cards | 1 | 7.6KB | DELETE |

## Quick Links

### Documentation
- [README.md](./README.md) - Usage guide and implementation notes
- [CONTRACTS_SUMMARY.md](./CONTRACTS_SUMMARY.md) - Detailed summary and specifications

### Tools
- [validate-all.sh](./validate-all.sh) - Validate all contracts with swagger-cli

## Endpoint Reference

### Comments
- `PATCH /cards/{card_id}/comments/{comment_id}` - Update comment
- `DELETE /cards/{card_id}/comments/{comment_id}` - Delete comment

### Subtasks
- `PATCH /cards/{card_id}/subtasks/{subtask_id}` - Update subtask
- `DELETE /cards/{card_id}/subtasks/{subtask_id}` - Delete subtask

### Custom Fields
- `GET /customFields` - List all custom fields (paginated)
- `GET /boards/{board_id}/customFields` - List board custom fields
- `GET /boards/{board_id}/customFields/{field_id}` - Get custom field
- `POST /boards/{board_id}/customFields` - Create custom field
- `PATCH /boards/{board_id}/customFields/{field_id}` - Update custom field
- `DELETE /boards/{board_id}/customFields/{field_id}` - Delete custom field

### Workspaces
- `PATCH /workspaces/{workspace_id}` - Update workspace
- `DELETE /workspaces/{workspace_id}` - Delete workspace (with force option)

### Boards
- `PATCH /boards/{board_id}` - Update board
- `DELETE /boards/{board_id}` - Delete board (with force/archive options)

### Cards
- `DELETE /cards/{card_id}` - Delete card (with dependency handling)

## Usage Examples

### Validate All Contracts
```bash
./validate-all.sh
```

### Validate Single Contract
```bash
npx @apidevtools/swagger-cli validate comments-api.yaml
```

### Generate TypeScript Types
```bash
npx openapi-typescript comments-api.yaml -o types/comments.ts
```

### View in Swagger Editor
```bash
# Open https://editor.swagger.io/
# File > Import File > Select any .yaml file
```

## Features

All contracts include:
- ✓ Bearer token authentication
- ✓ Comprehensive error responses (400, 401, 403, 404, 429)
- ✓ Rate limiting with RL02 error code
- ✓ Request/response examples
- ✓ Validation rules
- ✓ Safety features for delete operations

## Statistics

- **Total Operations**: 15
- **Total Endpoints**: 15 unique paths
- **Total Size**: ~93KB
- **OpenAPI Version**: 3.0.3
- **API Version**: 1.0.0
- **Base Path**: `/api/v1`

## Status

- [x] All 15 operations documented
- [x] Request/response schemas defined
- [x] Error responses documented
- [x] Examples provided
- [x] Validation script created
- [ ] Contracts validated
- [ ] TypeScript types generated
- [ ] MCP tools implemented

---

**Last Updated**: 2025-10-24
