import { detectCurrentTheme as __realDetectCurrentTheme } from "../../charts/theming/chartThemeUtils.js";
import { sanitizeCssColorToken } from "../../dom/index.js";
import {
    fetchWithTimeout,
    isAbortError,
    truncateErrorText,
} from "../../net/networkUtils.js";
import {
    getRendererElectronApi,
    type RendererElectronApiScope,
} from "../../runtime/electronApiRuntime.js";
import { loggingTimestampRuntime } from "../../logging/loggingTimestampRuntime.js";
import { getChartSetting } from "../../state/domain/settingsStateManager.js";
import {
    safeStorageGetItem,
    safeStorageRemoveItem,
    safeStorageSetItem,
} from "../../storage/storageUtils.js";
import {
    resolveExportZipRuntime,
    type ExportZipConstructor,
    type ExportZipLike,
} from "./exportZipRuntime.js";
import {
    getExportUtilsRuntime,
    type ExportUtilsRuntime,
    type ExportStorageLike,
    type ExportStorageProvider,
    type SecureRandomScope,
} from "./exportUtilsRuntime.js";
import { showChartSelectionModal } from "../../ui/components/createSettingsHeader.js";
import { createModalFocusTrap } from "../../ui/modals/modalFocusTrap.js";
import { showNotification as __realShowNotification } from "../../ui/notifications/showNotification.js";
import type {
    ElectronClipboardApi,
    ElectronGyazoExternalApi,
} from "../../../shared/preloadApi.js";

type LooseRecord = unknown;
type ExportElectronApi = Readonly<
    Partial<ElectronClipboardApi & ElectronGyazoExternalApi>
>;
type ChartDataPoint = {
    x?: LooseRecord;
    y?: LooseRecord;
    [key: string]: LooseRecord;
};
type ChartDataset = {
    data?: ChartDataPoint[];
    label?: string;
    [key: string]: LooseRecord;
};

function exportUtilsRuntime(): ExportUtilsRuntime {
    return getExportUtilsRuntime();
}

function getDefaultExportStorage(): ExportStorageLike | null {
    return exportUtilsRuntime().getStorage();
}

function getSecureRandomScope(): SecureRandomScope {
    return exportUtilsRuntime().getSecureRandomScope();
}

function isoNow(): string {
    return loggingTimestampRuntime().isoNow();
}

/**
 * Minimal Chart.js-like shape accepted by export helpers.
 */
export type ExportableChart = {
    canvas?: HTMLCanvasElement;
    config?: {
        type?: string;
        [key: string]: LooseRecord;
    };
    data?: {
        datasets?: ChartDataset[];
        [key: string]: LooseRecord;
    };
    destroy?: () => void;
    toBase64Image?: (
        type?: string,
        quality?: number,
        backgroundColor?: string
    ) => string;
    update?: () => void;
    [key: string]: LooseRecord;
};

type ValidChart = ExportableChart & {
    canvas: HTMLCanvasElement;
    config: NonNullable<ExportableChart["config"]>;
    toBase64Image: NonNullable<ExportableChart["toBase64Image"]>;
};
type GyazoConfig = {
    authUrl: string;
    clientId: null | string;
    clientSecret: null | string;
    redirectUri: string;
    tokenUrl: string;
    uploadUrl: string;
};
type GyazoOAuthCallbackPayload = {
    code: string;
    state: string;
};
type GyazoTokenResponse = Record<string, unknown> & {
    access_token: string;
};
type GyazoUploadFetchResponse = Omit<Response, "ok"> & {
    ok?: boolean;
    permalink_url?: string;
    url?: string;
};
type GyazoUploadResponse = Record<string, unknown> & {
    permalink_url?: string;
    url?: string;
};
type ImgurConfig = {
    clientId: string;
    uploadUrl: string;
};
type ExportNotification = (
    ...args: Parameters<typeof __realShowNotification>
) => void;
type OAuthModalReject = (reason?: unknown) => void;
type OAuthModalResolve = (token: string) => void;
type ValidationResult<T> =
    | {
          data: T;
          success: true;
      }
    | {
          error: string;
          success: false;
      };
type ExportModalAccessibilityOptions = {
    closeOverlay: () => void;
    initialFocusElement?: HTMLElement | null;
    modal: HTMLElement;
    overlay: HTMLElement;
    signal: AbortSignal;
    title: HTMLElement;
};
type ExportElectronApiOptions = {
    electronApiScope?: RendererElectronApiScope | undefined;
};

const EXPORT_ELECTRON_API_METHODS = [
    "onGyazoOAuthCallback",
    "startGyazoServer",
    "stopGyazoServer",
    "writeClipboardPngDataUrl",
    "writeClipboardText",
] as const satisfies readonly (keyof ExportElectronApi)[];

let exportModalTitleCounter = 0;
let detectCurrentThemeOverride: typeof __realDetectCurrentTheme | null = null;
let showNotificationOverride: ExportNotification | null = null;

function hasOptionalOwnElectronFunction(
    record: object,
    key: keyof ExportElectronApi
): boolean {
    if (!(key in record)) {
        return true;
    }

    const descriptor = Object.getOwnPropertyDescriptor(record, key);
    return descriptor !== undefined && typeof descriptor.value === "function";
}

function isExportElectronApi(value: unknown): value is ExportElectronApi {
    if (value === null || typeof value !== "object") {
        return false;
    }

    return EXPORT_ELECTRON_API_METHODS.every((key) =>
        hasOptionalOwnElectronFunction(value, key)
    );
}

function getExportElectronApi(
    options?: ExportElectronApiOptions
): ExportElectronApi | null {
    return getRendererElectronApi(
        isExportElectronApi,
        options?.electronApiScope
    );
}

function setupExportModalAccessibility({
    closeOverlay,
    initialFocusElement,
    modal,
    overlay,
    signal,
    title,
}: ExportModalAccessibilityOptions): () => void {
    const previousFocus = exportUtilsRuntime().getActiveElement();
    const titleId =
        title.id || `export-modal-title-${++exportModalTitleCounter}`;
    title.id = titleId;
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", titleId);
    if (!modal.hasAttribute("tabindex")) {
        modal.tabIndex = -1;
    }

    let focusTrapCleanup: (() => void) | null = null;
    let cleanedUp = false;
    const installFocusTrap = () => {
        if (cleanedUp || focusTrapCleanup) {
            return;
        }
        focusTrapCleanup = createModalFocusTrap(
            modal,
            initialFocusElement ?? null
        );
    };

    if (modal.isConnected) {
        installFocusTrap();
    } else {
        queueMicrotask(installFocusTrap);
    }

    exportUtilsRuntime().addDocumentKeydownListener(
        (event) => {
            if (event.key === "Escape") {
                closeOverlay();
            }
        },
        { signal }
    );
    overlay.addEventListener(
        "click",
        (event) => {
            if (event.target === overlay) {
                closeOverlay();
            }
        },
        { signal }
    );

    return () => {
        cleanedUp = true;
        focusTrapCleanup?.();
        focusTrapCleanup = null;
        if (previousFocus?.isConnected) {
            previousFocus.focus();
        }
    };
}

async function stopGyazoServerIfAvailable(
    options?: ExportElectronApiOptions
): Promise<void> {
    const stopGyazoServer = getExportElectronApi(options)?.stopGyazoServer;
    if (typeof stopGyazoServer === "function") {
        await stopGyazoServer();
    }
}

const showNotification: ExportNotification = (...args) => {
    (showNotificationOverride ?? __realShowNotification)(...args);
};
const detectCurrentTheme = (): ReturnType<typeof __realDetectCurrentTheme> =>
    (detectCurrentThemeOverride ?? __realDetectCurrentTheme)();

/*
 * Convert a base64 data URL (e.g. data:image/png;base64,...) into a Blob
 * without using fetch().
 *
 * Why: fetch(data:...) is treated as a network request and can be blocked by
 * CSP connect-src.
 *
 * @param {string} dataUrl
 *
 * @returns {Blob}
 */
function dataUrlToBlob(dataUrl: string): Blob {
    const prefixIdx = dataUrl.indexOf("data:");
    if (prefixIdx !== 0) {
        throw new Error("Invalid data URL");
    }

    const commaIdx = dataUrl.indexOf(",");
    if (commaIdx === -1) {
        throw new Error("Invalid data URL");
    }

    const meta = dataUrl.slice(5, commaIdx); // after "data:"
    const payload = dataUrl.slice(commaIdx + 1);

    const isBase64 = meta.includes(";base64");
    const mime = meta.split(";")[0] || "application/octet-stream";

    if (!isBase64) {
        // Percent-encoded payload
        const decoded = decodeURIComponent(payload);
        return new Blob([decoded], { type: mime });
    }

    const binary = atob(payload);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
        // `atob` produces a Latin-1 string; codePointAt satisfies lint and is safe here.
        bytes[i] = binary.codePointAt(i) ?? 0;
    }

    return new Blob([bytes], { type: mime });
}

/*
 * Generate a cryptographically-strong OAuth state token.
 *
 * @returns {string}
 */
