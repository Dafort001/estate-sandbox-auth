#!/bin/bash
# pix.immo Repository Audit Script
# Validates project structure and required files for Cloudflare deployment

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "======================================"
echo "   pix.immo Repository Audit"
echo "======================================"
echo ""

# Track results
PASS=0
FAIL=0
WARN=0

# Check function
check_file() {
  if [ -f "$1" ]; then
    echo -e "${GREEN}✓${NC} $1"
    ((PASS++))
  else
    echo -e "${RED}✗${NC} $1 - MISSING"
    ((FAIL++))
  fi
}

check_dir() {
  if [ -d "$1" ]; then
    echo -e "${GREEN}✓${NC} $1/"
    ((PASS++))
  else
    echo -e "${RED}✗${NC} $1/ - MISSING"
    ((FAIL++))
  fi
}

check_command() {
  if command -v "$1" &> /dev/null; then
    echo -e "${GREEN}✓${NC} $1 installed"
    ((PASS++))
  else
    echo -e "${YELLOW}⚠${NC} $1 not found (optional)"
    ((WARN++))
  fi
}

# 1. Core Configuration Files
echo "1. Core Configuration Files"
echo "----------------------------"
check_file "package.json"
check_file "tsconfig.json"
check_file "wrangler.toml"
check_file "drizzle.config.ts"
check_file "vite.config.ts"
check_file "tailwind.config.ts"
echo ""

# 2. Deployment & CI/CD
echo "2. Deployment & CI/CD"
echo "---------------------"
check_file ".github/workflows/piximmo-ci.yml"
check_file ".github/ISSUE_TEMPLATE/missing-requirement.yml"
check_file "wrangler.toml"
echo ""

# 3. Documentation
echo "3. Documentation"
echo "----------------"
check_file "README.md"
check_file "AUDIT_CHECKLIST.md"
check_file "replit.md"
check_file "design_guidelines.md"
check_file "ROUTES.md"
echo ""

# 4. Server Structure
echo "4. Server Structure"
echo "-------------------"
check_file "server/index.ts"
check_file "server/routes.ts"
check_file "server/auth.ts"
check_file "server/storage.ts"
check_file "server/db.ts"
check_file "server/logger.ts"
check_file "server/cleanup.ts"
check_file "server/fileNaming.ts"
check_file "server/objectStorage.ts"
echo ""

# 5. Client Structure
echo "5. Client Structure"
echo "-------------------"
check_dir "client/src"
check_file "client/src/App.tsx"
check_file "client/src/main.tsx"
check_dir "client/src/pages"
check_dir "client/src/components"
check_dir "client/src/lib"
echo ""

# 6. Shared Schema
echo "6. Shared Schema"
echo "----------------"
check_file "shared/schema.ts"
echo ""

# 7. Required Commands
echo "7. Required Commands"
echo "--------------------"
check_command "node"
check_command "npm"
check_command "git"
check_command "wrangler"
echo ""

# 8. Check npm scripts
echo "8. NPM Scripts"
echo "--------------"
if [ -f "package.json" ]; then
  for script in "dev" "build" "start" "lint" "check" "db:push"; do
    if grep -q "\"$script\"" package.json; then
      echo -e "${GREEN}✓${NC} npm run $script"
      ((PASS++))
    else
      echo -e "${RED}✗${NC} npm run $script - MISSING"
      ((FAIL++))
    fi
  done
else
  echo -e "${RED}✗${NC} package.json not found"
  ((FAIL+=6))
fi
echo ""

# 9. Environment Variables
echo "9. Environment Variables"
echo "------------------------"
ENV_VARS=(
  "DATABASE_URL"
  "SESSION_SECRET"
  "JWT_SECRET"
)

for var in "${ENV_VARS[@]}"; do
  if [ -n "${!var}" ]; then
    echo -e "${GREEN}✓${NC} $var (set)"
    ((PASS++))
  else
    echo -e "${YELLOW}⚠${NC} $var (not set - required for production)"
    ((WARN++))
  fi
done
echo ""

# 10. Wrangler Configuration Check
echo "10. Wrangler Configuration"
echo "--------------------------"
if [ -f "wrangler.toml" ]; then
  if grep -q "name = \"piximmo-app\"" wrangler.toml; then
    echo -e "${GREEN}✓${NC} Correct app name in wrangler.toml"
    ((PASS++))
  else
    echo -e "${RED}✗${NC} Incorrect app name in wrangler.toml"
    ((FAIL++))
  fi
  
  if grep -q "compatibility_date" wrangler.toml; then
    echo -e "${GREEN}✓${NC} Compatibility date set"
    ((PASS++))
  else
    echo -e "${RED}✗${NC} Compatibility date missing"
    ((FAIL++))
  fi
  
  if grep -q "R2_BUCKET" wrangler.toml; then
    echo -e "${GREEN}✓${NC} R2 bucket binding configured"
    ((PASS++))
  else
    echo -e "${YELLOW}⚠${NC} R2 bucket binding not configured"
    ((WARN++))
  fi
  
  if grep -q "\[observability\]" wrangler.toml; then
    echo -e "${GREEN}✓${NC} Observability enabled"
    ((PASS++))
  else
    echo -e "${YELLOW}⚠${NC} Observability not enabled"
    ((WARN++))
  fi
else
  echo -e "${RED}✗${NC} wrangler.toml not found"
  ((FAIL+=4))
fi
echo ""

# 11. Check Git Status
echo "11. Git Repository"
echo "------------------"
if [ -d ".git" ]; then
  echo -e "${GREEN}✓${NC} Git repository initialized"
  ((PASS++))
  
  # Check for uncommitted changes
  if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}⚠${NC} Uncommitted changes detected"
    ((WARN++))
  else
    echo -e "${GREEN}✓${NC} No uncommitted changes"
    ((PASS++))
  fi
  
  # Check current branch
  BRANCH=$(git rev-parse --abbrev-ref HEAD)
  echo -e "${GREEN}ℹ${NC} Current branch: $BRANCH"
else
  echo -e "${RED}✗${NC} Git repository not initialized"
  ((FAIL++))
fi
echo ""

# Summary
echo "======================================"
echo "         Audit Summary"
echo "======================================"
echo -e "${GREEN}Passed:${NC}  $PASS"
echo -e "${RED}Failed:${NC}  $FAIL"
echo -e "${YELLOW}Warnings:${NC} $WARN"
echo ""

if [ $FAIL -eq 0 ]; then
  echo -e "${GREEN}✓ Repository is ready for deployment!${NC}"
  exit 0
else
  echo -e "${RED}✗ Fix the issues above before deploying.${NC}"
  exit 1
fi
