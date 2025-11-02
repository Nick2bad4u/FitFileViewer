---
agent: "BeastMode"
tools: ['edit/createFile', 'edit/createDirectory', 'edit/editFiles', 'search/fileSearch', 'search/textSearch', 'search/listDirectory', 'search/readFile', 'search/codebase', 'runCommands/getTerminalOutput', 'runCommands/terminalLastCommand', 'runCommands/runInTerminal', 'runTasks/runTask', 'runTasks/getTaskOutput', 'electron-mcp-server/get_electron_window_info', 'electron-mcp-server/send_command_to_electron', 'electron-mcp-server/take_screenshot', 'Tavily-Remote-MCP/tavily_extract', 'Tavily-Remote-MCP/tavily_search', 'vscode-mcp/get_diagnostics', 'vscode-mcp/get_references', 'vscode-mcp/get_symbol_lsp_info', 'vscode-mcp/rename_symbol', 'runSubagent', 'usages', 'problems', 'changes', 'testFailure', 'fetch', 'ms-vscode.vscode-websearchforcopilot/websearch', 'todos', 'runTests']
description: "Run a consistency audit tailored for the FitFileViewer Electron + modular renderer stack."
---

# FitFileViewer Consistency Audit Prompt

## Objective

Review implementation code across the FitFileViewer stack to confirm the project continues to follow its modular Electron + renderer architecture. Cover foundational utilities, services, platform glue, and renderer-facing modules without dwelling on test-only files.

Go in detail to identify inconsistencies in structure, data flow, logic, and interfaces that could lead to maintenance challenges or bugs. Provide a prioritized report of findings with actionable recommendations for alignment.

Be super thorough and precise, as this will guide future refactoring and standardization efforts.

We want architectural perfection before adding new features.

If you find documentation gaps add them. If you find out-of-date documentation add a task to update it to the todo list.

## Analysis Requirements

### 1. Structural Alignment

- Ensure common architectural patterns for data access, eventing, IPC, and state integration are applied uniformly and respect the boundaries between infrastructure, shared logic, and presentation layers.
- Call out notable deviations from the expected layering or from the helper abstractions that already exist in the codebase.

### 2. Data Flow Health

- Trace representative flows from persistence through services and IPC into renderer state and UI to confirm validations, transformations, and error handling behave consistently.
- Note any mismatched logging or observability approaches that could hinder troubleshooting.

### 3. Logic Uniformity

- Look for domain rules or business logic implemented in multiple places with conflicting behaviour.
- Check that state stores and side-effect handlers follow the established conventions for naming, selectors, async control, and cleanup.

### 4. Interface Cohesion

- Compare IPC channels, shared contracts, and component/service signatures to the canonical types already published in shared modules or documentation.
- Highlight ad-hoc interfaces that should instead reuse the shared definitions.

### 5. Inconsistency Sweep

- Identify special-case paths or shortcuts that bypass shared utilities, transaction helpers, or event buses.
- Surface direct cross-layer calls or other anti-patterns that erode maintainability.

## Output Requirements

### 1. Categorized Report

For each inconsistency provide:
- Relevant file path(s) with concise excerpts.
- A short description of the issue, including the layer or pattern it affects.
- A recommended alignment approach grounded in an existing best practice within the repository.

### 2. Prioritization

Rank findings by their risk to stability, potential to introduce bugs, and overall impact on maintainability or onboarding.

### 3. Improvement Suggestions

Group related findings and outline:
- The preferred approach or exemplar to follow.
- Ordered steps to realign the affected code.
- Expected impact across modules, IPC contracts, schemas, or docs.

### 4. Roadmap

Suggest a staged plan:
- **Quick Wins** – light standardisations with meaningful payoff.
- **Medium-Term** – coordinated refactors requiring moderate coordination.
- **Long-Term** – deeper architectural work worth tracking separately.

## Additional Guidance

