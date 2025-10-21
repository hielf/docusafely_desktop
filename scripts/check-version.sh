#!/bin/bash

# Version consistency check script for DocuSafely Desktop
# Ensures package.json version matches the latest git tag

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --verbose    Show detailed version information"
    echo "  --help       Show this help message"
    echo ""
    echo "This script checks:"
    echo "  1. Version in package.json"
    echo "  2. Latest git tag"
    echo "  3. Version consistency between them"
}

# Parse command line arguments
VERBOSE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --verbose|-v)
            VERBOSE=true
            shift
            ;;
        --help|-h)
            show_usage
            exit 0
            ;;
        -*)
            print_error "Unknown option $1"
            show_usage
            exit 1
            ;;
        *)
            print_error "Unexpected argument: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    print_error "Not in a git repository"
    exit 1
fi

# Check if package.json exists
if [ ! -f "package.json" ]; then
    print_error "package.json not found in current directory"
    exit 1
fi

print_status "Checking version consistency..."

# Get version from package.json
PACKAGE_VERSION=$(grep '"version"' package.json | cut -d'"' -f4)
if [ -z "$PACKAGE_VERSION" ]; then
    print_error "Could not extract version from package.json"
    exit 1
fi

print_status "Package.json version: $PACKAGE_VERSION"

# Get latest git tag
GIT_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "no-tags")
if [ "$GIT_TAG" = "no-tags" ]; then
    print_warning "No git tags found in repository"
    if [ "$VERBOSE" = true ]; then
        print_status "This is normal for a new repository without any releases"
    fi
    exit 0
fi

print_status "Latest git tag: $GIT_TAG"

# Check if tag has 'v' prefix
if [[ "$GIT_TAG" == v* ]]; then
    GIT_VERSION=${GIT_TAG#v}
    print_status "Git tag version (without 'v'): $GIT_VERSION"
else
    GIT_VERSION=$GIT_TAG
    print_status "Git tag version: $GIT_VERSION"
fi

# Compare versions
if [[ "$GIT_VERSION" == "$PACKAGE_VERSION" ]]; then
    print_success "Versions match! ✅"
    if [ "$VERBOSE" = true ]; then
        echo ""
        print_status "Detailed information:"
        echo "  Package.json: $PACKAGE_VERSION"
        echo "  Git tag: $GIT_TAG"
        echo "  Extracted version: $GIT_VERSION"
        echo "  Status: Consistent"
    fi
    exit 0
else
    print_error "Version mismatch! ❌"
    echo ""
    print_error "Package.json version: $PACKAGE_VERSION"
    print_error "Git tag version: $GIT_VERSION"
    echo ""
    print_status "To fix this:"
    echo "  1. If package.json is correct: Create a new tag"
    echo "     git tag -a v$PACKAGE_VERSION -m 'Release v$PACKAGE_VERSION'"
    echo ""
    echo "  2. If git tag is correct: Update package.json"
    echo "     npm version $GIT_VERSION --no-git-tag-version"
    echo ""
    echo "  3. Use the pre-release script for automated fix:"
    echo "     ./scripts/pre-release.sh $PACKAGE_VERSION"
    echo ""
    
    if [ "$VERBOSE" = true ]; then
        print_status "Additional information:"
        echo "  Current branch: $(git branch --show-current)"
        echo "  Latest commit: $(git rev-parse --short HEAD)"
        echo "  Tag count: $(git tag -l | wc -l)"
        
        if [ $(git tag -l | wc -l) -gt 0 ]; then
            echo "  All tags:"
            git tag -l | sort -V | tail -5
        fi
    fi
    
    exit 1
fi
