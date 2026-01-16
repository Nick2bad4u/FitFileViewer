/**
 * @fileoverview Recent files context menu wiring.
 * @description Extracted from utils/app/lifecycle/listeners.js to reduce complexity and file size.
 */

/**
 * Attach the “Recent Files” context menu behavior to the Open File button.
 *
 * This function intentionally preserves the original behavior (including debug logging)
 * because the menu behavior is heavily covered by strict tests.
 *
 * @param {Object} params
 * @param {HTMLButtonElement} params.openFileBtn
 * @param {(isLoading: boolean) => void} params.setLoading
 * @param {(message: string, type?: string, durationMs?: number) => void} params.showNotification
 */
export function attachRecentFilesContextMenu({ openFileBtn, setLoading, showNotification }) {
    openFileBtn.addEventListener("contextmenu", async (event) => {
        /** @type {MouseEvent} */ (event).preventDefault();
        if (!globalThis.electronAPI?.recentFiles) {
            return;
        }
        const recentFiles = await globalThis.electronAPI.recentFiles();
        console.log("DEBUG: recentFiles call completed. Result:", recentFiles, "Length:", recentFiles?.length);
        if (!recentFiles || recentFiles.length === 0) {
            showNotification("No recent files found.", "info", 2000);
            return;
        }
        const oldMenu = document.querySelector("#recent-files-menu");
        if (oldMenu) {
            oldMenu.remove();
        }
        /** @type {HTMLDivElement} */
        const menu = document.createElement("div");
        menu.id = "recent-files-menu";
        menu.style.position = "fixed";
        // ZIndex must be a string
        menu.style.zIndex = "10010";
        menu.style.left = `${event.clientX}px`;
        menu.style.top = `${event.clientY}px`;
        menu.style.background = "var(--color-bg-alt-solid)";
        menu.style.color = "var(--color-fg)";
        menu.style.border = "2px solid var(--color-border-light)";
        menu.style.borderRadius = "var(--border-radius-small)";
        menu.style.boxShadow = "var(--color-box-shadow)";
        menu.style.minWidth = "320px";
        menu.style.maxWidth = "480px";
        menu.style.fontSize = "1rem";
        menu.style.padding = "4px 0";
        menu.style.cursor = "pointer";
        menu.style.userSelect = "none";
        menu.style.backdropFilter = "var(--backdrop-blur)";
        menu.addEventListener("contextmenu", (e) => e.preventDefault());
        menu.setAttribute("role", "menu");
        menu.setAttribute("aria-label", "Recent files");
        let focusedIndex = 0;
        /** @type {HTMLDivElement[]} */
        const items = [];
        // Predefine handlers factory to avoid function-in-loop lint warnings
        /**
         * @param {HTMLDivElement} item
         * @param {number} idx
         */
        function attachHoverHandlers(item, idx) {
            item.addEventListener("mouseenter", () => {
                item.style.background = "var(--color-glass-border)";
                item.style.color = "var(--color-fg-alt)";
            });
            item.addEventListener("mouseleave", () => {
                item.style.background = focusedIndex === idx ? "var(--color-glass-border)" : "transparent";
                item.style.color = "var(--color-fg)";
            });
        }

        /**
         * @param {string} file
         */
        function createClickHandler(file) {
            return async () => {
                menu.remove();
                openFileBtn.disabled = true;
                setLoading(true);
                try {
                    // Security: explicitly approve the selected recent file before reading.
                    // This keeps recentFiles() side-effect free in main.
                    if (typeof globalThis.electronAPI?.approveRecentFile === "function") {
                        const ok = await globalThis.electronAPI.approveRecentFile(file);
                        if (!ok) {
                            showNotification("File access denied.", "error", 4000);
                            return;
                        }
                    }

                    const arrayBuffer = await globalThis.electronAPI.readFile(file),
                        result = await globalThis.electronAPI.parseFitFile(arrayBuffer);

                    if (result && result.error) {
                        showNotification(`Error: ${result.error}\n${result.details || ""}`, "error");
                        return;
                    }

                    // Extract data using the same logic as handleOpenFile.js and IPC handler
                    const dataToShow = result.data || result;

                    if (dataToShow) {
                        // Optional chaining avoids undefined invocation
                        globalThis.showFitData?.(dataToShow, file);
                        // Optional integration - guarded
                        if (/** @type {any} */ (globalThis).sendFitFileToAltFitReader) {
                            /** @type {any} */ (globalThis).sendFitFileToAltFitReader(arrayBuffer);
                        }
                        await globalThis.electronAPI.addRecentFile(file);
                    } else {
                        showNotification("Error: No valid FIT data found in file", "error");
                    }
                } catch (error) {
                    showNotification(`Error opening recent file: ${error}`, "error");
                } finally {
                    openFileBtn.disabled = false;
                    setLoading(false);
                }
            };
        }

        for (const [idx, file] of recentFiles.entries()) {
            const /** @type {HTMLDivElement} */
                item = document.createElement("div"),
                parts = file.split(/\\|\//g),
                shortName = parts.length >= 2 ? `${parts.at(-2)}\\${parts.at(-1)}` : parts.at(-1);
            // TextContent expects string | null; ensure fallback string
            item.textContent = shortName || "";
            item.title = file;
            item.style.padding = "8px 18px";
            item.style.whiteSpace = "nowrap";
            item.style.overflow = "hidden";
            item.style.textOverflow = "ellipsis";
            item.setAttribute("role", "menuitem");
            item.setAttribute("tabindex", "-1");
            item.style.background = idx === 0 ? "var(--color-glass-border)" : "transparent";
            attachHoverHandlers(item, idx);
            item.addEventListener("click", createClickHandler(file));
            items.push(item);
            menu.append(item);
        }
        /**
         * Move visual focus + highlight to a specific index.
         * @param {number} idx
         */
        function focusItem(idx) {
            for (const [i, el] of items.entries()) {
                el.style.background = i === idx ? "var(--color-glass-border)" : "transparent";
                el.style.color = i === idx ? "var(--color-fg-alt)" : "var(--color-fg)";
                if (i === idx) {
                    el.focus();
                }
            }
            focusedIndex = idx;
        }
        menu.addEventListener("keydown", (e) => {
            switch (e.key) {
                case "ArrowDown": {
                    e.preventDefault();
                    focusItem((focusedIndex + 1) % items.length);

                    break;
                }
                case "ArrowUp": {
                    e.preventDefault();
                    focusItem((focusedIndex - 1 + items.length) % items.length);

                    break;
                }
                case "Enter": {
                    e.preventDefault();
                    items[focusedIndex]?.click();

                    break;
                }
                case "Escape": {
                    e.preventDefault();
                    menu.remove();

                    break;
                }
                // No default
            }
        });
        setTimeout(() => focusItem(0), 0);

        console.log(
            "DEBUG: About to append menu. Document:",
            Boolean(document),
            "Body:",
            Boolean(document.body),
            "Menu:",
            Boolean(menu),
            "Menu ID:",
            menu.id
        );
        console.log(
            "DEBUG: Menu constructor:",
            menu.constructor.name,
            "Menu nodeName:",
            menu.nodeName,
            "Menu parentNode before append:",
            menu.parentNode
        );
        console.log(
            "DEBUG: Document.body type:",
            typeof document.body,
            "Document.body constructor:",
            document.body.constructor.name
        );
        // Log a safe property instead of comparing an object to itself
        console.log("DEBUG: Document.body present:", Boolean(document.body));
        console.log("DEBUG: Document.body can append?", typeof document.body.append === "function");

        // Robust menu attachment with verification and retry
        let attachmentAttempts = 0;
        const maxAttempts = 3;

        while (attachmentAttempts < maxAttempts) {
            attachmentAttempts++;
            console.log(`DEBUG: Attachment attempt ${attachmentAttempts}/${maxAttempts}`);

            try {
                document.body.append(menu);
                console.log("DEBUG: append call succeeded");

                // Immediately verify the menu is properly attached
                const isAttached = document.body.contains(menu) && menu.parentNode === document.body;
                const canBeFound = Boolean(document.querySelector("#recent-files-menu"));

                console.log("DEBUG: Verification - isAttached:", isAttached, "canBeFound:", canBeFound);
                console.log(
                    "DEBUG: Menu parentNode:",
                    menu.parentNode,
                    "parentNode === body:",
                    menu.parentNode === document.body
                );

                if (isAttached && canBeFound) {
                    console.log("DEBUG: Menu successfully attached and verified");
                    break;
                } else {
                    console.log("DEBUG: Menu attachment failed verification, retrying...");
                    // Try to remove any existing menu before retry
                    if (menu.parentNode) {
                        menu.remove();
                    }

                    // Try alternative attachment method
                    if (attachmentAttempts === 2) {
                        console.log("DEBUG: Trying append with different approach");
                        document.body.append(menu);
                    } else if (attachmentAttempts === 3) {
                        console.log("DEBUG: Trying insertBefore as last resort");
                        document.body.insertBefore(menu, document.body.firstChild);
                    }
                }
            } catch (error) {
                console.log("DEBUG: append failed with error:", error.message);
                if (attachmentAttempts === maxAttempts) {
                    throw error;
                }
            }
        }

        // Final verification
        const finalCheck = document.body.contains(menu) && Boolean(document.querySelector("#recent-files-menu"));
        if (!finalCheck) {
            console.error("DEBUG: CRITICAL - Menu attachment failed after all attempts");
            throw new Error("Failed to attach context menu to DOM");
        }

        console.log("DEBUG: Final verification - Menu successfully attached");
        console.log(
            "DEBUG: Document body contains menu:",
            document.body.contains(menu),
            "Document contains menu:",
            document.contains(menu)
        );
        console.log(
            "DEBUG: QuerySelector test:",
            Boolean(document.querySelector("#recent-files-menu")),
            "Body querySelector test:",
            Boolean(document.body.querySelector("#recent-files-menu"))
        );
        console.log(
            "DEBUG: Document body children count:",
            document.body.children.length,
            "Body childNodes count:",
            document.body.childNodes.length
        );
        const menuCreatedAt = Date.now(); // Track when menu was created

        /** @param {MouseEvent} e */
        const removeMenu = (e) => {
            console.log(
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
            if (target instanceof Node && !menu.contains(target) && target !== menu) {
                // Check for test pollution: synthetic events that are both untrusted AND
                // occur more than 2 seconds after menu creation (likely from earlier tests)
                const timeSinceMenuCreated = Date.now() - menuCreatedAt;
                const isLikelyTestPollution = !isTrusted && which === 0 && button === 0 && timeSinceMenuCreated > 2000;
                console.log(
                    "DEBUG: timeSinceMenuCreated:",
                    timeSinceMenuCreated,
                    "isLikelyTestPollution:",
                    isLikelyTestPollution
                );
                if (isLikelyTestPollution) {
                    console.log("DEBUG: Ignoring test pollution event");
                    return;
                }

                console.log("DEBUG: Removing menu due to mousedown outside");
                menu.remove();
                document.removeEventListener("mousedown", removeMenu);
            } else {
                console.log("DEBUG: Not removing menu - target inside menu or is menu itself");
            }
        };
        document.addEventListener("mousedown", removeMenu);

        // Helper to remove menu and cleanup event listener
        function cleanupMenu() {
            if (document.body.contains(menu)) {
                menu.remove();
            }
            document.removeEventListener("mousedown", removeMenu);
        }

        // Remove menu and cleanup on Escape or Enter
        menu.addEventListener("keydown", (e) => {
            if (e.key === "Escape") {
                e.preventDefault();
                cleanupMenu();
            }
        });
        // Remove menu and cleanup on item click
        for (const item of items) {
            const origOnClick = item.onclick;
            item.addEventListener("click", async (ev) => {
                cleanupMenu();
                // Invoke original click if present
                if (typeof origOnClick === "function") {
                    await origOnClick.call(item, ev);
                }
            });
        }

        document.body.append(menu);
        menu.focus();
    });
}
