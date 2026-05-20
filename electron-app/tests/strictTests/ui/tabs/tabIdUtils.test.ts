import { describe, expect, it, vi } from "vitest";

type TabIdUtilsModule = typeof import("../../../../utils/ui/tabs/tabIdUtils.js");

describe("tabIdUtils", () => {
    it("normalizes tab names and content tab aliases", async () => {
        expect.assertions(4);

        const {
            DEFAULT_TAB_NAMES_LIST,
            normalizeContentTabName,
            normalizeTabName,
        } = await importTabIdUtils();

        expect(normalizeTabName("ChartJS")).toBe("chart_js");
        expect(normalizeTabName("PowerZone")).toBe("power_zone");
        expect(normalizeContentTabName("chartjs")).toBe("chart");
        expect(DEFAULT_TAB_NAMES_LIST).toContain("summary");
    });

    it("extracts tab names from known button ID patterns", async () => {
        expect.assertions(5);

        const { extractTabNameFromButtonId } = await importTabIdUtils();

        expect(extractTabNameFromButtonId("tab_summary")).toBe("summary");
        expect(extractTabNameFromButtonId("summary-tab")).toBe("summary");
        expect(extractTabNameFromButtonId("btn-map")).toBe("map");
        expect(extractTabNameFromButtonId("map_btn")).toBe("map");
        expect(extractTabNameFromButtonId("tab_unknown")).toBe(
            "tab_unknown"
        );
    });

    it("resolves configured tab names from direct variants and parsed names", async () => {
        expect.assertions(4);

        const { resolveTabNameFromButtonId } = await importTabIdUtils();
        const tabConfigMap = {
            chart: { id: "tab-chart" },
            summary: { id: "tab-summary" },
        };

        expect(resolveTabNameFromButtonId("tab_summary", tabConfigMap)).toBe(
            "summary"
        );
        expect(resolveTabNameFromButtonId("btnChart", tabConfigMap)).toBe(
            "chart"
        );
        expect(resolveTabNameFromButtonId("not-a-tab", tabConfigMap)).toBeNull();
        expect(resolveTabNameFromButtonId(null, tabConfigMap)).toBeNull();
    });

    it("extracts tab names from content IDs and warns on invalid input", async () => {
        expect.assertions(5);

        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

        try {
            const { extractTabNameFromContentId } = await importTabIdUtils();

            expect(extractTabNameFromContentId("contentSummary")).toBe(
                "summary"
            );
            expect(extractTabNameFromContentId("content_chartjs")).toBe(
                "chart"
            );
            expect(extractTabNameFromContentId("map-content")).toBe("map");
            expect(extractTabNameFromContentId(undefined)).toBeNull();
            expect(warnSpy).toHaveBeenCalledWith(
                "extractTabNameFromContentId: Invalid contentId provided. Expected a non-empty string. Received:",
                undefined
            );
        } finally {
            warnSpy.mockRestore();
        }
    });

    it("maps tab names to content IDs with chartjs compatibility", async () => {
        expect.assertions(4);

        const { getContentIdFromTabName } = await importTabIdUtils();
        const unknown = { contentId: getContentIdFromTabName("custom") };

        expect(getContentIdFromTabName("chart")).toBe("content_chartjs");
        expect(getContentIdFromTabName("chartjs")).toBe("content_chartjs");
        expect(unknown).toStrictEqual({ contentId: "content_custom" });
        expect(unknown).not.toStrictEqual({ contentId: "content_chartjs" });
    });
});

async function importTabIdUtils(): Promise<TabIdUtilsModule> {
    return import("../../../../utils/ui/tabs/tabIdUtils.js");
}
