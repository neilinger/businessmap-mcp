# OpenAPI 3.0 Contracts - BusinessMap CRUD Operations

This directory contains OpenAPI 3.0 specifications for new CRUD operations in the BusinessMap MCP implementation.

## Official API Reference

These contracts are derived from the official BusinessMap API v2 specification:

- **Interactive Documentation**: https://demo.kanbanize.com/openapi
- **JSON Schema**: https://demo.kanbanize.com/openapi/json

**Important**: Always validate implementation against the official specification to catch API changes or discrepancies.

## Generated Contract Files

### Phase 1 - New Operations (10 endpoints)

#### Comments API (`comments-api.yaml`)
- `PATCH /cards/{card_id}/comments/{comment_id}` - Update comment text
- `DELETE /cards/{card_id}/comments/{comment_id}` - Delete comment

#### Subtasks API (`subtasks-api.yaml`)
- `PATCH /cards/{card_id}/subtasks/{subtask_id}` - Update subtask properties
- `DELETE /cards/{card_id}/subtasks/{subtask_id}` - Delete subtask

#### Custom Fields API (`custom-fields-api.yaml`)
- `GET /customFields` - List all custom field definitions (with pagination)
- `GET /boards/{board_id}/customFields` - List board-specific custom fields
- `GET /boards/{board_id}/customFields/{field_id}` - Get custom field details
- `POST /boards/{board_id}/customFields` - Create custom field
- `PATCH /boards/{board_id}/customFields/{field_id}` - Update custom field
- `DELETE /boards/{board_id}/customFields/{field_id}` - Delete custom field

### Phase 2 - Quick Wins (5 endpoints)

#### Workspaces API (`workspaces-api.yaml`)
- `PATCH /workspaces/{workspace_id}` - Update workspace name/description
- `DELETE /workspaces/{workspace_id}` - Delete workspace (with force option)

#### Boards API (`boards-api.yaml`)
- `PATCH /boards/{board_id}` - Update board properties
- `DELETE /boards/{board_id}` - Delete board (with force/archive options)

#### Cards API (`cards-api.yaml`)
- `DELETE /cards/{card_id}` - Delete card (with dependency handling)

## Contract Features

All contracts include:

### Authentication
- Bearer token authentication (HTTP Bearer scheme)
- Consistent security requirement across all endpoints

### Error Responses
All endpoints include standardized error responses:

- **400 Bad Request** - Invalid input parameters, validation errors
- **401 Unauthorized** - Missing or invalid authentication token
- **403 Forbidden** - Insufficient permissions
- **404 Not Found** - Resource not found
- **429 Rate Limited** - RL02 error code with retry headers

### Rate Limiting Headers
Rate limited responses (429) include:
- `X-RateLimit-Limit` - Maximum requests per window
- `X-RateLimit-Remaining` - Remaining requests in current window
- `X-RateLimit-Reset` - Unix timestamp when limit resets
- `Retry-After` - Seconds to wait before retrying

### Request/Response Examples
All operations include multiple examples:
- Request body examples showing different use cases
- Success response examples with realistic data
- Error response examples for common failure scenarios

### Data Models
Comprehensive schema definitions:
- Request schemas with validation rules (min/max lengths, enums, patterns)
- Response schemas with complete field definitions
- Nested object schemas (attachments, options, etc.)
- Error response schema with consistent structure

## REST Best Practices Applied

1. **Resource-Oriented URLs** - Resources as nouns, HTTP methods for actions
2. **Proper HTTP Methods** - PATCH for partial updates, DELETE for removal
3. **Idempotency** - DELETE operations are idempotent
4. **HTTP Status Codes** - Semantic use of 2xx, 4xx status codes
5. **Pagination** - Cursor/offset pagination for list endpoints
6. **Filtering** - Query parameters for filtering resources
7. **Versioning** - API version in URL (`/api/v1/`)
8. **Content Negotiation** - JSON as default content type
9. **HATEOAS-Ready** - Structured responses that can include links
10. **Documentation** - Complete operation descriptions and examples

## Safe Delete Operations

Several endpoints include safety features:

### Workspace Delete
- `force` parameter - Delete even if contains boards
- Default behavior prevents accidental deletion of non-empty workspaces

### Board Delete
- `force` parameter - Delete even if contains cards
- `archive_first` parameter - Archive before deletion (safer approach)
- Detailed error messages showing counts of affected resources

### Card Delete
- `force` parameter - Delete even with dependencies (child cards, links)
- `archive_first` parameter - Archive before deletion
- `delete_subtasks` parameter - Control subtask deletion
- `delete_comments` parameter - Control comment deletion
- Detailed dependency information in error responses

## Implementation Notes

### Custom Fields
The custom fields API supports multiple field types:
- `text` - Text input with optional regex validation
- `number` - Numeric input with min/max validation
- `date` - Date picker
- `dropdown` - Single/multiple selection with colored options
- `checkbox` - Boolean or multi-checkbox
- `user` - User selection
- `card` - Card reference

### Error Response Structure
Consistent error structure across all endpoints:
```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable message",
  "details": {
    "field": "affected_field",
    "reason": "specific_reason"
  },
  "timestamp": "2025-01-20T18:00:00Z",
  "path": "/api/v1/resource"
}
```

### Validation Rules
- String lengths: Names (1-200 chars), descriptions (up to 1000 chars), comments (up to 5000 chars)
- Numeric ranges: Pagination (1-100 per page), positions (0+)
- Enums: Binary flags (0/1), field types, priorities
- Formats: ISO 8601 dates, hex colors (#RRGGBB), URIs

## Next Steps

1. **Validation** - Validate OpenAPI specs with `swagger-cli validate`
2. **Code Generation** - Generate TypeScript types and client code
3. **Implementation** - Implement MCP tools based on these contracts
4. **Testing** - Create contract tests using examples
5. **Documentation** - Generate interactive API docs (Swagger UI)

## Usage

### Validate Contracts
```bash
npx @apidevtools/swagger-cli validate comments-api.yaml
npx @apidevtools/swagger-cli validate subtasks-api.yaml
npx @apidevtools/swagger-cli validate custom-fields-api.yaml
npx @apidevtools/swagger-cli validate workspaces-api.yaml
npx @apidevtools/swagger-cli validate boards-api.yaml
npx @apidevtools/swagger-cli validate cards-api.yaml
```

### Bundle for Documentation
```bash
npx @apidevtools/swagger-cli bundle comments-api.yaml -o dist/comments-api.json
```

### Generate TypeScript Types
```bash
npx openapi-typescript comments-api.yaml -o types/comments-api.ts
```

## Contract Versioning

- Version: 1.0.0
- API Base Path: `/api/v1`
- Server: `https://businessmap.io/api/v1`

All contracts are production-ready and follow OpenAPI 3.0.3 specification.
