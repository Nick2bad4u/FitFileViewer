/* eslint-env node */
const { Buffer } = require("buffer");
const { Conf } = require("electron-conf");
const conf = new Conf({ name: "settings" });
/**
 * Custom error for FIT file decoding issues.
 */
class FitDecodeError extends Error {
    constructor(message, details) {
        super(message);
        this.name = "FitDecodeError";
        this.details = details;
    }
}

// Mapping of unknown FIT message numbers to human-readable names and field labels
const unknownMessageMappings = {
    104: {
        name: "Device Status",
        fields: ["timestamp", "battery_voltage", "battery_level", "temperature", "field_4"],
    },
    // Add more mappings as needed
};

/**
 * Applies human-readable names and field labels to unknown messages.
 * @param {Object} messages - The decoded FIT messages.
 * @returns {Object} Messages with updated labels for unknown types.
 */
function applyUnknownMessageLabels(messages) {
    const updated = { ...messages };
    Object.keys(unknownMessageMappings).forEach((msgNum) => {
        const mapping = unknownMessageMappings[msgNum];
        const possibleKeys = [`unknown_${msgNum}`, msgNum];
        possibleKeys.forEach((key) => {
            if (updated[key]) {
                if (msgNum === "104") {
                    // Special mapping for 104: rearrange fields
                    updated[mapping.name] = updated[key].map((row) => ({
                        timestamp: row[253],
                        battery_voltage: row[0],
                        battery_level: row[2],
                        temperature: row[3],
                        field_4: row[4],
                    }));
                } else {
                    // Default: map in order
                    updated[mapping.name] = updated[key].map((row) => {
                        const labeled = {};
                        mapping.fields.forEach((field, idx) => {
                            labeled[field] = row[idx];
                        });
                        return labeled;
                    });
                }
                delete updated[key];
            }
        });
    });
    // After relabeling, remove numeric keys for mapped messages
    Object.keys(unknownMessageMappings).forEach((msgNum) => {
        const mapping = unknownMessageMappings[msgNum];
        const key = msgNum;
        if (updated[key] && updated[mapping.name]) {
            delete updated[key];
        }
    });
    return updated;
}

/**
 * Retrieves persisted decoder options from the store.
 * @returns {Object} Persisted decoder options.
 */
function getPersistedDecoderOptions() {
    const defaults = {
        applyScaleAndOffset: true,
        expandSubFields: true,
        expandComponents: true,
        convertTypesToStrings: true,
        convertDateTimesToDates: true,
        includeUnknownData: true,
        mergeHeartRates: true,
    };
    return conf.get("decoderOptions", defaults);
}

/**
 * Decodes a FIT file buffer using the Garmin FIT SDK.
 * @param {Buffer|Uint8Array} fileBuffer - The FIT file buffer to decode.
 * @param {Object} [options] - Optional decoder.read options.
 * @param {Object} [fitsdk] - Optional fitsdk dependency for testing/mocking.
 * @returns {Promise<Object>} Decoded messages or error object.
 */
async function decodeFitFile(fileBuffer, options = {}, fitsdk = null) {
    // Input validation
    if (!fileBuffer || !(fileBuffer instanceof Buffer || fileBuffer instanceof Uint8Array)) {
        const msg = `Input is not a valid Buffer or Uint8Array. Received type: ${typeof fileBuffer}.`;
        console.error(msg);
        throw new FitDecodeError(msg);
    }
    try {
        const sdk = fitsdk || (await import("@garmin/fitsdk"));
        const { Decoder, Stream } = sdk;
        const buffer = Buffer.isBuffer(fileBuffer) ? fileBuffer : Buffer.from(fileBuffer);
        const stream = Stream.fromBuffer(buffer);
        const decoder = new Decoder(stream);
        if (!decoder.checkIntegrity()) {
            const integrityErrors =
                typeof decoder.getIntegrityErrors === "function"
                    ? decoder.getIntegrityErrors()
                    : "No additional details available";
            const msg = `FIT file integrity check failed. Details: ${integrityErrors}`;
            console.error(msg);
            throw new FitDecodeError(msg, integrityErrors);
        }
        // Default decoder options from persistent store
        const persistedOptions = getPersistedDecoderOptions();
        const readOptions = Object.assign({}, persistedOptions, options);
        const { messages, errors } = decoder.read(readOptions);
        if (errors && errors.length > 0) {
            const msg = "Decoding errors occurred";
            console.error(msg, errors);
            throw new FitDecodeError(msg, errors);
        }
        if (!messages || Object.keys(messages).length === 0) {
            const msg = "No valid messages decoded, FIT file might be corrupted.";
            console.error(msg);
            throw new FitDecodeError(msg);
        }
        console.log("FIT file decoded successfully.");
        return applyUnknownMessageLabels(messages);
    } catch (error) {
        if (error instanceof FitDecodeError) {
            return { error: error.message, details: error.details };
        }
        console.error("Failed to decode file", error);
        return {
            error: error.message || "Failed to decode file",
            details: error.stack || null,
        };
    }
}

module.exports = { decodeFitFile, FitDecodeError };
