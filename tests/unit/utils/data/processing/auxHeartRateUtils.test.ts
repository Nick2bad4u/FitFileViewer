import { describe, expect, it } from "vitest";

import {
    applyAuxHeartRateToRecords,
    getAuxHeartRateValue,
    resolveAuxHeartRateResolution,
} from "../../../../../electron-app/utils/data/processing/auxHeartRateUtils.js";

describe("auxHeartRateUtils", () => {
    it("detects explicit auxHeartRate fields", () => {
        expect.assertions(2);

        const recordMesgs = [{ auxHeartRate: 120 }, { auxHeartRate: 125 }];

        const resolution = resolveAuxHeartRateResolution(recordMesgs, []);
        expect(resolution).toMatchObject({
            fieldKey: "auxHeartRate",
            source: "recordKey",
        });

        const value = getAuxHeartRateValue(recordMesgs[0], {
            recordMesgs,
            resolution,
        });
        expect({ value }).toEqual({ value: 120 });
    });

    it("normalizes snake_case aux_heart_rate fields", () => {
        expect.assertions(1);

        const recordMesgs = [{ aux_heart_rate: 118 }, { aux_heart_rate: 122 }];

        const result = applyAuxHeartRateToRecords({ recordMesgs });
        expect({
            applied: result.applied,
            auxHeartRates: recordMesgs.map((record) => record.auxHeartRate),
        }).toEqual({
            applied: true,
            auxHeartRates: [118, 122],
        });
    });

    it("detects numbered heart_rate fields as auxiliary", () => {
        expect.assertions(1);

        const recordMesgs = [{ heart_rate_2: 140 }, { heart_rate_2: 141 }];

        const result = applyAuxHeartRateToRecords({ recordMesgs });
        expect({
            applied: result.applied,
            auxHeartRates: recordMesgs.map((record) => record.auxHeartRate),
        }).toEqual({
            applied: true,
            auxHeartRates: [140, 141],
        });
    });

    it("maps developer fields when descriptions indicate auxiliary HR", () => {
        expect.assertions(1);

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

        expect({
            applied: result.applied,
            auxHeartRates: recordMesgs.map((record) => record.auxHeartRate),
        }).toEqual({
            applied: true,
            auxHeartRates: [155, 160],
        });
    });

    it("falls back to row inspection when record context is missing", () => {
        expect.assertions(1);

        const row = { heart_rate_2: 149 };
        const value = getAuxHeartRateValue(row);
        expect({ value }).toEqual({ value: 149 });
    });
});
