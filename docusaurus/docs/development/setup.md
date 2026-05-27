---
id: setup
title: Development Setup
sidebar_label: 🚀 Setup
sidebar_position: 1
description: Setting up a development environment for FitFileViewer.
---

# Development Setup

Get started contributing to FitFileViewer.

## Prerequisites

### Required Software

| Software | Version | Purpose         |
| -------- | ------- | --------------- |
| Node.js  | 18+     | Runtime         |
| npm      | 9+      | Package manager |
| Git      | Latest  | Version control |

### Recommended

- **VS Code** with extensions:
  - ESLint
  - Prettier
  - JavaScript/TypeScript

## Quick Start

```bash
# Clone the repository
git clone https://github.com/Nick2bad4u/FitFileViewer.git

# Navigate to the repository root
cd FitFileViewer

# Install dependencies
npm install

# Start development
npm start
```

## Detailed Setup

### 1. Clone Repository

```bash
# HTTPS
git clone https://github.com/Nick2bad4u/FitFileViewer.git

# SSH
git clone git@github.com:Nick2bad4u/FitFileViewer.git

# Navigate to project
cd FitFileViewer
```

### 2. Install Dependencies

```bash
# Install all workspace dependencies
npm install
```

### 3. Start Development Server

```bash
# Start Electron in development mode
npm start
```

This will:

- Launch Electron with hot reload
- Enable DevTools
- Show console output

### 4. Open DevTools

- Press `Ctrl+Shift+I` (Windows/Linux)
- Press `Cmd+Option+I` (macOS)

## Project Structure

```
FitFileViewer/
├── electron-app/          # Main application
│   ├── main.js           # Main process
│   ├── renderer.js       # Renderer process
│   ├── preload.js        # Preload script
│   ├── main-ui.js        # UI management
│   ├── fitParser.js      # FIT parsing
│   ├── utils/            # Utility modules
│   ├── tests/            # Test files
│   └── package.json      # Electron package metadata and runtime deps
├── docs/                  # Documentation
├── fit-test-files/        # Sample FIT files
└── README.md
```

## Development Commands

### Run Application

```bash
# Development mode (with DevTools)
npm start

# Production mode (no DevTools)
npm run start:prod
```

### Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- electron-app/tests/unit/utils/formatUtils.test.ts
```

### Linting

```bash
# Run ESLint
npm run lint

# Fix auto-fixable issues
npm run lint:fix
```

### Building

```bash
# Build for current platform
npm run build

# Build for all platforms
npm run build:all
```

## Configuration Files

### ESLint

```javascript
// eslint.config.mjs
export default [
 // Configuration
];
```

### Prettier

```javascript
// prettier.config.mjs
export { default } from "prettier-config-nick2bad4u";
```

### TypeScript

```json
// tsconfig.electron-app.json
{
 "compilerOptions": {
  "noEmit": true
 }
}
```

## Testing with FIT Files

Sample FIT files are provided:

```bash
# Location
fit-test-files/
├── _Fenton_Michigan_Afternoon_Ride_*.fit
├── Virtual_Zwift_*.fit
└── ...
```

## Environment Variables

| Variable          | Purpose                |
| ----------------- | ---------------------- |
| `NODE_ENV`        | development/production |
| `ELECTRON_IS_DEV` | Enable dev features    |

## Debugging

### VS Code Launch Config

```json
{
 "version": "0.2.0",
 "configurations": [
  {
   "name": "Debug Main Process",
   "type": "node",
   "request": "launch",
   "cwd": "${workspaceFolder}",
   "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/electron",
   "args": ["electron-app"]
  }
 ]
}
```

### Chrome DevTools

1. Start app: `npm start`
2. Open DevTools: `Ctrl+Shift+I`
3. Debug renderer process

---

**Next:** [Code Standards →](/docs/development/code-standards)
