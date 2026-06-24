/**
 * System information display updater for FitFileViewer.
 */
import {
    getUpdateSystemInfoRuntime,
    type UpdateSystemInfoRuntime,
} from "./updateSystemInfoRuntime.js";

/** Known fields displayed in the system information panel. */
export type SystemInfoField =
    | "author"
    | "chrome"
    | "electron"
    | "license"
    | "node"
    | "platform"
    | "version";

/** System information values accepted by the display updater. */
export type SystemInfoRecord = Partial<Record<SystemInfoField, unknown>>;

const DOM_SELECTORS = {
    SYSTEM_INFO_VALUE: ".system-info-value",
} as const;

const EXPECTED_INFO_FIELDS = 7;

const INFO_FIELD_ORDER = [
    "version",
    "electron",
    "node",
    "chrome",
    "platform",
    "author",
    "license",
] as const satisfies readonly SystemInfoField[];

const LOG_PREFIX = "[SystemInfo]";

let cachedSystemInfoItems: NodeListOf<Element> | null = null;

function updateSystemInfoRuntime(): UpdateSystemInfoRuntime {
    return getUpdateSystemInfoRuntime();
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isCacheValid(nodes: NodeListOf<Element>): boolean {
    try {
        for (const element of nodes) {
            if (!element.isConnected) {
                return false;
            }
        }

        return true;
    } catch {
        return false;
    }
}

/**
 * Clears the cached DOM elements.
 */
export function clearSystemInfoCache(): void {
    cachedSystemInfoItems = null;
    console.log(`${LOG_PREFIX} DOM element cache cleared`);
}

function getSystemInfoField(
    info: SystemInfoRecord,
    fieldName: SystemInfoField
): unknown {
    return info[fieldName];
}

/**
 * Updates the system information display in the UI.
 */
export function updateSystemInfo(info: unknown): boolean {
    try {
        if (!isRecord(info)) {
            console.error(`${LOG_PREFIX} Invalid system info object provided`);
            return false;
        }

        logMissingSystemInfoFields(info);

        const systemInfoItems = initializeSystemInfoCache();

        if (systemInfoItems.length === 0) {
            console.error(`${LOG_PREFIX} No system info elements found in DOM`);
            return false;
        }

        for (const [index, fieldName] of INFO_FIELD_ORDER.entries()) {
            const element = systemInfoItems.item(index);

            if (element) {
                updateSystemInfoField(
                    element,
                    getSystemInfoField(info, fieldName),
                    fieldName
                );
            }
        }

        console.log(`${LOG_PREFIX} System information updated successfully`);
        return true;
    } catch (error) {
        console.error(
            `${LOG_PREFIX} Error updating system information:`,
            error
        );
        return false;
    }
}

function initializeSystemInfoCache(): NodeListOf<Element> {
    const cachedItems = cachedSystemInfoItems;

    if (cachedItems !== null && isCacheValid(cachedItems)) {
        return cachedItems;
    }

    cachedSystemInfoItems = updateSystemInfoRuntime().querySystemInfoItems(
        DOM_SELECTORS.SYSTEM_INFO_VALUE
    );

    if (cachedSystemInfoItems.length !== EXPECTED_INFO_FIELDS) {
        console.warn(
            `${LOG_PREFIX} Expected ${EXPECTED_INFO_FIELDS} ${DOM_SELECTORS.SYSTEM_INFO_VALUE} elements, ` +
                `but found ${cachedSystemInfoItems.length}. ` +
                "Check the HTML structure to ensure all system info fields are present."
        );
    }

    return cachedSystemInfoItems;
}

function updateSystemInfoField(
    element: Element,
    value: unknown,
    fieldName: SystemInfoField
): void {
    try {
        element.textContent = formatSystemInfoValue(value);
    } catch (error) {
        console.error(
            `${LOG_PREFIX} Error updating field ${fieldName}:`,
            error
        );
    }
}

function formatSystemInfoValue(value: unknown): string {
    if (value === null || value === undefined || value === "") {
        return "";
    }

    if (
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean" ||
        typeof value === "bigint" ||
        typeof value === "symbol"
    ) {
        return String(value);
    }

    if (value instanceof Date) {
        return value.toISOString();
    }

    try {
        return JSON.stringify(value) ?? "";
    } catch {
        return "";
    }
}

function logMissingSystemInfoFields(info: SystemInfoRecord): void {
    const missingFields = INFO_FIELD_ORDER.filter(
        (field) =>
            getSystemInfoField(info, field) === undefined ||
            getSystemInfoField(info, field) === null
    );

    if (missingFields.length > 0) {
        console.warn(
            `${LOG_PREFIX} Missing system info fields:`,
            missingFields
        );
    }
}
