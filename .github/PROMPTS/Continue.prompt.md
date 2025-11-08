---
agent: "BeastMode"
model: GPT-5-Codex (Preview) (copilot)
tools: ['edit/createFile', 'edit/createDirectory', 'edit/editFiles', 'search/fileSearch', 'search/textSearch', 'search/listDirectory', 'search/readFile', 'search/codebase', 'runCommands/getTerminalOutput', 'runCommands/terminalLastCommand', 'runCommands/runInTerminal', 'runTasks/runTask', 'runTasks/getTaskOutput', 'electron-mcp-server/get_electron_window_info', 'electron-mcp-server/send_command_to_electron', 'electron-mcp-server/take_screenshot', 'Tavily-Remote-MCP/tavily_extract', 'Tavily-Remote-MCP/tavily_search', 'vscode-mcp/get_diagnostics', 'vscode-mcp/get_references', 'vscode-mcp/get_symbol_lsp_info', 'vscode-mcp/rename_symbol', 'runSubagent', 'usages', 'problems', 'changes', 'testFailure', 'fetch', 'ms-vscode.vscode-websearchforcopilot/websearch', 'todos', 'runTests']
argument-hint: "Continue working through the existing TODO list, resuming from where you left off."
description: "Continue Addressing TODO List Items"
---

- This is a generic continuation prompt to pick up where you left off in the TODO list, you might have to adapt based on the current state of the TODO list. The file is located at the repository root as TODO.md.
- Start by reviewing the TODO.md file at the repository root to identify the current state of all pending tasks.
- Update current if any completed tasks have not yet been marked as done.
- Locate the next incomplete TODO item (those not marked as done or resolved).
- If you have any questions or need clarification on any TODO items, document them clearly for further review or stop and ask for assistance.
- For each incomplete TODO item, proceed systematically:

  - Review the context, problem description, and any relevant files mentioned.
  - Assess the current state and any blockers or dependencies.
  - Implement necessary changes, fixes, or features using available tools.
  - Test and validate the changes to ensure they resolve the issue without introducing new problems.
  - Mark the TODO item as complete with a clear summary of what was accomplished.
  - If new issues arise, document them and add follow-up TODOs as required.

- Continue iterating through the list, working on the next incomplete item after each one is resolved.
- Maintain clear documentation and update the TODO.md file throughout the process.
- Stop when you encounter a TODO item that requires external input, clarification, or cannot proceed due to blockers.
- If all TODO items are completed, ensure the TODO.md file reflects this status clearly.
- Review your work thoroughly to ensure all tasks are completed correctly and the codebase remains stable.
- After finishing the TODO list, take your time to review your work rigorously, especially any changes you made. Your solution must be perfect. If not, continue working on it.
- Always run linters, tests, and type checks after making changes to ensure everything is functioning correctly.
