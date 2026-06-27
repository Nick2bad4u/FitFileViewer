/**
 * Folder-based FIT file browser tab.
 *
 * This is intentionally lightweight:
 *
 * - The main process owns the persisted root folder and enforces that listings
 *   remain within it.
 * - The renderer requests directory listings and can open a selected .fit file by
 *   path.
 */

import type { FitBrowserListFolderResult } from "../../../shared/ipc";
import type {
    ElectronDialogApi,
    ElectronFileApi,
    ElectronFitBrowserApi,
} from "../../../shared/preloadApi.js";
import pLimitCompat from "../../async/pLimitCompat.js";
import {
    getFitMessageRows,
    unwrapFitParseMessages,
} from "../../files/import/fitParsePayload.js";
import { openFitFileFromPath } from "../../files/import/openFitFileFromPath.js";
import {
    getRendererElectronApi,
    type RendererElectronApiScope,
} from "../../runtime/electronApiRuntime.js";
import {
    type BrowserView,
    getBrowserRelPath,
    getBrowserView,
    setBrowserListingState,
    setBrowserRelPath,
    setBrowserScanState,
    setBrowserView,
} from "../../state/domain/browserState.js";
import {
    type FitBrowserLibraryCachePayload,
    readFitBrowserLibraryCache,
    writeFitBrowserLibraryCache,
} from "./fileBrowserLibraryCache.js";
import {
    type AppIconName,
    createAppIconElement,
} from "../icons/iconFactory.js";
import { showNotification as showRendererNotification } from "../notifications/showNotification.js";
import {
    getFileBrowserTabRuntime,
    type FileBrowserTabRuntime,
} from "./fileBrowserTabRuntime.js";

type CalendarState = {
    monthStart: Date;
    selectedDayKey: string;
};

type DistanceUnit = "km" | "mi";

type FitBrowserElectronAPI = {
    readonly decodeFitFile?: ElectronFileApi["decodeFitFile"];
    readonly getFitBrowserFolder?: ElectronFitBrowserApi["getFitBrowserFolder"];
    readonly listFitBrowserFolder?: ElectronFitBrowserApi["listFitBrowserFolder"];
    readonly openFolderDialog?: ElectronDialogApi["openFolderDialog"];
    readonly readFile?: ElectronFileApi["readFile"];
};

type FitBrowserElectronApiCandidate = {
    readonly decodeFitFile?: unknown;
    readonly getFitBrowserFolder?: unknown;
    readonly listFitBrowserFolder?: unknown;
    readonly openFolderDialog?: unknown;
    readonly readFile?: unknown;
};

type FitBrowserDecodeApi = {
    readonly decodeFitFile: ElectronFileApi["decodeFitFile"];
    readonly readFile: ElectronFileApi["readFile"];
};
type FileBrowserTabOptions = {
    readonly electronApiScope?: RendererElectronApiScope | undefined;
};

type FitBrowserListApi = {
    readonly listFitBrowserFolder: ElectronFitBrowserApi["listFitBrowserFolder"];
};

type FitLibraryCachePayload = FitBrowserLibraryCachePayload<FitLibraryItem>;

type FitLibraryFile = {
    fullPath: string;
    name: string;
};

type FitLibraryItem = {
    fileName: string;
    fullPath: string;
    sport?: string;
    startTime: Date;
    totalDistanceM: number;
};

type FitLibraryPrefs = {
    lastDays: number;
    unit: DistanceUnit;
};

type FitLibraryTotals = {
    lastDaysDistanceM: number;
    lastDaysStart: string;
    monthDistanceM: number;
    monthStart: string;
    weekDistanceM: number;
    weekStart: string;
};

type LibraryRowOptions = {
    includeSportBadge: boolean;
    useTimeOnly: boolean;
};

type SportBadge = {
    emoji: string;
    key: string;
    label: string;
};

type SportBadgeCount = SportBadge & {
    count: number;
};

const LIB_PREFS_LAST_DAYS_KEY = "fitLibrary.lastDays";
const LIB_PREFS_UNIT_KEY = "fitLibrary.unit";
const CAL_PREFS_MONTH_KEY = "fitLibrary.calendarMonth";
const CAL_PREFS_SELECTED_DAY_KEY = "fitLibrary.calendarSelectedDay";
let activeElectronApiScope: RendererElectronApiScope | undefined;

function fileBrowserTabRuntime(): FileBrowserTabRuntime {
    return getFileBrowserTabRuntime();
}

const showNotification = (
    ...args: Parameters<typeof showRendererNotification>
): void => {
    void showRendererNotification(...args);
};

function addManagedEventListener<K extends keyof HTMLElementEventMap>(
    target: HTMLElement,
    type: K,
    listener: (event: HTMLElementEventMap[K]) => Promise<void> | void
): void {
    const controller = fileBrowserTabRuntime().createAbortController();
    const wrappedListener = (event: HTMLElementEventMap[K]): void => {
        try {
            void Promise.resolve(listener(event)).catch((error: unknown) => {
                console.error("[fileBrowserTab] Event handler failed", error);
            });
        } catch (error) {
            console.error("[fileBrowserTab] Event handler failed", error);
        }
    };
    target.addEventListener(type, wrappedListener as EventListener, {
        signal: controller.signal,
    });
}

/**
 * Render or refresh the Browser tab UI.
 */
export async function renderFileBrowserTab({
    electronApiScope,
}: FileBrowserTabOptions = {}): Promise<void> {
    activeElectronApiScope = electronApiScope;
    const container = fileBrowserTabRuntime().getElementById("content_browser");
    if (!container) {
        return;
    }

    // One-time UI scaffolding.
    if (!container.dataset["ffvBrowserInitialized"]) {
        container.dataset["ffvBrowserInitialized"] = "true";
        container.replaceChildren(createFileBrowserScaffold());

        const pickBtn = fileBrowserTabRuntime().getElement<HTMLElement>(
            "#fit-browser-pick-folder"
        );
        if (pickBtn) {
            addManagedEventListener(pickBtn, "click", async () => {
                const api = getElectronAPI();
                if (!api || typeof api.openFolderDialog !== "function") {
                    showNotification("Folder picker is unavailable.", "error");
                    return;
                }

                const selected = await api.openFolderDialog();
                if (!selected) {
                    return;
                }

                // Reset the relative path when a new root is chosen.
                setBrowserRelPath("", {
                    source: "fileBrowser.pickFolder",
                });
                await refreshActiveView();
            });
        }

        const filesBtn = fileBrowserTabRuntime().getElement<HTMLElement>(
            "#fit-browser-view-files"
        );
        const libraryBtn = fileBrowserTabRuntime().getElement<HTMLElement>(
            "#fit-browser-view-library"
        );
        const calendarBtn = fileBrowserTabRuntime().getElement<HTMLElement>(
            "#fit-browser-view-calendar"
        );

        const setView = async (view: BrowserView): Promise<void> => {
            setBrowserView(view, { source: "fileBrowser.setView" });
            await refreshActiveView();
        };

        if (filesBtn) {
            addManagedEventListener(filesBtn, "click", async () =>
                setView("files")
            );
        }
        if (libraryBtn) {
            addManagedEventListener(libraryBtn, "click", async () =>
                setView("library")
            );
        }
        if (calendarBtn) {
            addManagedEventListener(calendarBtn, "click", async () =>
                setView("calendar")
            );
        }
    }

    await refreshActiveView();
}

function createFileBrowserScaffold(): HTMLElement {
    const root = fileBrowserTabRuntime().createElement("div");
    root.className = "file-browser";

    const notice = fileBrowserTabRuntime().createElement("div");
    notice.className = "file-browser__notice";
    notice.setAttribute("role", "note");
    notice.textContent =
        "Experimental feature — folder scanning and calendar may change.";

    const header = fileBrowserTabRuntime().createElement("div");
    header.className = "file-browser__header";

    const controls = fileBrowserTabRuntime().createElement("div");
    controls.className = "file-browser__controls";
    controls.append(createPickFolderButton(), createViewSegmentedControl());

    const currentPath = fileBrowserTabRuntime().createElement("div");
    currentPath.className = "file-browser__path";
    currentPath.id = "fit-browser-current-path";

    header.append(controls, currentPath);

    const status = fileBrowserTabRuntime().createElement("div");
    status.className = "file-browser__status";
    status.id = "fit-browser-status";
    status.setAttribute("aria-live", "polite");
    status.setAttribute("role", "status");
    status.hidden = true;

    const body = fileBrowserTabRuntime().createElement("div");
    body.className = "file-browser__body";

    const list = fileBrowserTabRuntime().createElement("div");
    list.className = "file-browser__list";
    list.id = "fit-browser-list";
    list.setAttribute("role", "list");

    const library = fileBrowserTabRuntime().createElement("div");
    library.className = "file-browser__library";
    library.id = "fit-browser-library";
    library.hidden = true;

    const calendar = fileBrowserTabRuntime().createElement("div");
    calendar.className = "file-browser__calendar";
    calendar.id = "fit-browser-calendar";
    calendar.hidden = true;

    body.append(list, library, calendar);
    root.append(notice, header, status, body);

    return root;
}

