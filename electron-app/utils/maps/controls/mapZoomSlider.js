/**
 * @fileoverview Lightweight Leaflet zoom slider control rendered directly on the map canvas.
 * @description Mirrors the historic FitFileViewer zoom slider so the control remains anchored to the
 * lower-left corner of the map while keeping the React map toolbar focused on high-level actions.
 */

/**
 * Append an interactive zoom slider to the provided Leaflet map container.
 * @param {any} map Leaflet map instance
 * @param {HTMLElement} mapContainer Host element that wraps the Leaflet canvas and controls
 * @returns {() => void} Cleanup function that removes the slider and event listeners
 */
export function addZoomSlider(map, mapContainer) {
    if (!map || !mapContainer || !(mapContainer instanceof HTMLElement)) {
        return () => { };
    }

    const existing = mapContainer.querySelector(".custom-zoom-slider-bar");
    if (existing instanceof HTMLElement) {
        existing.remove();
    }

    const maxZoom = Number.isFinite(map.getMaxZoom?.()) ? map.getMaxZoom() : 20;
    const minZoom = Number.isFinite(map.getMinZoom?.()) ? map.getMinZoom() : 0;
    const zoomToPercent = (zoom) => {
        if (maxZoom === minZoom) {
            return 0;
        }
        const ratio = (zoom - minZoom) / (maxZoom - minZoom);
        return clamp(Math.round(ratio * 100), 0, 100);
    };
    const percentToZoom = (percent) => {
        if (maxZoom === minZoom) {
            return minZoom;
        }
        return minZoom + ((maxZoom - minZoom) * clamp(percent, 0, 100)) / 100;
    };

    const sliderBar = document.createElement("div");
    sliderBar.className = "custom-zoom-slider-bar leaflet-bottom leaflet-right";
    sliderBar.innerHTML = `
        <div class="custom-zoom-slider-label">Zoom</div>
        <input id="zoom-slider-input" type="range" min="0" max="100" step="1" />
        <div class="custom-zoom-slider-values">
            <span id="zoom-slider-min">0%</span>
            <span class="margin-horizontal">|</span>
            <span id="zoom-slider-current">0%</span>
            <span class="margin-horizontal">|</span>
            <span id="zoom-slider-max">100%</span>
        </div>
    `;

    const sliderInput = /** @type {HTMLInputElement|null} */ (
        sliderBar.querySelector("#zoom-slider-input")
    );
    const sliderCurrent = /** @type {HTMLElement|null} */ (
        sliderBar.querySelector("#zoom-slider-current")
    );

    let isDragging = false;

    const stopPropagation = (event) => {
        event.stopPropagation();
    };

    const updateSliderFromMap = () => {
        if (!sliderInput || !sliderCurrent) {
            return;
        }
        const currentZoom = map.getZoom?.();
        if (!Number.isFinite(currentZoom)) {
            return;
        }
        const percent = zoomToPercent(currentZoom);
        if (!isDragging) {
            sliderInput.value = String(percent);
            sliderCurrent.textContent = `${percent}%`;
        }
    };

    const handleInput = (event) => {
        if (!sliderCurrent) {
            return;
        }
        const percent = Number.parseInt(event.target.value, 10);
        if (!Number.isFinite(percent)) {
            return;
        }
        isDragging = true;
        sliderCurrent.textContent = `${clamp(percent, 0, 100)}%`;
    };

    const handleChange = (event) => {
        const percent = Number.parseInt(event.target.value, 10);
        if (!Number.isFinite(percent)) {
            return;
        }
        map.setZoom?.(Math.round(percentToZoom(percent)));
        isDragging = false;
        updateSliderFromMap();
    };

    const handlePointerEnd = () => {
        if (!isDragging) {
            return;
        }
        isDragging = false;
        updateSliderFromMap();
    };

    if (sliderInput) {
        sliderInput.value = String(zoomToPercent(map.getZoom?.() ?? minZoom));
        sliderInput.addEventListener("mousedown", stopPropagation);
        sliderInput.addEventListener("touchstart", stopPropagation, { passive: true });
        sliderInput.addEventListener("input", handleInput);
        sliderInput.addEventListener("change", handleChange);
    }

    document.addEventListener("mouseup", handlePointerEnd);
    document.addEventListener("touchend", handlePointerEnd);

    sliderBar.style.pointerEvents = "auto";
    mapContainer.append(sliderBar);

    map.on?.("zoomend zoomlevelschange", updateSliderFromMap);
    updateSliderFromMap();

    return () => {
        map.off?.("zoomend zoomlevelschange", updateSliderFromMap);
        document.removeEventListener("mouseup", handlePointerEnd);
        document.removeEventListener("touchend", handlePointerEnd);
        if (sliderInput) {
            sliderInput.removeEventListener("mousedown", stopPropagation);
            sliderInput.removeEventListener("touchstart", stopPropagation);
            sliderInput.removeEventListener("input", handleInput);
            sliderInput.removeEventListener("change", handleChange);
        }
        sliderBar.remove();
    };
}

/**
 * Clamp value into an inclusive range.
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function clamp(value, min, max) {
    if (Number.isNaN(value)) {
        return min;
    }
    return Math.min(Math.max(value, min), max);
}
