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

import pLimitCompat from "../../async/pLimitCompat.js";
import { openFitFileFromPath } from "../../files/import/openFitFileFromPath.js";
import { getState, setState } from "../../state/core/stateManager.js";
import { getElementByIdFlexible } from "../dom/elementIdUtils.js";
import { createAppIconElement } from "../icons/iconFactory.js";
import { showNotification } from "../notifications/showNotification.js";

/**
 * @typedef {{
 *     name: string;
 *     kind: "dir" | "file";
 *     relPath: string;
 *     fullPath: string;
 * }} FitBrowserEntry
 */
/**
 * @typedef {{
 *     root: string | null;
 *     relPath: string;
 *     entries: FitBrowserEntry[];
 * }} FitBrowserListResponse
 */

const TAB_STATE_PATH_REL = "browser.relPath";
const TAB_STATE_VIEW = "browser.view";

const LIB_PREFS_LAST_DAYS_KEY = "fitLibrary.lastDays";
const LIB_PREFS_UNIT_KEY = "fitLibrary.unit";
const CAL_PREFS_MONTH_KEY = "fitLibrary.calendarMonth";
const CAL_PREFS_SELECTED_DAY_KEY = "fitLibrary.calendarSelectedDay";

/** @typedef {"km" | "mi"} DistanceUnit */

/**
 * @typedef {object} CalendarState
 *
 * @property {Date} monthStart
 * @property {string} selectedDayKey
 */

/** @typedef {"files" | "library" | "calendar"} BrowserView */

/**
 * @typedef {object} FitLibraryItem
 *
 * @property {string} fullPath
 * @property {string} fileName
 * @property {Date} startTime
 * @property {number} totalDistanceM
 * @property {string} [sport]
 */

/**
 * @typedef {object} SportBadge
 *
 * @property {string} emoji
 * @property {string} key
 * @property {string} label
 */

/**
 * Render (or refresh) the Browser tab UI.
 */
export async function renderFileBrowserTab() {
    const container = getElementByIdFlexible(document, "content_browser");
    if (!container) {
        return;
    }

    // One-time UI scaffolding.
    if (!container.dataset.ffvBrowserInitialized) {
        container.dataset.ffvBrowserInitialized = "true";
        container.replaceChildren(createFileBrowserScaffold());

        const pickBtn = document.getElementById("fit-browser-pick-folder");
        if (pickBtn) {
            pickBtn.addEventListener("click", async () => {
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
                setState(TAB_STATE_PATH_REL, "", {
                    source: "fileBrowser.pickFolder",
                });
                await refreshActiveView();
            });
        }

        const filesBtn = document.getElementById("fit-browser-view-files");
        const libraryBtn = document.getElementById("fit-browser-view-library");
        const calendarBtn = document.getElementById(
            "fit-browser-view-calendar"
        );

        const setView = async (/** @type {BrowserView} */ view) => {
            setState(TAB_STATE_VIEW, view, { source: "fileBrowser.setView" });
            await refreshActiveView();
        };

        filesBtn?.addEventListener("click", async () => setView("files"));
        libraryBtn?.addEventListener("click", async () => setView("library"));
        calendarBtn?.addEventListener("click", async () => setView("calendar"));
    }

    await refreshActiveView();
}

/**
 * @returns {HTMLElement}
 */
function createFileBrowserScaffold() {
    const root = document.createElement("div");
    root.className = "file-browser";

    const notice = document.createElement("div");
    notice.className = "file-browser__notice";
    notice.setAttribute("role", "note");
    notice.textContent =
        "Experimental feature — folder scanning and calendar may change.";

    const header = document.createElement("div");
    header.className = "file-browser__header";

    const controls = document.createElement("div");
    controls.className = "file-browser__controls";
    controls.append(createPickFolderButton(), createViewSegmentedControl());

    const currentPath = document.createElement("div");
    currentPath.className = "file-browser__path";
    currentPath.id = "fit-browser-current-path";

    header.append(controls, currentPath);

    const body = document.createElement("div");
    body.className = "file-browser__body";

    const list = document.createElement("div");
    list.className = "file-browser__list";
    list.id = "fit-browser-list";
    list.setAttribute("role", "list");

    const library = document.createElement("div");
    library.className = "file-browser__library";
    library.id = "fit-browser-library";
    library.hidden = true;

    const calendar = document.createElement("div");
    calendar.className = "file-browser__calendar";
    calendar.id = "fit-browser-calendar";
    calendar.hidden = true;

    body.append(list, library, calendar);
    root.append(notice, header, body);

    return root;
}

/**
 * @returns {HTMLButtonElement}
 */