function createPickFolderButton(): HTMLButtonElement {
    const button = fileBrowserTabRuntime().createElement("button");
    button.type = "button";
    button.className = "file-browser__btn";
    button.id = "fit-browser-pick-folder";
    appendIconLabel(
        button,
        "folderOpen",
        "file-browser__btn-icon",
        "Choose Folder",
        "file-browser__btn-label",
        16
    );

    return button;
}

function createViewSegmentedControl(): HTMLElement {
    const segmented = fileBrowserTabRuntime().createElement("div");
    segmented.className = "file-browser__segmented";
    segmented.setAttribute("role", "group");
    segmented.setAttribute("aria-label", "Browser view");
    segmented.append(
        createViewSegmentButton(
            "fit-browser-view-files",
            "file",
            "Files",
            true
        ),
        createViewSegmentButton(
            "fit-browser-view-library",
            "database",
            "Library",
            false
        ),
        createViewSegmentButton(
            "fit-browser-view-calendar",
            "calendar",
            "Calendar",
            false
        )
    );

    return segmented;
}

function createViewSegmentButton(
    id: string,
    iconName: AppIconName,
    label: string,
    selected: boolean
): HTMLButtonElement {
    const button = fileBrowserTabRuntime().createElement("button");
    button.type = "button";
    button.className = "file-browser__seg-btn";
    button.id = id;
    button.setAttribute("aria-pressed", selected ? "true" : "false");
    appendIconLabel(
        button,
        iconName,
        "file-browser__seg-icon",
        label,
        "file-browser__seg-label",
        14
    );

    return button;
}

function appendIconLabel(
    target: HTMLElement,
    iconName: AppIconName,
    iconClass: string,
    labelText: string,
    labelClass: string,
    size: number
): void {
    const label = fileBrowserTabRuntime().createElement("span");
    if (labelClass) {
        label.className = labelClass;
    }
    label.textContent = labelText;
    target.append(
        createAppIconElement(iconName, { className: iconClass, size }),
        label
    );
}

function createEmptyMessage(
    text: string,
    className = "file-browser__empty"
): HTMLElement {
    const empty = fileBrowserTabRuntime().createElement("div");
    empty.className = className;
    empty.textContent = text;

    return empty;
}

function formatLoadedAt(timestampMs: number): string {
    return new Date(timestampMs).toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });
}

function setBrowserStatus(message: string, loading = false): void {
    const statusEl = fileBrowserTabRuntime().getElement<HTMLElement>(
        "#fit-browser-status"
    );
    if (fileBrowserTabRuntime().isHTMLElement(statusEl)) {
        statusEl.hidden = message.length === 0;
        statusEl.classList.toggle("file-browser__status--loading", loading);
        statusEl.textContent = message;
    }
}

function getScanErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

function addMonths(monthStart: Date, deltaMonths: number): Date {
    return new Date(
        monthStart.getFullYear(),
        monthStart.getMonth() + deltaMonths,
        1
    );
}

function coerceToDate(value: unknown): Date | null {
    if (value instanceof Date && Number.isFinite(value.getTime())) {
        return value;
    }
    if (typeof value === "string") {
        const d = new Date(value);
        return Number.isFinite(d.getTime()) ? d : null;
    }
    if (typeof value === "number" && Number.isFinite(value)) {
        // Heuristic: seconds vs ms
        const ms = value > 10_000_000_000 ? value : value * 1000;
        const d = new Date(ms);
        return Number.isFinite(d.getTime()) ? d : null;
    }
    return null;
}

function coerceToNumber(value: unknown): number {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    const n = typeof value === "string" ? Number(value) : Number.NaN;
    return Number.isFinite(n) ? n : 0;
}

function computeLibraryTotals(
    items: FitLibraryItem[],
    lastDays: number
): FitLibraryTotals {
    const now = new Date();
    const startOfWeek = startOfLocalWeek(now);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const safeLastDays = Number.isFinite(lastDays)
        ? Math.max(1, Math.min(3650, Math.floor(lastDays)))
        : 30;
    const startOfLastDays = new Date(
        now.getTime() - safeLastDays * 24 * 60 * 60 * 1000
    );

    let weekDistance = 0;
    let monthDistance = 0;
    let lastDaysDistance = 0;

    for (const it of items) {
        const t = it.startTime.getTime();
        if (t >= startOfWeek.getTime()) {
            weekDistance += it.totalDistanceM;
        }
        if (t >= startOfMonth.getTime()) {
            monthDistance += it.totalDistanceM;
        }
        if (t >= startOfLastDays.getTime()) {
            lastDaysDistance += it.totalDistanceM;
        }
    }

    return {
        lastDaysDistanceM: lastDaysDistance,
        lastDaysStart: startOfLastDays.toISOString(),
        monthDistanceM: monthDistance,
        monthStart: startOfMonth.toISOString(),
        weekDistanceM: weekDistance,
        weekStart: startOfWeek.toISOString(),
    };
}

async function decodeLibraryItem(
    api: FitBrowserDecodeApi,
    file: FitLibraryFile
): Promise<FitLibraryItem | null> {
    try {
        const buf = await api.readFile(file.fullPath);
        const decoded = await api.decodeFitFile(buf);
        const messages = unwrapFitParseMessages(decoded);
        const session = getFitMessageRows(messages, "sessionMesgs")[0] ?? null;
        const sessionRecord = asRecord(session);

        const startRaw =
            sessionRecord?.["start_time"] ??
            sessionRecord?.["startTime"] ??
            sessionRecord?.["timestamp"];
        const startTime = coerceToDate(startRaw);
        if (!startTime) {
            return null;
        }

        const totalDistanceM = coerceToNumber(
            sessionRecord?.["total_distance"] ??
                sessionRecord?.["totalDistance"] ??
                0
        );
        const sport =
            typeof sessionRecord?.["sport"] === "string"
                ? sessionRecord["sport"]
                : undefined;

        const item: FitLibraryItem = {
            fileName: file.name,
            fullPath: file.fullPath,
            startTime,
            totalDistanceM,
        };
        if (sport !== undefined) {
            item.sport = sport;
        }
        return item;
    } catch {
        return null;
    }
}

function formatLocalDayKey(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}
function formatMonthKey(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
}

function getCalendarState(): CalendarState {
    const now = new Date();
    const defaultMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const defaultSelected = formatLocalDayKey(now);

    try {
        const runtime = fileBrowserTabRuntime();
        const monthRaw = runtime.getStorageItem(CAL_PREFS_MONTH_KEY);
        const selectedRaw = runtime.getStorageItem(CAL_PREFS_SELECTED_DAY_KEY);

        const monthStart = parseMonthKey(monthRaw) ?? defaultMonthStart;
        const selectedDayKey =
            typeof selectedRaw === "string" && selectedRaw
                ? selectedRaw
                : defaultSelected;

        return { monthStart, selectedDayKey };
    } catch {
        return {
            monthStart: defaultMonthStart,
            selectedDayKey: defaultSelected,
        };
    }
}

function getElectronAPI(): FitBrowserElectronAPI | null {
    return getRendererElectronApi(
        isFitBrowserElectronApi,
        activeElectronApiScope
    );
}

function isFitBrowserElectronApi(
    value: unknown
): value is FitBrowserElectronAPI {
    if (value === null || typeof value !== "object") {
        return false;
    }

    const api = value as FitBrowserElectronApiCandidate;
    return (
        hasOptionalFunction(api.decodeFitFile) &&
        hasOptionalFunction(api.getFitBrowserFolder) &&
        hasOptionalFunction(api.listFitBrowserFolder) &&
        hasOptionalFunction(api.openFolderDialog) &&
        hasOptionalFunction(api.readFile)
    );
}

