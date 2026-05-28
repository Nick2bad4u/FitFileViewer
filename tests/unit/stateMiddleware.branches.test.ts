import { describe, it, expect, vi, afterEach } from "vitest";
import type {
    MiddlewareContext,
    MiddlewareDefinition,
} from "../../electron-app/utils/state/core/stateMiddleware.js";

type StatePerformanceEntry = {
    duration: number;
    path: string;
    timestamp: number;
};

type StatePerformanceGlobal = typeof globalThis & {
    _statePerformance?: StatePerformanceEntry[];
};

function firstArguments(calls: unknown[][]): string[] {
    return calls.map((call) => String(call[0]));
}

// We will import fresh modules in some tests to control module-level flags
import "../vitest/shims/nodeWebStorage";
describe("stateMiddleware additional branches", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("logs slow handler warning when wrapped handler exceeds threshold", async () => {
        vi.resetModules();
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
        // Mock performance.now to simulate elapsed > 5ms between the two calls made before awaiting handler
        const perfSpy = vi
            .spyOn(performance, "now")
            .mockReturnValueOnce(0) // startTime
            .mockReturnValueOnce(10) // duration = 10ms
            .mockReturnValue(10);

        const {
            registerMiddleware,
            executeMiddleware,
            cleanupMiddleware,
            MIDDLEWARE_PHASES,
        } =
            await import("../../electron-app/utils/state/core/stateMiddleware.js");

        registerMiddleware(
            "slowMW",
            {
                beforeSet(ctx) {
                    return ctx;
                },
            },
            100
        );

        const ctx: MiddlewareContext = {
            path: "settings.theme",
            value: "dark",
        };
        await executeMiddleware(MIDDLEWARE_PHASES.BEFORE_SET, ctx);

        expect(firstArguments(warnSpy.mock.calls)).toEqual(
            expect.arrayContaining([
                expect.stringContaining('Slow middleware "slowMW.beforeSet"'),
            ])
        );
        expect(perfSpy).toHaveBeenCalledTimes(2);
        cleanupMiddleware();
    });

    it("handles handler throw and error handler failures with nested logging", async () => {
        vi.resetModules();
        const errorSpy = vi
            .spyOn(console, "error")
            .mockImplementation((...args: unknown[]) => {
                // Only throw for the inner error-handler invocation log to trigger the outer catch branch
                if (
                    typeof args[0] === "string" &&
                    args[0].includes("Error invoking error handler")
                ) {
                    throw new Error("console boom");
                }
            });

        const {
            registerMiddleware,
            executeMiddleware,
            cleanupMiddleware,
            MIDDLEWARE_PHASES,
        } =
            await import("../../electron-app/utils/state/core/stateMiddleware.js");

        // Middleware whose handler throws
        registerMiddleware(
            "thrower",
            {
                beforeSet() {
                    throw new Error("boom");
                },
            },
            10
        );

        // Middleware with onError that itself throws to hit inner catch
        registerMiddleware(
            "errMW",
            {
                onError() {
                    throw new Error("inner-handler");
                },
            },
            20
        );

        const ctx: MiddlewareContext = { path: "x", value: 1 };
        await expect(
            executeMiddleware(MIDDLEWARE_PHASES.BEFORE_SET, ctx)
        ).resolves.toEqual(ctx);

        // We should have seen the inner error-invocation message and then the outer "Error in error handler for \"errMW\""
        expect(firstArguments(errorSpy.mock.calls)).toEqual(
            expect.arrayContaining([
                expect.stringContaining('Handler error in "thrower.beforeSet"'),
                expect.stringContaining(
                    'Error in middleware "thrower" phase "beforeSet"'
                ),
                expect.stringContaining("Error invoking error handler"),
                expect.stringContaining('Error in error handler for "errMW"'),
            ])
        );

        cleanupMiddleware();
    });

    it("short-circuits execute when globally disabled", async () => {
        vi.resetModules();
        const {
            middlewareManager,
            registerMiddleware,
            executeMiddleware,
            cleanupMiddleware,
            MIDDLEWARE_PHASES,
        } =
            await import("../../electron-app/utils/state/core/stateMiddleware.js");

        registerMiddleware(
            "mutator",
            {
                beforeSet(ctx: MiddlewareContext) {
                    return { ...ctx, value: "mutated" };
                },
            },
            100
        );

        middlewareManager.setGlobalEnabled(false);
        const ctx: MiddlewareContext = { path: "p", value: "orig" };
        const result = await executeMiddleware(
            MIDDLEWARE_PHASES.BEFORE_SET,
            ctx
        );
        expect(result).toEqual(ctx); // unchanged

        // restore for cleanliness
        middlewareManager.setGlobalEnabled(true);
        cleanupMiddleware();
    });

    it("performance middleware trims history beyond 100 entries", async () => {
        vi.resetModules();
        // Ensure non-zero timing so afterSet branch runs
        const perfSpy = vi
            .spyOn(performance, "now")
            .mockReturnValueOnce(100) // beforeSet
            .mockReturnValueOnce(115) // afterSet duration
            .mockReturnValue(120);
        const {
            registerMiddleware,
            executeMiddleware,
            cleanupMiddleware,
            MIDDLEWARE_PHASES,
            performanceMiddleware,
        } =
            await import("../../electron-app/utils/state/core/stateMiddleware.js");

        // Pre-seed global performance array with 100 entries
        const stateGlobal = globalThis as StatePerformanceGlobal;
        stateGlobal._statePerformance = new Array(100)
            .fill(null)
            .map((_, i) => ({
                duration: 1,
                path: `p${i}`,
                timestamp: i,
            }));

        registerMiddleware("performance", performanceMiddleware, 10);

        const ctx: MiddlewareContext = { path: "pNew", value: 42 };
        const ctx2 = await executeMiddleware(MIDDLEWARE_PHASES.BEFORE_SET, ctx);
        await executeMiddleware(MIDDLEWARE_PHASES.AFTER_SET, ctx2);

        expect(stateGlobal._statePerformance?.length).toBe(100);
        expect(stateGlobal._statePerformance?.[99]?.path).toBe("pNew");

        cleanupMiddleware();
    });

    it("persistence middleware logs error when localStorage.setItem fails", async () => {
        vi.resetModules();
        const errorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});

        const origSetItem = localStorage.setItem.bind(localStorage);
        const setItemMock = vi
            .spyOn(window.localStorage.__proto__, "setItem")
            .mockImplementation(() => {
                throw new Error("quota exceeded");
            });

        const {
            registerMiddleware,
            executeMiddleware,
            cleanupMiddleware,
            MIDDLEWARE_PHASES,
            persistenceMiddleware,
        } =
            await import("../../electron-app/utils/state/core/stateMiddleware.js");

        registerMiddleware("persist", persistenceMiddleware, 10);
        const ctx: MiddlewareContext = {
            path: "settings.theme",
            value: "dark",
        };
        await executeMiddleware(MIDDLEWARE_PHASES.AFTER_SET, ctx);

        expect(firstArguments(errorSpy.mock.calls)).toEqual(
            expect.arrayContaining([
                expect.stringContaining(
                    '[StatePersist] Failed to save "settings.theme"'
                ),
            ])
        );

        setItemMock.mockRestore();
        // restore just in case
        window.localStorage.setItem = origSetItem;
        cleanupMiddleware();
    });

    it("warns when registering duplicate middleware names", async () => {
        vi.resetModules();
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

        const { registerMiddleware, cleanupMiddleware } =
            await import("../../electron-app/utils/state/core/stateMiddleware.js");

        const duplicateMiddleware: MiddlewareDefinition = {
            beforeSet: (context) => context,
        };
        registerMiddleware("dup", duplicateMiddleware, 50);
        registerMiddleware("dup", duplicateMiddleware, 60);

        expect(firstArguments(warnSpy.mock.calls)).toEqual(
            expect.arrayContaining([
                expect.stringContaining('Middleware "dup" already registered'),
            ])
        );
        cleanupMiddleware();
    });

    it("initializeDefaultMiddleware logs skip on second call", async () => {
        vi.resetModules();
        const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

        const { initializeDefaultMiddleware, cleanupMiddleware } =
            await import("../../electron-app/utils/state/core/stateMiddleware.js");

        // First call should initialize and log messages
        initializeDefaultMiddleware();
        // Second call should log skipping message and return
        initializeDefaultMiddleware();

        expect(firstArguments(logSpy.mock.calls)).toEqual(
            expect.arrayContaining([
                expect.stringContaining(
                    "Default middleware already initialized, skipping"
                ),
            ])
        );

        cleanupMiddleware();
    });
});
