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

## 🏗️ Building

### Production Build (with TypeDoc API docs)

```bash
# Full build including auto-generated API documentation
npm run docs:build
```

This command:

1. Runs `npm run docs:typedoc` to generate API docs from JSDoc comments
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

TypeDoc automatically generates API documentation from JSDoc comments in the `electron-app/` directory:

```bash
# Generate API docs only
npm run docs:typedoc
```

**Output**: `docs/api/` - Automatically included in sidebar under "API Reference → Generated API Docs"

### What Gets Documented

TypeDoc processes:

- All `.js` files in `electron-app/` with JSDoc comments
- Formats documentation as Markdown
- Creates cross-references and type links
- Generates navigation structure

### Configuration

- **typedoc.json** - Shared TypeDoc config for CI and local builds

This config:

- Use `tsconfig.electron-app.json` for type context
- Exclude tests, build outputs, and generated types
- Enable JSDoc compatibility mode
- Skip problematic files with broken type imports

## Structure

```
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
└── package.json             # Dependencies
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
