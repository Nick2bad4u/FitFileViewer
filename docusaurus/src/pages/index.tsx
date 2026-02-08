import type { JSX } from "react";

import Link from "@docusaurus/Link";
import useBaseUrl from "@docusaurus/useBaseUrl";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import GitHubStatsComponent from "@site/src/components/GitHubStats";
import HomepageFeatures from "@site/src/components/HomepageFeatures";
import Heading from "@theme/Heading";
import Layout from "@theme/Layout";
import clsx from "clsx";

import styles from "./index.module.css";

/**
 * Copies code to clipboard with fallback support.
 */
const handleCopyCode = (() => {
    // Module-scoped variable to track the feedback timer for proper cleanup
    let feedbackTimer: null | ReturnType<typeof setTimeout> = null;

    return async (): Promise<void> => {
        const code = `{
  "name": "fitfileviewer",
  "version": "29.3.0",
  "description": "Fit File Viewer - Cross-platform .fit file viewer",
  "main": "main.js",
  "scripts": {
    "start": "electron .",
    "build": "electron-builder",
    "test": "vitest"
  },
  "dependencies": {
    "@garmin/fitsdk": "^21.178.0",
    "chart.js": "^4.5.1",
    "electron": "^39.2.3",
    "leaflet": "^1.9.4"
  },
  "license": "Unlicense"
}`;

        // Try modern clipboard API first (browser environment only)
        if (
            typeof window !== "undefined" &&
            "navigator" in window &&

            window.navigator.clipboard
        ) {
            try {
                await window.navigator.clipboard.writeText(code);
                // Simple feedback
                const button = document.activeElement;
                if (button && button instanceof HTMLButtonElement) {
                    const originalText = button.textContent;
                    button.textContent = "Copied!";

                    // Clear any existing feedback timer
                    if (feedbackTimer) {
                        clearTimeout(feedbackTimer);
                    }

                    feedbackTimer = setTimeout(() => {
                        button.textContent = originalText;
                        feedbackTimer = null;
                    }, 1000);
                }
                return;
            } catch {
                // Fall through to the older method
            }
        }

        // Fallback for older browsers or when navigator is not available
        const textArea = document.createElement("textarea");
        textArea.value = code;
        document.body.append(textArea);
        textArea.select();
        try {
            document.execCommand("copy");
        } catch {
            console.warn("Copy to clipboard not supported");
        }
        textArea.remove();
    };
})();

/**
 * Wrapper for handleCopyCode to handle the async function in onClick.
 */
const handleCopyCodeClick = (): void => {

    void handleCopyCode().catch((error: unknown) => {
        console.error("Failed to copy code:", error);
    });
};

/**
 * Handles demo button click with feedback message.
 */
const handleDemoButtonClick = (): void => {
    // Show a simple demo message
    // eslint-disable-next-line no-alert -- Alert is acceptable for user feedback in documentation context
    alert(
        "🎯 Demo Feature!\n\nThis is just a UI demonstration. Download the app to start viewing your .fit files!"
    );
};

/**
 * Renders a demo UI window showcasing the FitFileViewer app interface.
 */
