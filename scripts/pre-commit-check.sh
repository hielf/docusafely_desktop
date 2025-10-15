#!/bin/bash
###############################################################################
# Pre-Commit Check Script
# Runs comprehensive tests before committing to GitHub
###############################################################################

# Don't use set -e as arithmetic operations can trigger false exits

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     DocuSafely Desktop - Pre-Commit Checks                ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

ERRORS=0
WARNINGS=0

# Function to print status
print_status() {
    local status=$1
    local message=$2
    if [ "$status" = "OK" ]; then
        echo -e "${GREEN}✓${NC} $message"
    elif [ "$status" = "WARN" ]; then
        echo -e "${YELLOW}⚠${NC} $message"
        ((WARNINGS++))
    elif [ "$status" = "ERROR" ]; then
        echo -e "${RED}✗${NC} $message"
        ((ERRORS++))
    else
        echo -e "${BLUE}ℹ${NC} $message"
    fi
}

# Check we're in the right directory
if [ ! -f "package.json" ]; then
    print_status "ERROR" "Run this from docusafely_desktop root directory"
    exit 1
fi

print_status "INFO" "Starting checks..."
echo ""

###############################################################################
# 1. Check Git Status
###############################################################################
echo -e "${BLUE}[1/7] Checking Git Status...${NC}"

if ! git diff --quiet || ! git diff --cached --quiet; then
    print_status "OK" "Uncommitted changes detected"
else
    print_status "WARN" "No uncommitted changes found"
fi

# Check for untracked files
UNTRACKED=$(git ls-files --others --exclude-standard)
if [ -n "$UNTRACKED" ]; then
    print_status "WARN" "Untracked files found: $(echo $UNTRACKED | wc -w) files"
fi

echo ""

###############################################################################
# 2. Check Node.js Dependencies
###############################################################################
echo -e "${BLUE}[2/7] Checking Node.js Dependencies...${NC}"

if [ ! -d "node_modules" ]; then
    print_status "WARN" "node_modules not found, running npm install..."
    npm install
else
    print_status "OK" "node_modules exists"
fi

# Check if package-lock.json is in sync
if npm outdated 2>&1 | grep -q "Package"; then
    print_status "WARN" "Some npm packages have updates available"
else
    print_status "OK" "All npm packages up to date"
fi

echo ""

###############################################################################
# 3. Lint Check (if applicable)
###############################################################################
echo -e "${BLUE}[3/7] Running Linters...${NC}"

# Check if eslint exists
if [ -f ".eslintrc.json" ] || [ -f ".eslintrc.js" ]; then
    if npm run lint 2>/dev/null; then
        print_status "OK" "ESLint passed"
    else
        print_status "WARN" "ESLint not configured or failed"
    fi
else
    print_status "INFO" "No ESLint configuration found (skipping)"
fi

echo ""

###############################################################################
# 4. Run Frontend Tests
###############################################################################
echo -e "${BLUE}[4/7] Running Frontend Tests...${NC}"

if npm test 2>&1; then
    print_status "OK" "All frontend tests passed"
else
    print_status "ERROR" "Frontend tests failed"
fi

echo ""

###############################################################################
# 5. Check Backend Exists
###############################################################################
echo -e "${BLUE}[5/7] Checking Backend Executable...${NC}"

BACKEND_PATH="backend/dist/processor"
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    BACKEND_PATH="backend/dist/processor.exe"
fi

if [ -f "$BACKEND_PATH" ]; then
    SIZE=$(du -h "$BACKEND_PATH" | cut -f1)
    print_status "OK" "Backend executable exists ($SIZE)"
    
    # Check if it's executable (Unix-like systems)
    if [[ "$OSTYPE" != "msys" && "$OSTYPE" != "win32" ]]; then
        if [ -x "$BACKEND_PATH" ]; then
            print_status "OK" "Backend is executable"
        else
            print_status "WARN" "Backend exists but not executable (chmod +x may be needed)"
        fi
    fi
else
    print_status "ERROR" "Backend executable not found at $BACKEND_PATH"
    echo "         Build it with: cd ../docusafely_core && python build_executable.py --frontend-path $(pwd)"
fi

echo ""

###############################################################################
# 6. Check Build Configuration
###############################################################################
echo -e "${BLUE}[6/7] Validating Build Configuration...${NC}"

# Check package.json exists and is valid
if node -e "require('./package.json')" 2>/dev/null; then
    print_status "OK" "package.json is valid JSON"
else
    print_status "ERROR" "package.json has syntax errors"
fi

# Check required build files
if [ -f "build/icon.png" ]; then
    print_status "OK" "Build icon exists"
else
    print_status "WARN" "build/icon.png not found"
fi

# Check main files exist
if [ -f "src/main.js" ] && [ -f "src/index.html" ]; then
    print_status "OK" "Core app files exist"
else
    print_status "ERROR" "Missing core app files (main.js or index.html)"
fi

echo ""

###############################################################################
# 7. Check Documentation
###############################################################################
echo -e "${BLUE}[7/7] Checking Documentation...${NC}"

DOCS=("README.md" "DISTRIBUTION_GUIDE.md" "WINDOWS_BUILD_GUIDE.md")
DOC_OK=0
for doc in "${DOCS[@]}"; do
    if [ -f "$doc" ]; then
        ((DOC_OK++))
    fi
done

print_status "OK" "$DOC_OK/${#DOCS[@]} documentation files present"

echo ""

###############################################################################
# Summary
###############################################################################
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    Check Summary                           ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    echo ""
    echo -e "${GREEN}Ready to commit and push to GitHub!${NC}"
    echo ""
    echo "Next steps:"
    echo "  git add ."
    echo "  git commit -m 'Your commit message'"
    echo "  git push origin master"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠ ${WARNINGS} warning(s) found${NC}"
    echo ""
    echo -e "${YELLOW}Warnings won't block the commit, but consider fixing them.${NC}"
    echo ""
    echo "Continue with commit? (Warnings are acceptable)"
    exit 0
else
    echo -e "${RED}✗ ${ERRORS} error(s) found${NC}"
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}⚠ ${WARNINGS} warning(s) found${NC}"
    fi
    echo ""
    echo -e "${RED}Please fix errors before committing!${NC}"
    exit 1
fi

