// Ensure a safe console is available before Vitest workers initialize.
export default async function globalSetup() {
    try {
        const noop = () => { };
        // Access console only via globalThis to avoid ReferenceError if identifier is not bound yet
        const gConsole = /** @type {any} */ (
            globalThis && /** @type {any} */ (globalThis).console ? /** @type {any} */ (globalThis).console : undefined
        );
        const baseConsole = {
            log: gConsole?.log || noop,
            warn: gConsole?.warn || noop,
            error: gConsole?.error || noop,
            info: gConsole?.info || noop,
            debug: gConsole?.debug || noop,
            assert: gConsole?.assert || noop,
            clear: gConsole?.clear || noop,
            count: gConsole?.count || noop,
            countReset: gConsole?.countReset || noop,
            dir: gConsole?.dir || noop,
            dirxml: gConsole?.dirxml || noop,
            group: gConsole?.group || noop,
            groupCollapsed: gConsole?.groupCollapsed || noop,
            groupEnd: gConsole?.groupEnd || noop,
            table: gConsole?.table || noop,
            time: gConsole?.time || noop,
            timeEnd: gConsole?.timeEnd || noop,
            timeLog: gConsole?.timeLog || noop,
            timeStamp: gConsole?.timeStamp || noop,
            trace: gConsole?.trace || noop,
            profile: gConsole?.profile || noop,
            profileEnd: gConsole?.profileEnd || noop,
        };

        // Install a basic console early if missing. Keep it configurable so tests can stub it.
        if (!globalThis.console) {
            Object.defineProperty(globalThis, "console", {
                configurable: true,
                enumerable: true,
                writable: true,
                value: baseConsole,
            });
        }

        if (typeof globalThis.window === "undefined" || globalThis.window === null) {
            Object.defineProperty(globalThis, "window", {
                configurable: true,
                enumerable: false,
                writable: true,
                value: globalThis,
            });
        }

        if (typeof globalThis.window !== "undefined" && !globalThis.window.console) {
            Object.defineProperty(globalThis.window, "console", {
                configurable: true,
                enumerable: true,
                writable: true,
                value: globalThis.console || baseConsole,
            });
        }
    } catch {
        // ignore
    }
}