const UIDemo = (): JSX.Element => {
    // Static demo data representing FIT file activities
    const activities = [
        {
            distance: "25.4 km",
            duration: "1:15:23",
            type: "🚴 Cycling",
            date: "Today",
        },
        {
            distance: "5.2 km",
            duration: "0:28:45",
            type: "🏃 Running",
            date: "Yesterday",
        },
        {
            distance: "1.5 km",
            duration: "0:45:00",
            type: "🏊 Swimming",
            date: "2 days ago",
        },
    ];

    return (
        <div className={clsx(styles["app-window"], styles["scroll-reveal"])}>
            <div className={styles["app-header"]}>
                <div className={styles["app-buttons"]}>
                    <span className={styles["app-button-red"]} />
                    <span className={styles["app-button-yellow"]} />
                    <span className={styles["app-button-green"]} />
                </div>
                <span className={styles["app-title"]}>FitFileViewer</span>
            </div>
            <div className={styles["app-body"]}>
                <div className={styles["app-toolbar"]}>
                    <button
                        className={styles["add-button"]}
                        onClick={handleDemoButtonClick}
                        title="Demo button - not functional"
                        type="button"
                    >
                        📂 Open FIT File (Demo)
                    </button>
                    <span className={styles["status-count"]}>
                        {activities.length} activities loaded
                    </span>
                </div>
                <div className={styles["site-list"]}>
                    {activities.map((activity) => (
                        <div className={styles["site-item"]} key={activity.type + activity.date}>
                            <div className={styles["site-status"]}>
                                <span className={styles["status-dot"]} data-status="up" />
                                <span className={styles["site-url"]}>{activity.type}</span>
                            </div>
                            <div className={styles["site-metrics"]}>
                                <span className={styles["response-time"]}>{activity.distance}</span>
                                <span className={styles["uptime"]}>{activity.duration}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

/**
 * Renders the homepage header section with hero content.
 */
const HomepageHeader = (): JSX.Element => (
    <header className={clsx("hero", "hero--primary", styles["hero-section"])}>
        <div className="container">
            <div className={styles["hero-content"]}>
                <div className={styles["hero-text"]}>
                    <Heading
                        as="h1"
                        className={`${styles["hero-title"]} gradient-text-animated hero__title`}
                    >
                        View Your Fitness Data
                        <br />
                        <span className={styles["accent"]}>
                            The Way It Should Be.
                        </span>
                    </Heading>
                    <p className={`${styles["hero-subtitle"]} hero__subtitle`}>
                        A powerful desktop application for viewing and analyzing .fit files
                        from Garmin and other fitness devices. Interactive maps, detailed charts,
                        and comprehensive data tables - all in one place.
                    </p>
                    <div className={styles["hero-cta"]}>
                        <Link
                            className={clsx(
                                "button",
                                styles["primary-button"],
                                "liquid-button"
                            )}
                            href="https://github.com/Nick2bad4u/FitFileViewer/releases"
                        >
                            Download Latest
                        </Link>
                        <Link
                            className={clsx(
                                "button",
                                styles["secondary-button"],
                                "liquid-button"
                            )}
                            to="/docs"
                        >
                            View Docs
                        </Link>
                        <GitHubStatsComponent />
                    </div>
                </div>
                <div className={styles["hero-demo"]}>
                    <UIDemo />
                </div>
            </div>
        </div>
    </header>
);

/**
 * Value-focused section describing why FitFileViewer is useful, without
 * relying on subjective user reviews.
 */
const RealTimeStatus = (): JSX.Element => (
    <section className={styles["status-section"]}>
        <div className="container">
            <Heading as="h2" className={styles["section-title"]}>
                ✨ Why FitFileViewer?
            </Heading>
            <div className={styles["status-grid"]}>
                <div
                    className={clsx(styles["status-card"], styles["scroll-reveal-left"])}
                >
                    <div className={styles["status-header"]}>
                        <span className={styles["status-indicator"]}>📊</span>
                        <span className={styles["status-text"]}>
                            Deep Activity Insight
                        </span>
                    </div>
                    <p className={styles["status-description"]}>
                        Inspect every data point from your .fit files: pace, heart rate,
                        power, cadence, elevation, laps, and more. Flexible charts and
                        data tables let you drill into exactly the metrics you care about.
                    </p>
                </div>
                <div
                    className={clsx(styles["status-card"], styles["scroll-reveal"])}
                >
                    <div className={styles["status-header"]}>
                        <span className={styles["status-indicator"]}>🛡️</span>
                        <span className={styles["status-text"]}>
                            Privacy by Design
                        </span>
                    </div>
                    <p className={styles["status-description"]}>
                        FitFileViewer works completely offline. Your activities stay on
                        your machine: no logins, no sync jobs, no background uploads to
                        third-party servers.
                    </p>
                </div>
                <div
                    className={clsx(styles["status-card"], styles["scroll-reveal-right"])}
                >
                    <div className={styles["status-header"]}>
                        <span className={styles["status-indicator"]}>⚙️</span>
                        <span className={styles["status-text"]}>
                            Built for Power Users
                        </span>
                    </div>
                    <p className={styles["status-description"]}>
                        Keyboard shortcuts, multi-window workflows, and a focus on raw
                        data make FitFileViewer ideal for athletes, coaches, and
                        developers who want full control over their analysis.
                    </p>
                </div>
            </div>
        </div>
    </section>
);

/**
 * Renders the technology stack section.
 */
const TechStack = (): JSX.Element => (
    <section className={styles["tech-section"]}>
        <div className="container">
            <div className={styles["tech-content"]}>
                <div className={styles["tech-info"]}>
                    <Heading as="h2">
                        Built for Athletes, by Athletes
                    </Heading>
                    <p>
                        FitFileViewer is a free, open-source tool designed to give you
                        complete control over your fitness data. No subscriptions, no
                        cloud uploads, no data mining - just pure analysis.
                    </p>
                    <div className={styles["tech-features"]}>
                        <div className={styles["tech-feature"]}>
                            <strong>🔓 Fully Open Source</strong>
                            <p>
                                View the code, contribute features, or customize it for
                                your needs. It&apos;s all on GitHub under the Unlicense.
                            </p>
                        </div>
                        <div className={styles["tech-feature"]}>
                            <strong>🖥️ Cross-Platform Desktop</strong>
                            <p>
                                Native apps for Windows, macOS, and Linux. Works offline
                                with all your data stored locally.
                            </p>
                        </div>
                        <div className={styles["tech-feature"]}>
                            <strong>📊 Powerful Visualization</strong>
                            <p>
                                Leaflet maps, Chart.js graphs, and DataTables for
                                comprehensive activity analysis.
                            </p>
                        </div>
                    </div>
                </div>
                <div className={styles["tech-code"]}>
                    <div className={styles["code-block"]}>
                        <div className={styles["code-header"]}>
                            <span>package.json</span>
                            <div className={styles["code-actions"]}>
                                <button
                                    className={styles["copy-button"]}
                                    onClick={handleCopyCodeClick}
                                    type="button"
                                >
                                    📋 Copy
                                </button>
                                <a
                                    className={styles["view-button"]}
                                    href="https://github.com/Nick2bad4u/FitFileViewer/blob/main/electron-app/package.json"
                                    rel="noopener noreferrer"
                                    target="_blank"
                                >
                                    🔗 View Full
                                </a>
                            </div>
                        </div>
                        <pre className={styles["code-content"]}>
                            {`{
  "name": "fitfileviewer",
  "version": "29.3.0",
  "description": "Fit File Viewer - Cross-platform .fit file viewer",
  "main": "main.js",
  "scripts": {
    "start": "electron .",
    "build": "electron-builder",
    "test": "vitest"
  },
  "dependencies": {
    "@garmin/fitsdk": "^21.178.0",
    "chart.js": "^4.5.1",
    "electron": "^39.2.3",
    "leaflet": "^1.9.4"
  },
  "license": "Unlicense"
}`}
                        </pre>
                    </div>
                </div>
            </div>
        </div>
    </section>
);

/**
 * Screenshot gallery section for the homepage.
 *
 * Uses the same three screenshots showcased in the GitHub README.
 */
const ScreenshotGallery = (): JSX.Element => {
    const screenshots = [
        {
            title: "🗺️ Interactive Map",
            description: "Explore GPS routes, laps, overlays, and map tools.",
            docHref: "/docs/visualization/maps",
            imageAlt: "FitFileViewer map view screenshot",
            imagePath: "img/screenshots/MapsV2.png",
        },
        {
            title: "📋 Data Table",
            description: "Search, sort, and export detailed activity metrics.",
            docHref: "/docs/visualization/tables",
            imageAlt: "FitFileViewer data table screenshot",
            imagePath: "img/screenshots/DataV2.png",
        },
        {
            title: "📈 Charts",
            description: "Analyze trends with interactive, customizable charts.",
            docHref: "/docs/visualization/charts",
            imageAlt: "FitFileViewer charts screenshot",
            imagePath: "img/screenshots/ChartsV3.png",
        },
    ] as const;

    return (
        <section className={styles["screenshots-section"]}>
            <div className="container">
                <Heading as="h2" className={styles["section-title"]}>
                    🖼️ Screenshots
                </Heading>
                <p className={styles["screenshots-subtitle"]}>
                    A quick look at the Map, Tables, and Charts tabs.
                </p>
                <div className={styles["screenshot-grid"]}>
                    {screenshots.map((shot) => {
                        const imgSrc = useBaseUrl(shot.imagePath);
                        return (
                            <article className={styles["screenshot-card"]} key={shot.imagePath}>
                                <Link
                                    className={styles["screenshot-image-link"]}
                                    href={imgSrc}
                                    rel="noopener noreferrer"
                                    target="_blank"
                                    title="Open full-size image"
                                >
                                    <img
                                        alt={shot.imageAlt}
                                        className={styles["screenshot-image"]}
                                        loading="lazy"
                                        src={imgSrc}
                                    />
                                </Link>
                                <div className={styles["screenshot-body"]}>
                                    <Heading as="h3" className={styles["screenshot-title"]}>
                                        {shot.title}
                                    </Heading>
                                    <p className={styles["screenshot-description"]}>
                                        {shot.description}
                                    </p>
                                    <div className={styles["screenshot-actions"]}>
                                        <Link
                                            className={clsx(
                                                "button button--primary button--sm",
                                                styles["screenshot-action"]
                                            )}
                                            to={shot.docHref}
                                        >
                                            Learn more
                                        </Link>
                                        <Link
                                            className={clsx(
                                                "button button--secondary button--sm",
                                                styles["screenshot-action"]
                                            )}
                                            href={imgSrc}
                                            rel="noopener noreferrer"
                                            target="_blank"
                                        >
                                            View full size
                                        </Link>
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

/**
 * Renders the main homepage layout.
 */
export default function Home(): JSX.Element {
    const { siteConfig } = useDocusaurusContext();
    return (
        <Layout
            description="Open-source desktop application for viewing and analyzing .fit files from Garmin and other fitness devices. Interactive maps, charts, and data tables."
            title={`${siteConfig.title} - View and Analyze .fit Files`}
            wrapperClassName="home-page"
        >
            <HomepageHeader />
            <main>
                <HomepageFeatures />
                <RealTimeStatus />
                <ScreenshotGallery />
                <TechStack />
            </main>
        </Layout>
    );
}
