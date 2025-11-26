// eslint-disable-next-line @eslint-community/eslint-comments/disable-enable-pair -- We want to disable this rule for the whole file
/* eslint-disable n/no-process-env -- Needed for Github Action builds */
import type * as Preset from "@docusaurus/preset-classic";
import type { Config } from "@docusaurus/types";

import { fileURLToPath } from "node:url";

import { themes as prismThemes } from "prism-react-renderer";

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const siteUrl =
    process.env["DOCUSAURUS_SITE_URL"] ?? "https://fitfileviewer.typpi.online";
const baseUrl = process.env["DOCUSAURUS_BASE_URL"] ?? "/";
const enableExperimentalFaster =
    process.env["DOCUSAURUS_ENABLE_EXPERIMENTAL"] === "true";

const removeHeadAttrFlagKey = [
    "remove",
    "Le",
    "gacyPostBuildHeadAttribute",
].join("");

const futureConfig = {
    ...(enableExperimentalFaster
        ? {
              experimental_faster: {
                  mdxCrossCompilerCache: true,
                  rspackBundler: true,
                  rspackPersistentCache: true,
                  ssgWorkerThreads: true,
              },
          }
        : {}),
    v4: {
        [removeHeadAttrFlagKey]: true,
        useCssCascadeLayers: true,
    },
} satisfies Config["future"];

const socialCardImage = new URL(
    "img/fitfileviewer-social-card.png",
    `${siteUrl}${baseUrl}`
).toString();

const modernEnhancementsClientModule = fileURLToPath(
    new URL("src/js/modernEnhancements.ts", import.meta.url)
);

/**
 * Docusaurus site configuration for the FitFileViewer documentation.
 *
 * @remarks
 * Controls the docs, blog, pages, theming, plugins, and deployment settings
 * used when building the documentation site hosted on GitHub Pages.
 */
