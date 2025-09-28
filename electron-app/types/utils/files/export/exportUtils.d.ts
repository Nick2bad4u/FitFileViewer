/**
 * Test-only: override internal dependencies (notifications, theme resolver)
 * @param {Partial<typeof __deps>} overrides
 */
export function __setTestDeps(overrides: Partial<typeof __deps>): void;
export namespace exportUtils {
    /**
     * Helper method to add combined CSV data to ZIP
     * @param {any} zip - JSZip instance
     * @param {any[]} charts - Array of Chart.js instances
     */
    function addCombinedCSVToZip(zip: any, charts: any[]): Promise<void>;
    /**
     * Initiates Gyazo OAuth authentication
     * @returns {Promise<string>} Access token
     */
    function authenticateWithGyazo(): Promise<string>;
    /**
     * Downloads chart as PNG image with theme-aware background
     * @param {ChartJSInstance} chart - Chart.js instance
     * @param {string} filename - Download filename
     */ /**
    * Clears the stored Gyazo access token
    */
    function clearGyazoAccessToken(): void;
    /**
     * Creates a combined image of all charts
     * @param {ChartJSInstance[]} charts - Array of Chart.js instances
     * @param {string} filename - Download filename
     */ /**
    * Clears all Gyazo configuration and tokens
    */
    function clearGyazoConfig(): void;
    /**
     * Copies chart image to clipboard with theme background
     * @param {ChartJSInstance} chart - Chart.js instance
     */ function copyChartToClipboard(chart: ChartJSInstance): Promise<void>;
    /**
     * Copies combined charts image to clipboard
     * @param {ChartJSInstance[]} charts - Array of Chart.js instances
     */
    function copyCombinedChartsToClipboard(charts: ChartJSInstance[]): Promise<void>;
    function createCombinedChartsImage(charts: any, filename?: string): Promise<void>;
    /**
     * Creates the Gyazo OAuth authentication modal
     * @param {string} authUrl - OAuth authorization URL
     * @param {string} _state - CSRF protection state (unused)
     * @param {Function} resolve - Promise resolve function
     * @param {Function} reject - Promise reject function
     * @param {boolean} useServer - Whether to use server
     * @returns {HTMLElement} Modal element
     */
    function createGyazoAuthModal(authUrl: string, _state: any, resolve: Function, reject: Function, useServer?: boolean): HTMLElement;
    function downloadChartAsPNG(chart: any, filename?: string): Promise<void>;
    /**
     * Exchanges authorization code for access token
     * @param {string} code - Authorization code
     * @param {string} redirectUri - Redirect URI used in OAuth flow
     * @returns {Promise<Object>} Token data with access_token
     */
    function exchangeGyazoCodeForToken(code: string, redirectUri: string): Promise<Object>;
    /**
     * Exports all charts and data as a ZIP file
     * @param {any[]} charts - Array of Chart.js instances
     */
    function exportAllAsZip(charts: any[]): Promise<void>;
    /**
     * Exports chart data as CSV
     * @param {any[]} chartData - Chart data array
     * @param {string} fieldName - Field name for the data
     * @param {string} filename - Download filename
     */
    function exportChartDataAsCSV(chartData: any[], fieldName: string, filename?: string): Promise<void>;
    /**
     * Exports chart data as JSON
     * @param {any[]} chartData - Chart data array
     * @param {string} fieldName - Field name for the data
     * @param {string} filename - Download filename
     */
    function exportChartDataAsJSON(chartData: any[], fieldName: string, filename?: string): Promise<void>;
    /**
     * Exports combined chart data as CSV
     * @param {any[]} charts - Array of Chart.js instances
     * @param {string} filename - Download filename
     */
    function exportCombinedChartsDataAsCSV(charts: any[], filename?: string): Promise<void>;
    /**
     * Gets the theme background color for exports
     * @returns {string} Background color based on export theme setting
     */
    function getExportThemeBackground(): string;
    /**
     * Gets the stored Gyazo access token
     * @returns {string|null} Access token or null if not found
     */
    function getGyazoAccessToken(): string | null;
    /**
     * Gets Gyazo configuration from user settings or defaults
     * Gyazo OAuth/upload flows are excluded from coverage due to external auth, clipboard,
     * and network side effects that are brittle in jsdom.
     * @returns {Object} Gyazo configuration object
     */
    function getGyazoConfig(): Object;
    /**
     * Checks if user is authenticated with Gyazo
     * @returns {boolean} True if authenticated, false otherwise
     */
    function isGyazoAuthenticated(): boolean;
    /**
     * Validates a Chart.js instance
     * @param {ChartJSInstance} chart - Chart.js instance to validate
     * @returns {boolean} True if chart is valid, false otherwise
     */
    function isValidChart(chart: ChartJSInstance): boolean;
    function printChart(chart: any): Promise<void>;
    /**
     * Prints multiple charts in a combined format
     * @param {any[]} charts - Array of Chart.js instances
     */
    function printCombinedCharts(charts: any[]): void;
    /**
     * Stores the Gyazo access token
     * @param {string} token - Access token to store
     */
    function setGyazoAccessToken(token: string): void;
    /**
     * Prints the chart with theme background
     * @param {ChartJSInstance} chart - Chart.js instance
     */ /**
    * Saves Gyazo configuration to user settings
    * @param {string} clientId - Gyazo client ID
    * @param {string} clientSecret - Gyazo client secret
    */
    function setGyazoConfig(clientId: string, clientSecret: string): void;
    /**
     * Shares charts as URL with image upload to Imgur
     */
    function shareChartsAsURL(): Promise<void>;
    /**
     * Shares charts as URL with image upload to Gyazo
     */
    function shareChartsToGyazo(): Promise<void>;
    /**
     * Shows Gyazo account management modal with credentials setup
     */
    function showGyazoAccountManager(): void;
    /**
     * Shows Gyazo configuration setup guide
     */
    function showGyazoSetupGuide(): void;
    /**
     * Updates the authentication status in the Gyazo account manager modal
     * @param {HTMLElement} modal - The modal element containing status indicators
     */
    function updateGyazoAuthStatus(modal: HTMLElement): void;
    /**
     * Uploads image to Gyazo using the new API format
     * @param {string} base64Image - Base64 encoded image
     * @returns {Promise<string>} Gyazo URL
     */
    function uploadToGyazo(base64Image: string): Promise<string>;
    /**
     * Gets Imgur configuration from localStorage with fallback
     * @returns {Object} Imgur configuration object
     */
    function getImgurConfig(): Object;
    /**
     * Saves Imgur configuration to localStorage
     * @param {string} clientId - Imgur client ID
     */
    function setImgurConfig(clientId: string): void;
    /**
     * Clears Imgur configuration
     */
    function clearImgurConfig(): void;
    /**
     * Checks if Imgur is properly configured with a non-default client ID
     * @returns {boolean} True if configured with custom client ID
     */
    function isImgurConfigured(): boolean;
    /**
     * Uploads image to Imgur and returns URL
     * @param {string} base64Image - Base64 encoded image
     * @returns {Promise<string>} Imgur URL
     */
    function uploadToImgur(base64Image: string): Promise<string>; /**
     * Shows Imgur account management modal with client ID setup
     */
    function showImgurAccountManager(): void;
    /**
     * Shows Imgur setup guide with step-by-step instructions
     */
    function showImgurSetupGuide(): void;
    /**
     * Updates the status display in the Imgur account manager modal
     * @param {HTMLElement} modal - The modal element containing status indicators
     */
    function updateImgurStatus(modal: HTMLElement): void;
}
export type ChartJSInstance = {
    /**
     * - Chart canvas element
     */
    canvas: HTMLCanvasElement;
    /**
     * - Chart data object
     */
    data: Object;
    /**
     * - Chart options object
     */
    options: Object;
    /**
     * - Function to export chart as base64 image
     */
    toBase64Image: Function;
    /**
     * - Function to update chart
     */
    update: Function;
    /**
     * - Function to destroy chart
     */
    destroy: Function;
};
export type GyazoConfig = {
    /**
     * - Gyazo client ID
     */
    clientId: string;
    /**
     * - Gyazo client secret
     */
    clientSecret: string;
    /**
     * - Gyazo redirect URI
     */
    redirectUri?: string;
    /**
     * - Gyazo token URL
     */
    tokenUrl?: string;
    /**
     * - Gyazo auth URL
     */
    authUrl?: string;
    /**
     * - Gyazo upload URL
     */
    uploadUrl?: string;
};
export type WindowExtensions = {
    /**
     * - Chart.js instances array
     */
    _chartjsInstances: Object;
    /**
     * - Notification function
     */
    showNotification: Function;
    /**
     * - Electron API object
     */
    electronAPI: Object;
    /**
     * - JSZip constructor
     */
    JSZip: any;
};
export type ExportResult = {
    /**
     * - Whether export was successful
     */
    success: boolean;
    /**
     * - URL if uploaded
     */
    url?: string;
    /**
     * - Error message if failed
     */
    error?: string;
};
/**
 * @type {{
 *  showNotification: typeof __realShowNotification,
 *  detectCurrentTheme: typeof __realDetectCurrentTheme
 * }}
 */
declare let __deps: {
    showNotification: typeof __realShowNotification;
    detectCurrentTheme: typeof __realDetectCurrentTheme;
};
import { showNotification as __realShowNotification } from "../../ui/notifications/showNotification.js";
import { detectCurrentTheme as __realDetectCurrentTheme } from "../../charts/theming/chartThemeUtils.js";
export {};
//# sourceMappingURL=exportUtils.d.ts.map