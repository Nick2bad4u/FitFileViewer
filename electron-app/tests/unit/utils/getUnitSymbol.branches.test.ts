import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getUnitSymbol } from "../../../utils/data/lookups/getUnitSymbol.js";

describe("getUnitSymbol.js - additional branch coverage", () => {
    const originalConsoleWarn = console.warn;
    const originalConsoleError = console.error;
    let originalWindowLocalStorage: any;
    let originalGlobalLocalStorage: any;

    beforeEach(() => {
        originalWindowLocalStorage = (window as any).localStorage;
        originalGlobalLocalStorage = (globalThis as any).localStorage;
        vi.restoreAllMocks();
    });

    afterEach(() => {
        // restore storages
        Object.defineProperty(window, "localStorage", {
            value: originalWindowLocalStorage,
            writable: true,
            configurable: true,
        });
        (globalThis as any).localStorage = originalGlobalLocalStorage;
        console.warn = originalConsoleWarn;
        console.error = originalConsoleError;
    });

    it("falls back when no storage is available", () => {
        Object.defineProperty(window, "localStorage", { value: undefined, writable: true, configurable: true });
        (globalThis as any).localStorage = undefined;
        const result = getUnitSymbol("distance");
        expect(result).toBe("km");
    });

    it("uses global localStorage when window.localStorage is unavailable", () => {
        Object.defineProperty(window, "localStorage", { value: undefined, writable: true, configurable: true });
        (globalThis as any).localStorage = {
            getItem: (key: string) => (key === "chartjs_distanceUnits" ? "miles" : null),
        } as Storage;
        const result = getUnitSymbol("distance");
        expect(result).toBe("mi");
    });

    it("returns fallback when storage.getItem is not a function", () => {
        Object.defineProperty(window, "localStorage", { value: {} as any, writable: true, configurable: true });
        (globalThis as any).localStorage = undefined;
        const result = getUnitSymbol("distance");
        expect(result).toBe("km");
    });

    it("handles storage.getItem throwing by warning and using fallback", () => {
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
        Object.defineProperty(window, "localStorage", {
            value: {
                getItem: () => {
                    throw new Error("boom");
                },
            } as any,
            writable: true,
            configurable: true,
        });
        const result = getUnitSymbol("temperature");
        expect(result).toBe("°C");
        expect(warnSpy).toHaveBeenCalled();
    });

    it("triggers top-level catch when console.warn throws during validation", () => {
        const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        // Force console.warn to throw when getUnitSymbol validates input
        console.warn = ((..._args: any[]) => {
            throw new Error("warn-fail");
        }) as any;
        const result = getUnitSymbol(null as any);
        expect(result).toBe("");
        expect(errorSpy).toHaveBeenCalled();
    });
});
