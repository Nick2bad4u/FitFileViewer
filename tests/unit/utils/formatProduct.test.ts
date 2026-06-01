import { beforeEach, describe, expect, it, vi } from "vitest";
import { formatProduct } from "../../../electron-app/utils/formatting/formatters/formatProduct.js";
import {
    getManufacturerIdFromName,
    getProductName,
} from "../../../electron-app/utils/formatting/display/formatAntNames.js";

vi.mock(
    import("../../../electron-app/utils/formatting/display/formatAntNames.js"),
    () => ({
        getManufacturerIdFromName:
            vi.fn<(manufacturerName: unknown) => number | null>(),
        getProductName:
            vi.fn<(manufacturerId: unknown, productId: unknown) => unknown>(),
    })
);

const mockedGetManufacturerIdFromName = vi.mocked(getManufacturerIdFromName);
const mockedGetProductName = vi.mocked(getProductName);

describe(formatProduct, () => {
    beforeEach(() => {
        vi.clearAllMocks();

        mockedGetManufacturerIdFromName.mockImplementation((name) =>
            typeof name === "string" && name.trim().toLowerCase() === "garmin"
                ? 1
                : null
        );
        mockedGetProductName.mockImplementation((manufacturerId, productId) => {
            const products: Record<string, string> = {
                "1_0": "special_device",
                "1_1735": "edge_520",
                "32_1537": "elemnt_bolt",
            };

            return products[`${manufacturerId}_${productId}`] ?? productId;
        });
    });

    it("formats product lookup results from manufacturer IDs and names", () => {
        expect.assertions(4);

        expect(formatProduct(1, 1735)).toBe("Edge 520");
        expect(formatProduct("garmin", 1735)).toBe("Edge 520");
        expect(formatProduct("32", 1537)).toBe("Elemnt Bolt");
        expect(formatProduct(1, 0)).toBe("Special Device");
    });

    it("formats snake-case lookup names and falls back to product IDs", () => {
        expect.assertions(3);

        mockedGetProductName.mockReturnValueOnce("heart_rate_monitor");
        expect(formatProduct(1, 123)).toBe("Heart Rate Monitor");

        mockedGetProductName.mockReturnValueOnce("999");
        expect(formatProduct(1, 999)).toBe("999");

        mockedGetProductName.mockReturnValueOnce(null);
        expect(formatProduct(1, 456)).toBe("456");
    });

    it("handles invalid-input fallback cases", () => {
        expect.assertions(7);

        expect(formatProduct(null, 1735)).toBe("1735");
        expect(formatProduct(undefined, 1735)).toBe("1735");
        expect(formatProduct("", 1735)).toBe("1735");
        expect(formatProduct("unknown", 1735)).toBe("1735");
        expect(formatProduct(1, null)).toBe("Unknown Product");
        expect(formatProduct(1, undefined)).toBe("Unknown Product");
        expect(formatProduct(1, "")).toBe("Unknown Product");
    });

    it("warns and falls back when lookup helpers fail", () => {
        expect.assertions(4);

        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

        const manufacturerLookupError = new Error("Manufacturer lookup failed");
        mockedGetManufacturerIdFromName.mockImplementationOnce(() => {
            throw manufacturerLookupError;
        });
        expect(formatProduct("garmin", 1735)).toBe("1735");
        expect(warnSpy).toHaveBeenCalledWith(
            expect.stringContaining("Error looking up manufacturer ID:"),
            manufacturerLookupError
        );

        const productLookupError = new Error("Product lookup failed");
        mockedGetProductName.mockImplementationOnce(() => {
            throw productLookupError;
        });
        expect(formatProduct(1, 1735)).toBe("1735");
        expect(warnSpy).toHaveBeenCalledWith(
            expect.stringContaining("Error looking up product name:"),
            productLookupError
        );
    });
});
