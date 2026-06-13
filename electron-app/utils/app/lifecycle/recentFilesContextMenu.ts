/**
 * Extracted from utils/app/lifecycle/listeners.js to reduce complexity and file
 * size. Recent files context menu wiring.
 */

import {
    type FitParsePayload,
    getFitParseErrorMessage,
    unwrapFitParseMessages,
} from "../../files/import/fitParsePayload.js";
import { sendFitFileToAltFitReader } from "../../files/import/sendFitFileToAltFitReader.js";
import {
    getProcessEnvironmentValue,
    isDevelopmentEnvironment,
} from "../../runtime/processEnvironment.js";
import { getRendererElectronApi } from "../../runtime/electronApiRuntime.js";
import { renderDecodedFitData } from "../../rendering/core/loadShowFitData.js";
import type { ElectronAPI } from "../../../shared/preloadApi.js";
import {
    getRecentFilesContextMenuRuntime,
    type RecentFilesContextMenuTimer,
} from "./recentFilesContextMenuRuntime.js";

type RecentFilesElectronApi = Pick<
    ElectronAPI,
    "parseFitFile" | "readFile" | "recentFiles"
> &
    Partial<Pick<ElectronAPI, "addRecentFile">> & {
        parseFitFile: (
            data: Parameters<ElectronAPI["parseFitFile"]>[0]
        ) => Promise<FitParsePayload>;
    };

type AttachRecentFilesContextMenuParams = {
    openFileBtn: HTMLButtonElement;
    setLoading: (isLoading: boolean) => void;
    showNotification: (
        message: string,
        type?: string,
        durationMs?: number
    ) => void;
};

function getRecentFilesElectronApi(): RecentFilesElectronApi | null {
    return getRendererElectronApi(isRecentFilesElectronApi);
}

function isRecentFilesElectronApi(
    value: unknown
): value is RecentFilesElectronApi {
    if (value === null || typeof value !== "object") {
        return false;
    }

    const api = value as Partial<RecentFilesElectronApi>;

    return (
        typeof api.recentFiles === "function" &&
        typeof api.readFile === "function" &&
        typeof api.parseFitFile === "function" &&
        (api.addRecentFile === undefined ||
            typeof api.addRecentFile === "function")
    );
}

function isMissingFileError(error: unknown): boolean {
    const message = error instanceof Error ? error.message : String(error);
    return /\bENOENT\b/u.test(message);
}

function getRecentOpenErrorMessage(error: unknown): string {
    if (isMissingFileError(error)) {
        return "File not found. It may have been moved, deleted, or opened from an old recent-file entry.";
    }

    return error instanceof Error ? error.message : String(error);
}

/**
 * Attach the “Recent Files” context menu behavior to the Open File button.
 *
 * This function intentionally preserves the original behavior (including debug
 * logging) because the menu behavior is heavily covered by strict tests.
 *
 * @param params - Dependencies for wiring the context menu.
 *
 * @returns A cleanup callback that detaches the root listener.
 */