function hasOptionalFunction(value: unknown): boolean {
    return value === undefined || typeof value === "function";
}

function getLibraryPrefs(): FitLibraryPrefs {
    try {
        const runtime = fileBrowserTabRuntime();
        const lastDaysRaw = runtime.getStorageItem(LIB_PREFS_LAST_DAYS_KEY);
        const unitRaw = runtime.getStorageItem(LIB_PREFS_UNIT_KEY);
        const n =
            typeof lastDaysRaw === "string" ? Number(lastDaysRaw) : Number.NaN;
        const lastDays =
            Number.isFinite(n) && n >= 1 && n <= 3650 ? Math.floor(n) : 30;
        const unit = unitRaw === "mi" ? "mi" : "km";
        return { lastDays, unit };
    } catch {
        return { lastDays: 30, unit: "km" };
    }
}

function getLibraryStorageKey(root: string): string {
    return `fitLibraryCache_${encodeURIComponent(root)}`;
}

function groupItemsByDay(
    items: FitLibraryItem[]
): Map<string, FitLibraryItem[]> {
    const m = new Map<string, FitLibraryItem[]>();
    for (const it of items) {
        const key = formatLocalDayKey(it.startTime);
        const arr = m.get(key);
        if (arr) {
            arr.push(it);
        } else {
            m.set(key, [it]);
        }
    }
    return m;
}

function isFitBrowserListResponse(
    value: unknown
): value is FitBrowserListFolderResult {
    if (!value || typeof value !== "object") return false;
    const v = value as { entries?: unknown; relPath?: unknown; root?: unknown };
    if (v.root !== null && typeof v.root !== "string" && v.root !== undefined)
        return false;
    if (typeof v.relPath !== "string") return false;
    if (!Array.isArray(v.entries)) return false;
    return v.entries.every((e: unknown) => {
        if (!e || typeof e !== "object") return false;
        const entry = e as {
            fullPath?: unknown;
            kind?: unknown;
            name?: unknown;
            relPath?: unknown;
        };
        return (
            typeof entry.name === "string" &&
            (entry.kind === "dir" || entry.kind === "file") &&
            typeof entry.relPath === "string" &&
            typeof entry.fullPath === "string"
        );
    });
}

