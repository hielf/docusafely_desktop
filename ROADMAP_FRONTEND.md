## Frontend Roadmap

Short- and mid-term plan to evolve user experience, interface design, and policy management while maintaining intuitive and secure document processing workflows.

### User Interface Design
- **Modern UI Framework**: Use Tailwind CSS to re-write the UI for modern, responsive design.
- **Responsive Design**: Ensure optimal experience across desktop, tablet, and mobile devices.
- **Accessibility**: Implement WCAG 2.1 AA compliance for inclusive design.
- **Dark/Light Mode**: Toggle between themes with system preference detection.
- **Consistent Design System**: Establish design tokens, components, and patterns for cohesive user experience.

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
- M2: Policy Management & Automatic Reports
  - Implement per-entity action selector and template editor.
  - Automatically display entity masking report after processing based on session mapping data.
  - Create policy validation and preset management.
  - Implement report export functionality.
  - Add session history and mapping file management interface.
- M3: Advanced Features & Integration
  - Add batch processing and file management features.
  - Implement advanced settings interface.
  - Create comprehensive help system and documentation.
  - Add accessibility features and multi-language support.
  - Implement context restoration and audit log export.
- M4: Enterprise & Performance
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
