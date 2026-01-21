/**
 * Folder-based FIT file browser tab.
 *
 * This is intentionally lightweight:
 * - The main process owns the persisted root folder and enforces that listings remain within it.
 * - The renderer requests directory listings and can open a selected .fit file by path.
 */

import pLimitCompat from "../../async/pLimitCompat.js";
import { openFitFileFromPath } from "../../files/import/openFitFileFromPath.js";
import { getState, setState } from "../../state/core/stateManager.js";
import { showNotification } from "../notifications/showNotification.js";

/** @typedef {{ name: string, kind: 'dir'|'file', relPath: string, fullPath: string }} FitBrowserEntry */
/** @typedef {{ root: string|null, relPath: string, entries: FitBrowserEntry[] }} FitBrowserListResponse */

const TAB_STATE_PATH_REL = "browser.relPath";
const TAB_STATE_VIEW = "browser.view";

const LIB_PREFS_LAST_DAYS_KEY = "fitLibrary.lastDays";
const LIB_PREFS_UNIT_KEY = "fitLibrary.unit";
const CAL_PREFS_MONTH_KEY = "fitLibrary.calendarMonth";
const CAL_PREFS_SELECTED_DAY_KEY = "fitLibrary.calendarSelectedDay";

/** @typedef {'km' | 'mi'} DistanceUnit */

/**
 * @typedef {object} CalendarState
 * @property {Date} monthStart
 * @property {string} selectedDayKey
 */

/** @typedef {'files' | 'library' | 'calendar'} BrowserView */

/**
 * @typedef {object} FitLibraryItem
 * @property {string} fullPath
 * @property {string} fileName
 * @property {Date} startTime
 * @property {number} totalDistanceM
 * @property {string} [sport]
 */

/**
 * Render (or refresh) the Browser tab UI.
 */
export async function renderFileBrowserTab() {
    const container = document.getElementById("content-browser");
    if (!container) {
        return;
    }

    // One-time UI scaffolding.
    if (!container.dataset.ffvBrowserInitialized) {
        container.dataset.ffvBrowserInitialized = "true";
        container.innerHTML = `
            <div class="tab-card">
                <div class="file-browser">
                    <div class="file-browser__notice" role="note">
                        Experimental feature — folder scanning and calendar may change.
                    </div>
                    <div class="file-browser__header">
                        <div class="file-browser__controls">
                            <button type="button" class="file-browser__btn" id="fit-browser-pick-folder">Choose Folder</button>
                            <div class="file-browser__segmented" role="tablist" aria-label="Browser view">
                                <button type="button" class="file-browser__seg-btn" id="fit-browser-view-files" role="tab" aria-selected="true">Files</button>
                                <button type="button" class="file-browser__seg-btn" id="fit-browser-view-library" role="tab" aria-selected="false">Library</button>
                                <button type="button" class="file-browser__seg-btn" id="fit-browser-view-calendar" role="tab" aria-selected="false">Calendar</button>
                            </div>
                        </div>
                        <div class="file-browser__path" id="fit-browser-current-path"></div>
                    </div>
                    <div class="file-browser__body">
                        <div class="file-browser__list" id="fit-browser-list" role="list"></div>
                        <div class="file-browser__library" id="fit-browser-library" hidden></div>
                        <div class="file-browser__calendar" id="fit-browser-calendar" hidden></div>
                    </div>
                </div>
            </div>
        `;

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
                setState(TAB_STATE_PATH_REL, "", { source: "fileBrowser.pickFolder" });
                await refreshActiveView();
            });
        }

        const filesBtn = document.getElementById("fit-browser-view-files");
        const libraryBtn = document.getElementById("fit-browser-view-library");
        const calendarBtn = document.getElementById("fit-browser-view-calendar");

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
 * @param {Date} monthStart
 * @param {number} deltaMonths
 */
function addMonths(monthStart, deltaMonths) {
    return new Date(monthStart.getFullYear(), monthStart.getMonth() + deltaMonths, 1);
}

