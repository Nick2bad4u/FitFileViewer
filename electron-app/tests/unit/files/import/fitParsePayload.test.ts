import { describe, expect, it } from "vitest";

import {
    getFitMessageRows,
    getFitMessagesSessionCount,
    getFitParseErrorMessage,
    unwrapFitParseMessages,
} from "../../../../utils/files/import/fitParsePayload.js";
import type {
    FitDecodeErrorPayload,
    FitMessages,
} from "../../../../shared/fit";

describe("fitParsePayload", () => {
    it("unwraps direct FIT message payloads", () => {
        expect.assertions(2);

        const messages: FitMessages = {
            records: [{ distance: 42, timestamp: "2026-05-23T00:00:00Z" }],
            sessions: [{ total_distance: 42 }],
        };

        expect(unwrapFitParseMessages(messages)).toBe(messages);
        expect(getFitMessagesSessionCount(messages)).toBe(1);
    });

    it("reads named FIT message row collections with Garmin and legacy aliases", () => {
        expect.assertions(4);

        const messages: FitMessages = {
            recordMesgs: [{ distance: 1000 }],
            sessionMesgs: [{ total_distance: 1000 }],
        };

        expect(getFitMessageRows(messages, "recordMesgs")).toBe(
            messages.recordMesgs
        );
        expect(getFitMessageRows(messages, "missingMesgs")).toStrictEqual([]);
        expect(getFitMessagesSessionCount(messages)).toBe(1);
        expect(getFitMessagesSessionCount({ session: [{}] })).toBe(1);
    });

    it("unwraps legacy success envelopes that contain FIT messages", () => {
        expect.assertions(1);

        const messages: FitMessages = {
            records: [{ speed: 7.5 }],
        };

        expect(unwrapFitParseMessages({ data: messages, success: true })).toBe(
            messages
        );
    });

    it("formats direct parser error payloads", () => {
        expect.assertions(2);

        const errorPayload: FitDecodeErrorPayload = {
            details: { file: "bad.fit", offset: 128 },
            error: "Invalid FIT file",
        };

        expect(getFitParseErrorMessage(errorPayload)).toStrictEqual({
            display: 'Invalid FIT file\n{"file":"bad.fit","offset":128}',
            summary: "Invalid FIT file",
        });
        expect(() => unwrapFitParseMessages(errorPayload)).toThrow(
            "Invalid FIT file"
        );
    });

    it("formats wrapped parser error payloads", () => {
        expect.assertions(1);

        expect(
            getFitParseErrorMessage({
                details: "checksum mismatch",
                error: "Decode failed",
                success: false,
            })
        ).toStrictEqual({
            display: "Decode failed\nchecksum mismatch",
            summary: "Decode failed",
        });
    });

    it("rejects malformed success envelopes instead of treating them as FIT messages", () => {
        expect.assertions(1);

        expect(() =>
            unwrapFitParseMessages({ success: true, type: "not-fit-data" })
        ).toThrow(TypeError);
    });
});
