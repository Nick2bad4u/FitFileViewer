---
id: build-release
title: Build & Release
sidebar_label: 🚀 Build & Release
sidebar_position: 5
description: Building and releasing FitFileViewer.
---

# Build & Release

How to build FitFileViewer for distribution.

## Development Build

### Quick Build

```bash
# Build for current platform
npm run build
```

### Development Package

```bash
# Create unpacked build (faster, for testing)
npm run package
```

## Production Build

### Single Platform

```bash
# Windows
npm run build -- --win

# macOS
npm run build -- --mac

# Linux
npm run build -- --linux
```

### All Platforms

```bash
# Build for all platforms
npm run build-all
```

## Build Configuration

### electron-builder.json

```json
{
    "appId": "com.example.fitfileviewer",
    "productName": "Fit File Viewer",
    "files": [
        "**/*",
        "!tests/**"
    ],
    "win": {
        "target": ["nsis", "portable", "msi"],
        "icon": "icons/favicon.ico"
    },
    "mac": {
        "target": ["dmg", "pkg"],
        "icon": "icons/favicon.icns"
    },
    "linux": {
        "target": ["AppImage", "deb", "rpm"],
        "icon": "icons/favicon.png"
    }
}
```

### package.json Build Settings

```json
{
    "build": {
        "appId": "com.example.fitfileviewer",
        "artifactName": "Fit-File-Viewer-${platform}-${arch}-${version}.${ext}",
        "publish": [{
            "provider": "github",
            "owner": "Nick2bad4u",
            "repo": "FitFileViewer"
        }]
    }
}
```

## Output Formats

### Windows

| Format | Description |
|--------|-------------|
| NSIS | Standard installer |
| MSI | Windows Installer |
| Portable | No installation |
| Squirrel | Auto-updating |

### macOS

| Format | Description |
|--------|-------------|
| DMG | Disk image |
| PKG | Installer package |
| ZIP | Archive |

### Linux

| Format | Description |
|--------|-------------|
| AppImage | Universal format |
| DEB | Debian/Ubuntu |
| RPM | Fedora/RHEL |
| Snap | Snap package |

## CI/CD Pipeline

Builds are automated via GitHub Actions:

```yaml
# .github/workflows/Build.yml
name: Build
on:
  push:
    branches: [main]
  release:
    types: [published]

jobs:
  build:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm install
      - run: npm run build
```

## Release Process

### 1. Update Version

```bash
# Update version in package.json
npm version patch  # or minor, major
```

### 2. Update Changelog

```bash
npm run changelog
```

### 3. Create Release

```bash
# Push tag
git push --tags

# GitHub Actions builds and publishes
```

### 4. Verify Release

Check GitHub Releases for:
- All platform builds
- Checksums
- Release notes

## Code Signing

### Windows

Requires certificate:
```json
{
    "win": {
        "certificateFile": "cert.pfx",
        "certificatePassword": "${CSC_KEY_PASSWORD}"
    }
}
```

### macOS

Requires Apple Developer ID:
```json
{
    "mac": {
        "hardenedRuntime": true,
        "gatekeeperAssess": true
    }
}
```

## Troubleshooting Builds

### Common Issues

**Build fails on Windows:**
```bash
# Clear cache
npm cache clean --force
rm -rf node_modules
npm install
```

**macOS signing fails:**
- Verify certificate in Keychain
- Check code signing identity

**Linux missing dependencies:**
```bash
# Install build tools
sudo apt-get install build-essential
```

---

**Related:** [Development Setup](/docs/development/setup)
