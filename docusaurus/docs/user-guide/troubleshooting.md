---
id: troubleshooting
title: Troubleshooting
sidebar_label: 🔧 Troubleshooting
sidebar_position: 6
description: Common issues and solutions for FitFileViewer.
---

# Troubleshooting

Solutions to common issues in FitFileViewer.

## Common Issues

### File Won't Open

**Symptoms:**
- Error message when opening file
- Application shows blank screen
- File appears corrupted

**Solutions:**

1. **Verify file format**
   - Ensure it's a `.fit` file
   - Check file isn't corrupted
   - Try re-exporting from your device

2. **Check file size**
   - Very large files (100MB+) may take time
   - Wait for loading indicator to finish

3. **Try a different file**
   - Test with another known-good FIT file
   - Check if issue is file-specific

### No GPS Data Shown

**Symptoms:**
- Map tab shows "No GPS data"
- Route doesn't appear on map

**Causes & Solutions:**

| Cause | Solution |
|-------|----------|
| Indoor activity | GPS wasn't recorded - normal behavior |
| GPS disabled | Enable GPS on device for future activities |
| Data corruption | Re-export or recover from device |

### Application Won't Start

**Windows Solutions:**

1. **Run as Administrator**
   - Right-click → Run as administrator

2. **Check antivirus**
   - Add exception for FitFileViewer
   - Temporarily disable and test

3. **Reinstall**
   - Uninstall completely
   - Download fresh copy
   - Reinstall

**macOS Solutions:**

1. **Security settings**
   - System Preferences → Security & Privacy
   - Click "Open Anyway"

2. **Clear quarantine**
   ```bash
   xattr -cr /Applications/FitFileViewer.app
   ```

**Linux Solutions:**

1. **Make executable**
   ```bash
   chmod +x FitFileViewer*.AppImage
   ```

2. **Install dependencies**
   ```bash
   # Ubuntu/Debian
   sudo apt-get install libgtk-3-0 libnotify4 libnss3

   # Fedora
   sudo dnf install gtk3 libnotify nss
   ```

### Performance Issues

**Symptoms:**
- Slow loading
- Laggy interface
- High memory usage

**Solutions:**

1. **Close other applications**
   - Free up system memory

2. **Check file size**
   - Large files need more resources

3. **Restart application**
   - Clear any memory leaks

4. **Update graphics drivers**
   - Especially for map rendering

### Display Issues

**Symptoms:**
- UI appears too small/large
- Text is blurry
- Colors look wrong

**Solutions:**

1. **Adjust DPI settings**
   - Windows: Display settings → Scale
   - macOS: Display preferences

2. **Try different theme**
   - Switch between light/dark mode

3. **Update application**
   - Check for newer version

### Charts Not Rendering

**Symptoms:**
- Blank chart area
- Charts not interactive

**Solutions:**

1. **Check for data**
   - Some activities may not have certain data types
   - HR chart needs heart rate data, etc.

2. **Reset view**
   - Double-click to reset zoom

3. **Reload file**
   - `Ctrl/Cmd + R`

## Error Messages

### "Invalid FIT File"

The file is corrupted or not a FIT file.

**Solutions:**
- Re-export from original device
- Try different file
- Check file extension is `.fit`

### "Failed to Parse Data"

The FIT file structure is unexpected.

**Solutions:**
- Update FitFileViewer to latest version
- Report issue with sample file

### "Out of Memory"

The file is too large for available memory.

**Solutions:**
- Close other applications
- Increase system virtual memory
- Try smaller file segments

## Getting Help

### Check Documentation

- Browse this documentation site
- Search for specific topics

### Report Issues

If you can't solve the problem:

1. Go to [GitHub Issues](https://github.com/Nick2bad4u/FitFileViewer/issues)
2. Click "New Issue"
3. Provide:
   - Operating system and version
   - FitFileViewer version
   - Steps to reproduce
   - Error messages
   - Sample file (if possible)

### Community

- Check existing issues for solutions
- Join discussions on GitHub

## FAQ

**Q: Why doesn't FitFileViewer support GPX files?**
A: FitFileViewer is specifically designed for FIT files, which contain richer data than GPX. GPX support may be added in the future.

**Q: Can I edit my FIT files?**
A: No, FitFileViewer is a viewer only. It doesn't modify your files.

**Q: Where are my preferences stored?**
A: In your system's app data folder. The exact location varies by OS.

**Q: Is my data sent anywhere?**
A: No. FitFileViewer works completely offline. Your data stays on your computer.

---

**Still stuck?** [Report an Issue](https://github.com/Nick2bad4u/FitFileViewer/issues/new)
