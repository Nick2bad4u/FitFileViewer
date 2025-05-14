/* global L */
// Simple point-to-point measurement tool for Leaflet
export function addSimpleMeasureTool(map, controlsDiv) {
	let measurePoints = [];
	let measureLine = null;
	let measureMarkers = [];
	let measureLabel = null;
	let measuring = false;

	function clearMeasure() {
		measurePoints = [];
		if (measureLine) {
			map.removeLayer(measureLine);
			measureLine = null;
		}
		measureMarkers.forEach((m) => map.removeLayer(m));
		measureMarkers = [];
		if (measureLabel) {
			map.removeLayer(measureLabel);
			measureLabel = null;
		}
	}

	function disableMeasure(measureBtn) {
		measuring = false;
		map.off('click', onMapClickMeasure);
		if (measureBtn) {
			measureBtn.innerHTML =
				'<svg class="icon" viewBox="0 0 20 20" width="18" height="18"><rect x="2" y="9" width="16" height="2" rx="1" fill="#1976d2"/><rect x="2" y="5" width="2" height="10" rx="1" fill="#1976d2"/><rect x="16" y="5" width="2" height="10" rx="1" fill="#1976d2"/></svg> <span>Measure</span>';
			measureBtn.title = 'Click, then click two points on the map to measure distance';
		}
	}

	// Add Escape key handler to clear measurement
	document.addEventListener('keydown', function escHandler(e) {
		if (e.key === 'Escape') {
			clearMeasure();
			// Also disable measurement mode if active
			if (measuring) disableMeasure(measureBtnRef);
		}
	});

	function createExitButton() {
		return `<button class="measure-exit-btn" title="Remove measurement">&times;</button>`;
	}

	function onLabelExitClick(e) {
		if (e.target.classList.contains('measure-exit-btn')) {
			clearMeasure();
		}
	}

	function onMapClickMeasure(e) {
		if (measurePoints.length >= 2) {
			clearMeasure();
		}
		measurePoints.push(e.latlng);
		const marker = L.marker(e.latlng, { draggable: false });
		marker.addTo(map);
		measureMarkers.push(marker);
		if (measurePoints.length === 2) {
			measureLine = L.polyline(measurePoints, { color: '#222', dashArray: '4,6', weight: 3 }).addTo(map);
			const dist = map.distance(measurePoints[0], measurePoints[1]);
			const distKm = dist / 1000;
			const distMi = dist / 1609.344;
			const mid = L.latLng((measurePoints[0].lat + measurePoints[1].lat) / 2, (measurePoints[0].lng + measurePoints[1].lng) / 2);
			measureLabel = L.marker(mid, {
				icon: L.divIcon({
					className: 'measure-label',
					html: `<div class="measure-label-content">${createExitButton()}${dist >= 1000 ? distKm.toFixed(2) + ' km' : dist.toFixed(1) + ' m'}<br>${distMi.toFixed(2)} mi</div>`,
				}),
				iconSize: [120, 38],
				iconAnchor: [60, 19],
				interactive: true,
			}).addTo(map);
			// Add click handler for exit button
			const labelEl = measureLabel.getElement();
			if (labelEl) {
				labelEl.addEventListener('click', onLabelExitClick);
			}
			// Auto-disable after measurement
			disableMeasure(measureBtnRef);
		}
	}

	function enableSimpleMeasure(measureBtn) {
		if (measuring) return;
		measuring = true;
		map.on('click', onMapClickMeasure);
		if (measureBtn) {
			measureBtn.innerHTML =
				'<svg class="icon" viewBox="0 0 20 20" width="18" height="18"><circle cx="10" cy="10" r="8" fill="none" stroke="#b71c1c" stroke-width="2"/><line x1="6" y1="6" x2="14" y2="14" stroke="#b71c1c" stroke-width="2"/><line x1="14" y1="6" x2="6" y2="14" stroke="#b71c1c" stroke-width="2"/></svg> <span>Cancel</span>';
			measureBtn.title = 'Cancel measurement mode';
		}
	}

	const measureBtn = document.createElement('button');
	measureBtn.className = 'map-action-btn';
	measureBtn.innerHTML =
		'<svg class="icon" viewBox="0 0 20 20" width="18" height="18"><rect x="2" y="9" width="16" height="2" rx="1" fill="#1976d2"/><rect x="2" y="5" width="2" height="10" rx="1" fill="#1976d2"/><rect x="16" y="5" width="2" height="10" rx="1" fill="#1976d2"/></svg> <span>Measure</span>';
	measureBtn.title = 'Click, then click two points on the map to measure distance';
	let measureBtnRef = measureBtn;
	measureBtn.onclick = () => {
		if (!measuring) {
			clearMeasure();
			enableSimpleMeasure(measureBtn);
			measureBtn.disabled = true;
			setTimeout(() => {
				measureBtn.disabled = false;
			}, 2000);
		} else {
			clearMeasure();
			disableMeasure(measureBtn);
		}
	};
	controlsDiv.appendChild(measureBtn);
}
