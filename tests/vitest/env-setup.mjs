// This file runs before the jsdom environment initializes
// Suppress jsdom's --localstorage-file warning
const originalEmitWarning = process.emitWarning.bind(process);
process.emitWarning = function (warning, ...args) {
    const message = (() => {
        if (typeof warning === "string") return warning;
        if (warning && typeof warning === "object" && "message" in warning) {
            return String(
                /** @type {{ message?: unknown }} */ (warning).message
            );
        }
        return "";
    })();

    if (message.includes("--localstorage-file")) return;
    return originalEmitWarning(warning, ...args);
};

const JS_DOM_WARNING_PATTERNS = [
    /Not implemented: navigation to another Document/i,
    /Not implemented: Window's alert\(\) method/i,
];

// Some environments (and/or worker processes) print warnings directly to stderr
// rather than going through console.warn/error or process.emitWarning. Filter only
// the known noisy jsdom messages to keep test output readable.
const originalStderrWrite = process.stderr.write.bind(process.stderr);
process.stderr.write = function (chunk, encoding, callback) {
    try {
        const text = (() => {
            if (typeof chunk === "string") return chunk;
            if (
                chunk &&
                typeof chunk === "object" &&
                typeof chunk.toString === "function"
            ) {
                return chunk.toString(
                    typeof encoding === "string" ? encoding : "utf8"
                );
            }
            return "";
        })();

        if (text.includes("--localstorage-file")) {
            return true;
        }

        if (JS_DOM_WARNING_PATTERNS.some((pattern) => pattern.test(text))) {
            return true;
        }
    } catch {
        // fall through
    }

    return originalStderrWrite.apply(process.stderr, [
        chunk,
        encoding,
        callback,
    ]);
};

const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

/**
 * Determine whether a console message matches a known, ignorable jsdom warning.
 *
 * @param {unknown} candidate
 */
function shouldSuppressJsdomWarning(candidate) {
    const message = (() => {
        if (typeof candidate === "string") return candidate;
        if (
            candidate &&
            typeof candidate === "object" &&
            "message" in candidate
        ) {
            return String(candidate.message);
        }
        return "";
    })();
    if (!message) return false;
    return JS_DOM_WARNING_PATTERNS.some((pattern) => pattern.test(message));
}

/**
 * Install a console warning filter without direct method assignment, matching
 * the descriptor-scoped fixture pattern used by the rest of the Vitest setup.
 *
 * @param {"error" | "warn"} methodName
 * @param {(...args: unknown[]) => unknown} originalMethod
 */
function installFilteredConsoleMethod(methodName, originalMethod) {
    Object.defineProperty(console, methodName, {
        configurable: true,
        value: function filteredConsoleMethod(...args) {
            if (args.length > 0 && shouldSuppressJsdomWarning(args[0])) {
                return;
            }

            return originalMethod.apply(this, args);
        },
        writable: true,
    });
}

installFilteredConsoleMethod("error", originalConsoleError);
installFilteredConsoleMethod("warn", originalConsoleWarn);