/**
 * @param {unknown} value
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
    const safeLastDays = Number.isFinite(lastDays) ? Math.max(1, Math.min(3650, Math.floor(lastDays))) : 30;
    const startOfLastDays = new Date(now.getTime() - safeLastDays * 24 * 60 * 60 * 1000);

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
 * @param {{ fullPath: string, name: string }} file
 * @returns {Promise<FitLibraryItem | null>}
 */
async function decodeLibraryItem(api, file) {
    try {
        const buf = await api.readFile(file.fullPath);
        const decoded = await api.decodeFitFile(buf);
        const session = decoded && typeof decoded === "object" ? /** @type {any} */ (decoded).sessionMesgs?.[0] : null;

        const startRaw = session?.start_time ?? session?.startTime ?? session?.timestamp;
        const startTime = coerceToDate(startRaw);
        if (!startTime) {
            return null;
        }

        const totalDistanceM = coerceToNumber(session?.total_distance ?? session?.totalDistance ?? 0);
        const sport = typeof session?.sport === "string" ? session.sport : undefined;

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
        const selectedDayKey = typeof selectedRaw === "string" && selectedRaw ? selectedRaw : defaultSelected;

        return { monthStart, selectedDayKey };
    } catch {
        return { monthStart: defaultMonthStart, selectedDayKey: defaultSelected };
    }
}

/**
 * @returns {ElectronAPI|null}
 */
function getElectronAPI() {
    const api = /** @type {unknown} */ (globalThis.electronAPI);
    if (!api || typeof api !== "object") {
        return null;
    }
    return /** @type {ElectronAPI} */ (api);
}

/**
 * @returns {{ lastDays: number, unit: DistanceUnit }}
 */
function getLibraryPrefs() {
    try {
        const lastDaysRaw = localStorage.getItem(LIB_PREFS_LAST_DAYS_KEY);
        const unitRaw = localStorage.getItem(LIB_PREFS_UNIT_KEY);
        const n = typeof lastDaysRaw === "string" ? Number(lastDaysRaw) : Number.NaN;
        const lastDays = Number.isFinite(n) && n >= 1 && n <= 3650 ? Math.floor(n) : 30;
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
 * @returns {value is FitBrowserListResponse}
 */
function isFitBrowserListResponse(value) {
    if (!value || typeof value !== "object") return false;
    const v = /** @type {{ root?: unknown, relPath?: unknown, entries?: unknown }} */ (value);
    if (v.root !== null && typeof v.root !== "string" && v.root !== undefined) return false;
    if (typeof v.relPath !== "string") return false;
    if (!Array.isArray(v.entries)) return false;
    return v.entries.every((e) => {
        if (!e || typeof e !== "object") return false;
        const entry = /** @type {{ name?: unknown, kind?: unknown, relPath?: unknown, fullPath?: unknown }} */ (e);
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
 * @returns {Promise<Array<{ fullPath: string, name: string }>>}
 */
async function listAllFitFiles(api) {
    /** @type {Array<{ fullPath: string, name: string }>} */
    const out = [];

    const limit = pLimitCompat(6);
    /** @type {Set<string>} */
    const visited = new Set();

    /**
     * @param {string} relPath
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
 * @returns {{ items: FitLibraryItem[], scannedAt: number } | null}
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

        const { items: itemsRaw, scannedAt } = /** @type {{ items?: unknown, scannedAt?: unknown }} */ (parsed);
        if (!Array.isArray(itemsRaw)) {
            return null;
        }

        /** @type {FitLibraryItem[]} */
        const items = [];
        for (const it of itemsRaw) {
            const fullPath = typeof it?.fullPath === "string" ? it.fullPath : "";
            const fileName = typeof it?.fileName === "string" ? it.fileName : "";
            const startTime = coerceToDate(it?.startTime);
            const totalDistanceM = coerceToNumber(it?.totalDistanceM);
            const sport = typeof it?.sport === "string" ? it.sport : undefined;

            if (!fullPath || !fileName || !startTime) {
                continue;
            }
            items.push({ fileName, fullPath, sport, startTime, totalDistanceM });
        }

        items.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
        const normalizedScannedAt =
            typeof scannedAt === "number" && Number.isFinite(scannedAt) ? scannedAt : Date.now();

        return { items, scannedAt: normalizedScannedAt };
    } catch {
        return null;
    }
}

/**
 * @param {string} root
 * @returns {{ items: FitLibraryItem[], scannedAt: number } | null}
 */
function loadSessionLibraryCache(root) {
    const cached = /** @type {unknown} */ (globalThis.__ffvLibraryCache);
    const cacheObj = (cached && typeof cached === "object" && /** @type {Record<string, unknown>} */ (cached)) || null;
    const cachedForRoot = cacheObj && typeof cacheObj[root] === "object" && cacheObj[root];
    return (cachedForRoot && /** @type {any} */ (cachedForRoot)) || null;
}

/**
 * @param {string} relPath
 * @returns {string}
 */
function parentRelPath(relPath) {
    const normalized = relPath.replaceAll("\\", "/").replace(/^\/+/, "").replace(/\/+$/, "");
    const idx = normalized.lastIndexOf("/");
    if (idx === -1) return "";
    return normalized.slice(0, idx);
}

/**
 * @param {unknown} raw
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
        localStorage.setItem(CAL_PREFS_MONTH_KEY, formatMonthKey(state.monthStart));
        localStorage.setItem(CAL_PREFS_SELECTED_DAY_KEY, state.selectedDayKey);
    } catch {
        /* ignore */
    }
}

/**
 * @param {string} root
 * @param {{ items: FitLibraryItem[], totals: any, scannedAt: number }} payload
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
        localStorage.setItem(getLibraryStorageKey(root), JSON.stringify(serializable));
    } catch {
        /* ignore */
    }
}

