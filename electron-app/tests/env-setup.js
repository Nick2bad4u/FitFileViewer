// This file runs before the jsdom environment initializes
// Suppress jsdom's --localstorage-file warning
const originalEmitWarning = process.emitWarning;
process.emitWarning = function (warning, ...args) {
    if (typeof warning === "string" && warning.includes("--localstorage-file")) {
        return;
    }
    // eslint-disable-next-line prefer-spread
    return originalEmitWarning.apply(process, [warning, ...args]);
};

const JS_DOM_WARNING_PATTERNS = [
    /Not implemented: navigation to another Document/i,
    /Not implemented: Window's alert\(\) method/i,
];

const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

/**
 * Determine whether a console message matches a known, ignorable jsdom warning.
 * @param {unknown} candidate
 */
function shouldSuppressJsdomWarning(candidate) {
    const message = (() => {
        if (typeof candidate === "string") return candidate;
        if (candidate && typeof candidate === "object" && "message" in candidate) {
            return String(candidate.message);
        }
        return "";
    })();
    if (!message) return false;
    return JS_DOM_WARNING_PATTERNS.some((pattern) => pattern.test(message));
}

console.error = function (...args) {
    if (args.length > 0 && shouldSuppressJsdomWarning(args[0])) {
        return;
    }
    return originalConsoleError.apply(this, args);
};

console.warn = function (...args) {
    if (args.length > 0 && shouldSuppressJsdomWarning(args[0])) {
        return;
    }
    return originalConsoleWarn.apply(this, args);
};
