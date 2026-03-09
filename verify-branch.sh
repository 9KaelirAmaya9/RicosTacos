#!/bin/bash

# Branch Verification Script
# Run this script to verify your branch is ready for merging

set -e  # Exit on error

echo "🔍 Verifying branch readiness..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're on a branch (not detached HEAD)
if ! git rev-parse --abbrev-ref HEAD > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: Not in a git repository${NC}"
    exit 1
fi

CURRENT_BRANCH=$(git branch --show-current)
echo "📌 Current branch: ${CURRENT_BRANCH}"
echo ""

# Check if on main branch
if [ "$CURRENT_BRANCH" = "main" ]; then
    echo -e "${YELLOW}⚠️  Warning: You are on the main branch${NC}"
    echo "This script is meant to verify feature branches before merging to main."
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check for uncommitted changes
echo "1️⃣  Checking for uncommitted changes..."
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}⚠️  Warning: Uncommitted changes detected${NC}"
    git status --short
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo -e "${GREEN}✅ No uncommitted changes${NC}"
fi
echo ""

# Check if branch is up to date with remote
echo "2️⃣  Checking if branch is up to date..."
git fetch origin > /dev/null 2>&1
LOCAL=$(git rev-parse @)
REMOTE=$(git rev-parse @{u} 2>/dev/null || echo "")
if [ -n "$REMOTE" ] && [ "$LOCAL" != "$REMOTE" ]; then
    echo -e "${YELLOW}⚠️  Warning: Branch is not up to date with remote${NC}"
    echo "Run: git pull origin $CURRENT_BRANCH"
else
    echo -e "${GREEN}✅ Branch is up to date${NC}"
fi
echo ""

# Check for merge conflicts with main
echo "3️⃣  Checking for potential merge conflicts with main..."
git fetch origin main > /dev/null 2>&1
if git merge-base --is-ancestor origin/main HEAD 2>/dev/null; then
    echo -e "${GREEN}✅ No merge conflicts detected${NC}"
else
    echo -e "${YELLOW}⚠️  Potential merge conflicts with main${NC}"
    echo "Run: git merge origin/main to check for conflicts"
fi
echo ""

# Run build
echo "4️⃣  Running build..."
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Build passed${NC}"
else
    echo -e "${RED}❌ Build failed!${NC}"
    echo "Run 'npm run build' to see errors"
    exit 1
fi
echo ""

# Run linter
echo "5️⃣  Running linter..."
if npm run lint > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Linter passed${NC}"
else
    echo -e "${RED}❌ Linter failed!${NC}"
    echo "Run 'npm run lint' to see errors"
    exit 1
fi
echo ""

# Check for node_modules (optional)
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  Warning: node_modules not found${NC}"
    echo "Run: npm install"
fi
echo ""

# Summary
echo "════════════════════════════════════════════════════════"
echo -e "${GREEN}✅ Branch verification complete!${NC}"
echo ""
echo "📋 Next steps:"
echo "1. Complete manual testing"
echo "2. Verify all functionality works"
echo "3. Check for no regressions"
echo "4. Create Pull Request on GitHub"
echo "5. Request review (if applicable)"
echo "6. Merge to main after approval"
echo "════════════════════════════════════════════════════════"

