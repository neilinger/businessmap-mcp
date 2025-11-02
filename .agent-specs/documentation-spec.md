# Documentation Update Specification

## Objective
Update README.md, create MIGRATION_GUIDE.md, update CHANGELOG.md, and bump version to 1.7.0

## File 1: README.md Updates

### Location to Insert Multi-Instance Section
After the existing "Configuration" section (around line 100), add a new section.

### New Section: Multi-Instance Configuration

#### Structure:
```markdown
## Multi-Instance Configuration

The BusinessMap MCP server supports managing multiple BusinessMap instances simultaneously. This is useful for:
- Managing production, staging, and development environments
- Connecting to multiple regional instances
- Supporting multi-tenant scenarios
- Isolating different teams or projects

### Configuration File

Create a configuration file (`.businessmap-instances.json`) with your instance definitions:

```json
{
  "version": "1.0",
  "default_instance": "production",
  "instances": {
    "production": {
      "name": "Production",
      "description": "Production environment",
      "api_url": "https://your-prod.kanbanize.com/api/v2",
      "api_token_env": "BUSINESSMAP_API_TOKEN_PROD",
      "read_only_mode": false,
      "tags": ["prod", "primary"]
    },
    "staging": {
      "name": "Staging",
      "api_url": "https://your-staging.kanbanize.com/api/v2",
      "api_token_env": "BUSINESSMAP_API_TOKEN_STAGING",
      "read_only_mode": false,
      "tags": ["staging", "qa"]
    }
  }
}
```

### Environment Setup

1. Set the config file path:
```bash
export BUSINESSMAP_CONFIG_FILE="/path/to/.businessmap-instances.json"
```

2. Set instance-specific API tokens:
```bash
export BUSINESSMAP_API_TOKEN_PROD="ace_your_prod_token"
export BUSINESSMAP_API_TOKEN_STAGING="ace_your_staging_token"
```

### Usage in Claude Desktop

```json
{
  "mcpServers": {
    "Businessmap": {
      "command": "npx",
      "args": ["-y", "@neilinger/businessmap-mcp"],
      "env": {
        "BUSINESSMAP_CONFIG_FILE": "/Users/you/.config/businessmap-mcp/instances.json",
        "BUSINESSMAP_API_TOKEN_PROD": "ace_your_prod_token",
        "BUSINESSMAP_API_TOKEN_STAGING": "ace_your_staging_token"
      }
    }
  }
}
```

### Tool Usage

All 43 tools accept an optional `instance` parameter:

```javascript
// Use default instance
await list_workspaces();

// Use specific instance
await list_workspaces({ instance: "staging" });
await create_card({
  instance: "production",
  title: "New Task",
  column_id: 123
});
```

### Instance Discovery

Use the instance discovery tools to see available instances:

```javascript
// List all configured instances
await list_instances();

// Get details for specific instance
await get_instance_info({ instance: "production" });
```

### Backward Compatibility

The multi-instance feature is 100% backward compatible. Existing single-instance configurations continue to work without any changes:

```json
{
  "env": {
    "BUSINESSMAP_API_TOKEN": "your_token",
    "BUSINESSMAP_API_URL": "https://your-account.kanbanize.com/api/v2"
  }
}
```

See [MIGRATION_GUIDE.md](./docs/MIGRATION_GUIDE.md) for detailed migration instructions.
```

### Update Features Section
Add to the features list (around line 15):
- Multi-instance configuration support - manage multiple BusinessMap instances simultaneously

## File 2: docs/MIGRATION_GUIDE.md (NEW FILE)

### Complete Migration Guide Content:

