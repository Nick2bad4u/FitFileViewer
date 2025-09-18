import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Load module fresh helper using dynamic import for ESM
const MODULE = "../../../../../utils/formatting/formatters/formatTime.js";
async function fresh() {
  vi.resetModules();
  const url = new URL(MODULE, import.meta.url).href;
  return await import(url);
}

describe("formatTime.strict branches", () => {
  let originalLocalStorage: any;

  beforeEach(() => {
    vi.resetModules();
    originalLocalStorage = (globalThis as any).localStorage;
    (globalThis as any).localStorage = undefined;
  });

  afterEach(() => {
    (globalThis as any).localStorage = originalLocalStorage;
  });

  it("returns '0:00' and warns for invalid input", async () => {
    const { formatTime } = await fresh();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(formatTime(NaN as any)).toBe("0:00");
    expect(formatTime(undefined as any)).toBe("0:00");
    expect(formatTime(-5)).toBe("0:00");
    expect(warn).toHaveBeenCalled();
  });

  it("formats seconds as MM:SS and HH:MM:SS", async () => {
    const { formatTime } = await fresh();
    expect(formatTime(59)).toBe("0:59");
    expect(formatTime(61)).toBe("1:01");
    expect(formatTime(3661)).toBe("1:01:01");
  });

  it("uses user units via globalThis.localStorage", async () => {
    // Provide a working localStorage on globalThis
    const store: Record<string, string> = {};
    (globalThis as any).localStorage = {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => (store[k] = v),
    } as any;
    store["chartjs_timeUnits"] = "minutes";
  const { formatTime } = await fresh();
    expect(formatTime(90, true)).toBe("1.5m");
    store["chartjs_timeUnits"] = "hours";
    expect(formatTime(3600, true)).toBe("1.00h");
  });

  it("prefers window.localStorage when present", async () => {
    // Ensure globalThis localStorage is absent so window path is used
    (globalThis as any).localStorage = undefined;
    const store: Record<string, string> = { chartjs_timeUnits: "seconds" };
    (global as any).window = {
      localStorage: {
        getItem: (k: string) => store[k] ?? null,
      },
    } as any;
  const { formatTime } = await fresh();
    expect(formatTime(61, true)).toBe("1:01");
  });

  it("logs error and returns fallback when storage getItem throws", async () => {
    (globalThis as any).localStorage = {
      getItem: () => {
        throw new Error("boom");
      },
    } as any;
  const { formatTime } = await fresh();
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(formatTime(10, true)).toBe("0:00");
    expect(err).toHaveBeenCalled();
  });

  it("logs error and returns fallback when converter throws", async () => {
    vi.resetModules();
    // Mock the converter module to throw
    vi.doMock("../../../../../utils/formatting/converters/convertTimeUnits.js", () => ({
      TIME_UNITS: { SECONDS: "seconds", MINUTES: "minutes", HOURS: "hours" },
      convertTimeUnits: () => {
        throw new Error("convert fail");
      },
    }));
  const { formatTime } = await fresh();
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(formatTime(10, true)).toBe("0:00");
    expect(err).toHaveBeenCalled();
  });
});
