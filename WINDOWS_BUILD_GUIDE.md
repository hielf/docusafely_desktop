# Windows Build Guide

## ⚠️ Current Issue

The Windows desktop app was built, but it contains the **macOS backend executable** instead of `processor.exe`. Windows users cannot run the macOS executable.

**What was built:**
- ✅ Windows Electron app: `dist/win-unpacked/DocuSafely.exe`
- ❌ Backend: Contains macOS executable (Mach-O arm64) instead of Windows .exe

---

## 🔧 Solutions to Build for Windows

### Solution 1: Build on Windows (Recommended for Testing)

**Requirements:**
- Access to a Windows machine
- Python 3.8+ installed on Windows
- Node.js installed on Windows

**Steps:**

#### A. Build Python Backend on Windows:
```cmd
# On Windows machine
cd C:\path\to\docusafely_core
python build_executable.py --frontend-path C:\path\to\docusafely_desktop
```

This creates: `docusafely_core/dist/processor.exe` (Windows executable)

#### B. Build Desktop App on Windows:
```cmd
# On Windows machine  
cd C:\path\to\docusafely_desktop
npm install
npm run build:win
```

This creates: `dist/DocuSafely Setup 1.0.0.exe` (Windows installer)

---

### Solution 2: GitHub Actions (Recommended for Production)

Build for all platforms automatically using GitHub Actions CI/CD.

**Setup:**

Create `.github/workflows/build.yml` in your repository:

```yaml
name: Build Desktop App

on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]
  workflow_dispatch:

jobs:
  # Build Python backends
  build-backend-windows:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        working-directory: docusafely_core
        run: |
          pip install -r requirements.txt
          pip install pyinstaller
      
      - name: Build Windows backend
        working-directory: docusafely_core
        run: python build_executable.py
      
      - name: Upload Windows backend
        uses: actions/upload-artifact@v3
        with:
          name: backend-windows
          path: docusafely_core/dist/processor.exe

  build-backend-macos:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        working-directory: docusafely_core
        run: |
          pip install -r requirements.txt
          pip install pyinstaller
      
      - name: Build macOS backend
        working-directory: docusafely_core
        run: python build_executable.py
      
      - name: Upload macOS backend
        uses: actions/upload-artifact@v3
        with:
          name: backend-macos
          path: docusafely_core/dist/processor

  # Build Desktop Apps
  build-desktop-windows:
    needs: build-backend-windows
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Download Windows backend
        uses: actions/download-artifact@v3
        with:
          name: backend-windows
          path: docusafely_desktop/backend/dist
      
      - name: Install dependencies
        working-directory: docusafely_desktop
        run: npm install
      
      - name: Build Windows app
        working-directory: docusafely_desktop
        run: npm run build:win
      
      - name: Upload Windows installer
        uses: actions/upload-artifact@v3
        with:
          name: windows-installer
          path: docusafely_desktop/dist/*.exe

  build-desktop-macos:
    needs: build-backend-macos
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Download macOS backend
        uses: actions/download-artifact@v3
        with:
          name: backend-macos
          path: docusafely_desktop/backend/dist
      
      - name: Make backend executable
        working-directory: docusafely_desktop
        run: chmod +x backend/dist/processor
      
      - name: Install dependencies
        working-directory: docusafely_desktop
        run: npm install
      
      - name: Build macOS app
        working-directory: docusafely_desktop
        run: npm run build:mac
      
      - name: Upload macOS installer
        uses: actions/upload-artifact@v3
        with:
          name: macos-installer
          path: |
            docusafely_desktop/dist/*.dmg
            docusafely_desktop/dist/*.zip
```

**After setup:**
- Push to GitHub
- Actions will build for both platforms automatically
- Download installers from Actions artifacts

---

### Solution 3: Cross-Platform Local Build (Advanced)

Use Docker or VMs to build for Windows from macOS.

**Using Docker (Windows container):**

```dockerfile
# Dockerfile.windows
FROM mcr.microsoft.com/windows/servercore:ltsc2022

# Install Python
RUN powershell -Command \
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; \
    Invoke-WebRequest -Uri https://www.python.org/ftp/python/3.11.0/python-3.11.0-amd64.exe -OutFile python-installer.exe; \
    Start-Process python-installer.exe -ArgumentList '/quiet','InstallAllUsers=1','PrependPath=1' -Wait; \
    Remove-Item python-installer.exe

# Install Node.js
RUN powershell -Command \
    Invoke-WebRequest -Uri https://nodejs.org/dist/v18.17.0/node-v18.17.0-x64.msi -OutFile node-installer.msi; \
    Start-Process msiexec.exe -ArgumentList '/i','node-installer.msi','/quiet' -Wait; \
    Remove-Item node-installer.msi

WORKDIR /app
```

