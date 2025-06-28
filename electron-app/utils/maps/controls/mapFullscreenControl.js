// Utility to add a custom fullscreen control to a Leaflet map
export function addFullscreenControl(map) {
    const fullscreenControl = document.createElement("div");
    fullscreenControl.className = "custom-fullscreen-control leaflet-top leaflet-left";
    const fullscreenEnterSVG = `<svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="https://www.w3.org/2000/svg"><rect x="3" y="3" width="5" height="2" rx="1" fill="currentColor"/><rect x="3" y="3" width="2" height="5" rx="1" fill="currentColor"/><rect x="14" y="3" width="5" height="2" rx="1" fill="currentColor"/><rect x="17" y="3" width="2" height="5" rx="1" fill="currentColor"/><rect x="3" y="17" width="5" height="2" rx="1" fill="currentColor"/><rect x="3" y="14" width="2" height="5" rx="1" fill="currentColor"/><rect x="14" y="17" width="5" height="2" rx="1" fill="currentColor"/><rect x="17" y="14" width="2" height="5" rx="1" fill="currentColor"/></svg>`;
    const fullscreenExitSVG = `<svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="https://www.w3.org/2000/svg"><rect x="7" y="3" width="2" height="5" rx="1" fill="currentColor"/><rect x="3" y="7" width="5" height="2" rx="1" fill="currentColor"/><rect x="14" y="3" width="2" height="5" rx="1" fill="currentColor"/><rect x="15" y="7" width="5" height="2" rx="1" fill="currentColor"/><rect x="3" y="14" width="5" height="2" rx="1" fill="currentColor"/><rect x="7" y="15" width="2" height="5" rx="1" fill="currentColor"/><rect x="15" y="15" width="2" height="5" rx="1" fill="currentColor"/><rect x="15" y="15" width="5" height="2" rx="1" fill="currentColor"/></svg>`;
    fullscreenControl.innerHTML = `
		<div class="leaflet-bar custom-fullscreen-bar">
			<button id="fullscreen-btn" title="Toggle Fullscreen" aria-label="Toggle Fullscreen">${fullscreenEnterSVG}</button>
		</div>
	`;
    const mapDiv = document.getElementById("leaflet-map");
    mapDiv.appendChild(fullscreenControl);

    const fullscreenBtn = fullscreenControl.querySelector("#fullscreen-btn");
    fullscreenBtn.onclick = () => {
        if (!mapDiv) return;
        const isFullscreen = mapDiv.classList.toggle("fullscreen");
        fullscreenBtn.title = isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen";
        fullscreenBtn.innerHTML = isFullscreen ? fullscreenExitSVG : fullscreenEnterSVG;
        if (isFullscreen) {
            mapDiv.requestFullscreen && mapDiv.requestFullscreen();
        } else {
            document.exitFullscreen && document.exitFullscreen();
        }
        setTimeout(() => map.invalidateSize(), 300);
    };

    document.addEventListener("fullscreenchange", () => {
        const isNowFullscreen = document.fullscreenElement === mapDiv;
        if (!isNowFullscreen) {
            mapDiv.classList.remove("fullscreen");
            fullscreenBtn.title = "Enter Fullscreen";
            fullscreenBtn.innerHTML = fullscreenEnterSVG;
            // Only call invalidateSize if map is still valid and map container is in the DOM
            if (map && map._container && document.body.contains(map._container)) {
                setTimeout(() => map.invalidateSize(), 300);
            }
        }
    });

    // Remove old fullscreen button from map-controls if present
    const oldFullscreenBtn = document.querySelector("#map-controls #fullscreen-btn");
    if (oldFullscreenBtn) oldFullscreenBtn.remove();
}
