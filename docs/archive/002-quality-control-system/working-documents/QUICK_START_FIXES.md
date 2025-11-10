# Quick Start: Critical Fixes (30 minutes)

Copy-paste fixes for immediate implementation.

---

## Step 1: Update package.json (5 minutes)

**File**: `package.json`

**Replace lines 86-88**:

```json
  "engines": {
    "node": ">=20.0.0 <25.0.0"
  }
```

**Replace line 84**:

```json
    "typescript": "5.7.3",
```

**Replace line 73**:

```json
    "@types/node": "~20.14.0",
```

**Replace line 79**:

```json
    "jest": "~29.7.0",
```

**Add before "build" script**:

```json
    "prepare": "husky install",
```

---

## Step 2: Create .lintstagedrc.json (2 minutes)

**File**: `.lintstagedrc.json` (NEW FILE)

```json
{
  "*.{ts,tsx}": ["eslint --fix", "prettier --write", "bash -c 'tsc --noEmit'"],
  "*.{json,md}": ["prettier --write"]
}
```

---

## Step 3: Create .commitlintrc.json (2 minutes)

**File**: `.commitlintrc.json` (NEW FILE)

```json
{
  "extends": ["@commitlint/config-conventional"],
  "rules": {
    "type-enum": [
      2,
      "always",
      ["feat", "fix", "docs", "style", "refactor", "test", "chore", "perf", "ci", "build", "revert"]
    ],
    "type-case": [2, "always", "lowercase"],
    "type-empty": [2, "never"],
    "subject-empty": [2, "never"],
    "subject-case": [2, "never", ["uppercase"]],
    "header-max-length": [2, "always", 100]
  }
}
```

---

## Step 4: Install Dependencies (5 minutes)

```bash
cd /Users/neil/src/solo/businessmap-mcp

# Install all new packages
npm install --save-dev \
  tsc-files \
  commitlint@^19.2.0 \
  @commitlint/config-conventional@^19.2.0 \
  semantic-release@^24.0.0 \
  @semantic-release/changelog@^6.0.3 \
  @semantic-release/npm@^12.0.0 \
  @semantic-release/git@^10.0.1 \
  @semantic-release/github@^10.0.0
```

---

## Step 5: Initialize Husky (10 minutes)

```bash
# Install hooks
npm run prepare

# Create pre-commit hook
npx husky add .husky/pre-commit "npx lint-staged"
chmod +x .husky/pre-commit

# Create commit-msg hook
npx husky add .husky/commit-msg "npx commitlint --edit \$1"
chmod +x .husky/commit-msg

# Verify
ls -la .husky/
```

---

## Step 6: Create .releaserc.json (3 minutes)

**File**: `.releaserc.json` (NEW FILE)

```json
{
  "branches": [
    {
      "name": "main",
      "prerelease": false
    }
  ],
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    [
      "@semantic-release/changelog",
      {
        "changelogFile": "CHANGELOG.md"
      }
    ],
    [
      "@semantic-release/npm",
      {
        "npmPublish": true
      }
    ],
    [
      "@semantic-release/git",
      {
        "assets": ["package.json", "package-lock.json", "CHANGELOG.md"],
        "message": "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}"
      }
    ],
    [
      "@semantic-release/github",
      {
        "releasedLabels": ["released"],
        "failComment": false
      }
    ]
  ]
}
```

---

## Step 7: Verify Everything (3 minutes)

```bash
cd /Users/neil/src/solo/businessmap-mcp

# Test hooks
echo "// test" >> src/index.ts
git add src/index.ts
git commit -m "feat: test commit message"

# Should succeed (hooks run in <2 seconds)
# Should run: eslint, prettier, tsc-files

# Verify configuration files
cat .commitlintrc.json | jq .
cat .releaserc.json | jq .
cat .lintstagedrc.json | jq .

# Check versions pinned
npm ls typescript jest @types/node
```

---

## What You've Done (30 minutes)

✅ Fixed Node 18 EOL issue (>=20.0.0)
✅ Pinned all dev tool versions
✅ Created lint-staged configuration
✅ Created commitlint configuration
✅ Installed semantic-release + plugins
✅ Created semantic-release configuration
✅ Initialized Husky with hooks
✅ Pre-commit validation now works
✅ Conventional commits now enforced

---

## Next Steps (After This Week)

1. **Create integration tests** - 2 hours
2. **Update release.yml** - 30 minutes
3. **Test dry-run** - 15 minutes
4. **Merge to main** - 5 minutes

---

## Troubleshooting

### Hooks not running?

```bash
ls -la .husky/
# Should show pre-commit and commit-msg files
chmod +x .husky/pre-commit
chmod +x .husky/commit-msg
```

### Commit fails with confusing error?

```bash
# Check commitlint rules
npx commitlint --version
npx commitlint --help

# Valid format: type(scope): subject
# Example: feat(api): add new endpoint
git commit -m "feat: test message"
```

### Lint-staged slow?

```bash
# Check tsc-files installed
npm ls tsc-files

# Should use tsc-files (1 sec) not tsc (2-3 sec)
cat .lintstagedrc.json | grep tsc-files
```

---

## Files Created

- ✅ `.lintstagedrc.json` (lint-staged config)
- ✅ `.commitlintrc.json` (commitlint config)
- ✅ `.releaserc.json` (semantic-release config)
- ✅ `.husky/pre-commit` (git hook)
- ✅ `.husky/commit-msg` (git hook)
- ✅ Updated `package.json` (versions + prepare script)

---

## Files Modified

- ✅ `package.json` (4 version pins + 1 new script)

---

## Next Document

See **IMPLEMENTATION_ACTION_GUIDE.md** for Phase 3-4 (Integration tests + CI updates)

---

**Time to Complete**: 30 minutes
**Complexity**: Low (copy-paste)
**Risk**: Minimal (can revert with `git reset --hard`)
**Next Step**: Test locally, then proceed to Phase 3
