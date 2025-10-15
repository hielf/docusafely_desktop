# Release Guide - Automatic Release Creation

## 🎯 Overview

Releases are **automatically created** when you push a git tag. The GitHub Actions workflow builds for all platforms and creates a release with installers attached.

---

## 📦 Creating a Release

### Tag Format

Your preferred format: **`version-build.number`**

Examples:
- `1.0.0-1` - Version 1.0.0, Build 1
- `1.0.0-2` - Version 1.0.0, Build 2
- `1.2.3-15` - Version 1.2.3, Build 15
- `2.0.0-beta.1` - Beta release

Alternative formats (also supported):
- `v1.0.0` - Simple version tag
- `1.0.0` - Without 'v' prefix

---

## 🚀 Quick Release Process

### Step 1: Ensure Everything is Ready

```bash
cd docusafely_desktop

# Run pre-commit checks
bash scripts/pre-commit-check.sh

# Ensure all changes are committed
git status
```

### Step 2: Create and Push Tag

```bash
# Create a tag (format: version-build.number)
git tag 1.0.0-1

# Or with annotation (recommended)
git tag -a 1.0.0-1 -m "Release v1.0.0 Build 1

- Feature: Document masking
- Feature: PII detection
- Fix: Various bug fixes"

# Push the tag
git push origin 1.0.0-1
```

### Step 3: Wait for Build

1. Go to: https://github.com/hielf/docusafely_desktop/actions
2. Watch the workflow run (~15-20 minutes)
3. All platforms build in parallel

### Step 4: Release Created!

Once complete, the release appears at:
- https://github.com/hielf/docusafely_desktop/releases

---

## 📋 What Gets Built

### Windows
- `DocuSafely-Setup-1.0.0-1.exe` - Installer
- `DocuSafely-1.0.0-1-win.zip` - Portable version

### macOS
- `DocuSafely-1.0.0-1-arm64.dmg` - Disk image (recommended)
- `DocuSafely-1.0.0-1-arm64-mac.zip` - Portable app

### Linux
- `DocuSafely-1.0.0-1.AppImage` - Universal app
- `DocuSafely-1.0.0-1.deb` - Debian/Ubuntu
- `DocuSafely-1.0.0-1.rpm` - RedHat/Fedora

---

## 🔢 Version Numbering

Recommended semantic versioning:

```
MAJOR.MINOR.PATCH-BUILD

1.0.0-1     Initial release, Build 1
1.0.0-2     Same version, Build 2 (hotfix)
1.0.1-1     Patch release, Build 1
1.1.0-1     Minor release, Build 1
2.0.0-1     Major release, Build 1
```

**Rules:**
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes
- **BUILD**: Incremental build number

---

## 📝 Complete Example

```bash
# 1. Make your changes
vim src/main.js
git add .
git commit -m "Add new feature"

# 2. Run checks
bash scripts/pre-commit-check.sh

# 3. Push changes
git push origin master

# 4. Create release tag
git tag -a 1.0.0-1 -m "Release v1.0.0 Build 1

Features:
- Document masking with PII detection
- Support for PDF and TXT files
- Configurable masking policies

Fixes:
- Fix file path handling on Windows
- Improve error messages"

# 5. Push tag to trigger release
git push origin 1.0.0-1

# 6. Monitor build
# https://github.com/hielf/docusafely_desktop/actions

# 7. Release published!
# https://github.com/hielf/docusafely_desktop/releases
```

---

## 🎨 Release Types

### Regular Release
```bash
git tag 1.0.0-1
git push origin 1.0.0-1
```
Result: **Public release** (default)

### Beta Release
```bash
git tag 1.0.0-beta.1
git push origin 1.0.0-beta.1
```
Result: **Pre-release** (marked as beta)

### Alpha Release
```bash
git tag 1.0.0-alpha.1
git push origin 1.0.0-alpha.1
```
Result: **Pre-release** (marked as alpha)

---

## 🔄 Release Workflow

```
┌─────────────────┐
│  Push Git Tag   │
│  (1.0.0-1)      │
└────────┬────────┘
         │
         ├─────────────────────────────────────────┐
         │                                         │
         ▼                                         ▼
┌────────────────┐                    ┌────────────────────┐
│ Build Backend  │                    │  Build Backend     │
│   (Windows)    │                    │    (macOS)         │
└────────┬───────┘                    └─────────┬──────────┘
         │                                      │
         ▼                                      ▼
┌────────────────┐                    ┌────────────────────┐
│ Build Desktop  │                    │  Build Desktop     │
│   (Windows)    │                    │    (macOS)         │
└────────┬───────┘                    └─────────┬──────────┘
         │                                      │
         └──────────────┬───────────────────────┘
                        │
                        ▼
              ┌─────────────────┐
              │ Create Release  │
              │ Attach Files    │
              └─────────────────┘
                        │
                        ▼
              ┌─────────────────┐
              │ Release Published│
              │ on GitHub       │
              └─────────────────┘
```

