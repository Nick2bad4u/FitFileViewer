import { describe, expect, it } from "vitest";

import { DOCUMENTATION_STANDARDS } from "../../../utils/docs/documentationStandards.js";

describe("documentation standards", () => {
    it("exposes the expected documentation categories", () => {
        expect.assertions(1);

        expect(Object.keys(DOCUMENTATION_STANDARDS).sort()).toStrictEqual([
            "CONSISTENCY_PATTERNS",
            "EXAMPLE_STANDARDS",
            "FILE_HEADER",
            "FUNCTION_DOCS",
            "QUALITY_CHECKLIST",
        ]);
    });

    it("keeps required checklist fields available", () => {
        expect.assertions(3);

        expect(
            DOCUMENTATION_STANDARDS.QUALITY_CHECKLIST.required_fields
        ).toContain("@fileoverview");
        expect(
            DOCUMENTATION_STANDARDS.QUALITY_CHECKLIST.required_fields
        ).not.toContain("@private");
        expect(
            DOCUMENTATION_STANDARDS.QUALITY_CHECKLIST.best_practices
        ).toContain("Document side effects");
    });
});
