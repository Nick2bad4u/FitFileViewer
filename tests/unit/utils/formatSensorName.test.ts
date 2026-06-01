import { afterEach, describe, expect, it, vi } from "vitest";

const formatManufacturerModulePath =
    "../../../electron-app/utils/formatting/formatters/formatManufacturer.js";
const formatProductModulePath =
    "../../../electron-app/utils/formatting/formatters/formatProduct.js";
type FormatManufacturerMock = (manufacturer: unknown) => string;
type FormatProductMock = (manufacturer: unknown, productId: unknown) => string;

async function importFormatSensorNameWithMocks({
    formatManufacturerImplementation,
    formatProductImplementation,
}: {
    formatManufacturerImplementation?: FormatManufacturerMock;
    formatProductImplementation?: FormatProductMock;
} = {}) {
    vi.resetModules();

    const mockedFormatManufacturer = vi
        .fn<FormatManufacturerMock>()
        .mockImplementation(
            formatManufacturerImplementation ?? (() => "Garmin")
        );
    const mockedFormatProduct = vi
        .fn<FormatProductMock>()
        .mockImplementation(formatProductImplementation ?? (() => "Edge 520"));

    vi.doMock(formatManufacturerModulePath, () => ({
        formatManufacturer: mockedFormatManufacturer,
    }));
    vi.doMock(formatProductModulePath, () => ({
        formatProduct: mockedFormatProduct,
    }));

    const { formatSensorName } =
        await import("../../../electron-app/utils/formatting/formatters/formatSensorName.js");

    return {
        formatSensorName,
        mockedFormatManufacturer,
        mockedFormatProduct,
    };
}

describe("formatSensorName", () => {
    afterEach(() => {
        vi.doUnmock(formatManufacturerModulePath);
        vi.doUnmock(formatProductModulePath);
        vi.restoreAllMocks();
        vi.resetModules();
    });

    it("formats manufacturer and product sensors without duplicate brands", async () => {
        expect.assertions(4);

        const {
            formatSensorName,
            mockedFormatManufacturer,
            mockedFormatProduct,
        } = await importFormatSensorNameWithMocks();

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

    it("formats garmin product values without formatter dependencies", async () => {
        expect.assertions(3);

        const {
            formatSensorName,
            mockedFormatManufacturer,
            mockedFormatProduct,
        } = await importFormatSensorNameWithMocks();

        expect(formatSensorName({ garminProduct: "edge_520_plus" })).toBe(
            "Edge 520 Plus"
        );
        expect(mockedFormatManufacturer).not.toHaveBeenCalled();
        expect(mockedFormatProduct).not.toHaveBeenCalled();
    });

    it("formats manufacturer-only fallbacks without product lookups", async () => {
        expect.assertions(3);

        const {
            formatSensorName,
            mockedFormatManufacturer,
            mockedFormatProduct,
        } = await importFormatSensorNameWithMocks();

        expect(formatSensorName({ manufacturer: "garmin" })).toBe("Garmin");
        expect(mockedFormatManufacturer).toHaveBeenCalledWith("garmin");
        expect(mockedFormatProduct).not.toHaveBeenCalled();
    });

    it("prioritizes manufacturer and product over garmin product values", async () => {
        expect.assertions(1);

        const { formatSensorName } = await importFormatSensorNameWithMocks();

        expect(
            formatSensorName({
                garminProduct: "edge_520_plus",
                manufacturer: 1,
                product: 1735,
            })
        ).toBe("Garmin Edge 520");
    });

    it("handles invalid-input sensors with warnings", async () => {
        expect.assertions(9);

        const {
            formatSensorName,
            mockedFormatManufacturer,
            mockedFormatProduct,
        } = await importFormatSensorNameWithMocks();
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

    it("logs and falls back when formatter dependencies fail", async () => {
        expect.assertions(2);

        const productError = new Error("Product error");
        const { formatSensorName } = await importFormatSensorNameWithMocks({
            formatProductImplementation: () => {
                throw productError;
            },
        });
        const errorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});

        expect(formatSensorName({ manufacturer: 1, product: 1735 })).toBe(
            "Unknown Sensor"
        );
        expect(errorSpy).toHaveBeenCalledWith(
            "[formatSensorName] Error formatting sensor name:",
            productError
        );
    });
});
