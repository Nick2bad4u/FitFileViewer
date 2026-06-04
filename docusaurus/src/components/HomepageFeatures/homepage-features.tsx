import type { JSX } from "react";

import clsx from "clsx";

import styles from "./styles.module.css";

interface FeatureItem {
    readonly description: JSX.Element;
    readonly emoji: string;
    readonly title: string;
}

const FeatureList: FeatureItem[] = [
    {
        description: (
            <>
                Visualize your GPS routes with beautiful interactive maps
                powered by Leaflet. See your activity path, lap markers,
                start/end points, and elevation profile all in one place.
            </>
        ),
        emoji: "🗺️",
        title: "Interactive Maps",
    },
    {
        description: (
            <>
                Analyze your performance with dynamic Chart.js and Vega-Lite
                charts. View speed, heart rate, elevation, power, cadence, and
                more over time or distance.
            </>
        ),
        emoji: "📊",
        title: "Detailed Charts",
    },
    {
        description: (
            <>
                Dive deep into your data with sortable, filterable DataTables.
                Export to CSV, search through records, and explore every data
                point from your activity.
            </>
        ),
        emoji: "📋",
        title: "Comprehensive Tables",
    },
    {
        description: (
            <>
                Built with Electron for Windows, macOS, and Linux. Download once
                and analyze your fitness data offline, with no cloud services
                required.
            </>
        ),
        emoji: "💻",
        title: "Cross-Platform",
    },
    {
        description: (
            <>
                100% open source under the Unlicense. View the code, contribute
                features, report bugs, or fork it for your own projects. Your
                data stays yours.
            </>
        ),
        emoji: "🔓",
        title: "Open Source",
    },
    {
        description: (
            <>
                Full support for Garmin FIT files using the official Garmin FIT
                SDK. Works with running, cycling, swimming, hiking, and other
                activity types.
            </>
        ),
        emoji: "⌚",
        title: "Garmin FIT Support",
    },
];

/**
 * Renders the feature grid on the documentation homepage.
 */
export default function HomepageFeatures(): JSX.Element {
    return (
        <section className={styles.features}>
            <div className="container">
                <h2 className={styles.featuresTitle}>✨ Features</h2>
                <div className="row">
                    {FeatureList.map((props) => (
                        <Feature key={props.title} {...props} />
                    ))}
                </div>
            </div>
        </section>
    );
}

function Feature({
    description,
    emoji,
    title,
}: Readonly<FeatureItem>): JSX.Element {
    return (
        <div className={clsx("col col--4")}>
            <div className={styles.featureCard}>
                <div className={styles.featureIcon}>{emoji}</div>
                <div className="padding-horiz--md">
                    <h3 className={styles.featureTitle}>{title}</h3>
                    <p className={styles.featureDescription}>{description}</p>
                </div>
            </div>
        </div>
    );
}
