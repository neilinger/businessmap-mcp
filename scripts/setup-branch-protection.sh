#!/usr/bin/env bash
#
# setup-branch-protection.sh
# Configure GitHub branch protection for main branch
#
# Part of Five-Layer Quality Control System (T008-T011)
# This is a CRITICAL blocker for all user stories
#
# Requirements:
# - gh CLI installed and authenticated
# - Repository must exist on GitHub
# - User must have admin permissions on the repository
#
# Usage:
#   ./scripts/setup-branch-protection.sh
#
# Author: Generated for businessmap-mcp project
# Date: 2025-11-08

set -Eeuo pipefail

# Script directory for potential future use
readonly SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"

# Colors for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $*" >&2
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $*" >&2
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $*" >&2
}

# Error handler
error_handler() {
    local line_num="$1"
    log_error "Script failed at line ${line_num}"
    exit 1
}

trap 'error_handler ${LINENO}' ERR

# Main function
main() {
    log_info "Starting GitHub branch protection setup"

    # Check if gh CLI is installed
    if ! command -v gh &>/dev/null; then
        log_error "gh CLI is not installed. Please install it: https://cli.github.com/"
        exit 1
    fi

    # Check if gh is authenticated
    if ! gh auth status &>/dev/null; then
        log_error "gh CLI is not authenticated. Please run: gh auth login"
        exit 1
    fi

    # Extract repository path from git remote URL
    log_info "Extracting repository information from git remote..."

    local remote_url
    remote_url=$(git remote get-url origin) || {
        log_error "Failed to get git remote URL. Are you in a git repository?"
        exit 1
    }

    log_info "Remote URL: ${remote_url}"

    # Parse repository path from SSH or HTTPS URL
    local repo_path
    if [[ "${remote_url}" =~ git@github\.com:(.+)\.git$ ]]; then
        # SSH format: git@github.com:owner/repo.git
        repo_path="${BASH_REMATCH[1]}"
    elif [[ "${remote_url}" =~ https://github\.com/(.+)\.git$ ]]; then
        # HTTPS format: https://github.com/owner/repo.git
        repo_path="${BASH_REMATCH[1]}"
    elif [[ "${remote_url}" =~ github\.com[:/](.+?)(?:\.git)?$ ]]; then
        # Fallback for other formats
        repo_path="${BASH_REMATCH[1]}"
        repo_path="${repo_path%.git}" # Remove .git if present
    else
        log_error "Could not parse GitHub repository path from URL: ${remote_url}"
        exit 1
    fi

    log_info "Repository: ${repo_path}"

    # Define required status checks
    # These correspond to the GitHub Actions workflow jobs
    # Final configuration includes all 6 checks from T056b
    local -a required_checks=(
        "CI / Test (Node 18.x)"
        "CI / Test (Node 20.x)"
        "CI / Test (Node 22.x)"
        "CI / Code Quality"
        "CI / Pre-commit Validation"
        "CI / Integration Tests (Mock)"
    )

    log_info "Configuring branch protection with required status checks:"
    for check in "${required_checks[@]}"; do
        log_info "  - ${check}"
    done

    # Build JSON array of required status checks
    local checks_json
    checks_json=$(printf '%s\n' "${required_checks[@]}" | \
        jq -R . | \
        jq -s .)

    # Create branch protection configuration
    local protection_config
    protection_config=$(cat <<-'EOF'
	{
	  "required_status_checks": {
	    "strict": true,
	    "contexts": CHECKS_PLACEHOLDER
	  },
	  "enforce_admins": false,
	  "required_pull_request_reviews": null,
	  "restrictions": null,
	  "allow_force_pushes": false,
	  "allow_deletions": false
	}
	EOF
    )

    # Replace placeholder with actual checks JSON
    protection_config="${protection_config//CHECKS_PLACEHOLDER/${checks_json}}"

    log_info "Applying branch protection to main branch..."

    # Apply branch protection using gh API
    if gh api \
        --method PUT \
        -H "Accept: application/vnd.github+json" \
        -H "X-GitHub-Api-Version: 2022-11-28" \
        "/repos/${repo_path}/branches/main/protection" \
        --input - <<< "${protection_config}"; then

        log_info "✓ Branch protection successfully configured for main branch"
        log_info ""
        log_info "Protection settings:"
        log_info "  - Required status checks: ${#required_checks[@]} checks"
        log_info "  - Strict status checks: enabled (branch must be up-to-date)"
        log_info "  - Enforce admins: disabled"
        log_info "  - Force pushes: disabled"
        log_info "  - Branch deletions: disabled"

    else
        log_error "Failed to configure branch protection"
        log_error "Please ensure you have admin permissions on the repository"
        exit 1
    fi

    log_info ""
    log_info "Setup complete! Main branch is now protected."
}

# Run main function
main "$@"
