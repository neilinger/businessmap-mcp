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
