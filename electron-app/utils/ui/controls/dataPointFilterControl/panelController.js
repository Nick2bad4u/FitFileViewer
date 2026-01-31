/**
 * Panel positioning and open/close controller for the data point filter UI.
 */

/**
 * @param {{
 *     container: HTMLElement;
 *     panel: HTMLElement;
 *     toggleButton: HTMLElement;
 *     metricSelect: HTMLSelectElement;
 *     viewportPadding: number;
 * }} params
 *
 * @returns {{ openPanel: () => void; closePanel: () => void }}
 */
export function createPanelController({
    container,
    panel,
    toggleButton,
    metricSelect,
    viewportPadding,
}) {
    let pendingFrame = 0;

    function handleOutsideClick(event) {
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

    function ensurePanelAttached() {
        const { body } = document;
        if (body && panel.parentElement !== body) {
            body.append(panel);
            return;
        }
        if (!body && !panel.parentElement) {
            container.append(panel);
        }
    }

    function repositionPanel() {
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

    function queueReposition() {
        if (panel.hidden) {
            return;
        }
        cancelAnimationFrame(pendingFrame);
        pendingFrame = requestAnimationFrame(repositionPanel);
    }

    function handleViewportResize() {
        queueReposition();
    }

    function handleViewportScroll() {
        queueReposition();
    }

    function openPanel() {
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
        document.addEventListener("mousedown", handleOutsideClick, true);
        window.addEventListener("resize", handleViewportResize);
        window.addEventListener("scroll", handleViewportScroll, true);
        requestAnimationFrame(() => {
            repositionPanel();
            panel.style.opacity = "";
            panel.style.pointerEvents = "";
            metricSelect.focus();
        });
    }

    function closePanel() {
        if (!panel.hidden) {
            panel.hidden = true;
        }
        cancelAnimationFrame(pendingFrame);
        pendingFrame = 0;
        document.removeEventListener("mousedown", handleOutsideClick, true);
        window.removeEventListener("resize", handleViewportResize);
        window.removeEventListener("scroll", handleViewportScroll, true);
        container.classList.remove("data-point-filter-control--open");
        toggleButton.setAttribute("aria-expanded", "false");
        panel.classList.remove("data-point-filter-control__panel--reverse");
        panel.style.left = "";
        panel.style.top = "";
        panel.style.opacity = "";
        panel.style.pointerEvents = "";
        panel.style.removeProperty("--data-point-filter-arrow-offset");
    }

    return { closePanel, openPanel };
}
