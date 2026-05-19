import { dataAntManufacturerIDs } from "../../data/lookups/dataAntManufacturerIDs.js";
import { dataAntProductIds } from "../../data/lookups/dataAntProductIds.js";

type IdLike = number | string;
type ManufacturerAndProduct = {
    readonly manufacturerName: unknown;
    readonly productName: unknown;
};

type ProductMap = Record<string, string>;

/**
 * Gets both manufacturer and product names from IDs.
 *
 * @param manufacturerId - Manufacturer ID.
 * @param productId - Product ID, or null to skip product lookup.
 *
 * @returns Object with manufacturerName and productName.
 */
export function getManufacturerAndProduct(
    manufacturerId: IdLike,
    productId: IdLike | null = null
): ManufacturerAndProduct {
    const manufacturerName = getManufacturerName(manufacturerId);
    const productName =
        productId === null ? null : getProductName(manufacturerId, productId);

    return {
        manufacturerName,
        productName,
    };
}

/**
 * Gets manufacturer ID from manufacturer name.
 *
 * @param manufacturerName - Manufacturer name, for example "garmin".
 *
 * @returns Manufacturer ID, or null if not found.
 */
export function getManufacturerIdFromName(
    manufacturerName: unknown
): number | null {
    if (!manufacturerName || typeof manufacturerName !== "string") {
        return null;
    }

    const normalizedInput = manufacturerName.toLowerCase();
    const variations = new Set([
        normalizedInput,
        normalizedInput.replaceAll("_", ""),
        normalizedInput.replaceAll("electronics", "_electronics"),
        normalizedInput.replaceAll("electronics", "electronics"),
        normalizedInput.replaceAll(/([A-Z])/g, "_$1").toLowerCase(),
    ]);

    for (const [id, name] of Object.entries(dataAntManufacturerIDs)) {
        const normalizedName = name.toLowerCase();

        if (variations.has(normalizedName)) {
            return Number.parseInt(id, 10);
        }

        const nameVariations = [
            normalizedName,
            normalizedName.replaceAll("_", ""),
            normalizedName.replace(/_electronics/, "electronics"),
        ];

        if (nameVariations.includes(normalizedInput)) {
            return Number.parseInt(id, 10);
        }
    }

    return null;
}

/**
 * Gets manufacturer name from ID.
 *
 * Unknown values preserve the original input for legacy display behavior.
 *
 * @param manufacturerId - Manufacturer ID.
 *
 * @returns Manufacturer name, or the original value if not found.
 */
export function getManufacturerName(manufacturerId: unknown): unknown {
    const id =
        typeof manufacturerId === "string"
            ? Number.parseInt(manufacturerId, 10)
            : manufacturerId;

    return typeof id === "number" && Object.hasOwn(dataAntManufacturerIDs, id)
        ? dataAntManufacturerIDs[id as keyof typeof dataAntManufacturerIDs]
        : manufacturerId;
}

/**
 * Gets product name from manufacturer ID and product ID.
 *
 * Unknown values preserve the original product ID for legacy display behavior.
 *
 * @param manufacturerId - Manufacturer ID.
 * @param productId - Product ID.
 *
 * @returns Product name, or the original product ID if not found.
 */
export function getProductName(
    manufacturerId: unknown,
    productId: unknown
): unknown {
    const manufacturerKey =
        typeof manufacturerId === "string"
            ? Number.parseInt(manufacturerId, 10)
            : manufacturerId;
    const productKey =
        typeof productId === "string"
            ? Number.parseInt(productId, 10)
            : productId;

    if (
        typeof manufacturerKey !== "number" ||
        typeof productKey !== "number" ||
        !Object.hasOwn(dataAntProductIds, manufacturerKey)
    ) {
        return productId;
    }

    const manufacturerProducts = dataAntProductIds[
        manufacturerKey as keyof typeof dataAntProductIds
    ] as ProductMap | undefined;

    return manufacturerProducts &&
        Object.hasOwn(manufacturerProducts, productKey)
        ? manufacturerProducts[String(productKey)]
        : productId;
}