function createPickFolderButton() {
    const button = document.createElement("button");
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

/**
 * @returns {HTMLElement}
 */
function createViewSegmentedControl() {
    const segmented = document.createElement("div");
    segmented.className = "file-browser__segmented";
    segmented.setAttribute("role", "tablist");
    segmented.setAttribute("aria-label", "Browser view");
    segmented.append(
        createViewSegmentButton("fit-browser-view-files", "file", "Files", true),
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

/**
 * @param {string} id
 * @param {import("../icons/iconFactory.js").AppIconName} iconName
 * @param {string} label
 * @param {boolean} selected
 *
 * @returns {HTMLButtonElement}
 */
function createViewSegmentButton(id, iconName, label, selected) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "file-browser__seg-btn";
    button.id = id;
    button.setAttribute("role", "tab");
    button.setAttribute("aria-selected", selected ? "true" : "false");
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

/**
 * @param {HTMLElement} target
 * @param {import("../icons/iconFactory.js").AppIconName} iconName
 * @param {string} iconClass
 * @param {string} labelText
 * @param {string} labelClass
 * @param {number} size
 */
function appendIconLabel(
    target,
    iconName,
    iconClass,
    labelText,
    labelClass,
    size
) {
    const label = document.createElement("span");
    if (labelClass) {
        label.className = labelClass;
    }
    label.textContent = labelText;
    target.append(
        createAppIconElement(iconName, { className: iconClass, size }),
        label
    );
}

/**
 * @param {string} text
 * @param {string} [className]
 *
 * @returns {HTMLElement}
 */
function createEmptyMessage(text, className = "file-browser__empty") {
    const empty = document.createElement("div");
    empty.className = className;
    empty.textContent = text;

    return empty;
}

/**
 * @param {Date} monthStart
 * @param {number} deltaMonths
 */
function addMonths(monthStart, deltaMonths) {
    return new Date(
        monthStart.getFullYear(),
        monthStart.getMonth() + deltaMonths,
        1
    );
}

/**
 * @param {unknown} value
 *
 * @returns {Date | null}
 */
function coerceToDate(value) {
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

/**
 * @param {unknown} value
 *
 * @returns {number}
 */
function coerceToNumber(value) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    const n = typeof value === "string" ? Number(value) : Number.NaN;
    return Number.isFinite(n) ? n : 0;
}

/**
 * @param {FitLibraryItem[]} items
 */
/**
 * @param {FitLibraryItem[]} items
 * @param {number} lastDays
 */
function computeLibraryTotals(items, lastDays) {
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

/**
 * @param {ElectronAPI} api
 * @param {{ fullPath: string; name: string }} file
 *
 * @returns {Promise<FitLibraryItem | null>}
 */
async function decodeLibraryItem(api, file) {
    try {
        const buf = await api.readFile(file.fullPath);
        const decoded = await api.decodeFitFile(buf);
        const session =
            decoded && typeof decoded === "object"
                ? /** @type {any} */ (decoded).sessionMesgs?.[0]
                : null;

        const startRaw =
            session?.start_time ?? session?.startTime ?? session?.timestamp;
        const startTime = coerceToDate(startRaw);
        if (!startTime) {
            return null;
        }

        const totalDistanceM = coerceToNumber(
            session?.total_distance ?? session?.totalDistance ?? 0
        );
        const sport =
            typeof session?.sport === "string" ? session.sport : undefined;

        return {
            fileName: file.name,
            fullPath: file.fullPath,
            sport,
            startTime,
            totalDistanceM,
        };
    } catch {
        return null;
    }
}

/**
 * @param {Date} date
 */
function formatLocalDayKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}
/**
 * @param {Date} date
 */
function formatMonthKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
}

/**
 * @returns {CalendarState}
 */
function getCalendarState() {
    const now = new Date();
    const defaultMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const defaultSelected = formatLocalDayKey(now);

    try {
        const monthRaw = localStorage.getItem(CAL_PREFS_MONTH_KEY);
        const selectedRaw = localStorage.getItem(CAL_PREFS_SELECTED_DAY_KEY);

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

/**
 * @returns {ElectronAPI | null}
 */
function getElectronAPI() {
    const api = /** @type {unknown} */ (globalThis.electronAPI);
    if (!api || typeof api !== "object") {
        return null;
    }
    return /** @type {ElectronAPI} */ (api);
}

/**
 * @returns {{ lastDays: number; unit: DistanceUnit }}
 */
function getLibraryPrefs() {
    try {
        const lastDaysRaw = localStorage.getItem(LIB_PREFS_LAST_DAYS_KEY);
        const unitRaw = localStorage.getItem(LIB_PREFS_UNIT_KEY);
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

/**
 * @param {string} root
 */
function getLibraryStorageKey(root) {
    return `fitLibraryCache_${encodeURIComponent(root)}`;
}

/**
 * @param {FitLibraryItem[]} items
 *
 * @returns {Map<string, FitLibraryItem[]>}
 */
function groupItemsByDay(items) {
    /** @type {Map<string, FitLibraryItem[]>} */
    const m = new Map();
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

/**
 * @param {unknown} value
 *
 * @returns {value is FitBrowserListResponse}
 */
function isFitBrowserListResponse(value) {
    if (!value || typeof value !== "object") return false;
    const v =
        /** @type {{ root?: unknown; relPath?: unknown; entries?: unknown }} */ (
            value
        );
    if (v.root !== null && typeof v.root !== "string" && v.root !== undefined)
        return false;
    if (typeof v.relPath !== "string") return false;
    if (!Array.isArray(v.entries)) return false;
    return v.entries.every((e) => {
        if (!e || typeof e !== "object") return false;
        const entry = /**
         * @type {{
         *     name?: unknown;
         *     kind?: unknown;
         *     relPath?: unknown;
         *     fullPath?: unknown;
         * }}
         */ (e);
        return (
            typeof entry.name === "string" &&
            (entry.kind === "dir" || entry.kind === "file") &&
            typeof entry.relPath === "string" &&
            typeof entry.fullPath === "string"
        );
    });
}

/**
 * Recursively list all FIT files under the browser root.
 *
 * @param {ElectronAPI} api
 *
 * @returns {Promise<{ fullPath: string; name: string }[]>}
 */
async function listAllFitFiles(api) {
    /** @type {{ fullPath: string; name: string }[]} */
    const out = [];

    const limit = pLimitCompat(6);
    /** @type {Set<string>} */
    const visited = new Set();

    /**
     * @param {string} relPath
     *
     * @returns {Promise<void>}
     */
    const walk = async (relPath) => {
        if (visited.has(relPath)) {
            return;
        }
        visited.add(relPath);

        const respRaw = await api.listFitBrowserFolder(relPath);
        if (!isFitBrowserListResponse(respRaw)) {
            return;
        }

        const resp = /** @type {FitBrowserListResponse} */ (respRaw);
        const { entries } = resp;
        /** @type {Promise<void>[]} */
        const nested = [];

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

/**
 * @param {string} root
 *
 * @returns {{ items: FitLibraryItem[]; scannedAt: number } | null}
 */
function loadPersistedLibraryCache(root) {
    try {
        const raw = localStorage.getItem(getLibraryStorageKey(root));
        if (!raw) {
            return null;
        }

        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== "object") {
            return null;
        }

        const { items: itemsRaw, scannedAt } =
            /** @type {{ items?: unknown; scannedAt?: unknown }} */ (parsed);
        if (!Array.isArray(itemsRaw)) {
            return null;
        }

        /** @type {FitLibraryItem[]} */
        const items = [];
        for (const it of itemsRaw) {
            const fullPath =
                typeof it?.fullPath === "string" ? it.fullPath : "";
            const fileName =
                typeof it?.fileName === "string" ? it.fileName : "";
            const startTime = coerceToDate(it?.startTime);
            const totalDistanceM = coerceToNumber(it?.totalDistanceM);
            const sport = typeof it?.sport === "string" ? it.sport : undefined;

            if (!fullPath || !fileName || !startTime) {
                continue;
            }
            items.push({
                fileName,
                fullPath,
                sport,
                startTime,
                totalDistanceM,
            });
        }

        items.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
        const normalizedScannedAt =
            typeof scannedAt === "number" && Number.isFinite(scannedAt)
                ? scannedAt
                : Date.now();

        return { items, scannedAt: normalizedScannedAt };
    } catch {
        return null;
    }
}

/**
 * @param {string} root
 *
 * @returns {{ items: FitLibraryItem[]; scannedAt: number } | null}
 */
function loadSessionLibraryCache(root) {
    const cached = /** @type {unknown} */ (globalThis.__ffvLibraryCache);
    const cacheObj =
        (cached &&
            typeof cached === "object" &&
            /** @type {Record<string, unknown>} */ (cached)) ||
        null;
    const cachedForRoot =
        cacheObj && typeof cacheObj[root] === "object" && cacheObj[root];
    return (cachedForRoot && /** @type {any} */ (cachedForRoot)) || null;
}

/**
 * @param {string} relPath
 *
 * @returns {string}
 */
function parentRelPath(relPath) {
    const normalized = relPath
        .replaceAll("\\", "/")
        .replace(/^\/+/, "")
        .replace(/\/+$/, "");
    const idx = normalized.lastIndexOf("/");
    if (idx === -1) return "";
    return normalized.slice(0, idx);
}

/**
 * @param {unknown} value
 *
 * @returns {value is string}
 */
function isNonEmptyString(value) {
    return typeof value === "string" && value.trim().length > 0;
}

/**
 * @param {string} value
 *
 * @returns {string}
 */
function normalizePathSeparators(value) {
    return value.replaceAll("\\", "/");
}

/**
 * @param {string} value
 *
 * @returns {string[]}
 */
function splitPathSegments(value) {
    return normalizePathSeparators(value)
        .split("/")
        .filter((segment) => segment.length > 0);
}

/**
 * @param {string} value
 *
 * @returns {boolean}
 */
function isWindowsStylePath(value) {
    const normalized = normalizePathSeparators(value.trim());
    return /^[A-Za-z]:\//u.test(normalized) || normalized.startsWith("//");
}

/**
 * @param {string} rootPath
 * @param {string} fullPath
 *
 * @returns {string | null}
 */
function getRelativePathWithinRoot(rootPath, fullPath) {
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

    for (let index = 0; index < rootSegments.length; index += 1) {
        const left = rootSegments[index];
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

/**
 * Ensure a Browser-tab file path is approved in the main process before calling
 * file:read.
 *
 * Why this is needed:
 *
 * - Approvals are in-memory only (main process)
 * - Browser Library/Calendar can render from persisted cache after restart
 * - Cached row clicks may reference valid files that are not yet approved in this
 *   process lifetime
 *
 * We safely re-approve by listing the parent folder through the existing
 * browser:listFolder IPC path, which enforces root-folder boundaries and
 * approves discovered .fit files.
 *
 * @param {ElectronAPI} api
 * @param {string} filePath
 *
 * @returns {Promise<boolean>}
 */
async function ensureBrowserFileReadApproval(api, filePath) {
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

/**
 * Open a file selected from Browser tab views (files/library/calendar) with a
 * preflight approval refresh.
 *
 * @param {string} filePath
 *
 * @returns {Promise<void>}
 */
async function openBrowserFile(filePath) {
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

        const openFileBtn = document.getElementById("open_file_btn");
        await openFitFileFromPath({
            filePath,
            openFileBtn:
                openFileBtn instanceof HTMLElement ? openFileBtn : undefined,
            showNotification,
        });
    } catch (error) {
        const message =
            error instanceof Error
                ? error.message
                : "Unknown browser open error";
        console.error("[fileBrowserTab] openBrowserFile failed", error);
        showNotification(`Failed to open file: ${message}`, "error", 8000);
    }
}

/**
 * @param {unknown} raw
 *
 * @returns {Date | null}
 */
function parseMonthKey(raw) {
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

/**
 * @param {CalendarState} state
 */
function persistCalendarState(state) {
    try {
        localStorage.setItem(
            CAL_PREFS_MONTH_KEY,
            formatMonthKey(state.monthStart)
        );
        localStorage.setItem(CAL_PREFS_SELECTED_DAY_KEY, state.selectedDayKey);
    } catch {
        /* ignore */
    }
}

/**
 * @param {string} root
 * @param {{ items: FitLibraryItem[]; totals: any; scannedAt: number }} payload
 */
function persistLibraryCache(root, payload) {
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
        localStorage.setItem(
            getLibraryStorageKey(root),
            JSON.stringify(serializable)
        );
    } catch {
        /* ignore */
    }
}

/**
 * @param {{ lastDays: number; unit: DistanceUnit }} prefs
 */
function persistLibraryPrefs(prefs) {
    try {
        localStorage.setItem(LIB_PREFS_LAST_DAYS_KEY, String(prefs.lastDays));
        localStorage.setItem(LIB_PREFS_UNIT_KEY, prefs.unit);
    } catch {
        /* ignore */
    }
}

async function refreshActiveView() {
    const rawView = getState(TAB_STATE_VIEW);
    const view = /** @type {BrowserView} */ (
        rawView === "calendar"
            ? "calendar"
            : rawView === "library"
              ? "library"
              : "files"
    );
    const filesBtn = document.getElementById("fit-browser-view-files");
    const libraryBtn = document.getElementById("fit-browser-view-library");
    const calendarBtn = document.getElementById("fit-browser-view-calendar");
    const listEl = document.getElementById("fit-browser-list");
    const libraryEl = document.getElementById("fit-browser-library");
    const calendarEl = document.getElementById("fit-browser-calendar");

    if (filesBtn) {
        filesBtn.setAttribute(
            "aria-selected",
            view === "files" ? "true" : "false"
        );
        filesBtn.classList.toggle(
            "file-browser__seg-btn--active",
            view === "files"
        );
    }
    if (libraryBtn) {
        libraryBtn.setAttribute(
            "aria-selected",
            view === "library" ? "true" : "false"
        );
        libraryBtn.classList.toggle(
            "file-browser__seg-btn--active",
            view === "library"
        );
    }
    if (calendarBtn) {
        calendarBtn.setAttribute(
            "aria-selected",
            view === "calendar" ? "true" : "false"
        );
        calendarBtn.classList.toggle(
            "file-browser__seg-btn--active",
            view === "calendar"
        );
    }

    setElementVisible(
        listEl instanceof HTMLElement ? listEl : null,
        view === "files"
    );
    setElementVisible(
        libraryEl instanceof HTMLElement ? libraryEl : null,
        view === "library"
    );
    setElementVisible(
        calendarEl instanceof HTMLElement ? calendarEl : null,
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

async function refreshListing() {
    const api = getElectronAPI();
    const pathEl = document.getElementById("fit-browser-current-path");
    const listEl = document.getElementById("fit-browser-list");

    if (!pathEl || !listEl) {
        return;
    }

    if (
        !api ||
        typeof api.getFitBrowserFolder !== "function" ||
        typeof api.listFitBrowserFolder !== "function"
    ) {
        pathEl.textContent = "Browser unavailable (Electron API missing)";
        listEl.replaceChildren();
        return;
    }

    const root = await api.getFitBrowserFolder();
    const rel =
        typeof getState(TAB_STATE_PATH_REL) === "string"
            ? String(getState(TAB_STATE_PATH_REL))
            : "";

    if (!root) {
        pathEl.textContent = "No folder selected";
        listEl.replaceChildren(
            createEmptyMessage("Choose a folder to browse .fit files.")
        );
        return;
    }

    const responseRaw = await api.listFitBrowserFolder(rel);
    if (!isFitBrowserListResponse(responseRaw)) {
        pathEl.textContent = root;
        listEl.replaceChildren(createEmptyMessage("Unable to list folder."));
        return;
    }

    const response = /** @type {FitBrowserListResponse} */ (responseRaw);
    const { entries, relPath } = response;

    const displayPath = relPath
        ? `${root} / ${relPath.replaceAll("/", " / ")}`
        : root;
    pathEl.textContent = displayPath;

    listEl.replaceChildren();

    if (relPath) {
        const up = createBrowserItemButton("dir", "arrowLeft", "..");
        up.addEventListener("click", async () => {
            setState(TAB_STATE_PATH_REL, parentRelPath(relPath), {
                source: "fileBrowser.up",
            });
            await refreshListing();
        });
        listEl.append(up);
    }

    if (entries.length === 0) {
        listEl.append(createEmptyMessage("No .fit files found in this folder."));
        return;
    }

    for (const entry of entries) {
        const { kind, name, relPath: entryRelPath, fullPath } = entry;
        const iconName = kind === "dir" ? "folder" : "file";
        const btn = createBrowserItemButton(kind, iconName, name);

        if (kind === "dir") {
            btn.addEventListener("click", async () => {
                setState(TAB_STATE_PATH_REL, entryRelPath, {
                    source: "fileBrowser.enterDir",
                });
                await refreshListing();
            });
        } else {
            btn.addEventListener("click", async () => {
                await openBrowserFile(fullPath);
            });
        }

        listEl.append(btn);
    }
}

/**
 * @param {"dir" | "file"} kind
 * @param {import("../icons/iconFactory.js").AppIconName} iconName
 * @param {string} label
 *
 * @returns {HTMLButtonElement}
 */
function createBrowserItemButton(kind, iconName, label) {
    const button = document.createElement("button");
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

/**
 * @param {string} root
 * @param {{ items: FitLibraryItem[]; scannedAt: number } | null} payload
 */
function renderCalendarResults(root, payload) {
    const titleEl = document.getElementById("fit-calendar-title");
    const gridEl = document.getElementById("fit-calendar-grid");
    const panelEl = document.getElementById("fit-calendar-panel");

    if (!(gridEl instanceof HTMLElement) || !(panelEl instanceof HTMLElement)) {
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
    const fmt = (meters) => (meters * unitFactor).toFixed(1);

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

    /** @type {HTMLElement[]} */
    const gridItems = [];
    for (const wd of weekdayLabels) {
        const weekday = document.createElement("div");
        weekday.className = "file-calendar__weekday";
        weekday.textContent = wd;
        gridItems.push(weekday);
    }

    for (let i = 0; i < 42; i++) {
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
        button.addEventListener("click", () => {
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
        selectedItems
            .slice()
            .sort((a, b) => b.startTime.getTime() - a.startTime.getTime()),
        unitLabel,
        fmt,
        { includeSportBadge: true, useTimeOnly: true }
    );
    panelEl.replaceChildren(createCalendarPanelTitle(selectedDayKey), rows);
}

/**
 * @param {object} options
 * @param {Date} options.day
 * @param {number} options.dayDistance
 * @param {FitLibraryItem[]} options.dayItems
 * @param {string} options.dayKey
 * @param {(meters: number) => string} options.formatDistance
 * @param {boolean} options.inMonth
 * @param {boolean} options.isSelected
 * @param {boolean} options.isToday
 * @param {DistanceUnit} options.unitLabel
 *
 * @returns {HTMLButtonElement}
 */
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
}) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "file-calendar__day";
    button.dataset.day = dayKey;

    if (!inMonth) button.classList.add("file-calendar__day--outside");
    if (isToday) button.classList.add("file-calendar__day--today");
    if (isSelected) button.classList.add("file-calendar__day--selected");
    if (dayItems.length > 0) {
        button.classList.add("file-calendar__day--hasActivities");
        button.dataset.tooltip = `${dayKey} • ${formatDistance(dayDistance)} ${unitLabel} • ${formatActivityLabel(dayItems.length)}`;
    } else {
        button.dataset.tooltip = dayKey;
    }
    if (dayItems.length > 1) button.classList.add("file-calendar__day--multi");

    const dayNumber = document.createElement("div");
    dayNumber.className = "file-calendar__dayNumber";
    dayNumber.textContent = String(day.getDate());

    const dayMeta = document.createElement("div");
    dayMeta.className = "file-calendar__dayMeta";
    if (dayItems.length > 0) {
        const distance = document.createElement("div");
        distance.className = "file-calendar__dayDistance";
        distance.textContent = `${formatDistance(dayDistance)} ${unitLabel}`;

        const count = document.createElement("div");
        count.className = "file-calendar__dayCount";
        count.textContent = formatActivityLabel(dayItems.length);

        dayMeta.append(distance, count, createCalendarDayIconRow(dayItems));
    }

    button.append(dayNumber, dayMeta);

    return button;
}

/**
 * @param {FitLibraryItem[]} items
 *
 * @returns {HTMLElement}
 */
function createCalendarDayIconRow(items) {
    const iconRow = document.createElement("div");
    iconRow.className = "file-calendar__dayIcons";
    iconRow.setAttribute("aria-hidden", "true");

    const badges = createSportBadgeCounts(items);
    const shown = badges.slice(0, 3);
    const remainder = Math.max(0, badges.length - shown.length);

    for (const badge of shown) {
        const icon = document.createElement("span");
        icon.className = "file-calendar__dayIcon";
        icon.dataset.sport = badge.key;
        icon.dataset.count = String(badge.count);
        icon.dataset.tooltip =
            badge.count > 0 ? `${badge.label} (${badge.count})` : badge.label;
        icon.textContent = badge.emoji;
        iconRow.append(icon);
    }

    if (remainder > 0) {
        const more = document.createElement("span");
        more.className = "file-calendar__dayIconMore";
        more.textContent = `+${remainder}`;
        iconRow.append(more);
    }

    return iconRow;
}

/**
 * @param {FitLibraryItem[]} items
 *
 * @returns {(SportBadge & { count: number })[]}
 */
function createSportBadgeCounts(items) {
    /** @type {Map<string, SportBadge & { count: number }>} */
    const bySport = new Map();
    for (const item of items) {
        const badge = getSportBadge(item.sport);
        const existing = bySport.get(badge.key);
        if (existing) {
            existing.count += 1;
        } else {
            bySport.set(badge.key, { ...badge, count: 1 });
        }
    }

    return [...bySport.values()].sort((a, b) => b.count - a.count);
}

/**
 * @param {string} dayKey
 *
 * @returns {HTMLElement}
 */
function createCalendarPanelTitle(dayKey) {
    const title = document.createElement("div");
    title.className = "file-calendar__panelTitle";
    title.textContent = dayKey;

    return title;
}

/**
 * @param {number} count
 *
 * @returns {string}
 */
function formatActivityLabel(count) {
    return `${count} ${count === 1 ? "activity" : "activities"}`;
}

/**
 * @param {string | undefined} sport
 *
 * @returns {SportBadge}
 */
function getSportBadge(sport) {
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

/**
 * @returns {HTMLElement}
 */
function createCalendarScaffold() {
    const calendar = document.createElement("div");
    calendar.className = "file-calendar";

    const header = document.createElement("div");
    header.className = "file-calendar__header";

    const title = document.createElement("div");
    title.className = "file-calendar__title";
    title.id = "fit-calendar-title";

    const nav = document.createElement("div");
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

    const grid = document.createElement("div");
    grid.className = "file-calendar__grid";
    grid.id = "fit-calendar-grid";

    const panel = document.createElement("div");
    panel.className = "file-calendar__panel";
    panel.id = "fit-calendar-panel";

    calendar.append(header, grid, panel);

    return calendar;
}

/**
 * @param {object} options
 * @param {string} options.id
 * @param {import("../icons/iconFactory.js").AppIconName} options.iconName
 * @param {string} options.label
 * @param {string} [options.tooltip]
 *
 * @returns {HTMLButtonElement}
 */
function createBrowserActionButton({ id, iconName, label, tooltip }) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "file-browser__btn";
    button.id = id;
    if (tooltip) {
        button.dataset.tooltip = tooltip;
    }
    appendIconLabel(
        button,
        iconName,
        "file-browser__btn-icon",
        label,
        "",
        14
    );

    return button;
}

/**
 * Render the Calendar view.
 */
async function renderCalendarView() {
    const api = getElectronAPI();
    const pathEl = document.getElementById("fit-browser-current-path");
    const calendarEl = document.getElementById("fit-browser-calendar");
    if (
        !(calendarEl instanceof HTMLElement) ||
        !(pathEl instanceof HTMLElement)
    ) {
        return;
    }

    if (!api || typeof api.getFitBrowserFolder !== "function") {
        pathEl.textContent = "Browser unavailable (Electron API missing)";
        delete calendarEl.dataset.ffvCalendarInitialized;
        calendarEl.replaceChildren();
        return;
    }

    const root = await api.getFitBrowserFolder();
    if (!root) {
        pathEl.textContent = "No folder selected";
        delete calendarEl.dataset.ffvCalendarInitialized;
        calendarEl.replaceChildren(
            createEmptyMessage("Choose a folder to view the calendar.")
        );
        return;
    }

    const cached =
        loadPersistedLibraryCache(root) ?? loadSessionLibraryCache(root);

    if (!calendarEl.dataset.ffvCalendarInitialized) {
        calendarEl.dataset.ffvCalendarInitialized = "true";
        calendarEl.replaceChildren(createCalendarScaffold());

        const prevBtn = document.getElementById("fit-calendar-prev");
        const nextBtn = document.getElementById("fit-calendar-next");
        const todayBtn = document.getElementById("fit-calendar-today");
        const scanBtn = document.getElementById("fit-calendar-scan");

        prevBtn?.addEventListener("click", () => {
            const st = getCalendarState();
            const next = { ...st, monthStart: addMonths(st.monthStart, -1) };
            persistCalendarState(next);
            renderCalendarResults(
                root,
                loadPersistedLibraryCache(root) ?? loadSessionLibraryCache(root)
            );
        });
        nextBtn?.addEventListener("click", () => {
            const st = getCalendarState();
            const next = { ...st, monthStart: addMonths(st.monthStart, 1) };
            persistCalendarState(next);
            renderCalendarResults(
                root,
                loadPersistedLibraryCache(root) ?? loadSessionLibraryCache(root)
            );
        });
        todayBtn?.addEventListener("click", () => {
            const now = new Date();
            const next = {
                monthStart: new Date(now.getFullYear(), now.getMonth(), 1),
                selectedDayKey: formatLocalDayKey(now),
            };
            persistCalendarState(next);
            renderCalendarResults(
                root,
                loadPersistedLibraryCache(root) ?? loadSessionLibraryCache(root)
            );
        });
        scanBtn?.addEventListener("click", async () => {
            // Scan and then re-render calendar.
            await scanAndRenderLibrary(root);
            renderCalendarResults(
                root,
                loadPersistedLibraryCache(root) ?? loadSessionLibraryCache(root)
            );
        });
    }

    renderCalendarResults(root, cached);
}

/**
 * @param {import("../icons/iconFactory.js").AppIconName} iconName
 * @param {string} label
 * @param {string} value
 *
 * @returns {HTMLElement}
 */
function createLibraryCard(iconName, label, value) {
    const card = document.createElement("div");
    card.className = "file-library__card";

    const cardLabel = document.createElement("div");
    cardLabel.className = "file-library__cardLabel";
    appendIconLabel(
        cardLabel,
        iconName,
        "file-library__cardIcon",
        label,
        "",
        13
    );

    const cardValue = document.createElement("div");
    cardValue.className = "file-library__cardValue";
    cardValue.textContent = value;

    card.append(cardLabel, cardValue);

    return card;
}

/**
 * @param {FitLibraryItem[]} items
 * @param {DistanceUnit} unitLabel
 * @param {(meters: number) => string} formatDistance
 * @param {{ includeSportBadge: boolean; useTimeOnly: boolean }} options
 *
 * @returns {HTMLElement}
 */
function createLibraryRows(items, unitLabel, formatDistance, options) {
    const rows = document.createElement("div");
    rows.className = "file-library__rows";

    for (const item of items) {
        const row = document.createElement("button");
        row.type = "button";
        row.className = "file-library__row";
        row.dataset.fullpath = item.fullPath;
        row.addEventListener("click", async () => {
            await openBrowserFile(item.fullPath);
        });

        const main = document.createElement("span");
        main.className = "file-library__rowMain";

        if (options.includeSportBadge) {
            const badge = getSportBadge(item.sport);
            const icon = document.createElement("span");
            icon.className = "file-calendar__rowIcon";
            icon.dataset.tooltip = badge.label;
            icon.setAttribute("aria-hidden", "true");
            icon.textContent = badge.emoji;
            main.append(icon, document.createTextNode(` ${item.fileName}`));
        } else {
            const fileName = document.createElement("span");
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
        const meta = document.createElement("span");
        meta.className = "file-library__rowMeta";
        meta.textContent = `${when} • ${formatDistance(item.totalDistanceM)} ${unitLabel}${sport}`;

        row.append(main, meta);
        rows.append(row);
    }

    return rows;
}

/**
 * @returns {HTMLElement}
 */
function createLibraryScaffold() {
    const library = document.createElement("div");
    library.className = "file-library";

    const header = document.createElement("div");
    header.className = "file-library__header";

    const title = document.createElement("div");
    title.className = "file-library__title";
    appendIconLabel(
        title,
        "folder",
        "file-library__titleIcon",
        "Folder Summary",
        "",
        16
    );

    const controls = document.createElement("div");
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

    const status = document.createElement("div");
    status.className = "file-library__status";
    status.id = "fit-library-status";

    const cards = document.createElement("div");
    cards.className = "file-library__grid";
    cards.id = "fit-library-cards";

    const activities = document.createElement("div");
    activities.className = "file-library__list";
    activities.id = "fit-library-activities";

    library.append(header, status, cards, activities);

    return library;
}

/**
 * @returns {HTMLLabelElement}
 */
function createLibraryDaysControl() {
    const label = document.createElement("label");
    label.className = "file-library__control";

    const intro = document.createElement("span");
    intro.className = "file-library__controlLabel";
    appendIconLabel(
        intro,
        "history",
        "file-library__controlIcon",
        "Last",
        "",
        12
    );

    const input = document.createElement("input");
    input.type = "number";
    input.min = "1";
    input.max = "3650";
    input.step = "1";
    input.className = "file-library__daysInput";
    input.id = "fit-library-days";

    const suffix = document.createElement("span");
    suffix.className = "file-library__controlLabel";
    suffix.textContent = "days";

    label.append(intro, input, suffix);

    return label;
}

/**
 * @returns {HTMLLabelElement}
 */
function createLibraryUnitControl() {
    const label = document.createElement("label");
    label.className = "file-library__control";

    const intro = document.createElement("span");
    intro.className = "file-library__controlLabel";
    appendIconLabel(
        intro,
        "ruler",
        "file-library__controlIcon",
        "Units",
        "",
        12
    );

    const select = document.createElement("select");
    select.className = "file-library__unitSelect";
    select.id = "fit-library-unit";

    for (const value of ["km", "mi"]) {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = value;
        select.append(option);
    }

    label.append(intro, select);

    return label;
}

/**
 * @param {string} root
 * @param {{ items: FitLibraryItem[]; scannedAt: number }} payload
 */
function renderLibraryResults(root, payload) {
    const statusEl = document.getElementById("fit-library-status");
    const cardsEl = document.getElementById("fit-library-cards");
    const listEl = document.getElementById("fit-library-activities");

    const prefs = getLibraryPrefs();
    const totals = computeLibraryTotals(payload.items, prefs.lastDays);
    const unitFactor = prefs.unit === "mi" ? 1 / 1609.344 : 1 / 1000;
    const unitLabel = prefs.unit;
    const fmt = (meters) => (meters * unitFactor).toFixed(1);

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
            listEl.replaceChildren(createEmptyMessage("No activities decoded."));
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

async function renderLibraryView() {
    const api = getElectronAPI();
    const pathEl = document.getElementById("fit-browser-current-path");
    const libraryEl = document.getElementById("fit-browser-library");

    if (
        !(libraryEl instanceof HTMLElement) ||
        !(pathEl instanceof HTMLElement)
    ) {
        return;
    }

    if (
        !api ||
        typeof api.getFitBrowserFolder !== "function" ||
        typeof api.listFitBrowserFolder !== "function"
    ) {
        pathEl.textContent = "Browser unavailable (Electron API missing)";
        delete libraryEl.dataset.ffvLibraryInitialized;
        libraryEl.replaceChildren();
        return;
    }

    const root = await api.getFitBrowserFolder();
    if (!root) {
        pathEl.textContent = "No folder selected";
        delete libraryEl.dataset.ffvLibraryInitialized;
        libraryEl.replaceChildren(
            createEmptyMessage("Choose a folder to build a library summary.")
        );
        return;
    }

    // One-time scaffold.
    if (!libraryEl.dataset.ffvLibraryInitialized) {
        libraryEl.dataset.ffvLibraryInitialized = "true";
        libraryEl.replaceChildren(createLibraryScaffold());

        const scanBtn = document.getElementById("fit-library-scan");
        scanBtn?.addEventListener("click", async () => {
            await scanAndRenderLibrary(root);
        });

        // Initialize controls from persisted prefs.
        const prefs = getLibraryPrefs();
        const daysInput = /** @type {HTMLInputElement | null} */ (
            document.getElementById("fit-library-days")
        );
        const unitSelect = /** @type {HTMLSelectElement | null} */ (
            document.getElementById("fit-library-unit")
        );

        if (daysInput) {
            daysInput.value = String(prefs.lastDays);
            daysInput.addEventListener("change", () => {
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

        if (unitSelect) {
            unitSelect.value = prefs.unit;
            unitSelect.addEventListener("change", () => {
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
    if (cachedForRoot) {
        renderLibraryResults(root, cachedForRoot);
        return;
    }

    const statusEl = document.getElementById("fit-library-status");
    if (statusEl) {
        statusEl.textContent =
            "Click ‘Scan folder’ to compute weekly/monthly totals.";
    }
}

/**
 * @param {string} root
 */
async function scanAndRenderLibrary(root) {
    const api = getElectronAPI();
    const statusEl = document.getElementById("fit-library-status");
    if (
        !api ||
        typeof api.listFitBrowserFolder !== "function" ||
        typeof api.readFile !== "function"
    ) {
        showNotification(
            "Library scan is unavailable (Electron API missing).",
            "error"
        );
        return;
    }

    try {
        if (statusEl) statusEl.textContent = "Listing files…";

        const files = await listAllFitFiles(api);
        if (files.length === 0) {
            if (statusEl) statusEl.textContent = "No .fit files found.";
            renderLibraryResults(root, { items: [], scannedAt: Date.now() });
            return;
        }

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

        /** @type {FitLibraryItem[]} */
        const items = [];

        const tasks = files.map((file) =>
            limit(async () => {
                const res = await decodeLibraryItem(api, file);
                done++;
                if (statusEl) {
                    statusEl.textContent = `Decoding ${Math.min(done, files.length)} / ${files.length}…`;
                }
                if (res) {
                    items.push(res);
                }
            })
        );

        await Promise.allSettled(tasks);

        items.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());

        const payload = { items, scannedAt: Date.now() };
        writeSessionLibraryCache(root, payload);
        persistLibraryCache(root, payload);

        renderLibraryResults(root, payload);
    } catch (error) {
        console.error("[fileBrowserTab] Library scan failed", error);
        if (statusEl) statusEl.textContent = "Scan failed.";
        showNotification("Failed to scan folder.", "error");
    }
}

/**
 * Ensure view sections are mutually exclusive even if the browser's [hidden]
 * styling is overridden.
 *
 * @param {HTMLElement | null} el
 * @param {boolean} visible
 */
function setElementVisible(el, visible) {
    if (!el) return;
    el.hidden = !visible;
    el.style.display = visible ? "" : "none";
}

/**
 * ISO-like Monday week start (local).
 *
 * @param {Date} date
 */
function startOfLocalWeek(date) {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const day = d.getDay();
    const isoDay = day === 0 ? 7 : day;
    d.setDate(d.getDate() - (isoDay - 1));
    d.setHours(0, 0, 0, 0);
    return d;
}

/**
 * @param {string} root
 * @param {{ items: FitLibraryItem[]; scannedAt: number }} payload
 */
function writeSessionLibraryCache(root, payload) {
    if (
        !globalThis.__ffvLibraryCache ||
        typeof globalThis.__ffvLibraryCache !== "object"
    ) {
        globalThis.__ffvLibraryCache = {};
    }
    /** @type {any} */ (globalThis.__ffvLibraryCache)[root] = payload;
}
