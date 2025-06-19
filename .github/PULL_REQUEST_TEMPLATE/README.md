# Pull Request Templates

This directory contains multiple pull request templates for different types of
contributions to the FitFileViewer project. When creating a pull request,
GitHub will allow you to choose from these templates to ensure you provide the
appropriate information.

## Available Templates

### 1. **General Pull Request** (`pull_request_template.md`)

- **Default template** for all pull requests
- Use when none of the specific templates fit your changes
- Comprehensive template covering most common scenarios

### 2. **Feature Request** (`feature.md`)

- For new features and enhancements
- Includes sections for implementation details, testing, and performance impact
- Use for: New functionality, UI improvements, visualization enhancements

### 3. **Bug Fix** (`bugfix.md`)

- For fixing bugs and issues
- Includes root cause analysis and risk assessment
- Use for: Fixing crashes, incorrect behavior, data processing issues

### 4. **Documentation** (`documentation.md`)

- For documentation-only changes
- Covers README updates, code comments, user guides, etc.
- Use for: README updates, JSDoc improvements, user documentation

### 5. **Maintenance/Refactoring** (`maintenance.md`)

- For code maintenance and refactoring
- Includes dependency updates, performance optimizations, code cleanup
- Use for: Dependency updates, code restructuring, performance improvements

### 6. **Quick Fix** (`quick-fix.md`)

- For simple, low-risk changes
- Minimal template for typos, small UI fixes, minor improvements
- Use for: Typo fixes, small configuration changes, minor style updates

## How to Use

1. **When creating a PR**, GitHub will show a dropdown to select a template
2. **Choose the most appropriate template** for your type of change
3. **Fill out all relevant sections** - remove sections that don't apply
4. **Be thorough** - the templates help ensure quality and easier review

## Template Guidelines

### For Contributors

- **Choose the right template** - this helps reviewers understand your changes
- **Fill out all applicable sections** - don't leave empty sections
- **Be specific** - provide clear descriptions and test steps
- **Include context** - link to related issues and provide background

### For Reviewers

- **Check template completeness** - ensure all relevant sections are filled
- **Verify testing coverage** - confirm appropriate testing was done
- **Review compatibility** - ensure cross-platform and theme compatibility
- **Assess risk** - pay attention to risk assessment sections

## Contributing to Templates

If you find these templates could be improved:

1. Open an issue describing the improvement
2. Submit a PR with template updates
3. Update this README if new templates are added

## Project-Specific Considerations

When using these templates, keep in mind FitFileViewer's specific requirements:

- **Cross-platform compatibility** (Windows, macOS, Linux)
- **Theme support** (light and dark themes)
- **FIT file format compatibility**
- **Performance with large files** (>100MB)
- **Electron security model** (sandboxing, IPC)
- **Modular architecture** (utils directory structure)

<!-- markdownlint-disable MD013 -->

For more information about the project architecture and coding standards, see the main [project documentation](../../README.md) and [coding guidelines](../instructions/copilot-instructions.md).
