/* eslint-disable @eslint-community/eslint-comments/disable-enable-pair -- This page contains multiple unrelated eslint rules that cannot be properly paired */
/* eslint-disable tailwind/no-custom-classname -- Using Docusaurus CSS classes, not Tailwind */

import Heading from "@theme/Heading";
import HomepageFeatures from "@site/src/components/HomepageFeatures";
import Layout from "@theme/Layout";
import Link from "@docusaurus/Link";
import type { JSX } from "react";
import clsx from "clsx";
import styles from "./index.module.css";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import GitHubStatsComponent from "@site/src/components/GitHubStats";
import useBaseUrl from "@docusaurus/useBaseUrl";

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
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- Browser API access requires runtime checks
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
    // eslint-disable-next-line promise/prefer-await-to-then -- Using Promise.then for error handling pattern in this context
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
        <div className={clsx(styles["appWindow"], styles["scrollReveal"])}>
            <div className={styles["appHeader"]}>
                <div className={styles["appButtons"]}>
                    <span className={styles["appButtonRed"]} />
                    <span className={styles["appButtonYellow"]} />
                    <span className={styles["appButtonGreen"]} />
                </div>
                <span className={styles["appTitle"]}>FitFileViewer</span>
            </div>
            <div className={styles["appBody"]}>
                <div className={styles["appToolbar"]}>
                    <button
                        type="button"
                        className={styles["addButton"]}
                        onClick={handleDemoButtonClick}
                        title="Demo button - not functional"
                    >
                        📂 Open FIT File (Demo)
                    </button>
                    <span className={styles["statusCount"]}>
                        {activities.length} activities loaded
                    </span>
                </div>
                <div className={styles["siteList"]}>
                    {activities.map((activity) => (
                        <div key={activity.type + activity.date} className={styles["siteItem"]}>
                            <div className={styles["siteStatus"]}>
                                <span className={styles["statusDot"]} data-status="up" />
                                <span className={styles["siteUrl"]}>{activity.type}</span>
                            </div>
                            <div className={styles["siteMetrics"]}>
                                <span className={styles["responseTime"]}>{activity.distance}</span>
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
    <header className={clsx("hero", "hero--primary", styles["heroSection"])}>
        <div className="container">
            <div className={styles["heroContent"]}>
                <div className={styles["heroText"]}>
                    <Heading
                        as="h1"
                        className={`${styles["heroTitle"]} gradient-text-animated hero__title`}
                    >
                        View Your Fitness Data
                        <br />
                        <span className={styles["accent"]}>
                            The Way It Should Be.
                        </span>
                    </Heading>
                    <p
                        className={`${styles["heroSubtitle"]} hero__subtitle`}
                    >
                        A powerful desktop application for viewing and analyzing .fit files
                        from Garmin and other fitness devices. Interactive maps, detailed charts,
                        and comprehensive data tables - all in one place.
                    </p>
                    <div className={styles["heroCta"]}>
                        <Link
                            className={clsx(
                                "button",
                                styles["primaryButton"],
                                "liquid-button"
                            )}
                            href="https://github.com/Nick2bad4u/FitFileViewer/releases"
                        >
                            Download Latest
                        </Link>
                        <Link
                            className={clsx(
                                "button",
                                styles["secondaryButton"],
                                "liquid-button"
                            )}
                            to="/docs"
                        >
                            View Docs
                        </Link>
                        <GitHubStatsComponent />
                    </div>
                </div>
                <div className={styles["heroDemo"]}>
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
    <section className={styles["statusSection"]}>
        <div className="container">
            <Heading as="h2" className={styles["sectionTitle"]}>
                ✨ Why FitFileViewer?
            </Heading>
            <div className={styles["statusGrid"]}>
                <div
                        className={clsx(
                            styles["statusCard"],
                            styles["scrollRevealLeft"]
                        )}
                >
                    <div className={styles["statusHeader"]}>
                        <span className={styles["statusIndicator"]}>📊</span>
                        <span className={styles["statusText"]}>
                            Deep Activity Insight
                        </span>
                    </div>
                    <p className={styles["statusDescription"]}>
                        Inspect every data point from your .fit files: pace, heart rate,
                        power, cadence, elevation, laps, and more. Flexible charts and
                        data tables let you drill into exactly the metrics you care about.
                    </p>
                </div>
                <div
                        className={clsx(
                            styles["statusCard"],
                            styles["scrollReveal"]
                        )}
                >
                    <div className={styles["statusHeader"]}>
                        <span className={styles["statusIndicator"]}>🛡️</span>
                        <span className={styles["statusText"]}>
                            Privacy by Design
                        </span>
                    </div>
                    <p className={styles["statusDescription"]}>
                        FitFileViewer works completely offline. Your activities stay on
                        your machine: no logins, no sync jobs, no background uploads to
                        third-party servers.
                    </p>
                </div>
                <div
                        className={clsx(
                            styles["statusCard"],
                            styles["scrollRevealRight"]
                        )}
                >
                    <div className={styles["statusHeader"]}>
                        <span className={styles["statusIndicator"]}>⚙️</span>
                        <span className={styles["statusText"]}>
                            Built for Power Users
                        </span>
                    </div>
                    <p className={styles["statusDescription"]}>
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
    <section className={styles["techSection"]}>
        <div className="container">
            <div className={styles["techContent"]}>
                <div className={styles["techInfo"]}>
                    <Heading as="h2">
                        Built for Athletes, by Athletes
                    </Heading>
                    <p>
                        FitFileViewer is a free, open-source tool designed to give you
                        complete control over your fitness data. No subscriptions, no
                        cloud uploads, no data mining - just pure analysis.
                    </p>
                    <div className={styles["techFeatures"]}>
                        <div className={styles["techFeature"]}>
                            <strong>🔓 Fully Open Source</strong>
                            <p>
                                View the code, contribute features, or customize it for
                                your needs. It&apos;s all on GitHub under the Unlicense.
                            </p>
                        </div>
                        <div className={styles["techFeature"]}>
                            <strong>🖥️ Cross-Platform Desktop</strong>
                            <p>
                                Native apps for Windows, macOS, and Linux. Works offline
                                with all your data stored locally.
                            </p>
                        </div>
                        <div className={styles["techFeature"]}>
                            <strong>📊 Powerful Visualization</strong>
                            <p>
                                Leaflet maps, Chart.js graphs, and DataTables for
                                comprehensive activity analysis.
                            </p>
                        </div>
                    </div>
                </div>
                <div className={styles["techCode"]}>
                    <div className={styles["codeBlock"]}>
                        <div className={styles["codeHeader"]}>
                            <span>package.json</span>
                            <div className={styles["codeActions"]}>
                                <button
                                    type="button"
                                    className={styles["copyButton"]}
                                    onClick={handleCopyCodeClick}
                                >
                                    📋 Copy
                                </button>
                                <a
                                    href="https://github.com/Nick2bad4u/FitFileViewer/blob/main/electron-app/package.json"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles["viewButton"]}
                                >
                                    🔗 View Full
                                </a>
                            </div>
                        </div>
                        <pre className={styles["codeContent"]}>
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
        <section className={styles["screenshotsSection"]}>
            <div className="container">
                <Heading as="h2" className={styles["sectionTitle"]}>
                    🖼️ Screenshots
                </Heading>
                <p className={styles["screenshotsSubtitle"]}>
                    A quick look at the Map, Tables, and Charts tabs.
                </p>
                <div className={styles["screenshotGrid"]}>
                    {screenshots.map((shot) => {
                        const imgSrc = useBaseUrl(shot.imagePath);
                        return (
                            <article key={shot.imagePath} className={styles["screenshotCard"]}>
                                <Link
                                    className={styles["screenshotImageLink"]}
                                    href={imgSrc}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="Open full-size image"
                                >
                                    <img
                                        alt={shot.imageAlt}
                                        className={styles["screenshotImage"]}
                                        loading="lazy"
                                        src={imgSrc}
                                    />
                                </Link>
                                <div className={styles["screenshotBody"]}>
                                    <Heading as="h3" className={styles["screenshotTitle"]}>
                                        {shot.title}
                                    </Heading>
                                    <p className={styles["screenshotDescription"]}>
                                        {shot.description}
                                    </p>
                                    <div className={styles["screenshotActions"]}>
                                        <Link
                                            className={clsx(
                                                "button button--primary button--sm",
                                                styles["screenshotAction"]
                                            )}
                                            to={shot.docHref}
                                        >
                                            Learn more
                                        </Link>
                                        <Link
                                            className={clsx(
                                                "button button--secondary button--sm",
                                                styles["screenshotAction"]
                                            )}
                                            href={imgSrc}
                                            target="_blank"
                                            rel="noopener noreferrer"
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
            title={`${siteConfig.title} - View and Analyze .fit Files`}
            description="Open-source desktop application for viewing and analyzing .fit files from Garmin and other fitness devices. Interactive maps, charts, and data tables."
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