/**
 * @param {{ lastDays: number, unit: DistanceUnit }} prefs
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
        rawView === "calendar" ? "calendar" : rawView === "library" ? "library" : "files"
    );
    const filesBtn = document.getElementById("fit-browser-view-files");
    const libraryBtn = document.getElementById("fit-browser-view-library");
    const calendarBtn = document.getElementById("fit-browser-view-calendar");
    const listEl = document.getElementById("fit-browser-list");
    const libraryEl = document.getElementById("fit-browser-library");
    const calendarEl = document.getElementById("fit-browser-calendar");

    if (filesBtn) {
        filesBtn.setAttribute("aria-selected", view === "files" ? "true" : "false");
        filesBtn.classList.toggle("file-browser__seg-btn--active", view === "files");
    }
    if (libraryBtn) {
        libraryBtn.setAttribute("aria-selected", view === "library" ? "true" : "false");
        libraryBtn.classList.toggle("file-browser__seg-btn--active", view === "library");
    }
    if (calendarBtn) {
        calendarBtn.setAttribute("aria-selected", view === "calendar" ? "true" : "false");
        calendarBtn.classList.toggle("file-browser__seg-btn--active", view === "calendar");
    }

    setElementVisible(listEl instanceof HTMLElement ? listEl : null, view === "files");
    setElementVisible(libraryEl instanceof HTMLElement ? libraryEl : null, view === "library");
    setElementVisible(calendarEl instanceof HTMLElement ? calendarEl : null, view === "calendar");

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

    if (!api || typeof api.getFitBrowserFolder !== "function" || typeof api.listFitBrowserFolder !== "function") {
        pathEl.textContent = "Browser unavailable (Electron API missing)";
        listEl.textContent = "";
        return;
    }

    const root = await api.getFitBrowserFolder();
    const rel = typeof getState(TAB_STATE_PATH_REL) === "string" ? String(getState(TAB_STATE_PATH_REL)) : "";

    if (!root) {
        pathEl.textContent = "No folder selected";
        listEl.innerHTML = '<div class="file-browser__empty">Choose a folder to browse .fit files.</div>';
        return;
    }

    const responseRaw = await api.listFitBrowserFolder(rel);
    if (!isFitBrowserListResponse(responseRaw)) {
        pathEl.textContent = root;
        listEl.innerHTML = '<div class="file-browser__empty">Unable to list folder.</div>';
        return;
    }

    const response = /** @type {FitBrowserListResponse} */ (responseRaw);
    const { entries, relPath } = response;

    const displayPath = relPath ? `${root} / ${relPath.replaceAll("/", " / ")}` : root;
    pathEl.textContent = displayPath;

    listEl.innerHTML = "";

    if (relPath) {
        const up = document.createElement("button");
        up.type = "button";
        up.className = "file-browser__item file-browser__item--dir";
        up.textContent = "..";
        up.addEventListener("click", async () => {
            setState(TAB_STATE_PATH_REL, parentRelPath(relPath), { source: "fileBrowser.up" });
            await refreshListing();
        });
        listEl.append(up);
    }

    if (entries.length === 0) {
        const empty = document.createElement("div");
        empty.className = "file-browser__empty";
        empty.textContent = "No .fit files found in this folder.";
        listEl.append(empty);
        return;
    }

    for (const entry of entries) {
        const { kind, name, relPath: entryRelPath, fullPath } = entry;
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = `file-browser__item ${kind === "dir" ? "file-browser__item--dir" : "file-browser__item--file"}`;
        btn.textContent = name;

        if (kind === "dir") {
            btn.addEventListener("click", async () => {
                setState(TAB_STATE_PATH_REL, entryRelPath, { source: "fileBrowser.enterDir" });
                await refreshListing();
            });
        } else {
            btn.addEventListener("click", async () => {
                const openFileBtn = document.getElementById("openFileBtn");

                await openFitFileFromPath({
                    filePath: fullPath,
                    openFileBtn: openFileBtn instanceof HTMLElement ? openFileBtn : undefined,
                    showNotification,
                });
            });
        }

        listEl.append(btn);
    }
}

