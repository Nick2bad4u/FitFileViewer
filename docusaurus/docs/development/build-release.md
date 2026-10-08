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

The manual **Release Rehearsal** workflow runs the full release gate and builds
the real distribution matrix without publishing: Linux x64, Windows x64 and
ia32, and macOS ARM64, Intel, and Universal. The production workflow is
**Build and Release Electron App** in `.github/workflows/Build.yml`.

Each platform verifies its build output and exercises the distributable:
macOS mounts the DMG, copies the app to a fresh location, verifies every
architecture's signature, and launches through both the executable and
LaunchServices. The same Universal DMG must pass on native ARM64 and native Intel
runners, with its hash verified before testing the x64 slice. Windows checks its
ZIP, NSIS installer, and portable executable; Linux checks its tarball and
extracted AppImage. Reports, screenshots, logs, and artifact hashes are saved
as workflow diagnostics.

## Release Process

### 1. Validate the Candidate

Run `npm run release:verify`, then dispatch **Release Rehearsal** on the
candidate branch. Check every platform result and the Windows installer
upgrade workflow before publishing.

The packaged smoke test requires a fresh completion report after renderer
initialization, preload IPC, real FIT decoding, and visible map rendering.
Crashes, signals, timeouts, and missing or stale reports fail the test.

After the platform matrix finishes, **Release Rehearsal** automatically checks
macOS 27 compatibility. It verifies the successful ARM64 artifact's provenance
and original DMG hash, then tests that same artifact through direct launch and
LaunchServices on GitHub's `xcode-27` preview runner. The normal release gate and
platform matrix remain required.

### 2. Publish

Dispatch **Build and Release Electron App** with the target `branch` and
`release-type` (`patch`, `minor`, or `major`). The workflow creates the version
commit and tag, builds and verifies the artifacts, publishes the release, and
updates the changelog on that branch.

### 3. Verify Release

Check GitHub Releases for:

- All platform builds
- Checksums
- Release notes

The release asset verifier checks updater metadata references, including
architecture-specific web installer payloads, against asset sizes and hashes.
The published upgrade workflow verifies installation over previous releases.

## Code Signing

Run `npm run release:check-signing` before signed packaging when
`REQUIRE_CODE_SIGNING=true`. The command reports missing variables before
electron-builder starts.

Local and rehearsal builds do not use publisher credentials by default:

```bash
npm run package
npm run package:unsigned
```

macOS bundles still receive ad hoc signatures after fuse changes and the final
Universal merge. Apple Silicon requires valid signature integrity; ad hoc
signing does not provide a trusted publisher identity or notarization.

Production releases follow the same default policy. The **Build
and Release Electron App** workflow exposes a `require-code-signing` input;
leave it disabled for the established release path and enable it only after the
Windows and macOS signing credentials have been configured.

For a failed run that already created an unpublished version tag, use
`reuse-current-version=true` only after moving that tag to the exact retry
commit. The workflow validates the package version, tag, and checked-out commit
match before rebuilding, preventing an accidental extra version bump.

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

For GitHub Actions, store the base64-encoded `.p8` key as
`APPLE_API_KEY_BASE64`, plus `APPLE_API_KEY_ID` and `APPLE_API_ISSUER`. The
workflow writes the decoded key to `RUNNER_TEMP` and exports its path as
`APPLE_API_KEY`; do not store raw key contents in `APPLE_API_KEY`, because
electron-builder interprets that variable as a filesystem path.

Linux release builds do not require signing variables. Windows 7 compatibility
is limited to carried-forward legacy release assets from `build-win7.yml`; the
current app is not rebuilt for Windows 7.

After macOS packaging or signed Windows packaging, run:

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
`Get-AuthenticodeSignature` when publisher signing is required. It always
checks macOS `.app` bundles with
`codesign --verify --deep --strict --all-architectures`; required publisher
builds additionally verify the Apple Developer ID certificate requirement.
It writes `release-dist/signing-verification-report.json`. The primary release
workflow uploads that report with the platform artifacts. Removing quarantine
attributes with `xattr` cannot repair an invalid executable signature.

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
