/*
 * CSP-safe Leaflet measurement control.
 *
 * Why this exists:
 * - The upstream `leaflet-measure` dist bundle uses `new Function(...)` to compile templates at runtime,
 *   which violates a strict CSP (requires `script-src 'unsafe-eval'`).
 * - FitFileViewer runs with a CSP that intentionally disallows unsafe-eval.
 *
 * This file provides a lightweight subset compatible with this codebase:
 * - Defines `L.Control.Measure` and `L.control.measure(options)`.
 * - Fires `measurestart` and `measurefinish` map events.
 * - Exposes `_measurementRunningTotal` so existing cleanup hooks can reset state.
 *
 * It intentionally does not attempt to be a full drop-in replacement for every upstream feature.
 */

(function attachLeafletMeasureLite() {
    /**
     * @returns {any}
     */
    function getLeaflet() {
        const { L } = /** @type {any} */ (globalThis);
        if (!L) {
            throw new Error("Leaflet (global L) must be loaded before leaflet-measure-lite.js");
        }
        return L;
    }

    const L = getLeaflet();

    /**
     * @typedef {{
     *  position?: string;
     *  activeColor?: string;
     *  completedColor?: string;
     *  popupOptions?: { className?: string; autoPanPadding?: [number, number] };
     *  primaryLengthUnit?: 'meters'|'miles';
     *  secondaryLengthUnit?: 'meters'|'miles'|null;
     *  primaryAreaUnit?: 'sqmeters'|'acres';
     *  secondaryAreaUnit?: 'sqmeters'|'acres'|null;
     *  decPoint?: string;
     *  thousandsSep?: string;
     * }} MeasureLiteOptions
     */

    const DEFAULTS = {
        activeColor: "#ff7800",
        completedColor: "#1976d2",
        decPoint: ".",
        popupOptions: { className: "leaflet-measure-resultpopup", autoPanPadding: [10, 10] },
        position: "topright",
        primaryAreaUnit: "sqmeters",
        primaryLengthUnit: "meters",
        secondaryAreaUnit: "acres",
        secondaryLengthUnit: "miles",
        thousandsSep: ",",
    };

    /**
     * @param {number} n
     * @param {number} decimals
     * @param {string} decPoint
     * @param {string} thousandsSep
     * @returns {string}
     */
    function formatNumber(n, decimals, decPoint, thousandsSep) {
        const safe = Number.isFinite(n) ? n : 0;
        const fixed = safe.toFixed(decimals);
        const parts = fixed.split(".");
        const intPart = parts[0].replaceAll(/\B(?=(\d{3})+(?!\d))/gu, thousandsSep);
        return parts.length > 1 ? `${intPart}${decPoint}${parts[1]}` : intPart;
    }

    /**
     * @param {number} meters
     * @param {'meters'|'miles'} unit
     * @param {string} decPoint
     * @param {string} thousandsSep
     * @returns {string}
     */
    function formatDistance(meters, unit, decPoint, thousandsSep) {
        if (unit === "miles") {
            const miles = meters / 1609.344;
            return `${formatNumber(miles, 2, decPoint, thousandsSep)} Miles`;
        }
        if (meters >= 1000) {
            return `${formatNumber(meters / 1000, 2, decPoint, thousandsSep)} Kilometers`;
        }
        return `${formatNumber(meters, 0, decPoint, thousandsSep)} Meters`;
    }

    /**
     * @param {number} sqMeters
     * @param {'sqmeters'|'acres'} unit
     * @param {string} decPoint
     * @param {string} thousandsSep
     * @returns {string}
     */
    function formatArea(sqMeters, unit, decPoint, thousandsSep) {
        if (unit === "acres") {
            const acres = sqMeters * 0.000_247_105;
            return `${formatNumber(acres, 2, decPoint, thousandsSep)} Acres`;
        }
        return `${formatNumber(sqMeters, 0, decPoint, thousandsSep)} Sq Meters`;
    }

    /**
     * @param {any[]} latlngs
     * @param {(a: any, b: any) => number} distanceFn
     * @returns {number}
     */
    function computeTotalDistance(latlngs, distanceFn) {
        let total = 0;
        for (let i = 1; i < latlngs.length; i += 1) {
            total += distanceFn(latlngs[i - 1], latlngs[i]);
        }
        return total;
    }

    /**
     * @param {any[]} latlngs
     * @returns {number}
     */
    function computeAreaSqMeters(latlngs) {
        // Prefer Leaflet.draw's geometry util if available.
        const util = /** @type {any} */ (L).GeometryUtil;
        if (util && typeof util.geodesicArea === "function") {
            try {
                return util.geodesicArea(latlngs);
            } catch {
                return 0;
            }
        }
        return 0;
    }

    /**
     * @param {HTMLElement} el
     */
    function hide(el) {
        el.setAttribute("style", "display:none;");
    }

    /**
     * @param {HTMLElement} el
     */
    function show(el) {
        el.removeAttribute("style");
    }

    L.Control.Measure = L.Control.extend({
        options: DEFAULTS,

        initialize: function initialize(options) {
            L.setOptions(this, options);
            this._locked = false;
            /** @type {any[]} */
            this._latlngs = [];
            /** @type {number} */
            this._measurementRunningTotal = 0;
        },

        onAdd: function onAdd(map) {
            this._map = map;

            // Root container
            const container = (this._container = L.DomUtil.create("div", "leaflet-control-measure leaflet-bar"));

            // Toggle
            const toggle = (this.$toggle = L.DomUtil.create(
                "a",
                "leaflet-control-measure-toggle js-toggle",
                container
            ));
            toggle.href = "#";
            toggle.title = "Measure distances and areas";
            toggle.textContent = "Measure";

            // Interaction panel
            const interaction = (this.$interaction = L.DomUtil.create(
                "div",
                "leaflet-control-measure-interaction js-interaction",
                container
            ));

            // Start prompt
            const startPrompt = (this.$startPrompt = L.DomUtil.create(
                "div",
                "startprompt js-startprompt",
                interaction
            ));
            startPrompt.innerHTML =
                '<h3>Measure distances and areas</h3><ul class="tasks"><li><a href="#" class="js-start start">Create a new measurement</a></li></ul>';

            // Measuring prompt
            const measuringPrompt = (this.$measuringPrompt = L.DomUtil.create(
                "div",
                "js-measuringprompt",
                interaction
            ));
            measuringPrompt.innerHTML =
                '<h3>Measure distances and areas</h3><p class="js-starthelp">Start creating a measurement by adding points to the map</p><div class="js-results results"></div><ul class="js-measuretasks tasks"><li><a href="#" class="js-cancel cancel">Cancel</a></li><li><a href="#" class="js-finish finish">Finish measurement</a></li></ul>';

            // Cache elements
            this.$results = /** @type {HTMLElement} */ (measuringPrompt.querySelector(".js-results"));
            this.$startHelp = /** @type {HTMLElement} */ (measuringPrompt.querySelector(".js-starthelp"));
            this.$start = /** @type {HTMLAnchorElement} */ (interaction.querySelector(".js-start"));
            this.$cancel = /** @type {HTMLAnchorElement} */ (interaction.querySelector(".js-cancel"));
            this.$finish = /** @type {HTMLAnchorElement} */ (interaction.querySelector(".js-finish"));

            // Default collapsed
            this._collapse();
            this._updateNotStarted();

            // Leaflet event helpers
            L.DomEvent.disableClickPropagation(container);
            L.DomEvent.disableScrollPropagation(container);

            L.DomEvent.on(toggle, "click", L.DomEvent.stop);
            L.DomEvent.on(toggle, "click", this._expand, this);

            L.DomEvent.on(this.$start, "click", L.DomEvent.stop);
            L.DomEvent.on(this.$start, "click", this._startMeasure, this);

            L.DomEvent.on(this.$cancel, "click", L.DomEvent.stop);
            L.DomEvent.on(this.$cancel, "click", this._cancelMeasure, this);

            L.DomEvent.on(this.$finish, "click", L.DomEvent.stop);
            L.DomEvent.on(this.$finish, "click", this._finishMeasure, this);

            return container;
        },

        onRemove: function onRemove(map) {
            try {
                map.off("click", this._collapse, this);
            } catch {
                /* ignore */
            }
            this._detachMapHandlers();
            for (const layer of [this._tempLayer, this._resultLayer]) {
                if (!layer || !map) continue;
                try {
                    map.removeLayer(layer);
                } catch {
                    /* ignore */
                }
            }
        },

        _expand: function _expand() {
            hide(this.$toggle);
            show(this.$interaction);
        },

        _collapse: function _collapse() {
            if (this._locked) return;
            hide(this.$interaction);
            show(this.$toggle);
        },

        _updateNotStarted: function _updateNotStarted() {
            show(this.$startPrompt);
            hide(this.$measuringPrompt);
        },

        _updateMeasuring: function _updateMeasuring() {
            hide(this.$startPrompt);
            show(this.$measuringPrompt);
        },

        _startMeasure: function _startMeasure() {
            if (!this._map) return;
            this._locked = true;
            this._latlngs = [];
            this._measurementRunningTotal = 0;

            // Keep separate layer groups so in-progress clears don't wipe prior results.
            this._resultLayer ||= L.layerGroup().addTo(this._map);
            this._tempLayer ||= L.layerGroup().addTo(this._map);
            this._clearTempLayers();

            this._previewLine = L.polyline([], {
                color: this.options.activeColor,
                weight: 2,
                opacity: 0.9,
            }).addTo(this._tempLayer);

            this._previewPolygon = null;

            this._updateMeasuring();
            this._renderResults();

            this._attachMapHandlers();

            try {
                this._map.fire("measurestart", null, false);
            } catch {
                /* ignore */
            }
        },

        _cancelMeasure: function _cancelMeasure() {
            this._locked = false;
            this._detachMapHandlers();
            this._clearTempLayers();
            this._measurementRunningTotal = 0;
            this._collapse();
            this._updateNotStarted();
        },

        _finishMeasure: function _finishMeasure() {
            if (!this._map) return;

            const latlngs = this._latlngs.slice();
            const lengthMeters = computeTotalDistance(latlngs, this._map.distance.bind(this._map));
            const areaSqMeters = latlngs.length >= 3 ? computeAreaSqMeters(latlngs) : 0;

            // Commit a final shape to the map layer.
            if (latlngs.length >= 2) {
                const shape =
                    latlngs.length >= 3
                        ? L.polygon(latlngs, { color: this.options.completedColor, weight: 2, opacity: 0.9 })
                        : L.polyline(latlngs, { color: this.options.completedColor, weight: 3, opacity: 0.9 });
                shape.addTo(this._resultLayer);

                const popupHtml = this._buildPopupHtml(lengthMeters, areaSqMeters);
                const popup = L.popup(this.options.popupOptions).setContent(popupHtml);
                shape.bindPopup(popup);
            }

            const result = {
                area: areaSqMeters,
                length: lengthMeters,
                pointCount: latlngs.length,
                points: latlngs,
            };

            this._locked = false;
            this._detachMapHandlers();
            this._clearTempLayers();
            this._measurementRunningTotal = 0;
            this._collapse();
            this._updateNotStarted();

            try {
                this._map.fire("measurefinish", result, false);
            } catch {
                /* ignore */
            }
        },

        _attachMapHandlers: function _attachMapHandlers() {
            if (!this._map) return;
            this._onClick ||= this._handleMapClick.bind(this);
            this._onMove ||= this._handleMapMove.bind(this);
            this._onDblClick ||= this._handleMapDblClick.bind(this);

            this._map.on("click", this._onClick);
            this._map.on("mousemove", this._onMove);
            this._map.on("dblclick", this._onDblClick);
        },

        _detachMapHandlers: function _detachMapHandlers() {
            if (!this._map) return;
            if (this._onClick) this._map.off("click", this._onClick);
            if (this._onMove) this._map.off("mousemove", this._onMove);
            if (this._onDblClick) this._map.off("dblclick", this._onDblClick);
        },

        _handleMapClick: function _handleMapClick(evt) {
            if (!evt || !evt.latlng) return;
            this._latlngs.push(evt.latlng);

            // Add point marker
            if (this._tempLayer) {
                const marker = L.circleMarker(evt.latlng, {
                    radius: 4,
                    color: this.options.activeColor,
                    weight: 2,
                    opacity: 1,
                    fillColor: this.options.activeColor,
                    fillOpacity: 0.8,
                });
                marker.addTo(this._tempLayer);
            }

            this._renderResults();
        },

        _handleMapMove: function _handleMapMove(evt) {
            if (!evt || !evt.latlng || !this._previewLine) return;
            const latlngs = this._latlngs.slice();
            if (latlngs.length === 0) return;
            latlngs.push(evt.latlng);
            this._previewLine.setLatLngs(latlngs);

            if (latlngs.length >= 3) {
                if (this._previewPolygon === null) {
                    this._previewPolygon = L.polygon(latlngs, {
                        color: this.options.activeColor,
                        weight: 2,
                        opacity: 0.6,
                        fillColor: this.options.activeColor,
                        fillOpacity: 0.1,
                    }).addTo(this._tempLayer);
                } else {
                    this._previewPolygon.setLatLngs(latlngs);
                }
            }
        },

        _handleMapDblClick: function _handleMapDblClick(evt) {
            // Prevent the map from zooming on double-click while measuring.
            if (this._locked && evt && evt.originalEvent) {
                try {
                    evt.originalEvent.preventDefault();
                } catch {
                    /* ignore */
                }
            }
            if (this._locked) {
                this._finishMeasure();
            }
        },

        _clearTempLayers: function _clearTempLayers() {
            if (!this._tempLayer) return;

            try {
                this._tempLayer.clearLayers();
            } catch {
                /* ignore */
            }

            this._previewLine = null;
            this._previewPolygon = null;
        },

        _renderResults: function _renderResults() {
            if (!this._map || !this.$results) return;

            const latlngs = this._latlngs;
            const lengthMeters = computeTotalDistance(latlngs, this._map.distance.bind(this._map));
            const areaSqMeters = latlngs.length >= 3 ? computeAreaSqMeters(latlngs) : 0;

            this._measurementRunningTotal = lengthMeters;

            const primaryLength = formatDistance(
                lengthMeters,
                /** @type {any} */ (this.options.primaryLengthUnit) || "meters",
                this.options.decPoint,
                this.options.thousandsSep
            );

            const primaryArea = formatArea(
                areaSqMeters,
                /** @type {any} */ (this.options.primaryAreaUnit) || "sqmeters",
                this.options.decPoint,
                this.options.thousandsSep
            );

            const hasArea = latlngs.length >= 3;

            this.$results.innerHTML = `
                <div class="group">
                    <p><span class="heading">Points</span> ${latlngs.length}</p>
                </div>
                <div class="group">
                    <p><span class="heading">Path distance</span> ${primaryLength}</p>
                </div>
                ${hasArea ? `<div class="group"><p><span class="heading">Area</span> ${primaryArea}</p></div>` : ""}
            `;

            if (this.$startHelp) {
                if (latlngs.length === 0) {
                    this.$startHelp.textContent = "Start creating a measurement by adding points to the map";
                } else {
                    this.$startHelp.textContent = "Double-click to finish measurement";
                }
            }
        },

        /**
         * @param {number} lengthMeters
         * @param {number} areaSqMeters
         * @returns {HTMLElement}
         */
        _buildPopupHtml: function _buildPopupHtml(lengthMeters, areaSqMeters) {
            const wrap = document.createElement("div");
            wrap.className = "leaflet-measure-resultpopup";

            const length = formatDistance(
                lengthMeters,
                /** @type {any} */ (this.options.primaryLengthUnit) || "meters",
                this.options.decPoint,
                this.options.thousandsSep
            );

            const area = formatArea(
                areaSqMeters,
                /** @type {any} */ (this.options.primaryAreaUnit) || "sqmeters",
                this.options.decPoint,
                this.options.thousandsSep
            );

            wrap.innerHTML = `
                <h3>${areaSqMeters > 0 ? "Area measurement" : "Linear measurement"}</h3>
                <p>${length}</p>
                ${areaSqMeters > 0 ? `<p>${area}</p>` : ""}
            `;

            return wrap;
        },
    });

    /**
     * Leaflet factory.
     * @param {MeasureLiteOptions} [options]
     * @returns {any}
     */
    L.control.measure = function measure(options) {
        return new L.Control.Measure(options);
    };
})();