- Focus on implementation files; tests, Playwright specs, and Storybook content are out of scope.
- Prioritise cross-layer boundaries (repositories ↔ services, main ↔ renderer IPC, renderer state ↔ components).
- Treat formatting as secondary; address consistency first and run automated formatting afterwards if needed.
- Refer to existing documentation (e.g., `docs/`, architecture notes) before proposing schema or contract adjustments.
- Leverage available tooling (diagnostics, runtime inspection, etc.) when additional context is required.

## Fixing Inconsistencies

When addressing identified inconsistencies, follow these steps:
1. **Understand the Context**: Review the relevant code sections to fully grasp the intended functionality and how it fits within the overall architecture.
2. **Consult Documentation**: Refer to any existing documentation or architectural guidelines to ensure your changes align with established best practices.
3. **Refactor Thoughtfully**: Make changes that enhance consistency without introducing new issues. Ensure that your refactoring maintains the original functionality.
4. **Test Thoroughly**: After making changes, run existing tests and add new ones if necessary to verify that the changes do not break any functionality.
5. **Document Changes**: Update any relevant documentation to reflect the changes made, ensuring that future developers can understand the rationale behind the adjustments.
6. **No Backwards Compatibility**: Do NOT create backwards compatibility layers; instead, refactor all affected code to use the updated patterns or interfaces directly.
7. **Add to Todo List**: Add all identified inconsistencies to a detailed todo list with descriptions and work through the entire list.

## Examples of Inconsistencies to Look For

Examples of inconsistencies include:
- Different naming conventions for similar functions or variables across layers.
- Varied approaches to error handling in services versus UI components.
- Divergent data transformation logic for the same data structure in different modules.
- Inconsistent use of shared utilities or helper functions across the codebase.
- Mismatched IPC channel definitions between main and renderer processes.
- Ad-hoc implementations of features that should leverage existing abstractions or patterns.
- Uneven application of state management practices in different parts of the renderer layer.
- Discrepancies in logging formats or levels used in different services or components.
- Direct cross-layer calls that bypass established interfaces or contracts.
- Lack of uniformity in async handling patterns (e.g., callbacks vs. promises vs. async/await) across similar operations.
- Inconsistent structuring of files and directories that do not align with the defined architecture.
- Varied approaches to input validation and sanitization in different layers or modules.
- Different strategies for managing side effects in state stores or services.
- Inconsistent documentation styles or levels of detail in code comments and external docs.
- Special-case code paths that deviate from standard processing flows without clear justification.
- Divergent implementations of similar features that lead to confusion or redundancy.
- Inconsistent use of TypeScript types and interfaces across modules that should share definitions.
- Varied approaches to configuration management and environment variable usage across layers.
- Different testing strategies or coverage levels for similar functionalities in different parts of the codebase.
- Inconsistent handling of user preferences or settings across the application.
- Varied approaches to internationalization and localization in UI components versus backend services.
- Discrepancies in performance optimization techniques applied in different layers or modules.
- Inconsistent use of third-party libraries or frameworks across different parts of the codebase.
- Divergent strategies for caching and data persistence in services versus UI components.
- Inconsistent approaches to security practices, such as data encryption or access control, across layers.
- Varied methods for logging and monitoring application health across different services and components.
- Different patterns for managing dependencies and imports across modules.
- Inconsistent use of design patterns (e.g., Singleton, Factory) in service implementations.
- Varied approaches to handling user authentication and authorization across layers.
- Inconsistent strategies for managing application state across different parts of the renderer layer.
- Divergent implementations of event handling and propagation in different modules.
- Inconsistent use of build and deployment scripts across different parts of the project.

## Final Note and Summary

The goal is to achieve a consistent, maintainable codebase that adheres to the established FitFileViewer Electron + renderer architecture. Address all inconsistencies methodically, prioritize impactful changes, and ensure thorough testing and documentation throughout the process. Consistency means fewer bugs and easier maintenance in the long run. Add all identified inconsistencies to a detailed todo list with descriptions and work through the entire list.
