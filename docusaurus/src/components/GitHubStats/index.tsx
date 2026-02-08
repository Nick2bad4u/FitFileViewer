import type { JSX } from "react";

import styles from "./styles.module.css";

/**
 * GitHub Statistics Component
 * Displays star count, fork count, and other GitHub stats
 */
export default function GitHubStatsComponent(): JSX.Element {
    return (
        <div className={styles.githubStats}>
            <a
                className={styles.statBadge}
                href="https://github.com/Nick2bad4u/FitFileViewer/stargazers"
                rel="noopener noreferrer"
                target="_blank"
            >
                ⭐ Stars
            </a>
            <a
                className={styles.statBadge}
                href="https://github.com/Nick2bad4u/FitFileViewer/network/members"
                rel="noopener noreferrer"
                target="_blank"
            >
                🍴 Forks
            </a>
            <a
                className={styles.statBadge}
                href="https://github.com/Nick2bad4u/FitFileViewer/issues"
                rel="noopener noreferrer"
                target="_blank"
            >
                🐛 Issues
            </a>
        </div>
    );
}