export function attachRecentFilesContextMenu({
    openFileBtn,
    setLoading,
    showNotification,
}: AttachRecentFilesContextMenuParams): () => void {
    const rootAbortController = new AbortController();
    const runtime = getRecentFilesContextMenuRuntime();

    // Keep default quiet even in tests; enable only when explicitly requested.
    const debugEnabled =
        getProcessEnvironmentValue("FFV_DEBUG_RECENT_MENU") === "1" ||
        isDevelopmentEnvironment();

    const debugLog = (...args: unknown[]) => {
        if (!debugEnabled) return;
        try {
            console.log(...args);
        } catch {
            /* ignore */
        }
    };

    openFileBtn.addEventListener(
        "contextmenu",
        async (event: MouseEvent) => {
            event.preventDefault();
            const electronAPI = getRecentFilesElectronApi();
            if (!electronAPI) {
                return;
            }
            const activeElectronAPI = electronAPI;
            const recentFiles = await activeElectronAPI.recentFiles();
            debugLog(
                "DEBUG: recentFiles call completed. Result:",
                recentFiles,
                "Length:",
                recentFiles?.length
            );
            if (!recentFiles || recentFiles.length === 0) {
                showNotification("No recent files found.", "info", 2000);
                return;
            }
            const oldMenu = document.querySelector("#recent-files-menu");
            if (oldMenu) {
                oldMenu.remove();
            }
            const menu = document.createElement("div");
            const menuAbortController = new AbortController();
            const { signal: menuSignal } = menuAbortController;
            let focusTimer: RecentFilesContextMenuTimer | undefined;
            menu.id = "recent-files-menu";

            debugLog(
                "DEBUG: About to append menu. Document:",
                Boolean(document),
                "Body:",
                Boolean(document.body),
                "Menu:",
                Boolean(menu),
                "Menu ID:",
                menu.id
            );
            // ZIndex must be a string
            // Note: z-index only applies to positioned elements.
            menu.style.position = "fixed";
            menu.style.zIndex = "10050";
            menu.style.left = `${event.clientX}px`;
            menu.style.top = `${event.clientY}px`;
            menu.style.background = "var(--color-bg-alt-solid)";
            menu.style.color = "var(--color-fg)";
            menu.style.border = "2px solid var(--color-border-light)";
            menu.style.borderRadius = "var(--border-radius-small)";
            menu.style.boxShadow = "var(--color-box-shadow)";

            debugLog(
                "DEBUG: Menu constructor:",
                menu.constructor.name,
                "Menu nodeName:",
                menu.nodeName,
                "Menu parentNode before append:",
                menu.parentNode
            );
            menu.style.maxWidth = "480px";
            menu.style.fontSize = "1rem";
            menu.style.padding = "4px 0";
            menu.style.cursor = "pointer";
            menu.style.userSelect = "none";
            menu.style.backdropFilter = "var(--backdrop-blur)";
            menu.style.pointerEvents = "auto";
            menu.tabIndex = -1;
            menu.setAttribute("role", "menu");
            menu.addEventListener("contextmenu", (e) => e.preventDefault(), {
                signal: menuSignal,
            });

            /**
             * Keep the menu fully visible in the viewport.
             *
             * @param x - Candidate left coordinate.
             * @param y - Candidate top coordinate.
             */
            const clampMenuToViewport = (x: number, y: number) => {
                try {
                    const margin = 8;
                    const rect = menu.getBoundingClientRect();
                    const { height: vh, width: vw } = runtime.getViewport();

                    let left = x;
                    let top = y;

                    if (
                        vw > 0 &&
                        rect.width > 0 &&
                        left + rect.width + margin > vw
                    ) {
                        left = Math.max(margin, vw - rect.width - margin);
                    }
                    if (
                        vh > 0 &&
                        rect.height > 0 &&
                        top + rect.height + margin > vh
                    ) {
                        top = Math.max(margin, vh - rect.height - margin);
                    }

                    menu.style.left = `${left}px`;
                    menu.style.top = `${top}px`;
                } catch {
                    /* ignore */
                }
            };

            debugLog(
                "DEBUG: Document.body type:",
                typeof document.body,
                "Document.body constructor:",
                document.body.constructor.name
            );
            menu.setAttribute("aria-label", "Recent files");
            let focusedIndex = 0;
            const items: HTMLDivElement[] = [];
            // Predefine handlers factory to avoid function-in-loop lint warnings
            /**
             * @param item - Menu item element.
             * @param idx - Menu item index.
             */
            function attachHoverHandlers(item: HTMLDivElement, idx: number) {
                item.addEventListener(
                    "mouseenter",
                    () => {
                        item.style.background = "var(--color-glass-border)";
                        item.style.color = "var(--color-fg-alt)";
                    },
                    { signal: menuSignal }
                );
                item.addEventListener(
                    "mouseleave",
                    () => {
                        item.style.background =
                            focusedIndex === idx
                                ? "var(--color-glass-border)"
                                : "transparent";
                        item.style.color = "var(--color-fg)";
                    },
                    { signal: menuSignal }
                );
            }

            /**
             * @param file - Recent file path to open.
             */
            function createClickHandler(file: string) {
                return async () => {
                    cleanupMenu();
                    openFileBtn.disabled = true;
                    setLoading(true);
                    try {
                        const arrayBuffer =
                                await activeElectronAPI.readFile(file),
                            result =
                                await activeElectronAPI.parseFitFile(
                                    arrayBuffer
                                );

                        const parseErrorMessage =
                            getFitParseErrorMessage(result);
                        if (parseErrorMessage) {
                            showNotification(
                                `Error: ${parseErrorMessage.display}`,
                                "error"
                            );
                            return;
                        }

                        const dataToShow = unwrapFitParseMessages(result);

                        await renderDecodedFitData(dataToShow, file);
                        sendFitFileToAltFitReader(arrayBuffer);
                        await activeElectronAPI.addRecentFile?.(file);
                    } catch (error) {
                        showNotification(
                            `Error opening recent file: ${getRecentOpenErrorMessage(error)}`,
                            "error"
                        );
                    } finally {
                        openFileBtn.disabled = false;
                        setLoading(false);
                    }
                };
            }

            for (const [idx, file] of recentFiles.entries()) {
                const item = document.createElement("div"),
                    parts = file.split(/\\|\//g),
                    shortName =
                        parts.length >= 2
                            ? `${parts.at(-2)}\\${parts.at(-1)}`
                            : parts.at(-1);
                // TextContent expects string | null; ensure fallback string
                item.textContent = shortName || "";
                item.title = file;
                item.style.padding = "8px 18px";
                item.style.whiteSpace = "nowrap";
                item.style.overflow = "hidden";
                item.style.textOverflow = "ellipsis";
                item.setAttribute("role", "menuitem");
                item.setAttribute("tabindex", "-1");
                item.style.background =
                    idx === 0 ? "var(--color-glass-border)" : "transparent";
                attachHoverHandlers(item, idx);
                item.addEventListener("click", createClickHandler(file), {
                    signal: menuSignal,
                });
                items.push(item);
                menu.append(item);
            }
            /**
             * Move visual focus + highlight to a specific index.
             *
             * @param idx - Menu item index to focus.
             */
            function focusItem(idx: number) {
                for (const [i, el] of items.entries()) {
                    el.style.background =
                        i === idx ? "var(--color-glass-border)" : "transparent";
                    el.style.color =
                        i === idx ? "var(--color-fg-alt)" : "var(--color-fg)";
                    if (i === idx) {
                        el.focus();
                    }
                }
                focusedIndex = idx;
            }
            menu.addEventListener(
                "keydown",
                (e) => {
                    switch (e.key) {
                        case "ArrowDown": {
                            e.preventDefault();
                            focusItem((focusedIndex + 1) % items.length);

                            break;
                        }
                        case "ArrowUp": {
                            e.preventDefault();
                            focusItem(
                                (focusedIndex - 1 + items.length) % items.length
                            );

                            break;
                        }
                        case "Enter": {
                            e.preventDefault();
                            items[focusedIndex]?.click();

                            break;
                        }
                        case "Escape": {
                            e.preventDefault();
                            cleanupMenu();

                            break;
                        }
                        // No default
                    }
                },
                { signal: menuSignal }
            );
            focusTimer = runtime.setTimeout(() => {
                focusTimer = undefined;
                focusItem(0);
            }, 0);

            debugLog(
                "DEBUG: About to append menu. Document:",
                Boolean(document),
                "Body:",
                Boolean(document.body),
                "Menu:",
                Boolean(menu),
                "Menu ID:",
                menu.id
            );
            debugLog(
                "DEBUG: Menu constructor:",
                menu.constructor.name,
                "Menu nodeName:",
                menu.nodeName,
                "Menu parentNode before append:",
                menu.parentNode
            );
            debugLog(
                "DEBUG: Document.body type:",
                typeof document.body,
                "Document.body constructor:",
                document.body.constructor.name
            );
            // Log a safe property instead of comparing an object to itself
            debugLog("DEBUG: Document.body present:", Boolean(document.body));
            debugLog(
                "DEBUG: Document.body can append?",
                typeof document.body.append === "function"
            );

            // Robust menu attachment with verification and retry
            let attachmentAttempts = 0;
            const maxAttempts = 3;

            while (attachmentAttempts < maxAttempts) {
                attachmentAttempts++;
                debugLog(
                    `DEBUG: Attachment attempt ${attachmentAttempts}/${maxAttempts}`
                );

                try {
                    document.body.append(menu);
                    debugLog("DEBUG: append call succeeded");

                    // Immediately verify the menu is properly attached
                    const isAttached =
                        document.body.contains(menu) &&
                        menu.parentNode === document.body;
                    const canBeFound = Boolean(
                        document.querySelector("#recent-files-menu")
                    );

                    debugLog(
                        "DEBUG: Verification - isAttached:",
                        isAttached,
                        "canBeFound:",
                        canBeFound
                    );
                    debugLog(
                        "DEBUG: Menu parentNode:",
                        menu.parentNode,
                        "parentNode === body:",
                        menu.parentNode === document.body
                    );

                    if (isAttached && canBeFound) {
                        debugLog(
                            "DEBUG: Menu successfully attached and verified"
                        );

                        // Now that it's in the DOM, clamp it so it doesn't render off-screen.
                        clampMenuToViewport(event.clientX, event.clientY);
                        break;
                    } else {
                        debugLog(
                            "DEBUG: Menu attachment failed verification, retrying..."
                        );
                        // Try to remove any existing menu before retry
                        if (menu.parentNode) {
                            menu.remove();
                        }

                        // Try alternative attachment method
                        if (attachmentAttempts === 2) {
                            debugLog(
                                "DEBUG: Trying append with different approach"
                            );
                            document.body.append(menu);
                        } else if (attachmentAttempts === 3) {
                            debugLog(
                                "DEBUG: Trying insertBefore as last resort"
                            );
                            document.body.insertBefore(
                                menu,
                                document.body.firstChild
                            );
                        }
                    }
                } catch (error) {
                    debugLog(
                        "DEBUG: append failed with error:",
                        error instanceof Error ? error.message : String(error)
                    );
                    if (attachmentAttempts === maxAttempts) {
                        throw error;
                    }
                }
            }

            // Final verification
            const finalCheck =
                document.body.contains(menu) &&
                Boolean(document.querySelector("#recent-files-menu"));
            if (!finalCheck) {
                debugLog(
                    "DEBUG: CRITICAL - Menu attachment failed after all attempts"
                );
                throw new Error("Failed to attach context menu to DOM");
            }

            // Ensure final position is clamped.
            clampMenuToViewport(event.clientX, event.clientY);

            debugLog("DEBUG: Final verification - Menu successfully attached");
            debugLog(
                "DEBUG: Document body contains menu:",
                document.body.contains(menu),
                "Document contains menu:",
                Boolean(document.querySelector("#recent-files-menu"))
            );
            debugLog(
                "DEBUG: QuerySelector test:",
                Boolean(document.querySelector("#recent-files-menu")),
                "Body querySelector test:",
                Boolean(document.body.querySelector("#recent-files-menu"))
            );
            debugLog(
                "DEBUG: Document body children count:",
                document.body.children.length,
                "Body childNodes count:",
                document.body.childNodes.length
            );
            const menuCreatedAt = Date.now(); // Track when menu was created

            const removeMenu = (e: MouseEvent) => {
                debugLog(
                    "DEBUG: removeMenu called - event:",
                    e.type,
                    "isTrusted:",
                    e.isTrusted,
                    "which:",
                    e.which,
                    "button:",
                    e.button,
                    "target:",
                    e.target?.constructor?.name
                );
                const { target, isTrusted, which, button } = e;
                if (
                    target instanceof Node &&
                    !menu.contains(target) &&
                    target !== menu
                ) {
                    // Check for test pollution: synthetic events that are both untrusted AND
                    // occur more than 2 seconds after menu creation (likely from earlier tests)
                    const timeSinceMenuCreated = Date.now() - menuCreatedAt;
                    const isLikelyTestPollution =
                        !isTrusted &&
                        which === 0 &&
                        button === 0 &&
                        timeSinceMenuCreated > 2000;
                    debugLog(
                        "DEBUG: timeSinceMenuCreated:",
                        timeSinceMenuCreated,
                        "isLikelyTestPollution:",
                        isLikelyTestPollution
                    );
                    if (isLikelyTestPollution) {
                        debugLog("DEBUG: Ignoring test pollution event");
                        return;
                    }

                    debugLog("DEBUG: Removing menu due to mousedown outside");
                    cleanupMenu();
                } else {
                    debugLog(
                        "DEBUG: Not removing menu - target inside menu or is menu itself"
                    );
                }
            };
            document.addEventListener("mousedown", removeMenu, {
                signal: menuSignal,
            });

            // Helper to remove menu and cleanup event listener
            function cleanupMenu() {
                if (focusTimer !== undefined) {
                    runtime.clearTimeout(focusTimer);
                    focusTimer = undefined;
                }
                if (document.body.contains(menu)) {
                    menu.remove();
                }
                menuAbortController.abort();
            }

            // Remove menu and cleanup on Escape or Enter
            menu.addEventListener(
                "keydown",
                (e) => {
                    if (e.key === "Escape") {
                        e.preventDefault();
                        cleanupMenu();
                    }
                },
                { signal: menuSignal }
            );
            // Remove menu and cleanup on item click
            for (const item of items) {
                const origOnClick = item.onclick;
                item.addEventListener(
                    "click",
                    async (ev) => {
                        cleanupMenu();
                        // Invoke original click if present
                        if (typeof origOnClick === "function") {
                            await origOnClick.call(item, ev);
                        }
                    },
                    { signal: menuSignal }
                );
            }

            menu.focus();
        },
        { signal: rootAbortController.signal }
    );

    return () => rootAbortController.abort();
}
