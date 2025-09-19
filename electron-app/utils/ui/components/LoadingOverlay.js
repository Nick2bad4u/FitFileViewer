import { getThemeColors } from "../../charts/theming/getThemeColors.js";

/**
 * Loading overlay management functions
 */
export const LoadingOverlay = {
    /**
     * Hides the loading overlay
     */
    hide() {
        const overlay = document.querySelector("#fitfile-loading-overlay");
        if (overlay) {
            overlay.remove();
        }
    },

    /**
     * Shows a loading overlay with progress text
     * @param {string} progressText - Text to display
     * @param {string} fileName - Optional filename to display
     */
    show(progressText, fileName = "") {
        let overlay = document.querySelector("#fitfile-loading-overlay");
        if (!overlay) {
            overlay = document.createElement("div");
            overlay.id = "fitfile-loading-overlay";

            const themeColors = getThemeColors();
            Object.assign(overlay.style, {
                alignItems: "center",
                background: `${themeColors.background}d9`, // Add transparency
                color: themeColors.textPrimary,
                display: "flex",
                flexDirection: "column",
                fontSize: "1.3em",
                height: "100vh",
                justifyContent: "center",
                left: "0",
                position: "fixed",
                top: "0",
                width: "100vw",
                zIndex: "99999",
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
            document.body.append(overlay);
        }

        const textDiv = document.querySelector("#fitfile-loading-text");
        if (textDiv) {
            textDiv.textContent = progressText || "Loading...";
        }

        const fileDiv = document.querySelector("#fitfile-loading-filename");
        if (fileDiv) {
            fileDiv.textContent = fileName ? `File: ${fileName}` : "";
        }
    },
};
