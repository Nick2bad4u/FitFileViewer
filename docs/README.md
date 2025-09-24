# FitFileViewer - Documentation Index

## 📚 Complete Documentation Suite

Welcome to the comprehensive documentation for FitFileViewer, a cross-platform desktop application for viewing and analyzing .fit files from fitness devices.

### 📋 Documentation Overview

| Document | Purpose | Audience |
|----------|---------|----------|
| [Application Architecture](APPLICATION_ARCHITECTURE.md) | Technical architecture and design patterns | Developers, Architects |
| [Application Layout](APPLICATION_LAYOUT.md) | Complete file structure and organization | Developers, Contributors |
| [Development Guide](DEVELOPMENT_GUIDE.md) | Development setup, standards, and practices | Developers, Contributors |
| [API Documentation](API_DOCUMENTATION.md) | Public APIs and interfaces | Developers, Plugin Authors |
| [User Guide](USER_GUIDE.md) | End-user instructions and features | Users, Support |

## 🚀 Quick Start Guides

### For Users
1. **New to FitFileViewer?** Start with the [User Guide](USER_GUIDE.md)
2. **Installation Help?** See [Getting Started](USER_GUIDE.md#getting-started)
3. **Troubleshooting?** Check [Common Issues](USER_GUIDE.md#troubleshooting)

### For Developers
1. **New Contributor?** Begin with [Development Guide](DEVELOPMENT_GUIDE.md)
2. **Understanding the Codebase?** Read [Application Architecture](APPLICATION_ARCHITECTURE.md)
3. **Finding Files?** Use [Application Layout](APPLICATION_LAYOUT.md)
4. **Building Plugins?** Reference [API Documentation](API_DOCUMENTATION.md)

## 📖 Documentation Categories

### 🏗️ Architecture & Design

#### [Application Architecture](APPLICATION_ARCHITECTURE.md)
- **Multi-Process Architecture**: Electron main/renderer pattern with security isolation
- **Modular Design**: 50+ utility modules organized by functionality
- **State Management**: Unified state system with persistence and reactivity
- **Error Handling**: Multi-level error strategy with graceful degradation
- **Performance**: Memory management, lazy loading, and optimization strategies

#### [Application Layout](APPLICATION_LAYOUT.md)
- **Project Structure**: Complete directory tree and file organization
- **Core Components**: Entry points, process management, and core logic
- **Utility Modules**: Detailed breakdown of all 50+ utility modules
- **Build System**: Configuration files and build processes
- **Testing Infrastructure**: 4,000+ tests organization and support files

### 🛠️ Development

#### [Development Guide](DEVELOPMENT_GUIDE.md)
- **Environment Setup**: Prerequisites, installation, and configuration
- **Code Standards**: JavaScript/TypeScript guidelines and patterns
- **Module Development**: Creating new modules and following conventions
- **Testing Strategy**: Unit, integration, and performance testing approaches
- **Build & Release**: Development and production build processes

#### [API Documentation](API_DOCUMENTATION.md)
- **Core APIs**: Main process, renderer, and preload script APIs
- **Utility APIs**: Formatting, charts, maps, tables, and state management
- **Error Handling**: Unified error system and validation utilities
- **IPC Communication**: Secure inter-process communication patterns
- **Plugin System**: Extensible architecture for custom functionality

### 👤 User Documentation

#### [User Guide](USER_GUIDE.md)
- **Getting Started**: Installation, system requirements, and first use
- **File Operations**: Opening FIT files and file management
- **Interface Guide**: Navigation, tabs, and feature locations
- **Data Visualization**: Maps, charts, tables, and summary views
- **Tools & Features**: Export, analysis, and measurement tools

## 🎯 Key Features Covered

### Data Visualization
- **Interactive Maps** 🗺️ - GPS route visualization with Leaflet.js
- **Dynamic Charts** 📊 - Performance data using Chart.js and Vega-Lite
- **Data Tables** 📋 - Detailed record views with filtering and export
- **Summary Views** 📄 - Activity statistics and performance metrics

### Technical Excellence
- **Security-First** 🔐 - Context isolation, sandboxing, secure IPC
- **Cross-Platform** 💻 - Windows, macOS, and Linux support
- **Performance** ⚡ - Efficient data processing and memory management
- **Extensible** 🔧 - Plugin architecture and modular design

### Developer Experience
- **50+ Utility Modules** - Well-organized, reusable components
- **4,000+ Tests** - Comprehensive test coverage
- **TypeScript Support** - Type safety and better development experience
- **Modern Build System** - ESLint, Prettier, automated CI/CD

## 📚 Additional Resources

### Legacy Documentation
Some existing documentation files provide additional context:

- **[State Management Complete Guide](STATE_MANAGEMENT_COMPLETE_GUIDE.md)** - In-depth state system documentation
- **[FIT Parser Migration Guide](FIT_PARSER_MIGRATION_GUIDE.md)** - Migration notes for parser updates
- **[Map Theme Toggle](MAP_THEME_TOGGLE.md)** - Map theming implementation details

### External Resources

#### Project Links
- **[GitHub Repository](https://github.com/Nick2bad4u/FitFileViewer)** - Source code and issue tracking
- **[Releases Page](https://github.com/Nick2bad4u/FitFileViewer/releases)** - Download latest builds
- **[GitHub Pages](https://fitfileviewer.typpi.online/)** - Project website

#### Dependencies Documentation
- **[Electron](https://www.electronjs.org/docs)** - Desktop app framework
- **[Chart.js](https://www.chartjs.org/docs/)** - Charting library
- **[Leaflet](https://leafletjs.com/reference.html)** - Interactive maps
- **[Vega-Lite](https://vega.github.io/vega-lite/docs/)** - Grammar of graphics
- **[Garmin FIT SDK](https://developer.garmin.com/fit/overview/)** - FIT file format

## 🎯 Documentation Standards

### Maintenance Guidelines
- **Keep Current**: Update documentation with code changes
- **User-Focused**: Write from the user's perspective
- **Comprehensive**: Cover all features and edge cases
- **Examples**: Include practical code examples and use cases
- **Searchable**: Use clear headings and consistent terminology

### Contributing to Documentation
1. **Identify Gaps**: Look for missing or outdated information
2. **Follow Format**: Use consistent structure and markdown formatting
3. **Add Examples**: Include practical examples and screenshots where helpful
4. **Test Instructions**: Verify that documented procedures work correctly
5. **Review Process**: Submit documentation updates via pull requests

### Documentation Structure
Each documentation file follows a consistent pattern:
- **Clear Table of Contents** - Easy navigation
- **Progressive Depth** - From overview to detailed implementation
- **Code Examples** - Practical, working code samples
- **Cross-References** - Links between related documentation
- **Visual Aids** - Diagrams, charts, and screenshots where helpful

## 🔍 Finding What You Need

### By Role

| Role | Primary Documents | Secondary Documents |
|------|------------------|-------------------|
| **End User** | [User Guide](USER_GUIDE.md) | Feature-specific help sections |
| **New Developer** | [Development Guide](DEVELOPMENT_GUIDE.md), [Application Layout](APPLICATION_LAYOUT.md) | [API Documentation](API_DOCUMENTATION.md) |
| **Contributor** | [Development Guide](DEVELOPMENT_GUIDE.md), [Application Architecture](APPLICATION_ARCHITECTURE.md) | All documents |
| **Plugin Developer** | [API Documentation](API_DOCUMENTATION.md), [Application Architecture](APPLICATION_ARCHITECTURE.md) | [Development Guide](DEVELOPMENT_GUIDE.md) |
| **Maintainer** | All documents | External dependency docs |

### By Task

| Task | Relevant Documentation |
|------|----------------------|
| **Installing the app** | [User Guide - Getting Started](USER_GUIDE.md#getting-started) |
| **Opening FIT files** | [User Guide - Opening Files](USER_GUIDE.md#opening-fit-files) |
| **Setting up development** | [Development Guide - Environment Setup](DEVELOPMENT_GUIDE.md#development-environment-setup) |
| **Understanding architecture** | [Application Architecture](APPLICATION_ARCHITECTURE.md) |
| **Finding specific files** | [Application Layout](APPLICATION_LAYOUT.md) |
| **Creating new modules** | [Development Guide - Module Development](DEVELOPMENT_GUIDE.md#module-development) |
| **Writing tests** | [Development Guide - Testing Strategy](DEVELOPMENT_GUIDE.md#testing-strategy) |
| **Using APIs** | [API Documentation](API_DOCUMENTATION.md) |
| **Troubleshooting** | [User Guide - Troubleshooting](USER_GUIDE.md#troubleshooting) |

This documentation index provides a comprehensive starting point for understanding, using, developing, and contributing to the FitFileViewer application. Whether you're a user looking to analyze your fitness data or a developer wanting to contribute to the project, these guides will help you get started quickly and effectively.
