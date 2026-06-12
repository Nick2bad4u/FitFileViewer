---
id: system-requirements
title: System Requirements
sidebar_label: 💻 System Requirements
sidebar_position: 3
description: Hardware and software requirements for running FitFileViewer.
keywords:
 - requirements
 - hardware
 - software
 - compatibility
---

# System Requirements

FitFileViewer is designed to run on a wide range of hardware. Here are the system requirements.

## 📋 Operating System

### Windows

| Version     | Support Level           |
| ----------- | ----------------------- |
| Windows 11  | ✅ Fully Supported      |
| Windows 10  | ✅ Fully Supported      |
| Windows 8.1 | ⚠️ Limited Support      |
| Windows 7   | ⚠️ Legacy Snapshot Only |

### macOS

| Version             | Support Level      |
| ------------------- | ------------------ |
| macOS 14 (Sonoma)   | ✅ Fully Supported |
| macOS 13 (Ventura)  | ✅ Fully Supported |
| macOS 12 (Monterey) | ✅ Fully Supported |
| macOS 11 (Big Sur)  | ✅ Supported       |
| macOS 10.14-10.15   | ⚠️ Limited Support |

**Architecture:**

- ✅ Apple Silicon (M1/M2/M3)
- ✅ Intel x64

### Linux

| Distribution  | Support Level           |
| ------------- | ----------------------- |
| Ubuntu 22.04+ | ✅ Fully Supported      |
| Debian 11+    | ✅ Fully Supported      |
| Fedora 38+    | ✅ Fully Supported      |
| Arch Linux    | ✅ Supported            |
| openSUSE      | ✅ Supported            |
| Other         | ⚠️ AppImage recommended |

## 🖥️ Hardware Requirements

### Minimum

| Component     | Requirement                       |
| ------------- | --------------------------------- |
| **Processor** | Dual-core 1.6 GHz                 |
| **Memory**    | 4 GB RAM                          |
| **Storage**   | 200 MB free space                 |
| **Display**   | 1024 x 768 resolution             |
| **Graphics**  | Any GPU with basic OpenGL support |

### Recommended

| Component     | Recommendation                         |
| ------------- | -------------------------------------- |
| **Processor** | Quad-core 2.0 GHz or better            |
| **Memory**    | 8 GB RAM or more                       |
| **Storage**   | 500 MB free space                      |
| **Display**   | 1920 x 1080 resolution                 |
| **Graphics**  | Dedicated GPU for smooth map rendering |

### For Large Files

If you work with long activities (several hours) or high-frequency data:

| Component     | Recommendation             |
| ------------- | -------------------------- |
| **Memory**    | 16 GB RAM                  |
| **Processor** | Modern quad-core or better |

## 📁 File Support

### Supported File Types

| Format     | Extension | Support Level   |
| ---------- | --------- | --------------- |
| Garmin FIT | `.fit`    | ✅ Full Support |

### File Size Limits

| File Size   | Performance             |
| ----------- | ----------------------- |
| Up to 10 MB | ⚡ Excellent            |
| 10-50 MB    | 👍 Good                 |
| 50-100 MB   | ⚠️ May be slow          |
| 100+ MB     | ⚠️ May require patience |

## 🌐 Network Requirements

FitFileViewer works **completely offline** once installed. However, network access is helpful for:

- ✅ **Map tiles**: Online maps require internet (cached after viewing)
- ✅ **Auto-updates**: Checking for new versions
- ✅ **GitHub integration**: Reporting issues, checking releases

### Offline Mode

When offline:

- 📊 Charts work fully offline
- 📋 Tables work fully offline
- 📄 Summary works fully offline
- 🗺️ Maps use cached tiles or show placeholder

## ⚡ Performance Tips

### For Better Performance

1. **Close unused applications** to free up memory
2. **Use SSD storage** for faster file loading
3. **Keep graphics drivers updated** for smooth map rendering
4. **Increase available RAM** if working with large files

### For Large Files

1. **Be patient** - large files take time to parse
2. **Consider splitting** very long activities
3. **Use data smoothing** options if available
4. **Export smaller segments** for detailed analysis

## 🔧 Dependencies

FitFileViewer includes all necessary dependencies. No additional software is required.

### Bundled Technologies

| Technology     | Purpose                       |
| -------------- | ----------------------------- |
| Electron       | Desktop application framework |
| Chart.js       | Performance charts            |
| Leaflet        | Interactive maps              |
| DataTables     | Data table display            |
| Garmin FIT SDK | FIT file parsing              |

## 🐛 Known Compatibility Issues

### Windows

- **Antivirus false positives**: Some antivirus software may flag new applications. You may need to add an exception.
- **High DPI displays**: Some UI elements may appear small on 4K displays.

### macOS

- **Gatekeeper warnings**: First launch may require approval in Security settings.
- **Notarization**: The app is notarized for macOS.

### Linux

- **Wayland**: Some features may work differently on Wayland vs X11.
- **Missing dependencies**: Install gtk3, nss, and other libraries if needed.

---

**Ready to Install?** [Go to Installation Guide →](/docs/getting-started/installation)
