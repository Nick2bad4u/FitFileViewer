# Docusaurus Setup Checklist

Use this checklist to verify your documentation site is working correctly.

## ✅ Initial Setup

- [ ] Start from the repository root
- [ ] Run `npm install` to install workspace dependencies
- [ ] Verify no major installation errors

## ✅ Development Server

- [ ] Run `npm run docs:start`
- [ ] Browser opens to <http://localhost:3000/>
- [ ] Homepage loads with FitFileViewer branding
- [ ] Dark theme is active by default
- [ ] Navigation menu works

## ✅ Documentation Pages

- [ ] Click "Documentation" in navbar
- [ ] Overview page loads
- [ ] Sidebar shows all categories:
  - 🚀 Getting Started
  - 👤 User Guide
  - 📊 Data Visualization
  - 🏗️ Architecture
  - 🛠️ Development
  - 🔧 API Reference
  - 🧪 Advanced Topics
  - 📰 Blog
- [ ] Navigate to different docs pages
- [ ] All links work (no 404s)

## ✅ TypeDoc API Generation

- [ ] Run `npm run docs:typedoc`
- [ ] Check for warnings (expected about `.d.ts` files)
- [ ] Verify `docs/api/` directory is created
- [ ] Check `docs/api/` contains generated markdown files
- [ ] Files have proper frontmatter and navigation

## ✅ Production Build

- [ ] Run `npm run docs:build`
- [ ] TypeDoc runs first
- [ ] Docusaurus build completes
- [ ] No critical errors
- [ ] `build/` directory created
- [ ] Run `npm run docs:serve`
- [ ] Preview build at <http://localhost:3000/>
- [ ] All features work in production build

## ✅ Search

- [ ] Type in search box
- [ ] Search results appear
- [ ] Click a result
- [ ] Navigates to correct page

## ✅ Features

- [ ] Mermaid diagrams render (check Architecture pages)
- [ ] Code blocks have copy buttons
- [ ] Images can be clicked to zoom
- [ ] Theme toggle works (☀️/🌙)
- [ ] Mobile responsive (resize browser)

## ✅ Blog

- [ ] Click "Blog" in navbar
- [ ] Blog homepage loads
- [ ] Welcome post is visible
- [ ] Post content displays correctly

## ✅ GitHub Pages URL

- [ ] Site URLs use `https://nick2bad4u.github.io/FitFileViewer/`
- [ ] Production paths include the `/FitFileViewer/` base URL
- [ ] Social card image URL is correct
- [ ] All internal links work with root baseUrl

## ✅ GitHub Actions

- [ ] Workflow file exists: `.github/workflows/docusaurus.yml`
- [ ] Workflow uses correct environment variables:
  - `DOCUSAURUS_SITE_URL: https://nick2bad4u.github.io`
  - `DOCUSAURUS_BASE_URL: /FitFileViewer/`
- [ ] Workflow triggers on push to main and docusaurus changes

## 🐛 Known Warnings (Can Ignore)

These warnings are **expected** and safe to ignore:

### TypeDoc Warnings

```
[warning] The entry point .../types/.../*.d.ts is not referenced by the 'files' or 'include' option in your tsconfig
```

**Reason**: Generated `.d.ts` files are outputs, not sources. They're excluded from TypeDoc processing.

### TypeScript Compilation Errors (Before root npm install)

```
Cannot find module '@docusaurus/...' or its corresponding type declarations
```

**Reason**: Workspace dependencies not installed yet. Resolved after root `npm install`.

## 🚨 Critical Issues to Fix

If you see these, something is wrong:

- ❌ TypeDoc crashes completely (not just warnings)
- ❌ Docusaurus build fails
- ❌ 404 errors on documentation pages
- ❌ Homepage doesn't render
- ❌ Search doesn't work

## 📝 Next Steps After Verification

1. **Customize Content**
   - Update blog posts in `blog/`
   - Add more documentation in `docs/`
   - Update homepage content in `src/pages/index.tsx`

2. **Add Images**
   - Add screenshots to `../docs/screenshots/`; root docs scripts sync the
     homepage copies into `static/img/screenshots/`
   - Create social card image: `static/img/fitfileviewer-social-card.png`
   - Update the canonical app favicon in `../electron-app/icons/favicon.ico`

3. **Deploy**
   - Commit and push to `main` branch
   - GitHub Actions will build and deploy
   - Site will be live at <https://nick2bad4u.github.io/FitFileViewer>

## 🔧 Troubleshooting

### TypeDoc Fails

1. Check `../typedoc.json` exclude list
2. Run `npm run docs:typedoc` separately from the repository root to see full output
3. Check electron-app JSDoc comments are valid
4. See `SETUP.md` for detailed troubleshooting

### Build Fails

1. Clear Docusaurus cache: `npm run docs:clear`
2. Delete `node_modules` and `package-lock.json`
3. Reinstall from the repository root: `npm install`
4. Try building again

### Pages Don't Load

1. Check browser console for errors
2. Verify all markdown files have proper frontmatter
3. Check `sidebars.ts` references match actual file paths
4. Clear browser cache

---

**Need Help?** See [SETUP.md](SETUP.md) for detailed documentation.