async function listAllFitFiles(
    api: FitBrowserListApi
): Promise<FitLibraryFile[]> {
    const out: FitLibraryFile[] = [];
    const { listFitBrowserFolder } = api;

    const limit = pLimitCompat(6);
    const visited = new Set<string>();

    const walk = async (relPath: string): Promise<void> => {
        if (visited.has(relPath)) {
            return;
        }
        visited.add(relPath);

        const respRaw = await listFitBrowserFolder(relPath);
        if (!isFitBrowserListResponse(respRaw)) {
            return;
        }

        const { entries } = respRaw;
        const nested: Promise<void>[] = [];

        for (const e of entries) {
            if (e.kind === "dir") {
                nested.push(limit(() => walk(e.relPath)));
            } else {
                out.push({ fullPath: e.fullPath, name: e.name });
            }
        }

        await Promise.all(nested);
    };

    await walk("");
    return out;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asRecord(value: unknown): Record<string, unknown> | null {
    return isRecord(value) ? value : null;
}

function parsePersistedLibraryItem(value: unknown): FitLibraryItem | null {
    const itemRecord = asRecord(value);
    const fullPath =
        typeof itemRecord?.["fullPath"] === "string"
            ? itemRecord["fullPath"]
            : "";
    const fileName =
        typeof itemRecord?.["fileName"] === "string"
            ? itemRecord["fileName"]
            : "";
    const startTime = coerceToDate(itemRecord?.["startTime"]);
    const totalDistanceM = coerceToNumber(itemRecord?.["totalDistanceM"]);
    const sport =
        typeof itemRecord?.["sport"] === "string"
            ? itemRecord["sport"]
            : undefined;

    if (!fullPath || !fileName || !startTime) {
        return null;
    }

    const item: FitLibraryItem = {
        fileName,
        fullPath,
        startTime,
        totalDistanceM,
    };
    if (sport !== undefined) {
        item.sport = sport;
    }

    return item;
}

function sortLibraryItemsByStartTimeDesc(
    items: readonly FitLibraryItem[]
): FitLibraryItem[] {
    const sorted: FitLibraryItem[] = [];
    for (const item of items) {
        const insertAt = sorted.findIndex(
            (existing) =>
                existing.startTime.getTime() < item.startTime.getTime()
        );
        if (insertAt === -1) {
            sorted.push(item);
        } else {
            sorted.splice(insertAt, 0, item);
        }
    }

    return sorted;
}

function sortSportBadgeCountsByCountDesc(
    counts: Iterable<SportBadgeCount>
): SportBadgeCount[] {
    const sorted: SportBadgeCount[] = [];
    for (const count of counts) {
        const insertAt = sorted.findIndex(
            (existing) => existing.count < count.count
        );
        if (insertAt === -1) {
            sorted.push(count);
        } else {
            sorted.splice(insertAt, 0, count);
        }
    }

    return sorted;
}

function loadPersistedLibraryCache(
    root: string
): FitLibraryCachePayload | null {
    try {
        const raw = fileBrowserTabRuntime().getStorageItem(
            getLibraryStorageKey(root)
        );
        if (!raw) {
            return null;
        }

        const parsed: unknown = JSON.parse(raw);
        const parsedRecord = asRecord(parsed);
        if (!parsedRecord) {
            return null;
        }

        const itemsRaw = parsedRecord["items"];
        const scannedAt = parsedRecord["scannedAt"];
        if (!Array.isArray(itemsRaw)) {
            return null;
        }

        const items: FitLibraryItem[] = [];
        for (const it of itemsRaw) {
            const item = parsePersistedLibraryItem(it);
            if (item) {
                items.push(item);
            }
        }

        const normalizedScannedAt =
            typeof scannedAt === "number" && Number.isFinite(scannedAt)
                ? scannedAt
                : fileBrowserTabRuntime().dateNow();

        return {
            items: sortLibraryItemsByStartTimeDesc(items),
            scannedAt: normalizedScannedAt,
        };
    } catch {
        return null;
    }
}

function loadSessionLibraryCache(root: string): FitLibraryCachePayload | null {
    return readFitBrowserLibraryCache(root);
}

function parentRelPath(relPath: string): string {
    const segments = splitPathSegments(relPath);
    segments.pop();
    return segments.join("/");
}

function isNonEmptyString(value: unknown): value is string {
    return typeof value === "string" && value.trim().length > 0;
}

function normalizePathSeparators(value: string): string {
    return value.replaceAll("\\", "/");
}

function splitPathSegments(value: string): string[] {
    return normalizePathSeparators(value)
        .split("/")
        .filter((segment: string) => segment.length > 0);
}

function isWindowsStylePath(value: string): boolean {
    const normalized = normalizePathSeparators(value.trim());
    return /^[A-Za-z]:\//u.test(normalized) || normalized.startsWith("//");
}

function getRelativePathWithinRoot(
    rootPath: string,
    fullPath: string
): string | null {
    if (!isNonEmptyString(rootPath) || !isNonEmptyString(fullPath)) {
        return null;
    }

    const rootSegments = splitPathSegments(rootPath);
    const fullSegments = splitPathSegments(fullPath);

    if (fullSegments.length <= rootSegments.length) {
        return null;
    }

    const caseInsensitive =
        isWindowsStylePath(rootPath) || isWindowsStylePath(fullPath);

    for (const [index, left] of rootSegments.entries()) {
        const right = fullSegments[index];
        if (typeof left !== "string" || typeof right !== "string") {
            return null;
        }

        if (caseInsensitive) {
            if (left.toLowerCase() !== right.toLowerCase()) {
                return null;
            }
            continue;
        }

        if (left !== right) {
            return null;
        }
    }

    return fullSegments.slice(rootSegments.length).join("/");
}

async function ensureBrowserFileReadApproval(
    api: FitBrowserElectronAPI,
    filePath: string
): Promise<boolean> {
    if (!isNonEmptyString(filePath)) {
        return false;
    }

    if (
        typeof api.getFitBrowserFolder !== "function" ||
        typeof api.listFitBrowserFolder !== "function"
    ) {
        return false;
    }

    if (!/\.fit$/iu.test(filePath.trim())) {
        return false;
    }

    const root = await api.getFitBrowserFolder();
    if (!isNonEmptyString(root)) {
        return false;
    }

    const relPath = getRelativePathWithinRoot(root, filePath);
    if (!isNonEmptyString(relPath)) {
        return false;
    }

    const parentPath = parentRelPath(relPath);
    const responseRaw = await api.listFitBrowserFolder(parentPath);
    return isFitBrowserListResponse(responseRaw);
}

async function openBrowserFile(filePath: string): Promise<void> {
    try {
        const api = getElectronAPI();
        if (!api) {
            showNotification("Browser is unavailable.", "error");
            return;
        }

        const approved = await ensureBrowserFileReadApproval(api, filePath);
        if (!approved) {
            showNotification(
                "File is unavailable for reading in the current Browser folder.",
                "error"
            );
            return;
        }

        const openFileBtn =
            fileBrowserTabRuntime().getElement<HTMLElement>("#open_file_btn");
        const openParams: {
            filePath: string;
            openFileBtn?: HTMLElement;
            showNotification: (
                message: string,
                type: string,
                timeout?: number
            ) => void;
        } = {
            filePath,
            showNotification,
        };
        if (fileBrowserTabRuntime().isHTMLElement(openFileBtn)) {
            openParams.openFileBtn = openFileBtn;
        }
        await openFitFileFromPath(openParams);
    } catch (error) {
        const message =
            error instanceof Error
                ? error.message
                : "Unknown browser open error";
        console.error("[fileBrowserTab] openBrowserFile failed", error);
        showNotification(`Failed to open file: ${message}`, "error", 8000);
    }
}

function parseMonthKey(raw: unknown): Date | null {
    if (typeof raw !== "string" || !/^\d{4}-\d{2}$/u.test(raw)) {
        return null;
    }
    const [yStr, mStr] = raw.split("-");
    const y = Number(yStr);
    const m = Number(mStr);
    if (!Number.isFinite(y) || !Number.isFinite(m)) {
        return null;
    }
    return new Date(y, m - 1, 1);
}

function persistCalendarState(state: CalendarState): void {
    try {
        const runtime = fileBrowserTabRuntime();
        runtime.setStorageItem(
            CAL_PREFS_MONTH_KEY,
            formatMonthKey(state.monthStart)
        );
        runtime.setStorageItem(
            CAL_PREFS_SELECTED_DAY_KEY,
            state.selectedDayKey
        );
    } catch {
        /* ignore */
    }
}

function persistLibraryCache(
    root: string,
    payload: FitLibraryCachePayload
): void {
    try {
        const serializable = {
            scannedAt: payload.scannedAt,
            items: payload.items.map((it) => ({
                fileName: it.fileName,
                fullPath: it.fullPath,
                sport: it.sport,
                startTime: it.startTime.toISOString(),
                totalDistanceM: it.totalDistanceM,
            })),
        };
        fileBrowserTabRuntime().setStorageItem(
            getLibraryStorageKey(root),
            JSON.stringify(serializable)
        );
    } catch {
        /* ignore */
    }
}

function persistLibraryPrefs(prefs: FitLibraryPrefs): void {
    try {
        const runtime = fileBrowserTabRuntime();
        runtime.setStorageItem(LIB_PREFS_LAST_DAYS_KEY, String(prefs.lastDays));
        runtime.setStorageItem(LIB_PREFS_UNIT_KEY, prefs.unit);
    } catch {
        /* ignore */
    }
}

async function refreshActiveView(): Promise<void> {
    const view = getBrowserView();
    const filesBtn = fileBrowserTabRuntime().getElement<HTMLElement>(
        "#fit-browser-view-files"
    );
    const libraryBtn = fileBrowserTabRuntime().getElement<HTMLElement>(
        "#fit-browser-view-library"
    );
    const calendarBtn = fileBrowserTabRuntime().getElement<HTMLElement>(
        "#fit-browser-view-calendar"
    );
    const listEl =
        fileBrowserTabRuntime().getElement<HTMLElement>("#fit-browser-list");
    const libraryEl = fileBrowserTabRuntime().getElement<HTMLElement>(
        "#fit-browser-library"
    );
    const calendarEl = fileBrowserTabRuntime().getElement<HTMLElement>(
        "#fit-browser-calendar"
    );

    if (filesBtn) {
        filesBtn.setAttribute(
            "aria-pressed",
            view === "files" ? "true" : "false"
        );
        filesBtn.classList.toggle(
            "file-browser__seg-btn--active",
            view === "files"
        );
    }
    if (libraryBtn) {
        libraryBtn.setAttribute(
            "aria-pressed",
            view === "library" ? "true" : "false"
        );
        libraryBtn.classList.toggle(
            "file-browser__seg-btn--active",
            view === "library"
        );
    }
    if (calendarBtn) {
        calendarBtn.setAttribute(
            "aria-pressed",
            view === "calendar" ? "true" : "false"
        );
        calendarBtn.classList.toggle(
            "file-browser__seg-btn--active",
            view === "calendar"
        );
    }

    setElementVisible(
        fileBrowserTabRuntime().isHTMLElement(listEl) ? listEl : null,
        view === "files"
    );
    setElementVisible(
        fileBrowserTabRuntime().isHTMLElement(libraryEl) ? libraryEl : null,
        view === "library"
    );
    setElementVisible(
        fileBrowserTabRuntime().isHTMLElement(calendarEl) ? calendarEl : null,
        view === "calendar"
    );

    if (view === "files") {
        await refreshListing();
        return;
    }

    if (view === "library") {
        await renderLibraryView();
        return;
    }

    await renderCalendarView();
}

async function refreshListing(): Promise<void> {
    const api = getElectronAPI();
    const pathEl = fileBrowserTabRuntime().getElement<HTMLElement>(
        "#fit-browser-current-path"
    );
    const listEl =
        fileBrowserTabRuntime().getElement<HTMLElement>("#fit-browser-list");

    if (!pathEl || !listEl) {
        return;
    }

    if (
        !api ||
        typeof api.getFitBrowserFolder !== "function" ||
        typeof api.listFitBrowserFolder !== "function"
    ) {
        pathEl.textContent = "Browser unavailable (Electron API missing)";
        setBrowserStatus("Browser unavailable.");
        setBrowserListingState({
            error: "Electron Browser API is unavailable.",
            status: "error",
        });
        listEl.replaceChildren();
        return;
    }

    setBrowserStatus("Loading folder...", true);
    setBrowserListingState({ status: "loading" });

    const root = await api.getFitBrowserFolder();
    const rel = getBrowserRelPath();

    if (!root) {
        pathEl.textContent = "No folder selected";
        setBrowserStatus("No folder selected.");
        setBrowserListingState({ status: "unselected" });
        listEl.replaceChildren(
            createEmptyMessage("Choose a folder to browse .fit files.")
        );
        return;
    }

    const responseRaw = await api.listFitBrowserFolder(rel);
    if (!isFitBrowserListResponse(responseRaw)) {
        pathEl.textContent = root;
        setBrowserStatus("Folder could not be loaded.");
        setBrowserListingState({
            error: "Folder could not be loaded.",
            relPath: rel,
            root,
            status: "error",
        });
        listEl.replaceChildren(createEmptyMessage("Unable to list folder."));
        return;
    }

    const response = responseRaw;
    const { entries, relPath } = response;

    const displayPath = relPath
        ? `${root} / ${relPath.replaceAll("/", " / ")}`
        : root;
    pathEl.textContent = displayPath;

    listEl.replaceChildren();

    const fileCount = entries.filter((entry) => entry.kind === "file").length;
    const folderCount = entries.length - fileCount;
    const locationLabel = relPath ? relPath.replaceAll("/", " / ") : "root";
    const loadedAt = fileBrowserTabRuntime().dateNow();
    setBrowserStatus(
        `Loaded ${entries.length} item${entries.length === 1 ? "" : "s"} from ${locationLabel} at ${formatLoadedAt(loadedAt)} (${fileCount} file${fileCount === 1 ? "" : "s"}, ${folderCount} folder${folderCount === 1 ? "" : "s"}).`
    );
    setBrowserListingState({
        fileCount,
        folderCount,
        itemCount: entries.length,
        loadedAt,
        relPath,
        root,
        status: entries.length === 0 ? "empty" : "loaded",
    });

    if (relPath) {
        const up = createBrowserItemButton("dir", "arrowLeft", "..");
        addManagedEventListener(up, "click", async () => {
            setBrowserRelPath(parentRelPath(relPath), {
                source: "fileBrowser.up",
            });
            await refreshListing();
        });
        listEl.append(up);
    }

    if (entries.length === 0) {
        listEl.append(
            createEmptyMessage("No .fit files found in this folder.")
        );
        return;
    }

    for (const entry of entries) {
        const { kind, name, relPath: entryRelPath, fullPath } = entry;
        const iconName = kind === "dir" ? "folder" : "file";
        const btn = createBrowserItemButton(kind, iconName, name);

        if (kind === "dir") {
            addManagedEventListener(btn, "click", async () => {
                setBrowserRelPath(entryRelPath, {
                    source: "fileBrowser.enterDir",
                });
                await refreshListing();
            });
        } else {
            addManagedEventListener(btn, "click", async () => {
                await openBrowserFile(fullPath);
            });
        }

        listEl.append(btn);
    }
}

function createBrowserItemButton(
    kind: "dir" | "file",
    iconName: AppIconName,
    label: string
): HTMLButtonElement {
    const button = fileBrowserTabRuntime().createElement("button");
    button.type = "button";
    button.className = `file-browser__item ${
        kind === "dir" ? "file-browser__item--dir" : "file-browser__item--file"
    }`;
    appendIconLabel(
        button,
        iconName,
        "file-browser__item-icon",
        label,
        "file-browser__item-label",
        14
    );

    return button;
}

function renderCalendarResults(
    root: string,
    payload: FitLibraryCachePayload | null
): void {
    const titleEl = fileBrowserTabRuntime().getElement<HTMLElement>(
        "#fit-calendar-title"
    );
    const gridEl =
        fileBrowserTabRuntime().getElement<HTMLElement>("#fit-calendar-grid");
    const panelEl = fileBrowserTabRuntime().getElement<HTMLElement>(
        "#fit-calendar-panel"
    );

    if (
        !fileBrowserTabRuntime().isHTMLElement(gridEl) ||
        !fileBrowserTabRuntime().isHTMLElement(panelEl)
    ) {
        return;
    }

    if (!payload) {
        if (titleEl) {
            titleEl.textContent = "Calendar";
        }
        gridEl.replaceChildren(
            createEmptyMessage('No scan results yet. Click "Scan folder".')
        );
        panelEl.replaceChildren(
            createEmptyMessage(
                "No activities to display.",
                "file-calendar__panelEmpty"
            )
        );
        return;
    }

    const prefs = getLibraryPrefs();
    const unitFactor = prefs.unit === "mi" ? 1 / 1609.344 : 1 / 1000;
    const unitLabel = prefs.unit;
    const fmt = (meters: number): string => (meters * unitFactor).toFixed(1);

    const state = getCalendarState();
    const { monthStart, selectedDayKey } = state;
    const monthLabel = monthStart.toLocaleString(undefined, {
        month: "long",
        year: "numeric",
    });
    if (titleEl) {
        titleEl.textContent = `${monthLabel} — ${root}`;
    }

    const itemsByDay = groupItemsByDay(payload.items);

    const weekdayLabels = [
        "Mon",
        "Tue",
        "Wed",
        "Thu",
        "Fri",
        "Sat",
        "Sun",
    ];
    const firstDay = new Date(
        monthStart.getFullYear(),
        monthStart.getMonth(),
        1
    );
    const firstDow = firstDay.getDay();
    const firstIso = firstDow === 0 ? 7 : firstDow;
    const offset = firstIso - 1; // 0..6 where 0 is Monday
    const gridStart = new Date(firstDay);
    gridStart.setDate(firstDay.getDate() - offset);

    const todayKey = formatLocalDayKey(new Date());

    const gridItems = [];
    for (const wd of weekdayLabels) {
        const weekday = fileBrowserTabRuntime().createElement("div");
        weekday.className = "file-calendar__weekday";
        weekday.textContent = wd;
        gridItems.push(weekday);
    }

    for (let i = 0; i < 42; i += 1) {
        const day = new Date(gridStart);
        day.setDate(gridStart.getDate() + i);
        const dayKey = formatLocalDayKey(day);
        const inMonth = day.getMonth() === monthStart.getMonth();
        const isToday = dayKey === todayKey;
        const isSelected = dayKey === selectedDayKey;

        const dayItems = itemsByDay.get(dayKey) ?? [];
        const dayDistance = dayItems.reduce(
            (acc, it) => acc + it.totalDistanceM,
            0
        );

        const button = createCalendarDayButton({
            day,
            dayDistance,
            dayItems,
            dayKey,
            inMonth,
            isSelected,
            isToday,
            unitLabel,
            formatDistance: fmt,
        });
        addManagedEventListener(button, "click", () => {
            const next = { ...getCalendarState(), selectedDayKey: dayKey };
            persistCalendarState(next);
            renderCalendarResults(root, payload);
        });
        gridItems.push(button);
    }

    gridEl.replaceChildren(...gridItems);

    // Selected-day panel
    const selectedItems = itemsByDay.get(selectedDayKey) ?? [];
    if (selectedItems.length === 0) {
        panelEl.replaceChildren(
            createCalendarPanelTitle(selectedDayKey),
            createEmptyMessage("No activities.", "file-calendar__panelEmpty")
        );
        return;
    }

    const rows = createLibraryRows(
        sortLibraryItemsByStartTimeDesc(selectedItems),
        unitLabel,
        fmt,
        { includeSportBadge: true, useTimeOnly: true }
    );
    panelEl.replaceChildren(createCalendarPanelTitle(selectedDayKey), rows);
}

function createCalendarDayButton({
    day,
    dayDistance,
    dayItems,
    dayKey,
    formatDistance,
    inMonth,
    isSelected,
    isToday,
    unitLabel,
}: {
    day: Date;
    dayDistance: number;
    dayItems: FitLibraryItem[];
    dayKey: string;
    formatDistance: (meters: number) => string;
    inMonth: boolean;
    isSelected: boolean;
    isToday: boolean;
    unitLabel: DistanceUnit;
}): HTMLButtonElement {
    const button = fileBrowserTabRuntime().createElement("button");
    button.type = "button";
    button.className = "file-calendar__day";
    button.dataset["day"] = dayKey;

    if (!inMonth) button.classList.add("file-calendar__day--outside");
    if (isToday) button.classList.add("file-calendar__day--today");
    if (isSelected) button.classList.add("file-calendar__day--selected");
    if (dayItems.length > 0) {
        button.classList.add("file-calendar__day--hasActivities");
        button.dataset["tooltip"] =
            `${dayKey} • ${formatDistance(dayDistance)} ${unitLabel} • ${formatActivityLabel(dayItems.length)}`;
    } else {
        button.dataset["tooltip"] = dayKey;
    }
    if (dayItems.length > 1) button.classList.add("file-calendar__day--multi");

    const dayNumber = fileBrowserTabRuntime().createElement("div");
    dayNumber.className = "file-calendar__dayNumber";
    dayNumber.textContent = String(day.getDate());

    const dayMeta = fileBrowserTabRuntime().createElement("div");
    dayMeta.className = "file-calendar__dayMeta";
    if (dayItems.length > 0) {
        const distance = fileBrowserTabRuntime().createElement("div");
        distance.className = "file-calendar__dayDistance";
        distance.textContent = `${formatDistance(dayDistance)} ${unitLabel}`;

        const count = fileBrowserTabRuntime().createElement("div");
        count.className = "file-calendar__dayCount";
        count.textContent = formatActivityLabel(dayItems.length);

        dayMeta.append(distance, count, createCalendarDayIconRow(dayItems));
    }

    button.append(dayNumber, dayMeta);

    return button;
}

function createCalendarDayIconRow(items: FitLibraryItem[]): HTMLElement {
    const iconRow = fileBrowserTabRuntime().createElement("div");
    iconRow.className = "file-calendar__dayIcons";
    iconRow.setAttribute("aria-hidden", "true");

    const badges = createSportBadgeCounts(items);
    const shown = badges.slice(0, 3);
    const remainder = Math.max(0, badges.length - shown.length);

    for (const badge of shown) {
        const icon = fileBrowserTabRuntime().createElement("span");
        icon.className = "file-calendar__dayIcon";
        icon.dataset["sport"] = badge.key;
        icon.dataset["count"] = String(badge.count);
        icon.dataset["tooltip"] =
            badge.count > 0 ? `${badge.label} (${badge.count})` : badge.label;
        icon.textContent = badge.emoji;
        iconRow.append(icon);
    }

    if (remainder > 0) {
        const more = fileBrowserTabRuntime().createElement("span");
        more.className = "file-calendar__dayIconMore";
        more.textContent = `+${remainder}`;
        iconRow.append(more);
    }

    return iconRow;
}

function createSportBadgeCounts(items: FitLibraryItem[]): SportBadgeCount[] {
    const bySport = new Map<string, SportBadgeCount>();
    for (const item of items) {
        const badge = getSportBadge(item.sport);
        const existing = bySport.get(badge.key);
        if (existing) {
            existing.count += 1;
        } else {
            bySport.set(badge.key, { ...badge, count: 1 });
        }
    }

    return sortSportBadgeCountsByCountDesc(bySport.values());
}

function createCalendarPanelTitle(dayKey: string): HTMLElement {
    const title = fileBrowserTabRuntime().createElement("div");
    title.className = "file-calendar__panelTitle";
    title.textContent = dayKey;

    return title;
}

function formatActivityLabel(count: number): string {
    return `${count} ${count === 1 ? "activity" : "activities"}`;
}

function getSportBadge(sport: string | undefined): SportBadge {
    const raw = typeof sport === "string" ? sport.trim() : "";
    const sportLower = raw.toLowerCase();

    if (
        sportLower.includes("cycling") ||
        sportLower.includes("bike") ||
        sportLower.includes("biking")
    ) {
        return { emoji: "🚴", key: "cycling", label: "Cycling" };
    }
    if (sportLower.includes("run")) {
        return { emoji: "🏃", key: "running", label: "Running" };
    }
    if (sportLower.includes("walk")) {
        return { emoji: "🚶", key: "walking", label: "Walking" };
    }
    if (sportLower.includes("swim")) {
        return { emoji: "🏊", key: "swimming", label: "Swimming" };
    }
    if (sportLower.includes("hike")) {
        return { emoji: "🥾", key: "hiking", label: "Hiking" };
    }
    if (sportLower.includes("row")) {
        return { emoji: "🚣", key: "rowing", label: "Rowing" };
    }

    return { emoji: "🏁", key: "other", label: raw || "Activity" };
}

function createCalendarScaffold(): HTMLElement {
    const calendar = fileBrowserTabRuntime().createElement("div");
    calendar.className = "file-calendar";

    const header = fileBrowserTabRuntime().createElement("div");
    header.className = "file-calendar__header";

    const title = fileBrowserTabRuntime().createElement("div");
    title.className = "file-calendar__title";
    title.id = "fit-calendar-title";

    const nav = fileBrowserTabRuntime().createElement("div");
    nav.className = "file-calendar__nav";
    nav.append(
        createBrowserActionButton({
            id: "fit-calendar-prev",
            iconName: "arrowLeft",
            label: "Prev",
            tooltip: "Previous month",
        }),
        createBrowserActionButton({
            id: "fit-calendar-today",
            iconName: "calendar",
            label: "Today",
            tooltip: "Jump to today",
        }),
        createBrowserActionButton({
            id: "fit-calendar-next",
            iconName: "arrowRight",
            label: "Next",
            tooltip: "Next month",
        }),
        createBrowserActionButton({
            id: "fit-calendar-scan",
            iconName: "database",
            label: "Scan folder",
            tooltip: "Scan folder for activities",
        })
    );

    header.append(title, nav);

    const grid = fileBrowserTabRuntime().createElement("div");
    grid.className = "file-calendar__grid";
    grid.id = "fit-calendar-grid";

    const panel = fileBrowserTabRuntime().createElement("div");
    panel.className = "file-calendar__panel";
    panel.id = "fit-calendar-panel";

    calendar.append(header, grid, panel);

    return calendar;
}

function createBrowserActionButton({
    id,
    iconName,
    label,
    tooltip,
}: {
    id: string;
    iconName: AppIconName;
    label: string;
    tooltip?: string;
}): HTMLButtonElement {
    const button = fileBrowserTabRuntime().createElement("button");
    button.type = "button";
    button.className = "file-browser__btn";
    button.id = id;
    if (tooltip) {
        button.dataset["tooltip"] = tooltip;
    }
    appendIconLabel(button, iconName, "file-browser__btn-icon", label, "", 14);

    return button;
}

/**
 * Render the Calendar view.
 */
async function renderCalendarView(): Promise<void> {
    const api = getElectronAPI();
    const pathEl = fileBrowserTabRuntime().getElement<HTMLElement>(
        "#fit-browser-current-path"
    );
    const calendarEl = fileBrowserTabRuntime().getElement<HTMLElement>(
        "#fit-browser-calendar"
    );
    if (
        !fileBrowserTabRuntime().isHTMLElement(calendarEl) ||
        !fileBrowserTabRuntime().isHTMLElement(pathEl)
    ) {
        return;
    }

    if (!api || typeof api.getFitBrowserFolder !== "function") {
        pathEl.textContent = "Browser unavailable (Electron API missing)";
        setBrowserStatus("Browser unavailable.");
        delete calendarEl.dataset["ffvCalendarInitialized"];
        calendarEl.replaceChildren();
        return;
    }

    setBrowserStatus("Loading calendar...", true);

    const root = await api.getFitBrowserFolder();
    if (!root) {
        pathEl.textContent = "No folder selected";
        setBrowserStatus("No folder selected.");
        delete calendarEl.dataset["ffvCalendarInitialized"];
        calendarEl.replaceChildren(
            createEmptyMessage("Choose a folder to view the calendar.")
        );
        return;
    }

    const cached =
        loadPersistedLibraryCache(root) ?? loadSessionLibraryCache(root);
    const loadedAt = fileBrowserTabRuntime().dateNow();
    setBrowserStatus(
        cached
            ? `Loaded calendar with ${cached.items.length} decoded activit${cached.items.length === 1 ? "y" : "ies"} at ${formatLoadedAt(loadedAt)}.`
            : `Loaded folder at ${formatLoadedAt(loadedAt)}. Scan folder to populate the calendar.`
    );

    if (!calendarEl.dataset["ffvCalendarInitialized"]) {
        calendarEl.dataset["ffvCalendarInitialized"] = "true";
        calendarEl.replaceChildren(createCalendarScaffold());

        const prevBtn =
            fileBrowserTabRuntime().getElement<HTMLElement>(
                "#fit-calendar-prev"
            );
        const nextBtn =
            fileBrowserTabRuntime().getElement<HTMLElement>(
                "#fit-calendar-next"
            );
        const todayBtn = fileBrowserTabRuntime().getElement<HTMLElement>(
            "#fit-calendar-today"
        );
        const scanBtn =
            fileBrowserTabRuntime().getElement<HTMLElement>(
                "#fit-calendar-scan"
            );

        if (prevBtn) {
            addManagedEventListener(prevBtn, "click", () => {
                const st = getCalendarState();
                const next = {
                    ...st,
                    monthStart: addMonths(st.monthStart, -1),
                };
                persistCalendarState(next);
                renderCalendarResults(
                    root,
                    loadPersistedLibraryCache(root) ??
                        loadSessionLibraryCache(root)
                );
            });
        }

        if (nextBtn) {
            addManagedEventListener(nextBtn, "click", () => {
                const st = getCalendarState();
                const next = {
                    ...st,
                    monthStart: addMonths(st.monthStart, 1),
                };
                persistCalendarState(next);
                renderCalendarResults(
                    root,
                    loadPersistedLibraryCache(root) ??
                        loadSessionLibraryCache(root)
                );
            });
        }

        if (todayBtn) {
            addManagedEventListener(todayBtn, "click", () => {
                const now = new Date();
                const next = {
                    monthStart: new Date(now.getFullYear(), now.getMonth(), 1),
                    selectedDayKey: formatLocalDayKey(now),
                };
                persistCalendarState(next);
                renderCalendarResults(
                    root,
                    loadPersistedLibraryCache(root) ??
                        loadSessionLibraryCache(root)
                );
            });
        }

        if (scanBtn) {
            addManagedEventListener(scanBtn, "click", async () => {
                await scanAndRenderLibrary(root);
                renderCalendarResults(
                    root,
                    loadPersistedLibraryCache(root) ??
                        loadSessionLibraryCache(root)
                );
            });
        }
    }

    renderCalendarResults(root, cached);
}

function createLibraryCard(
    iconName: AppIconName,
    label: string,
    value: string
): HTMLElement {
    const card = fileBrowserTabRuntime().createElement("div");
    card.className = "file-library__card";

    const cardLabel = fileBrowserTabRuntime().createElement("div");
    cardLabel.className = "file-library__cardLabel";
    appendIconLabel(
        cardLabel,
        iconName,
        "file-library__cardIcon",
        label,
        "",
        13
    );

    const cardValue = fileBrowserTabRuntime().createElement("div");
    cardValue.className = "file-library__cardValue";
    cardValue.textContent = value;

    card.append(cardLabel, cardValue);

    return card;
}

function createLibraryRows(
    items: FitLibraryItem[],
    unitLabel: DistanceUnit,
    formatDistance: (meters: number) => string,
    options: LibraryRowOptions
): HTMLElement {
    const rows = fileBrowserTabRuntime().createElement("div");
    rows.className = "file-library__rows";

    for (const item of items) {
        const row = fileBrowserTabRuntime().createElement("button");
        row.type = "button";
        row.className = "file-library__row";
        row.dataset["fullpath"] = item.fullPath;
        addManagedEventListener(row, "click", async () => {
            await openBrowserFile(item.fullPath);
        });

        const main = fileBrowserTabRuntime().createElement("span");
        main.className = "file-library__rowMain";

        if (options.includeSportBadge) {
            const badge = getSportBadge(item.sport);
            const icon = fileBrowserTabRuntime().createElement("span");
            icon.className = "file-calendar__rowIcon";
            icon.dataset["tooltip"] = badge.label;
            icon.setAttribute("aria-hidden", "true");
            icon.textContent = badge.emoji;
            main.append(
                icon,
                fileBrowserTabRuntime().createTextNode(` ${item.fileName}`)
            );
        } else {
            const fileName = fileBrowserTabRuntime().createElement("span");
            fileName.textContent = item.fileName;
            main.append(
                createAppIconElement("file", {
                    className: "file-library__rowIcon",
                    size: 13,
                }),
                fileName
            );
        }

        const when = options.useTimeOnly
            ? item.startTime.toLocaleTimeString(undefined, {
                  hour: "2-digit",
                  minute: "2-digit",
              })
            : item.startTime.toLocaleString();
        const sport = item.sport ? ` — ${item.sport}` : "";
        const meta = fileBrowserTabRuntime().createElement("span");
        meta.className = "file-library__rowMeta";
        meta.textContent = `${when} • ${formatDistance(item.totalDistanceM)} ${unitLabel}${sport}`;

        row.append(main, meta);
        rows.append(row);
    }

    return rows;
}

function createLibraryScaffold(): HTMLElement {
    const library = fileBrowserTabRuntime().createElement("div");
    library.className = "file-library";

    const header = fileBrowserTabRuntime().createElement("div");
    header.className = "file-library__header";

    const title = fileBrowserTabRuntime().createElement("div");
    title.className = "file-library__title";
    appendIconLabel(
        title,
        "folder",
        "file-library__titleIcon",
        "Folder Summary",
        "",
        16
    );

    const controls = fileBrowserTabRuntime().createElement("div");
    controls.className = "file-library__controls";
    controls.append(
        createLibraryDaysControl(),
        createLibraryUnitControl(),
        createBrowserActionButton({
            id: "fit-library-scan",
            iconName: "database",
            label: "Scan folder",
        })
    );

    header.append(title, controls);

    const status = fileBrowserTabRuntime().createElement("div");
    status.className = "file-library__status";
    status.id = "fit-library-status";

    const cards = fileBrowserTabRuntime().createElement("div");
    cards.className = "file-library__grid";
    cards.id = "fit-library-cards";

    const activities = fileBrowserTabRuntime().createElement("div");
    activities.className = "file-library__list";
    activities.id = "fit-library-activities";

    library.append(header, status, cards, activities);

    return library;
}

function createLibraryDaysControl(): HTMLLabelElement {
    const label = fileBrowserTabRuntime().createElement("label");
    label.className = "file-library__control";

    const intro = fileBrowserTabRuntime().createElement("span");
    intro.className = "file-library__controlLabel";
    appendIconLabel(
        intro,
        "history",
        "file-library__controlIcon",
        "Last",
        "",
        12
    );

    const input = fileBrowserTabRuntime().createElement("input");
    input.type = "number";
    input.min = "1";
    input.max = "3650";
    input.step = "1";
    input.className = "file-library__daysInput";
    input.id = "fit-library-days";

    const suffix = fileBrowserTabRuntime().createElement("span");
    suffix.className = "file-library__controlLabel";
    suffix.textContent = "days";

    label.append(intro, input, suffix);

    return label;
}

function createLibraryUnitControl(): HTMLLabelElement {
    const label = fileBrowserTabRuntime().createElement("label");
    label.className = "file-library__control";

    const intro = fileBrowserTabRuntime().createElement("span");
    intro.className = "file-library__controlLabel";
    appendIconLabel(
        intro,
        "ruler",
        "file-library__controlIcon",
        "Units",
        "",
        12
    );

    const select = fileBrowserTabRuntime().createElement("select");
    select.className = "file-library__unitSelect";
    select.id = "fit-library-unit";

    for (const value of ["km", "mi"]) {
        const option = fileBrowserTabRuntime().createElement("option");
        option.value = value;
        option.textContent = value;
        select.append(option);
    }

    label.append(intro, select);

    return label;
}

function renderLibraryResults(
    root: string,
    payload: FitLibraryCachePayload
): void {
    const statusEl = fileBrowserTabRuntime().getElement<HTMLElement>(
        "#fit-library-status"
    );
    const cardsEl =
        fileBrowserTabRuntime().getElement<HTMLElement>("#fit-library-cards");
    const listEl = fileBrowserTabRuntime().getElement<HTMLElement>(
        "#fit-library-activities"
    );

    const prefs = getLibraryPrefs();
    const totals = computeLibraryTotals(payload.items, prefs.lastDays);
    const unitFactor = prefs.unit === "mi" ? 1 / 1609.344 : 1 / 1000;
    const unitLabel = prefs.unit;
    const fmt = (meters: number): string => (meters * unitFactor).toFixed(1);

    if (statusEl) {
        const scanned = payload?.scannedAt ? new Date(payload.scannedAt) : null;
        statusEl.textContent = scanned
            ? `Scanned ${scanned.toLocaleString()} — ${root}`
            : root;
    }

    if (cardsEl) {
        const lastDaysVal = fmt(totals.lastDaysDistanceM);
        const weekVal = fmt(totals.weekDistanceM);
        const monthVal = fmt(totals.monthDistanceM);
        cardsEl.replaceChildren(
            createLibraryCard("file", "Files", String(payload.items.length)),
            createLibraryCard(
                "history",
                `Last ${prefs.lastDays} days`,
                `${lastDaysVal} ${unitLabel}`
            ),
            createLibraryCard(
                "calendarWeek",
                "This week",
                `${weekVal} ${unitLabel}`
            ),
            createLibraryCard(
                "calendarRange",
                "This month",
                `${monthVal} ${unitLabel}`
            )
        );
    }

    if (listEl) {
        const items = Array.isArray(payload?.items)
            ? payload.items.slice(0, 50)
            : [];
        if (items.length === 0) {
            listEl.replaceChildren(
                createEmptyMessage("No activities decoded.")
            );
            return;
        }

        listEl.replaceChildren(
            createLibraryRows(items, unitLabel, fmt, {
                includeSportBadge: false,
                useTimeOnly: false,
            })
        );
    }
}

async function renderLibraryView(): Promise<void> {
    const api = getElectronAPI();
    const pathEl = fileBrowserTabRuntime().getElement<HTMLElement>(
        "#fit-browser-current-path"
    );
    const libraryEl = fileBrowserTabRuntime().getElement<HTMLElement>(
        "#fit-browser-library"
    );

    if (
        !fileBrowserTabRuntime().isHTMLElement(libraryEl) ||
        !fileBrowserTabRuntime().isHTMLElement(pathEl)
    ) {
        return;
    }

    if (
        !api ||
        typeof api.getFitBrowserFolder !== "function" ||
        typeof api.listFitBrowserFolder !== "function"
    ) {
        pathEl.textContent = "Browser unavailable (Electron API missing)";
        setBrowserStatus("Browser unavailable.");
        delete libraryEl.dataset["ffvLibraryInitialized"];
        libraryEl.replaceChildren();
        return;
    }

    setBrowserStatus("Loading library...", true);

    const root = await api.getFitBrowserFolder();
    if (!root) {
        pathEl.textContent = "No folder selected";
        setBrowserStatus("No folder selected.");
        delete libraryEl.dataset["ffvLibraryInitialized"];
        libraryEl.replaceChildren(
            createEmptyMessage("Choose a folder to build a library summary.")
        );
        return;
    }

    // One-time scaffold.
    if (!libraryEl.dataset["ffvLibraryInitialized"]) {
        libraryEl.dataset["ffvLibraryInitialized"] = "true";
        libraryEl.replaceChildren(createLibraryScaffold());

        const scanBtn =
            fileBrowserTabRuntime().getElement<HTMLElement>(
                "#fit-library-scan"
            );
        if (scanBtn) {
            addManagedEventListener(scanBtn, "click", async () => {
                await scanAndRenderLibrary(root);
            });
        }

        // Initialize controls from persisted prefs.
        const prefs = getLibraryPrefs();
        const daysInput =
            fileBrowserTabRuntime().getElement<HTMLInputElement>(
                "#fit-library-days"
            );
        const unitSelect =
            fileBrowserTabRuntime().getElement<HTMLSelectElement>(
                "#fit-library-unit"
            );

        if (fileBrowserTabRuntime().isHTMLInputElement(daysInput)) {
            daysInput.value = String(prefs.lastDays);
            addManagedEventListener(daysInput, "change", () => {
                const next = Number(daysInput.value);
                const nextDays = Number.isFinite(next)
                    ? Math.max(1, Math.min(3650, Math.floor(next)))
                    : prefs.lastDays;
                persistLibraryPrefs({
                    ...getLibraryPrefs(),
                    lastDays: nextDays,
                });

                const cached =
                    loadPersistedLibraryCache(root) ??
                    loadSessionLibraryCache(root);
                if (cached) {
                    renderLibraryResults(root, cached);
                }
            });
        }

        if (fileBrowserTabRuntime().isHTMLSelectElement(unitSelect)) {
            unitSelect.value = prefs.unit;
            addManagedEventListener(unitSelect, "change", () => {
                const nextUnit = unitSelect.value === "mi" ? "mi" : "km";
                persistLibraryPrefs({ ...getLibraryPrefs(), unit: nextUnit });

                const cached =
                    loadPersistedLibraryCache(root) ??
                    loadSessionLibraryCache(root);
                if (cached) {
                    renderLibraryResults(root, cached);
                }
            });
        }
    }

    // If we have cached results for this root (session + persisted), show them.
    const cachedForRoot =
        loadPersistedLibraryCache(root) ?? loadSessionLibraryCache(root);
    const loadedAt = fileBrowserTabRuntime().dateNow();
    if (cachedForRoot) {
        setBrowserStatus(
            `Loaded folder summary with ${cachedForRoot.items.length} decoded activit${cachedForRoot.items.length === 1 ? "y" : "ies"} at ${formatLoadedAt(loadedAt)}.`
        );
        renderLibraryResults(root, cachedForRoot);
        return;
    }

    setBrowserStatus(
        `Loaded folder at ${formatLoadedAt(loadedAt)}. Scan folder to compute totals.`
    );
    const statusEl = fileBrowserTabRuntime().getElement<HTMLElement>(
        "#fit-library-status"
    );
    if (statusEl) {
        statusEl.textContent =
            "Click ‘Scan folder’ to compute weekly/monthly totals.";
    }
}

async function scanAndRenderLibrary(root: string): Promise<void> {
    const api = getElectronAPI();
    const statusEl = fileBrowserTabRuntime().getElement<HTMLElement>(
        "#fit-library-status"
    );
    if (
        !api ||
        typeof api.listFitBrowserFolder !== "function" ||
        typeof api.decodeFitFile !== "function" ||
        typeof api.readFile !== "function"
    ) {
        setBrowserScanState({
            error: "Electron Browser scan API is unavailable.",
            root,
            status: "unavailable",
        });
        showNotification(
            "Library scan is unavailable (Electron API missing).",
            "error"
        );
        return;
    }

    const libraryApi: FitBrowserDecodeApi & FitBrowserListApi = {
        decodeFitFile: api.decodeFitFile,
        listFitBrowserFolder: api.listFitBrowserFolder,
        readFile: api.readFile,
    };

    try {
        setBrowserStatus("Scanning folder...", true);
        setBrowserScanState({ root, status: "listing" });
        if (statusEl) statusEl.textContent = "Listing files…";

        const files = await listAllFitFiles(libraryApi);
        if (files.length === 0) {
            const scannedAt = fileBrowserTabRuntime().dateNow();
            if (statusEl) statusEl.textContent = "No .fit files found.";
            renderLibraryResults(root, { items: [], scannedAt });
            setBrowserStatus(`Scanned ${root}. No FIT files found.`);
            setBrowserScanState({
                fileCount: 0,
                root,
                scannedAt,
                status: "completed",
            });
            return;
        }

        setBrowserScanState({
            fileCount: files.length,
            root,
            status: "decoding",
        });

        if (files.length > 500) {
            showNotification(
                `Large folder detected (${files.length} FIT files). Scanning may take a while.`,
                "info",
                5000
            );
        }

        // Decode with small concurrency to keep UI responsive.
        const concurrency = 2;
        const limit = pLimitCompat(concurrency);
        let done = 0;

        const items: FitLibraryItem[] = [];

        const tasks = files.map((file) =>
            limit(async () => {
                const res = await decodeLibraryItem(libraryApi, file);
                done += 1;
                if (statusEl) {
                    statusEl.textContent = `Decoding ${Math.min(done, files.length)} / ${files.length}…`;
                }
                if (res) {
                    items.push(res);
                }
                setBrowserScanState({
                    decodedActivityCount: items.length,
                    fileCount: files.length,
                    processedFileCount: Math.min(done, files.length),
                    root,
                    status: "decoding",
                });
            })
        );

        await Promise.allSettled(tasks);

        const scannedAt = fileBrowserTabRuntime().dateNow();
        const payload = {
            items: sortLibraryItemsByStartTimeDesc(items),
            scannedAt,
        };
        writeSessionLibraryCache(root, payload);
        persistLibraryCache(root, payload);
        setBrowserStatus(
            `Decoded ${payload.items.length} activit${payload.items.length === 1 ? "y" : "ies"} from this folder at ${formatLoadedAt(scannedAt)}.`
        );
        setBrowserScanState({
            decodedActivityCount: payload.items.length,
            fileCount: files.length,
            processedFileCount: files.length,
            root,
            scannedAt,
            status: "completed",
        });

        renderLibraryResults(root, payload);
    } catch (error) {
        console.error("[fileBrowserTab] Library scan failed", error);
        if (statusEl) statusEl.textContent = "Scan failed.";
        setBrowserStatus("Folder scan failed.");
        setBrowserScanState({
            error: getScanErrorMessage(error),
            root,
            status: "error",
        });
        showNotification("Failed to scan folder.", "error");
    }
}

function setElementVisible(el: HTMLElement | null, visible: boolean): void {
    if (!el) return;
    el.hidden = !visible;
    el.style.display = visible ? "" : "none";
}

function startOfLocalWeek(date: Date): Date {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const day = d.getDay();
    const isoDay = day === 0 ? 7 : day;
    d.setDate(d.getDate() - (isoDay - 1));
    d.setHours(0, 0, 0, 0);
    return d;
}

function writeSessionLibraryCache(
    root: string,
    payload: FitLibraryCachePayload
): void {
    writeFitBrowserLibraryCache(root, payload);
}
