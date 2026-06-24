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
npm run build:all
```

## Build Configuration

### Root Builder Config

Packaging is configured from the repository root:

- `electron-builder.config.cjs` owns Electron Builder targets, artifact names,
  publish settings, and platform options.
- The root `package.json` is the app manifest for version, runtime
  dependencies, exports, and publish metadata.
- Packaged file inclusion is limited to root package metadata and
  `dist/` runtime output.

```javascript
// electron-builder.config.cjs
const rootPackageFiles = ["dist/**", "package.json"];

module.exports = {
 appId: appPackage.appid,
 productName: appPackage.productName,
 files: rootPackageFiles,
 artifactName: "Fit-File-Viewer-${platform}-${arch}-${version}.${ext}",
 publish: [{ provider: "github", owner: "Nick2bad4u", repo: "FitFileViewer" }],
};
```

## Output Formats

### Windows

| Format   | Description        |
| -------- | ------------------ |
| NSIS     | Standard installer |
| MSI      | Windows Installer  |
| Portable | No installation    |
| Squirrel | Auto-updating      |

### macOS

| Format | Description       |
| ------ | ----------------- |
| DMG    | Disk image        |
| PKG    | Installer package |
| ZIP    | Archive           |

### Linux

| Format   | Description      |
| -------- | ---------------- |
| AppImage | Universal format |
| DEB      | Debian/Ubuntu    |
| RPM      | Fedora/RHEL      |
| Snap     | Snap package     |

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
   - run: npm ci
   - run: npm run build
```

## Release Process

### 1. Update Version

```bash
# Update the Electron app version
npm run release:bump-version
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

Run `npm run release:check-signing` before signed packaging when
`REQUIRE_CODE_SIGNING=true`. The command reports missing variables before
electron-builder starts.

Local and rehearsal builds are unsigned by default:

```bash
npm run package
npm run package:unsigned
```

Both commands force `FFV_FORCE_UNSIGNED_PACKAGE=true`,
`CSC_IDENTITY_AUTO_DISCOVERY=false`, and `REQUIRE_CODE_SIGNING=false` before
electron-builder starts. Use them for local package validation and release
rehearsals where credentials should not affect the result.

Use the signed path only when the platform signing secrets are available:

```bash
npm run package:signed
```

That command runs `npm run release:check-signing:required` first, then starts
electron-builder with `REQUIRE_CODE_SIGNING=true`.

### Windows

Signed Windows builds require:

- `WIN_CSC_LINK` or `CSC_LINK`
- `CSC_KEY_PASSWORD`

### macOS

Signed macOS builds require:

- `CSC_LINK`
- `CSC_KEY_PASSWORD`
- `CSC_INSTALLER_LINK`
- `CSC_INSTALLER_KEY_PASSWORD`

Notarization also requires one of these credential sets:

- `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, and `APPLE_TEAM_ID`
- `APPLE_API_KEY`, `APPLE_API_KEY_ID`, and `APPLE_API_ISSUER`
- `APPLE_KEYCHAIN_PROFILE`

Linux release builds do not require signing variables. Windows 7 compatibility
is limited to carried-forward legacy release assets from `build-win7.yml`; the
current app is not rebuilt for Windows 7.

After signed Windows or macOS packaging, run:

```bash
npm run release:verify-signing-artifacts
```

For the full signed release verification path, run:

```bash
npm run verify:release:signed
```

That command runs fast checks, the docs build, audit, Playwright smoke, signed
packaging, signature artifact verification, and packaged smoke in order.

The verifier checks Windows `.exe` and `.msi` files with
`Get-AuthenticodeSignature`, checks macOS `.app` bundles with `codesign`, and
writes `release-dist/signing-verification-report.json`. The primary release
workflow uploads that report with the platform artifacts.

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
