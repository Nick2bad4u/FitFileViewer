import { describe, expect, it, vi } from "vitest";

const mapThemeState = vi.hoisted(() => ({
    mapShouldBeDark: true,
}));

vi.mock(
    import("../../../../utils/theming/specific/createMapThemeToggle.js"),
    () => ({
        getMapThemeInverted: vi.fn<() => boolean>(
            () => mapThemeState.mapShouldBeDark
        ),
        MAP_THEME_EVENTS: { CHANGED: "mapThemeChanged" },
    })
);

type UpdateMapThemeModule = typeof import("../../../../utils/theming/specific/updateMapTheme.js");

describe("updateMapTheme", () => {
    it("applies dark map theme only to tile panes", async () => {
        expect.assertions(6);

        resetTestState();
        const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

        try {
            const { updateMapTheme } = await importUpdateMapTheme();
            const { control, map, tilePanes } = appendLeafletMap();

            updateMapTheme();

            expect({
                inverted: map.classList.contains("ffv-map-inverted"),
            }).toStrictEqual({ inverted: true });
            expect(map.style.filter).toBe("none");
            expect(tilePanes[0]?.style.filter).toContain("invert");
            expect(tilePanes[1]?.style.filter).toContain("invert");
            expect(control.style.filter).toBe("");
            expect(control.style.filter).not.toContain("invert");
        } finally {
            logSpy.mockRestore();
        }
    });

    it("clears tile filters for light map theme", async () => {
        expect.assertions(4);

        resetTestState();
        mapThemeState.mapShouldBeDark = false;
        const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

        try {
            const { updateMapTheme } = await importUpdateMapTheme();
            const { map, tilePanes } = appendLeafletMap();

            for (const tilePane of tilePanes) {
                tilePane.style.filter = "invert(1)";
            }
            updateMapTheme();

            expect({
                inverted: map.classList.contains("ffv-map-inverted"),
            }).toStrictEqual({ inverted: false });
            expect(map.style.filter).toBe("none");
            expect(tilePanes[0]?.style.filter).toBe("none");
            expect(tilePanes[1]?.style.filter).toBe("none");
        } finally {
            logSpy.mockRestore();
        }
    });

    it("installs and removes update listeners", async () => {
        expect.assertions(4);

        resetTestState();
        mapThemeState.mapShouldBeDark = false;
        const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

        try {
            const {
                installUpdateMapThemeListeners,
                uninstallUpdateMapThemeListeners,
                updateMapTheme,
            } = await importUpdateMapTheme();
            const { map, tilePanes } = appendLeafletMap();

            updateMapTheme();

            expect({
                inverted: map.classList.contains("ffv-map-inverted"),
            }).toStrictEqual({ inverted: false });

            installUpdateMapThemeListeners();
            installUpdateMapThemeListeners();
            mapThemeState.mapShouldBeDark = true;
            document.dispatchEvent(new Event("themechange", { bubbles: true }));

            expect({
                inverted: map.classList.contains("ffv-map-inverted"),
            }).toStrictEqual({ inverted: true });
            expect(tilePanes[0]?.style.filter).toContain("invert");

            const darkFilter = tilePanes[0]?.style.filter;
            uninstallUpdateMapThemeListeners();
            mapThemeState.mapShouldBeDark = false;
            document.dispatchEvent(new CustomEvent("mapThemeChanged"));

            expect({ filterAfterUninstall: tilePanes[0]?.style.filter }).toStrictEqual({
                filterAfterUninstall: darkFilter,
            });
        } finally {
            logSpy.mockRestore();
        }
    });
});

async function importUpdateMapTheme(): Promise<UpdateMapThemeModule> {
    return import("../../../../utils/theming/specific/updateMapTheme.js");
}

function appendLeafletMap(): {
    control: HTMLElement;
    map: HTMLElement;
    tilePanes: HTMLElement[];
} {
    const map = document.createElement("div");
    map.id = "leaflet-map";
    map.style.filter = "invert(1)";

    const tilePanes = [
        document.createElement("div"),
        document.createElement("div"),
    ];
    for (const tilePane of tilePanes) {
        tilePane.className = "leaflet-tile-pane";
        map.append(tilePane);
    }

    const control = document.createElement("button");
    control.className = "leaflet-control";
    map.append(control);
    document.body.append(map);

    return { control, map, tilePanes };
}

function resetTestState(): void {
    vi.resetModules();
    vi.clearAllMocks();
    document.body.textContent = "";
    mapThemeState.mapShouldBeDark = true;
}
