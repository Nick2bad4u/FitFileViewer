---
id: installation
title: Installation
sidebar_label: 📥 Installation
sidebar_position: 1
description: How to download and install FitFileViewer on Windows, macOS, and Linux.
keywords:
  - install
  - download
  - setup
  - windows
  - macos
  - linux
---

# Installation

FitFileViewer is available for Windows, macOS, and Linux. Choose the installation method that works best for you.

## 📦 Download

Get the latest release from GitHub:

<a href="https://github.com/Nick2bad4u/FitFileViewer/releases/latest" className="button button--primary button--lg">
  📥 Download Latest Release
</a>

## 🪟 Windows

### Recommended: Installer (`.exe`)

1. Download `Fit-File-Viewer-nsis-x64-X.X.X.exe` (or `ia32` for 32-bit)
2. Run the installer
3. Follow the installation wizard
4. Launch from Start Menu or Desktop shortcut

### Alternative: MSI Installer

1. Download `Fit-File-Viewer-msi-x64-X.X.X.msi`
2. Double-click to run
3. Follow the installation prompts

### Portable Version

No installation required:

1. Download `Fit-File-Viewer-portable-x64-X.X.X.exe`
2. Place in your preferred folder
3. Double-click to run

### Available Windows Formats

| Format | Filename Pattern | Description |
|--------|-----------------|-------------|
| NSIS Installer | `Fit-File-Viewer-nsis-x64-X.X.X.exe` | Standard Windows installer |
| MSI | `Fit-File-Viewer-msi-x64-X.X.X.msi` | Windows Installer package |
| Portable | `Fit-File-Viewer-portable-x64-X.X.X.exe` | No installation required |
| Squirrel | `Fit-File-Viewer-squirrel-x64-X.X.X.exe` | Auto-updating installer |

:::tip 32-bit Windows
Replace `x64` with `ia32` for 32-bit Windows versions.
:::

## 🍎 macOS

### Recommended: DMG

1. Download `Fit-File-Viewer-dmg-arm64-X.X.X.dmg` (Apple Silicon) or `x64` (Intel)
2. Open the DMG file
3. Drag FitFileViewer to your Applications folder
4. Launch from Applications or Spotlight

### Alternative: PKG Installer

1. Download `Fit-File-Viewer-pkg-arm64-X.X.X.pkg`
2. Double-click to run the installer
3. Follow the installation prompts

### Universal Binary

For compatibility with both Intel and Apple Silicon Macs:

- Download `Fit-File-Viewer-dmg-universal-X.X.X.dmg`

### Available macOS Formats

| Architecture | DMG | PKG |
|-------------|-----|-----|
| Apple Silicon (M1/M2/M3) | `dmg-arm64` | `pkg-arm64` |
| Intel | `dmg-x64` | `pkg-x64` |
| Universal | `dmg-universal` | `pkg-universal` |

:::note Security Warning
If macOS shows a security warning, go to **System Preferences → Security & Privacy** and click "Open Anyway".
:::

## 🐧 Linux

### Recommended: AppImage

AppImage works on most Linux distributions:

1. Download `Fit-File-Viewer-appimage-x86_64-X.X.X.AppImage`
2. Make it executable:
   ```bash
   chmod +x Fit-File-Viewer-appimage-x86_64-X.X.X.AppImage
   ```
3. Run it:
   ```bash
   ./Fit-File-Viewer-appimage-x86_64-X.X.X.AppImage
   ```

### Debian/Ubuntu (`.deb`)

```bash
sudo dpkg -i Fit-File-Viewer-deb-amd64-X.X.X.deb
sudo apt-get install -f  # Install dependencies if needed
```

### Fedora/RHEL (`.rpm`)

```bash
sudo rpm -i Fit-File-Viewer-rpm-x86_64-X.X.X.rpm
# or with dnf
sudo dnf install Fit-File-Viewer-rpm-x86_64-X.X.X.rpm
```

### Arch Linux (`.pacman`)

```bash
sudo pacman -U Fit-File-Viewer-pacman-x64-X.X.X.pacman
```

### Snap

```bash
sudo snap install Fit-File-Viewer-snap-amd64-X.X.X.snap --dangerous
```

### Flatpak

```bash
flatpak install FitFileViewer-vX.X.X.flatpak
```

### Available Linux Formats

| Format | Package Manager | Filename Pattern |
|--------|----------------|------------------|
| AppImage | Universal | `appimage-x86_64` |
| DEB | apt/dpkg | `deb-amd64` |
| RPM | dnf/rpm | `rpm-x86_64` |
| Pacman | pacman | `pacman-x64` |
| Snap | snapd | `snap-amd64` |
| Flatpak | flatpak | `flatpak` |
| APK | Alpine | `apk-x64` |

## 🔄 Updating

### Windows

- **NSIS/Squirrel**: Auto-update notifications when available
- **MSI/Portable**: Download and install the new version

### macOS

- Check for updates in the app or download the latest version

### Linux

- **AppImage**: Download the new version
- **Package managers**: Update through your package manager

## 🔧 System Requirements

### Minimum

- **OS**: Windows 10+, macOS 10.14+, or Linux (most distributions)
- **Memory**: 4GB RAM
- **Storage**: 200MB free disk space
- **Display**: 1024x768 resolution

### Recommended

- **OS**: Windows 11, macOS 14+, or latest Linux LTS
- **Memory**: 8GB RAM
- **Storage**: 500MB free disk space
- **Display**: 1920x1080 resolution

## ❓ Troubleshooting Installation

### Windows: "Windows protected your PC"

1. Click "More info"
2. Click "Run anyway"

### macOS: "App is damaged and can't be opened"

Run this command in Terminal:

```bash
xattr -cr /Applications/FitFileViewer.app
```

### Linux: Missing Dependencies

Install required libraries:

```bash
# Debian/Ubuntu
sudo apt-get install libgtk-3-0 libnotify4 libnss3 libxss1 libxtst6 xdg-utils

# Fedora
sudo dnf install gtk3 libnotify nss libXScrnSaver libXtst xdg-utils
```

---

**Next Step:** [Quick Start Guide →](/docs/getting-started/quick-start)
