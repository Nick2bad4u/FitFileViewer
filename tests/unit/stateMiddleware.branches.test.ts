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

function countMessagesContaining(messages: string[], snippet: string): number {
    return messages.filter((message) => message.includes(snippet)).length;
}

// We will import fresh modules in some tests to control module-level flags
import "../vitest/shims/nodeWebStorage";
describe("stateMiddleware additional branches", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("logs slow handler warning when wrapped handler exceeds threshold", async () => {
        expect.assertions(2);

        vi.resetModules();
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
        let now = 0;
        const perfSpy = vi.spyOn(performance, "now").mockImplementation(() => {
            now += 10;
            return now;
        });

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

        const warningMessages = firstArguments(warnSpy.mock.calls);
        expect({
            slowMiddlewareWarnings: countMessagesContaining(
                warningMessages,
                'Slow middleware "slowMW.beforeSet"'
            ),
        }).toStrictEqual({ slowMiddlewareWarnings: 1 });
        expect(perfSpy.mock.calls.length).toBeGreaterThanOrEqual(2);
        cleanupMiddleware();
    });

    it("handles handler throw and error handler failures with nested logging", async () => {
        expect.assertions(2);

        vi.resetModules();
        const errorSpy = vi
            .spyOn(console, "error")
            .mockImplementation((...args: unknown[]) => {
                // Only throw for the inner error-handler invocation log to trigger the outer catch branch
                if (
                    args[0] === "[StateMiddleware] Error invoking error handler"
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
        const errorMessages = firstArguments(errorSpy.mock.calls);
        expect({
            errorHandlerInvocationErrors: countMessagesContaining(
                errorMessages,
                "Error invoking error handler"
            ),
            errorHandlerOuterErrors: countMessagesContaining(
                errorMessages,
                'Error in error handler for "errMW"'
            ),
            handlerErrors: countMessagesContaining(
                errorMessages,
                'Handler error in "thrower.beforeSet"'
            ),
            middlewarePhaseErrors: countMessagesContaining(
                errorMessages,
                'Error in middleware "thrower" phase "beforeSet"'
            ),
        }).toStrictEqual({
            errorHandlerInvocationErrors: 1,
            errorHandlerOuterErrors: 1,
            handlerErrors: 1,
            middlewarePhaseErrors: 1,
        });

        cleanupMiddleware();
    });

    it("short-circuits execute when globally disabled", async () => {
        expect.assertions(1);

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
        expect.assertions(1);

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

        expect({
            latestPath: stateGlobal._statePerformance?.[99]?.path,
            performanceHistoryLength: stateGlobal._statePerformance?.length,
        }).toEqual({
            latestPath: "pNew",
            performanceHistoryLength: 100,
        });

        cleanupMiddleware();
    });

    it("persistence middleware logs error when localStorage.setItem fails", async () => {
        expect.assertions(1);

        vi.resetModules();
        const errorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});

        const storagePrototype = Object.getPrototypeOf(
            window.localStorage
        ) as Storage;
        const setItemMock = vi
            .spyOn(storagePrototype, "setItem")
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

        try {
            registerMiddleware("persist", persistenceMiddleware, 10);
            const ctx: MiddlewareContext = {
                path: "settings.theme",
                value: "dark",
            };
            await executeMiddleware(MIDDLEWARE_PHASES.AFTER_SET, ctx);

            const errorMessages = firstArguments(errorSpy.mock.calls);
            expect({
                persistenceSaveErrors: countMessagesContaining(
                    errorMessages,
                    '[StatePersist] Failed to save "settings.theme"'
                ),
            }).toStrictEqual({ persistenceSaveErrors: 1 });
        } finally {
            setItemMock.mockRestore();
            cleanupMiddleware();
        }
    });

    it("warns when registering duplicate middleware names", async () => {
        expect.assertions(1);

        vi.resetModules();
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

        const { registerMiddleware, cleanupMiddleware } =
            await import("../../electron-app/utils/state/core/stateMiddleware.js");

        const duplicateMiddleware: MiddlewareDefinition = {
            beforeSet: (context) => context,
        };
        registerMiddleware("dup", duplicateMiddleware, 50);
        registerMiddleware("dup", duplicateMiddleware, 60);

        const warningMessages = firstArguments(warnSpy.mock.calls);
        expect({
            duplicateRegistrationWarnings: countMessagesContaining(
                warningMessages,
                'Middleware "dup" already registered'
            ),
        }).toStrictEqual({ duplicateRegistrationWarnings: 1 });
        cleanupMiddleware();
    });

    it("initializeDefaultMiddleware logs skip on second call", async () => {
        expect.assertions(1);

        vi.resetModules();
        const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

        const { initializeDefaultMiddleware, cleanupMiddleware } =
            await import("../../electron-app/utils/state/core/stateMiddleware.js");

        // First call should initialize and log messages
        initializeDefaultMiddleware();
        // Second call should log skipping message and return
        initializeDefaultMiddleware();

        const logMessages = firstArguments(logSpy.mock.calls);
        expect({
            defaultMiddlewareSkipMessages: countMessagesContaining(
                logMessages,
                "Default middleware already initialized, skipping"
            ),
        }).toStrictEqual({ defaultMiddlewareSkipMessages: 1 });

        cleanupMiddleware();
    });
});
