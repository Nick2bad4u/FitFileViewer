import { detectCurrentTheme as __realDetectCurrentTheme } from "../../charts/theming/chartThemeUtils.js";
import { showChartSelectionModal } from "../../ui/components/createSettingsHeader.js";
import { showNotification as __realShowNotification } from "../../ui/notifications/showNotification.js";

// In test environment, allow vi.mock to be honored even for modules this file imports statically
// By consulting a minimal manual mock registry installed by the Vitest setup. When not under tests,
// Or when no mock is registered, we simply use the real implementations.
/** @type {(p: string) => any|null} */
function __resolveManualMockBySuffix(p) {
    try {
        // @ts-ignore
        const reg = /** @type {Map<string, any>|undefined} */ (globalThis.__vitest_manual_mocks__);
        if (reg && typeof reg.forEach === "function") {
            for (const [id, mod] of reg.entries()) {
                const norm = String(id).replaceAll("\\", "/");
                if (norm.endsWith(p)) {
                    return mod && mod.default ? mod.default : mod;
                }
            }
        }
    } catch {
        /* Ignore errors */
    }
    return null;
}

// Resolve possibly-mocked dependencies
const __notifMod = __resolveManualMockBySuffix("/utils/ui/notifications/showNotification.js");
const __chartThemeMod = __resolveManualMockBySuffix("/utils/charts/theming/chartThemeUtils.js");

// Debug: log manual mock registry contents and resolution in test runs
try {
    // @ts-ignore
    const __dbgReg = /** @type {Map<string, any>|undefined} */ (globalThis.__vitest_manual_mocks__);
    if (__dbgReg && typeof __dbgReg.forEach === "function") {
        /** @type {string[]} */
        const keys = [];
        for (const [k, _] of __dbgReg.entries()) keys.push(String(k));
        console.log("[exportUtils][debug] manual-mock keys:", keys);
        console.log(
            "[exportUtils][debug] resolved showNotification mock?",
            Boolean(__notifMod && __notifMod.showNotification)
        );
        console.log(
            "[exportUtils][debug] resolved detectCurrentTheme mock?",
            Boolean(__chartThemeMod && __chartThemeMod.detectCurrentTheme)
        );
    }
} catch {
    /* Ignore errors */
}

// Local call sites use these, which point to mocked versions in tests when available
const showNotification = /** @type {typeof __realShowNotification} */ (
    __notifMod && __notifMod.showNotification ? __notifMod.showNotification : __realShowNotification
);
const detectCurrentTheme = /** @type {typeof __realDetectCurrentTheme} */ (
    __chartThemeMod && __chartThemeMod.detectCurrentTheme
        ? __chartThemeMod.detectCurrentTheme
        : __realDetectCurrentTheme
);

// Internal dependency container, overridable in tests
/**
 * @type {{
 *  showNotification: typeof __realShowNotification,
 *  detectCurrentTheme: typeof __realDetectCurrentTheme
 * }}
 */
let __deps = {
    detectCurrentTheme,
    showNotification,
};

/**
 * Test-only: override internal dependencies (notifications, theme resolver)
 * @param {Partial<typeof __deps>} overrides
 */
export function __setTestDeps(overrides) {
    try {
        if (overrides && typeof overrides === "object") {
            __deps = { ...__deps, ...overrides };
        }
    } catch {
        /* Ignore errors */
    }
}

// JSZip is loaded globally via a script tag when export-all is used; reference retained only where actually accessed.

/**
 * @typedef {Object} ChartJSInstance
 * @property {HTMLCanvasElement} canvas - Chart canvas element
 * @property {Object} data - Chart data object
 * @property {Object} options - Chart options object
 * @property {Function} toBase64Image - Function to export chart as base64 image
 * @property {Function} update - Function to update chart
 * @property {Function} destroy - Function to destroy chart
 */

/**
 * @typedef {Object} GyazoConfig
 * @property {string} clientId - Gyazo client ID
 * @property {string} clientSecret - Gyazo client secret
 * @property {string} [redirectUri] - Gyazo redirect URI
 * @property {string} [tokenUrl] - Gyazo token URL
 * @property {string} [authUrl] - Gyazo auth URL
 * @property {string} [uploadUrl] - Gyazo upload URL
 */

/**
 * @typedef {Object} WindowExtensions
 * @property {Object} _chartjsInstances - Chart.js instances array
 * @property {Function} showNotification - Notification function
 * @property {Object} electronAPI - Electron API object
 * @property {any} JSZip - JSZip constructor
 */

/**
 * @typedef {Object} ExportResult
 * @property {boolean} success - Whether export was successful
 * @property {string} [url] - URL if uploaded
 * @property {string} [error] - Error message if failed
 */

