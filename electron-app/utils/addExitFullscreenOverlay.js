export function addExitFullscreenOverlay(container) {
    const existingOverlay = container.querySelector(".exit-fullscreen-overlay");
    if (existingOverlay) return;
    const exitFullscreenButton = document.createElement("button");
    exitFullscreenButton.className = "exit-fullscreen-overlay themed-btn exit-fullscreen-btn";
    exitFullscreenButton.title = "Exit Fullscreen";
    exitFullscreenButton.innerHTML = `
		<span class="fullscreen-exit-icon" aria-hidden="true">
			<!-- Material Design Exit Fullscreen Icon -->
			<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" class="inline-svg">
				<title>Exit Fullscreen Icon</title>
					<path d="M9 19H5V23" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
					<path d="M19 9H23V5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
					<path d="M19 19H23V23" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
					<path d="M9 9H5V5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
			</svg>
		</span>
	`;
    exitFullscreenButton.onclick = (e) => {
        e.stopPropagation();
        try {
            if (document.fullscreenElement) {
                document.exitFullscreen();
            } else {
                console.warn("No element is currently in fullscreen mode.");
            }
        } catch (error) {
            console.error("Failed to exit fullscreen mode:", error);
        }
    };
    container.append(exitFullscreenButton);
}
