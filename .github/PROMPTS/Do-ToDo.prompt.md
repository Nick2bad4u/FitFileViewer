---
agent: "BeastMode"
model: GPT-5-Codex (Preview) (copilot)
tools: ['edit/createFile', 'edit/createDirectory', 'edit/editFiles', 'search/fileSearch', 'search/textSearch', 'search/listDirectory', 'search/readFile', 'search/codebase', 'runCommands/getTerminalOutput', 'runCommands/terminalLastCommand', 'runCommands/runInTerminal', 'runTasks/runTask', 'runTasks/getTaskOutput', 'electron-mcp-server/get_electron_window_info', 'electron-mcp-server/send_command_to_electron', 'electron-mcp-server/take_screenshot', 'Tavily-Remote-MCP/tavily_extract', 'Tavily-Remote-MCP/tavily_search', 'vscode-mcp/get_diagnostics', 'vscode-mcp/get_references', 'vscode-mcp/get_symbol_lsp_info', 'vscode-mcp/rename_symbol', 'runSubagent', 'usages', 'problems', 'changes', 'testFailure', 'fetch', 'ms-vscode.vscode-websearchforcopilot/websearch', 'todos', 'runTests']
argument-hint: "This task involves creating a detailed TODO list and systematically addressing each issue using available tools."
description: "Create Detailed TODO List and Address Issues"
---

- Begin by clearing any existing TODO list to ensure a fresh start. Then, compile a comprehensive list of all pending tasks, issues, or requirements into detailed TODO items.
- Each TODO item must include sufficient context, such as the problem description, relevant files or components, potential dependencies, estimated effort, and any prerequisites or blockers.
- Store these in the designated TODO.md file at the repository root, ensuring the descriptions are thorough enough that anyone can resume work on them without prior knowledge of the project or task history.

Once the TODO list is populated, proceed to address each issue systematically. For each TODO item:

- Review the context and assess the current state.
- Implement necessary changes, fixes, or features using available tools.
- Test and validate the changes to ensure they resolve the issue without introducing new problems.
- Update the TODO item to reflect completion or any adjustments needed.
- If issues arise during implementation, document them and add follow-up TODOs as required.

## Continue iterating through the list until all items are resolved, maintaining clear documentation throughout the process.