/**
 * @param {string} root
 * @param {{ items: FitLibraryItem[], scannedAt: number } | null} payload
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
        gridEl.innerHTML = '<div class="file-browser__empty">No scan results yet. Click “Scan folder”.</div>';
        panelEl.innerHTML = '<div class="file-calendar__panelEmpty">No activities to display.</div>';
        return;
    }

    const prefs = getLibraryPrefs();
    const unitFactor = prefs.unit === "mi" ? 1 / 1609.344 : 1 / 1000;
    const unitLabel = prefs.unit;
    const fmt = (meters) => (meters * unitFactor).toFixed(1);

    const state = getCalendarState();
    const { monthStart, selectedDayKey } = state;
    const monthLabel = monthStart.toLocaleString(undefined, { month: "long", year: "numeric" });
    if (titleEl) {
        titleEl.textContent = `${monthLabel} — ${root}`;
    }

    const itemsByDay = groupItemsByDay(payload.items);

    const weekdayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const firstDay = new Date(monthStart.getFullYear(), monthStart.getMonth(), 1);
    const firstDow = firstDay.getDay();
    const firstIso = firstDow === 0 ? 7 : firstDow;
    const offset = firstIso - 1; // 0..6 where 0 is Monday
    const gridStart = new Date(firstDay);
    gridStart.setDate(firstDay.getDate() - offset);

    const todayKey = formatLocalDayKey(new Date());

    /** @type {string[]} */
    const parts = [];
    for (const wd of weekdayLabels) {
        parts.push(`<div class="file-calendar__weekday">${wd}</div>`);
    }

    for (let i = 0; i < 42; i++) {
        const day = new Date(gridStart);
        day.setDate(gridStart.getDate() + i);
        const dayKey = formatLocalDayKey(day);
        const inMonth = day.getMonth() === monthStart.getMonth();
        const isToday = dayKey === todayKey;
        const isSelected = dayKey === selectedDayKey;

        const dayItems = itemsByDay.get(dayKey) ?? [];
        const dayDistance = dayItems.reduce((acc, it) => acc + it.totalDistanceM, 0);

        const classes = ["file-calendar__day"];
        if (!inMonth) classes.push("file-calendar__day--outside");
        if (isToday) classes.push("file-calendar__day--today");
        if (isSelected) classes.push("file-calendar__day--selected");

        const meta =
            dayItems.length > 0
                ? `${fmt(dayDistance)} ${unitLabel}<br/>${dayItems.length} activity${dayItems.length === 1 ? "" : "ies"}`
                : "";

        parts.push(`
            <button type="button" class="${classes.join(" ")}" data-day="${dayKey}">
                <div class="file-calendar__dayNumber">${day.getDate()}</div>
                <div class="file-calendar__dayMeta">${meta}</div>
            </button>
        `);
    }

    gridEl.innerHTML = parts.join("\n");

    for (const btn of gridEl.querySelectorAll(".file-calendar__day")) {
        btn.addEventListener("click", () => {
            const { day: dayKeyRaw } = /** @type {DOMStringMap} */ (btn.dataset);
            const dayKey = dayKeyRaw || "";
            if (!dayKey) return;
            const next = { ...getCalendarState(), selectedDayKey: dayKey };
            persistCalendarState(next);
            renderCalendarResults(root, payload);
        });
    }

    // Selected-day panel
    const selectedItems = itemsByDay.get(selectedDayKey) ?? [];
    if (selectedItems.length === 0) {
        panelEl.innerHTML = `<div class="file-calendar__panelTitle">${selectedDayKey}</div><div class="file-calendar__panelEmpty">No activities.</div>`;
        return;
    }

    const rows = selectedItems
        .slice()
        .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
        .map((it) => {
            const when = it.startTime.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
            const dist = fmt(it.totalDistanceM);
            const sport = it.sport ? ` — ${it.sport}` : "";
            return `
                <button type="button" class="file-library__row" data-fullpath="${encodeURIComponent(it.fullPath)}">
                    <span class="file-library__rowMain">${it.fileName}</span>
                    <span class="file-library__rowMeta">${when} • ${dist} ${unitLabel}${sport}</span>
                </button>
            `;
        })
        .join("\n");

    panelEl.innerHTML = `<div class="file-calendar__panelTitle">${selectedDayKey}</div><div class="file-library__rows">${rows}</div>`;

    for (const btn of panelEl.querySelectorAll(".file-library__row")) {
        btn.addEventListener("click", async () => {
            const { fullpath: encodedRaw } = /** @type {DOMStringMap} */ (btn.dataset);
            const encoded = encodedRaw || "";
            const fullPath = decodeURIComponent(encoded);
            const openFileBtn = document.getElementById("openFileBtn");
            await openFitFileFromPath({
                filePath: fullPath,
                openFileBtn: openFileBtn instanceof HTMLElement ? openFileBtn : undefined,
                showNotification,
            });
        });
    }
}

