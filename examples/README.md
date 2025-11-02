# Multi-Instance Configuration Examples

This directory contains example configurations for setting up multi-instance BusinessMap MCP server support.

---

## Available Examples

### 1. `multi-instance-config.json`
**Use Case**: Development + Staging + Production setup

**Features**:
- 3 instances (production, staging, development)
- Default instance: production
- Read-only mode for development
- Tags for filtering/grouping

**Setup**:
```bash
# Copy to config directory
mkdir -p ~/.config/businessmap-mcp
cp multi-instance-config.json ~/.config/businessmap-mcp/instances.json

# Set environment variables
export BUSINESSMAP_CONFIG_FILE=~/.config/businessmap-mcp/instances.json
export BUSINESSMAP_API_TOKEN_PROD=ace_your_prod_token
export BUSINESSMAP_API_TOKEN_STAGING=ace_your_staging_token
export BUSINESSMAP_API_TOKEN_DEV=ace_your_dev_token
```

### 2. `multi-region-config.json`
**Use Case**: Multi-region deployment (US, EU, APAC)

**Features**:
- 4 instances (US East/West, EU West, APAC South)
- Regional tags (us, eu, apac)
- Geography-based routing

**Setup**:
```bash
# Copy to config directory
cp multi-region-config.json ~/.config/businessmap-mcp/instances.json

# Set environment variables
export BUSINESSMAP_CONFIG_FILE=~/.config/businessmap-mcp/instances.json
export BUSINESSMAP_TOKEN_US_EAST=ace_us_east_token
export BUSINESSMAP_TOKEN_US_WEST=ace_us_west_token
export BUSINESSMAP_TOKEN_EU_WEST=ace_eu_west_token
export BUSINESSMAP_TOKEN_AP_SOUTH=ace_ap_south_token
```

### 3. `environment-variables.template`
**Use Case**: Environment variable configuration template

**Features**:
- Complete environment variable reference
- Security best practices
- Optional configuration overrides

**Setup**:
```bash
# Copy to .env file
cp environment-variables.template .env

# Edit .env with your actual values
nano .env

# Load environment variables
source .env
```

---

## Configuration File Structure

```json
{
  "version": "1.0",
  "default_instance": "<instance-id>",
  "instances": {
    "<instance-id>": {
      "name": "<human-readable-name>",
      "description": "<optional-description>",
      "api_url": "<businessmap-api-url>",
      "api_token_env": "<environment-variable-name>",
      "default_workspace_id": <optional-number>,
      "read_only_mode": <optional-boolean>,
      "tags": ["<optional-tags>"]
    }
  }
}
```

### Field Descriptions

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `version` | Yes | String | Configuration schema version (e.g., "1.0") |
| `default_instance` | Yes | String | Default instance ID when not specified |
| `instances` | Yes | Object | Map of instance ID to configuration |
| `instances.<id>.name` | Yes | String | Human-readable instance name |
| `instances.<id>.description` | No | String | Optional instance description |
| `instances.<id>.api_url` | Yes | String (URL) | BusinessMap API URL |
| `instances.<id>.api_token_env` | Yes | String | Environment variable name for token |
| `instances.<id>.default_workspace_id` | No | Number | Default workspace ID |
| `instances.<id>.read_only_mode` | No | Boolean | Enable read-only mode |
| `instances.<id>.tags` | No | Array<String> | Optional tags for filtering |

---

## Quick Start Guide

### Step 1: Choose Your Setup

**Option A: Single Instance (Backward Compatible)**
```bash
# No config file needed
export BUSINESSMAP_API_URL=https://your-instance.kanbanize.com/api/v2
export BUSINESSMAP_API_TOKEN=your-token
```

**Option B: Multi-Instance**
```bash
# Use config file
export BUSINESSMAP_CONFIG_FILE=/path/to/instances.json
export BUSINESSMAP_API_TOKEN_INSTANCE1=token1
export BUSINESSMAP_API_TOKEN_INSTANCE2=token2
```

### Step 2: Create Configuration File (Option B only)

```json
{
  "version": "1.0",
  "default_instance": "main",
  "instances": {
    "main": {
      "name": "Main Instance",
      "api_url": "https://main.kanbanize.com/api/v2",
      "api_token_env": "BUSINESSMAP_API_TOKEN_INSTANCE1"
    },
    "backup": {
      "name": "Backup Instance",
      "api_url": "https://backup.kanbanize.com/api/v2",
      "api_token_env": "BUSINESSMAP_API_TOKEN_INSTANCE2"
    }
  }
}
```

