// Utility for formatting tooltip data on the map
export function formatTooltipData(idx, row, lapNum, recordMesgsOverride) {
    const dateStr = row.timestamp ? new Date(row.timestamp).toLocaleString() : "";
    let alt = "";
    if (row.altitude != null) {
        const altMeters = Number(row.altitude);
        const altFeet = altMeters * 3.28084;
        alt = `${altMeters.toFixed(1)} m / ${altFeet.toFixed(0)} ft`;
    }
    const hr = row.heartRate != null ? `${Number(row.heartRate).toFixed(1)} bpm` : "";
    let speedKmh = "",
        speedMph = "",
        speed = "";
    if (row.speed != null) {
        const s = Number(row.speed);
        speedKmh = `${(s * 3.6).toFixed(1)} km/h`;
        speedMph = `${(s * 2.23694).toFixed(1)} mph`;
        speed = `${speedKmh} / ${speedMph}`;
    }
    const power = row.power != null ? `${Number(row.power).toFixed(1)} W` : "";
    const cadence = row.cadence != null ? `${Number(row.cadence).toFixed(1)} rpm` : "";

    // Calculate total ride time since start in human readable format
    let rideTime = "";
    const recordMesgs = recordMesgsOverride || (window.globalData && window.globalData.recordMesgs);
    if (recordMesgs && recordMesgs.length > 0 && row.timestamp) {
        const first = recordMesgs.find((r) => r.timestamp != null);
        if (first && first.timestamp) {
            const firstTime = new Date(first.timestamp).getTime();
            const currTime = new Date(row.timestamp).getTime();
            const diff = Math.max(0, Math.floor((currTime - firstTime) / 1000));
            const h = Math.floor(diff / 3600);
            const m = Math.floor((diff % 3600) / 60);
            const s = Math.floor(diff % 60);
            const parts = [];
            if (h > 0) parts.push(`${h} hour${h !== 1 ? "s" : ""}`);
            if (m > 0) parts.push(`${m} minute${m !== 1 ? "s" : ""}`);
            if (s > 0 || parts.length === 0) parts.push(`${s} second${s !== 1 ? "s" : ""}`);
            rideTime = parts.join(", ");
        }
    }

    // Add distance at this point (convert meters to km/mi)
    let distanceStr = "";
    if (row.distance != null && !isNaN(row.distance)) {
        const meters = Number(row.distance);
        const km = meters / 1000;
        const mi = km * 0.621371;
        distanceStr = `${km.toFixed(2)} km / ${mi.toFixed(2)} mi<br>`;
    }

    return (
        `<b>Lap:</b> ${lapNum}<br>` +
        `<b>Index:</b> ${idx}<br>` +
        (dateStr ? `<b>Time:</b> ${dateStr}<br>` : "") +
        (rideTime ? `<b>Ride Time:</b> ${rideTime}<br>` : "") +
        (distanceStr ? `<b>Distance:</b> ${distanceStr} </b>` : "") +
        (alt ? `<b>Alt:</b> ${alt}<br>` : "") +
        (hr ? `<b>HR:</b> ${hr}<br>` : "") +
        (speed ? `<b>Speed:</b> ${speed}<br>` : "") +
        (power ? `<b>Power:</b> ${power}<br>` : "") +
        (cadence ? `<b>Cadence:</b> ${cadence}` : "")
    );
}