/**
 * Render the Calendar view.
 */
async function renderCalendarView() {
    const api = getElectronAPI();
    const pathEl = document.getElementById("fit-browser-current-path");
    const calendarEl = document.getElementById("fit-browser-calendar");
    if (!(calendarEl instanceof HTMLElement) || !(pathEl instanceof HTMLElement)) {
        return;
    }

    if (!api || typeof api.getFitBrowserFolder !== "function") {
        pathEl.textContent = "Browser unavailable (Electron API missing)";
        calendarEl.textContent = "";
        return;
    }

    const root = await api.getFitBrowserFolder();
    if (!root) {
        pathEl.textContent = "No folder selected";
        calendarEl.innerHTML = '<div class="file-browser__empty">Choose a folder to view the calendar.</div>';
        return;
    }

    const cached = loadPersistedLibraryCache(root) ?? loadSessionLibraryCache(root);

    if (!calendarEl.dataset.ffvCalendarInitialized) {
        calendarEl.dataset.ffvCalendarInitialized = "true";
        calendarEl.innerHTML = `
            <div class="file-calendar">
                <div class="file-calendar__header">
                    <div class="file-calendar__title" id="fit-calendar-title"></div>
                    <div class="file-calendar__nav">
                        <button type="button" class="file-browser__btn" id="fit-calendar-prev">◀</button>
                        <button type="button" class="file-browser__btn" id="fit-calendar-today">Today</button>
                        <button type="button" class="file-browser__btn" id="fit-calendar-next">▶</button>
                        <button type="button" class="file-browser__btn" id="fit-calendar-scan">Scan folder</button>
                    </div>
                </div>
                <div class="file-calendar__grid" id="fit-calendar-grid"></div>
                <div class="file-calendar__panel" id="fit-calendar-panel"></div>
            </div>
        `;

        const prevBtn = document.getElementById("fit-calendar-prev");
        const nextBtn = document.getElementById("fit-calendar-next");
        const todayBtn = document.getElementById("fit-calendar-today");
        const scanBtn = document.getElementById("fit-calendar-scan");

        prevBtn?.addEventListener("click", () => {
            const st = getCalendarState();
            const next = { ...st, monthStart: addMonths(st.monthStart, -1) };
            persistCalendarState(next);
            renderCalendarResults(root, loadPersistedLibraryCache(root) ?? loadSessionLibraryCache(root));
        });
        nextBtn?.addEventListener("click", () => {
            const st = getCalendarState();
            const next = { ...st, monthStart: addMonths(st.monthStart, 1) };
            persistCalendarState(next);
            renderCalendarResults(root, loadPersistedLibraryCache(root) ?? loadSessionLibraryCache(root));
        });
        todayBtn?.addEventListener("click", () => {
            const now = new Date();
            const next = {
                monthStart: new Date(now.getFullYear(), now.getMonth(), 1),
                selectedDayKey: formatLocalDayKey(now),
            };
            persistCalendarState(next);
            renderCalendarResults(root, loadPersistedLibraryCache(root) ?? loadSessionLibraryCache(root));
        });
        scanBtn?.addEventListener("click", async () => {
            // Scan and then re-render calendar.
            await scanAndRenderLibrary(root);
            renderCalendarResults(root, loadPersistedLibraryCache(root) ?? loadSessionLibraryCache(root));
        });
    }

    renderCalendarResults(root, cached);
}

