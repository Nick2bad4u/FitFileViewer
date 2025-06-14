// Lap selection UI and logic for Leaflet map
// Exports: addLapSelector(map, container, drawMapForLap)

export function addLapSelector(map, container, drawMapForLap) {
    if (!window.globalData || !Array.isArray(window.globalData.lapMesgs) || window.globalData.lapMesgs.length === 0) return;

    const lapControl = document.createElement("div");
    lapControl.className = "custom-lap-control-container leaflet-bottom leaflet-left";
    lapControl.innerHTML = `
		<div class="custom-lap-control leaflet-bar">
			<button id="multi-lap-toggle" class="multi-lap-toggle" type="button" title="Enable multi-lap mode: select multiple laps by clicking or dragging. Click again to return to single-lap mode.">
				<svg class="icon" viewBox="0 0 16 16" width="16" height="16"><rect x="2" y="2" width="5" height="5" rx="1" fill="#888"/><rect x="9" y="9" width="5" height="5" rx="1" fill="#888"/><rect x="2" y="9" width="5" height="5" rx="1" fill="#bbb"/><rect x="9" y="2" width="5" height="5" rx="1" fill="#bbb"/></svg>
			</button>
			<button id="deselect-all-btn" class="deselect-all-btn" title="Deselect all laps (Esc)">
				<svg class="icon" viewBox="0 0 16 16" width="16" height="16"><circle cx="8" cy="8" r="7" fill="none" stroke="#888" stroke-width="2"/><line x1="5" y1="5" x2="11" y2="11" stroke="#888" stroke-width="2"/><line x1="11" y1="5" x2="5" y2="11" stroke="#888" stroke-width="2"/></svg>
			</button>
			<label for="lap-select" class="lap-label">Lap:</label>
			<select id="lap-select">
				<option value="all">All</option>
				${window.globalData.lapMesgs.map((lap, i) => `<option value="${i}">Lap ${i + 1}</option>`).join("")}
			</select>
		</div>
	`;
    lapControl.addEventListener("mousedown", (e) => e.stopPropagation());
    lapControl.addEventListener("touchstart", (e) => e.stopPropagation(), { passive: true });
    container.appendChild(lapControl);

    const lapSelect = lapControl.querySelector("#lap-select");
    const multiLapToggle = lapControl.querySelector("#multi-lap-toggle");
    const deselectAllBtn = lapControl.querySelector("#deselect-all-btn");
    let multiSelectMode = false;

    function getMultiLapIcon(on) {
        if (on) {
            // Stacked layers icon for multi-lap active
            return `<svg class="icon" viewBox="0 0 16 16" width="16" height="16"><polygon points="8,2 14,5 8,8 2,5" fill="#2196f3" stroke="#1976d2" stroke-width="1.2"/><polygon points="8,6 14,9 8,12 2,9" fill="#90caf9" stroke="#1976d2" stroke-width="1.2"/><polygon points="8,10 14,13 8,16 2,13" fill="#e3f2fd" stroke="#1976d2" stroke-width="1.2"/></svg>`;
        } else {
            // Multi-lap mode icon (layers/checkboxes)
            return `<svg class="icon" viewBox="0 0 16 16" width="16" height="16"><rect x="2" y="2" width="5" height="5" rx="1" fill="#888"/><rect x="9" y="9" width="5" height="5" rx="1" fill="#888"/><rect x="2" y="9" width="5" height="5" rx="1" fill="#bbb"/><rect x="9" y="2" width="5" height="5" rx="1" fill="#bbb"/></svg>`;
        }
    }

    function setMultiSelectMode(on) {
        multiSelectMode = on;
        if (multiSelectMode) {
            lapSelect.multiple = true;
            lapSelect.size = Math.min(window.globalData.lapMesgs.length + 1, 6);
            multiLapToggle.classList.add("active");
            lapControl.classList.add("multi-select-active");
            deselectAllBtn.style.display = "";
            multiLapToggle.innerHTML = getMultiLapIcon(true);
            multiLapToggle.title = "Return to single-lap mode";
        } else {
            lapSelect.multiple = false;
            lapSelect.size = 1;
            multiLapToggle.classList.remove("active");
            lapControl.classList.remove("multi-select-active");
            deselectAllBtn.style.display = "none";
            multiLapToggle.innerHTML = getMultiLapIcon(false);
            multiLapToggle.title = "Enable multi-lap mode: select multiple laps by clicking or dragging. Click again to return to single-lap mode.";
            // If more than one selected, reset to 'all'
            if (lapSelect.selectedOptions.length > 1 || (lapSelect.selectedOptions.length === 1 && lapSelect.selectedOptions[0].value !== "all")) {
                lapSelect.selectedIndex = 0;
                lapSelect.dispatchEvent(new Event("change"));
            }
        }
    }

    deselectAllBtn.onclick = () => {
        for (let opt of lapSelect.options) opt.selected = false;
        lapSelect.selectedIndex = 0;
        lapSelect.dispatchEvent(new Event("change"));
    };

    multiLapToggle.onclick = () => setMultiSelectMode(!multiSelectMode);

    lapSelect.addEventListener("change", () => {
        let selected = Array.from(lapSelect.selectedOptions).map((opt) => opt.value);
        if (multiSelectMode) {
            if (selected.includes("all") && selected.length > 1) {
                for (let opt of lapSelect.options) opt.selected = opt.value === "all";
                selected = ["all"];
            }
            if (!selected.length) {
                lapSelect.selectedIndex = 0;
                selected = ["all"];
            }
            if (selected.length === 1 && selected[0] === "all") {
                drawMapForLap("all");
            } else {
                drawMapForLap(selected);
            }
        } else {
            if (selected[0] === "all") {
                drawMapForLap("all");
            } else {
                drawMapForLap([selected[0]]);
            }
        }
    });

    // Multi-lap mode: click to select/deselect laps (no hotkey needed)
    // Drag-to-select logic
    let dragSelecting = false;
    let dragSelectValue = null;
    lapSelect.addEventListener("mousedown", (e) => {
        if (multiSelectMode && e.target.tagName === "OPTION") {
            e.preventDefault();
            dragSelecting = true;
            const opt = e.target;
            dragSelectValue = !opt.selected;
            if (opt.value === "all") {
                for (let o of lapSelect.options) o.selected = o.value === "all";
            } else {
                opt.selected = dragSelectValue;
                lapSelect.options[0].selected = false;
            }
            lapSelect.dispatchEvent(new Event("change"));
        }
    });
    lapSelect.addEventListener("mouseover", (e) => {
        if (multiSelectMode && dragSelecting && e.target.tagName === "OPTION") {
            const opt = e.target;
            if (opt.value !== "all") {
                opt.selected = dragSelectValue;
                lapSelect.options[0].selected = false;
                lapSelect.dispatchEvent(new Event("change"));
            }
        }
    });
    document.addEventListener("mouseup", () => {
        dragSelecting = false;
        dragSelectValue = null;
    });

    // Add scroll wheel support for changing lap selection
    lapSelect.addEventListener(
        "wheel",
        (e) => {
            e.preventDefault();
            e.stopPropagation();
            const options = Array.from(lapSelect.options);
            let idx = lapSelect.selectedIndex;
            if (idx === -1) idx = 0;
            if (e.deltaY > 0 && idx < options.length - 1) {
                lapSelect.selectedIndex = idx + 1;
            } else if (e.deltaY < 0 && idx > 0) {
                lapSelect.selectedIndex = idx - 1;
            }
            lapSelect.dispatchEvent(new Event("change"));
        },
        { passive: false }
    );

    // Initialize in single-select mode
    setMultiSelectMode(false);
}