// Export utilities
export const exportUtils = {
    /**
     * Helper method to add combined CSV data to ZIP
     * @param {any} zip - JSZip instance
     * @param {any[]} charts - Array of Chart.js instances
     */
    async addCombinedCSVToZip(zip, charts) {
        try {
            const allTimestamps = new Set();
            for (const chart of charts) {
                const dataset = /** @type {any} */ (chart.data).datasets[0];
                if (dataset && dataset.data) {
                    for (const point of dataset.data) allTimestamps.add(point.x);
                }
            }

            const headers = ["timestamp"],
                timestamps = [...allTimestamps].sort();
            for (const chart of charts) {
                const dataset = /** @type {any} */ (chart.data).datasets[0],
                    fieldName = dataset?.label || `chart-${charts.indexOf(chart)}`;
                headers.push(fieldName);
            }

            const rows = [headers.join(",")];
            for (const timestamp of timestamps) {
                const row = [timestamp];
                for (const chart of charts) {
                    const dataset = /** @type {any} */ (chart.data).datasets[0],
                        point = dataset?.data?.find((/** @type {any} */ p) => p.x === timestamp);
                    row.push(point ? point.y : "");
                }
                rows.push(row.join(","));
            }

            const csvContent = rows.join("\n");
            zip.file("combined-data.csv", csvContent);
        } catch (error) {
            console.error("Error adding combined CSV to ZIP:", error);
        }
    },

    /**
     * Initiates Gyazo OAuth authentication
     * @returns {Promise<string>} Access token
     */
    async authenticateWithGyazo() {
        const config = exportUtils.getGyazoConfig();

        if (!(/** @type {any} */ (config).clientId) || !(/** @type {any} */ (config).clientSecret)) {
            exportUtils.showGyazoSetupGuide();
            throw new Error("Gyazo credentials not configured. Please complete the setup first.");
        }

        try {
            // Start the OAuth callback server
            const serverResult = await globalThis.electronAPI.startGyazoServer(3000);
            if (!serverResult.success) {
                throw new Error(`Failed to start OAuth server: ${serverResult.message}`);
            }

            return new Promise((resolve, reject) => {
                // Generate a random state for CSRF protection
                const state = Math.random().toString(36).slice(2, 15) + Math.random().toString(36).slice(2, 15);
                localStorage.setItem("gyazo_oauth_state", state);

                // Update redirect URI to use the actual server port
                const redirectUri = `http://localhost:${serverResult.port}/gyazo/callback`,
                    // Construct the authorization URL
                    authParams = new URLSearchParams({
                        client_id: /** @type {any} */ (config).clientId,
                        redirect_uri: redirectUri,
                        response_type: "code",
                        state,
                    }),
                    authUrl = `${/** @type {any} */ (config).authUrl}?${authParams.toString()}`,
                    // Listen for the OAuth callback from the main process
                    callbackHandler = async (/** @type {any} */ _event, /** @type {any} */ data) => {
                        try {
                            if (data.state !== state) {
                                throw new Error("Invalid state parameter. Possible CSRF attack.");
                            }

                            // Remove the listener
                            globalThis.electronAPI.onIpc("gyazo-oauth-callback", () => { });

                            // Stop the server
                            await globalThis.electronAPI.stopGyazoServer();

                            // Exchange code for token
                            const tokenData = await exportUtils.exchangeGyazoCodeForToken(data.code, redirectUri);

                            // Store the access token
                            exportUtils.setGyazoAccessToken(/** @type {any} */(tokenData).access_token);

                            // Update status in any open account manager modal
                            const accountManagerModal = document.querySelector(".gyazo-account-manager-modal");
                            if (accountManagerModal) {
                                exportUtils.updateGyazoAuthStatus(/** @type {HTMLElement} */(accountManagerModal));
                            }

                            // Close any open auth modal
                            const existingModal = document.querySelector(".gyazo-auth-modal-overlay");
                            if (existingModal) {
                                existingModal.remove();
                            }

                            resolve(/** @type {any} */(tokenData).access_token);
                        } catch (error) {
                            // Stop the server on error
                            await globalThis.electronAPI.stopGyazoServer();

                            // Close any open modal
                            const existingModal = document.querySelector(".gyazo-auth-modal-overlay");
                            if (existingModal) {
                                existingModal.remove();
                            }

                            reject(error);
                        }
                    };

                // Set up the callback listener
                globalThis.electronAPI.onIpc("gyazo-oauth-callback", callbackHandler);

                // Create a modal with OAuth instructions and link
                const modal = exportUtils.createGyazoAuthModal(authUrl, state, resolve, reject, true);
                document.body.append(modal);
            });
        } catch (error) {
            // Stop the server if it was started
            try {
                await globalThis.electronAPI.stopGyazoServer();
            } catch (stopError) {
                console.error("Failed to stop OAuth server:", stopError);
            }
            throw error;
        }
    },

    /**
     * Downloads chart as PNG image with theme-aware background
     * @param {ChartJSInstance} chart - Chart.js instance
     * @param {string} filename - Download filename
     */ /**
    * Clears the stored Gyazo access token
    */
    clearGyazoAccessToken() {
        try {
            localStorage.removeItem("gyazo_access_token");
        } catch (error) {
            console.error("Error clearing Gyazo access token:", error);
        }
    },

    /**
     * Creates a combined image of all charts
     * @param {ChartJSInstance[]} charts - Array of Chart.js instances
     * @param {string} filename - Download filename
     */ /**
    * Clears all Gyazo configuration and tokens
    */
    clearGyazoConfig() {
        try {
            localStorage.removeItem("gyazo_client_id");
            localStorage.removeItem("gyazo_client_secret");
            localStorage.removeItem("gyazo_access_token");
            localStorage.removeItem("gyazo_oauth_state");
        } catch (error) {
            console.error("Error clearing Gyazo configuration:", error);
        }
    },

    /**
     * Copies chart image to clipboard with theme background
     * @param {ChartJSInstance} chart - Chart.js instance
     */ async copyChartToClipboard(chart) {
        try {
            // Validate chart using utility function
            if (!exportUtils.isValidChart(chart)) {
                throw new Error("Invalid chart instance provided");
            }

            const backgroundColor = exportUtils.getExportThemeBackground(),
                // Create canvas with theme background
                canvas = document.createElement("canvas"),
                /** @type {any} */
                chartAny = /** @type {any} */ (chart);
            canvas.width = chartAny.canvas.width;
            canvas.height = chartAny.canvas.height;
            const ctx = canvas.getContext("2d");
            if (!ctx) {
                throw new Error("Failed to get 2D context");
            }

            if (backgroundColor !== "transparent") {
                if (ctx) {
                    ctx.fillStyle = backgroundColor;
                }
                if (ctx) {
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                }
            }

            if (ctx) {
                ctx.drawImage(chartAny.canvas, 0, 0);
            }

            canvas.toBlob(async (blob) => {
                try {
                    if (!blob) {
                        throw new Error("Failed to create image blob");
                    }

                    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
                    __deps.showNotification("Chart copied to clipboard", "success");
                } catch (clipboardError) {
                    console.error("Clipboard API failed:", /** @type {any} */(clipboardError));
                    __deps.showNotification("Failed to copy chart to clipboard", "error");
                }
            }, "image/png");
        } catch (error) {
            console.error("Error copying chart to clipboard:", /** @type {any} */(error));
            __deps.showNotification(
                `Failed to copy chart to clipboard: ${/** @type {any} */ (error).message}`,
                "error"
            );
        }
    },

    /**
     * Copies combined charts image to clipboard
     * @param {ChartJSInstance[]} charts - Array of Chart.js instances
     */
    async copyCombinedChartsToClipboard(charts) {
        try {
            if (!charts || charts.length === 0) {
                throw new Error("No charts provided");
            }

            const backgroundColor = exportUtils.getExportThemeBackground(),
                combinedCanvas = document.createElement("canvas"),
                ctx = combinedCanvas.getContext("2d");
            if (!ctx) {
                throw new Error("Failed to get 2D context");
            }

            // Calculate dimensions for grid layout
            const chartHeight = 400,
                chartWidth = 800,
                cols = Math.ceil(Math.sqrt(charts.length)),
                padding = 20,
                rows = Math.ceil(charts.length / cols);

            combinedCanvas.width = cols * chartWidth + (cols - 1) * padding;
            combinedCanvas.height = rows * chartHeight + (rows - 1) * padding;

            // Set background
            if (backgroundColor !== "transparent") {
                if (ctx) {
                    ctx.fillStyle = backgroundColor;
                }
                if (ctx) {
                    ctx.fillRect(0, 0, combinedCanvas.width, combinedCanvas.height);
                }
            }

            // Draw each chart
            for (const [index, chart] of charts.entries()) {
                const col = index % cols,
                    row = Math.floor(index / cols),
                    tempCanvas = document.createElement("canvas"),
                    x = col * (chartWidth + padding),
                    y = row * (chartHeight + padding);
                tempCanvas.width = chartWidth;
                tempCanvas.height = chartHeight;
                const tempCtx = tempCanvas.getContext("2d");
                if (!tempCtx) {
                    console.error("Failed to get temp canvas context");
                    continue;
                }

                if (backgroundColor !== "transparent") {
                    if (tempCtx) {
                        tempCtx.fillStyle = backgroundColor;
                    }
                    if (tempCtx) {
                        tempCtx.fillRect(0, 0, chartWidth, chartHeight);
                    }
                }

                /** @type {any} */
                const chartAny = /** @type {any} */ (chart);
                if (tempCtx) {
                    tempCtx.drawImage(chartAny.canvas, 0, 0, chartWidth, chartHeight);
                }
                if (ctx) {
                    ctx.drawImage(tempCanvas, x, y);
                }
            }

            // Copy to clipboard
            combinedCanvas.toBlob(async (blob) => {
                try {
                    if (!blob) {
                        throw new Error("Failed to create image blob");
                    }
                    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
                    __deps.showNotification("Combined charts copied to clipboard", "success");
                } catch (clipboardError) {
                    console.error("Clipboard API failed:", /** @type {any} */(clipboardError));
                    __deps.showNotification("Failed to copy combined charts to clipboard", "error");
                }
            }, "image/png");
        } catch (error) {
            console.error("Error copying combined charts to clipboard:", error);
            __deps.showNotification("Failed to copy combined charts to clipboard", "error");
        }
    },

    async createCombinedChartsImage(charts, filename = "combined-charts.png") {
        try {
            if (!charts || charts.length === 0) {
                throw new Error("No charts provided");
            }

            const backgroundColor = exportUtils.getExportThemeBackground(),
                combinedCanvas = document.createElement("canvas"),
                ctx = combinedCanvas.getContext("2d");
            if (!ctx) {
                throw new Error("Failed to get 2D context");
            }

            // Calculate dimensions for grid layout
            const chartHeight = 400,
                chartWidth = 800,
                cols = Math.ceil(Math.sqrt(charts.length)),
                padding = 20,
                rows = Math.ceil(charts.length / cols);

            combinedCanvas.width = cols * chartWidth + (cols - 1) * padding;
            combinedCanvas.height = rows * chartHeight + (rows - 1) * padding;

            // Set background
            if (backgroundColor !== "transparent") {
                if (ctx) {
                    ctx.fillStyle = backgroundColor;
                }
                if (ctx) {
                    ctx.fillRect(0, 0, combinedCanvas.width, combinedCanvas.height);
                }
            }

            // Draw each chart onto the combined canvas
            for (const [index, chart] of charts.entries()) {
                const col = index % cols,
                    row = Math.floor(index / cols),
                    // Create temporary canvas with theme background
                    tempCanvas = document.createElement("canvas"),
                    x = col * (chartWidth + padding),
                    y = row * (chartHeight + padding);
                tempCanvas.width = chartWidth;
                tempCanvas.height = chartHeight;
                const tempCtx = tempCanvas.getContext("2d");
                if (!tempCtx) {
                    console.error("Failed to get temp canvas context");
                    continue;
                }

                if (backgroundColor !== "transparent") {
                    if (tempCtx) {
                        tempCtx.fillStyle = backgroundColor;
                    }
                    if (tempCtx) {
                        tempCtx.fillRect(0, 0, chartWidth, chartHeight);
                    }
                }

                // Draw chart on temp canvas
                /** @type {any} */
                const chartAny = /** @type {any} */ (chart);
                if (tempCtx) {
                    tempCtx.drawImage(chartAny.canvas, 0, 0, chartWidth, chartHeight);
                }

                // Draw temp canvas onto combined canvas
                if (ctx) {
                    ctx.drawImage(tempCanvas, x, y);
                }
            }

            // Download the combined image
            const link = document.createElement("a");
            link.download = filename;
            link.href = combinedCanvas.toDataURL("image/png");
            document.body.append(link);
            link.click();
            link.remove();

            __deps.showNotification("Combined charts exported", "success");
        } catch (error) {
            console.error("Error creating combined charts image:", /** @type {any} */(error));
            __deps.showNotification("Failed to create combined image", "error");
        }
    },

    /**
     * Creates the Gyazo OAuth authentication modal
     * @param {string} authUrl - OAuth authorization URL
     * @param {string} _state - CSRF protection state (unused)
     * @param {Function} resolve - Promise resolve function
     * @param {Function} reject - Promise reject function
     * @param {boolean} useServer - Whether to use server
     * @returns {HTMLElement} Modal element
     */
    createGyazoAuthModal(authUrl, /** @type {any} */ _state, resolve, reject, useServer = false) {
        // Create modal overlay
        const overlay = document.createElement("div");
        overlay.className = "gyazo-auth-modal-overlay";
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: var(--color-overlay-bg);
            backdrop-filter: blur(8px);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;

        // Create modal content
        const modal = document.createElement("div");
        modal.style.cssText = `
            background: var(--color-modal-bg);
            border-radius: var(--border-radius);
            padding: 24px;
            max-width: 500px;
            width: 90%;
            max-height: 70vh;
            overflow-y: auto;
            border: 1px solid var(--color-glass-border);
            box-shadow: var(--color-box-shadow);
        `;

        const actionButtons = useServer
            ? `
            <div style="display: flex; gap: 8px;">
                <button id="gyazo-cancel-auth" style="
                    flex: 1;
                    padding: 12px;
                    background: var(--color-border-light);
                    border: 1px solid var(--color-border);
                    border-radius: 8px;
                    color: var(--color-fg-alt);
                    font-size: 14px;
                    cursor: pointer;
                    transition: var(--transition-smooth);
                ">
                    ❌ Cancel
                </button>
            </div>
        `
            : `
            <div style="display: flex; gap: 8px;">
                <button id="gyazo-complete-auth" style="
                    flex: 1;
                    padding: 12px;
                    background: var(--color-success);
                    border: none;
                    border-radius: 8px;
                    color: white;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: var(--transition-smooth);
                ">
                    ✅ Complete Authentication
                </button>
                <button id="gyazo-cancel-auth" style="
                    flex: 1;
                    padding: 12px;
                    background: var(--color-border-light);
                    border: 1px solid var(--color-border);
                    border-radius: 8px;
                    color: var(--color-fg-alt);
                    font-size: 14px;
                    cursor: pointer;
                    transition: var(--transition-smooth);
                ">
                    ❌ Cancel
                </button>
            </div>
        `,
            codeInputSection = useServer
                ? ""
                : `
            <div style="margin-bottom: 16px;">
                <label style="display: block; margin-bottom: 8px; color: var(--color-fg); font-weight: 600;">
                    Authorization Code:
                </label>
                <input type="text" id="gyazo-auth-code" placeholder="Paste the authorization code here..." style="
                    width: 100%;
                    padding: 10px 12px;
                    border-radius: 8px;
                    border: 1px solid var(--color-border);
                    background: var(--color-glass);
                    color: var(--color-fg);
                    font-size: 14px;
                    box-sizing: border-box;
                ">
            </div>
        `,
            instructions = useServer
                ? `
            <div style="margin-bottom: 20px; color: var(--color-fg); line-height: 1.5;">
                <p>To upload charts to Gyazo, you need to authenticate with your Gyazo account.</p>
                <div style="margin: 16px 0; padding: 12px; background: var(--color-glass); border-radius: 8px;">
                    <strong>� Automatic Mode:</strong> Click the button below to open Gyazo authentication.
                    After you log in and authorize the app, this window will close automatically.
                </div>
            </div>
        `
                : `
            <div style="margin-bottom: 20px; color: var(--color-fg); line-height: 1.5;">
                <p>To upload charts to Gyazo, you need to authenticate with your Gyazo account.</p>
                <ol style="margin: 16px 0; padding-left: 20px;">
                    <li>Click "Open Gyazo Login" to open the authentication page in your browser</li>
                    <li>Log in to your Gyazo account and authorize the application</li>
                    <li>Copy the authorization code from the redirect page</li>
                    <li>Paste the code in the input field below</li>
                    <li>Click "Complete Authentication"</li>
                </ol>
            </div>
        `;

        modal.innerHTML = `
            <h3 style="margin: 0 0 16px 0; color: var(--color-modal-fg); text-align: center;">
                🔐 Gyazo Authentication
            </h3>
            ${instructions}
            <div style="margin-bottom: 16px;">
                <a href="${authUrl}"
                   data-external-link="true"
                   role="link"
                   tabindex="0"
                   id="gyazo-open-auth"
                   style="
                    display: block;
                    width: 100%;
                    padding: 12px;
                    background: var(--color-accent);
                    border: none;
                    border-radius: 8px;
                    color: var(--color-fg-alt);
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: var(--transition-smooth);
                    text-decoration: none;
                    text-align: center;
                    box-sizing: border-box;
                ">
                    🌐 Open Gyazo Login in Browser
                </a>
            </div>
            ${codeInputSection}
            ${actionButtons}
        `;

        // Event handlers
        const cancelBtn = modal.querySelector("#gyazo-cancel-auth"),
            codeInput = modal.querySelector("#gyazo-auth-code"),
            completeAuthBtn = modal.querySelector("#gyazo-complete-auth");

        // The external link will be handled by main-ui.js external link handler
        // No need for a click handler on the link itself

        if (completeAuthBtn && codeInput) {
            // Manual mode - handle authentication button
            completeAuthBtn.addEventListener("click", async () => {
                const code = /** @type {HTMLInputElement} */ (codeInput).value.trim();
                if (!code) {
                    showNotification("Please enter the authorization code", "error");
                    return;
                }

                try {
                    showNotification("Exchanging code for access token...", "info");
                    const tokenData = await exportUtils.exchangeGyazoCodeForToken(
                        code,
                        /** @type {any} */(exportUtils.getGyazoConfig()).redirectUri
                    );
                    exportUtils.setGyazoAccessToken(/** @type {any} */(tokenData).access_token);

                    overlay.remove();
                    showNotification("Gyazo authentication successful!", "success");
                    resolve(/** @type {any} */(tokenData).access_token);
                } catch (error) {
                    console.error("Error completing Gyazo authentication:", error);
                    showNotification(`Authentication failed: ${/** @type {any} */ (error).message}`, "error");
                }
            });
        }

        if (cancelBtn) {
            cancelBtn.addEventListener("click", async () => {
                // Stop the server if using automatic mode
                if (useServer) {
                    try {
                        await globalThis.electronAPI.stopGyazoServer();
                    } catch (error) {
                        console.error("Failed to stop OAuth server:", error);
                    }
                }

                overlay.remove();
                reject(new Error("User cancelled authentication"));
            });
        }

        // ESC key handler
        const handleEscape = async (/** @type {any} */ e) => {
            if (e.key === "Escape") {
                // Stop the server if using automatic mode
                if (useServer) {
                    try {
                        await globalThis.electronAPI.stopGyazoServer();
                    } catch (error) {
                        console.error("Failed to stop OAuth server:", error);
                    }
                }

                overlay.remove();
                document.removeEventListener("keydown", handleEscape);
                reject(new Error("User cancelled authentication"));
            }
        };
        document.addEventListener("keydown", handleEscape);

        // Click outside to close
        overlay.addEventListener("click", async (/** @type {any} */ e) => {
            if (e.target === overlay) {
                // Stop the server if using automatic mode
                if (useServer) {
                    try {
                        await globalThis.electronAPI.stopGyazoServer();
                    } catch (error) {
                        console.error("Failed to stop OAuth server:", error);
                    }
                }

                overlay.remove();
                reject(new Error("User cancelled authentication"));
            }
        });

        overlay.append(modal);
        return overlay;
    },

    async downloadChartAsPNG(chart, filename = "chart.png") {
        try {
            const backgroundColor = exportUtils.getExportThemeBackground(),
                link = document.createElement("a");
            link.download = filename;
            /** @type {any} */
            const chartAny = /** @type {any} */ (chart);
            link.href = chartAny.toBase64Image("image/png", 1, backgroundColor);
            document.body.append(link);
            link.click();
            link.remove();
            __deps.showNotification(`Chart exported as ${filename}`, "success");
        } catch (error) {
            console.error("Error exporting chart as PNG:", error);
            __deps.showNotification("Failed to export chart as PNG", "error");
        }
    },

    /**
     * Exchanges authorization code for access token
     * @param {string} code - Authorization code
     * @param {string} redirectUri - Redirect URI used in OAuth flow
     * @returns {Promise<Object>} Token data with access_token
     */
    async exchangeGyazoCodeForToken(code, redirectUri) {
        const config = exportUtils.getGyazoConfig(),
            tokenParams = new URLSearchParams({
                client_id: /** @type {any} */ (config).clientId,
                client_secret: /** @type {any} */ (config).clientSecret,
                code,
                grant_type: "authorization_code",
                redirect_uri: redirectUri,
            });

        try {
            const response = await fetch(/** @type {any} */(config).tokenUrl, {
                body: tokenParams.toString(),
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                method: "POST",
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Token exchange failed: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            if (data.access_token) {
                return data;
            }
            throw new Error("No access token returned from Gyazo");
        } catch (error) {
            console.error("Error exchanging code for token:", error);
            throw error;
        }
    },

    /**
     * Exports all charts and data as a ZIP file
     * @param {any[]} charts - Array of Chart.js instances
     */
    async exportAllAsZip(charts) {
        try {
            if (!charts || charts.length === 0) {
                throw new Error("No charts provided");
            }
            if (/** @type {any} */ (globalThis).JSZip === undefined) {
                throw new TypeError("JSZip library not loaded");
            }

            const backgroundColor = exportUtils.getExportThemeBackground(),
                zip = new /** @type {any} */(globalThis).JSZip(); // JSZip is loaded globally via script tag

            // Add individual chart images
            for (const [i, chart] of charts.entries()) {
                const // Add chart image
                    canvas = document.createElement("canvas"),
                    dataset = /** @type {any} */ (chart.data).datasets[0],
                    fieldName = dataset?.label || `chart-${i}`,
                    safeFieldName = fieldName.replaceAll(/[^\dA-Za-z]/g, "-");
                canvas.width = chart.canvas.width;
                canvas.height = chart.canvas.height;
                const ctx = canvas.getContext("2d");

                if (backgroundColor !== "transparent") {
                    if (ctx) {
                        ctx.fillStyle = backgroundColor;
                    }
                    if (ctx) {
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                    }
                }

                if (ctx) {
                    ctx.drawImage(chart.canvas, 0, 0);
                }
                const imageData = canvas.toDataURL("image/png").split(",")[1];
                zip.file(`${safeFieldName}-chart.png`, imageData, { base64: true });

                // Add chart data as CSV
                if (dataset && dataset.data) {
                    const headers = ["timestamp", fieldName],
                        csvContent = [
                            headers.join(","),
                            ...dataset.data.map((/** @type {any} */ point) => `${point.x},${point.y}`),
                        ].join("\n");
                    zip.file(`${safeFieldName}-data.csv`, csvContent);
                }

                // Add chart data as JSON
                if (dataset && dataset.data) {
                    const jsonData = {
                        chartType: chart.config.type,
                        data: dataset.data,
                        exportedAt: new Date().toISOString(),
                        field: fieldName,
                        totalPoints: dataset.data.length,
                    };
                    zip.file(`${safeFieldName}-data.json`, JSON.stringify(jsonData, null, 2));
                }
            }

            // Add combined charts image
            if (charts.length > 1) {
                const chartHeight = 400,
                    chartWidth = 800,
                    cols = Math.ceil(Math.sqrt(charts.length)),
                    combinedCanvas = document.createElement("canvas"),
                    ctx = combinedCanvas.getContext("2d"),
                    padding = 20,
                    rows = Math.ceil(charts.length / cols);

                combinedCanvas.width = cols * chartWidth + (cols - 1) * padding;
                combinedCanvas.height = rows * chartHeight + (rows - 1) * padding;

                if (backgroundColor !== "transparent") {
                    if (ctx) {
                        ctx.fillStyle = backgroundColor;
                    }
                    if (ctx) {
                        ctx.fillRect(0, 0, combinedCanvas.width, combinedCanvas.height);
                    }
                }

                for (const [index, chart] of charts.entries()) {
                    const col = index % cols,
                        row = Math.floor(index / cols),
                        tempCanvas = document.createElement("canvas"),
                        x = col * (chartWidth + padding),
                        y = row * (chartHeight + padding);
                    tempCanvas.width = chartWidth;
                    tempCanvas.height = chartHeight;
                    const tempCtx = tempCanvas.getContext("2d");

                    if (backgroundColor !== "transparent") {
                        if (tempCtx) {
                            tempCtx.fillStyle = backgroundColor;
                        }
                        if (tempCtx) {
                            tempCtx.fillRect(0, 0, chartWidth, chartHeight);
                        }
                    }

                    if (tempCtx) {
                        tempCtx.drawImage(chart.canvas, 0, 0, chartWidth, chartHeight);
                    }
                    if (ctx) {
                        ctx.drawImage(tempCanvas, x, y);
                    }
                }

                const combinedImageData = combinedCanvas.toDataURL("image/png").split(",")[1];
                zip.file("combined-charts.png", combinedImageData, { base64: true });
            }

            // Add combined CSV data
            await this.addCombinedCSVToZip(zip, charts);

            // Add combined JSON data
            const allChartsData = {
                charts: charts.map((chart, index) => {
                    const dataset = /** @type {any} */ (chart.data).datasets[0];
                    return {
                        data: dataset?.data || [],
                        field: dataset?.label || `chart-${index}`,
                        totalPoints: dataset?.data ? dataset.data.length : 0,
                        type: chart.config.type,
                    };
                }),
                exportedAt: new Date().toISOString(),
                totalCharts: charts.length,
            };
            zip.file("combined-data.json", JSON.stringify(allChartsData, null, 2));

            // Generate and download ZIP
            const content = await zip.generateAsync({ type: "blob" }),
                link = document.createElement("a");
            link.href = URL.createObjectURL(content);
            link.download = `fitfile-charts-${new Date().toISOString().split("T")[0]}.zip`;
            document.body.append(link);
            link.click();
            link.remove();

            showNotification(`ZIP file with ${charts.length} charts exported`, "success");
        } catch (error) {
            console.error("Error creating ZIP export:", error);
            showNotification("Failed to create ZIP export", "error");
        }
    },

    /**
     * Exports chart data as CSV
     * @param {any[]} chartData - Chart data array
     * @param {string} fieldName - Field name for the data
     * @param {string} filename - Download filename
     */
    async exportChartDataAsCSV(chartData, fieldName, filename = "chart-data.csv") {
        try {
            const headers = ["timestamp", fieldName],
                csvContent = [
                    headers.join(","),
                    ...chartData.map((/** @type {any} */ point) => `${point.x},${point.y}`),
                ].join("\n"),
                blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" }),
                link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            document.body.append(link);
            link.click();
            link.remove();
            showNotification(`Data exported as ${filename}`, "success");
        } catch (error) {
            console.error("Error exporting chart data as CSV:", error);
            showNotification("Failed to export chart data", "error");
        }
    },

    /**
     * Exports chart data as JSON
     * @param {any[]} chartData - Chart data array
     * @param {string} fieldName - Field name for the data
     * @param {string} filename - Download filename
     */
    async exportChartDataAsJSON(chartData, fieldName, filename = "chart-data.json") {
        try {
            const jsonData = {
                data: chartData,
                exportedAt: new Date().toISOString(),
                field: fieldName,
                totalPoints: chartData.length,
            },
                blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: "application/json;charset=utf-8;" }),
                link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            document.body.append(link);
            link.click();
            link.remove();
            showNotification(`Data exported as ${filename}`, "success");
        } catch (error) {
            console.error("Error exporting chart data as JSON:", error);
            showNotification("Failed to export chart data", "error");
        }
    },

    /**
     * Exports combined chart data as CSV
     * @param {any[]} charts - Array of Chart.js instances
     * @param {string} filename - Download filename
     */
    async exportCombinedChartsDataAsCSV(charts, filename = "combined-charts-data.csv") {
        try {
            if (!charts || charts.length === 0) {
                throw new Error("No charts provided");
            }

            // Get all unique timestamps
            const allTimestamps = new Set();
            for (const chart of charts) {
                const dataset = /** @type {any} */ (chart.data).datasets[0];
                if (dataset && dataset.data) {
                    for (const point of dataset.data) allTimestamps.add(point.x);
                }
            }

            const // Create headers
                headers = ["timestamp"],
                timestamps = [...allTimestamps].sort();
            for (const chart of charts) {
                const dataset = /** @type {any} */ (chart.data).datasets[0],
                    fieldName = dataset?.label || `chart-${charts.indexOf(chart)}`;
                headers.push(fieldName);
            }

            // Create data rows
            const rows = [headers.join(",")];
            for (const timestamp of timestamps) {
                const row = [timestamp];
                for (const chart of charts) {
                    const dataset = /** @type {any} */ (chart.data).datasets[0],
                        point = dataset?.data?.find((/** @type {any} */ p) => p.x === timestamp);
                    row.push(point ? point.y : "");
                }
                rows.push(row.join(","));
            }

            const csvContent = rows.join("\n"),
                blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" }),
                link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            document.body.append(link);
            link.click();
            link.remove();

            showNotification(`Combined data exported as ${filename}`, "success");
        } catch (error) {
            console.error("Error exporting combined chart data as CSV:", error);
            showNotification("Failed to export combined chart data", "error");
        }
    },

    /**
     * Gets the theme background color for exports
     * @returns {string} Background color based on export theme setting
     */
    getExportThemeBackground() {
        const exportTheme = localStorage.getItem("chartjs_exportTheme");

        // Debug logging
        console.log("[exportUtils] exportTheme from localStorage:", exportTheme);

        // If no export theme is set, fall back to the current app theme
        let theme;
        if (exportTheme) {
            // Handle "auto" theme by detecting current theme
            if (exportTheme === "auto") {
                const currentTheme = __deps.detectCurrentTheme();
                console.log("[exportUtils] Auto theme detected as:", currentTheme);
                theme = currentTheme || "light";
            } else {
                theme = exportTheme;
                console.log("[exportUtils] Using explicit export theme:", theme);
            }
        } else {
            // Use current app theme as fallback, or default to "light"
            const currentTheme = __deps.detectCurrentTheme();
            console.log("[exportUtils] detectCurrentTheme() returned:", currentTheme);
            theme = currentTheme || "light";
            console.log("[exportUtils] Final fallback theme:", theme);
        }

        let backgroundColor;
        switch (theme) {
            case "dark": {
                backgroundColor = "#1a1a1a";
                break;
            }
            case "transparent": {
                backgroundColor = "transparent";
                break;
            }
            default: {
                backgroundColor = "#ffffff";
                break;
            }
        }

        console.log("[exportUtils] Final background color:", backgroundColor);
        return backgroundColor;
    },

    /**
     * Gets the stored Gyazo access token
     * @returns {string|null} Access token or null if not found
     */
    getGyazoAccessToken() {
        try {
            return localStorage.getItem("gyazo_access_token");
        } catch (error) {
            console.error("Error getting Gyazo access token:", error);
            return null;
        }
    },

    /* C8 ignore start */
    /**
     * Gets Gyazo configuration from user settings or defaults
     * Gyazo OAuth/upload flows are excluded from coverage due to external auth, clipboard,
     * and network side effects that are brittle in jsdom.
     * @returns {Object} Gyazo configuration object
     */
    getGyazoConfig() {
        // Provide default demo credentials for easier onboarding
        // Obfuscated default credentials using multiple encoding layers
        const GyazoAppData1 = [
            0x6c, 0x63, 0x6f, 0x7a, 0x6f, 0x61, 0x6e, 0x44, 0x4a, 0x57, 0x76, 0x6f, 0x75, 0x39, 0x70, 0x6a, 0x6b,
            0x42, 0x6d, 0x50, 0x4a, 0x6c, 0x61, 0x30, 0x62, 0x4e, 0x67, 0x72, 0x54, 0x37, 0x59, 0x62, 0x73, 0x37,
            0x69, 0x79, 0x56, 0x77, 0x4f, 0x6c, 0x59, 0x45, 0x51,
        ],
            // Apply ROT13-like transformation as additional obfuscation layer
            /** @type {(arr: number[]) => string} */
            transform = (arr) => arr.map((/** @type {number} */ code) => String.fromCodePoint(code)).join(""),
            // Decode with multiple transformations
            defaultClientId = transform(GyazoAppData1),
            GyazoAppData2 = [
                0x77, 0x63, 0x68, 0x52, 0x46, 0x7a, 0x46, 0x5a, 0x75, 0x4f, 0x71, 0x32, 0x33, 0x4f, 0x69, 0x70, 0x48,
                0x6b, 0x63, 0x45, 0x49, 0x76, 0x51, 0x61, 0x31, 0x4b, 0x59, 0x30, 0x6c, 0x6a, 0x6f, 0x50, 0x66, 0x32,
                0x71, 0x30, 0x4d, 0x55, 0x62, 0x45, 0x6f, 0x53, 0x30,
            ],
            /** @type {(str: string) => string} */
            reverseTransform = (str) => str.split("").toReversed().join(""),
            defaultClientSecret = reverseTransform(transform(GyazoAppData2.toReversed()));

        return {
            authUrl: "https://gyazo.com/oauth/authorize",
            clientId: localStorage.getItem("gyazo_client_id") || defaultClientId,
            clientSecret: localStorage.getItem("gyazo_client_secret") || defaultClientSecret,
            redirectUri: "http://localhost:3000/gyazo/callback",
            tokenUrl: "https://gyazo.com/oauth/token",
            uploadUrl: "https://upload.gyazo.com/api/upload",
        };
    },

    /**
     * Checks if user is authenticated with Gyazo
     * @returns {boolean} True if authenticated, false otherwise
     */
    isGyazoAuthenticated() {
        const token = exportUtils.getGyazoAccessToken();
        console.log("[Gyazo] Checking authentication status. Token exists:", Boolean(token));
        return Boolean(token);
    },

    /**
     * Validates a Chart.js instance
     * @param {ChartJSInstance} chart - Chart.js instance to validate
     * @returns {boolean} True if chart is valid, false otherwise
     */
    isValidChart(chart) {
        if (!chart) {
            console.warn("[exportUtils] Chart is null or undefined");
            return false;
        }

        /** @type {any} */
        const chartAny = /** @type {any} */ (chart);
        if (!chartAny.canvas) {
            console.warn("[exportUtils] Chart canvas is not available");
            return false;
        }

        if (!chartAny.canvas.width || !chartAny.canvas.height) {
            console.warn("[exportUtils] Chart canvas has invalid dimensions:", {
                height: chartAny.canvas.height,
                width: chartAny.canvas.width,
            });
            return false;
        }

        return true;
    },

    async printChart(chart) {
        try {
            const backgroundColor = exportUtils.getExportThemeBackground(),
                // Create canvas with theme background
                canvas = document.createElement("canvas"),
                printWindow = window.open("", "_blank");
            canvas.width = chart.canvas.width;
            canvas.height = chart.canvas.height;
            const ctx = canvas.getContext("2d");

            if (backgroundColor !== "transparent") {
                if (ctx) {
                    ctx.fillStyle = backgroundColor;
                }
                if (ctx) {
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                }
            }

            if (ctx) {
                ctx.drawImage(chart.canvas, 0, 0);
            }
            const imgData = canvas.toDataURL("image/png", 1);

            if (printWindow) {
                printWindow.document.write(`
				<html>
					<head>
						<title>Chart Print</title>
						<style>
							body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
							img { max-width: 100%; max-height: 100%; }
						</style>
					</head>
					<body>
						<img src="${imgData}" alt="Chart" />
					</body>
				</html>
			`);

                printWindow.document.close();
            }
            if (printWindow) {
                printWindow.focus();
            }
            setTimeout(() => {
                if (printWindow) {
                    printWindow.print();
                }
                if (printWindow) {
                    printWindow.close();
                }
            }, 250);

            showNotification("Chart sent to printer", "success");
        } catch (error) {
            console.error("Error printing chart:", error);
            showNotification("Failed to print chart", "error");
        }
    },

    /**
     * Prints multiple charts in a combined format
     * @param {any[]} charts - Array of Chart.js instances
     */
    printCombinedCharts(charts) {
        try {
            if (!charts || charts.length === 0) {
                showNotification("No charts available to print", "warning");
                return;
            }

            const backgroundColor = exportUtils.getExportThemeBackground(),
                printWindow = window.open("", "_blank");
            let htmlContent = `
				<html>
					<head>
						<title>Charts Print</title>
						<style>
							body {
								margin: 20px;
								font-family: Arial, sans-serif;
								background: ${backgroundColor === "transparent" ? "#ffffff" : backgroundColor};
								color: ${backgroundColor === "#1a1a1a" ? "#ffffff" : "#000000"};
							}
							.chart {
								page-break-inside: avoid;
								margin-bottom: 30px;
								text-align: center;
							}
							.chart img {
								max-width: 100%;
								height: auto;
							}
							.chart h3 {
								margin: 0 0 10px 0;
								color: ${backgroundColor === "#1a1a1a" ? "#ffffff" : "#333"};
							}
							@media print {
								.chart { page-break-after: always; }
								.chart:last-child { page-break-after: avoid; }
							}
						</style>
					</head>
					<body>
						<h1>FIT File Charts</h1>
			`;

            for (const [index, chart] of charts.entries()) {
                const // Create canvas with theme background
                    canvas = document.createElement("canvas"),
                    dataset = /** @type {any} */ (chart.data).datasets[0],
                    fieldName = dataset?.label || `Chart ${index + 1}`;
                canvas.width = chart.canvas.width;
                canvas.height = chart.canvas.height;
                const ctx = canvas.getContext("2d");

                if (backgroundColor !== "transparent") {
                    if (ctx) {
                        ctx.fillStyle = backgroundColor;
                    }
                    if (ctx) {
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                    }
                }

                if (ctx) {
                    ctx.drawImage(chart.canvas, 0, 0);
                }
                const imgData = canvas.toDataURL("image/png", 1);

                htmlContent += `
					<div class="chart">
						<h3>${fieldName}</h3>
						<img src="${imgData}" alt="${fieldName} Chart" />
					</div>
				`;
            }

            htmlContent += "</body></html>";

            if (printWindow) {
                printWindow.document.write(htmlContent);
                printWindow.document.close();
            }
            if (printWindow) {
                printWindow.focus();
            }
            setTimeout(() => {
                if (printWindow) {
                    printWindow.print();
                }
                if (printWindow) {
                    printWindow.close();
                }
            }, 500);

            showNotification("Charts sent to printer", "success");
        } catch (error) {
            console.error("Error printing combined charts:", error);
            showNotification("Failed to print charts", "error");
        }
    },

    /**
     * Stores the Gyazo access token
     * @param {string} token - Access token to store
     */
    setGyazoAccessToken(token) {
        try {
            localStorage.setItem("gyazo_access_token", token);
        } catch (error) {
            console.error("Error storing Gyazo access token:", error);
        }
    },

    /**
     * Prints the chart with theme background
     * @param {ChartJSInstance} chart - Chart.js instance
     */ /**
    * Saves Gyazo configuration to user settings
    * @param {string} clientId - Gyazo client ID
    * @param {string} clientSecret - Gyazo client secret
    */
    setGyazoConfig(clientId, clientSecret) {
        try {
            localStorage.setItem("gyazo_client_id", clientId);
            localStorage.setItem("gyazo_client_secret", clientSecret);
        } catch (error) {
            console.error("Error saving Gyazo configuration:", error);
        }
    },

    /**
     * Shares charts as URL with image upload to Imgur
     */
    async shareChartsAsURL() {
        showChartSelectionModal(
            "share URL",
            // Single chart callback
            async (/** @type {ChartJSInstance} */ chart) => {
                try {
                    if (!exportUtils.isValidChart(chart)) {
                        showNotification("Invalid chart provided", "error");
                        return;
                    }

                    showNotification("Uploading chart to Imgur...", "info");

                    const backgroundColor = exportUtils.getExportThemeBackground(),
                        canvas = document.createElement("canvas");
                    canvas.width = chart.canvas.width;
                    canvas.height = chart.canvas.height;
                    const ctx = canvas.getContext("2d");

                    if (backgroundColor !== "transparent") {
                        if (ctx) {
                            ctx.fillStyle = backgroundColor;
                        }
                        if (ctx) {
                            ctx.fillRect(0, 0, canvas.width, canvas.height);
                        }
                    }

                    if (ctx) {
                        ctx.drawImage(chart.canvas, 0, 0);
                    }
                    const base64Image = canvas.toDataURL("image/png", 1),
                        imgurUrl = await exportUtils.uploadToImgur(base64Image);

                    // Copy URL to clipboard
                    await navigator.clipboard.writeText(imgurUrl);
                    showNotification("Chart uploaded! URL copied to clipboard", "success");
                } catch (error) {
                    console.error("Error sharing single chart as URL:", error);
                    if (/** @type {any} */ (error).message.includes("Imgur client ID not configured")) {
                        showNotification(
                            "Imgur client ID not configured. Please update the exportUtils.uploadToImgur function with your Imgur client ID.",
                            "error"
                        );
                    } else {
                        showNotification("Failed to share chart. Please try again.", "error");
                    }
                }
            },
            // Combined charts callback
            async (/** @type {ChartJSInstance[]} */ charts) => {
                try {
                    if (!charts || charts.length === 0) {
                        showNotification("No charts available to share", "warning");
                        return;
                    }

                    showNotification("Uploading combined charts to Imgur...", "info");

                    const backgroundColor = exportUtils.getExportThemeBackground(),
                        chartHeight = 400,
                        chartWidth = 800,
                        cols = Math.ceil(Math.sqrt(charts.length)),
                        combinedCanvas = document.createElement("canvas"),
                        ctx = combinedCanvas.getContext("2d"),
                        padding = 20,
                        rows = Math.ceil(charts.length / cols);

                    combinedCanvas.width = cols * chartWidth + (cols - 1) * padding;
                    combinedCanvas.height = rows * chartHeight + (rows - 1) * padding;

                    if (backgroundColor !== "transparent") {
                        if (ctx) {
                            ctx.fillStyle = backgroundColor;
                        }
                        if (ctx) {
                            ctx.fillRect(0, 0, combinedCanvas.width, combinedCanvas.height);
                        }
                    }

                    for (const [index, chart] of charts.entries()) {
                        const col = index % cols,
                            row = Math.floor(index / cols),
                            tempCanvas = document.createElement("canvas"),
                            x = col * (chartWidth + padding),
                            y = row * (chartHeight + padding);
                        tempCanvas.width = chartWidth;
                        tempCanvas.height = chartHeight;
                        const tempCtx = tempCanvas.getContext("2d");

                        if (backgroundColor !== "transparent") {
                            if (tempCtx) {
                                tempCtx.fillStyle = backgroundColor;
                            }
                            if (tempCtx) {
                                tempCtx.fillRect(0, 0, chartWidth, chartHeight);
                            }
                        }

                        if (tempCtx) {
                            tempCtx.drawImage(chart.canvas, 0, 0, chartWidth, chartHeight);
                        }
                        if (ctx) {
                            ctx.drawImage(tempCanvas, x, y);
                        }
                    }

                    const base64Image = combinedCanvas.toDataURL("image/png", 1),
                        imgurUrl = await exportUtils.uploadToImgur(base64Image);

                    // Copy URL to clipboard
                    await navigator.clipboard.writeText(imgurUrl);
                    showNotification("Combined charts uploaded! URL copied to clipboard", "success");
                } catch (error) {
                    console.error("Error sharing combined charts as URL:", error);
                    if (/** @type {any} */ (error).message.includes("Imgur client ID not configured")) {
                        showNotification(
                            "Imgur client ID not configured. Please update the exportUtils.uploadToImgur function with your Imgur client ID.",
                            "error"
                        );
                    } else {
                        showNotification("Failed to share charts. Please try again.", "error");
                    }
                }
            }
        );
    },
    /**
     * Shares charts as URL with image upload to Gyazo
     */
    async shareChartsToGyazo() {
        showChartSelectionModal(
            "share to Gyazo",
            // Single chart callback
            async (/** @type {ChartJSInstance} */ chart) => {
                try {
                    if (!exportUtils.isValidChart(chart)) {
                        showNotification("Invalid chart provided", "error");
                        return;
                    }

                    showNotification("Uploading chart to Gyazo...", "info");

                    const backgroundColor = exportUtils.getExportThemeBackground(),
                        canvas = document.createElement("canvas");
                    canvas.width = chart.canvas.width;
                    canvas.height = chart.canvas.height;
                    const ctx = canvas.getContext("2d");

                    if (backgroundColor !== "transparent") {
                        if (ctx) {
                            ctx.fillStyle = backgroundColor;
                        }
                        if (ctx) {
                            ctx.fillRect(0, 0, canvas.width, canvas.height);
                        }
                    }

                    if (ctx) {
                        ctx.drawImage(chart.canvas, 0, 0);
                    }
                    const base64Image = canvas.toDataURL("image/png", 1),
                        gyazoUrl = await exportUtils.uploadToGyazo(base64Image);

                    // Copy URL to clipboard
                    await navigator.clipboard.writeText(gyazoUrl);
                    showNotification("Chart uploaded to Gyazo! URL copied to clipboard", "success");
                } catch (error) {
                    console.error("Error sharing single chart to Gyazo:", error);
                    if (/** @type {any} */ (error).message.includes("Gyazo access token not configured")) {
                        showNotification(
                            "Gyazo access token not configured. Please update the exportUtils.uploadToGyazo function with your Gyazo access token.",
                            "error"
                        );
                    } else {
                        showNotification("Failed to share chart to Gyazo. Please try again.", "error");
                    }
                }
            },
            // Combined charts callback
            async (/** @type {ChartJSInstance[]} */ charts) => {
                try {
                    if (!charts || charts.length === 0) {
                        showNotification("No charts available to share", "warning");
                        return;
                    }

                    showNotification("Uploading combined charts to Gyazo...", "info");

                    const backgroundColor = exportUtils.getExportThemeBackground(),
                        chartHeight = 400,
                        chartWidth = 1000,
                        cols = Math.ceil(Math.sqrt(charts.length)),
                        combinedCanvas = document.createElement("canvas"),
                        ctx = combinedCanvas.getContext("2d"),
                        padding = 20,
                        rows = Math.ceil(charts.length / cols);

                    combinedCanvas.width = cols * chartWidth + (cols - 1) * padding;
                    combinedCanvas.height = rows * chartHeight + (rows - 1) * padding;

                    if (backgroundColor !== "transparent") {
                        if (ctx) {
                            ctx.fillStyle = backgroundColor;
                        }
                        if (ctx) {
                            ctx.fillRect(0, 0, combinedCanvas.width, combinedCanvas.height);
                        }
                    }

                    for (const [index, chart] of charts.entries()) {
                        const col = index % cols,
                            row = Math.floor(index / cols),
                            tempCanvas = document.createElement("canvas"),
                            x = col * (chartWidth + padding),
                            y = row * (chartHeight + padding);
                        tempCanvas.width = chartWidth;
                        tempCanvas.height = chartHeight;
                        const tempCtx = tempCanvas.getContext("2d");

                        if (backgroundColor !== "transparent") {
                            if (tempCtx) {
                                tempCtx.fillStyle = backgroundColor;
                            }
                            if (tempCtx) {
                                tempCtx.fillRect(0, 0, chartWidth, chartHeight);
                            }
                        }

                        if (tempCtx) {
                            tempCtx.drawImage(chart.canvas, 0, 0, chartWidth, chartHeight);
                        }
                        if (ctx) {
                            ctx.drawImage(tempCanvas, x, y);
                        }
                    }

                    const base64Image = combinedCanvas.toDataURL("image/png", 1),
                        gyazoUrl = await exportUtils.uploadToGyazo(base64Image);

                    // Copy URL to clipboard
                    await navigator.clipboard.writeText(gyazoUrl);
                    showNotification("Combined charts uploaded to Gyazo! URL copied to clipboard", "success");
                } catch (error) {
                    console.error("Error sharing combined charts to Gyazo:", error);
                    if (/** @type {any} */ (error).message.includes("Gyazo access token not configured")) {
                        showNotification(
                            "Gyazo access token not configured. Please update the exportUtils.uploadToGyazo function with your Gyazo access token.",
                            "error"
                        );
                    } else {
                        showNotification("Failed to share charts to Gyazo. Please try again.", "error");
                    }
                }
            }
        );
    },
    /* C8 ignore stop */

    /**
     * Shows Gyazo account management modal with credentials setup
     */
    showGyazoAccountManager() {
        const /** @type {GyazoConfig} */
            config = /** @type {any} */ (exportUtils.getGyazoConfig()),
            hasCredentials = Boolean(
                /** @type {GyazoConfig} */(config).clientId && /** @type {GyazoConfig} */ (config).clientSecret
            ),
            isAuthenticated = exportUtils.isGyazoAuthenticated(),
            // Create modal overlay
            overlay = document.createElement("div");
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: var(--color-overlay-bg);
            backdrop-filter: blur(8px);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;

        // Create modal content
        const modal = document.createElement("div");
        modal.className = "gyazo-account-manager-modal";
        modal.style.cssText = `
            background: var(--color-modal-bg);
            border-radius: var(--border-radius);
            padding: 24px;
            max-width: 500px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            border: 1px solid var(--color-glass-border);
            box-shadow: var(--color-box-shadow);
        `;

        modal.innerHTML = `
            <h3 style="margin: 0 0 16px 0; color: var(--color-modal-fg); text-align: center;">
            📸 Gyazo Settings
            </h3>

            <!-- Status Section -->
            <div style="margin-bottom: 20px; text-align: center;">
            <div style="margin-bottom: 12px;">
                <span id="auth-status" style="
                display: inline-block;
                padding: 4px 12px;
                border-radius: 16px;
                font-size: 12px;
                font-weight: 600;
                background: ${isAuthenticated ? "var(--color-success)" : "var(--color-error)"};
                color: white;
                ">
                ${isAuthenticated ? "✅ Connected" : "❌ Not Connected"}
                </span>
            </div>
            <div style="margin-bottom: 12px;">
                <span id="creds-status" style="
                display: inline-block;
                padding: 4px 12px;
                border-radius: 16px;
                font-size: 12px;
                font-weight: 600;
                background: ${hasCredentials ? "var(--color-success)" : "var(--color-warning)"};
                color: white;
                ">
                ${hasCredentials ? "🔑 Credentials Ready" : "🔑 Using Default Credentials"}
                </span>
            </div>
            </div>

            <!-- Simple Setup Instructions -->
            <div style="margin-bottom: 20px; padding: 16px; background: var(--color-glass); border-radius: 8px;">
            <h4 style="margin: 0 0 12px 0; color: var(--color-accent); font-size: 14px;">
                🚀 Getting Started
            </h4>
            <p style="margin: 0; color: var(--color-fg); font-size: 14px; line-height: 1.5;">
                Simply click the <strong>"Connect to Gyazo"</strong> button below and log in with your Gyazo account.
                No additional setup required!
            </p>
            </div>

            <!-- Advanced Options (Collapsible) -->
            <details style="margin-bottom: 20px;">
            <summary style="
                color: var(--color-fg-alt);
                font-size: 13px;
                cursor: pointer;
                padding: 8px 0;
                border-bottom: 1px solid var(--color-border);
            ">
                🔧 Advanced: Use Custom Credentials
            </summary>
            <div style="margin-top: 16px; padding: 12px; background: var(--color-glass); border-radius: 8px;">
                <p style="margin: 0 0 12px 0; color: var(--color-fg); font-size: 12px; line-height: 1.4;">
                For advanced users who want to use their own Gyazo application:
                </p>
                <ol style="margin: 0 0 16px 0; padding-left: 20px; color: var(--color-fg); font-size: 12px; line-height: 1.4;">
                <li>Create an app at <a href="https://gyazo.com/oauth/applications" target="_blank" style="color: var(--color-accent);">Gyazo Developer Applications</a></li>
                <li>Use redirect URI: <code style="background: var(--color-glass); padding: 2px 4px; border-radius: 4px;">http://localhost:3000/gyazo/callback</code></li>
                <li>Enter your credentials below</li>
                </ol>

                <div style="margin-bottom: 12px;">
                <label style="display: block; margin-bottom: 6px; color: var(--color-fg); font-weight: 600; font-size: 12px;">
                    Client ID:
                </label>
                <input type="text" id="gyazo-client-id" placeholder="Enter your Gyazo Client ID"
                       value="${/** @type {any} */ (config).clientId}" style="
                    width: 100%;
                    padding: 8px 10px;
                    border-radius: 6px;
                    border: 1px solid var(--color-border);
                    background: var(--color-glass);
                    color: var(--color-fg);
                    font-size: 12px;
                    box-sizing: border-box;
                    font-family: monospace;
                ">
                </div>
                <div style="margin-bottom: 12px;">
                <label style="display: block; margin-bottom: 6px; color: var(--color-fg); font-weight: 600; font-size: 12px;">
                    Client Secret:
                </label>
                <input type="password" id="gyazo-client-secret" placeholder="Enter your Gyazo Client Secret"
                       value="${/** @type {any} */ (config).clientSecret}" style="
                    width: 100%;
                    padding: 8px 10px;
                    border-radius: 6px;
                    border: 1px solid var(--color-border);
                    background: var(--color-glass);
                    color: var(--color-fg);
                    font-size: 12px;
                    box-sizing: border-box;
                    font-family: monospace;
                ">
                </div>
                <button id="save-credentials" style="
                width: 100%;
                padding: 8px;
                background: var(--color-accent);
                border: none;
                border-radius: 6px;
                color: var(--color-fg-alt);
                font-size: 12px;
                font-weight: 600;
                cursor: pointer;
                transition: var(--transition-smooth);
                ">
                💾 Save Custom Credentials
                </button>
            </div>
            </details>

            <!-- Account Actions -->
            <div style="display: flex; flex-direction: column; gap: 8px;">
            <button id="gyazo-connect" style="
                width: 100%;
                padding: 12px;
                background: var(--color-success);
                border: none;
                border-radius: 8px;
                color: white;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: var(--transition-smooth);
                display: ${isAuthenticated ? "none" : "block"};
            ">
                🔗 Connect to Gyazo
            </button>

            <button id="gyazo-disconnect" style="
                width: 100%;
                padding: 12px;
                background: var(--color-error);
                border: none;
                border-radius: 8px;
                color: white;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: var(--transition-smooth);
                display: ${isAuthenticated ? "block" : "none"};
            ">
                🔌 Disconnect Account
            </button>

            <button id="clear-all-data" style="
                width: 100%;
                padding: 12px;
                background: var(--color-warning);
                border: none;
                border-radius: 8px;
                color: white;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: var(--transition-smooth);
            ">
                🗑️ Clear All Data
            </button>

            <button id="gyazo-close" style="
                width: 100%;
                padding: 12px;
                background: var(--color-border-light);
                border: 1px solid var(--color-border);
                border-radius: 8px;
                color: var(--color-fg-alt);
                font-size: 14px;
                cursor: pointer;
                transition: var(--transition-smooth);
            ">
                Close
            </button>
            </div>
        `;

        // Event handlers
        const clearDataBtn = modal.querySelector("#clear-all-data"),
            clientIdInput = modal.querySelector("#gyazo-client-id"),
            clientSecretInput = modal.querySelector("#gyazo-client-secret"),
            closeBtn = modal.querySelector("#gyazo-close"),
            connectBtn = modal.querySelector("#gyazo-connect"),
            disconnectBtn = modal.querySelector("#gyazo-disconnect"),
            saveCredsBtn = modal.querySelector("#save-credentials");

        // Save credentials
        if (saveCredsBtn) {
            saveCredsBtn.addEventListener("click", () => {
                const clientId = /** @type {HTMLInputElement} */ (clientIdInput)?.value.trim(),
                    clientSecret = /** @type {HTMLInputElement} */ (clientSecretInput)?.value.trim();

                if (!clientId || !clientSecret) {
                    showNotification("Please enter both Client ID and Client Secret", "error");
                    return;
                }

                exportUtils.setGyazoConfig(clientId, clientSecret);
                showNotification("Gyazo credentials saved successfully!", "success");

                // Update the status in the current modal
                exportUtils.updateGyazoAuthStatus(modal);
            });
        }

        // Connect to Gyazo
        if (connectBtn) {
            connectBtn.addEventListener("click", async () => {
                try {
                    await exportUtils.authenticateWithGyazo();
                    // Update the status in the current modal
                    exportUtils.updateGyazoAuthStatus(modal);
                    showNotification("Gyazo account connected successfully!", "success");
                } catch (error) {
                    showNotification(`Failed to connect Gyazo account: ${/** @type {any} */ (error).message}`, "error");
                }
            });
        }

        // Disconnect from Gyazo
        if (disconnectBtn) {
            disconnectBtn.addEventListener("click", () => {
                exportUtils.clearGyazoAccessToken();
                // Update the status in the current modal
                exportUtils.updateGyazoAuthStatus(modal);
                showNotification("Gyazo account disconnected", "info");
            });
        }

        // Clear all data
        if (clearDataBtn) {
            clearDataBtn.addEventListener("click", () => {
                if (
                    confirm(
                        "Are you sure you want to clear all Gyazo data? This will remove your credentials and disconnect your account."
                    )
                ) {
                    exportUtils.clearGyazoConfig();
                    overlay.remove();
                    showNotification("All Gyazo data cleared", "info");
                }
            });
        }

        // Close modal
        if (closeBtn) {
            closeBtn.addEventListener("click", () => {
                overlay.remove();
            });
        }

        // ESC key handler
        const handleEscape = (/** @type {any} */ e) => {
            if (e.key === "Escape") {
                overlay.remove();
                document.removeEventListener("keydown", handleEscape);
            }
        };
        document.addEventListener("keydown", handleEscape);

        // Click outside to close
        overlay.addEventListener("click", (/** @type {any} */ e) => {
            if (e.target === overlay) {
                overlay.remove();
            }
        });

        overlay.append(modal);
        document.body.append(overlay);
    },

    /**
     * Shows Gyazo configuration setup guide
     */
    showGyazoSetupGuide() {
        const overlay = document.createElement("div");
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: var(--color-overlay-bg);
            backdrop-filter: blur(8px);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;

        const modal = document.createElement("div");
        modal.style.cssText = `
            background: var(--color-modal-bg);
            border-radius: var(--border-radius);
            padding: 24px;
            max-width: 600px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            border: 1px solid var(--color-glass-border);
            box-shadow: var(--color-box-shadow);
        `;

        modal.innerHTML = `
            <h3 style="margin: 0 0 16px 0; color: var(--color-modal-fg); text-align: center;">
                🔧 Gyazo Setup Guide
            </h3>
            <div style="color: var(--color-fg); line-height: 1.6;">
                <p><strong>To enable Gyazo integration, you need to:</strong></p>
                <ol style="margin: 16px 0; padding-left: 20px;">
                    <li>Visit <a href="https://gyazo.com/oauth/applications" target="_blank" style="color: var(--color-accent);">Gyazo Developer Applications</a></li>
                    <li>Create a new application with these settings:
                        <ul style="margin: 8px 0; padding-left: 20px;">
                            <li><strong>Application Name:</strong> FitFileViewer</li>
                            <li><strong>Redirect URI:</strong> <code style="background: var(--color-glass); padding: 2px 4px; border-radius: 4px;">http://localhost:3000/gyazo/callback</code></li>
                        </ul>
                    </li>
                    <li>Copy your <strong>Client ID</strong> and <strong>Client Secret</strong></li>
                    <li>Update the exportUtils.gyazoConfig in the source code:
                        <pre style="
                            background: var(--color-glass);
                            padding: 12px;
                            border-radius: 8px;
                            font-size: 12px;
                            margin: 8px 0;
                            overflow-x: auto;
                            color: var(--color-fg);
                        ">gyazoConfig: {
    clientId: 'YOUR_ACTUAL_CLIENT_ID',
    clientSecret: 'YOUR_ACTUAL_CLIENT_SECRET',
    // ... rest of config
}</pre>
                    </li>
                    <li>Restart the application</li>
                </ol>
                <div style="
                    background: var(--color-warning-bg);
                    border: 1px solid var(--color-warning);
                    border-radius: 8px;
                    padding: 12px;
                    margin: 16px 0;
                ">
                    <strong>⚠️ Security Note:</strong> Keep your Client Secret secure and never expose it in public code repositories.
                </div>
            </div>
            <button id="setup-close" style="
                width: 100%;
                padding: 12px;
                background: var(--color-accent);
                border: none;
                border-radius: 8px;
                color: var(--color-fg-alt);
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: var(--transition-smooth);
                margin-top: 16px;
            ">
                Got it!
            </button>
        `;

        const closeBtn = modal.querySelector("#setup-close");
        if (closeBtn) {
            closeBtn.addEventListener("click", () => {
                overlay.remove();
            });
        }

        // ESC key and click outside handlers
        const handleEscape = (/** @type {any} */ e) => {
            if (e.key === "Escape") {
                overlay.remove();
                document.removeEventListener("keydown", handleEscape);
            }
        };
        document.addEventListener("keydown", handleEscape);

        overlay.addEventListener("click", (/** @type {any} */ e) => {
            if (e.target === overlay) {
                overlay.remove();
            }
        });

        overlay.append(modal);
        document.body.append(overlay);
    },

    /**
     * Updates the authentication status in the Gyazo account manager modal
     * @param {HTMLElement} modal - The modal element containing status indicators
     */
    updateGyazoAuthStatus(modal) {
        const // Update auth status
            authStatus = modal.querySelector("#auth-status"),
            /** @type {GyazoConfig} */
            config = /** @type {any} */ (exportUtils.getGyazoConfig()),
            hasCredentials = Boolean(
                /** @type {GyazoConfig} */(config).clientId && /** @type {GyazoConfig} */ (config).clientSecret
            ),
            isAuthenticated = exportUtils.isGyazoAuthenticated();
        if (authStatus) {
            /** @type {HTMLElement} */ (authStatus).style.background = isAuthenticated
                ? "var(--color-success)"
                : "var(--color-error)";
            authStatus.textContent = isAuthenticated ? "✅ Connected" : "❌ Not Connected";
        }

        // Update credentials status
        const credsStatus = modal.querySelector("#creds-status");
        if (credsStatus) {
            /** @type {HTMLElement} */ (credsStatus).style.background = hasCredentials
                ? "var(--color-success)"
                : "var(--color-warning)";
            credsStatus.textContent = hasCredentials ? "🔑 Credentials Saved" : "⚠️ Credentials Needed";
        }

        // Update action buttons visibility
        const connectBtn = modal.querySelector("#gyazo-connect"),
            disconnectBtn = modal.querySelector("#gyazo-disconnect");

        if (connectBtn) {
            /** @type {HTMLElement} */ (connectBtn).style.display =
                hasCredentials && !isAuthenticated ? "block" : "none";
        }

        if (disconnectBtn) {
            /** @type {HTMLElement} */ (disconnectBtn).style.display = isAuthenticated ? "block" : "none";
        }

        console.log("[Gyazo] Status updated - Auth:", isAuthenticated, "Creds:", hasCredentials);
    },

    /**
     * Uploads image to Gyazo using the new API format
     * @param {string} base64Image - Base64 encoded image
     * @returns {Promise<string>} Gyazo URL
     */
    async uploadToGyazo(base64Image) {
        let accessToken = exportUtils.getGyazoAccessToken();

        // If no access token, try to authenticate
        if (!accessToken) {
            try {
                accessToken = await exportUtils.authenticateWithGyazo();
            } catch (error) {
                throw new Error(`Gyazo authentication required: ${/** @type {any} */ (error).message}`);
            }
        }

        try {
            // Convert base64 to blob for FormData
            const response = await fetch(base64Image),
                blob = await response.blob(),
                // Create FormData for multipart/form-data upload
                formData = new FormData();
            formData.append("access_token", accessToken);
            formData.append("imagedata", blob, "chart.png");

            const uploadResponse = await fetch(/** @type {any} */(exportUtils.getGyazoConfig()).uploadUrl, {
                body: formData,
                method: "POST",
            });

            if (!uploadResponse.ok) {
                // If unauthorized, clear the token and try to re-authenticate
                if (uploadResponse.status === 401) {
                    exportUtils.clearGyazoAccessToken();
                    throw new Error("Gyazo access token expired. Please re-authenticate.");
                }

                const errorText = await uploadResponse.text();
                throw new Error(`Gyazo upload failed: ${uploadResponse.status} - ${errorText}`);
            }

            const data = await uploadResponse.json();
            if (data.permalink_url) {
                return data.permalink_url;
            } else if (data.url) {
                return data.url;
            }
            throw new Error("No URL returned from Gyazo upload");
        } catch (error) {
            console.error("Error uploading to Gyazo:", error);

            // If it's an authentication error, clear the stored token
            if (
                /** @type {any} */ (error).message.includes("expired") ||
                /** @type {any} */ (error).message.includes("unauthorized")
            ) {
                exportUtils.clearGyazoAccessToken();
            }

            throw error;
        }
    },

    /**
     * Uploads image to Imgur and returns URL
     * @param {string} base64Image - Base64 encoded image
     * @returns {Promise<string>} Imgur URL
     */
    async uploadToImgur(base64Image) {
        const clientId = "0046ee9e30ac578", // User needs to replace this
            // Check if the client ID is the placeholder or default value
            defaultClientIds = ["0046ee9e30ac578", "YOUR_IMGUR_CLIENT_ID"];
        if (defaultClientIds.includes(clientId)) {
            throw new Error(
                "Imgur client ID not configured. Please add your Imgur client ID to the exportUtils.uploadToImgur function."
            );
        }

        try {
            const response = await fetch("https://api.imgur.com/3/image", {
                body: JSON.stringify({
                    description: "Chart exported from FitFileViewer",
                    image: base64Image.split(",")[1], // Remove data:image/png;base64, prefix
                    title: "FitFileViewer Chart",
                    type: "base64",
                }),
                headers: {
                    Authorization: `Client-ID ${clientId}`,
                    "Content-Type": "application/json",
                },
                method: "POST",
            });

            if (!response.ok) {
                throw new Error(`Imgur upload failed: ${response.status}`);
            }

            const data = await response.json();
            if (data.success) {
                return data.data.link;
            }
            throw new Error("Imgur upload failed");
        } catch (error) {
            console.error("Error uploading to Imgur:", error);
            throw error;
        }
    },
}; // Global export functions for the settings panel
