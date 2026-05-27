import { describe, expect, it } from "vitest";

import { DOCUMENTATION_STANDARDS } from "../../../utils/docs/documentationStandards.js";

describe("documentation standards", () => {
    it("exposes the expected documentation categories", () => {
        expect.assertions(2);

        expect(Object.keys(DOCUMENTATION_STANDARDS)).toStrictEqual([
            "FILE_HEADER",
            "FUNCTION_DOCS",
            "EXAMPLE_STANDARDS",
            "CONSISTENCY_PATTERNS",
            "QUALITY_CHECKLIST",
        ]);
        expect(Object.keys(DOCUMENTATION_STANDARDS)).not.toContain(
            "PRIVATE_INTERNALS"
        );
    });

    it("defines concrete file header and function documentation requirements", () => {
        expect.assertions(2);

        expect(DOCUMENTATION_STANDARDS.FILE_HEADER).toStrictEqual({
            author: "FitFileViewer Team",
            fileoverview: "required - Brief and detailed description",
            since: "required - Version when introduced",
            version: "required for v2.0.0+ - Include change description",
        });
        expect(DOCUMENTATION_STANDARDS.FUNCTION_DOCS).toStrictEqual({
            description: "required - What the function does",
            example: "at least one required - Show basic usage",
            param: "required for all parameters - Include type and description",
            returns: "required unless void - Include type and description",
            throws: "required if function can throw - Include error types and conditions",
        });
    });

    it("keeps complete checklist fields and best practices available", () => {
        expect.assertions(2);

        expect(
            DOCUMENTATION_STANDARDS.QUALITY_CHECKLIST.required_fields
        ).toStrictEqual([
            "@fileoverview",
            "@author",
            "@since",
            "function descriptions",
            "@param for all parameters",
            "@returns unless void",
            "@example",
        ]);
        expect(
            DOCUMENTATION_STANDARDS.QUALITY_CHECKLIST.best_practices
        ).toStrictEqual([
            "Use meaningful names",
            "Include edge cases",
            "Document side effects",
            "Keep descriptions concise",
            "Use consistent terminology",
            "Cross-reference related functions",
        ]);
    });
});