const config: Config = {
    // Set the /<baseUrl>/ pathname under which your site is served
    baseUrl,
    clientModules: [modernEnhancementsClientModule],

    deploymentBranch: "gh-pages",

    favicon: "img/favicon.ico",
    // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
    future: futureConfig,
    i18n: {
        defaultLocale: "en",
        locales: ["en"],
    },

    markdown: {
        anchors: {
            maintainCase: true,
        },
        format: "detect",
        hooks: {
            onBrokenMarkdownImages: "warn",
            onBrokenMarkdownLinks: "warn",
        },
        mdx1Compat: {
            admonitions: true,
            comments: true,
            headingIds: true,
        },
        mermaid: true,
    },
    onBrokenAnchors: "warn",
    onBrokenLinks: "warn",
    onDuplicateRoutes: "warn",
    organizationName: "Nick2bad4u",

    // TypeDoc documentation is generated via standalone TypeDoc (npm run docs:typedoc)
    // This uses our custom typedoc.config.json configuration for better docs
    plugins: [
        "docusaurus-plugin-image-zoom",
        [
            "docusaurus-plugin-copy-page-button",
            {
                customStyles: {
                    button: {
                        className: "button button--primary button--sm",
                        style: {
                            borderRadius: "999px",
                            boxShadow: "none",
                            fontWeight: 600,
                            letterSpacing: "0.01em",
                            padding: "0.35rem 0.85rem",
                            textTransform: "none",
                            zIndex: 99_999,
                        },
                    },
                    container: {
                        className: "copy-page-button__container",
                    },
                    dropdown: {
                        style: {
                            backgroundColor:
                                "var(--ifm-background-surface-color)",
                            border: "1px solid var(--ifm-color-emphasis-200)",
                            borderRadius: "0.5rem",
                            boxShadow:
                                "0 10px 30px rgba(15, 23, 42, 0.15), 0 1px 3px rgba(15, 23, 42, 0.08)",
                            minWidth: "13rem",
                            padding: "0.35rem 0",
                        },
                    },
                    dropdownItem: {
                        className: "menu__link",
                        style: {
                            borderRadius: "0.35rem",
                            fontWeight: 500,
                            margin: "0 0.35rem",
                            padding: "0.45rem 0.75rem",
                        },
                    },
                },
            },
        ],
        [
            "docusaurus-plugin-llms",
            {
                // Custom LLM files for specific documentation sections
                customLLMFiles: [],
                description:
                    "Complete reference documentation for FitFileViewer",
                docsDir: "docs",
                // Content cleaning options
                excludeImports: true,
                generateLLMsFullTxt: true,
                // Options here
                generateLLMsTxt: true,
                // Generate individual markdown files following llmstxt.org specification
                generateMarkdownFiles: true,
                ignoreFiles: ["advanced/*", "private/*"],
                includeBlog: true,
                // Control documentation order
                // includeOrder: [],
                includeUnmatchedLast: true,
                // Path transformation options
                // pathTransformation: {},
                removeDuplicateHeadings: true,
                title: "FitFileViewer Documentation",
            },
        ],
    ],
    presets: [
        [
            "classic",
            {
                blog: {
                    authorsMapPath: "authors.yml", // File located at blog/authors.yml
                    blogDescription: "Updates and posts about FitFileViewer",
                    blogSidebarCount: 5,
                    blogSidebarTitle: "Recent posts",
                    blogTitle: "FitFileViewer Blog",
                    editLocalizedFiles: false,
                    editUrl:
                        "https://github.com/Nick2bad4u/FitFileViewer/edit/main/docusaurus/blog/",
                    exclude: [
                        "**/_*.{js,jsx,ts,tsx,md,mdx}",
                        "**/_*/**",
                        "**/*.test.{js,jsx,ts,tsx}",
                        "**/__tests__/**",
                    ],
                    feedOptions: {
                        description: "FitFileViewer updates and changelogs",
                        limit: 20,
                        title: "FitFileViewer Blog",
                        type: ["rss", "atom"], // Enable rss + atom
                    },
                    include: ["**/*.{md,mdx}"],
                    path: "blog", // Relative to site dir
                    postsPerPage: 10,
                    routeBasePath: "blog", // URL: /blog/
                    showReadingTime: true,
                },
                debug: true,
                docs: {
                    breadcrumbs: true,
                    editUrl:
                        "https://github.com/Nick2bad4u/FitFileViewer/edit/main/docusaurus/",
                    exclude: [
                        "**/_*.{js,jsx,ts,tsx,md,mdx}",
                        "**/_*/**",
                        "**/*.test.{js,jsx,ts,tsx}",
                        "**/__tests__/**",
                    ],
                    include: ["**/*.md", "**/*.mdx"],
                    routeBasePath: "docs",
                    showLastUpdateAuthor: true,
                    showLastUpdateTime: true,
                    sidebarCollapsed: true,
                    sidebarCollapsible: true,
                    sidebarPath: "./sidebars.ts",
                },
                pages: {
                    editUrl:
                        "https://github.com/Nick2bad4u/FitFileViewer/edit/main/docusaurus/src/pages/",
                    include: ["**/*.{js,jsx,ts,tsx,md,mdx}"],
                    mdxPageComponent: "@theme/MDXPage",
                    path: "src/pages",
                    routeBasePath: "/",
                    showLastUpdateAuthor: true,
                    showLastUpdateTime: true,
                },
                sitemap: {
                    changefreq: "weekly",
                    filename: "sitemap.xml",
                    ignorePatterns: ["/tests/**"],
                    lastmod: "datetime",
                    priority: 0.5,
                },
                svgr: {
                    svgrConfig: {
                        dimensions: false, // Remove width/height so CSS controls size
                        expandProps: "start", // Spread props at the start: <svg {...props}>
                        icon: true, // Treat SVGs as icons (scales via viewBox)
                        memo: true, // Wrap component with React.memo
                        native: false, // Produce web React components (not React Native)
                        prettier: true, // Run Prettier on output
                        prettierConfig: "../.prettierrc",
                        replaceAttrValues: {
                            "#000": "currentColor",
                            "#000000": "currentColor",
                        }, // Inherit color
                        svgo: true, // Enable SVGO optimizations
                        svgoConfig: {
                            plugins: [
                                { active: false, name: "removeViewBox" }, // Keep viewBox for scalability
                            ],
                        },
                        svgProps: { focusable: "false", role: "img" }, // Default SVG props
                        titleProp: true, // Allow passing a title prop for accessibility
                        typescript: true, // Generate TypeScript-friendly output (.tsx)
                    },
                },
                theme: {
                    customCss: "./src/css/custom.css",
                },
            } satisfies Preset.Options,
        ],
    ],
    projectName: "FitFileViewer",

    tagline:
        "Cross-platform desktop application for viewing and analyzing .fit files from fitness devices",
    themeConfig: {
        announcementBar: {
            backgroundColor: "#1a1a2e",
            content:
                '🚴 <b>FitFileViewer</b> - View and analyze your Garmin .fit files! ⭐ <a target="_blank" rel="noopener noreferrer" href="https://github.com/Nick2bad4u/FitFileViewer/releases/latest">Download Latest Release</a>',
            id: "announcement_bar",
            isCloseable: true,
            textColor: "#4ade80",
        },
        colorMode: {
            defaultMode: "dark",
            disableSwitch: false,
            respectPrefersColorScheme: true,
        },
        docs: {
            sidebar: {
                autoCollapseCategories: true,
                hideable: true,
            },
            versionPersistence: "localStorage",
        },
        footer: {
            copyright: `© ${new Date().getFullYear()} Nick2bad4u. 💻 Website Built and Powered by 🦖 Docusaurus.`,
            links: [
                {
                    items: [
                        {
                            label: "📖 Getting Started",
                            to: "/docs/getting-started/installation",
                        },
                        {
                            label: "👤 User Guide",
                            to: "/docs/user-guide/opening-files",
                        },
                        {
                            label: "🏗️ Architecture",
                            to: "/docs/architecture/overview",
                        },
                        {
                            label: "🔧 API Reference",
                            to: "/docs/api-reference/core-apis",
                        },
                    ],
                    title: "📚 Documentation",
                },
                {
                    items: [
                        {
                            label: "🛠️ Development Guide",
                            to: "/docs/development/setup",
                        },
                        {
                            label: "📊 Performance",
                            to: "/docs/advanced/performance",
                        },
                        {
                            label: "🗺️ Maps & Charts",
                            to: "/docs/user-guide/data-visualization",
                        },
                        {
                            label: "🔄 State Management",
                            to: "/docs/api-reference/state-management",
                        },
                    ],
                    title: "🧠 Deep Dive",
                },
                {
                    items: [
                        {
                            href: "https://github.com/Nick2bad4u/FitFileViewer/releases",
                            label: "📦 Download Latest",
                        },
                        {
                            href: "https://github.com/Nick2bad4u/FitFileViewer",
                            label: "💻 Source Code",
                        },
                        {
                            href: "https://github.com/Nick2bad4u/FitFileViewer/issues",
                            label: "🐛 Report Issues",
                        },
                        {
                            href: "https://github.com/Nick2bad4u/FitFileViewer/blob/main/LICENSE.md",
                            label: "⚖️ UnLicense",
                        },
                    ],
                    title: "🚀 Get Involved",
                },
            ],
            style: "dark",
        },
        image: socialCardImage,

        liveCodeBlock: {
            /**
             * The position of the live playground, above or under the editor
             * Possible values: "top" | "bottom"
             */
            playgroundPosition: "bottom",
        },

        mermaid: {
            options: {
                configFile: "../mermaid.config.json",
            },
            theme: { dark: "dark", light: "neutral" },
        },
        metadata: [
            {
                content:
                    "fit file viewer, garmin, fitness, cycling, running, gps, activity tracker, electron app, data visualization",
                name: "keywords",
            },
            {
                content:
                    "FitFileViewer - Cross-platform desktop application for viewing and analyzing .fit files from fitness devices like Garmin watches and cycling computers",
                name: "description",
            },
            {
                content: "FitFileViewer",
                property: "og:site_name",
            },
            {
                content: "website",
                property: "og:type",
            },
            {
                content: socialCardImage,
                property: "og:image",
            },
            {
                content: `${siteUrl}${baseUrl}`,
                property: "og:url",
            },
            {
                content:
                    "FitFileViewer - View and analyze your Garmin .fit files with interactive maps, charts, and data tables",
                property: "og:description",
            },
            {
                content: "FitFileViewer | Cross-platform .fit file viewer",
                property: "og:title",
            },
        ],
        navbar: {
            hideOnScroll: true,
            items: [
                {
                    label: "Documentation",
                    position: "left",
                    sidebarId: "docsSidebar",
                    type: "docSidebar",
                },
                {
                    label: "Blog",
                    position: "left",
                    to: "/blog",
                },
                {
                    className: "persistent",
                    href: "https://github.com/Nick2bad4u/FitFileViewer",
                    label: "GitHub",
                    position: "right",
                },
                {
                    href: "https://github.com/Nick2bad4u/FitFileViewer/issues",
                    label: "Issues",
                    position: "right",
                },
                {
                    href: "https://github.com/Nick2bad4u/FitFileViewer/pulls?q=sort%3Aupdated-desc+is%3Apr+is%3Aopen",
                    label: "PRs",
                    position: "right",
                },
                {
                    href: "https://github.com/Nick2bad4u/FitFileViewer/actions",
                    label: "CI",
                    position: "right",
                },
                {
                    className: "persistent",
                    href: "https://github.com/Nick2bad4u/FitFileViewer/releases",
                    label: "Download",
                    position: "right",
                },
            ],
            logo: {
                alt: "FitFileViewer Logo",
                height: 32,
                src: "img/logo.svg",
                width: 32,
            },
            title: "FitFileViewer",
        },
        prism: {
            additionalLanguages: [
                "css",
                "git",
                "powershell",
                "bash",
                "json",
            ],
            darkTheme: prismThemes.dracula,
            defaultLanguage: "javascript",
            theme: prismThemes.github,
        },
        zoom: {
            background: {
                dark: "rgb(50, 50, 50)",
                light: "rgb(255, 255, 255)",
            },
            config: {
                // Options you can specify via https://github.com/francoischalifour/medium-zoom#usage
            },
            selector: ".markdown > img",
        },
    } satisfies Preset.ThemeConfig,
    themes: [
        "@docusaurus/theme-live-codeblock",
        "@docusaurus/theme-mermaid",
        [
            "@easyops-cn/docusaurus-search-local",
            {
                blogDir: "blog",
                blogRouteBasePath: "blog",
                docsDir: "docs",
                docsRouteBasePath: "docs",
                hashed: true,
                indexBlog: true,
                indexDocs: true,
                indexPages: false,
                language: ["en"],
                removeDefaultStopWordFilter: false,
                useAllContextsWithNoSearchContext: false,
            },
        ],
    ],

    title: "FitFileViewer",

    trailingSlash: false,

    // Set the production url of your site here
    url: siteUrl,
};

export default config;