**Note:** Windows containers require Windows host or Windows VM.

---

## 📋 Current Status

### macOS Build: ✅ Complete
- **Backend:** `processor` (61 MB, arm64, working)
- **App:** `DocuSafely-1.0.0-arm64.dmg` (288 MB, ready)
- **Status:** Ready for distribution

### Windows Build: ⚠️ Incomplete
- **Backend:** Contains macOS executable (won't work on Windows)
- **App:** `dist/win-unpacked/DocuSafely.exe` (packaged but backend wrong)
- **Status:** Needs Windows backend rebuild

---

## 🎯 Recommended Workflow

### For Immediate Testing (Windows):

1. **Get Windows machine or VM**
2. **Clone your repo on Windows**
3. **Build backend on Windows:**
   ```cmd
   cd docusafely_core
   pip install -r requirements.txt
   pip install pyinstaller
   python build_executable.py
   ```
4. **Copy `processor.exe` to macOS:**
   ```bash
   # On macOS
   # Place Windows processor.exe in:
   # docusafely_desktop/backend/dist/processor.exe
   ```
5. **Rebuild Windows app on macOS:**
   ```bash
   cd docusafely_desktop
   npm run build:win
   ```

### For Production (Multi-Platform):

1. **Set up GitHub Actions** (Solution 2 above)
2. **Push code to GitHub**
3. **Automated builds for Windows, macOS, Linux**
4. **Download installers from Actions**

---

## 📦 What You Need for Windows Distribution

### Required Files:
- ✅ Windows Electron app (created)
- ❌ `processor.exe` - Windows Python backend (needs building on Windows)

### To Complete:
1. Build Python backend on Windows → creates `processor.exe`
2. Place in `docusafely_desktop/backend/dist/processor.exe`
3. Rebuild: `npm run build:win`

---

## 🔄 Quick Fix (Manual Copy)

If you have a Windows machine available:

**On Windows:**
```cmd
cd docusafely_core
python build_executable.py
# Creates: dist/processor.exe
```

**Transfer to macOS:**
```bash
# Copy processor.exe to:
/Users/jerrym/workspace/projects/docusafely_desktop/backend/dist/processor.exe
```

**On macOS:**
```bash
cd docusafely_desktop
npm run build:win
# Now includes correct Windows backend!
```

---

## 📊 Platform Build Matrix

| Platform | Backend Status | Desktop App Status | Ready? |
|----------|---------------|-------------------|--------|
| **macOS arm64** | ✅ Built (61 MB) | ✅ DMG/ZIP ready | ✅ Yes |
| **Windows x64** | ❌ Need to build | ⚠️ Wrong backend | ❌ No |
| **Linux** | ❌ Not built yet | ❌ Not built | ❌ No |

---

## 💡 Why This Happens

**PyInstaller Limitation:**
- PyInstaller cannot cross-compile
- Must build on target platform
- macOS build → macOS executable only
- Windows build → Windows executable only

**Electron-builder:**
- CAN cross-compile the Electron shell
- CANNOT cross-compile bundled binaries (our Python backend)
- Result: Windows app with macOS backend (won't work)

---

## ✅ Next Steps

**Option A - Quick Local Test:**
1. Get Windows machine/VM
2. Build backend on Windows
3. Copy `processor.exe` back to macOS project
4. Rebuild Windows app

**Option B - Production CI/CD:**
1. Set up GitHub Actions (copy workflow above)
2. Push to GitHub
3. Get all platform builds automatically

**Recommendation:** Use GitHub Actions for clean, reproducible, multi-platform builds! 🚀

---

## 📞 Need Help?

- **GitHub Actions:** Free for public repos, includes Windows/macOS/Linux runners
- **Alternative CI:** Azure Pipelines, CircleCI, AppVeyor all support multi-platform
- **Local VMs:** VirtualBox, Parallels, VMware for local Windows builds

**The macOS build is ready!** Just need the Windows backend built on an actual Windows machine. 🎯

