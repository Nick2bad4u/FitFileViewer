/**
 * Folder-based FIT file browser tab.
 *
 * This is intentionally lightweight:
 * - The main process owns the persisted root folder and enforces that listings remain within it.
 * - The renderer requests directory listings and can open a selected .fit file by path.
 */

import { openFitFileFromPath } from "../../files/import/openFitFileFromPath.js";
import { getState, setState } from "../../state/core/stateManager.js";
import { showNotification } from "../notifications/showNotification.js";

/** @typedef {{ name: string, kind: 'dir'|'file', relPath: string, fullPath: string }} FitBrowserEntry */
/** @typedef {{ root: string|null, relPath: string, entries: FitBrowserEntry[] }} FitBrowserListResponse */

const TAB_STATE_PATH_REL = "browser.relPath";

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
            <div class="file-browser">
                <div class="file-browser__header">
                    <button type="button" class="file-browser__btn" id="fit-browser-pick-folder">Choose Folder</button>
                    <div class="file-browser__path" id="fit-browser-current-path"></div>
                </div>
                <div class="file-browser__list" id="fit-browser-list" role="list"></div>
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
                await refreshListing();
            });
        }
    }

    await refreshListing();
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
 * @param {string} relPath
 * @returns {string}
 */
function parentRelPath(relPath) {
    const normalized = relPath.replaceAll("\\", "/").replace(/^\/+/, "").replace(/\/+$/, "");
    const idx = normalized.lastIndexOf("/");
    if (idx === -1) return "";
    return normalized.slice(0, idx);
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