/**
 * @param {string} root
 * @param {{ items: FitLibraryItem[], scannedAt: number }} payload
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
        statusEl.textContent = scanned ? `Scanned ${scanned.toLocaleString()} — ${root}` : root;
    }

    if (cardsEl) {
        const lastDaysVal = fmt(totals.lastDaysDistanceM);
        const weekVal = fmt(totals.weekDistanceM);
        const monthVal = fmt(totals.monthDistanceM);
        cardsEl.innerHTML = `
            <div class="file-library__card"><div class="file-library__cardLabel">Files</div><div class="file-library__cardValue">${payload.items.length}</div></div>
            <div class="file-library__card"><div class="file-library__cardLabel">Last ${prefs.lastDays} days</div><div class="file-library__cardValue">${lastDaysVal} ${unitLabel}</div></div>
            <div class="file-library__card"><div class="file-library__cardLabel">This week</div><div class="file-library__cardValue">${weekVal} ${unitLabel}</div></div>
            <div class="file-library__card"><div class="file-library__cardLabel">This month</div><div class="file-library__cardValue">${monthVal} ${unitLabel}</div></div>
        `;
    }

    if (listEl) {
        const items = Array.isArray(payload?.items) ? payload.items.slice(0, 50) : [];
        if (items.length === 0) {
            listEl.innerHTML = '<div class="file-browser__empty">No activities decoded.</div>';
            return;
        }

        const rows = items
            .map((it) => {
                const date = it.startTime.toLocaleString();
                const dist = fmt(it.totalDistanceM);
                const sport = it.sport ? ` — ${it.sport}` : "";
                return `
                    <button type="button" class="file-library__row" data-fullpath="${encodeURIComponent(it.fullPath)}">
                        <span class="file-library__rowMain">${it.fileName}</span>
                        <span class="file-library__rowMeta">${date} • ${dist} ${unitLabel}${sport}</span>
                    </button>
                `;
            })
            .join("\n");

        listEl.innerHTML = `<div class="file-library__rows">${rows}</div>`;
        for (const btn of listEl.querySelectorAll(".file-library__row")) {
            btn.addEventListener("click", async () => {
                const encoded = btn.dataset.fullpath || "";
                const fullPath = decodeURIComponent(encoded);
                const openFileBtn = document.getElementById("openFileBtn");
                await openFitFileFromPath({
                    filePath: fullPath,
                    openFileBtn: openFileBtn instanceof HTMLElement ? openFileBtn : undefined,
                    showNotification,
                });
            });
        }
    }
}

async function renderLibraryView() {
    const api = getElectronAPI();
    const pathEl = document.getElementById("fit-browser-current-path");
    const libraryEl = document.getElementById("fit-browser-library");

    if (!(libraryEl instanceof HTMLElement) || !(pathEl instanceof HTMLElement)) {
        return;
    }

    if (!api || typeof api.getFitBrowserFolder !== "function" || typeof api.listFitBrowserFolder !== "function") {
        pathEl.textContent = "Browser unavailable (Electron API missing)";
        libraryEl.innerHTML = "";
        return;
    }

    const root = await api.getFitBrowserFolder();
    if (!root) {
        pathEl.textContent = "No folder selected";
        libraryEl.innerHTML = '<div class="file-browser__empty">Choose a folder to build a library summary.</div>';
        return;
    }

    // One-time scaffold.
    if (!libraryEl.dataset.ffvLibraryInitialized) {
        libraryEl.dataset.ffvLibraryInitialized = "true";
        libraryEl.innerHTML = `
            <div class="file-library">
                <div class="file-library__header">
                    <div class="file-library__title">Folder Summary</div>
                    <div class="file-library__controls">
                        <label class="file-library__control">
                            <span class="file-library__controlLabel">Last</span>
                            <input
                                type="number"
                                min="1"
                                max="3650"
                                step="1"
                                class="file-library__daysInput"
                                id="fit-library-days"
                            />
                            <span class="file-library__controlLabel">days</span>
                        </label>
                        <label class="file-library__control">
                            <span class="file-library__controlLabel">Units</span>
                            <select class="file-library__unitSelect" id="fit-library-unit">
                                <option value="km">km</option>
                                <option value="mi">mi</option>
                            </select>
                        </label>
                        <button type="button" class="file-browser__btn" id="fit-library-scan">Scan folder</button>
                    </div>
                </div>
                <div class="file-library__status" id="fit-library-status"></div>
                <div class="file-library__grid" id="fit-library-cards"></div>
                <div class="file-library__list" id="fit-library-activities"></div>
            </div>
        `;

        const scanBtn = document.getElementById("fit-library-scan");
        scanBtn?.addEventListener("click", async () => {
            await scanAndRenderLibrary(root);
        });

        // Initialize controls from persisted prefs.
        const prefs = getLibraryPrefs();
        const daysInput = /** @type {HTMLInputElement | null} */ (document.getElementById("fit-library-days"));
        const unitSelect = /** @type {HTMLSelectElement | null} */ (document.getElementById("fit-library-unit"));

        if (daysInput) {
            daysInput.value = String(prefs.lastDays);
            daysInput.addEventListener("change", () => {
                const next = Number(daysInput.value);
                const nextDays = Number.isFinite(next) ? Math.max(1, Math.min(3650, Math.floor(next))) : prefs.lastDays;
                persistLibraryPrefs({ ...getLibraryPrefs(), lastDays: nextDays });

                const cached = loadPersistedLibraryCache(root) ?? loadSessionLibraryCache(root);
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

                const cached = loadPersistedLibraryCache(root) ?? loadSessionLibraryCache(root);
                if (cached) {
                    renderLibraryResults(root, cached);
                }
            });
        }
    }

    // If we have cached results for this root (session + persisted), show them.
    const cachedForRoot = loadPersistedLibraryCache(root) ?? loadSessionLibraryCache(root);
    if (cachedForRoot) {
        renderLibraryResults(root, cachedForRoot);
        return;
    }

    const statusEl = document.getElementById("fit-library-status");
    if (statusEl) {
        statusEl.textContent = "Click ‘Scan folder’ to compute weekly/monthly totals.";
    }
}

/**
 * @param {string} root
 */
async function scanAndRenderLibrary(root) {
    const api = getElectronAPI();
    const statusEl = document.getElementById("fit-library-status");
    if (!api || typeof api.listFitBrowserFolder !== "function" || typeof api.readFile !== "function") {
        showNotification("Library scan is unavailable (Electron API missing).", "error");
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
 * Ensure view sections are mutually exclusive even if the browser's [hidden] styling is overridden.
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
 * @param {{ items: FitLibraryItem[], scannedAt: number }} payload
 */
function writeSessionLibraryCache(root, payload) {
    if (!globalThis.__ffvLibraryCache || typeof globalThis.__ffvLibraryCache !== "object") {
        globalThis.__ffvLibraryCache = {};
    }
    /** @type {any} */ (globalThis.__ffvLibraryCache)[root] = payload;
}
