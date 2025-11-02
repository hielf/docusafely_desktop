## Frontend Roadmap

Short- and mid-term plan to evolve user experience, interface design, and policy management while maintaining intuitive and secure document processing workflows.

### User Interface Design
- **Modern UI Framework**: Use Tailwind CSS to re-write the UI for modern, responsive design.
- **Responsive Design**: Ensure optimal experience across desktop, tablet, and mobile devices.
- **Accessibility**: Implement WCAG 2.1 AA compliance for inclusive design.
- **Dark/Light Mode**: Toggle between themes with system preference detection.
- **Consistent Design System**: Establish design tokens, components, and patterns for cohesive user experience.

### Platform-Specific Native UI Requirements

#### Common Requirements (General UI/UX)
- **Frameless Window**: The application must utilize a frameless window (`frame: false`) to allow for complete customization of the window chrome.
- **Platform Theme Adaptation**: The application must dynamically detect and adapt to the system's preferred theme (Light/Dark Mode) via the `nativeTheme` API. All visual components (colors, icons, text) must automatically switch to match the operating system's theme.
- **App Region Control**: All draggable areas must be strictly defined using the `-webkit-app-region: drag` CSS property, with interactive elements explicitly set to `-webkit-app-region: no-drag`.
- **Native Fonts**: All rendered text must utilize the platform's default system font stacks:
  - **macOS**: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`
  - **Windows**: `'Segoe UI', Tahoma, Arial, sans-serif`

#### macOS Native UI/UX Requirements

A. Native Implementation Details (Electron API)
- **Title Bar Style**: Set `BrowserWindow.titleBarStyle` to `'hiddenInset'` to blend the title bar with the window content while retaining the native traffic light controls.
- **Native Menus**: Implement a full native application menu (File, Edit, View, Window, Help) using `Menu.setApplicationMenu()` to ensure all standard Cmd+[Key] shortcuts and menu bar behaviors are preserved.
- **Dock Integration**: Implement badge number display (`app.dock.setBadge()`) for unread notifications and provide a native right-click Dock menu (`app.dock.setMenu()`) for quick actions.
- **Title Bar Double-Click**: Listen for double-click events on the custom drag region and query `systemPreferences.getUserDefault('AppleActionOnDoubleClick', 'string')` to correctly honor the user's system preference (Minimize or Zoom/Maximize).

#### Windows Native UI/UX Requirements

A. Native Implementation Details (Electron API)
- **Native Controls Overlay**: Utilize the `BrowserWindow.titleBarOverlay` feature to hide the HTML title and allow for a fully customizable title bar background while preserving native system controls (Minimize, Maximize, Close buttons).
- **Control Button Color**: Ensure the symbol color of the native window controls (`titleBarOverlay.symbolColor`) dynamically switches between black (light theme) and white (dark theme) to maintain visibility against the custom background color.
- **Taskbar Integration**: Implement a progress bar overlay on the taskbar icon (`win.setProgressBar()`) to provide feedback during long operations (e.g., file transfer, download).
- **Jump List**: Define a custom Jump List in the taskbar right-click menu (`app.setJumpList()`) including recent files and common application tasks, adhering to Windows guidelines.
- **Custom Frame Drag**: If a custom title bar is implemented, ensure the entire drag area correctly handles the Windows double-click behavior (Maximize/Restore) via IPC calls to `win.maximize()` or `win.unmaximize()`.

#### Linux Native UI/UX Requirements

A. UI Integration (Desktop Environment Support)
- **GTK Integration**: Leverage Electron's built-in GTK support for proper integration with GNOME, XFCE, and other GTK-based desktop environments.
- **System Tray**: Implement system tray icon (`app.dock` API works on Linux) for running in background and quick access.
- **Native Notifications**: Use `new Notification()` API for system-level notifications consistent with desktop environment standards.
- **Desktop File**: Ensure proper .desktop file generation for application launcher integration and file type associations.

B. Native Implementation Details (Electron API)
- **AppData Integration**: Use appropriate paths for user data and application config (`app.getPath('userData')`, `app.getPath('appData')`).
- **Theme Detection**: Detect system theme preferences using `nativeTheme` API for automatic light/dark mode adaptation.
- **Window Management**: Support standard window manager features (minimize, maximize, restore) via appropriate IPC handlers.
- **Platform-Specific Shortcuts**: Ensure keyboard shortcuts work appropriately across different desktop environments.

### Security Level Management
- **Policy Groups**: Implement three security level groups: Basic, Balanced, and Strict.
- **Entity Group Assignment**: Assign current entities into appropriate security level groups:
  - **Basic**: Names, addresses, phone numbers, email addresses
  - **Balanced**: Basic entities + SSN, credit card numbers, bank account numbers, driver's license numbers
  - **Strict**: All entities + credentials/secrets, crypto wallets, device IDs, health information, legal data
- **Security Level Tab**: Dedicated interface for users to select their preferred security level.
- **Dynamic Entity Lists**: Show/hide entities based on selected security level.
- **Level Descriptions**: Clear explanations of what each security level protects against.

### Expert Configuration
- **Expert Option Tab**: Advanced interface for power users to customize entity detection and masking.
- **Per-Entity Controls**: Individual toggles for each entity type with confidence threshold sliders.
- **Custom Policy Editor**: Allow users to create and modify custom masking templates.
- **Entity-Specific Actions**: Choose between remove, pseudonymize, format-preserving, or placeholder for each entity.
- **Template Management**: Save, load, and share custom policy templates.

### Policy Management Interface
- **Remove "Mask All" Options**: Eliminate blanket masking options to encourage thoughtful policy selection.
- **Per-Entity Action Selector**: Interface for choosing remove | pseudonymize | format-preserving | placeholder actions.
- **Template Editor**: Visual editor for creating custom masking templates with preview functionality.
- **Policy Presets**: Quick-select buttons for common use cases (GDPR, HIPAA, COPPA compliance).
- **Policy Validation**: Real-time validation of policy configurations with helpful error messages.

### Detection and Preview
- **Automatic Entity Report**: Automatically display entity masking report based on current session mapping data after processing.
- **Confidence Indicators**: Visual confidence scores for each detected entity.
- **Masked Tokens Display**: Show final masked tokens/pseudonyms with original text for verification.
- **Entity Statistics**: Display counts and types of detected entities from session data.
- **False Positive Handling**: Easy-to-use interface for marking false positives and adjusting thresholds.

### Progress and Status
- **Progress Bar**: Visual progress indicator for document processing with detailed status messages.
- **Real-time Updates**: Live updates on processing status, current page, and estimated completion time.
- **Processing Queue**: Interface for managing multiple document processing jobs.
- **Status Notifications**: Toast notifications for processing completion, errors, and warnings.
- **Cancel/Resume**: Ability to cancel or pause long-running processing jobs.
- **Session Information**: Display session ID and entity mapping count in processing results.
- **Mapping Status**: Show real-time entity mapping creation during processing.

### File Management
- **Drag-and-Drop Interface**: Intuitive file upload with visual feedback.
- **Batch Processing**: Support for processing multiple documents simultaneously.
- **File Format Support**: Clear indicators for supported file types (PDF, Word, Excel, PowerPoint, CSV, RTF, Markdown).
- **File Validation**: Pre-processing validation with helpful error messages for unsupported or corrupted files.
- **Processing History**: Track and manage previously processed documents.
- **Session Management**: Display processing sessions with entity mapping counts and timestamps.
- **Mapping File Storage**: Clean, readable JSON storage of entity mappings in user data directory for easy access and restoration.

### Export and Reporting
- **Automatic Entity Report Display**: Automatically show entity masking report after processing based on session mapping data.
- **Processing Reports**: Generate detailed reports of what was detected and masked.
- **Mapping Export**: Export per-document entity-mask mappings as readable JSON/CSV for audit/reversibility.
- **Session Audit Logs**: Export comprehensive audit logs with entity transformation history as readable JSON.
- **Context Restoration**: Interface for restoring original text from masked entities using session data.
- **Compliance Reports**: Generate reports tailored for specific regulatory requirements (GDPR, HIPAA, etc.).
- **Custom Report Templates**: Allow users to create and save custom report formats.

### Settings and Configuration
- **User Preferences**: Persistent settings for default policies, UI preferences, and processing options.
- **Entity Mapping Management**: Interface for viewing, managing, and exporting entity-mask mappings as readable JSON.
- **Session History**: Track and display processing sessions with entity mapping details.
- **Model Management**: Optional UI for managing NER models and cache.
- **Language Settings**: Interface for selecting processing language and regional settings.
- **Advanced Settings**: Collapsible section for power user configurations.

### Help and Documentation
- **Contextual Help**: Tooltips and help text throughout the interface.
- **Interactive Tutorials**: Guided tours for new users and feature introductions.
- **Policy Guidance**: Built-in help for understanding different entity types and masking options.
- **Video Tutorials**: Embedded video guides for common workflows.
- **FAQ Section**: Frequently asked questions with searchable answers.

### Performance and Responsiveness
- **Optimistic UI**: Immediate feedback for user actions while processing occurs in background.
- **Lazy Loading**: Efficient loading of large documents and processing results.
- **Caching Strategy**: Smart caching of user preferences, policies, and processing results.
- **Error Handling**: Graceful error handling with user-friendly error messages and recovery options.
- **Offline Support**: Basic offline functionality for viewing previously processed documents.

### Accessibility and Usability
- **Keyboard Navigation**: Full keyboard support for all interface elements.
- **Screen Reader Support**: Proper ARIA labels and semantic HTML structure.
- **High Contrast Mode**: Support for high contrast themes and text scaling.
- **Multi-language Support**: Interface localization for multiple languages.
- **User Testing**: Regular usability testing and feedback incorporation.

### Integration Features
- **API Integration**: Interface for connecting with external systems and APIs.
- **Workflow Automation**: Tools for integrating DocuSafely into existing document workflows.
- **Cloud Storage Integration**: Optional integration with cloud storage providers.
- **Enterprise Features**: Advanced features for enterprise deployments and team management.

### Entity Mapping Integration
- **Session Tracking**: Display and manage processing sessions with unique identifiers.
- **Mapping File Management**: Interface for viewing, managing, and cleaning up readable JSON mapping files.
- **Context Restoration**: UI for restoring original text from masked entities using session data.
- **Audit Trail Interface**: Display comprehensive audit logs with entity transformation history as readable JSON.
- **Storage Management**: Monitor mapping file storage usage and cleanup old sessions.
- **Session History**: Track processing sessions with document paths, timestamps, and entity counts.
- **Mapping Export**: Export mapping files as readable JSON/CSV for compliance and audit purposes.
- **Mapping Dashboard**: Overview of session status, storage usage, and mapping file access.

### Milestones
- M1: Core UI Foundation (priority)
  - [x] Implement Tailwind CSS-based modern UI framework.
  - [x] Create Security Level tab with Basic, Balanced, Strict groups.
  - [x] Implement Expert Option tab with per-entity controls.
  - [x] Add progress bar and real-time status updates.
  - [x] Remove all "mask_all" options from interface.
  - [x] Integrate entity mapping system with session tracking.
  - [x] Remove "Generate dry-run report" option.
- M2: Platform-Specific Native UI Implementation
  - Implement common platform requirements (frameless window, theme adaptation, app region control, native fonts).
  - Implement macOS native UI features (title bar style, native menus, dock integration, title bar double-click).
  - Implement Windows native UI features (native controls overlay, taskbar integration, jump list, custom frame drag).
  - Implement Linux native UI features (GTK integration, system tray, notifications).
  - Ensure cross-platform compatibility and testing.
- M3: Policy Management & Automatic Reports
  - Implement per-entity action selector and template editor.
  - Automatically display entity masking report after processing based on session mapping data.
  - Create policy validation and preset management.
  - Implement report export functionality.
  - Add session history and mapping file management interface.
- M4: Advanced Features & Integration
  - Add batch processing and file management features.
  - Implement advanced settings interface.
  - Create comprehensive help system and documentation.
  - Add accessibility features and multi-language support.
  - Implement context restoration and audit log export.
- M5: Enterprise & Performance
  - Implement enterprise features and team management.
  - Add cloud storage integration and workflow automation.
  - Optimize performance and add offline support.
  - Complete accessibility compliance and user testing.
  - Add enterprise-grade mapping file management and compliance reporting.

### Risks and Mitigations
- **UI Complexity**: Risk of overwhelming users with too many options; mitigate with progressive disclosure and smart defaults.
- **Performance Impact**: Rich UI features may impact processing performance; mitigate with efficient rendering and background processing.
- **User Adoption**: Complex interfaces may reduce adoption; mitigate with intuitive design and comprehensive help system.
- **Accessibility Compliance**: Ensuring full accessibility may be challenging; mitigate with early testing and expert consultation.
- **Mapping File Storage**: Risk of storage bloat or corruption; mitigate with automatic cleanup, validation, and readable JSON format for easy access and recovery.
- **Platform-Specific UI**: Risk of inconsistencies across platforms or breaking native behaviors; mitigate with thorough cross-platform testing, following platform-specific design guidelines, and using well-maintained third-party modules when required.
