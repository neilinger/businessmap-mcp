# Security Recommendations - Quick Reference

**Project:** BusinessMap MCP Server v1.7.0
**Branch:** issue-8-multi-instance-config
**Status:** Medium-High Security Rating ✓

---

## Executive Summary

The multi-instance configuration implementation is **secure for production use** with 4 Medium priority and 3 Low priority recommendations. No Critical or High severity issues identified.

**Quick Stats:**
- 0 Critical Issues
- 0 High Priority Issues
- 4 Medium Priority Issues (~6-10 hours to fix)
- 3 Low Priority Issues (~4-7 hours to fix)

---

## Immediate Action Items (Before Production)

### 1. Fix Token Hashing (2 hours) 🔐

**File:** `src/client/client-factory.ts:300-308`

**Current (Insecure):**
```typescript
private hashToken(token: string): string {
  let hash = 0;
  for (let i = 0; i < token.length; i++) {
    const char = token.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}
```

**Recommended (Secure):**
```typescript
import { createHash } from 'crypto';

private hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
```

**Why:** Prevents collision attacks and secure memory dump analysis.

---

### 2. Remove Token Logging (30 minutes) 🔐

**Files:**
- `test/integration/phase9-validation.test.ts:170`

**Current (Insecure):**
```typescript
console.log(`🔑 API Token: ${API_TOKEN?.substring(0, 10)}...`);
```

**Recommended (Secure):**
```typescript
console.log(`🔑 API Token: ${API_TOKEN ? '[CONFIGURED]' : '[MISSING]'}`);
```

**Why:** Eliminates partial credential exposure in logs.

---

### 3. Sanitize Error Metadata (2 hours) 🛡️

**File:** `src/client/client-factory.ts:260-273`

**Current (Risk):**
```typescript
{
  instanceName: resolution.instance.name,
  apiUrl: resolution.instance.apiUrl,
  originalError: error,  // May contain sensitive data
}
```

**Recommended (Secure):**
```typescript
{
  instanceName: resolution.instance.name,
  apiUrl: resolution.instance.apiUrl,
  errorType: error instanceof Error ? error.name : 'Unknown',
  errorMessage: error instanceof Error ?
    error.message.replace(/\b[A-Za-z0-9_]{20,}\b/g, '[REDACTED]') :
    'Unknown',
  // Don't include full originalError object
}
```

**Why:** Prevents sensitive data leakage via error objects.

---

### 4. Implement Secure Logging (4 hours) 📝

**File:** `src/server/mcp-server.ts:59-88`

**Add New Module:** `src/utils/secure-logger.ts`
```typescript
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

const currentLevel = process.env.BUSINESSMAP_LOG_LEVEL === 'debug' ?
  LogLevel.DEBUG : LogLevel.INFO;

export function secureLog(level: LogLevel, message: string, redact = false) {
  if (level < currentLevel) return;

  let logMessage = message;
  if (redact && currentLevel > LogLevel.DEBUG) {
    // Redact URLs, tokens, and sensitive patterns
    logMessage = logMessage
      .replace(/https?:\/\/[^\s]+/g, '[REDACTED_URL]')
      .replace(/\b[A-Za-z0-9_]{20,}\b/g, '[REDACTED_TOKEN]')
      .replace(/api[_-]?token[=:]\s*\S+/gi, 'api_token=[REDACTED]');
  }

  console.log(logMessage);
}

// Usage
secureLog(LogLevel.INFO, `API URL: ${config.apiUrl}`, true);
```

**Why:** Prevents production information disclosure via logs.

---

## Optional Enhancements (Within 1-2 Sprints)

### 5. Add SSRF Protection (4 hours) 🌐

**File:** `src/config/instance-manager.ts`

**Add Validation Function:**
```typescript
const BLOCKED_HOSTS = [
  'localhost', '127.0.0.1', '0.0.0.0',
  /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
  /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/,
  /^192\.168\.\d{1,3}\.\d{1,3}$/,
  /^169\.254\.\d{1,3}\.\d{1,3}$/,  // AWS metadata
];

function validateApiUrl(url: string): void {
  const parsed = new URL(url);

  // Enforce HTTPS only
  if (parsed.protocol !== 'https:') {
    throw new InstanceConfigError(
      'API URL must use HTTPS protocol',
      'INVALID_PROTOCOL'
    );
  }

  // Block internal/private hosts
  for (const pattern of BLOCKED_HOSTS) {
    if (typeof pattern === 'string') {
      if (parsed.hostname === pattern) {
        throw new InstanceConfigError(
          'API URL must be a public endpoint',
          'SSRF_BLOCKED'
        );
      }
    } else if (pattern.test(parsed.hostname)) {
      throw new InstanceConfigError(
        'API URL must be a public endpoint',
        'SSRF_BLOCKED'
      );
    }
  }
}

// Call in loadFromFile and loadFromEnvVar
validateApiUrl(instance.apiUrl);
```

**Why:** Prevents server-side request forgery to internal services.

---

### 6. Enforce File Permissions (2 hours) 🔒

**File:** `src/config/instance-manager.ts:191-233`

**Add Permission Check:**
```typescript
import { statSync } from 'fs';

private loadFromFile(path: string, validate: boolean): void {
  try {
    if (!existsSync(path)) {
      throw new InstanceConfigError(
        `Configuration file not found: ${path}`,
        'FILE_NOT_FOUND',
        { path }
      );
    }

    // Check file permissions
    const stats = statSync(path);
    const mode = stats.mode & parseInt('777', 8);

    if (mode & parseInt('004', 8)) {  // World-readable
      console.warn(
        `⚠️  Security Warning: Config file ${path} is world-readable ` +
        `(mode: ${mode.toString(8)}). Recommend: chmod 600 ${path}`
      );
    }

    const content = readFileSync(path, 'utf-8');
    // ... continue with existing logic
  }
}
```