```markdown
# Migration Guide: Multi-Instance Configuration

This guide helps you migrate from single-instance to multi-instance configuration.

## Overview

The multi-instance feature allows you to:
- Connect to multiple BusinessMap instances (prod, staging, dev)
- Switch between instances without reconfiguration
- Maintain separate rate limits and error isolation per instance
- Use explicit instance selection in tool calls

## Prerequisites

- BusinessMap MCP Server v1.7.0 or later
- Existing single-instance configuration working

## Migration Steps

### Step 1: Understand Your Current Setup

**Current (Single Instance)**:
```bash
# Environment variables
BUSINESSMAP_API_TOKEN=ace_your_token
BUSINESSMAP_API_URL=https://your-account.kanbanize.com/api/v2
BUSINESSMAP_READ_ONLY_MODE=false
BUSINESSMAP_DEFAULT_WORKSPACE_ID=123
```

**Tool usage**:
```javascript
await list_workspaces(); // Uses single configured instance
```

### Step 2: Create Configuration File

Create `.businessmap-instances.json`:

```json
{
  "version": "1.0",
  "default_instance": "production",
  "instances": {
    "production": {
      "name": "Production",
      "api_url": "https://your-account.kanbanize.com/api/v2",
      "api_token_env": "BUSINESSMAP_API_TOKEN_PROD",
      "read_only_mode": false,
      "default_workspace_id": 123
    }
  }
}
```

**Recommended locations**:
- `~/.config/businessmap-mcp/instances.json` (Linux/Mac)
- `%APPDATA%/businessmap-mcp/instances.json` (Windows)
- Project-specific: `./.businessmap-instances.json`

### Step 3: Update Environment Variables

**Add config file path**:
```bash
export BUSINESSMAP_CONFIG_FILE="$HOME/.config/businessmap-mcp/instances.json"
```

**Rename token variable** (matching config):
```bash
export BUSINESSMAP_API_TOKEN_PROD="ace_your_token"
```

**Remove old variables** (optional, but recommended):
```bash
unset BUSINESSMAP_API_TOKEN
unset BUSINESSMAP_API_URL
unset BUSINESSMAP_READ_ONLY_MODE
unset BUSINESSMAP_DEFAULT_WORKSPACE_ID
```

### Step 4: Update MCP Server Configuration

#### Claude Desktop (`claude_desktop_config.json`):

**Before**:
```json
{
  "mcpServers": {
    "Businessmap": {
      "command": "npx",
      "args": ["-y", "@neilinger/businessmap-mcp"],
      "env": {
        "BUSINESSMAP_API_TOKEN": "ace_your_token",
        "BUSINESSMAP_API_URL": "https://your-account.kanbanize.com/api/v2"
      }
    }
  }
}
```

**After**:
```json
{
  "mcpServers": {
    "Businessmap": {
      "command": "npx",
      "args": ["-y", "@neilinger/businessmap-mcp"],
      "env": {
        "BUSINESSMAP_CONFIG_FILE": "/Users/you/.config/businessmap-mcp/instances.json",
        "BUSINESSMAP_API_TOKEN_PROD": "ace_your_token"
      }
    }
  }
}
```

### Step 5: Restart MCP Server

Restart Claude Desktop or your MCP client to load the new configuration.

### Step 6: Verify Configuration

Use instance discovery tools:

```javascript
// List all instances
await list_instances();
// Should show: production (default)

// Get instance details
await get_instance_info({ instance: "production" });
```

### Step 7: Test Tool Usage

```javascript
// Default instance (no changes needed)
await list_workspaces();

// Explicit instance (new capability)
await list_workspaces({ instance: "production" });
```

## Adding More Instances

Once basic migration is complete, add additional instances:

```json
{
  "version": "1.0",
  "default_instance": "production",
  "instances": {
    "production": {
      "name": "Production",
      "api_url": "https://your-prod.kanbanize.com/api/v2",
      "api_token_env": "BUSINESSMAP_API_TOKEN_PROD"
    },
    "staging": {
      "name": "Staging",
      "api_url": "https://your-staging.kanbanize.com/api/v2",
      "api_token_env": "BUSINESSMAP_API_TOKEN_STAGING",
      "read_only_mode": true
    }
  }
}
```

Add corresponding tokens:
```bash
export BUSINESSMAP_API_TOKEN_STAGING="ace_your_staging_token"
```

## Rollback Plan

If you encounter issues, rollback is simple:

1. Remove or unset `BUSINESSMAP_CONFIG_FILE`:
   ```bash
   unset BUSINESSMAP_CONFIG_FILE
   ```

2. Restore original environment variables:
   ```bash
   export BUSINESSMAP_API_TOKEN="ace_your_token"
   export BUSINESSMAP_API_URL="https://your-account.kanbanize.com/api/v2"
   ```

3. Restart MCP server

The server automatically falls back to legacy mode.

## Common Issues

### Issue 1: "Instance not found" error

**Cause**: Typo in instance name or instance not in configuration

**Solution**:
```bash
# List available instances
await list_instances();

# Verify spelling matches configuration
```

### Issue 2: "Token not found" error

**Cause**: Environment variable for token not set

**Solution**:
```bash
# Check configuration file for token env var name
cat ~/.config/businessmap-mcp/instances.json | grep api_token_env

