# macOS Installation Instructions

## 🚨 If you see "DocuSafely.app is damaged and can't be opened"

This is a macOS security feature that blocks unsigned applications. The app is completely safe to use. Here are several ways to fix this:

## ✅ Solution 1: Right-Click Method (Easiest)

1. **Right-click** on `DocuSafely.app` (don't double-click)
2. Select **"Open"** from the context menu
3. Click **"Open"** in the security dialog that appears
4. The app will now open normally

## ✅ Solution 2: Command Line Method

1. Open **Terminal** (Applications → Utilities → Terminal)
2. Type this command (replace `/path/to/` with the actual path to your app):
   ```bash
   xattr -cr /path/to/DocuSafely.app
   ```
3. Press Enter
4. Double-click the app to open it

**Example:**
```bash
# If the app is on your Desktop:
xattr -cr ~/Desktop/DocuSafely.app

# If the app is in Downloads:
xattr -cr ~/Downloads/DocuSafely.app
```

## ✅ Solution 3: System Settings Method

1. Go to **System Settings** (or System Preferences on older macOS)
2. Click **Privacy & Security**
3. Scroll down to the **Security** section
4. Look for a message about DocuSafely being blocked
5. Click **"Open Anyway"**

## ✅ Solution 4: For DMG Files

If you downloaded a `.dmg` file:

1. **Right-click** on the DMG file
2. Select **"Open"** from the context menu
3. Click **"Open"** in the security dialog
4. The DMG will mount and you can install the app

## 🔍 Why This Happens

- **macOS Gatekeeper** is a security feature that blocks unsigned applications
- This is normal for apps that don't have an Apple Developer certificate
- The app is completely safe - this is just macOS being cautious
- Once you open it the first time, macOS will remember and trust it

## 🚀 After Installation

Once you've successfully opened the app:

1. **Drag** `DocuSafely.app` to your **Applications** folder
2. You can now open it normally from Applications or Launchpad
3. No more security warnings!

## 📞 Still Having Issues?

If none of the above solutions work:

1. **Check your macOS version** - requires macOS 11.0 (Big Sur) or later
2. **Try downloading again** - the file might have been corrupted
3. **Check your internet connection** - needed for some security checks

## 🔒 Security Note

DocuSafely is a legitimate document masking application. The security warning appears because we haven't paid Apple for a code signing certificate ($99/year), but the app is completely safe to use.

---

**DocuSafely v1.0.2** - Enhanced PDF Processing and Document Masking
