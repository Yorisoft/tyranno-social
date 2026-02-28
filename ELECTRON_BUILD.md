# Building Tyrannosocial Desktop App

This guide explains how to build Tyrannosocial as a standalone desktop application that can be shared offline.

## 🖥️ What You Get

After building, you'll have installable desktop apps:
- **Windows**: `.exe` installer and portable `.exe`
- **macOS**: `.dmg` installer and `.zip` archive
- **Linux**: `.AppImage` and `.deb` package

Users can download and run these files completely offline - no internet required after download!

## 📋 Prerequisites

- Node.js (v18 or later)
- npm (comes with Node.js)
- Git

### Platform-Specific Requirements:

**Windows:**
- No additional requirements

**macOS:**
- Xcode Command Line Tools: `xcode-select --install`

**Linux:**
- `sudo apt-get install -y rpm`

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Test the Desktop App Locally

```bash
npm run electron:dev
```

This opens Tyrannosocial in an Electron window. Test all functionality to ensure everything works as expected.

### 3. Build for Your Platform

#### Build for Current Platform
```bash
npm run electron:build
```

#### Build for Specific Platforms

**Windows:**
```bash
npm run electron:build:win
```

**macOS:**
```bash
npm run electron:build:mac
```

**Linux:**
```bash
npm run electron:build:linux
```

### 4. Find Your Built Apps

Built applications are in the `dist-electron` folder:

```
dist-electron/
├── win-unpacked/           # Windows portable (no install)
├── Tyrannosocial Setup.exe # Windows installer
├── Tyrannosocial.dmg       # macOS installer
├── Tyrannosocial.app.zip   # macOS archive
├── Tyrannosocial.AppImage  # Linux portable
└── tyrannosocial.deb       # Linux Debian package
```

## 📦 Distributing Your App

### Option 1: Direct File Sharing
- Upload the installer files to cloud storage (Google Drive, Dropbox, etc.)
- Share the download link with users
- Users download and install - works completely offline after that!

### Option 2: GitHub Releases
1. Create a new release on GitHub
2. Upload the built files as release assets
3. Users download from the releases page

### Option 3: Your Own Website
- Host the installer files on your website
- Provide download links for each platform
- Example: "Download for Windows" → links to `.exe` file

## 🎯 Recommended Distribution

For easiest distribution, share these files:

- **Windows users**: `Tyrannosocial Setup.exe` (installer) or portable `.exe`
- **macOS users**: `Tyrannosocial.dmg` (drag-to-install)
- **Linux users**: `Tyrannosocial.AppImage` (just run it)

## 📊 File Sizes (Approximate)

- Windows installer: ~150-200 MB
- macOS DMG: ~160-220 MB
- Linux AppImage: ~150-200 MB

These sizes include the entire app + Chromium engine, making it a complete standalone application.

## 🔧 Customization

### Change App Icon
Replace these files with your custom icons:
- `public/icon-512.png`
- `public/icon-192.png`
- `public/apple-touch-icon.png`

### Change App Metadata
Edit `package.json`:
```json
{
  "name": "tyrannosocial",
  "version": "1.0.0",
  "author": "Your Name",
  "description": "Your Description"
}
```

### Advanced Build Options
Edit the `build` section in `package.json` for advanced configuration:
- Code signing
- Auto-updates
- Custom installer UI
- File associations

See [electron-builder docs](https://www.electron.build/) for all options.

## 🐛 Troubleshooting

### Build Fails
```bash
# Clear cache and rebuild
rm -rf node_modules dist dist-electron
npm install
npm run electron:build
```

### App Won't Start
- Check console output when running `npm run electron:dev`
- Ensure all dependencies installed: `npm install`
- Try rebuilding: `npm run build && npm run electron:build`

### Large File Sizes
This is normal! Electron bundles Chromium (~120MB) to ensure the app works on any computer without dependencies.

## 💡 Tips

1. **Test locally first**: Always run `electron:dev` before building
2. **Version your releases**: Update version in `package.json` for each release
3. **Cross-platform builds**: Build on each OS for best results (Windows build on Windows, etc.)
4. **Code signing**: For production, consider code signing certificates (prevents security warnings)

## 🌐 PWA vs Desktop App

**PWA (Web):**
- ✅ Lightweight (no download)
- ✅ Auto-updates instantly
- ✅ Cross-platform from one URL
- ❌ Requires internet once to install

**Desktop App (Electron):**
- ✅ True offline - works without ever connecting
- ✅ Native OS integration
- ✅ Distribute as downloadable file
- ❌ Larger file size (~150-200 MB)
- ❌ Manual updates required

**Best Approach:** Offer both! PWA for easy access, Desktop for offline users.

## 📝 License

Same license as Tyrannosocial (check main README).

---

**Questions?** Check the [Electron Builder documentation](https://www.electron.build/) or create an issue on GitHub.
