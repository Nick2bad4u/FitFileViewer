---
name: Bug Fix
about: Fix a bug or issue
title: "[BUG FIX] "
labels: ["bug", "fix"]
---

## Bug Description

**What bug does this PR fix?**
A clear and concise description of what the bug was.

**Link to Issue:**
Fixes #(issue number)

## Root Cause Analysis

**What was causing the bug?**
Explain the underlying cause of the issue.

**Impact:**
Describe what functionality was affected:

- [ ] FIT file parsing
- [ ] Data visualization/charts
- [ ] Map rendering
- [ ] UI/Theme system
- [ ] Export functionality
- [ ] Performance
- [ ] Memory leaks
- [ ] Cross-platform compatibility

## Solution

**How did you fix it?**
Explain your approach to fixing the bug.

**Changes Made:**

- [ ] Logic fixes in core modules
- [ ] Error handling improvements
- [ ] UI/UX corrections
- [ ] Performance optimizations
- [ ] Memory leak fixes
- [ ] Validation improvements

**Files Modified:**

List the main files that were changed:

- `electron-app/`
- `utils/`
- Other files...

## Testing

**How has this been tested?**

- [ ] Reproduced the original bug
- [ ] Verified the fix resolves the issue
- [ ] Regression testing performed
- [ ] Edge cases tested
- [ ] Cross-platform testing (Windows/macOS/Linux)

**Test Steps:**

1. Steps to reproduce the original bug
2. Steps to verify the fix
3. Additional test scenarios

**Before/After:**
If applicable, describe the behavior before and after the fix.

## Screenshots/Evidence

If applicable, add screenshots showing the bug before and after the fix:

## Performance Impact

**Performance Considerations:**

- [ ] No performance regression
- [ ] Performance improved
- [ ] Memory usage optimized
- [ ] Startup time maintained/improved

## Compatibility

**Compatibility Verified:**

- [ ] Windows tested
- [ ] macOS tested
- [ ] Linux tested
- [ ] Both light and dark themes
- [ ] Various FIT file formats
- [ ] Large file handling (>100MB)

## Risk Assessment

**Risk Level:**

- [ ] Low risk (isolated fix)
- [ ] Medium risk (affects multiple components)
- [ ] High risk (core functionality changes)

**Mitigation:**
Describe any measures taken to minimize risk.

## Additional Context

Add any other context about the bug fix here.

## Checklist

- [ ] My code follows the project's coding standards
- [ ] I have performed a self-review of my code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings or errors
- [ ] I have added tests that prove my fix is effective
- [ ] New and existing unit tests pass locally with my changes
- [ ] I have verified the fix doesn't introduce new bugs
- [ ] Any dependent changes have been merged and published
