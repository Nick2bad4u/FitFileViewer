import { beforeEach, describe, expect, it, vi } from "vitest";
import { formatManufacturer } from "../../../utils/formatting/formatters/formatManufacturer.js";
import { formatProduct } from "../../../utils/formatting/formatters/formatProduct.js";
import { formatSensorName } from "../../../utils/formatting/formatters/formatSensorName.js";

vi.mock("../../../utils/formatting/formatters/formatManufacturer.js", () => ({
    formatManufacturer: vi.fn(),
}));

vi.mock("../../../utils/formatting/formatters/formatProduct.js", () => ({
    formatProduct: vi.fn(),
}));

const mockedFormatManufacturer = vi.mocked(formatManufacturer);
const mockedFormatProduct = vi.mocked(formatProduct);

describe("formatSensorName", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockedFormatManufacturer.mockReturnValue("Garmin");
        mockedFormatProduct.mockReturnValue("Edge 520");
    });

    it("formats manufacturer and product sensors without duplicate brands", () => {
        expect(formatSensorName({ manufacturer: 1, product: 1735 })).toBe(
            "Garmin Edge 520"
        );
        expect(mockedFormatManufacturer).toHaveBeenCalledWith(1);
        expect(mockedFormatProduct).toHaveBeenCalledWith(1, 1735);

        mockedFormatProduct.mockReturnValueOnce("Garmin Edge 1030");
        expect(
            formatSensorName({ manufacturer: "garmin", product: 3624 })
        ).toBe("Garmin Edge 1030");
    });

    it("formats garmin product values without formatter dependencies", () => {
        expect(formatSensorName({ garminProduct: "edge_520_plus" })).toBe(
            "Edge 520 Plus"
        );
        expect(mockedFormatManufacturer).not.toHaveBeenCalled();
        expect(mockedFormatProduct).not.toHaveBeenCalled();
    });

    it("formats manufacturer-only fallbacks without product lookups", () => {
        expect(formatSensorName({ manufacturer: "garmin" })).toBe("Garmin");
        expect(mockedFormatManufacturer).toHaveBeenCalledWith("garmin");
        expect(mockedFormatProduct).not.toHaveBeenCalled();
    });

    it("prioritizes manufacturer and product over garmin product values", () => {
        expect(
            formatSensorName({
                garminProduct: "edge_520_plus",
                manufacturer: 1,
                product: 1735,
            })
        ).toBe("Garmin Edge 520");
    });

    it("handles invalid-input sensors with warnings", () => {
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

        for (const sensor of [
            null,
            undefined,
            "invalid",
            123,
            true,
        ]) {
            expect(formatSensorName(sensor)).toBe("Unknown Sensor");
        }

        expect(formatSensorName({})).toBe("Unknown Sensor");
        expect(warnSpy).toHaveBeenCalledWith(
            "[formatSensorName] Invalid sensor object provided:",
            null
        );
        expect(mockedFormatManufacturer).not.toHaveBeenCalled();
        expect(mockedFormatProduct).not.toHaveBeenCalled();
    });

    it("logs and falls back when formatter dependencies fail", () => {
        const errorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});

        mockedFormatProduct.mockImplementationOnce(() => {
            throw new Error("Product error");
        });

        expect(formatSensorName({ manufacturer: 1, product: 1735 })).toBe(
            "Unknown Sensor"
        );
        expect(errorSpy).toHaveBeenCalledWith(
            "[formatSensorName] Error formatting sensor name:",
            expect.any(Error)
        );
    });
});
