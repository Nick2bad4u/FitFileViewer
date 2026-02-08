import { describe, expect, it } from "vitest";

import {
    applyAuxHeartRateToRecords,
    getAuxHeartRateValue,
    resolveAuxHeartRateResolution,
} from "../../../../../utils/data/processing/auxHeartRateUtils.js";

describe("auxHeartRateUtils", () => {
    it("detects explicit auxHeartRate fields", () => {
        const recordMesgs = [{ auxHeartRate: 120 }, { auxHeartRate: 125 }];

        const resolution = resolveAuxHeartRateResolution(recordMesgs, []);
        expect(resolution.source).toBe("recordKey");
        expect(resolution.fieldKey).toBe("auxHeartRate");

        const value = getAuxHeartRateValue(recordMesgs[0], {
            recordMesgs,
            resolution,
        });
        expect(value).toBe(120);
    });

    it("normalizes snake_case aux_heart_rate fields", () => {
        const recordMesgs = [{ aux_heart_rate: 118 }, { aux_heart_rate: 122 }];

        const result = applyAuxHeartRateToRecords({ recordMesgs });
        expect(result.applied).toBe(true);
        expect(recordMesgs[0].auxHeartRate).toBe(118);
        expect(recordMesgs[1].auxHeartRate).toBe(122);
    });

    it("detects numbered heart_rate fields as auxiliary", () => {
        const recordMesgs = [{ heart_rate_2: 140 }, { heart_rate_2: 141 }];

        const result = applyAuxHeartRateToRecords({ recordMesgs });
        expect(result.applied).toBe(true);
        expect(recordMesgs[0].auxHeartRate).toBe(140);
        expect(recordMesgs[1].auxHeartRate).toBe(141);
    });

    it("maps developer fields when descriptions indicate auxiliary HR", () => {
        const recordMesgs = [
            { developerFields: '{"7": 155}' },
            { developerFields: '{"7": 160}' },
        ];

        const fieldDescriptionMesgs = [
            {
                field_definition_number: 7,
                field_name: "Auxiliary Heart Rate",
                developer_data_index: 1,
            },
        ];

        const result = applyAuxHeartRateToRecords({
            fieldDescriptionMesgs,
            recordMesgs,
        });

        expect(result.applied).toBe(true);
        expect(recordMesgs[0].auxHeartRate).toBe(155);
        expect(recordMesgs[1].auxHeartRate).toBe(160);
    });

    it("falls back to row inspection when record context is missing", () => {
        const row = { heart_rate_2: 149 };
        const value = getAuxHeartRateValue(row);
        expect(value).toBe(149);
    });
});
