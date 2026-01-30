import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// We will import fresh modules in some tests to control module-level flags
import "./shims/nodeWebStorage";
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
        } = await import("../utils/state/core/stateMiddleware.js");

        registerMiddleware(
            "slowMW",
            {
                beforeSet(ctx) {
                    return ctx;
                },
            },
            100
        );

        const ctx = { path: "settings.theme", value: "dark" } as any;
        await executeMiddleware(MIDDLEWARE_PHASES.BEFORE_SET, ctx);

        expect(
            warnSpy.mock.calls.some((c) =>
                String(c[0]).includes('Slow middleware "slowMW.beforeSet"')
            )
        ).toBe(true);
        expect(perfSpy).toHaveBeenCalled();
        cleanupMiddleware();
    });

    it("handles handler throw and error handler failures with nested logging", async () => {
        vi.resetModules();
        const errorSpy = vi
            .spyOn(console, "error")
            .mockImplementation((...args: any[]) => {
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
        } = await import("../utils/state/core/stateMiddleware.js");

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
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                onError(_error: Error) {
                    throw new Error("inner-handler");
                },
            },
            20
        );

        const ctx = { path: "x", value: 1 } as any;
        await expect(
            executeMiddleware(MIDDLEWARE_PHASES.BEFORE_SET, ctx)
        ).resolves.toEqual(ctx);

        // We should have seen the inner error-invocation message and then the outer "Error in error handler for \"errMW\""
        const messages = errorSpy.mock.calls.map((c) => String(c[0]));
        expect(
            messages.some((m) =>
                m.includes('Handler error in "thrower.beforeSet"')
            )
        ).toBe(true);
        expect(
            messages.some((m) =>
                m.includes('Error in middleware "thrower" phase "beforeSet"')
            )
        ).toBe(true);
        expect(
            messages.some((m) => m.includes("Error invoking error handler"))
        ).toBe(true);
        expect(
            messages.some((m) =>
                m.includes('Error in error handler for "errMW"')
            )
        ).toBe(true);

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
        } = await import("../utils/state/core/stateMiddleware.js");

        registerMiddleware(
            "mutator",
            {
                beforeSet(ctx: any) {
                    return { ...ctx, value: "mutated" };
                },
            },
            100
        );

        middlewareManager.setGlobalEnabled(false);
        const ctx = { path: "p", value: "orig" } as any;
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
        } = await import("../utils/state/core/stateMiddleware.js");

        // Pre-seed global performance array with 100 entries
        (globalThis as any)._statePerformance = new Array(100)
            .fill(null)
            .map((_, i) => ({
                duration: 1,
                path: `p${i}`,
                timestamp: i,
            }));

        registerMiddleware("performance", performanceMiddleware, 10);

        const ctx: any = { path: "pNew", value: 42 };
        const ctx2 = await executeMiddleware(MIDDLEWARE_PHASES.BEFORE_SET, ctx);
        await executeMiddleware(MIDDLEWARE_PHASES.AFTER_SET, ctx2);

        expect((globalThis as any)._statePerformance.length).toBe(100);
        expect((globalThis as any)._statePerformance[99].path).toBe("pNew");

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
        } = await import("../utils/state/core/stateMiddleware.js");

        registerMiddleware("persist", persistenceMiddleware, 10);
        const ctx: any = { path: "settings.theme", value: "dark" };
        await executeMiddleware(MIDDLEWARE_PHASES.AFTER_SET, ctx);

        expect(
            errorSpy.mock.calls.some((c) =>
                String(c[0]).includes(
                    '[StatePersist] Failed to save "settings.theme"'
                )
            )
        ).toBe(true);

        setItemMock.mockRestore();
        // restore just in case
        (window.localStorage as any).setItem = origSetItem;
        cleanupMiddleware();
    });

    it("warns when registering duplicate middleware names", async () => {
        vi.resetModules();
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

        const { registerMiddleware, cleanupMiddleware } =
            await import("../utils/state/core/stateMiddleware.js");

        registerMiddleware("dup", { beforeSet: (c: any) => c }, 50);
        registerMiddleware("dup", { beforeSet: (c: any) => c }, 60);

        expect(
            warnSpy.mock.calls.some((c) =>
                String(c[0]).includes('Middleware "dup" already registered')
            )
        ).toBe(true);
        cleanupMiddleware();
    });

    it("initializeDefaultMiddleware logs skip on second call", async () => {
        vi.resetModules();
        const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

        const { initializeDefaultMiddleware, cleanupMiddleware } =
            await import("../utils/state/core/stateMiddleware.js");

        // First call should initialize and log messages
        initializeDefaultMiddleware();
        // Second call should log skipping message and return
        initializeDefaultMiddleware();

        const logs = logSpy.mock.calls.map((c) => String(c[0]));
        expect(
            logs.some((l) =>
                l.includes("Default middleware already initialized, skipping")
            )
        ).toBe(true);

        cleanupMiddleware();
    });
});
