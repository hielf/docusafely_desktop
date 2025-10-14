# DocuSafely Desktop

A modern Electron-based desktop application for document masking and PII detection. Provides an intuitive GUI for the DocuSafely Core backend engine.

## Features

- **User-Friendly Interface**: Simple drag-and-drop or file selection
- **Real-Time Processing**: Process documents locally without cloud uploads
- **Multi-Format Support**: Text files, PDFs, CSV, and more
- **Policy Configuration**: Customize which entities to detect and mask
- **Dry-Run Preview**: See what will be detected before masking
- **Batch Processing**: Process multiple files (planned)
- **Cross-Platform**: Windows, macOS, and Linux support

## Requirements

- Node.js 18+ and npm
- Python 3.10+ (for backend development/building)
- Electron 38+

## Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/hielf/docusafely-desktop.git
cd docusafely-desktop
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Backend

The backend must be built separately. Navigate to the backend project:

```bash
cd ../docusafely_core

# Setup Python environment
python3 -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# Install dependencies
pip install -e .[dev]
python -m spacy download en_core_web_sm

# Build the backend executable
python build_nuitka.py

# This creates dist/processor.exe (or dist/processor on Unix)
```

### 4. Bundle Backend into Desktop App

Return to the desktop project and run:

```bash
cd ../docusafely_desktop
npm run prebuild
```

This copies the pre-compiled backend to `backend/dist/`.

### 5. Run Development

```bash
npm start
```

The application will launch in development mode.

## Building for Production

### Windows

```bash
npm run build:win
```

### macOS

```bash
npm run build:mac
```

### Linux

```bash
npm run build:linux
```

### All Platforms

```bash
npm run build:all
```

Built applications will be in the `dist/` directory.

## Project Structure

```
docusafely_desktop/
├── src/
│   ├── main.js           # Electron main process
│   ├── preload.js        # Preload script
│   └── index.html        # UI
├── backend/              # Bundled backend (gitignored)
│   └── dist/
│       └── processor.exe # Pre-compiled backend
├── build/                # Build assets (icons)
├── scripts/
│   └── bundle-backend.js # Backend bundling script
├── tests/                # Frontend tests
├── example/              # Sample files
├── .github/              # CI/CD workflows
├── package.json
└── README.md
```

## Development Workflow

1. **Modify backend** (docusafely_core):
   ```bash
   cd ../docusafely_core
   # Make changes to Python code
   pytest tests/  # Run tests
   python build_nuitka.py  # Rebuild
   ```

2. **Update frontend** (docusafely_desktop):
   ```bash
   cd ../docusafely_desktop
   npm run prebuild  # Copy new backend
   npm start  # Test changes
   ```

3. **Build release**:
   ```bash
   npm run build:win  # or build:mac, build:linux
   ```

## Multi-Root Workspace

For efficient development, open the workspace file in VS Code:

```bash
code /path/to/projects/docusafely.code-workspace
```

This allows you to work on both frontend and backend simultaneously.

## Backend Integration

The desktop app integrates with the backend through:

1. **Pre-compiled Executable**: For production builds, uses `backend/dist/processor.exe`
2. **Python Fallback**: For development, can use Python interpreter if executable not found
3. **IPC Communication**: Electron IPC handles communication between UI and backend

### Backend Location Logic

```javascript
const backendBase = app.isPackaged
  ? path.join(process.resourcesPath, 'backend')
  : path.join(__dirname, '..', 'backend');
```

## Testing

### Frontend Tests (JavaScript)

```bash
npm run test:js
```

### Backend Tests (Python)

```bash
cd ../docusafely_core
pytest tests/
```

## Configuration

Edit `package.json` to customize:
- Application name and version
- Build settings
- File associations
- Icons and metadata

## Troubleshooting

### Backend Not Found

If you get "Backend not found" errors:

```bash
cd ../docusafely_core
python build_nuitka.py
cd ../docusafely_desktop
npm run prebuild
```

### Python Version Issues

Ensure Python 3.10+ is installed:

```bash
python --version
```

### Node/npm Issues

Clear cache and reinstall:

```bash
rm -rf node_modules package-lock.json
npm install
```

## License

Private - Not for public distribution

## Contributing

This is a private project. For internal development:

1. Follow the code standards in DEVELOPMENT_PLAN.md
2. Test changes thoroughly before committing
3. Update documentation when adding features

## Related Projects

- **Backend**: [docusafely_core](../docusafely_core) - Core PII detection engine
- **Original**: [doc-masking](../doc-masking) - Original monorepo (for reference)

## Version

Current version: 1.0.0