### Step 3: Set Environment Variables

```bash
# Config file path (if using multi-instance)
export BUSINESSMAP_CONFIG_FILE=~/.config/businessmap-mcp/instances.json

# Instance tokens
export BUSINESSMAP_API_TOKEN_INSTANCE1=ace_main_token_here
export BUSINESSMAP_API_TOKEN_INSTANCE2=ace_backup_token_here
```

### Step 4: Start MCP Server

```bash
npm start
```

### Step 5: Verify Configuration

```typescript
// List all configured instances
await client.listInstances({ include_health: true });
```

---

## Common Patterns

### Pattern 1: Environment-Based Setup

**Development**:
```json
{
  "version": "1.0",
  "default_instance": "dev",
  "instances": {
    "dev": {
      "name": "Development",
      "api_url": "https://dev.kanbanize.com/api/v2",
      "api_token_env": "BUSINESSMAP_API_TOKEN",
      "read_only_mode": true
    }
  }
}
```

**Production**:
```json
{
  "version": "1.0",
  "default_instance": "prod",
  "instances": {
    "prod": {
      "name": "Production",
      "api_url": "https://prod.kanbanize.com/api/v2",
      "api_token_env": "BUSINESSMAP_API_TOKEN",
      "read_only_mode": false
    }
  }
}
```

### Pattern 2: Multi-Tenant Setup

```json
{
  "version": "1.0",
  "default_instance": "customer-a",
  "instances": {
    "customer-a": {
      "name": "Customer A",
      "api_url": "https://customer-a.kanbanize.com/api/v2",
      "api_token_env": "BUSINESSMAP_TOKEN_CUSTOMER_A",
      "tags": ["customer", "active"]
    },
    "customer-b": {
      "name": "Customer B",
      "api_url": "https://customer-b.kanbanize.com/api/v2",
      "api_token_env": "BUSINESSMAP_TOKEN_CUSTOMER_B",
      "tags": ["customer", "active"]
    },
    "customer-c": {
      "name": "Customer C",
      "api_url": "https://customer-c.kanbanize.com/api/v2",
      "api_token_env": "BUSINESSMAP_TOKEN_CUSTOMER_C",
      "tags": ["customer", "trial"]
    }
  }
}
```

### Pattern 3: Blue-Green Deployment

```json
{
  "version": "1.0",
  "default_instance": "blue",
  "instances": {
    "blue": {
      "name": "Blue (Active)",
      "api_url": "https://blue.kanbanize.com/api/v2",
      "api_token_env": "BUSINESSMAP_TOKEN_BLUE",
      "tags": ["active", "production"]
    },
    "green": {
      "name": "Green (Standby)",
      "api_url": "https://green.kanbanize.com/api/v2",
      "api_token_env": "BUSINESSMAP_TOKEN_GREEN",
      "tags": ["standby", "production"]
    }
  }
}
```

---

## Security Best Practices

### 1. Token Storage

**✅ Good**: Store tokens in environment variables
```bash
export BUSINESSMAP_API_TOKEN_PROD=ace_token_here
```

**❌ Bad**: Store tokens in config file
```json
{
  "api_token": "ace_token_here"  // ← NEVER DO THIS!
}
```

### 2. File Permissions

```bash
# Config file should be user-readable only
chmod 600 ~/.config/businessmap-mcp/instances.json

# Directory should be user-accessible only
chmod 700 ~/.config/businessmap-mcp/
```

### 3. Version Control

**Add to `.gitignore`**:
```
# Never commit these files
.env
.env.local
.env.production
.env.staging
.env.development
instances.json
```

**Safe to commit**:
```
# Template files are safe
.env.sample
environment-variables.template
multi-instance-config.json  # (if tokens in env vars)
```

### 4. Token Management

- ✅ Use separate tokens for each environment
- ✅ Use read-only tokens for development/staging
- ✅ Rotate tokens regularly (e.g., quarterly)
- ✅ Store tokens in secret management tools (Vault, AWS Secrets Manager)
- ✅ Set token expiration policies
- ❌ Never share tokens across environments
- ❌ Never commit tokens to version control

