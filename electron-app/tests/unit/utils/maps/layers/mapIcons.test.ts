import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Helper to define or delete global L
function setLeafletMock(impl?: { icon: (opts: any) => any }) {
    if (impl) {
        // @ts-ignore define
        (globalThis as any).L = { icon: impl.icon } as any;
    } else {
        // @ts-ignore delete
        delete (globalThis as any).L;
    }
}

async function loadModule() {
    // Ensure a fresh module instance so LRef is recomputed
    vi.resetModules();
    return await import("../../../../../utils/maps/layers/mapIcons.js");
}

describe("mapIcons", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        setLeafletMock();
    });
    afterEach(() => {
        setLeafletMock();
    });

    it("createStartIcon returns shim object when L missing", async () => {
        setLeafletMock(undefined);
        const { createStartIcon } = await loadModule();
        const icon = createStartIcon();
        expect(icon).toEqual({});
    });

    it("createEndIcon returns shim object when L missing", async () => {
        setLeafletMock(undefined);
        const { createEndIcon } = await loadModule();
        const icon = createEndIcon();
        expect(icon).toEqual({});
    });

    it("createStartIcon calls L.icon with start asset", async () => {
        const iconSpy = vi.fn((opts: any) => ({ ...opts, _type: "icon" }));
        setLeafletMock({ icon: iconSpy });

        const { createStartIcon } = await loadModule();
        const icon = createStartIcon();

        expect(iconSpy).toHaveBeenCalledTimes(1);
        const args = iconSpy.mock.calls[0][0];
        expect(args.iconUrl).toContain("libs/assets/icons/start-icon.png");
        expect(args.iconAnchor).toEqual([16, 32]);
        expect(args.iconSize).toEqual([32, 32]);
        expect(args.popupAnchor).toEqual([0, -32]);

        // Ensure returned icon is what L.icon produced
        expect(icon).toHaveProperty("_type", "icon");
    });

    it("createEndIcon calls L.icon with end asset", async () => {
        const iconSpy = vi.fn((opts: any) => ({ ...opts, _type: "icon" }));
        setLeafletMock({ icon: iconSpy });

        const { createEndIcon } = await loadModule();
        const icon = createEndIcon();

        expect(iconSpy).toHaveBeenCalledTimes(1);
        const args = iconSpy.mock.calls[0][0];
        expect(args.iconUrl).toContain("libs/assets/icons/end-icon.png");
        expect(args.iconAnchor).toEqual([16, 32]);
        expect(args.iconSize).toEqual([32, 32]);
        expect(args.popupAnchor).toEqual([0, -32]);

        expect(icon).toHaveProperty("_type", "icon");
    });
});