function generateOAuthState(): string {
    const { crypto: cryptoObject } = getSecureRandomScope();

    if (!cryptoObject || typeof cryptoObject.getRandomValues !== "function") {
        throw new Error("Secure random number generation is unavailable");
    }

    const bytes = new Uint8Array(16);
    cryptoObject.getRandomValues(bytes);

    // Hex encoding keeps this simple and deterministic across environments.
    return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function stringifyChartValue(value: unknown): string {
    if (value === null || value === undefined) {
        return "";
    }

    if (value instanceof Date) {
        return value.toISOString();
    }

    if (
        typeof value === "bigint" ||
        typeof value === "boolean" ||
        typeof value === "number" ||
        typeof value === "string"
    ) {
        return String(value);
    }

    try {
        return JSON.stringify(value) ?? "";
    } catch {
        return "";
    }
}

function getSortedChartValues(values: Iterable<unknown>): unknown[] {
    const sorted: unknown[] = [];
    for (const value of values) {
        const valueText = stringifyChartValue(value);
        const insertAt = sorted.findIndex(
            (existing) =>
                stringifyChartValue(existing).localeCompare(valueText) > 0
        );

        if (insertAt === -1) {
            sorted.push(value);
        } else {
            sorted.splice(insertAt, 0, value);
        }
    }

    return sorted;
}

/*
 * @returns {ExportZipConstructor}
 */
function getExportZipConstructor(): ExportZipConstructor {
    const constructor = resolveExportZipRuntime();
    if (constructor === undefined) {
        throw new TypeError("JSZip library not loaded");
    }
    return constructor;
}

/*
 * @param {Window} printWindow
 */
function detachPrintWindowOpener(printWindow: Window): void {
    try {
        printWindow.opener = null;
    } catch {
        /* ignore */
    }
}

/*
 * @param {Window} printWindow
 * @param {string} title
 * @param {string} styles
 *
 * @returns {Document}
 */
function preparePrintDocument(
    printWindow: Window,
    title: string,
    styles: string
): Document {
    detachPrintWindowOpener(printWindow);

    const { document: printDocument } = printWindow;
    printDocument.title = title;
    printDocument.head.replaceChildren();
    printDocument.body.replaceChildren();

    const styleElement = printDocument.createElement("style");
    styleElement.textContent = styles;
    printDocument.head.append(styleElement);

    return printDocument;
}

/*
 * @param {Window} printWindow
 */
function printAndCloseWindow(printWindow: Window): void {
    try {
        printWindow.focus();
        printWindow.print();
    } finally {
        printWindow.setTimeout(() => printWindow.close(), 50);
    }
}

/*
 * @param {Window} printWindow
 * @param {HTMLImageElement} imageElement
 */
function printWhenImageReady(
    printWindow: Window,
    imageElement: HTMLImageElement
): void {
    const imageLoadController = exportUtilsRuntime().createAbortController();
    const printAndClose = () => {
        imageLoadController.abort();
        printAndCloseWindow(printWindow);
    };

    if (imageElement.complete) {
        printWindow.setTimeout(printAndClose, 0);
        return;
    }

    imageElement.addEventListener("load", printAndClose, {
        once: true,
        signal: imageLoadController.signal,
    });
    imageElement.addEventListener("error", printAndClose, {
        once: true,
        signal: imageLoadController.signal,
    });
}

/*
 * @param {unknown} error
 *
 * @returns {boolean}
 */
// fetchWithTimeout/isAbortError/truncateErrorText are imported.

function failValidation<T>(error: string): ValidationResult<T> {
    return { error, success: false };
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getNonEmptyString(
    record: Record<string, unknown>,
    key: string
): string | undefined {
    const value = record[key];
    return typeof value === "string" && value.length > 0 ? value : undefined;
}

function getNullableNonEmptyString(
    record: Record<string, unknown>,
    key: string
): null | string | undefined {
    const value = record[key];
    if (value === null) {
        return null;
    }

    return typeof value === "string" && value.length > 0 ? value : undefined;
}

/*
 * Runtime validation for Gyazo configuration.
 *
 * Notes:
 *
 * - ClientId/clientSecret are user-configurable via storage.
 * - Endpoint URLs should always be HTTPS.
 * - These checks intentionally avoid URL-constructor validation because some
 *   unit tests mock the global URL object. Semantic validation is enforced at
 *   use-sites.
 */
function validateGyazoConfig(value: unknown): ValidationResult<GyazoConfig> {
    if (!isObjectRecord(value)) {
        return failValidation("Gyazo configuration must be an object");
    }

    const authUrl = getNonEmptyString(value, "authUrl"),
        clientId = getNullableNonEmptyString(value, "clientId"),
        clientSecret = getNullableNonEmptyString(value, "clientSecret"),
        redirectUri = getNonEmptyString(value, "redirectUri"),
        tokenUrl = getNonEmptyString(value, "tokenUrl"),
        uploadUrl = getNonEmptyString(value, "uploadUrl");

    if (
        !authUrl ||
        clientId === undefined ||
        clientSecret === undefined ||
        !redirectUri ||
        !tokenUrl ||
        !uploadUrl
    ) {
        return failValidation("Gyazo configuration has invalid fields");
    }

    return {
        data: {
            authUrl,
            clientId,
            clientSecret,
            redirectUri,
            tokenUrl,
            uploadUrl,
        },
        success: true,
    };
}

function validateGyazoTokenResponse(
    value: unknown
): ValidationResult<GyazoTokenResponse> {
    if (!isObjectRecord(value)) {
        return failValidation("Gyazo token response must be an object");
    }

    const accessToken = getNonEmptyString(value, "access_token");
    if (!accessToken) {
        return failValidation("Gyazo token response is missing access_token");
    }

    return {
        data: { ...value, access_token: accessToken },
        success: true,
    };
}

function validateGyazoUploadResponse(
    value: unknown
): ValidationResult<GyazoUploadResponse> {
    if (!isObjectRecord(value)) {
        return failValidation("Gyazo upload response must be an object");
    }

    const permalinkUrl = getNonEmptyString(value, "permalink_url"),
        url = getNonEmptyString(value, "url");

    if (
        ("permalink_url" in value && !permalinkUrl) ||
        ("url" in value && !url)
    ) {
        return failValidation("Gyazo upload response has invalid URL fields");
    }

    return {
        data: {
            ...value,
            ...(permalinkUrl ? { permalink_url: permalinkUrl } : {}),
            ...(url ? { url } : {}),
        },
        success: true,
    };
}

/*
 * @param {unknown} value
 *
 * @returns {value is GyazoOAuthCallbackPayload}
 */
function isGyazoOAuthCallbackPayload(
    value: unknown
): value is GyazoOAuthCallbackPayload {
    if (typeof value !== "object" || value === null) {
        return false;
    }

    return (
        "code" in value &&
        typeof value.code === "string" &&
        "state" in value &&
        typeof value.state === "string"
    );
}

/*
 * @param {unknown} error
 *
 * @returns {string}
 */
function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

/*
 * Validate a Gyazo endpoint URL.
 *
 * @param {unknown} url
 * @param {ReadonlySet<string>} allowedHosts
 *
 * @returns {string}
 */
function validateGyazoEndpointUrl(
    url: unknown,
    allowedHosts: ReadonlySet<string>
): string {
    if (typeof url !== "string") {
        throw new TypeError("Invalid Gyazo endpoint URL");
    }
    const trimmed = url.trim();
    if (!trimmed) {
        throw new TypeError("Invalid Gyazo endpoint URL");
    }

    let parsed;
    try {
        parsed = new URL(trimmed);
    } catch {
        throw new TypeError("Invalid Gyazo endpoint URL");
    }

    if (parsed.protocol !== "https:") {
        throw new Error("Gyazo endpoints must use HTTPS");
    }
    if (parsed.username || parsed.password) {
        throw new Error("Credentials in Gyazo endpoint URLs are not allowed");
    }

    if (!allowedHosts.has(parsed.hostname)) {
        throw new Error("Unexpected Gyazo endpoint host");
    }

    return trimmed;
}

/*
 * Validate the redirect URI used in the Gyazo OAuth desktop flow. We only allow
 * http://localhost:<port>/gyazo/callback.
 *
 * @param {unknown} redirectUri
 *
 * @returns {string}
 */
function validateGyazoRedirectUri(redirectUri: unknown): string {
    if (typeof redirectUri !== "string") {
        throw new TypeError("Invalid redirect URI");
    }

    const trimmed = redirectUri.trim();
    if (!trimmed) {
        throw new TypeError("Invalid redirect URI");
    }

    let parsed;
    try {
        parsed = new URL(trimmed);
    } catch {
        throw new TypeError("Invalid redirect URI");
    }

    if (
        parsed.protocol !== "http:" ||
        parsed.hostname !== "localhost" ||
        parsed.pathname !== "/gyazo/callback"
    ) {
        throw new Error("Invalid redirect URI");
    }

    // Ensure the port is a valid integer.
    const port = Number(parsed.port);
    if (!Number.isInteger(port) || port < 1 || port > 65_535) {
        throw new Error("Invalid redirect URI");
    }

    return trimmed;
}

/*
 * Validate an Imgur endpoint URL.
 *
 * @param {unknown} url
 * @param {ReadonlySet<string>} allowedHosts
 *
 * @returns {string}
 */
function validateImgurEndpointUrl(
    url: unknown,
    allowedHosts: ReadonlySet<string>
): string {
    if (typeof url !== "string") {
        throw new TypeError("Invalid Imgur endpoint URL");
    }
    const trimmed = url.trim();
    if (!trimmed) {
        throw new TypeError("Invalid Imgur endpoint URL");
    }

    let parsed;
    try {
        parsed = new URL(trimmed);
    } catch {
        throw new TypeError("Invalid Imgur endpoint URL");
    }

    if (parsed.protocol !== "https:") {
        throw new Error("Imgur endpoints must use HTTPS");
    }
    if (parsed.username || parsed.password) {
        throw new Error("Credentials in Imgur endpoint URLs are not allowed");
    }

    if (!allowedHosts.has(parsed.hostname)) {
        throw new Error("Unexpected Imgur endpoint host");
    }

    return trimmed;
}

// Internal dependency container, overridable in tests
let __deps: {
    detectCurrentTheme: typeof __realDetectCurrentTheme;
    getStorage: ExportStorageProvider;
    showNotification: ExportNotification;
} = {
    detectCurrentTheme,
    getStorage: getDefaultExportStorage,
    showNotification,
};

/**
 * Test-only: override internal dependencies (notifications, theme resolver)
 */
export function __setTestDeps(overrides: Partial<typeof __deps>): void {
    try {
        if (overrides && typeof overrides === "object") {
            if (Object.hasOwn(overrides, "detectCurrentTheme")) {
                detectCurrentThemeOverride =
                    overrides.detectCurrentTheme ?? null;
            }
            if (Object.hasOwn(overrides, "showNotification")) {
                showNotificationOverride = overrides.showNotification ?? null;
            }
            __deps = { ...__deps, ...overrides };
        }
    } catch {
        /* Ignore errors */
    }
}

// JSZip is registered by the core vendor bundle and resolved only where exports need it.

/*
 * @param {ChartJSInstance} chart
 *
 * @returns {ChartDataset | undefined}
 */
function getFirstChartDataset(
    chart: ExportableChart
): ChartDataset | undefined {
    return chart.data?.datasets?.[0];
}

function decodeCharacterCodes(codes: readonly number[]): string {
    return codes.map((code: number) => String.fromCodePoint(code)).join("");
}

function reverseText(value: string): string {
    let reversed = "";
    for (let index = value.length - 1; index >= 0; index -= 1) {
        reversed += value[index] ?? "";
    }

    return reversed;
}

function fillCanvasBackground(
    ctx: CanvasRenderingContext2D | null,
    width: number,
    height: number,
    backgroundColor: string
): void {
    if (!ctx || backgroundColor === "transparent") {
        return;
    }

    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);
}

function getDataUrlPayload(dataUrl: string, errorMessage: string): string {
    const imageData = dataUrl.split(",")[1];
    if (!imageData) {
        throw new Error(errorMessage);
    }

    return imageData;
}

function readObjectProperty(
    value: unknown,
    property: string
): unknown | undefined {
    if (typeof value !== "object" || value === null) {
        return undefined;
    }

    return Object.getOwnPropertyDescriptor(value, property)?.value;
}

function getImgurUploadLink(value: unknown): string | undefined {
    const data = readObjectProperty(value, "data");
    if (typeof data !== "object" || data === null) {
        return undefined;
    }

    const link = readObjectProperty(data, "link");
    return typeof link === "string" && link.length > 0 ? link : undefined;
}

function confirmDangerousAction(message: string): boolean {
    return exportUtilsRuntime().confirmDangerousAction(message);
}

function addSingleChartToZip(
    zip: ExportZipLike,
    chart: ValidChart,
    index: number,
    backgroundColor: string
): void {
    const canvas = exportUtilsRuntime().createElement("canvas"),
        dataset = getFirstChartDataset(chart),
        fieldName = dataset?.label || `chart-${index}`,
        safeFieldName = fieldName.replaceAll(/[^\da-z]/gi, "-");
    canvas.width = chart.canvas.width;
    canvas.height = chart.canvas.height;

    const ctx = canvas.getContext("2d");
    fillCanvasBackground(ctx, canvas.width, canvas.height, backgroundColor);
    ctx?.drawImage(chart.canvas, 0, 0);

    zip.file(
        `${safeFieldName}-chart.png`,
        getDataUrlPayload(
            canvas.toDataURL("image/png"),
            "Invalid chart image data"
        ),
        { base64: true }
    );

    if (!dataset?.data) {
        return;
    }

    const headers = ["timestamp", fieldName],
        csvContent = [
            headers.join(","),
            ...dataset.data.map(
                (point) =>
                    `${stringifyChartValue(point.x)},${stringifyChartValue(point.y)}`
            ),
        ].join("\n");
    zip.file(`${safeFieldName}-data.csv`, csvContent);

    const jsonData = {
        chartType: chart.config.type,
        data: dataset.data,
        exportedAt: isoNow(),
        field: fieldName,
        totalPoints: dataset.data.length,
    };
    zip.file(`${safeFieldName}-data.json`, JSON.stringify(jsonData, null, 2));
}

function addCombinedChartsImageToZip(
    zip: ExportZipLike,
    charts: ExportableChart[],
    backgroundColor: string
): void {
    if (charts.length <= 1) {
        return;
    }

    const chartHeight = 400,
        chartWidth = 800,
        cols = Math.ceil(Math.sqrt(charts.length)),
        combinedCanvas = exportUtilsRuntime().createElement("canvas"),
        ctx = combinedCanvas.getContext("2d"),
        padding = 20,
        rows = Math.ceil(charts.length / cols);

    combinedCanvas.width = cols * chartWidth + (cols - 1) * padding;
    combinedCanvas.height = rows * chartHeight + (rows - 1) * padding;
    fillCanvasBackground(
        ctx,
        combinedCanvas.width,
        combinedCanvas.height,
        backgroundColor
    );

    for (const [index, chart] of charts.entries()) {
        if (!exportUtils.isValidChart(chart)) {
            continue;
        }

        const col = index % cols,
            row = Math.floor(index / cols),
            tempCanvas = exportUtilsRuntime().createElement("canvas"),
            x = col * (chartWidth + padding),
            y = row * (chartHeight + padding);
        tempCanvas.width = chartWidth;
        tempCanvas.height = chartHeight;

        const tempCtx = tempCanvas.getContext("2d");
        fillCanvasBackground(tempCtx, chartWidth, chartHeight, backgroundColor);
        tempCtx?.drawImage(chart.canvas, 0, 0, chartWidth, chartHeight);
        ctx?.drawImage(tempCanvas, x, y);
    }

    zip.file(
        "combined-charts.png",
        getDataUrlPayload(
            combinedCanvas.toDataURL("image/png"),
            "Invalid combined chart image data"
        ),
        { base64: true }
    );
}

// Export utilities
/**
 * Export, sharing, printing, and upload helpers used by the renderer UI.
 */
export const exportUtils = {
    /*
     * Helper method to add combined CSV data to ZIP
     *
     * @param {ExportZipLike} zip - JSZip instance
     * @param {ChartJSInstance[]} charts - Array of Chart.js instances
     */
    addCombinedCSVToZip(zip: ExportZipLike, charts: ExportableChart[]) {
        try {
            const allTimestamps = new Set<unknown>();
            for (const chart of charts) {
                const dataset = getFirstChartDataset(chart);
                if (dataset?.data) {
                    for (const point of dataset.data)
                        allTimestamps.add(point.x);
                }
            }

            const headers = ["timestamp"],
                timestamps = getSortedChartValues(allTimestamps);
            for (const chart of charts) {
                const dataset = getFirstChartDataset(chart),
                    fieldName =
                        dataset?.label || `chart-${charts.indexOf(chart)}`;
                headers.push(fieldName);
            }

            const rows = [headers.join(",")];
            for (const timestamp of timestamps) {
                const row = [String(timestamp)];
                for (const chart of charts) {
                    const dataset = getFirstChartDataset(chart),
                        point = dataset?.data?.find((p) => p.x === timestamp);
                    row.push(stringifyChartValue(point?.y));
                }
                rows.push(row.join(","));
            }

            const csvContent = rows.join("\n");
            zip.file("combined-data.csv", csvContent);
        } catch (error) {
            console.error("Error adding combined CSV to ZIP:", error);
        }
    },

    /*
     * Initiates Gyazo OAuth authentication
     *
     * @returns {Promise<string>} Access token
     */
    async authenticateWithGyazo(
        options?: ExportElectronApiOptions
    ): Promise<string> {
        const config = exportUtils.getGyazoConfig();

        if (!config.clientId || !config.clientSecret) {
            exportUtils.showGyazoSetupGuide();
            throw new Error(
                "Gyazo credentials not configured. Please complete the setup first."
            );
        }

        const electronAPI = getExportElectronApi(options);
        if (
            !electronAPI ||
            typeof electronAPI.startGyazoServer !== "function" ||
            typeof electronAPI.stopGyazoServer !== "function" ||
            typeof electronAPI.onGyazoOAuthCallback !== "function"
        ) {
            // This module is renderer-side; tests or non-Electron environments may not expose electronAPI.
            throw new Error(
                "Gyazo OAuth is only available in the Electron desktop build (electronAPI unavailable)"
            );
        }
        const { onGyazoOAuthCallback, startGyazoServer, stopGyazoServer } =
            electronAPI;

        // Generate state before opening the local server so environments without
        // secure randomness fail closed without leaving a server running.
        const state = generateOAuthState();

        try {
            // Start the OAuth callback server
            const serverResult = await startGyazoServer(3000);
            if (!serverResult.success) {
                throw new Error(
                    `Failed to start OAuth server: ${serverResult.message ?? "unknown error"}`
                );
            }

            return await new Promise((resolve, reject) => {
                const unsubscribeRef: {
                    current?: (() => void) | undefined;
                } = {};

                /*
                 * Cleanup function used by both success and cancellation/error
                 * paths.
                 *
                 * @returns {Promise<void>}
                 */
                const cleanup = async () => {
                    try {
                        if (typeof unsubscribeRef.current === "function") {
                            unsubscribeRef.current();
                        }
                    } catch {
                        /* ignore */
                    }

                    safeStorageRemoveItem(
                        "gyazo_oauth_state",
                        __deps.getStorage
                    );

                    try {
                        await stopGyazoServer();
                    } catch {
                        /* ignore */
                    }

                    try {
                        const existingModal = exportUtilsRuntime().querySelector(
                            ".gyazo-auth-modal-overlay"
                        );
                        if (existingModal) {
                            existingModal.remove();
                        }
                    } catch {
                        /* ignore */
                    }
                };

                safeStorageSetItem(
                    "gyazo_oauth_state",
                    state,
                    __deps.getStorage
                );

                // Update redirect URI to use the actual server port
                const redirectUri = validateGyazoRedirectUri(
                        `http://localhost:${serverResult.port}/gyazo/callback`
                    ),
                    // Construct the authorization URL
                    authParams = new URLSearchParams({
                        client_id: config.clientId ?? "",
                        redirect_uri: redirectUri,
                        response_type: "code",
                        state,
                    }),
                    authUrl = `${validateGyazoEndpointUrl(
                        config.authUrl,
                        new Set(["gyazo.com"])
                    )}?${authParams.toString()}`,
                    // Listen for the OAuth callback from the main process
                    callbackHandler = async (data: unknown) => {
                        try {
                            // Ensure we only handle the callback once.
                            if (typeof unsubscribeRef.current === "function") {
                                unsubscribeRef.current();
                            }

                            if (
                                !isGyazoOAuthCallbackPayload(data) ||
                                data.state !== state
                            ) {
                                throw new Error(
                                    "Invalid state parameter. Possible CSRF attack."
                                );
                            }

                            // Exchange code for token
                            const tokenData =
                                await exportUtils.exchangeGyazoCodeForToken(
                                    data.code,
                                    redirectUri
                                );

                            // Store the access token
                            exportUtils.setGyazoAccessToken(
                                tokenData.access_token
                            );

                            // Update status in any open account manager modal
                            const accountManagerModal =
                                exportUtilsRuntime().querySelector<HTMLElement>(
                                    ".gyazo-account-manager-modal"
                                );
                            if (accountManagerModal) {
                                exportUtils.updateGyazoAuthStatus(
                                    accountManagerModal
                                );
                            }

                            resolve(tokenData.access_token);
                        } catch (error) {
                            reject(
                                error instanceof Error
                                    ? error
                                    : new Error(getErrorMessage(error))
                            );
                        } finally {
                            await cleanup();
                        }
                    };

                // Set up the callback listener
                unsubscribeRef.current = onGyazoOAuthCallback((data) => {
                    void callbackHandler(data);
                });

                // Create a modal with OAuth instructions and link
                const modal = exportUtils.createGyazoAuthModal(
                    authUrl,
                    state,
                    resolve,
                    reject,
                    true,
                    // Ensure cancel paths clean up subscriptions and state.
                    cleanup
                );
                exportUtilsRuntime().appendToBody(modal);
            });
        } catch (error) {
            // Stop the server if it was started
            try {
                await stopGyazoServer();
            } catch (stopError) {
                console.error("Failed to stop OAuth server:", stopError);
            }
            throw error;
        }
    },

    /*
     * Clears the stored Gyazo access token
     */
    clearGyazoAccessToken() {
        safeStorageRemoveItem("gyazo_access_token", __deps.getStorage);
    },

    /*
     * Clears all Gyazo configuration and tokens
     */
    clearGyazoConfig() {
        safeStorageRemoveItem("gyazo_client_id", __deps.getStorage);
        safeStorageRemoveItem("gyazo_client_secret", __deps.getStorage);
        safeStorageRemoveItem("gyazo_access_token", __deps.getStorage);
        safeStorageRemoveItem("gyazo_oauth_state", __deps.getStorage);
    },

    /*
     * Copy plain text to clipboard. Prefers the Electron clipboard bridge to
     * avoid Chromium permission prompts/denials.
     *
     * @param {string} text
     *
     * @returns {Promise<boolean>}
     */
    async copyTextToClipboard(text: string) {
        // 1) Electron bridge (preferred)
        try {
            const api = getExportElectronApi();
            if (api && typeof api.writeClipboardText === "function") {
                const ok = Boolean(await api.writeClipboardText(text));
                if (ok) return true;
            }
        } catch {
            /* ignore */
        }

        // 2) Browser clipboard API
        try {
            if (await exportUtilsRuntime().writeClipboardText(text)) {
                return true;
            }
        } catch {
            /* ignore */
        }

        return false;
    },

    /*
     * Copy a PNG data URL to clipboard as an image. Prefers the Electron
     * clipboard bridge.
     *
     * @param {string} pngDataUrl
     *
     * @returns {Promise<boolean>}
     */
    async copyPngDataUrlToClipboard(
        pngDataUrl: string,
        options?: ExportElectronApiOptions
    ) {
        // 1) Electron bridge (preferred)
        try {
            const api = getExportElectronApi(options);
            if (api && typeof api.writeClipboardPngDataUrl === "function") {
                const ok = Boolean(
                    await api.writeClipboardPngDataUrl(pngDataUrl)
                );
                if (ok) return true;
            }
        } catch {
            /* ignore */
        }

        // 2) Browser Clipboard API (image)
        try {
            if (
                await exportUtilsRuntime().writeClipboardPngBlob(
                    dataUrlToBlob(pngDataUrl)
                )
            ) {
                return true;
            }
        } catch {
            /* ignore */
        }

        return false;
    },

    /*
     * Copies chart image to clipboard with theme background
     *
     * @param {ChartJSInstance} chart - Chart.js instance
     */ async copyChartToClipboard(
        chart: ExportableChart,
        options?: ExportElectronApiOptions
    ) {
        try {
            // Validate chart using utility function
            if (!exportUtils.isValidChart(chart)) {
                throw new Error("Invalid chart instance provided");
            }

            const backgroundColor = exportUtils.getExportThemeBackground(),
                // Create canvas with theme background
                canvas = exportUtilsRuntime().createElement("canvas");
            canvas.width = chart.canvas.width;
            canvas.height = chart.canvas.height;
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
                ctx.drawImage(chart.canvas, 0, 0);
            }

            const pngDataUrl = canvas.toDataURL("image/png", 1);
            const ok = await exportUtils.copyPngDataUrlToClipboard(
                pngDataUrl,
                options
            );

            if (ok) {
                __deps.showNotification("Chart copied to clipboard", "success");
            } else {
                __deps.showNotification(
                    "Failed to copy chart to clipboard",
                    "error"
                );
            }
        } catch (error) {
            console.error("Error copying chart to clipboard:", error);
            __deps.showNotification(
                `Failed to copy chart to clipboard: ${getErrorMessage(error)}`,
                "error"
            );
        }
    },

    /*
     * Copies combined charts image to clipboard
     *
     * @param {ChartJSInstance[]} charts - Array of Chart.js instances
     */
    async copyCombinedChartsToClipboard(
        charts: ExportableChart[],
        options?: ExportElectronApiOptions
    ) {
        try {
            if (!charts || charts.length === 0) {
                throw new Error("No charts provided");
            }

            const backgroundColor = exportUtils.getExportThemeBackground(),
                combinedCanvas = exportUtilsRuntime().createElement("canvas"),
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
                    ctx.fillRect(
                        0,
                        0,
                        combinedCanvas.width,
                        combinedCanvas.height
                    );
                }
            }

            // Draw each chart
            for (const [index, chart] of charts.entries()) {
                if (!exportUtils.isValidChart(chart)) {
                    continue;
                }
                const col = index % cols,
                    row = Math.floor(index / cols),
                    tempCanvas = exportUtilsRuntime().createElement("canvas"),
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

                if (tempCtx) {
                    tempCtx.drawImage(
                        chart.canvas,
                        0,
                        0,
                        chartWidth,
                        chartHeight
                    );
                }
                if (ctx) {
                    ctx.drawImage(tempCanvas, x, y);
                }
            }

            const pngDataUrl = combinedCanvas.toDataURL("image/png", 1);
            const ok = await exportUtils.copyPngDataUrlToClipboard(
                pngDataUrl,
                options
            );

            if (ok) {
                __deps.showNotification(
                    "Combined charts copied to clipboard",
                    "success"
                );
            } else {
                __deps.showNotification(
                    "Failed to copy combined charts to clipboard",
                    "error"
                );
            }
        } catch (error) {
            console.error("Error copying combined charts to clipboard:", error);
            __deps.showNotification(
                "Failed to copy combined charts to clipboard",
                "error"
            );
        }
    },

    createCombinedChartsImage(
        charts: ExportableChart[],
        filename = "combined-charts.png"
    ) {
        try {
            if (!charts || charts.length === 0) {
                throw new Error("No charts provided");
            }

            const backgroundColor = exportUtils.getExportThemeBackground(),
                combinedCanvas = exportUtilsRuntime().createElement("canvas"),
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
                    ctx.fillRect(
                        0,
                        0,
                        combinedCanvas.width,
                        combinedCanvas.height
                    );
                }
            }

            // Draw each chart onto the combined canvas
            for (const [index, chart] of charts.entries()) {
                if (!exportUtils.isValidChart(chart)) {
                    continue;
                }
                const col = index % cols,
                    row = Math.floor(index / cols),
                    // Create temporary canvas with theme background
                    tempCanvas = exportUtilsRuntime().createElement("canvas"),
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
                if (tempCtx) {
                    tempCtx.drawImage(
                        chart.canvas,
                        0,
                        0,
                        chartWidth,
                        chartHeight
                    );
                }

                // Draw temp canvas onto combined canvas
                if (ctx) {
                    ctx.drawImage(tempCanvas, x, y);
                }
            }

            // Download the combined image
            const link = exportUtilsRuntime().createElement("a");
            link.download = filename;
            link.href = combinedCanvas.toDataURL("image/png");
            exportUtilsRuntime().appendToBody(link);
            link.click();
            link.remove();

            __deps.showNotification("Combined charts exported", "success");
        } catch (error) {
            console.error("Error creating combined charts image:", error);
            __deps.showNotification("Failed to create combined image", "error");
        }
    },

    /*
     * Creates the Gyazo OAuth authentication modal
     *
     * @param {string} authUrl - OAuth authorization URL
     * @param {string} _state - CSRF protection state (unused)
     * @param {Function} resolve - Promise resolve function
     * @param {Function} reject - Promise reject function
     * @param {boolean} useServer - Whether to use server
     * @param {undefined | (() => Promise<void>)} [onCancel] - Optional cleanup
     *   hook invoked before rejecting
     * @param {ExportElectronApiOptions} [options] - Optional Electron API scope
     *
     * @returns {HTMLElement} Modal element
     */
    createGyazoAuthModal(
        authUrl: string,
        _state: string,
        resolve: OAuthModalResolve,
        reject: OAuthModalReject,
        useServer: boolean,
        onCancel?: () => Promise<void> | void,
        options?: ExportElectronApiOptions
    ) {
        const useServerFlag = useServer;
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

        const title = document.createElement("h3");
        title.style.cssText =
            "margin: 0 0 16px 0; color: var(--color-modal-fg); text-align: center;";
        title.textContent = "🔐 Gyazo Authentication";
        modal.append(title);

        const instructions = document.createElement("div");
        instructions.style.cssText =
            "margin-bottom: 20px; color: var(--color-fg); line-height: 1.5;";
        const instructionsIntro = document.createElement("p");
        instructionsIntro.textContent =
            "To upload charts to Gyazo, you need to authenticate with your Gyazo account.";
        instructions.append(instructionsIntro);

        if (useServerFlag) {
            const automaticMode = document.createElement("div"),
                automaticModeLabel = document.createElement("strong");
            automaticMode.style.cssText =
                "margin: 16px 0; padding: 12px; background: var(--color-glass); border-radius: 8px;";
            automaticModeLabel.textContent = "Automatic Mode:";
            automaticMode.append(
                automaticModeLabel,
                " Click the button below to open Gyazo authentication. After you log in and authorize the app, this window will close automatically."
            );
            instructions.append(automaticMode);
        } else {
            const steps = document.createElement("ol");
            steps.style.cssText = "margin: 16px 0; padding-left: 20px;";
            for (const step of [
                'Click "Open Gyazo Login" to open the authentication page in your browser',
                "Log in to your Gyazo account and authorize the application",
                "Copy the authorization code from the redirect page",
                "Paste the code in the input field below",
                'Click "Complete Authentication"',
            ]) {
                const item = document.createElement("li");
                item.textContent = step;
                steps.append(item);
            }
            instructions.append(steps);
        }
        modal.append(instructions);

        const authLinkContainer = document.createElement("div"),
            authLink = exportUtilsRuntime().createElement("a");
        authLinkContainer.style.cssText = "margin-bottom: 16px;";
        authLink.dataset["externalLink"] = "true";
        authLink.href = String(authUrl);
        authLink.id = "gyazo-open-auth";
        authLink.role = "link";
        authLink.tabIndex = 0;
        authLink.style.cssText = `
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
        `;
        authLink.textContent = "🌐 Open Gyazo Login in Browser";
        authLinkContainer.append(authLink);
        modal.append(authLinkContainer);

        let codeInput: HTMLInputElement | null = null;
        let completeAuthBtn: HTMLButtonElement | null = null;

        if (!useServerFlag) {
            const codeInputSection = document.createElement("div"),
                codeInputLabel = document.createElement("label");
            codeInputSection.style.cssText = "margin-bottom: 16px;";
            codeInputLabel.style.cssText =
                "display: block; margin-bottom: 8px; color: var(--color-fg); font-weight: 600;";
            codeInputLabel.textContent = "Authorization Code:";
            codeInput = document.createElement("input");
            codeInput.id = "gyazo-auth-code";
            codeInput.placeholder = "Paste the authorization code here...";
            codeInput.type = "text";
            codeInput.style.cssText = `
                width: 100%;
                padding: 10px 12px;
                border-radius: 8px;
                border: 1px solid var(--color-border);
                background: var(--color-glass);
                color: var(--color-fg);
                font-size: 14px;
                box-sizing: border-box;
            `;
            codeInputSection.append(codeInputLabel, codeInput);
            modal.append(codeInputSection);
        }

        const actionButtons = document.createElement("div"),
            cancelBtn = document.createElement("button");
        actionButtons.style.cssText = "display: flex; gap: 8px;";
        cancelBtn.id = "gyazo-cancel-auth";
        cancelBtn.style.cssText = `
            flex: 1;
            padding: 12px;
            background: var(--color-border-light);
            border: 1px solid var(--color-border);
            border-radius: 8px;
            color: var(--color-fg-alt);
            font-size: 14px;
            cursor: pointer;
            transition: var(--transition-smooth);
        `;
        cancelBtn.textContent = "❌ Cancel";

        if (!useServerFlag) {
            completeAuthBtn = document.createElement("button");
            completeAuthBtn.id = "gyazo-complete-auth";
            completeAuthBtn.style.cssText = `
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
            `;
            completeAuthBtn.textContent = "✅ Complete Authentication";
            actionButtons.append(completeAuthBtn);
        }

        actionButtons.append(cancelBtn);
        modal.append(actionButtons);
        const listenerController = exportUtilsRuntime().createAbortController();
        const listenerOptions = { signal: listenerController.signal };
        let cancelled = false;
        let cleanupModalAccessibility = () => {};

        // The external link will be handled by main-ui.js external link handler
        // No need for a click handler on the link itself

        if (completeAuthBtn && codeInput) {
            const handleCompleteAuth = async () => {
                const code = codeInput.value.trim();
                if (!code) {
                    showNotification(
                        "Please enter the authorization code",
                        "error"
                    );
                    return;
                }

                try {
                    showNotification(
                        "Exchanging code for access token...",
                        "info"
                    );
                    const tokenData =
                        await exportUtils.exchangeGyazoCodeForToken(
                            code,
                            exportUtils.getGyazoConfig().redirectUri
                        );
                    exportUtils.setGyazoAccessToken(tokenData.access_token);

                    listenerController.abort();
                    cleanupModalAccessibility();
                    overlay.remove();
                    showNotification(
                        "Gyazo authentication successful!",
                        "success"
                    );
                    resolve(tokenData.access_token);
                } catch (error) {
                    console.error(
                        "Error completing Gyazo authentication:",
                        error
                    );
                    showNotification(
                        `Authentication failed: ${getErrorMessage(error)}`,
                        "error"
                    );
                }
            };

            // Manual mode - handle authentication button
            completeAuthBtn.addEventListener(
                "click",
                () => {
                    void handleCompleteAuth();
                },
                listenerOptions
            );
        }

        const cancelAuthentication = async () => {
            if (cancelled) {
                return;
            }
            cancelled = true;
            listenerController.abort();
            cleanupModalAccessibility();

            if (typeof onCancel === "function") {
                try {
                    await onCancel();
                } catch {
                    /* ignore */
                }
            } else if (useServerFlag) {
                try {
                    await stopGyazoServerIfAvailable(options);
                } catch (error) {
                    console.error("Failed to stop OAuth server:", error);
                }
                safeStorageRemoveItem("gyazo_oauth_state", __deps.getStorage);
            }

            overlay.remove();
            reject(new Error("User cancelled authentication"));
        };

        if (cancelBtn) {
            cancelBtn.addEventListener(
                "click",
                () => {
                    void cancelAuthentication();
                },
                listenerOptions
            );
        }
        cleanupModalAccessibility = setupExportModalAccessibility({
            closeOverlay: () => {
                void cancelAuthentication();
            },
            initialFocusElement: codeInput ?? authLink,
            modal,
            overlay,
            signal: listenerController.signal,
            title,
        });

        overlay.append(modal);
        return overlay;
    },

    /*
     * @param {ChartJSInstance} chart - Chart.js instance
     * @param {string} filename - Download filename
     */
    downloadChartAsPNG(chart: ExportableChart, filename = "chart.png") {
        try {
            if (!exportUtils.isValidChart(chart)) {
                throw new Error("Invalid chart instance provided");
            }
            const backgroundColor = exportUtils.getExportThemeBackground(),
                link = exportUtilsRuntime().createElement("a");
            link.download = filename;
            link.href = chart.toBase64Image("image/png", 1, backgroundColor);
            exportUtilsRuntime().appendToBody(link);
            link.click();
            link.remove();
            __deps.showNotification(`Chart exported as ${filename}`, "success");
        } catch (error) {
            console.error("Error exporting chart as PNG:", error);
            __deps.showNotification("Failed to export chart as PNG", "error");
        }
    },

    /*
     * Exchanges authorization code for access token
     *
     * @param {string} code - Authorization code
     * @param {string} redirectUri - Redirect URI used in OAuth flow
     *
     * @returns {Promise<GyazoTokenResponse>} Token data with access_token
     */
    async exchangeGyazoCodeForToken(
        code: string,
        redirectUri: string
    ): Promise<GyazoTokenResponse> {
        if (typeof code !== "string" || code.trim().length === 0) {
            throw new TypeError("Invalid authorization code");
        }

        const safeRedirectUri = validateGyazoRedirectUri(redirectUri);
        const config = exportUtils.getGyazoConfig();
        if (!config.clientId || !config.clientSecret) {
            throw new Error("Gyazo credentials not configured");
        }

        const tokenUrl = validateGyazoEndpointUrl(
            config.tokenUrl,
            new Set(["gyazo.com"])
        );
        const tokenParams = new URLSearchParams({
            client_id: config.clientId,
            client_secret: config.clientSecret,
            code: code.trim(),
            grant_type: "authorization_code",
            redirect_uri: safeRedirectUri,
        });

        try {
            const response = await fetchWithTimeout(tokenUrl, 15_000, {
                body: tokenParams.toString(),
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                method: "POST",
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(
                    `Token exchange failed: ${response.status} - ${truncateErrorText(errorText)}`
                );
            }

            const parsed = validateGyazoTokenResponse(await response.json());
            if (parsed.success) {
                return parsed.data;
            }
            throw new Error("No access token returned from Gyazo");
        } catch (error) {
            if (isAbortError(error)) {
                throw new Error("Token exchange timed out", { cause: error });
            }
            console.error("Error exchanging code for token:", error);
            throw error;
        }
    },

    /*
     * Exports all charts and data as a ZIP file
     *
     * @param {ChartJSInstance[]} charts - Array of Chart.js instances
     */
    async exportAllAsZip(charts: ExportableChart[]) {
        try {
            if (!charts || charts.length === 0) {
                throw new Error("No charts provided");
            }

            const backgroundColor = exportUtils.getExportThemeBackground(),
                zip = new (getExportZipConstructor())();

            for (const [i, chart] of charts.entries()) {
                if (!exportUtils.isValidChart(chart)) {
                    continue;
                }
                addSingleChartToZip(zip, chart, i, backgroundColor);
            }

            addCombinedChartsImageToZip(zip, charts, backgroundColor);

            // Add combined CSV data
            this.addCombinedCSVToZip(zip, charts);

            // Add combined JSON data
            const allChartsData = {
                charts: charts.map((chart: ExportableChart, index: number) => {
                    const dataset = getFirstChartDataset(chart);
                    return {
                        data: dataset?.data || [],
                        field: dataset?.label || `chart-${index}`,
                        totalPoints: dataset?.data ? dataset.data.length : 0,
                        type: chart.config?.type,
                    };
                }),
                exportedAt: isoNow(),
                totalCharts: charts.length,
            };
            zip.file(
                "combined-data.json",
                JSON.stringify(allChartsData, null, 2)
            );

            // Generate and download ZIP
            const exportDate = isoNow().split("T")[0] ?? "unknown-date",
                content = await zip.generateAsync({ type: "blob" }),
                link = exportUtilsRuntime().createElement("a");
            link.href = URL.createObjectURL(content);
            link.download = `fitfile-charts-${exportDate}.zip`;
            exportUtilsRuntime().appendToBody(link);
            link.click();
            link.remove();

            showNotification(
                `ZIP file with ${charts.length} charts exported`,
                "success"
            );
        } catch (error) {
            console.error("Error creating ZIP export:", error);
            showNotification("Failed to create ZIP export", "error");
        }
    },

    /*
     * Exports chart data as CSV
     *
     * @param {ChartDataPoint[]} chartData - Chart data array
     * @param {string} fieldName - Field name for the data
     * @param {string} filename - Download filename
     */
    exportChartDataAsCSV(
        chartData: ChartDataPoint[],
        fieldName: string,
        filename = "chart-data.csv"
    ) {
        try {
            const headers = ["timestamp", fieldName],
                csvContent = [
                    headers.join(","),
                    ...chartData.map(
                        (point: ChartDataPoint) =>
                            `${stringifyChartValue(point.x)},${stringifyChartValue(point.y)}`
                    ),
                ].join("\n"),
                blob = new Blob([csvContent], {
                    type: "text/csv;charset=utf-8;",
                }),
                link = exportUtilsRuntime().createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            exportUtilsRuntime().appendToBody(link);
            link.click();
            link.remove();
            showNotification(`Data exported as ${filename}`, "success");
        } catch (error) {
            console.error("Error exporting chart data as CSV:", error);
            showNotification("Failed to export chart data", "error");
        }
    },

    /*
     * Exports chart data as JSON
     *
     * @param {ChartDataPoint[]} chartData - Chart data array
     * @param {string} fieldName - Field name for the data
     * @param {string} filename - Download filename
     */
    exportChartDataAsJSON(
        chartData: ChartDataPoint[],
        fieldName: string,
        filename = "chart-data.json"
    ) {
        try {
            const jsonData = {
                    data: chartData,
                    exportedAt: isoNow(),
                    field: fieldName,
                    totalPoints: chartData.length,
                },
                blob = new Blob([JSON.stringify(jsonData, null, 2)], {
                    type: "application/json;charset=utf-8;",
                }),
                link = exportUtilsRuntime().createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            exportUtilsRuntime().appendToBody(link);
            link.click();
            link.remove();
            showNotification(`Data exported as ${filename}`, "success");
        } catch (error) {
            console.error("Error exporting chart data as JSON:", error);
            showNotification("Failed to export chart data", "error");
        }
    },

    /*
     * Exports combined chart data as CSV
     *
     * @param {ChartJSInstance[]} charts - Array of Chart.js instances
     * @param {string} filename - Download filename
     */
    exportCombinedChartsDataAsCSV(
        charts: ExportableChart[],
        filename = "combined-charts-data.csv"
    ) {
        try {
            if (!charts || charts.length === 0) {
                throw new Error("No charts provided");
            }

            // Get all unique timestamps
            const allTimestamps = new Set<unknown>();
            for (const chart of charts) {
                const dataset = getFirstChartDataset(chart);
                if (dataset?.data) {
                    for (const point of dataset.data)
                        allTimestamps.add(point.x);
                }
            }

            const // Create headers
                headers = ["timestamp"],
                timestamps = getSortedChartValues(allTimestamps);
            for (const chart of charts) {
                const dataset = getFirstChartDataset(chart),
                    fieldName =
                        dataset?.label || `chart-${charts.indexOf(chart)}`;
                headers.push(fieldName);
            }

            // Create data rows
            const rows = [headers.join(",")];
            for (const timestamp of timestamps) {
                const row = [String(timestamp)];
                for (const chart of charts) {
                    const dataset = getFirstChartDataset(chart),
                        point = dataset?.data?.find((p) => p.x === timestamp);
                    row.push(stringifyChartValue(point?.y));
                }
                rows.push(row.join(","));
            }

            const csvContent = rows.join("\n"),
                blob = new Blob([csvContent], {
                    type: "text/csv;charset=utf-8;",
                }),
                link = exportUtilsRuntime().createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            exportUtilsRuntime().appendToBody(link);
            link.click();
            link.remove();

            showNotification(
                `Combined data exported as ${filename}`,
                "success"
            );
        } catch (error) {
            console.error("Error exporting combined chart data as CSV:", error);
            showNotification("Failed to export combined chart data", "error");
        }
    },

    /*
     * Gets the theme background color for exports
     *
     * @returns {string} Background color based on export theme setting
     */
    getExportThemeBackground() {
        const exportTheme = getChartSetting("exportTheme");

        const debugEnabled =
            exportUtilsRuntime().getProcessEnvironmentValue(
                "FFV_DEBUG_EXPORT_THEME"
            ) === "1";
        const debugLog = (...args: unknown[]) => {
            if (!debugEnabled) return;
            try {
                console.log(...args);
            } catch {
                /* ignore */
            }
        };

        debugLog("[exportUtils] exportTheme from storage:", exportTheme);

        // If no export theme is set, fall back to the current app theme
        let theme;
        if (exportTheme) {
            // Handle "auto" theme by detecting current theme
            if (exportTheme === "auto") {
                const currentTheme = __deps.detectCurrentTheme();
                debugLog("[exportUtils] Auto theme detected as:", currentTheme);
                theme = currentTheme || "light";
            } else {
                theme = exportTheme;
                debugLog("[exportUtils] Using explicit export theme:", theme);
            }
        } else {
            // Use current app theme as fallback, or default to "light"
            const currentTheme = __deps.detectCurrentTheme();
            debugLog(
                "[exportUtils] detectCurrentTheme() returned:",
                currentTheme
            );
            theme = currentTheme || "light";
            debugLog("[exportUtils] Final fallback theme:", theme);
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

        debugLog("[exportUtils] Final background color:", backgroundColor);
        return backgroundColor;
    },

    /*
     * Gets the stored Gyazo access token
     *
     * @returns {string | null} Access token or null if not found
     */
    getGyazoAccessToken(): string | null {
        return safeStorageGetItem("gyazo_access_token", __deps.getStorage);
    },

    /* C8 ignore start */
    /*
     * Gets Gyazo configuration from user settings or defaults Gyazo
     * OAuth/upload flows are excluded from coverage due to external auth,
     * clipboard, and network side effects that are brittle in jsdom.
     *
     * @returns {GyazoConfig} Gyazo configuration object
     */
    getGyazoConfig(): GyazoConfig {
        // Provide default demo credentials for easier onboarding
        // Obfuscated default credentials using multiple encoding layers
        const GyazoAppData1 = [
                0x6c,
                0x63,
                0x6f,
                0x7a,
                0x6f,
                0x61,
                0x6e,
                0x44,
                0x4a,
                0x57,
                0x76,
                0x6f,
                0x75,
                0x39,
                0x70,
                0x6a,
                0x6b,
                0x42,
                0x6d,
                0x50,
                0x4a,
                0x6c,
                0x61,
                0x30,
                0x62,
                0x4e,
                0x67,
                0x72,
                0x54,
                0x37,
                0x59,
                0x62,
                0x73,
                0x37,
                0x69,
                0x79,
                0x56,
                0x77,
                0x4f,
                0x6c,
                0x59,
                0x45,
                0x51,
            ],
            defaultClientId = decodeCharacterCodes(GyazoAppData1),
            GyazoAppData2 = [
                0x77,
                0x63,
                0x68,
                0x52,
                0x46,
                0x7a,
                0x46,
                0x5a,
                0x75,
                0x4f,
                0x71,
                0x32,
                0x33,
                0x4f,
                0x69,
                0x70,
                0x48,
                0x6b,
                0x63,
                0x45,
                0x49,
                0x76,
                0x51,
                0x61,
                0x31,
                0x4b,
                0x59,
                0x30,
                0x6c,
                0x6a,
                0x6f,
                0x50,
                0x66,
                0x32,
                0x71,
                0x30,
                0x4d,
                0x55,
                0x62,
                0x45,
                0x6f,
                0x53,
                0x30,
            ],
            defaultClientSecret = reverseText(
                decodeCharacterCodes(GyazoAppData2.toReversed())
            );

        const candidate = {
            authUrl: "https://gyazo.com/oauth/authorize",
            clientId:
                safeStorageGetItem("gyazo_client_id", __deps.getStorage) ||
                defaultClientId,
            clientSecret:
                safeStorageGetItem("gyazo_client_secret", __deps.getStorage) ||
                defaultClientSecret,
            redirectUri: "http://localhost:3000/gyazo/callback",
            tokenUrl: "https://gyazo.com/oauth/token",
            uploadUrl: "https://upload.gyazo.com/api/upload",
        };

        const parsed = validateGyazoConfig(candidate);
        if (parsed.success) {
            return parsed.data;
        }

        // If storage contains an unexpected value, fall back to safe defaults.
        // This should never throw because the defaults are static.
        try {
            console.warn(
                "[Gyazo] Invalid Gyazo configuration detected; falling back to defaults",
                parsed.error
            );
        } catch {
            /* ignore */
        }

        return {
            authUrl: "https://gyazo.com/oauth/authorize",
            clientId: defaultClientId,
            clientSecret: defaultClientSecret,
            redirectUri: "http://localhost:3000/gyazo/callback",
            tokenUrl: "https://gyazo.com/oauth/token",
            uploadUrl: "https://upload.gyazo.com/api/upload",
        };
    },

    /*
     * Checks if user is authenticated with Gyazo
     *
     * @returns {boolean} True if authenticated, false otherwise
     */
    isGyazoAuthenticated(): boolean {
        const token = exportUtils.getGyazoAccessToken();
        console.log(
            "[Gyazo] Checking authentication status. Token exists:",
            Boolean(token)
        );
        return Boolean(token);
    },

    /*
     * Validates a Chart.js instance
     *
     * @param {ChartJSInstance | null | undefined} chart - Chart.js instance to validate
     *
     * @returns {boolean} True if chart is valid, false otherwise
     */
    isValidChart(
        chart: ExportableChart | null | undefined
    ): chart is ValidChart {
        if (!chart) {
            console.warn("[exportUtils] Chart is null or undefined");
            return false;
        }

        const { canvas } = chart;
        if (!canvas) {
            console.warn("[exportUtils] Chart canvas is not available");
            return false;
        }

        if (!canvas.width || !canvas.height) {
            console.warn("[exportUtils] Chart canvas has invalid dimensions:", {
                height: canvas.height,
                width: canvas.width,
            });
            return false;
        }

        return true;
    },

    printChart(chart: ExportableChart) {
        try {
            if (!exportUtils.isValidChart(chart)) {
                throw new Error("Invalid chart instance provided");
            }
            const backgroundColor = exportUtils.getExportThemeBackground(),
                // Create canvas with theme background
                canvas = exportUtilsRuntime().createElement("canvas"),
                printWindow = exportUtilsRuntime().openPrintWindow(
                    "",
                    "_blank",
                    "noopener,noreferrer"
                );
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

            // Print window HTML should never include unescaped/unvalidated dynamic strings.
            const bgSafe = sanitizeCssColorToken(backgroundColor, "#ffffff");

            if (printWindow) {
                const printDocument = preparePrintDocument(
                    printWindow,
                    "Chart Print",
                    `
body {
    align-items: center;
    background: ${bgSafe === "transparent" ? "#ffffff" : bgSafe};
    display: flex;
    justify-content: center;
    margin: 0;
    min-height: 100vh;
}

img {
    max-height: 100%;
    max-width: 100%;
}
`
                );
                const imageElement = printDocument.createElement("img");
                imageElement.alt = "Chart";
                imageElement.id = "ffv-print-img";
                imageElement.src = imgData;
                printDocument.body.append(imageElement);
                printWindow.document.close();
                printWhenImageReady(printWindow, imageElement);
            }

            showNotification("Chart sent to printer", "success");
        } catch (error) {
            console.error("Error printing chart:", error);
            showNotification("Failed to print chart", "error");
        }
    },

    /*
     * Prints multiple charts in a combined format
     *
     * @param {ChartJSInstance[]} charts - Array of Chart.js instances
     */
    printCombinedCharts(charts: ExportableChart[]) {
        try {
            if (!charts || charts.length === 0) {
                showNotification("No charts available to print", "warning");
                return;
            }

            const backgroundColor = exportUtils.getExportThemeBackground(),
                printWindow = exportUtilsRuntime().openPrintWindow(
                    "",
                    "_blank",
                    "noopener,noreferrer"
                );
            const bgSafe = sanitizeCssColorToken(backgroundColor, "#ffffff");
            const bodyBg = bgSafe === "transparent" ? "#ffffff" : bgSafe;
            const bodyText =
                bgSafe.toLowerCase() === "#1a1a1a" ? "#ffffff" : "#000000";

            const printDocument = printWindow
                ? preparePrintDocument(
                      printWindow,
                      "Charts Print",
                      `
body {
    background: ${bodyBg};
    color: ${bodyText};
    font-family: Arial, sans-serif;
    margin: 20px;
}

.chart {
    margin-bottom: 30px;
    page-break-inside: avoid;
    text-align: center;
}

.chart img {
    height: auto;
    max-width: 100%;
}

.chart h3 {
    color: inherit;
    margin: 0 0 10px;
}

@media print {
    .chart {
        page-break-after: always;
    }

    .chart:last-child {
        page-break-after: avoid;
    }
}
`
                  )
                : null;

            if (printDocument) {
                const titleElement = printDocument.createElement("h1");
                titleElement.textContent = "FIT File Charts";
                printDocument.body.append(titleElement);
            }

            for (const [index, chart] of charts.entries()) {
                if (!exportUtils.isValidChart(chart)) {
                    continue;
                }
                const // Create canvas with theme background
                    canvas = exportUtilsRuntime().createElement("canvas"),
                    dataset = getFirstChartDataset(chart),
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

                if (printDocument) {
                    const chartElement = printDocument.createElement("div"),
                        headingElement = printDocument.createElement("h3"),
                        imageElement = printDocument.createElement("img"),
                        fieldLabel = String(fieldName);

                    chartElement.className = "chart";
                    headingElement.textContent = fieldLabel;
                    imageElement.alt = `${fieldLabel} Chart`;
                    imageElement.src = imgData;
                    chartElement.append(headingElement, imageElement);
                    printDocument.body.append(chartElement);
                }
            }

            if (printWindow) {
                printWindow.document.close();
                printWindow.setTimeout(
                    () => printAndCloseWindow(printWindow),
                    0
                );
            }

            showNotification("Charts sent to printer", "success");
        } catch (error) {
            console.error("Error printing combined charts:", error);
            showNotification("Failed to print charts", "error");
        }
    },

    /*
     * Stores the Gyazo access token
     *
     * @param {string} token - Access token to store
     */
    setGyazoAccessToken(token: string) {
        safeStorageSetItem("gyazo_access_token", token, __deps.getStorage);
    },

    /*
     * Saves Gyazo configuration to user settings
     *
     * @param {string} clientId - Gyazo client ID
     * @param {string} clientSecret - Gyazo client secret
     */
    setGyazoConfig(clientId: string, clientSecret: string) {
        safeStorageSetItem("gyazo_client_id", clientId, __deps.getStorage);
        safeStorageSetItem(
            "gyazo_client_secret",
            clientSecret,
            __deps.getStorage
        );
    },

    /*
     * Shares charts as URL with image upload to Imgur
     */
    shareChartsAsURL() {
        // eslint-disable-next-line unicorn/consistent-function-scoping -- Keep modal callback flow colocated with the modal wiring.
        async function shareSingleChartAsUrl(chart: ExportableChart) {
            try {
                if (!exportUtils.isValidChart(chart)) {
                    showNotification("Invalid chart provided", "error");
                    return;
                }

                showNotification("Uploading chart to Imgur...", "info");

                const chartCanvas = chart.canvas;
                if (!chartCanvas) {
                    showNotification("Invalid chart provided", "error");
                    return;
                }

                const backgroundColor = exportUtils.getExportThemeBackground(),
                    canvas = exportUtilsRuntime().createElement("canvas");
                canvas.width = chartCanvas.width;
                canvas.height = chartCanvas.height;
                const ctx = canvas.getContext("2d");

                fillCanvasBackground(
                    ctx,
                    canvas.width,
                    canvas.height,
                    backgroundColor
                );
                ctx?.drawImage(chartCanvas, 0, 0);

                const base64Image = canvas.toDataURL("image/png", 1);

                try {
                    const shareableUrl =
                            await exportUtils.uploadToImgur(base64Image),
                        copied =
                            await exportUtils.copyTextToClipboard(shareableUrl);
                    showNotification(
                        copied
                            ? "Chart uploaded to Imgur! URL copied to clipboard"
                            : "Chart uploaded to Imgur! (Clipboard copy blocked)",
                        copied ? "success" : "warning"
                    );
                } catch (imgurError) {
                    if (
                        getErrorMessage(imgurError).includes(
                            "Imgur client ID not configured"
                        )
                    ) {
                        const copied =
                            await exportUtils.copyTextToClipboard(base64Image);
                        showNotification(
                            copied
                                ? "Chart image copied to clipboard as data URL (Imgur not configured)."
                                : "Imgur not configured (clipboard copy blocked).",
                            copied ? "info" : "warning"
                        );
                        return;
                    }

                    throw imgurError;
                }
            } catch (error) {
                console.error("Error sharing single chart as URL:", error);
                showNotification(
                    "Failed to share chart. Please try again.",
                    "error"
                );
            }
        }

        // eslint-disable-next-line unicorn/consistent-function-scoping -- Keep modal callback flow colocated with the modal wiring.
        async function shareCombinedChartsAsUrl(charts: ExportableChart[]) {
            try {
                if (!charts || charts.length === 0) {
                    showNotification("No charts available to share", "warning");
                    return;
                }

                showNotification(
                    "Uploading combined charts to Imgur...",
                    "info"
                );

                const backgroundColor = exportUtils.getExportThemeBackground(),
                    chartHeight = 400,
                    chartWidth = 800,
                    cols = Math.ceil(Math.sqrt(charts.length)),
                    combinedCanvas = exportUtilsRuntime().createElement(
                        "canvas"
                    ),
                    ctx = combinedCanvas.getContext("2d"),
                    padding = 20,
                    rows = Math.ceil(charts.length / cols);

                combinedCanvas.width = cols * chartWidth + (cols - 1) * padding;
                combinedCanvas.height =
                    rows * chartHeight + (rows - 1) * padding;
                fillCanvasBackground(
                    ctx,
                    combinedCanvas.width,
                    combinedCanvas.height,
                    backgroundColor
                );

                for (const [index, chart] of charts.entries()) {
                    const chartCanvas = chart.canvas;
                    if (!chartCanvas) {
                        continue;
                    }

                    const col = index % cols,
                        row = Math.floor(index / cols),
                        tempCanvas = exportUtilsRuntime().createElement(
                            "canvas"
                        ),
                        x = col * (chartWidth + padding),
                        y = row * (chartHeight + padding);
                    tempCanvas.width = chartWidth;
                    tempCanvas.height = chartHeight;

                    const tempCtx = tempCanvas.getContext("2d");
                    fillCanvasBackground(
                        tempCtx,
                        chartWidth,
                        chartHeight,
                        backgroundColor
                    );
                    tempCtx?.drawImage(
                        chartCanvas,
                        0,
                        0,
                        chartWidth,
                        chartHeight
                    );
                    ctx?.drawImage(tempCanvas, x, y);
                }

                const base64Image = combinedCanvas.toDataURL("image/png", 1);

                try {
                    const shareableUrl =
                            await exportUtils.uploadToImgur(base64Image),
                        copied =
                            await exportUtils.copyTextToClipboard(shareableUrl);
                    showNotification(
                        copied
                            ? "Combined charts uploaded to Imgur! URL copied to clipboard"
                            : "Combined charts uploaded to Imgur! (Clipboard copy blocked)",
                        copied ? "success" : "warning"
                    );
                } catch (imgurError) {
                    if (
                        getErrorMessage(imgurError).includes(
                            "Imgur client ID not configured"
                        )
                    ) {
                        const copied =
                            await exportUtils.copyTextToClipboard(base64Image);
                        showNotification(
                            copied
                                ? "Combined charts image copied to clipboard as data URL (Imgur not configured)."
                                : "Imgur not configured (clipboard copy blocked).",
                            copied ? "info" : "warning"
                        );
                        return;
                    }

                    throw imgurError;
                }
            } catch (error) {
                console.error("Error sharing combined charts as URL:", error);
                showNotification(
                    "Failed to share charts. Please try again.",
                    "error"
                );
            }
        }

        showChartSelectionModal(
            "share URL",
            (chart: ExportableChart) => shareSingleChartAsUrl(chart),
            (charts: ExportableChart[]) => shareCombinedChartsAsUrl(charts)
        );
    },
    /*
     * Shares charts as URL with image upload to Gyazo
     */
    shareChartsToGyazo() {
        // eslint-disable-next-line unicorn/consistent-function-scoping -- Keep modal callback flow colocated with the modal wiring.
        async function shareSingleChartToGyazo(chart: ExportableChart) {
            try {
                if (!exportUtils.isValidChart(chart)) {
                    showNotification("Invalid chart provided", "error");
                    return;
                }

                showNotification("Uploading chart to Gyazo...", "info");

                const chartCanvas = chart.canvas;
                if (!chartCanvas) {
                    showNotification("Invalid chart provided", "error");
                    return;
                }

                const backgroundColor = exportUtils.getExportThemeBackground(),
                    canvas = exportUtilsRuntime().createElement("canvas");
                canvas.width = chartCanvas.width;
                canvas.height = chartCanvas.height;
                const ctx = canvas.getContext("2d");

                fillCanvasBackground(
                    ctx,
                    canvas.width,
                    canvas.height,
                    backgroundColor
                );
                ctx?.drawImage(chartCanvas, 0, 0);

                const base64Image = canvas.toDataURL("image/png", 1),
                    gyazoUrl = await exportUtils.uploadToGyazo(base64Image),
                    copied = await exportUtils.copyTextToClipboard(gyazoUrl);
                showNotification(
                    copied
                        ? "Chart uploaded to Gyazo! URL copied to clipboard"
                        : "Chart uploaded to Gyazo!",
                    copied ? "success" : "warning"
                );
            } catch (error) {
                console.error("Error sharing single chart to Gyazo:", error);
                if (
                    getErrorMessage(error).includes(
                        "Gyazo authentication required"
                    )
                ) {
                    showNotification(
                        "Gyazo authentication is required. Open Gyazo Settings, connect your account, and try again.",
                        "error"
                    );
                } else {
                    showNotification(
                        "Failed to share chart to Gyazo. Please try again.",
                        "error"
                    );
                }
            }
        }

        // eslint-disable-next-line unicorn/consistent-function-scoping -- Keep modal callback flow colocated with the modal wiring.
        async function shareCombinedChartsToGyazo(charts: ExportableChart[]) {
            try {
                if (!charts || charts.length === 0) {
                    showNotification("No charts available to share", "warning");
                    return;
                }

                showNotification(
                    "Uploading combined charts to Gyazo...",
                    "info"
                );

                const backgroundColor = exportUtils.getExportThemeBackground(),
                    chartHeight = 400,
                    chartWidth = 1000,
                    cols = Math.ceil(Math.sqrt(charts.length)),
                    combinedCanvas = exportUtilsRuntime().createElement(
                        "canvas"
                    ),
                    ctx = combinedCanvas.getContext("2d"),
                    padding = 20,
                    rows = Math.ceil(charts.length / cols);

                combinedCanvas.width = cols * chartWidth + (cols - 1) * padding;
                combinedCanvas.height =
                    rows * chartHeight + (rows - 1) * padding;
                fillCanvasBackground(
                    ctx,
                    combinedCanvas.width,
                    combinedCanvas.height,
                    backgroundColor
                );

                for (const [index, chart] of charts.entries()) {
                    const chartCanvas = chart.canvas;
                    if (!chartCanvas) {
                        continue;
                    }

                    const col = index % cols,
                        row = Math.floor(index / cols),
                        tempCanvas = exportUtilsRuntime().createElement(
                            "canvas"
                        ),
                        x = col * (chartWidth + padding),
                        y = row * (chartHeight + padding);
                    tempCanvas.width = chartWidth;
                    tempCanvas.height = chartHeight;

                    const tempCtx = tempCanvas.getContext("2d");
                    fillCanvasBackground(
                        tempCtx,
                        chartWidth,
                        chartHeight,
                        backgroundColor
                    );
                    tempCtx?.drawImage(
                        chartCanvas,
                        0,
                        0,
                        chartWidth,
                        chartHeight
                    );
                    ctx?.drawImage(tempCanvas, x, y);
                }

                const base64Image = combinedCanvas.toDataURL("image/png", 1),
                    gyazoUrl = await exportUtils.uploadToGyazo(base64Image),
                    copied = await exportUtils.copyTextToClipboard(gyazoUrl);
                showNotification(
                    copied
                        ? "Combined charts uploaded to Gyazo! URL copied to clipboard"
                        : "Combined charts uploaded to Gyazo!",
                    copied ? "success" : "warning"
                );
            } catch (error) {
                console.error("Error sharing combined charts to Gyazo:", error);
                if (
                    getErrorMessage(error).includes(
                        "Gyazo authentication required"
                    )
                ) {
                    showNotification(
                        "Gyazo authentication is required. Open Gyazo Settings, connect your account, and try again.",
                        "error"
                    );
                } else {
                    showNotification(
                        "Failed to share charts to Gyazo. Please try again.",
                        "error"
                    );
                }
            }
        }

        showChartSelectionModal(
            "share to Gyazo",
            (chart: ExportableChart) => shareSingleChartToGyazo(chart),
            (charts: ExportableChart[]) => shareCombinedChartsToGyazo(charts)
        );
    },
    /* C8 ignore stop */

    /*
     * Shows Gyazo account management modal with credentials setup
     */
    showGyazoAccountManager() {
        const config = exportUtils.getGyazoConfig(),
            hasCredentials = Boolean(config.clientId && config.clientSecret),
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

        const title = document.createElement("h3");
        title.style.cssText =
            "margin: 0 0 16px 0; color: var(--color-modal-fg); text-align: center;";
        title.textContent = "📸 Gyazo Settings";
        modal.append(title);

        const statusSection = document.createElement("div"),
            authStatusWrap = document.createElement("div"),
            authStatus = document.createElement("span"),
            credsStatusWrap = document.createElement("div"),
            credsStatus = document.createElement("span");
        statusSection.style.cssText =
            "margin-bottom: 20px; text-align: center;";
        authStatusWrap.style.cssText = "margin-bottom: 12px;";
        credsStatusWrap.style.cssText = "margin-bottom: 12px;";
        authStatus.id = "auth-status";
        authStatus.style.cssText = `
            display: inline-block;
            padding: 4px 12px;
            border-radius: 16px;
            font-size: 12px;
            font-weight: 600;
            background: ${isAuthenticated ? "var(--color-success)" : "var(--color-error)"};
            color: white;
        `;
        authStatus.textContent = isAuthenticated
            ? "✅ Connected"
            : "❌ Not Connected";
        credsStatus.id = "creds-status";
        credsStatus.style.cssText = `
            display: inline-block;
            padding: 4px 12px;
            border-radius: 16px;
            font-size: 12px;
            font-weight: 600;
            background: ${hasCredentials ? "var(--color-success)" : "var(--color-warning)"};
            color: white;
        `;
        credsStatus.textContent = hasCredentials
            ? "🔑 Credentials Ready"
            : "🔑 Using Default Credentials";
        authStatusWrap.append(authStatus);
        credsStatusWrap.append(credsStatus);
        statusSection.append(authStatusWrap, credsStatusWrap);
        modal.append(statusSection);

        const gettingStarted = document.createElement("div"),
            gettingStartedTitle = document.createElement("h4"),
            gettingStartedCopy = document.createElement("p"),
            connectStrong = document.createElement("strong");
        gettingStarted.style.cssText =
            "margin-bottom: 20px; padding: 16px; background: var(--color-glass); border-radius: 8px;";
        gettingStartedTitle.style.cssText =
            "margin: 0 0 12px 0; color: var(--color-accent); font-size: 14px;";
        gettingStartedTitle.textContent = "🚀 Getting Started";
        gettingStartedCopy.style.cssText =
            "margin: 0; color: var(--color-fg); font-size: 14px; line-height: 1.5;";
        connectStrong.textContent = '"Connect to Gyazo"';
        gettingStartedCopy.append(
            "Simply click the ",
            connectStrong,
            " button below and log in with your Gyazo account. No additional setup required!"
        );
        gettingStarted.append(gettingStartedTitle, gettingStartedCopy);
        modal.append(gettingStarted);

        const details = document.createElement("details"),
            summary = document.createElement("summary"),
            advancedPanel = document.createElement("div"),
            advancedCopy = document.createElement("p"),
            advancedSteps = document.createElement("ol"),
            appStep = document.createElement("li"),
            appLink = exportUtilsRuntime().createElement("a"),
            redirectStep = document.createElement("li"),
            redirectCode = document.createElement("code"),
            credentialsStep = document.createElement("li");
        details.style.cssText = "margin-bottom: 20px;";
        summary.style.cssText = `
            color: var(--color-fg-alt);
            font-size: 13px;
            cursor: pointer;
            padding: 8px 0;
            border-bottom: 1px solid var(--color-border);
        `;
        summary.textContent = "🔧 Advanced: Use Custom Credentials";
        advancedPanel.style.cssText =
            "margin-top: 16px; padding: 12px; background: var(--color-glass); border-radius: 8px;";
        advancedCopy.style.cssText =
            "margin: 0 0 12px 0; color: var(--color-fg); font-size: 12px; line-height: 1.4;";
        advancedCopy.textContent =
            "For advanced users who want to use their own Gyazo application:";
        advancedSteps.style.cssText =
            "margin: 0 0 16px 0; padding-left: 20px; color: var(--color-fg); font-size: 12px; line-height: 1.4;";
        appLink.dataset["externalLink"] = "true";
        appLink.href = "https://gyazo.com/oauth/applications";
        appLink.style.cssText = "color: var(--color-accent);";
        appLink.textContent = "Gyazo Developer Applications";
        appStep.append("Create an app at ", appLink);
        redirectCode.style.cssText =
            "background: var(--color-glass); padding: 2px 4px; border-radius: 4px;";
        redirectCode.textContent = "http://localhost:3000/gyazo/callback";
        redirectStep.append("Use redirect URI: ", redirectCode);
        credentialsStep.textContent = "Enter your credentials below";
        advancedSteps.append(appStep, redirectStep, credentialsStep);

        const clientIdField = document.createElement("div"),
            clientIdLabel = document.createElement("label"),
            clientIdInput = document.createElement("input"),
            clientSecretField = document.createElement("div"),
            clientSecretLabel = document.createElement("label"),
            clientSecretInput = document.createElement("input"),
            saveCredsBtn = document.createElement("button");
        clientIdField.style.cssText = "margin-bottom: 12px;";
        clientSecretField.style.cssText = "margin-bottom: 12px;";
        clientIdLabel.style.cssText =
            "display: block; margin-bottom: 6px; color: var(--color-fg); font-weight: 600; font-size: 12px;";
        clientSecretLabel.style.cssText = clientIdLabel.style.cssText;
        clientIdLabel.textContent = "Client ID:";
        clientSecretLabel.textContent = "Client Secret:";
        clientIdInput.id = "gyazo-client-id";
        clientIdInput.placeholder = "Enter your Gyazo Client ID";
        clientIdInput.type = "text";
        clientSecretInput.id = "gyazo-client-secret";
        clientSecretInput.placeholder = "Enter your Gyazo Client Secret";
        clientSecretInput.type = "password";
        for (const input of [clientIdInput, clientSecretInput]) {
            input.style.cssText = `
                width: 100%;
                padding: 8px 10px;
                border-radius: 6px;
                border: 1px solid var(--color-border);
                background: var(--color-glass);
                color: var(--color-fg);
                font-size: 12px;
                box-sizing: border-box;
                font-family: monospace;
            `;
        }
        saveCredsBtn.id = "save-credentials";
        saveCredsBtn.style.cssText = `
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
        `;
        saveCredsBtn.textContent = "💾 Save Custom Credentials";
        clientIdField.append(clientIdLabel, clientIdInput);
        clientSecretField.append(clientSecretLabel, clientSecretInput);
        advancedPanel.append(
            advancedCopy,
            advancedSteps,
            clientIdField,
            clientSecretField,
            saveCredsBtn
        );
        details.append(summary, advancedPanel);
        modal.append(details);

        const actionPanel = document.createElement("div"),
            connectBtn = document.createElement("button"),
            disconnectBtn = document.createElement("button"),
            clearDataBtn = document.createElement("button"),
            closeBtn = document.createElement("button");
        actionPanel.style.cssText =
            "display: flex; flex-direction: column; gap: 8px;";
        connectBtn.id = "gyazo-connect";
        disconnectBtn.id = "gyazo-disconnect";
        clearDataBtn.id = "clear-all-data";
        closeBtn.id = "gyazo-close";
        for (const button of [
            connectBtn,
            disconnectBtn,
            clearDataBtn,
            closeBtn,
        ]) {
            button.style.cssText = `
                width: 100%;
                padding: 12px;
                border-radius: 8px;
                font-size: 14px;
                cursor: pointer;
                transition: var(--transition-smooth);
            `;
        }
        connectBtn.style.background = "var(--color-success)";
        connectBtn.style.border = "none";
        connectBtn.style.color = "white";
        connectBtn.style.display = isAuthenticated ? "none" : "block";
        connectBtn.style.fontWeight = "600";
        connectBtn.textContent = "🔗 Connect to Gyazo";
        disconnectBtn.style.background = "var(--color-error)";
        disconnectBtn.style.border = "none";
        disconnectBtn.style.color = "white";
        disconnectBtn.style.display = isAuthenticated ? "block" : "none";
        disconnectBtn.style.fontWeight = "600";
        disconnectBtn.textContent = "🔌 Disconnect Account";
        clearDataBtn.style.background = "var(--color-warning)";
        clearDataBtn.style.border = "none";
        clearDataBtn.style.color = "white";
        clearDataBtn.style.fontWeight = "600";
        clearDataBtn.textContent = "🗑️ Clear All Data";
        closeBtn.style.background = "var(--color-border-light)";
        closeBtn.style.border = "1px solid var(--color-border)";
        closeBtn.style.color = "var(--color-fg-alt)";
        closeBtn.textContent = "Close";
        actionPanel.append(connectBtn, disconnectBtn, clearDataBtn, closeBtn);
        modal.append(actionPanel);
        const listenerController = exportUtilsRuntime().createAbortController();
        const listenerOptions = { signal: listenerController.signal };
        let cleanupModalAccessibility = () => {};
        const closeOverlay = () => {
            listenerController.abort();
            cleanupModalAccessibility();
            overlay.remove();
        };

        // Security: assign potentially-untrusted stored values via DOM properties, not via innerHTML.
        if (clientIdInput) {
            clientIdInput.value = String(config.clientId ?? "");
        }
        if (clientSecretInput) {
            clientSecretInput.value = String(config.clientSecret ?? "");
        }

        // Save credentials
        if (saveCredsBtn) {
            saveCredsBtn.addEventListener(
                "click",
                () => {
                    const clientId = clientIdInput.value.trim(),
                        clientSecret = clientSecretInput.value.trim();

                    if (!clientId || !clientSecret) {
                        showNotification(
                            "Please enter both Client ID and Client Secret",
                            "error"
                        );
                        return;
                    }

                    exportUtils.setGyazoConfig(clientId, clientSecret);
                    showNotification(
                        "Gyazo credentials saved successfully!",
                        "success"
                    );

                    // Update the status in the current modal
                    exportUtils.updateGyazoAuthStatus(modal);
                },
                listenerOptions
            );
        }

        // Connect to Gyazo
        if (connectBtn) {
            const connectToGyazo = async () => {
                try {
                    await exportUtils.authenticateWithGyazo();
                    // Update the status in the current modal
                    exportUtils.updateGyazoAuthStatus(modal);
                    showNotification(
                        "Gyazo account connected successfully!",
                        "success"
                    );
                } catch (error) {
                    showNotification(
                        `Failed to connect Gyazo account: ${getErrorMessage(error)}`,
                        "error"
                    );
                }
            };

            connectBtn.addEventListener(
                "click",
                () => {
                    void connectToGyazo();
                },
                listenerOptions
            );
        }

        // Disconnect from Gyazo
        if (disconnectBtn) {
            disconnectBtn.addEventListener(
                "click",
                () => {
                    exportUtils.clearGyazoAccessToken();
                    // Update the status in the current modal
                    exportUtils.updateGyazoAuthStatus(modal);
                    showNotification("Gyazo account disconnected", "info");
                },
                listenerOptions
            );
        }

        // Clear all data
        if (clearDataBtn) {
            clearDataBtn.addEventListener(
                "click",
                () => {
                    // Using native confirm dialog for critical destructive action is acceptable in this Electron context
                    // and avoids building a full modal UI here.
                    if (
                        confirmDangerousAction(
                            "Are you sure you want to clear all Gyazo data? This will remove your credentials and disconnect your account."
                        )
                    ) {
                        exportUtils.clearGyazoConfig();
                        closeOverlay();
                        showNotification("All Gyazo data cleared", "info");
                    }
                },
                listenerOptions
            );
        }

        // Close modal
        if (closeBtn) {
            closeBtn.addEventListener("click", closeOverlay, listenerOptions);
        }

        cleanupModalAccessibility = setupExportModalAccessibility({
            closeOverlay,
            initialFocusElement: clientIdInput,
            modal,
            overlay,
            signal: listenerController.signal,
            title,
        });

        overlay.append(modal);
        exportUtilsRuntime().appendToBody(overlay);
    },

    /*
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

        const title = document.createElement("h3");
        title.style.cssText =
            "margin: 0 0 16px 0; color: var(--color-modal-fg); text-align: center;";
        title.textContent = "🔧 Gyazo Setup Guide";

        const content = document.createElement("div"),
            intro = document.createElement("p"),
            introStrong = document.createElement("strong"),
            steps = document.createElement("ol"),
            visitStep = document.createElement("li"),
            developerLink = exportUtilsRuntime().createElement("a"),
            createStep = document.createElement("li"),
            createSettings = document.createElement("ul"),
            appNameStep = document.createElement("li"),
            appNameLabel = document.createElement("strong"),
            redirectStep = document.createElement("li"),
            redirectLabel = document.createElement("strong"),
            redirectCode = document.createElement("code"),
            copyStep = document.createElement("li"),
            clientIdLabel = document.createElement("strong"),
            clientSecretLabel = document.createElement("strong"),
            updateStep = document.createElement("li"),
            configExample = document.createElement("pre"),
            restartStep = document.createElement("li"),
            securityNote = document.createElement("div"),
            securityLabel = document.createElement("strong"),
            closeBtn = document.createElement("button");

        content.style.cssText = "color: var(--color-fg); line-height: 1.6;";
        introStrong.textContent = "To enable Gyazo integration, you need to:";
        intro.append(introStrong);
        steps.style.cssText = "margin: 16px 0; padding-left: 20px;";
        developerLink.dataset["externalLink"] = "true";
        developerLink.href = "https://gyazo.com/oauth/applications";
        developerLink.style.cssText = "color: var(--color-accent);";
        developerLink.textContent = "Gyazo Developer Applications";
        visitStep.append("Visit ", developerLink);
        createStep.append("Create a new application with these settings:");
        createSettings.style.cssText = "margin: 8px 0; padding-left: 20px;";
        appNameLabel.textContent = "Application Name:";
        appNameStep.append(appNameLabel, " FitFileViewer");
        redirectLabel.textContent = "Redirect URI:";
        redirectCode.style.cssText =
            "background: var(--color-glass); padding: 2px 4px; border-radius: 4px;";
        redirectCode.textContent = "http://localhost:3000/gyazo/callback";
        redirectStep.append(redirectLabel, " ", redirectCode);
        createSettings.append(appNameStep, redirectStep);
        createStep.append(createSettings);
        clientIdLabel.textContent = "Client ID";
        clientSecretLabel.textContent = "Client Secret";
        copyStep.append(
            "Copy your ",
            clientIdLabel,
            " and ",
            clientSecretLabel
        );
        updateStep.append(
            "Open Gyazo Settings, expand Advanced: Use Custom Credentials, then save both values:"
        );
        configExample.style.cssText = `
            background: var(--color-glass);
            padding: 12px;
            border-radius: 8px;
            font-size: 12px;
            margin: 8px 0;
            overflow-x: auto;
            color: var(--color-fg);
        `;
        configExample.textContent = `Client ID: YOUR_ACTUAL_CLIENT_ID
Client Secret: YOUR_ACTUAL_CLIENT_SECRET`;
        updateStep.append(configExample);
        restartStep.textContent =
            "Disconnect and reconnect the Gyazo account after changing credentials";
        steps.append(visitStep, createStep, copyStep, updateStep, restartStep);
        securityNote.style.cssText = `
            background: var(--color-warning-bg);
            border: 1px solid var(--color-warning);
            border-radius: 8px;
            padding: 12px;
            margin: 16px 0;
        `;
        securityLabel.textContent = "⚠️ Security Note:";
        securityNote.append(
            securityLabel,
            " Keep your Client Secret secure and never expose it in public code repositories."
        );
        content.append(intro, steps, securityNote);

        closeBtn.id = "setup-close";
        closeBtn.style.cssText = `
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
        `;
        closeBtn.textContent = "Got it!";
        modal.append(title, content, closeBtn);
        const listenerController = exportUtilsRuntime().createAbortController();
        const listenerOptions = { signal: listenerController.signal };
        let cleanupModalAccessibility = () => {};
        const closeOverlay = () => {
            listenerController.abort();
            cleanupModalAccessibility();
            overlay.remove();
        };

        closeBtn.addEventListener("click", closeOverlay, listenerOptions);

        cleanupModalAccessibility = setupExportModalAccessibility({
            closeOverlay,
            initialFocusElement: closeBtn,
            modal,
            overlay,
            signal: listenerController.signal,
            title,
        });

        overlay.append(modal);
        exportUtilsRuntime().appendToBody(overlay);
    },

    /*
     * Updates the authentication status in the Gyazo account manager modal
     *
     * @param {HTMLElement} modal - The modal element containing status
     *   indicators
     */
    updateGyazoAuthStatus(modal: HTMLElement) {
        const // Update auth status
            authStatus = modal.querySelector("#auth-status"),
            config = exportUtils.getGyazoConfig(),
            hasCredentials = Boolean(config.clientId && config.clientSecret),
            isAuthenticated = exportUtils.isGyazoAuthenticated();
        if (authStatus) {
            (authStatus as HTMLElement).style.background = isAuthenticated
                ? "var(--color-success)"
                : "var(--color-error)";
            authStatus.textContent = isAuthenticated
                ? "✅ Connected"
                : "❌ Not Connected";
        }

        // Update credentials status
        const credsStatus = modal.querySelector("#creds-status");
        if (credsStatus) {
            (credsStatus as HTMLElement).style.background = hasCredentials
                ? "var(--color-success)"
                : "var(--color-warning)";
            credsStatus.textContent = hasCredentials
                ? "🔑 Credentials Saved"
                : "⚠️ Credentials Needed";
        }

        // Update action buttons visibility
        const connectBtn = modal.querySelector("#gyazo-connect"),
            disconnectBtn = modal.querySelector("#gyazo-disconnect");

        if (connectBtn) {
            (connectBtn as HTMLElement).style.display =
                hasCredentials && !isAuthenticated ? "block" : "none";
        }

        if (disconnectBtn) {
            (disconnectBtn as HTMLElement).style.display = isAuthenticated
                ? "block"
                : "none";
        }

        console.log(
            "[Gyazo] Status updated - Auth:",
            isAuthenticated,
            "Creds:",
            hasCredentials
        );
    },

    /*
     * Uploads image to Gyazo using the new API format
     *
     * @param {string} base64Image - Base64 encoded image
     *
     * @returns {Promise<string>} Gyazo URL
     */
    async uploadToGyazo(base64Image: string): Promise<string> {
        let accessToken = exportUtils.getGyazoAccessToken();

        // If no access token, try to authenticate
        if (!accessToken) {
            try {
                accessToken = await exportUtils.authenticateWithGyazo();
            } catch (error) {
                throw new Error(
                    `Gyazo authentication required: ${getErrorMessage(error)}`,
                    { cause: error }
                );
            }
        }

        try {
            // Convert base64 data URL to a Blob for FormData.
            // IMPORTANT: Do not fetch(data:...) here; it's treated as a network request and can be blocked by CSP.
            const blob = dataUrlToBlob(base64Image);

            // Create FormData for multipart/form-data upload
            const formData = new FormData();
            formData.append("access_token", accessToken);
            formData.append("imagedata", blob, "chart.png");

            const uploadUrl = validateGyazoEndpointUrl(
                exportUtils.getGyazoConfig().uploadUrl,
                new Set(["upload.gyazo.com"])
            );

            const uploadResponse: GyazoUploadFetchResponse =
                await fetchWithTimeout(uploadUrl, 15_000, {
                    body: formData,
                    method: "POST",
                });

            // Treat missing `ok` (common in test doubles) as success.
            // A real Fetch Response always has a boolean `ok`.
            if (uploadResponse.ok === false) {
                // If unauthorized, clear the token and try to re-authenticate
                if (uploadResponse.status === 401) {
                    exportUtils.clearGyazoAccessToken();
                    throw new Error(
                        "Gyazo access token expired. Please re-authenticate."
                    );
                }

                const errorText = await uploadResponse.text();
                throw new Error(
                    `Gyazo upload failed: ${uploadResponse.status} - ${truncateErrorText(errorText)}`
                );
            }

            const rawData: unknown =
                    typeof uploadResponse.json === "function"
                        ? await uploadResponse.json()
                        : uploadResponse,
                parsed = validateGyazoUploadResponse(rawData);
            if (!parsed.success) {
                throw new Error("Invalid Gyazo upload response");
            }
            const data = parsed.data;
            if (data.permalink_url) {
                return data.permalink_url;
            } else if (data.url) {
                return data.url;
            }
            throw new Error("No URL returned from Gyazo upload");
        } catch (error) {
            if (isAbortError(error)) {
                throw new Error("Gyazo upload timed out", { cause: error });
            }
            console.error("Error uploading to Gyazo:", error);

            // If it's an authentication error, clear the stored token
            const errorMessage = getErrorMessage(error);
            if (
                errorMessage.includes("expired") ||
                errorMessage.includes("unauthorized")
            ) {
                exportUtils.clearGyazoAccessToken();
            }

            throw error;
        }
    },

    /*
     * Gets Imgur configuration from storage with fallback
     *
     * @returns {Object} Imgur configuration object
     */
    getImgurConfig(): ImgurConfig {
        const defaultClientId = "0046ee9e30ac578"; // Placeholder for demo

        return {
            clientId:
                safeStorageGetItem("imgur_client_id", __deps.getStorage) ||
                defaultClientId,
            uploadUrl: "https://api.imgur.com/3/image",
        };
    },

    /*
     * Saves Imgur configuration to storage
     *
     * @param {string} clientId - Imgur client ID
     */
    setImgurConfig(clientId: string) {
        safeStorageSetItem("imgur_client_id", clientId, __deps.getStorage);
    },

    /*
     * Clears Imgur configuration
     */
    clearImgurConfig() {
        safeStorageRemoveItem("imgur_client_id", __deps.getStorage);
    },

    /*
     * Checks if Imgur is properly configured with a non-default client ID
     *
     * @returns {boolean} True if configured with custom client ID
     */
    isImgurConfigured() {
        const config = exportUtils.getImgurConfig();
        // Only consider "YOUR_IMGUR_CLIENT_ID" as unconfigured
        // The demo client ID "0046ee9e30ac578" is considered "configured" for shared usage
        return config.clientId !== "YOUR_IMGUR_CLIENT_ID";
    },

    /*
     * Uploads image to Imgur and returns URL
     *
     * @param {string} base64Image - Base64 encoded image
     *
     * @returns {Promise<string>} Imgur URL
     */
    async uploadToImgur(base64Image: string): Promise<string> {
        const debugUploads =
            exportUtilsRuntime().getProcessEnvironmentValue(
                "FFV_DEBUG_UPLOADS"
            ) === "1";

        const config = exportUtils.getImgurConfig();

        // Only reject if completely unconfigured (YOUR_IMGUR_CLIENT_ID)
        if (config.clientId === "YOUR_IMGUR_CLIENT_ID") {
            throw new Error(
                "Imgur client ID not configured. Please add your Imgur client ID in the settings."
            );
        }

        // Warn about shared usage but proceed
        if (config.clientId === "0046ee9e30ac578") {
            __deps.showNotification(
                "Using shared Imgur service - uploads may be rate limited. Configure your own Client ID in settings for better reliability.",
                "warning"
            );
        }

        const uploadUrl = validateImgurEndpointUrl(
            config.uploadUrl,
            new Set(["api.imgur.com"])
        );

        try {
            const parts =
                typeof base64Image === "string" ? base64Image.split(",") : [];
            const imageData = parts.length >= 2 ? parts[1] : "";
            if (!imageData) {
                throw new Error("Invalid image data provided");
            }

            const requestBody = {
                description: "Chart exported from FitFileViewer",
                image: imageData,
                title: "FitFileViewer Chart",
                type: "base64",
            };

            if (debugUploads) {
                console.log("[Imgur Upload] POST", uploadUrl);
            }

            const response = await fetchWithTimeout(uploadUrl, 15_000, {
                body: JSON.stringify(requestBody),
                headers: {
                    Authorization: `Client-ID ${config.clientId}`,
                    "Content-Type": "application/json",
                },
                method: "POST",
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(
                    `Imgur upload failed: ${response.status} ${response.statusText} - ${truncateErrorText(errorText)}`
                );
            }

            const link = getImgurUploadLink(await response.json());
            if (link) {
                return link;
            }

            throw new Error("Invalid response from Imgur");
        } catch (error) {
            if (isAbortError(error)) {
                throw new Error("Imgur upload timed out", { cause: error });
            }
            throw error;
        }
    } /*
     * Shows Imgur account management modal with client ID setup
     */,
    showImgurAccountManager() {
        const config = exportUtils.getImgurConfig();
        const isConfigured = exportUtils.isImgurConfigured();

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
        modal.className = "imgur-account-manager-modal";
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

        const title = document.createElement("h3");
        title.style.cssText =
            "margin: 0 0 16px 0; color: var(--color-modal-fg); text-align: center;";
        title.textContent = "📸 Imgur Settings";
        modal.append(title);

        const statusSection = document.createElement("div"),
            statusWrap = document.createElement("div"),
            statusElement = document.createElement("span");
        statusSection.style.cssText =
            "margin-bottom: 20px; text-align: center;";
        statusWrap.style.cssText = "margin-bottom: 12px;";
        statusElement.id = "imgur-status";
        statusElement.style.cssText = `
            display: inline-block;
            padding: 4px 12px;
            border-radius: 16px;
            font-size: 12px;
            font-weight: 600;
            background: ${isConfigured ? "var(--color-success)" : "var(--color-warning)"};
            color: white;
        `;
        statusElement.textContent = isConfigured
            ? "✅ Configured"
            : "⚠️ Using Default (Limited)";
        statusWrap.append(statusElement);
        statusSection.append(statusWrap);
        modal.append(statusSection);

        const setupInstructions = document.createElement("div"),
            setupTitle = document.createElement("h4"),
            setupCopy = document.createElement("p"),
            setupGuideLabel = document.createElement("strong");
        setupInstructions.style.cssText =
            "margin-bottom: 20px; padding: 16px; background: var(--color-glass); border-radius: 8px;";
        setupTitle.style.cssText =
            "margin: 0 0 12px 0; color: var(--color-accent); font-size: 14px;";
        setupTitle.textContent = "🚀 Getting Started";
        setupCopy.style.cssText =
            "margin: 0; color: var(--color-fg); font-size: 14px; line-height: 1.5;";
        setupGuideLabel.textContent = '"Setup Guide"';
        setupCopy.append(
            "To upload charts to Imgur, you need your own Imgur Client ID. Click ",
            setupGuideLabel,
            " below for step-by-step instructions."
        );
        setupInstructions.append(setupTitle, setupCopy);
        modal.append(setupInstructions);

        const configForm = document.createElement("div"),
            inputField = document.createElement("div"),
            clientIdLabel = document.createElement("label"),
            clientIdInput = document.createElement("input"),
            saveBtn = document.createElement("button");
        configForm.style.cssText = "margin-bottom: 20px;";
        inputField.style.cssText = "margin-bottom: 12px;";
        clientIdLabel.style.cssText =
            "display: block; margin-bottom: 6px; color: var(--color-fg); font-weight: 600; font-size: 14px;";
        clientIdLabel.textContent = "Imgur Client ID:";
        clientIdInput.id = "imgur-client-id";
        clientIdInput.placeholder = "Enter your Imgur Client ID";
        clientIdInput.type = "text";
        clientIdInput.style.cssText = `
            width: 100%;
            padding: 10px 12px;
            border-radius: 8px;
            border: 1px solid var(--color-border);
            background: var(--color-glass);
            color: var(--color-fg);
            font-size: 14px;
            box-sizing: border-box;
            font-family: monospace;
        `;
        saveBtn.id = "save-imgur-config";
        saveBtn.style.cssText = `
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
        `;
        saveBtn.textContent = "💾 Save Configuration";
        inputField.append(clientIdLabel, clientIdInput);
        configForm.append(inputField, saveBtn);
        modal.append(configForm);

        const actions = document.createElement("div"),
            setupGuideBtn = document.createElement("button"),
            clearBtn = document.createElement("button"),
            closeBtn = document.createElement("button");
        actions.style.cssText =
            "display: flex; flex-direction: column; gap: 8px;";
        setupGuideBtn.id = "imgur-setup-guide";
        clearBtn.id = "clear-imgur-config";
        closeBtn.id = "imgur-close";
        for (const button of [
            setupGuideBtn,
            clearBtn,
            closeBtn,
        ]) {
            button.style.cssText = `
                width: 100%;
                padding: 12px;
                border-radius: 8px;
                font-size: 14px;
                cursor: pointer;
                transition: var(--transition-smooth);
            `;
        }
        setupGuideBtn.style.background = "var(--color-accent)";
        setupGuideBtn.style.border = "none";
        setupGuideBtn.style.color = "var(--color-fg-alt)";
        setupGuideBtn.style.fontWeight = "600";
        setupGuideBtn.textContent = "📖 Setup Guide";
        clearBtn.style.background = "var(--color-warning)";
        clearBtn.style.border = "none";
        clearBtn.style.color = "white";
        clearBtn.style.fontWeight = "600";
        clearBtn.textContent = "🗑️ Clear Configuration";
        closeBtn.style.background = "var(--color-border-light)";
        closeBtn.style.border = "1px solid var(--color-border)";
        closeBtn.style.color = "var(--color-fg-alt)";
        closeBtn.textContent = "Close";
        actions.append(setupGuideBtn, clearBtn, closeBtn);
        modal.append(actions);
        const listenerController = exportUtilsRuntime().createAbortController();
        const listenerOptions = { signal: listenerController.signal };
        let cleanupModalAccessibility = () => {};
        const closeOverlay = () => {
            listenerController.abort();
            cleanupModalAccessibility();
            overlay.remove();
        };

        // Security: assign potentially-untrusted stored value via DOM property.
        if (clientIdInput) {
            clientIdInput.value = String(config.clientId ?? "");
        }

        // Save configuration
        if (saveBtn && clientIdInput) {
            saveBtn.addEventListener(
                "click",
                () => {
                    const clientId = clientIdInput.value.trim();
                    if (clientId) {
                        exportUtils.setImgurConfig(clientId);
                        __deps.showNotification(
                            "Imgur configuration saved",
                            "success"
                        );
                        exportUtils.updateImgurStatus(modal);
                    } else {
                        __deps.showNotification(
                            "Please enter a valid Client ID",
                            "error"
                        );
                    }
                },
                listenerOptions
            );
        }

        // Show setup guide
        if (setupGuideBtn) {
            setupGuideBtn.addEventListener(
                "click",
                () => {
                    closeOverlay();
                    exportUtils.showImgurSetupGuide();
                },
                listenerOptions
            );
        }

        // Clear configuration
        if (clearBtn) {
            clearBtn.addEventListener(
                "click",
                () => {
                    exportUtils.clearImgurConfig();
                    __deps.showNotification(
                        "Imgur configuration cleared",
                        "info"
                    );
                    if (clientIdInput) {
                        clientIdInput.value =
                            exportUtils.getImgurConfig().clientId;
                    }
                    exportUtils.updateImgurStatus(modal);
                },
                listenerOptions
            );
        }

        // Close modal
        if (closeBtn) {
            closeBtn.addEventListener("click", closeOverlay, listenerOptions);
        }

        cleanupModalAccessibility = setupExportModalAccessibility({
            closeOverlay,
            initialFocusElement: clientIdInput,
            modal,
            overlay,
            signal: listenerController.signal,
            title,
        });

        overlay.append(modal);
        exportUtilsRuntime().appendToBody(overlay);
    },

    /*
     * Shows Imgur setup guide with step-by-step instructions
     */
    showImgurSetupGuide() {
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

        const title = document.createElement("h3");
        title.style.cssText =
            "margin: 0 0 16px 0; color: var(--color-modal-fg); text-align: center;";
        title.textContent = "🔧 Imgur Setup Guide";

        const content = document.createElement("div");
        content.style.cssText = "color: var(--color-fg); line-height: 1.6;";

        const intro = document.createElement("p");
        const introText = document.createElement("strong");
        introText.textContent =
            "To enable Imgur integration, follow these steps:";
        intro.append(introText);

        const steps = document.createElement("ol");
        steps.style.cssText = "margin: 16px 0; padding-left: 20px;";

        const registrationStep = document.createElement("li");
        registrationStep.append("Visit ");
        const registrationLink = exportUtilsRuntime().createElement("a");
        registrationLink.href = "https://api.imgur.com/oauth2/addclient";
        registrationLink.dataset["externalLink"] = "true";
        registrationLink.style.color = "var(--color-accent)";
        registrationLink.textContent = "Imgur API Registration";
        registrationStep.append(registrationLink);

        const appStep = document.createElement("li");
        appStep.append("Create a new application with these settings:");
        const appSettings = document.createElement("ul");
        appSettings.style.cssText = "margin: 8px 0; padding-left: 20px;";
        const appName = document.createElement("li");
        const appNameLabel = document.createElement("strong");
        appNameLabel.textContent = "Application Name:";
        appName.append(appNameLabel, " FitFileViewer");
        const authType = document.createElement("li");
        const authTypeLabel = document.createElement("strong");
        authTypeLabel.textContent = "Authorization Type:";
        authType.append(
            authTypeLabel,
            ' Select "Anonymous usage without user authorization"'
        );
        const callbackUrl = document.createElement("li");
        const callbackUrlLabel = document.createElement("strong");
        callbackUrlLabel.textContent = "Authorization Callback URL:";
        callbackUrl.append(
            callbackUrlLabel,
            " Leave blank (not needed for anonymous usage)"
        );
        appSettings.append(appName, authType, callbackUrl);
        appStep.append(appSettings);

        const copyStep = document.createElement("li");
        const clientIdLabel = document.createElement("strong");
        clientIdLabel.textContent = "Client ID";
        copyStep.append("After creating the app, copy your ", clientIdLabel);
        const pasteStep = document.createElement("li");
        pasteStep.textContent =
            "Return to the Imgur Settings and paste your Client ID";
        const saveStep = document.createElement("li");
        saveStep.textContent = 'Click "Save Configuration"';
        steps.append(registrationStep, appStep, copyStep, pasteStep, saveStep);

        const tips = document.createElement("div");
        tips.style.cssText = `
            background: var(--color-glass);
            border: 1px solid var(--color-accent);
            border-radius: 8px;
            padding: 12px;
            margin: 16px 0;
        `;
        const tipsLabel = document.createElement("strong");
        tipsLabel.textContent = "💡 Tips:";
        const tipsList = document.createElement("ul");
        tipsList.style.cssText = "margin: 8px 0; padding-left: 20px;";
        for (const tip of [
            "Anonymous usage is sufficient for uploading chart images",
            "Your Client ID is safe to use publicly (it's not a secret)",
            "Imgur allows up to 12,500 uploads per day for registered applications",
        ]) {
            const item = document.createElement("li");
            item.textContent = tip;
            tipsList.append(item);
        }
        tips.append(tipsLabel, tipsList);

        const note = document.createElement("div");
        note.style.cssText = `
            background: var(--color-warning-bg);
            border: 1px solid var(--color-warning);
            border-radius: 8px;
            padding: 12px;
            margin: 16px 0;
        `;
        const noteLabel = document.createElement("strong");
        noteLabel.textContent = "⚠️ Note:";
        note.append(
            noteLabel,
            " Without your own Client ID, the application uses a default that may have rate limits or restrictions."
        );

        content.append(intro, steps, tips, note);

        const actions = document.createElement("div");
        actions.style.cssText = "display: flex; gap: 8px; margin-top: 20px;";

        const backBtn = document.createElement("button");
        backBtn.id = "imgur-guide-back";
        backBtn.style.cssText = `
            flex: 1;
            padding: 12px;
            background: var(--color-border-light);
            border: 1px solid var(--color-border);
            border-radius: 8px;
            color: var(--color-fg-alt);
            font-size: 14px;
            cursor: pointer;
            transition: var(--transition-smooth);
        `;
        backBtn.textContent = "← Back to Settings";

        const closeBtn = document.createElement("button");
        closeBtn.id = "imgur-guide-close";
        closeBtn.style.cssText = `
            flex: 1;
            padding: 12px;
            background: var(--color-accent);
            border: none;
            border-radius: 8px;
            color: var(--color-fg-alt);
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: var(--transition-smooth);
        `;
        closeBtn.textContent = "Got it!";

        actions.append(backBtn, closeBtn);
        modal.append(title, content, actions);
        const listenerController = exportUtilsRuntime().createAbortController();
        const listenerOptions = { signal: listenerController.signal };
        let cleanupModalAccessibility = () => {};
        const closeOverlay = () => {
            listenerController.abort();
            cleanupModalAccessibility();
            overlay.remove();
        };

        backBtn.addEventListener(
            "click",
            () => {
                closeOverlay();
                exportUtils.showImgurAccountManager();
            },
            listenerOptions
        );
        closeBtn.addEventListener("click", closeOverlay, listenerOptions);

        cleanupModalAccessibility = setupExportModalAccessibility({
            closeOverlay,
            initialFocusElement: closeBtn,
            modal,
            overlay,
            signal: listenerController.signal,
            title,
        });

        overlay.append(modal);
        exportUtilsRuntime().appendToBody(overlay);
    },

    /*
     * Updates the status display in the Imgur account manager modal
     *
     * @param {HTMLElement} modal - The modal element containing status
     *   indicators
     */
    updateImgurStatus(modal: HTMLElement) {
        const isConfigured = exportUtils.isImgurConfigured();
        const statusElement = modal.querySelector("#imgur-status");

        if (statusElement) {
            (statusElement as HTMLElement).style.background = isConfigured
                ? "var(--color-success)"
                : "var(--color-warning)";
            statusElement.textContent = isConfigured
                ? "✅ Configured"
                : "⚠️ Using Default (Limited)";
        }

        console.log("[Imgur] Status updated - Configured:", isConfigured);
    },
}; // Global export functions for the settings panel
