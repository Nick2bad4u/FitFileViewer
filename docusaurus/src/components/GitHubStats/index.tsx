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
                href="https://github.com/Nick2bad4u/FitFileViewer/stargazers"
                className={styles.statBadge}
                target="_blank"
                rel="noopener noreferrer"
            >
                ⭐ Stars
            </a>
            <a
                href="https://github.com/Nick2bad4u/FitFileViewer/network/members"
                className={styles.statBadge}
                target="_blank"
                rel="noopener noreferrer"
            >
                🍴 Forks
            </a>
            <a
                href="https://github.com/Nick2bad4u/FitFileViewer/issues"
                className={styles.statBadge}
                target="_blank"
                rel="noopener noreferrer"
            >
                🐛 Issues
            </a>
        </div>
    );
}