### 5. Access Control

```json
{
  "instances": {
    "production": {
      "name": "Production",
      "read_only_mode": false,  // Full access
      "tags": ["prod", "critical"]
    },
    "staging": {
      "name": "Staging",
      "read_only_mode": false,  // Full access for testing
      "tags": ["staging", "test"]
    },
    "development": {
      "name": "Development",
      "read_only_mode": true,   // Read-only to prevent accidents
      "tags": ["dev", "readonly"]
    }
  }
}
```

---

## Validation

### JSON Schema Validation

```bash
# Install JSON schema validator
npm install -g ajv-cli

# Validate config file against schema
ajv validate -s ../schemas/instances-config.schema.json -d instances.json
```

### Manual Validation Checklist

- [ ] All instance IDs are alphanumeric (no spaces or special chars except `-` and `_`)
- [ ] `default_instance` references an existing instance ID
- [ ] All `api_url` values are valid URLs (https:// preferred)
- [ ] All `api_url` values are unique (no duplicates)
- [ ] All `api_token_env` environment variables exist and are non-empty
- [ ] All `api_token_env` names follow uppercase convention (e.g., `BUSINESSMAP_API_TOKEN_PROD`)
- [ ] File permissions are restrictive (600 for config file, 700 for directory)

---

## Troubleshooting

### Error: "No BusinessMap configuration found"

**Cause**: No configuration file or environment variables found.

**Solution**:
```bash
# Option 1: Set legacy env vars
export BUSINESSMAP_API_URL=https://your-instance.kanbanize.com/api/v2
export BUSINESSMAP_API_TOKEN=your-token

# Option 2: Set config file path
export BUSINESSMAP_CONFIG_FILE=/path/to/instances.json
```

### Error: "Instance 'X' not found"

**Cause**: Tool invoked with invalid instance ID.

**Solution**:
```typescript
// List available instances
await client.listInstances();

// Use valid instance ID
await client.listWorkspaces({ instance: "production" });
```

### Error: "API token environment variable 'X' not found"

**Cause**: Environment variable referenced in config file doesn't exist.

**Solution**:
```bash
# Set the missing environment variable
export BUSINESSMAP_API_TOKEN_PROD=your-token-here

# Restart MCP server
npm start
```

### Error: "Configuration schema validation failed"

**Cause**: Config file has invalid JSON or doesn't match schema.

**Solution**:
```bash
# Validate JSON syntax
cat instances.json | python -m json.tool

# Validate against schema
ajv validate -s ../schemas/instances-config.schema.json -d instances.json
```

### Error: "Authentication failed"

**Cause**: Invalid or expired API token.

**Solution**:
1. Verify token in BusinessMap web interface
2. Check token has correct permissions
3. Regenerate token if expired
4. Update environment variable with new token

---

## Testing Your Configuration

### 1. Test Configuration Loading

```typescript
// Should return all configured instances
const instances = await client.listInstances();
console.log('Configured instances:', instances);
```

### 2. Test Health Checks

```typescript
// Check health of all instances
const instances = await client.listInstances({ include_health: true });
instances.instances.forEach(instance => {
  console.log(`${instance.name}: ${instance.health}`);
});
```

### 3. Test Instance Switching

```typescript
// Default instance (no parameter)
const prodWorkspaces = await client.listWorkspaces();

// Explicit instance
const stagingWorkspaces = await client.listWorkspaces({ instance: "staging" });

// Verify different results
console.log('Production workspaces:', prodWorkspaces.length);
console.log('Staging workspaces:', stagingWorkspaces.length);
```

---

## Additional Resources

- **Architecture Design**: [../docs/architecture/multi-instance-config-design.md](../docs/architecture/multi-instance-config-design.md)
- **Implementation Summary**: [../docs/architecture/IMPLEMENTATION_SUMMARY.md](../docs/architecture/IMPLEMENTATION_SUMMARY.md)
- **JSON Schema**: [../schemas/instances-config.schema.json](../schemas/instances-config.schema.json)
- **Migration Guide**: [../docs/migration/multi-instance-migration.md](../docs/migration/multi-instance-migration.md) (TBD)

---

## Questions?

For questions or issues:
1. Check the troubleshooting section above
2. Review the architecture design document
3. Open an issue on GitHub

---

**Last Updated**: 2025-10-29
