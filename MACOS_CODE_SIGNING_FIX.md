# macOS Code Signing Fix - "App is damaged" Issue

## 🚨 Problem
Users getting error: **"DocuSafely.app" is damaged and can't be opened. You should move it to the Trash**

## 🔍 Root Cause
- **macOS Gatekeeper** blocks unsigned applications
- The app is **not code-signed** or **notarized**
- This is a security feature in macOS to prevent malicious software

## ✅ Immediate Solutions

### Solution 1: Remove Quarantine Attribute (Quick Fix)
```bash
# Remove quarantine attribute from the app
xattr -cr /path/to/DocuSafely.app

# Or for the DMG file
xattr -cr /path/to/DocuSafely-1.0.2-arm64.dmg
```

### Solution 2: Right-Click Method (User-Friendly)
1. **Right-click** on `DocuSafely.app`
2. Select **"Open"** from the context menu
3. Click **"Open"** in the security dialog
4. The app will be trusted and open normally

### Solution 3: System Settings Override
1. Go to **System Settings** → **Privacy & Security**
2. Scroll down to **Security**
3. Look for a message about DocuSafely being blocked
4. Click **"Open Anyway"**

## 🔧 Permanent Solutions

### Option A: Code Signing Setup (Recommended for Production)

#### 1. Get Apple Developer Account
- Sign up at [developer.apple.com](https://developer.apple.com)
- Cost: $99/year for individual, $99/year for organization
- Required for code signing and notarization

#### 2. Configure Code Signing in package.json
Add to the `build` section in `package.json`:

```json
{
  "build": {
    "mac": {
      "category": "public.app-category.utilities",
      "target": [
        {
          "target": "dmg",
          "arch": ["arm64"]
        },
        {
          "target": "zip",
          "arch": ["arm64"]
        }
      ],
      "hardenedRuntime": true,
      "gatekeeperAssess": false,
      "entitlements": "build/entitlements.mac.plist",
      "entitlementsInherit": "build/entitlements.mac.plist",
      "identity": "Developer ID Application: Your Name (TEAM_ID)"
    }
  }
}
```

#### 3. Create Entitlements File
Create `build/entitlements.mac.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>com.apple.security.cs.allow-jit</key>
  <true/>
  <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
  <true/>
  <key>com.apple.security.cs.allow-dyld-environment-variables</key>
  <true/>
  <key>com.apple.security.cs.disable-library-validation</key>
  <true/>
</dict>
</plist>
```

#### 4. Environment Variables for CI/CD
Add to GitHub Actions workflow:

```yaml
- name: Build macOS desktop app
  run: npm run build:mac
  env:
    GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    CSC_LINK: ${{ secrets.MACOS_CERTIFICATE_BASE64 }}
    CSC_KEY_PASSWORD: ${{ secrets.MACOS_CERTIFICATE_PASSWORD }}
    APPLE_ID: ${{ secrets.APPLE_ID }}
    APPLE_PASSWORD: ${{ secrets.APPLE_APP_SPECIFIC_PASSWORD }}
    APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
```

### Option B: Ad Hoc Signing (Free Alternative)

#### 1. Create Self-Signed Certificate
```bash
# Create a self-signed certificate
security create-keypair -a rsa -s 2048 -f /Users/$(whoami)/Library/Keychains/login.keychain-db -c "DocuSafely Developer" -u "DocuSafely Developer"
```

#### 2. Configure package.json for Ad Hoc Signing
```json
{
  "build": {
    "mac": {
      "identity": "DocuSafely Developer"
    }
  }
}
```

### Option C: Disable Code Signing (Not Recommended)
```json
{
  "build": {
    "mac": {
      "identity": null
    }
  }
}
```

## 🚀 Updated Build Configuration

### Enhanced package.json Configuration
```json
{
  "build": {
    "appId": "com.docusafely.desktop",
    "productName": "DocuSafely",
    "directories": {
      "output": "dist"
    },
    "mac": {
      "category": "public.app-category.utilities",
      "target": [
        {
          "target": "dmg",
          "arch": ["arm64"]
        },
        {
          "target": "zip", 
          "arch": ["arm64"]
        }
      ],
      "hardenedRuntime": true,
      "gatekeeperAssess": false,
      "entitlements": "build/entitlements.mac.plist",
      "entitlementsInherit": "build/entitlements.mac.plist",
      "identity": "Developer ID Application: Your Name (TEAM_ID)"
    },
    "dmg": {
      "title": "DocuSafely ${version}",
      "artifactName": "DocuSafely-${version}-${arch}.dmg",
      "background": "build/background.png",
      "window": {
        "width": 540,
        "height": 380
      },
      "contents": [
        {
          "x": 140,
          "y": 200,
          "type": "file"
        },
        {
          "x": 400,
          "y": 200,
          "type": "link",
          "path": "/Applications"
        }
      ]
    }
  }
}
```

## 📋 User Instructions for Current Release

### For End Users (No Code Signing)
Add this to your release notes:

```
## macOS Installation Instructions

If you see "DocuSafely.app is damaged and can't be opened":

**Option 1: Right-click Method**
1. Right-click on DocuSafely.app
2. Select "Open" from the menu
3. Click "Open" in the security dialog

**Option 2: Command Line Method**
1. Open Terminal
2. Run: xattr -cr /path/to/DocuSafely.app
3. Double-click the app to open

**Option 3: System Settings**
1. Go to System Settings → Privacy & Security
2. Scroll to Security section
3. Click "Open Anyway" for DocuSafely

This is a macOS security feature for unsigned apps and is completely safe.
```

## 🔄 GitHub Actions Workflow Update

### Add Code Signing to Build Process
```yaml
- name: Build macOS desktop app
  run: npm run build:mac
  env:
    GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    CSC_LINK: ${{ secrets.MACOS_CERTIFICATE_BASE64 }}
    CSC_KEY_PASSWORD: ${{ secrets.MACOS_CERTIFICATE_PASSWORD }}
    APPLE_ID: ${{ secrets.APPLE_ID }}
    APPLE_PASSWORD: ${{ secrets.APPLE_APP_SPECIFIC_PASSWORD }}
    APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}

- name: Notarize macOS app
  if: success()
  run: |
    # Upload for notarization
    xcrun notarytool submit "dist/DocuSafely-${VERSION}-arm64.dmg" \
      --apple-id "$APPLE_ID" \
      --password "$APPLE_PASSWORD" \
      --team-id "$APPLE_TEAM_ID" \
      --wait

- name: Staple notarization
  if: success()
  run: |
    xcrun stapler staple "dist/DocuSafely-${VERSION}-arm64.dmg"
```

## 🎯 Immediate Action Plan

### For Current Release (v1.0.2)
1. **Add user instructions** to release notes
2. **Provide the xattr command** for technical users
3. **Document the right-click workaround**

### For Future Releases
1. **Set up Apple Developer account** ($99/year)
2. **Configure code signing** in package.json
3. **Update GitHub Actions** with signing secrets
4. **Add notarization** for full trust

## 📊 Cost-Benefit Analysis

| Option | Cost | Security | User Experience | Recommendation |
|--------|------|----------|-----------------|----------------|
| **No Signing** | Free | ⚠️ Warning | ❌ Poor | Development only |
| **Self-Signed** | Free | ⚠️ Warning | ⚠️ Moderate | Internal use |
| **Apple Signing** | $99/year | ✅ Trusted | ✅ Excellent | Production |
| **Apple + Notarization** | $99/year | ✅ Fully Trusted | ✅ Perfect | Public release |

## 🚀 Quick Implementation

### Immediate Fix (5 minutes)
```bash
# Update package.json to disable gatekeeper assessment
```

```json
{
  "build": {
    "mac": {
      "gatekeeperAssess": false
    }
  }
}
```

### Long-term Fix (1-2 hours)
1. Get Apple Developer account
2. Create certificates
3. Configure signing in package.json
4. Update CI/CD pipeline

---

**Status**: ✅ Solutions provided
**Priority**: High for user experience
**Timeline**: Immediate workaround + long-term signing setup
