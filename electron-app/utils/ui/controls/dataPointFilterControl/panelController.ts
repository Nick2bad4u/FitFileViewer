/**
 * Panel positioning and open/close controller for the data point filter UI.
 */

interface PanelController {
    closePanel: () => void;
    openPanel: () => void;
}

interface PanelControllerParams {
    container: HTMLElement;
    metricSelect: HTMLSelectElement;
    panel: HTMLElement;
    toggleButton: HTMLElement;
    viewportPadding: number;
}

/**
 * Create handlers that open, position, and close the data point filter panel.
 */
export function createPanelController({
    container,
    panel,
    toggleButton,
    metricSelect,
    viewportPadding,
}: PanelControllerParams): PanelController {
    let openPanelAbortController: AbortController | null = null;
    let pendingFrame = 0;

    function handleOutsideClick(event: MouseEvent): void {
        const target = event.target instanceof Node ? event.target : null;
        if (
            !panel.hidden &&
            target &&
            !container.contains(target) &&
            !panel.contains(target)
        ) {
            closePanel();
        }
    }

    function handleEscapeKey(event: KeyboardEvent): void {
        if (event.key === "Escape" && !panel.hidden) {
            closePanel({ restoreFocus: true });
        }
    }

    function ensurePanelAttached(): void {
        const { body } = document;
        if (body && panel.parentElement !== body) {
            body.append(panel);
            return;
        }
        if (!body && !panel.parentElement) {
            container.append(panel);
        }
    }

    function repositionPanel(): void {
        if (panel.hidden) {
            return;
        }
        const buttonRect = toggleButton.getBoundingClientRect();
        const panelRect = panel.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        if (panelRect.width === 0 || panelRect.height === 0) {
            return;
        }

        const centeredLeft =
            buttonRect.left + buttonRect.width / 2 - panelRect.width / 2;
        const maxLeft = viewportWidth - panelRect.width - viewportPadding;
        const clampedLeft = Math.max(
            viewportPadding,
            Math.min(centeredLeft, Math.max(viewportPadding, maxLeft))
        );

        let top = buttonRect.bottom + viewportPadding;
        let reverse = false;
        if (top + panelRect.height > viewportHeight - viewportPadding) {
            reverse = true;
            top = Math.max(
                viewportPadding,
                buttonRect.top - viewportPadding - panelRect.height
            );
        }

        panel.classList.toggle(
            "data-point-filter-control__panel--reverse",
            reverse
        );
        panel.style.left = `${Math.round(clampedLeft)}px`;
        panel.style.top = `${Math.round(top)}px`;

        const arrowRaw = buttonRect.left + buttonRect.width / 2 - clampedLeft;
        const arrowMin = 14;
        const arrowMax = Math.max(arrowMin, panelRect.width - 14);
        const arrowOffset = Math.max(arrowMin, Math.min(arrowRaw, arrowMax));
        panel.style.setProperty(
            "--data-point-filter-arrow-offset",
            `${Math.round(arrowOffset)}px`
        );
    }

    function queueReposition(): void {
        if (panel.hidden) {
            return;
        }
        cancelAnimationFrame(pendingFrame);
        pendingFrame = requestAnimationFrame(repositionPanel);
    }

    function removeOpenPanelListeners(): void {
        openPanelAbortController?.abort();
        openPanelAbortController = null;
    }

    function handleViewportResize(): void {
        queueReposition();
    }

    function handleViewportScroll(): void {
        queueReposition();
    }

    function openPanel(): void {
        if (!panel.hidden) {
            return;
        }
        ensurePanelAttached();
        cancelAnimationFrame(pendingFrame);
        pendingFrame = 0;
        panel.hidden = false;
        panel.style.opacity = "0";
        panel.style.pointerEvents = "none";
        container.classList.add("data-point-filter-control--open");
        toggleButton.setAttribute("aria-expanded", "true");
        removeOpenPanelListeners();
        openPanelAbortController = new AbortController();
        const { signal } = openPanelAbortController;
        document.addEventListener("mousedown", handleOutsideClick, {
            capture: true,
            signal,
        });
        panel.addEventListener("keydown", handleEscapeKey, { signal });
        window.addEventListener("resize", handleViewportResize, { signal });
        window.addEventListener("scroll", handleViewportScroll, {
            capture: true,
            signal,
        });
        pendingFrame = requestAnimationFrame(() => {
            pendingFrame = 0;
            repositionPanel();
            panel.style.opacity = "";
            panel.style.pointerEvents = "";
            metricSelect.focus();
        });
    }

    function closePanel(options: { restoreFocus?: boolean } = {}): void {
        if (!panel.hidden) {
            panel.hidden = true;
        }
        cancelAnimationFrame(pendingFrame);
        pendingFrame = 0;
        removeOpenPanelListeners();
        container.classList.remove("data-point-filter-control--open");
        toggleButton.setAttribute("aria-expanded", "false");
        panel.classList.remove("data-point-filter-control__panel--reverse");
        panel.style.left = "";
        panel.style.top = "";
        panel.style.opacity = "";
        panel.style.pointerEvents = "";
        panel.style.removeProperty("--data-point-filter-arrow-offset");
        if (options.restoreFocus) {
            toggleButton.focus();
        }
    }

    return { closePanel, openPanel };
}
