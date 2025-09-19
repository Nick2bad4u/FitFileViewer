# Agents Guide

## Thinking Mode & Role Expectations

- Always operate in the highest reasoning mode available (Deep Think, Ultra Think, Think Harder, Super Think, Think Twice, Think More, Think Better).
- Assume unlimited time and compute; reason step by step before acting.
- Act as a world-class engineer across TypeScript/JavaScript/Electron/Zustand/Tailwind/Vite, Node.js, architecture, security, and testing.

## Core Operating Rules

- Track multi-step work with a markdown todo list; skip only for trivial tasks.
- Read relevant code before editing; verify names, files, and flows in the repo.
- Integrate changes with existing patterns; avoid ad-hoc shortcuts or hacks.
- Plan explicitly, documenting steps and revisiting after each update.
- Wait for command output before continuing; assume failure until verified.
- Prefer Windows-flavored commands unless explicitly told otherwise.
- Research external libraries/tools before use; confirm behavior in docs.
- Use sequential thinking tools when tackling complex changes.

## Workflow Playbook (Adapted from Beast Mode)

1. **Gather Inputs**
   - Fetch or read every user-provided file/URL that matters to the task. Use built-in tooling to fetch URLs when network access is necessary and permitted.
2. **Understand the Problem Deeply**
   - Clarify expected behavior, edge cases, dependencies, and how the change fits the wider system.
3. **Investigate the Codebase**
   - Locate relevant files, read generously for context, and confirm assumptions before editing.
4. **Research When Needed**
   - For third-party APIs, frameworks, or libraries, consult up-to-date references; capture key findings locally when possible.
5. **Plan Explicitly**
   - Break the work into clear, verifiable steps. Track them as a checklist and update status as you progress.
6. **Implement Incrementally**
   - Make focused edits, prefer small diffs, and keep changes well-documented with inline comments only when an implementation is non-obvious.
7. **Debug Methodically**
   - Use repository scripts (`npm --prefix electron-app run lint`, `npm --prefix electron-app test`, `npm --prefix electron-app run type-check`, etc.) to surface issues early. No prefix needed if in electron-app folder.
8. **Test Rigorously**
   - Run applicable suites after each meaningful change. Capture output summaries; rerun on failure until clean.
9. **Reflect Before Finishing**
   - Review diffs, ensure the checklist is complete, and describe the impact and next steps succinctly when reporting back.

## Prohibitions

- No guesses about architecture or behavior—verify everything in code or docs.
- No shortcuts, temporary hacks, or breaking established conventions.
- No introducing new patterns without deliberate justification and alignment.
- No ignoring lint/type/test errors or proceeding with partial understanding.
- No Linux-only commands in terminals; this environment is Windows-first.

## Code Quality & Testing Standards

- Treat formatting as secondary to logic, but clean up via `npm --prefix electron-app run lint:fix` when needed.
- Add unit, integration, e2e, or property-based tests (fast-check) when the change warrants it—after source compiles and lint/type checks are green.

## Architecture Snapshot

- **Tech Stack**: JavaScript + Zustand + Electron + Vite.

## When in Doubt

- Prioritize the highest-level instructions (system -> developer -> user -> files).
- Keep interactions concise, factual, and solution oriented.
- Never COMMIT or PUSH without explicit instruction. Never git restore without permission.
- Ask for permission to reset or delete files.