# Ensure env var is set
echo $BUSINESSMAP_API_TOKEN_PROD
```

### Issue 3: Server uses legacy mode unexpectedly

**Cause**: BUSINESSMAP_CONFIG_FILE not set or file not found

**Solution**:
```bash
# Verify config file exists
ls -la $BUSINESSMAP_CONFIG_FILE

# Verify env var is set
echo $BUSINESSMAP_CONFIG_FILE
```

## Best Practices

1. **Token Security**: Never commit tokens to version control
2. **Configuration Files**: Keep `.businessmap-instances.json` in `.gitignore`
3. **Environment Variables**: Use secrets management (Vault, AWS Secrets Manager)
4. **Default Instance**: Set production as default for safety
5. **Read-Only Mode**: Enable for non-production instances during testing
6. **Tags**: Use tags to group instances logically (e.g., "prod", "qa", "us-east")

## Validation Checklist

- [ ] Configuration file created and validated
- [ ] BUSINESSMAP_CONFIG_FILE environment variable set
- [ ] Instance-specific token environment variables set
- [ ] MCP server configuration updated
- [ ] Server restarted
- [ ] `list_instances` returns expected instances
- [ ] `get_instance_info` shows correct configuration
- [ ] Tool calls work with default instance (no parameter)
- [ ] Tool calls work with explicit instance parameter
- [ ] Legacy mode works as fallback (rollback tested)

## Support

For issues or questions:
- GitHub Issues: https://github.com/neilinger/businessmap-mcp/issues
- Documentation: https://github.com/neilinger/businessmap-mcp
```

## File 3: CHANGELOG.md Updates

### Add New Version Section at Top

Insert after line 7 (after existing ## [1.6.0]):

```markdown
## [1.7.0] - 2025-10-30

### Added

#### Multi-Instance Configuration Support (Issue #8)

**Infrastructure**
- Multi-instance configuration management via JSON config files
- `InstanceConfigManager` - Singleton for configuration loading and validation
- `BusinessMapClientFactory` - Factory pattern with per-instance client caching
- Support for config file locations: explicit path, env var, default paths
- JSON Schema validation for instance configurations
- Backward-compatible legacy mode fallback

**Tool Enhancements**
- All 43 tools now accept optional `instance` parameter
- Two new instance discovery tools:
  - `list_instances` - List all configured instances with status
  - `get_instance_info` - Get detailed information about specific instance
- Instance resolution strategy: explicit > default > fallback
- Per-instance rate limiting and error isolation

**Configuration**
- JSON-based configuration format (`.businessmap-instances.json`)
- Environment variable configuration support (`BUSINESSMAP_INSTANCES`)
- Token security: Tokens stored in separate environment variables
- Per-instance settings: API URL, read-only mode, default workspace
- Instance tagging for organization and filtering

**Documentation**
- Comprehensive migration guide (`docs/MIGRATION_GUIDE.md`)
- Multi-instance implementation patterns
- Configuration examples (dev/staging/prod, multi-region)
- Troubleshooting guide for common issues

**Testing**
- 91 unit tests for core infrastructure (instance manager, client factory)
- Integration tests for multi-instance operations
- Backward compatibility test suite
- 90%+ code coverage for new components

### Changed

- Tool handlers now accept `BusinessMapClient | BusinessMapClientFactory`
- Base tool handler includes `getClientForInstance()` helper
- All tool schemas include optional `instance` parameter
- Server initialization attempts multi-instance mode first, falls back to legacy

### Backward Compatibility

- 100% compatible with existing single-instance configurations
- Legacy environment variables (`BUSINESSMAP_API_TOKEN`, `BUSINESSMAP_API_URL`) continue to work
- No breaking changes to tool interfaces or response formats
- Automatic mode detection and fallback

### Migration

See [MIGRATION_GUIDE.md](./docs/MIGRATION_GUIDE.md) for step-by-step migration instructions from single-instance to multi-instance configuration.

```

## File 4: package.json Version Bump

Update line 3:
```json
"version": "1.7.0",
```

## Requirements

### Style Guidelines:
- Follow existing README.md formatting and tone
- Use clear, concise language
- Include code examples for all major features
- Maintain consistency with existing documentation

### Technical Accuracy:
- All examples must be valid JSON/JavaScript
- All file paths must be accurate
- All configuration values must match implementation
- All tool names must match actual tool registration names

### Completeness:
- Cover all major use cases
- Include troubleshooting for common issues
- Provide clear migration path
- Include rollback instructions

## References
- Current README.md structure
- docs/MULTI_INSTANCE_IMPLEMENTATION.md for technical details
- examples/multi-instance-config.json for configuration format
- CHANGELOG.md for existing format patterns
