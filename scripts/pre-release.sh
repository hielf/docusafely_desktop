#!/bin/bash
set -e

# Pre-release script for DocuSafely Desktop
# Ensures version consistency between package.json and git tags

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
    echo "Usage: $0 <version> [options]"
    echo ""
    echo "Arguments:"
    echo "  <version>    Version number (e.g., 1.0.2)"
    echo ""
    echo "Options:"
    echo "  --dry-run    Show what would be done without making changes"
    echo "  --help       Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 1.0.2"
    echo "  $0 1.0.2 --dry-run"
    echo ""
    echo "This script will:"
    echo "  1. Update package.json version"
    echo "  2. Commit the version change"
    echo "  3. Create a git tag"
    echo "  4. Show push commands to run"
}

# Parse command line arguments
DRY_RUN=false
VERSION=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
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
            if [ -z "$VERSION" ]; then
                VERSION=$1
            else
                print_error "Multiple versions specified: $VERSION and $1"
                exit 1
            fi
            shift
            ;;
    esac
done

# Check if version is provided
if [ -z "$VERSION" ]; then
    print_error "Version is required"
    show_usage
    exit 1
fi

# Validate version format (basic semantic versioning)
if ! [[ $VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    print_error "Invalid version format: $VERSION"
    print_error "Expected format: MAJOR.MINOR.PATCH (e.g., 1.0.2)"
    exit 1
fi

print_status "Preparing release for version: $VERSION"

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    print_error "Not in a git repository"
    exit 1
fi

# Check if there are uncommitted changes
if ! git diff-index --quiet HEAD --; then
    print_error "You have uncommitted changes. Please commit or stash them first."
    git status --porcelain
    exit 1
fi

# Check if we're on master/main branch
CURRENT_BRANCH=$(git branch --show-current)
if [[ "$CURRENT_BRANCH" != "master" && "$CURRENT_BRANCH" != "main" ]]; then
    print_warning "You're not on master/main branch (currently on: $CURRENT_BRANCH)"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_error "Aborted"
        exit 1
    fi
fi

# Check if package.json exists
if [ ! -f "package.json" ]; then
    print_error "package.json not found in current directory"
    exit 1
fi

# Get current version from package.json
CURRENT_VERSION=$(grep '"version"' package.json | cut -d'"' -f4)
print_status "Current package.json version: $CURRENT_VERSION"

# Check if version already exists as a tag
if git tag -l | grep -q "^v$VERSION$"; then
    print_error "Tag v$VERSION already exists"
    print_status "Existing tags:"
    git tag -l | grep "v$VERSION"
    exit 1
fi

if [ "$DRY_RUN" = true ]; then
    print_status "DRY RUN MODE - No changes will be made"
    echo ""
    print_status "Would perform the following actions:"
    echo "  1. Update package.json version from $CURRENT_VERSION to $VERSION"
    echo "  2. Commit the version change"
    echo "  3. Create git tag v$VERSION"
    echo "  4. Show push commands"
    exit 0
fi

# Update package.json version
print_status "Updating package.json version to $VERSION..."
npm version $VERSION --no-git-tag-version

if [ $? -ne 0 ]; then
    print_error "Failed to update package.json version"
    exit 1
fi

print_success "Updated package.json to version $VERSION"

# Verify the update
NEW_VERSION=$(grep '"version"' package.json | cut -d'"' -f4)
if [ "$NEW_VERSION" != "$VERSION" ]; then
    print_error "Version update verification failed. Expected: $VERSION, Got: $NEW_VERSION"
    exit 1
fi

# Commit the version change
print_status "Committing version change..."
git add package.json
git commit -m "Bump version to $VERSION"

if [ $? -ne 0 ]; then
    print_error "Failed to commit version change"
    exit 1
fi

print_success "Committed version change"

# Create git tag
print_status "Creating git tag v$VERSION..."

# Prompt for release notes
echo ""
print_status "Enter release notes for this version (press Enter for default):"
read -r RELEASE_NOTES

if [ -z "$RELEASE_NOTES" ]; then
    RELEASE_NOTES="Release v$VERSION"
fi

git tag -a "v$VERSION" -m "$RELEASE_NOTES"

if [ $? -ne 0 ]; then
    print_error "Failed to create git tag"
    exit 1
fi

print_success "Created git tag v$VERSION"

# Show summary and next steps
echo ""
print_success "Release preparation complete!"
echo ""
print_status "Summary:"
echo "  Version: $VERSION"
echo "  Tag: v$VERSION"
echo "  Commit: $(git rev-parse HEAD)"
echo ""
print_status "Next steps:"
echo "  1. Push the commit: git push origin $CURRENT_BRANCH"
echo "  2. Push the tag: git push origin v$VERSION"
echo ""
print_status "Or run both commands:"
echo "  git push origin $CURRENT_BRANCH && git push origin v$VERSION"
echo ""

# Ask if user wants to push now
read -p "Push to remote now? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Pushing to remote..."
    
    git push origin "$CURRENT_BRANCH"
    if [ $? -ne 0 ]; then
        print_error "Failed to push commit"
        exit 1
    fi
    
    git push origin "v$VERSION"
    if [ $? -ne 0 ]; then
        print_error "Failed to push tag"
        exit 1
    fi
    
    print_success "Successfully pushed to remote!"
    print_status "GitHub Actions will now build the release automatically."
else
    print_status "Remember to push manually:"
    echo "  git push origin $CURRENT_BRANCH && git push origin v$VERSION"
fi