---

## 🛠️ Advanced Options

### Update an Existing Release

```bash
# Delete the tag locally
git tag -d 1.0.0-1

# Delete the tag remotely
git push origin :refs/tags/1.0.0-1

# Delete the release on GitHub (manually in UI)

# Recreate the tag
git tag -a 1.0.0-1 -m "Updated release"
git push origin 1.0.0-1
```

### Create Draft Release

Edit `.github/workflows/build-all-platforms.yml`:
```yaml
draft: true  # Instead of false
```

### Skip Release Creation

Don't push tags, just push to branches:
```bash
git push origin master  # No release
```

---

## 📊 Release Checklist

Before creating a release:

- [ ] All tests passing locally
- [ ] Pre-commit checks pass
- [ ] CI/CD passing on master branch
- [ ] Version number decided
- [ ] Release notes written
- [ ] Backend built and tested
- [ ] Frontend tested locally
- [ ] Documentation updated
- [ ] CHANGELOG updated (if you have one)

---

## 🎯 Quick Commands Reference

```bash
# List all tags
git tag -l

# Create annotated tag
git tag -a 1.0.0-1 -m "Release message"

# Push specific tag
git push origin 1.0.0-1

# Push all tags
git push origin --tags

# Delete local tag
git tag -d 1.0.0-1

# Delete remote tag
git push origin :refs/tags/1.0.0-1

# Show tag info
git show 1.0.0-1

# Create tag from specific commit
git tag -a 1.0.0-1 <commit-hash> -m "Message"
```

---

## 📦 What Users Download

After release is published, users can:

1. Go to: https://github.com/hielf/docusafely_desktop/releases
2. Click on the latest release
3. Download the installer for their platform
4. Install and run - **No Python needed!**

---

## 🔍 Monitoring Releases

### Check Build Status
```bash
# View Actions
https://github.com/hielf/docusafely_desktop/actions

# View Releases
https://github.com/hielf/docusafely_desktop/releases

# View specific release
https://github.com/hielf/docusafely_desktop/releases/tag/1.0.0-1
```

### Download Artifacts During Build

If you want to test before release is published:
1. Go to Actions tab
2. Click on the workflow run
3. Scroll to "Artifacts" section
4. Download platform-specific builds

---

## 🐛 Troubleshooting

### Release Not Created

**Cause:** Tag format doesn't match

**Solution:** Ensure tag matches patterns:
- `v*` (like v1.0.0)
- `*-*` (like 1.0.0-1)

### Files Not Attached

**Cause:** Artifacts not found

**Check:**
- Build jobs completed successfully
- Artifact names match in release job
- Look at "Display downloaded artifacts" step in logs

### Build Failed

**Cause:** Code issues or dependencies

**Solution:**
1. Check Actions logs
2. Fix issues
3. Delete tag and recreate

---

## 💡 Tips

1. **Test before tagging** - Always test locally first
2. **Use annotated tags** - Include release notes in tag message
3. **Follow semantic versioning** - Makes version management easier
4. **Keep changelog** - Document what changed
5. **Draft releases** - Review before publishing (set draft: true)
6. **Beta testing** - Use beta/alpha tags for pre-releases

---

## 🎉 Example Release Flow

```bash
# Day 1: Development
git commit -m "Add feature X"
git commit -m "Fix bug Y"
git push origin master

# Day 2: Testing
bash scripts/pre-commit-check.sh
# All tests pass ✓

# Day 3: Release!
git tag -a 1.0.0-1 -m "First production release

Features:
- Document masking
- PII detection  
- PDF support

Improvements:
- Better error handling
- Faster processing"

git push origin 1.0.0-1

# ~20 minutes later: Release is live! 🎉
```

---

## 📞 Next Steps

After your first release:

1. **Announce it!** Share the release link
2. **Get feedback** from users
3. **Plan next version** based on feedback
4. **Iterate** and release 1.0.0-2, 1.0.1-1, etc.

---

**Your releases are now fully automated!** Just push a tag and everything else happens automatically! 🚀

