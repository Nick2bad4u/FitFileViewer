import type { JSX } from "react";
import clsx from "clsx";
import Heading from "@theme/Heading";
import styles from "./styles.module.css";

type FeatureItem = {
    title: string;
    emoji: string;
    description: JSX.Element;
};

const FeatureList: FeatureItem[] = [
    {
        title: "Interactive Maps",
        emoji: "🗺️",
        description: (
            <>
                Visualize your GPS routes with beautiful interactive maps powered by Leaflet.
                See your activity path, lap markers, start/end points, and elevation profile
                all in one place.
            </>
        ),
    },
    {
        title: "Detailed Charts",
        emoji: "📊",
        description: (
            <>
                Analyze your performance with dynamic Chart.js and Vega-Lite charts.
                View speed, heart rate, elevation, power, cadence, and more over time
                or distance.
            </>
        ),
    },
    {
        title: "Comprehensive Tables",
        emoji: "📋",
        description: (
            <>
                Dive deep into your data with sortable, filterable DataTables.
                Export to CSV, search through records, and explore every data point
                from your activity.
            </>
        ),
    },
    {
        title: "Cross-Platform",
        emoji: "💻",
        description: (
            <>
                Built with Electron for Windows, macOS, and Linux. Download once
                and analyze your fitness data offline, with no cloud services required.
            </>
        ),
    },
    {
        title: "Open Source",
        emoji: "🔓",
        description: (
            <>
                100% open source under the Unlicense. View the code, contribute features,
                report bugs, or fork it for your own projects. Your data stays yours.
            </>
        ),
    },
    {
        title: "Garmin FIT Support",
        emoji: "⌚",
        description: (
            <>
                Full support for Garmin FIT files using the official Garmin FIT SDK.
                Works with running, cycling, swimming, hiking, and other activity types.
            </>
        ),
    },
];

function Feature({ title, emoji, description }: FeatureItem): JSX.Element {
    return (
        <div className={clsx("col col--4")}>
            <div className={styles.featureCard}>
                <div className={styles.featureIcon}>{emoji}</div>
                <div className="padding-horiz--md">
                    <Heading as="h3" className={styles.featureTitle}>
                        {title}
                    </Heading>
                    <p className={styles.featureDescription}>{description}</p>
                </div>
            </div>
        </div>
    );
}

export default function HomepageFeatures(): JSX.Element {
    return (
        <section className={styles.features}>
            <div className="container">
                <Heading as="h2" className={styles.featuresTitle}>
                    ✨ Features
                </Heading>
                <div className="row">
                    {FeatureList.map((props, idx) => (
                        <Feature key={idx} {...props} />
                    ))}
                </div>
            </div>
        </section>
    );
}
