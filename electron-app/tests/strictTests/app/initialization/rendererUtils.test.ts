import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the state manager used by rendererUtils
vi.mock("../../../../utils/state/core/stateManager.js", () => {
  const listeners = new Map<string, Set<Function>>();
  const state: Record<string, any> = {};
  return {
    subscribe: (path: string, cb: Function) => {
      if (!listeners.has(path)) listeners.set(path, new Set());
      listeners.get(path)!.add(cb);
      return () => listeners.get(path)!.delete(cb);
    },
    getState: (path: string) => state[path],
    setState: (path: string, value: any) => {
      const prev = state[path];
      state[path] = value;
      const set = listeners.get(path);
      if (set) set.forEach((cb) => cb(value, prev, path));
    },
  };
});

const modPath = "../../../../utils/app/initialization/rendererUtils.js";

function setupDOM() {
  document.body.innerHTML = `
    <div id="loadingOverlay" style="display:none"></div>
    <div id="notification" style="display:none"></div>
    <button id="openFileBtn">Open</button>
    <button id="otherBtn">Other</button>
    <input id="someInput" />
  `;
}

describe("rendererUtils", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    document.body.className = "";
    document.body.removeAttribute("aria-busy");
    vi.useFakeTimers();
    vi.resetModules();
    setupDOM();
  });

  it("showNotification updates DOM and clears after timeout", async () => {
    const { showNotification, getCurrentNotification } = await import(modPath);
    // Initially, state should be undefined/null
    expect(getCurrentNotification()).toBeUndefined();
    showNotification("Hello", "info", 1000);
    const notif = document.getElementById("notification")!;
    expect(notif.textContent).toBe("Hello");
    expect(notif.className).toContain("info");
    expect(notif.style.display).toBe("block");
    // Advance timers to auto-hide
    vi.runAllTimers();
    expect(notif.style.display).toBe("none");
  });

  it("showNotification warns if element missing", async () => {
    document.getElementById("notification")?.remove();
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { showNotification } = await import(modPath);
    showNotification("Hi", "success", 0);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("setLoading toggles overlay, cursor, and aria attributes", async () => {
    const { setLoading } = await import(modPath);
    const overlay = document.getElementById("loadingOverlay")! as HTMLDivElement;
    const openBtn = document.getElementById("openFileBtn")! as HTMLButtonElement;
    const otherBtn = document.getElementById("otherBtn")! as HTMLButtonElement;
    const input = document.getElementById("someInput")! as HTMLInputElement;
    otherBtn.disabled = false;
    input.disabled = false;

    setLoading(true);
    expect(overlay.style.display).toBe("flex");
    expect(document.body.style.cursor).toBe("wait");
    expect(overlay.getAttribute("aria-hidden")).toBe("false");
    expect(document.body.getAttribute("aria-busy")).toBe("true");
    // openFileBtn should remain enabled
    expect(openBtn.disabled).toBe(false);
    // setLoading does not manage disabling; that's handled by initializeRendererUtils subscription
    expect(otherBtn.disabled).toBe(false);
    expect(input.disabled).toBe(false);

    setLoading(false);
    expect(overlay.style.display).toBe("none");
    expect(document.body.style.cursor).toBe("");
    expect(overlay.getAttribute("aria-hidden")).toBe("true");
    expect(document.body.getAttribute("aria-busy")).toBe("false");
    // Controls remain unchanged by setLoading alone
    expect(otherBtn.disabled).toBe(false);
    expect(input.disabled).toBe(false);
  });

  it("initializeRendererUtils wires subscriptions and updates UI on state change", async () => {
    const { initializeRendererUtils } = await import(modPath);
    const overlay = document.getElementById("loadingOverlay")! as HTMLDivElement;
    const notif = document.getElementById("notification")! as HTMLDivElement;

    initializeRendererUtils();
    // Trigger state updates via mocked setState through subscription API
    // Import mocked stateManager to access setState
    const stateMgr = await import("../../../../utils/state/core/stateManager.js");
    stateMgr.setState("isLoading", true);
    expect(overlay.style.display).toBe("flex");

    stateMgr.setState("ui.currentNotification", { message: "Done", type: "success" });
    expect(notif.textContent).toBe("Done");
    expect(notif.className).toContain("success");
    expect(notif.style.display).toBe("block");
  });

  it("helper wrappers call showNotification with proper types", async () => {
    const { showSuccess, showError, showInfo, showWarning } = await import(modPath);
    const notif = document.getElementById("notification")! as HTMLDivElement;

    showSuccess("ok", 0);
    expect(notif.className).toContain("success");

    showError("bad", 0);
    expect(notif.className).toContain("error");

    showInfo("info", 0);
    expect(notif.className).toContain("info");

    showWarning("warn", 0);
    expect(notif.className).toContain("warning");
  });

  it("clearNotification hides element and clears state", async () => {
    const { clearNotification, showInfo } = await import(modPath);
    const notif = document.getElementById("notification")! as HTMLDivElement;
    showInfo("temp", 0);
    expect(notif.style.display).toBe("block");
    clearNotification();
    expect(notif.style.display).toBe("none");
  });
});