**Why:** Reduces risk of configuration file disclosure.

---

### 7. Add Length Limits (30 minutes) 🛡️

**File:** `src/config/instance-manager.ts:33`

**Current:**
```typescript
name: z.string().min(1, 'Instance name cannot be empty'),
```

**Recommended:**
```typescript
name: z.string()
  .min(1, 'Instance name cannot be empty')
  .max(100, 'Instance name too long (max 100 chars)')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Instance name contains invalid characters'),
```

**Why:** Prevents resource exhaustion via long identifiers.

---

## Testing Additions

### Security Test Suite (6 hours)

**Create:** `test/security/security.test.ts`

```typescript
describe('Security Tests', () => {
  describe('Token Security', () => {
    it('should never log actual tokens', () => {
      // Mock console.log and verify no token patterns
    });

    it('should use cryptographic hashing for tokens', () => {
      // Verify SHA-256 hashing
    });

    it('should invalidate cache on token rotation', () => {
      // Test token change detection
    });
  });

  describe('SSRF Protection', () => {
    it('should reject localhost URLs', async () => {
      // Test SSRF blocking
    });

    it('should reject private IP ranges', async () => {
      // Test 10.x, 172.16-31.x, 192.168.x blocking
    });

    it('should reject AWS metadata endpoint', async () => {
      // Test 169.254.169.254 blocking
    });
  });

  describe('Error Sanitization', () => {
    it('should not expose tokens in error messages', () => {
      // Verify token redaction
    });

    it('should sanitize originalError metadata', () => {
      // Check error object sanitization
    });
  });

  describe('Configuration Security', () => {
    it('should warn about world-readable config files', () => {
      // Test permission checking
    });

    it('should enforce instance name length limits', () => {
      // Test max length validation
    });
  });
});
```

---

## Implementation Priority

### Phase 1: Critical for Production (Total: ~8 hours)
1. ✅ Fix token hashing (2 hours)
2. ✅ Remove token logging (30 minutes)
3. ✅ Sanitize error metadata (2 hours)
4. ✅ Implement secure logging (4 hours)

### Phase 2: Security Hardening (Total: ~13 hours)
5. 🔄 Add SSRF protection (4 hours)
6. 🔄 Enforce file permissions (2 hours)
7. 🔄 Add length limits (30 minutes)
8. 🔄 Security test suite (6 hours)

### Phase 3: Compliance & Monitoring (Ongoing)
9. 📋 Dependency scanning (npm audit automation)
10. 📋 Security audit logging
11. 📋 GDPR compliance documentation
12. 📋 Incident response procedures

---

## Code Review Checklist

Before merging to main:

- [ ] Token hashing uses SHA-256
- [ ] No token values in console logs
- [ ] Error objects sanitized (no originalError)
- [ ] Secure logging with redaction enabled
- [ ] SSRF validation for API URLs
- [ ] File permission warnings implemented
- [ ] Instance name length limits enforced
- [ ] Security test suite passing
- [ ] npm audit shows no high/critical issues
- [ ] README updated with security guidelines

---

## Quick Fix Script

**Create:** `scripts/apply-security-fixes.sh`

```bash
#!/bin/bash
set -e

echo "🔒 Applying security fixes..."

# 1. Token hashing
echo "📝 Updating token hashing..."
sed -i.bak 's/hash\.toString(36)/createHash("sha256").update(token).digest("hex")/' \
  src/client/client-factory.ts

# 2. Token logging
echo "📝 Removing token logging..."
sed -i.bak 's/\${API_TOKEN.*substring.*\.\.\./\${API_TOKEN ? "[CONFIGURED]" : "[MISSING]"}/' \
  test/integration/phase9-validation.test.ts

# 3. Add imports
echo "📝 Adding crypto import..."
sed -i.bak '1s/^/import { createHash } from "crypto";\n/' \
  src/client/client-factory.ts

echo "✅ Security fixes applied!"
echo "⚠️  Please review changes before committing"
echo "📝 Run: npm test to verify"
```

---

## Documentation Updates

### Update README.md

Add security section:

```markdown
## Security Best Practices

### Token Management
- Store tokens in environment variables only
- Never commit tokens to version control
- Rotate tokens regularly (every 90 days)
- Use read-only tokens for non-production instances

### Configuration Files
- Set restrictive permissions: `chmod 600 .businessmap-instances.json`
- Store in user home directory (`~/.config/businessmap-mcp/`)
- Use separate tokens per environment

### Production Deployment
- Enable secure logging: `BUSINESSMAP_LOG_LEVEL=info`
- Monitor for security events
- Review API access logs regularly
- Implement network egress filtering

### Reporting Security Issues
- Email: security@[project-domain]
- GitHub Security Advisory: [URL]
- Response SLA: 48 hours
```

---

## Verification Steps

After applying fixes:

```bash
# 1. Run tests
npm test

# 2. Check for token leakage
grep -r "API_TOKEN.*substring" test/

# 3. Verify crypto import
grep "createHash" src/client/client-factory.ts

# 4. Run security scan
npm audit

# 5. Build and test
npm run build
npm start  # Verify no sensitive logs

# 6. Test multi-instance
# (Verify instances isolated, no cross-contamination)
```

---

## Support & Questions

**Security Questions:**
- Review full audit report: `SECURITY_AUDIT_REPORT.md`
- Contact: security@[project-domain]

**Implementation Help:**
- GitHub Issues: Tag with `security` label
- Code review: Request security-focused review

---

**Last Updated:** 2025-10-30
**Version:** 1.0
**Audit Status:** ✅ Medium-High Security Rating
