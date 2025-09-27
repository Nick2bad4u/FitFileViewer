// @ts-nocheck
/**
 * @fileoverview JSDoc Documentation Templates and Standards
 * @description Provides consistent documentation patterns for the FitFileViewer codebase
 * @author FitFileViewer Development Team
 * @version 1.0.0
 */

/**
 * Documentation standards and requirements for consistency across the FitFileViewer codebase.
 * This file defines the patterns that should be followed for JSDoc comments to ensure
 * consistency, completeness, and maintainability.
 */

/**
 * Documentation standards configuration
 */
export const DOCUMENTATION_STANDARDS = {
    /**
     * File header requirements
     */
    FILE_HEADER: {
        fileoverview: "required - Brief and detailed description",
        author: "FitFileViewer Team",
        since: "required - Version when introduced",
        version: "required for v2.0.0+ - Include change description",
    },

    /**
     * Function documentation requirements
     */
    FUNCTION_DOCS: {
        description: "required - What the function does",
        param: "required for all parameters - Include type and description",
        returns: "required unless void - Include type and description",
        example: "at least one required - Show basic usage",
        throws: "required if function can throw - Include error types and conditions",
    },

    /**
     * Example quality standards
     */
    EXAMPLE_STANDARDS: {
        show_input: "required - Show parameter values",
        show_output: "required when applicable - Show expected results",
        show_edge_cases: "recommended - Cover boundary conditions",
        show_error_handling: "required for functions that throw",
    },

    /**
     * Consistency patterns that should be followed
     */
    CONSISTENCY_PATTERNS: {
        error_handling: "Document all error conditions and types",
        validation: "Explain input validation and constraints",
        return_formats: "Specify exact return value structure",
        related_functions: "Cross-reference related functionality with @see",
    },

    /**
     * Quality checklist for all documentation
     */
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
};
