# Create Your First Release

## 🚀 Quick Start

Your workflow is ready! The release job only runs when you **push a tag**. Here's how:

### Option 1: Create Release Now

```bash
cd /Users/jerrym/workspace/projects/docusafely_desktop

# Create tag with your format: version-build.number
git tag -a 1.0.0-1 -m "First release of DocuSafely Desktop

Features:
- Document masking with PII detection
- Support for PDF and TXT files
- Cross-platform support (Windows, macOS, Linux)
- Standalone executables - no Python needed

Includes:
- Windows installer
- macOS DMG and portable app
- Linux AppImage, DEB, and RPM packages"

# Push the tag to trigger release
git push origin 1.0.0-1
```

### What Will Happen:

1. ✅ **Workflow triggers** on tag push
2. ✅ **Backends build** (Windows, macOS, Linux) - ~5 min each
3. ✅ **Desktop apps package** for all platforms - ~5 min each
4. ✅ **Release created** automatically with all installers
5. ✅ **Total time:** ~15-20 minutes

---

## 📊 Monitoring the Release

### Step 1: Watch the Build

After pushing the tag:
```
https://github.com/hielf/docusafely_desktop/actions
```

You'll see:
- ✅ Build Backend - Windows
- ✅ Build Backend - macOS  
- ✅ Build Backend - Linux
- ✅ Build Desktop - Windows
- ✅ Build Desktop - macOS
- ✅ Build Desktop - Linux
- ✅ **Create Release** (this time it will RUN!)

### Step 2: Check the Release

Once complete:
```
https://github.com/hielf/docusafely_desktop/releases
```

You'll see release `1.0.0-1` with all installers attached!

---

## 🔍 Why Was Release Skipped Before?

### Previous Pushes (to branch):
```bash
git push origin master
# github.ref = "refs/heads/master"
# if: startsWith(github.ref, 'refs/tags/') → FALSE
# Release job: SKIPPED ⏭️
```

### Tag Push (this creates release):
```bash
git push origin 1.0.0-1
# github.ref = "refs/tags/1.0.0-1"
# if: startsWith(github.ref, 'refs/tags/') → TRUE
# Release job: RUNS ✅
```

This is **intentional design** - releases are only created for version tags!

---

## 🎯 Complete Test Command

Copy and paste this:

```bash
# Navigate to project
cd /Users/jerrym/workspace/projects/docusafely_desktop

# Ensure everything is committed
git status

# Create annotated tag
git tag -a 1.0.0-1 -m "First release"

# Push tag to trigger release
git push origin 1.0.0-1

# Open Actions page to watch
open https://github.com/hielf/docusafely_desktop/actions
```

---

## 📦 After Release is Created

Users can download from:
```
https://github.com/hielf/docusafely_desktop/releases/latest
```

Available downloads:
- **Windows:** `DocuSafely-Setup-1.0.0-1.exe`
- **macOS:** `DocuSafely-1.0.0-1-arm64.dmg`
- **Linux:** `DocuSafely-1.0.0-1.AppImage`

---

## 🔄 Future Releases

For subsequent releases:

```bash
# Bug fix release
git tag -a 1.0.0-2 -m "Build 2 - Bug fixes"
git push origin 1.0.0-2

# Patch version
git tag -a 1.0.1-1 -m "Patch release"
git push origin 1.0.1-1

# Minor version
git tag -a 1.1.0-1 -m "New features"
git push origin 1.1.0-1

# Beta release
git tag -a 1.2.0-beta.1 -m "Beta test"
git push origin 1.2.0-beta.1
```

Each tag push will automatically create a new release!

---

## 💡 Quick Reference

**Create release:**
```bash
git tag -a 1.0.0-1 -m "Message"
git push origin 1.0.0-1
```

**Check status:**
```bash
# View tags
git tag -l

# View workflow runs
https://github.com/hielf/docusafely_desktop/actions

# View releases
https://github.com/hielf/docusafely_desktop/releases
```

**Delete tag (if needed):**
```bash
# Delete local
git tag -d 1.0.0-1

# Delete remote
git push origin :refs/tags/1.0.0-1
```

---

## ✅ Ready to Create Your First Release?

Run this now:

```bash
cd /Users/jerrym/workspace/projects/docusafely_desktop
git tag -a 1.0.0-1 -m "First release"
git push origin 1.0.0-1
```

Then watch the magic happen! 🎉

---

**The release job will run this time because you're pushing a TAG, not a branch!**

