---
name: "FixEslintErrors"
agent: "BeastMode"
description: "Fix All ESLint Errors and Warnings"
argument-hint: "Fix All ESLint Errors and Warnings"
---

# Review All ESLint Errors and Warnings

Run the command "npm run lint" to check for current ESLint errors and warnings.
You can try to auto fix some issues with "npm run lint:fix", but be prepared to manually resolve any remaining issues.
Ensure that all ESLint rules are satisfied and that there are no errors or warnings in the console output.
Carefully review all reported issues in the console output.
Systematically fix every ESLint error and warning in the codebase.
Re-run "npm run lint" after each set of changes to ensure that all issues are resolved and that no new errors or warnings are introduced.
Do not ignore or suppress any ESLint rules unless explicitly instructed.
If you encounter a rule that cannot be reasonably satisfied, document the reason in a separate file and propose a solution or configuration change for future review.

# Special Instructions

- Focus on resolving the root cause of each lint error or warning.
- If a rule is too strict or causes legitimate development friction, document the case and suggest a configuration update, but do not disable the rule without approval.
- If you discover a legitimate bug or code smell while fixing lint errors, document it in a separate file and make the appropriate changes to the codebase to fix it. You must be 100% sure that the bug is legitimate and not a false positive.
- If you encounter code that is difficult to lint due to architectural or legacy reasons, document the challenges and suggest improvements for future refactoring.
- !!!!!!! You must not stop until all ESLint errors and warnings are resolved or documented with a clear plan for resolution!!!!!!!
- Do not skip any files, even if they are small or seem trivial.

Requirements:

- Zero ESLint errors or warnings in the codebase after completion.
- All code changes must maintain or improve code quality and readability.
- Do not introduce hacks or workarounds to bypass linting rules.
- DO NOT USE SCRIPTS. DO ALL YOUR WORK MANUALLY:
- I REPEAT, ONLY NON-SCRIPT WORK IS ALLOWED. (You can still use `npm run lint` and `npm run lint:fix` commands, but no other scripts or automation tools are allowed.)

If Attachments are present:

- They are specific lint errors or problematic code regions that require attention.
