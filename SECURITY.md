# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability, please report it by emailing [20943337+Nick2bad4u@users.noreply.github.com](mailto:20943337+Nick2bad4u@users.noreply.github.com) or by opening a [private issue on GitHub](https://github.com/Nick2bad4u/FitFileViewer/issues/new). Do **not** disclose security issues publicly until they have been reviewed and patched.

- Please include as much detail as possible to help us reproduce and address the issue quickly.
- We aim to respond to security reports within 7 days.

## Security Best Practices

- Always use the latest version of FitFileViewer.
- Keep all dependencies up to date. The current major dependencies and their versions are:

| Dependency       | Version   |
| ---------------- | --------- |
| electron         | 36.2.0    |
| electron-builder | ^26.0.15  |
| electron-store   | ^10.0.1   |
| electron-updater | ^6.6.4    |
| @garmin/fitsdk   | ^21.171.0 |
| eslint           | ^9.26.0   |
| jest             | ^29.7.0   |
| vitest           | ^3.1.3    |

- Do not open files from untrusted sources.
- If you use a custom build, ensure your dependencies are up to date.

## Acknowledgements

We appreciate responsible disclosure of security issues and will credit reporters in our release notes if desired.
