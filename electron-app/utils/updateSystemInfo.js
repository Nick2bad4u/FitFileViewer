/**
 * Updates the system information display
 */

export function updateSystemInfo(info) {
	const systemInfoItems = document.querySelectorAll(".system-info-value");
	if (systemInfoItems.length >= 7) {
		if (info.version) systemInfoItems[0].textContent = info.version;
		if (info.electron) systemInfoItems[1].textContent = info.electron;
		if (info.node) systemInfoItems[2].textContent = info.node;
		if (info.chrome) systemInfoItems[3].textContent = info.chrome;
		if (info.platform) systemInfoItems[4].textContent = info.platform;
		if (info.author) systemInfoItems[5].textContent = info.author;
		if (info.license) systemInfoItems[6].textContent = info.license;
	}
}
