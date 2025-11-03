---
agent: "BeastMode"
model: GPT-5-Codex (Preview) (copilot)
tools: ['edit/createFile', 'edit/createDirectory', 'edit/editFiles', 'search/fileSearch', 'search/textSearch', 'search/listDirectory', 'search/readFile', 'search/codebase', 'runCommands/getTerminalOutput', 'runCommands/terminalLastCommand', 'runCommands/runInTerminal', 'runTasks/runTask', 'runTasks/getTaskOutput', 'electron-mcp-server/get_electron_window_info', 'electron-mcp-server/send_command_to_electron', 'electron-mcp-server/take_screenshot', 'Tavily-Remote-MCP/tavily_extract', 'Tavily-Remote-MCP/tavily_search', 'vscode-mcp/get_diagnostics', 'vscode-mcp/get_references', 'vscode-mcp/get_symbol_lsp_info', 'vscode-mcp/rename_symbol', 'runSubagent', 'usages', 'problems', 'changes', 'testFailure', 'fetch', 'ms-vscode.vscode-websearchforcopilot/websearch', 'todos', 'runTests']
argument-hint: "This task involves reviewing the entire TODO list for completion, finishing any unfinished items, ensuring all linters, tests, and typechecks pass, and conducting a final review of all work."
description: "Review TODO List Completion, Run Quality Checks, and Review Work"
---

- Begin by reviewing the entire TODO list in the designated TODO.md file at the repository root. Assess each item for completion status, implementation details, and any outstanding issues.
- For any unfinished or partially completed TODO items, implement the necessary changes, fixes, or features using available tools. Ensure thorough testing and validation to resolve issues without introducing new problems. Update the TODO list to reflect progress or completion.
- Once all TODO items are confirmed complete, run comprehensive quality checks: execute linters (e.g., via `lint:all` or `lint:fix` tasks), run the full test suite (e.g., via `Test`, `Test:Coverage`, and `Test:Playwright` tasks), and perform type-checking (e.g., via `Type-check:all` task). Capture and summarize outputs, fixing any failures before proceeding.
- Conduct a final review of all work: verify adherence to project architecture (e.g., Electron IPC, etc) code quality standards (e.g., TSDoc comments, type safety, testing with Vitest), and best practices. Document any findings, update TODOs if needed, and ensure no stale items remain.
- Iterate as necessary until all reviews and checks are fully satisfied, maintaining clear documentation throughout the process.
- Be on the lookout for any potential improvements or optimizations that can be made to the codebase, including:
  - Refactoring code for improved readability and maintainability.
  - Identifying and addressing performance bottlenecks.
  - Enhancing test coverage and reliability.
  - Streamlining development workflows and tooling.
