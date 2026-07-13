# FitFileViewer Documentation

This directory contains the Docusaurus documentation site for FitFileViewer.

## 🌐 Live Site

**Production**: <https://nick2bad4u.github.io/FitFileViewer>

## Quick Start

Run docs commands from the repository root so they use the shared workspace
lockfile and root script wrappers.

```bash
# Install dependencies
npm install

# Start development server
npm run docs:start
```

The site will be available at <http://localhost:3000/>

For the full contributor setup, see
[`docs/development/setup.md`](docs/development/setup.md). For build and release
details, see [`docs/development/build-release.md`](docs/development/build-release.md).

## 🏗️ Building

### Production Build (with TypeDoc API docs)

```bash
# Full build including auto-generated API documentation
npm run docs:build
```

This command:

1. Runs `npm run docs:typedoc` to generate API docs from source comments and
   TypeScript metadata
2. Runs `docusaurus build` to build the complete site

### Local Build

```bash
# Alias for the production docs build
npm run docs:build
```

### Serve Production Build Locally

```bash
# After building, serve the production build
npm run docs:serve
```

## 📚 TypeDoc Integration

### Auto-Generated API Documentation

TypeDoc automatically generates API documentation from the Electron app source
matched by the root `typedoc.json` entry points:

```bash
# Generate API docs only
npm run docs:typedoc
```

**Output**: `docs/api/` - Automatically included in sidebar under "API Reference → Generated API Docs"

### What Gets Documented

TypeDoc processes:

- Source files matched by `electron-app/**/*.{ts,mts,cts,tsx,js,jsx}`
- Formats documentation as Markdown
- Creates cross-references and type links
- Generates navigation structure

### Configuration

- **../typedoc.json** - Shared TypeDoc config for CI and local builds

This config:

- Uses `tsconfig.app.json` for type context
- Excludes tests, build outputs, and generated types
- Enables JSDoc compatibility mode
- Skips problematic files with broken type imports

## Structure

```text
docusaurus/
├── docs/                    # Documentation files
│   ├── getting-started/     # Getting started guides
│   ├── user-guide/          # User documentation
│   ├── visualization/       # Data visualization guides
│   ├── architecture/        # Technical architecture
│   ├── development/         # Developer guides
│   ├── api-reference/       # API documentation
│   └── advanced/            # Advanced topics
├── blog/                    # Blog posts
├── src/                     # Custom React components
│   ├── components/          # Reusable components
│   ├── css/                 # Custom styles
│   ├── js/                  # Custom JavaScript
│   └── pages/               # Custom pages
├── static/                  # Static files
│   └── img/                 # Images
├── docusaurus.config.ts     # Site configuration
├── sidebars.ts              # Sidebar configuration
└── package.json             # Docusaurus workspace dependencies
```

## Adding Documentation

### New Doc Page

1. Create a `.md` file in the appropriate `docs/` subdirectory
2. Add frontmatter with title and sidebar position
3. The page will automatically appear in the sidebar

Example:

```markdown
---
id: my-page
title: My Page Title
sidebar_label: My Page
sidebar_position: 1
description: Page description
---

# My Page

Content here...
```

### New Blog Post

Create a file in `blog/` with format `YYYY-MM-DD-slug.md`:

```markdown
---
slug: my-post
title: My Post Title
authors: [Nick2bad4u]
tags: [tag1, tag2]
---

Post content...

<!-- truncate -->

More content after the fold...
```

## Deployment

The documentation is automatically deployed to GitHub Pages via GitHub Actions.

To manually deploy:

```bash
npm run docs:deploy
```

## Resources

- [Docusaurus Documentation](https://docusaurus.io/docs)
- [MDX Documentation](https://mdxjs.com/)
- [FitFileViewer Repository](https://github.com/Nick2bad4u/FitFileViewer)
