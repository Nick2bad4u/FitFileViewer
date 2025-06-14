// Throttle for animation progress log
let _lastAnimLog = 0;
export function throttledAnimLog(msg) {
	const now = Date.now();
	if (now - _lastAnimLog > 200) {
		console.log(msg);
		_lastAnimLog = now;
	}
}
