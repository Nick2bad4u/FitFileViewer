import { getThemeColors } from "../../charts/theming/getThemeColors.js";

/**
 * Loading overlay management functions
 */
export const LoadingOverlay = {
    /**
     * Shows a loading overlay with progress text
     * @param {string} progressText - Text to display
     * @param {string} fileName - Optional filename to display
     */
    show(progressText, fileName = "") {
        let overlay = document.getElementById("fitfile-loading-overlay");
        if (!overlay) {
            overlay = document.createElement("div");
            overlay.id = "fitfile-loading-overlay";

            const themeColors = getThemeColors();
            Object.assign(overlay.style, {
                position: "fixed",
                top: "0",
                left: "0",
                width: "100vw",
                height: "100vh",
                background: `${themeColors.background}d9`, // Add transparency
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                zIndex: "99999",
                color: themeColors.textPrimary,
                fontSize: "1.3em",
            });

            overlay.innerHTML = `
                <div style="display:flex;flex-direction:column;align-items:center;">
                    <div class="modern-spinner" style="margin-bottom:22px;width:54px;height:54px;">
                        <style>
                        @keyframes fitfile-spin { 100% { transform: rotate(360deg); } }
                        .modern-spinner {
                            display: inline-block;
                            position: relative;
                        }
                        .modern-spinner svg {
                            animation: fitfile-spin 1.1s linear infinite;
                            display: block;
                        }
                        </style>
                        <svg viewBox="0 0 50 50" width="54" height="54">
                            <circle cx="25" cy="25" r="20" fill="none" stroke="${themeColors.border}" stroke-width="5" opacity="0.18"/>
                            <circle cx="25" cy="25" r="20" fill="none" stroke="${themeColors.primary}" stroke-width="5" stroke-linecap="round" stroke-dasharray="31.4 94.2"/>
                        </svg>
                    </div>
                    <div id="fitfile-loading-text" style="font-size:1.15em;font-weight:500;margin-bottom:6px;">Loading...</div>
                    <div id="fitfile-loading-filename" style="font-size:0.98em;color:${themeColors.textSecondary};max-width:340px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"></div>
                </div>
            `;
            document.body.appendChild(overlay);
        }

        const textDiv = document.getElementById("fitfile-loading-text");
        if (textDiv) {
            textDiv.textContent = progressText || "Loading...";
        }

        const fileDiv = document.getElementById("fitfile-loading-filename");
        if (fileDiv) {
            fileDiv.textContent = fileName ? `File: ${fileName}` : "";
        }
    },

    /**
     * Hides the loading overlay
     */
    hide() {
        const overlay = document.getElementById("fitfile-loading-overlay");
        if (overlay) {
            overlay.remove();
        }
    },
};
