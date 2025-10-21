# Build Rules and Version Management

## 🎯 Overview

This document defines the rules and processes for ensuring consistent version numbering and build management across the DocuSafely Desktop application.

## 📋 Version Consistency Rules

### Rule 1: Single Source of Truth
- **Git Tag** is the primary source of truth for version numbers
- **package.json** version must match the git tag version
- **Built packages** must use the same version as the git tag

### Rule 2: Version Format
- Use semantic versioning: `MAJOR.MINOR.PATCH`
- Examples: `1.0.0`, `1.0.1`, `1.1.0`, `2.0.0`
- Git tags should use format: `v1.0.2` (with 'v' prefix)

### Rule 3: Version Synchronization
- Before creating a git tag, update `package.json` version
- After tagging, verify built packages use correct version
- All build artifacts must reflect the tag version

## 🔧 Build Process Rules

### Rule 4: Pre-Release Checklist
Before creating any release tag, ensure:

1. **Version Consistency Check**
   ```bash
   # Check current package.json version
   grep '"version"' package.json
   
   # Verify it matches intended tag version
   ```

2. **Update package.json Version**
   ```bash
   # Update version in package.json to match intended tag
   npm version 1.0.2 --no-git-tag-version
   ```

3. **Commit Version Update**
   ```bash
   git add package.json
   git commit -m "Bump version to 1.0.2"
   ```

4. **Create and Push Tag**
   ```bash
   git tag -a v1.0.2 -m "Release v1.0.2: [release notes]"
   git push origin master
   git push origin v1.0.2
   ```

### Rule 5: Automated Version Extraction
The GitHub Actions workflow should automatically extract version from git tag:

```yaml
# Extract version from tag (remove 'v' prefix if present)
- name: Extract version
  run: |
    if [[ $GITHUB_REF == refs/tags/v* ]]; then
      VERSION=${GITHUB_REF#refs/tags/v}
    else
      VERSION=${GITHUB_REF#refs/tags/}
    fi
    echo "VERSION=$VERSION" >> $GITHUB_ENV
    echo "Extracted version: $VERSION"
```

### Rule 6: Build Artifact Naming
All build artifacts must use the extracted version:

- Windows: `DocuSafely-{VERSION}-win.zip`
- macOS: `DocuSafely-{VERSION}-arm64.dmg`
- Linux: `DocuSafely-{VERSION}.AppImage`

## 🚨 Common Issues and Solutions

### Issue 1: Version Mismatch
**Problem**: Git tag is v1.0.2 but packages show 1.0.0

**Root Cause**: package.json version not updated before tagging

**Solution**:
1. Update package.json version to match tag
2. Commit the change
3. Create new tag with correct version

### Issue 2: Build Artifacts Use Wrong Version
**Problem**: Built packages don't reflect git tag version

**Root Cause**: GitHub Actions not extracting version from tag

**Solution**: Update workflow to extract and use tag version

### Issue 3: Manual Version Updates
**Problem**: Forgetting to update version before release

**Solution**: Use automated scripts and pre-commit hooks

## 📝 Implementation Scripts

### Pre-Release Script
Create `scripts/pre-release.sh`:

```bash
#!/bin/bash
set -e

# Check if version argument provided
if [ -z "$1" ]; then
    echo "Usage: $0 <version>"
    echo "Example: $0 1.0.2"
    exit 1
fi

VERSION=$1
echo "Preparing release for version: $VERSION"

# Update package.json version
npm version $VERSION --no-git-tag-version

# Commit version update
git add package.json
git commit -m "Bump version to $VERSION"

# Create tag
git tag -a v$VERSION -m "Release v$VERSION"

echo "Version $VERSION prepared. Run 'git push origin master && git push origin v$VERSION' to release."
```

### Version Check Script
Create `scripts/check-version.sh`:

```bash
#!/bin/bash

# Get version from package.json
PACKAGE_VERSION=$(grep '"version"' package.json | cut -d'"' -f4)

# Get latest git tag
GIT_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "no-tags")

echo "Package.json version: $PACKAGE_VERSION"
echo "Latest git tag: $GIT_TAG"

if [[ "$GIT_TAG" == "v$PACKAGE_VERSION" ]]; then
    echo "✅ Versions match"
    exit 0
else
    echo "❌ Version mismatch!"
    exit 1
fi
```

## 🔄 GitHub Actions Workflow Updates

### Updated Workflow Steps
Add version extraction to build workflow:

```yaml
- name: Extract version from tag
  run: |
    if [[ $GITHUB_REF == refs/tags/v* ]]; then
      VERSION=${GITHUB_REF#refs/tags/v}
    else
      VERSION=${GITHUB_REF#refs/tags/}
    fi
    echo "VERSION=$VERSION" >> $GITHUB_ENV
    echo "Extracted version: $VERSION"

- name: Update package.json version
  run: |
    npm version $VERSION --no-git-tag-version
    echo "Updated package.json to version $VERSION"
```

## 📊 Validation Rules

### Rule 7: Build Validation
After each build, validate:

1. **Version Consistency**: All artifacts use correct version
2. **File Naming**: Artifacts follow naming convention
3. **Functionality**: Built packages work correctly

### Rule 8: Release Validation
Before marking release as complete:

1. **Download and test** at least one artifact per platform
2. **Verify version** appears correctly in application
3. **Check functionality** of key features

## 🎯 Best Practices

### Practice 1: Semantic Versioning
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Practice 2: Release Notes
Always include comprehensive release notes in git tag message:

```bash
git tag -a v1.0.2 -m "Release v1.0.2: Enhanced PDF Processing

- Fixed PDF text extraction in dry-run CLI
- Improved entity detection accuracy
- Enhanced cross-platform compatibility
- Updated documentation and build processes

Breaking Changes: None
New Features: Enhanced PDF processing
Bug Fixes: Fixed version consistency issues"
```

### Practice 3: Automated Testing
- Run full test suite before tagging
- Validate build artifacts after creation
- Test on multiple platforms when possible

## 🚀 Quick Reference

### Creating a New Release
```bash
# 1. Update version in package.json
npm version 1.0.3 --no-git-tag-version

# 2. Commit version update
git add package.json
git commit -m "Bump version to 1.0.3"

# 3. Create and push tag
git tag -a v1.0.3 -m "Release v1.0.3: [release notes]"
git push origin master
git push origin v1.0.3
```

### Checking Version Consistency
```bash
# Run version check script
./scripts/check-version.sh

# Or manually check
grep '"version"' package.json
git describe --tags --abbrev=0
```

### Emergency Fix for Version Mismatch
```bash
# If packages built with wrong version:
# 1. Delete incorrect tag
git tag -d v1.0.2
git push origin :refs/tags/v1.0.2

# 2. Update package.json to correct version
npm version 1.0.2 --no-git-tag-version

# 3. Commit and retag
git add package.json
git commit -m "Fix version to 1.0.2"
git tag -a v1.0.2 -m "Release v1.0.2: [release notes]"
git push origin master
git push origin v1.0.2
```

---

## 📞 Support

For questions about build rules or version management:
1. Check this document first
2. Review recent git commits and tags
3. Consult the team lead or maintainer

**Last Updated**: $(date)
**Version**: 1.0
