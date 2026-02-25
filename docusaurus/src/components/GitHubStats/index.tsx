import type { JSX } from "react";

import Link from "@docusaurus/Link";

import styles from "./styles.module.css";

/**
 * GitHub Statistics Component
 * Displays star count, fork count, and other GitHub stats
 */
export default function GitHubStatsComponent(): JSX.Element {
    return (
        <div className={styles.githubStats}>
            <Link
                className={styles.statBadge}
                href="https://github.com/Nick2bad4u/FitFileViewer/stargazers"
                rel="noopener noreferrer"
                target="_blank"
            >
                ⭐ Stars
            </Link>
            <Link
                className={styles.statBadge}
                href="https://github.com/Nick2bad4u/FitFileViewer/network/members"
                rel="noopener noreferrer"
                target="_blank"
            >
                🍴 Forks
            </Link>
            <Link
                className={styles.statBadge}
                href="https://github.com/Nick2bad4u/FitFileViewer/issues"
                rel="noopener noreferrer"
                target="_blank"
            >
                🐛 Issues
            </Link>
        </div>
    );
}
