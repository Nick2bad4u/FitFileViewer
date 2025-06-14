import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { updateMapTheme } from "../utils/updateMapTheme";

describe("updateMapTheme", () => {
    let leafletMap;
    beforeEach(() => {
        leafletMap = document.createElement("div");
        leafletMap.id = "leaflet-map";
        document.body.appendChild(leafletMap);
        document.body.className = "";
    });
    afterEach(() => {
        document.body.removeChild(leafletMap);
    });
    it("should apply dark filter if theme-dark is present", () => {
        document.body.classList.add("theme-dark");
        updateMapTheme();
        expect(leafletMap.style.filter).toContain("invert");
    });
    it("should remove filter if theme-dark is not present", () => {
        document.body.classList.remove("theme-dark");
        updateMapTheme();
        expect(leafletMap.style.filter).toBe("none");
    });
    it("should do nothing if leaflet-map element is missing", () => {
        document.body.removeChild(leafletMap);
        expect(() => updateMapTheme()).not.toThrow();
    });
});
