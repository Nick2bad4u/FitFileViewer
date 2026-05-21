/**
 * Documentation requirement map for one standards category.
 */
export type DocumentationRequirementMap = Record<
    string,
    string | readonly string[]
>;

/**
 * Documentation standards and requirements for consistency across the codebase.
 */
export type DocumentationStandards = {
    FILE_HEADER: DocumentationRequirementMap;
    FUNCTION_DOCS: DocumentationRequirementMap;
    EXAMPLE_STANDARDS: DocumentationRequirementMap;
    CONSISTENCY_PATTERNS: DocumentationRequirementMap;
    QUALITY_CHECKLIST: DocumentationRequirementMap;
};

/**
 * Consistent JSDoc documentation patterns for FitFileViewer modules.
 */
export const DOCUMENTATION_STANDARDS = {
    FILE_HEADER: {
        fileoverview: "required - Brief and detailed description",
        author: "FitFileViewer Team",
        since: "required - Version when introduced",
        version: "required for v2.0.0+ - Include change description",
    },
    FUNCTION_DOCS: {
        description: "required - What the function does",
        param: "required for all parameters - Include type and description",
        returns: "required unless void - Include type and description",
        example: "at least one required - Show basic usage",
        throws: "required if function can throw - Include error types and conditions",
    },
    EXAMPLE_STANDARDS: {
        show_input: "required - Show parameter values",
        show_output: "required when applicable - Show expected results",
        show_edge_cases: "recommended - Cover boundary conditions",
        show_error_handling: "required for functions that throw",
    },
    CONSISTENCY_PATTERNS: {
        error_handling: "Document all error conditions and types",
        validation: "Explain input validation and constraints",
        return_formats: "Specify exact return value structure",
        related_functions: "Cross-reference related functionality with @see",
    },
    QUALITY_CHECKLIST: {
        required_fields: [
            "@fileoverview",
            "@author",
            "@since",
            "function descriptions",
            "@param for all parameters",
            "@returns unless void",
            "@example",
        ],
        best_practices: [
            "Use meaningful names",
            "Include edge cases",
            "Document side effects",
            "Keep descriptions concise",
            "Use consistent terminology",
            "Cross-reference related functions",
        ],
    },
} as const satisfies DocumentationStandards;
