<!-- markdownlint-disable -->
<!-- eslint-disable markdown/no-missing-label-refs -->
# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]


[[a09e7e1](https://github.com/Nick2bad4u/FitFileViewer/commit/a09e7e1ba6cae2d8715497930ed78fe72fa3f12c)...
[6b6b42a](https://github.com/Nick2bad4u/FitFileViewer/commit/6b6b42a22645b0ae2bc91d8c5511da380e78c9ce)]
([compare](https://github.com/Nick2bad4u/FitFileViewer/compare/a09e7e1ba6cae2d8715497930ed78fe72fa3f12c...6b6b42a22645b0ae2bc91d8c5511da380e78c9ce))


### 🚀 Features

- Implement comprehensive state management system with advanced features [`(a09e7e1)`](https://github.com/Nick2bad4u/FitFileViewer/commit/a09e7e1ba6cae2d8715497930ed78fe72fa3f12c)



### 🛠️ GitHub Actions

- Update summary.yml [`(787668f)`](https://github.com/Nick2bad4u/FitFileViewer/commit/787668f979386290bcb0ac28ec0c35ed5d5cab54)


- Update prettier.yml [`(1b9945b)`](https://github.com/Nick2bad4u/FitFileViewer/commit/1b9945b56f9fad21bc1b0201011a879e88b26c95)


- Update prettier.yml [`(956ffd4)`](https://github.com/Nick2bad4u/FitFileViewer/commit/956ffd408974b1bb3902811e5e64f73d3aea8d3f)


- Update prettier.yml [`(006464b)`](https://github.com/Nick2bad4u/FitFileViewer/commit/006464ba3a6fe274e89bfad3aa385dbee0ebba9b)


- Update prettier.yml [`(221bc12)`](https://github.com/Nick2bad4u/FitFileViewer/commit/221bc129ee2a6b0151ab700e4c812b90a5a56e7c)


- Update prettier.yml [`(6acc0a9)`](https://github.com/Nick2bad4u/FitFileViewer/commit/6acc0a94ed639939ac63cce1ea89269016bd9b64)



### ⚙️ Miscellaneous Tasks

- Format code with Prettier (#129) [`(b64b260)`](https://github.com/Nick2bad4u/FitFileViewer/commit/b64b260c00bee59c9a8528ef91ccbde6fee954fa)



### 🛡️ Security

- [StepSecurity] ci: Harden GitHub Actions (#130)

Signed-off-by: StepSecurity Bot <bot@stepsecurity.io> [`(6b6b42a)`](https://github.com/Nick2bad4u/FitFileViewer/commit/6b6b42a22645b0ae2bc91d8c5511da380e78c9ce)




## [24.2.0] - 2025-06-18


[[e8ed10d](https://github.com/Nick2bad4u/FitFileViewer/commit/e8ed10dfc6a36c9213c08a2fd1d8b791627b7c27)...
[e8ed10d](https://github.com/Nick2bad4u/FitFileViewer/commit/e8ed10dfc6a36c9213c08a2fd1d8b791627b7c27)]
([compare](https://github.com/Nick2bad4u/FitFileViewer/compare/e8ed10dfc6a36c9213c08a2fd1d8b791627b7c27...e8ed10dfc6a36c9213c08a2fd1d8b791627b7c27))


### 💼 Other

- Refactor heart rate and power zone color controls to use inline color selectors

- Replaced the existing openZoneColorPicker function with createInlineZoneColorSelector in both heart rate and power zone control files.
- Introduced a new utility for creating inline zone color selectors, allowing for a more compact and user-friendly interface for customizing zone colors.
- Updated the reset functionality in openZoneColorPicker to ensure all relevant zone fields are reset to custom color schemes.
- Enhanced the zone color utility functions to support additional color schemes, including pastel, dark, rainbow, ocean, earth, fire, forest, sunset, grayscale, neon, autumn, spring, cycling, and runner.
- Improved the persistence of zone colors in localStorage and ensured proper synchronization between chart-specific and generic zone color storage. [`(e8ed10d)`](https://github.com/Nick2bad4u/FitFileViewer/commit/e8ed10dfc6a36c9213c08a2fd1d8b791627b7c27)




## [24.1.0] - 2025-06-18


[[2128d98](https://github.com/Nick2bad4u/FitFileViewer/commit/2128d98c47634f38e04784341efb2ce36492a205)...
[39fb2f4](https://github.com/Nick2bad4u/FitFileViewer/commit/39fb2f4e23ccaf99173697a68eb2883aa00c04ca)]
([compare](https://github.com/Nick2bad4u/FitFileViewer/compare/2128d98c47634f38e04784341efb2ce36492a205...39fb2f4e23ccaf99173697a68eb2883aa00c04ca))


### 💼 Other

- Refactor code structure for improved readability and maintainability [`(39fb2f4)`](https://github.com/Nick2bad4u/FitFileViewer/commit/39fb2f4e23ccaf99173697a68eb2883aa00c04ca)


- Update setTimeout callbacks to use function expressions for consistency [`(19ba8e6)`](https://github.com/Nick2bad4u/FitFileViewer/commit/19ba8e60f80467e8b8531eaad257c5d95f875ad4)


- Updates issue comment step to use correct response variable

Ensures the workflow uses the intended environment variable for the comment body,
potentially resolving issues with incorrect or missing comment content on GitHub issues. [`(2b0861a)`](https://github.com/Nick2bad4u/FitFileViewer/commit/2b0861a292fe114b5c84ff8ce0e061ddc5c04b79)


- Refactor and improve code readability across multiple utility files

- Updated various functions in `patchSummaryFields.js` to enhance readability by formatting conditional statements.
- Improved the structure of `renderAltitudeProfileChart.js`, `renderChartJS.js`, `renderGPSTrackChart.js`, `renderPowerVsHeartRateChart.js`, and `renderSpeedVsDistanceChart.js` for better clarity.
- Enhanced logging messages in `renderChartsWithData` and `shouldShowRenderNotification` for improved debugging.
- Cleaned up import statements in `renderMap.js` and `setupWindow.js` for consistency.
- Removed sensitive data from `gitleaks-report.json` and added configuration files for various tools including Checkov, Markdown Link Check, and Lychee.
- Updated `setupZoneData.js` to improve the extraction of heart rate zones.
- General code formatting and style improvements across multiple files to adhere to best practices. [`(2128d98)`](https://github.com/Nick2bad4u/FitFileViewer/commit/2128d98c47634f38e04784341efb2ce36492a205)



### 📦 Dependencies

- Merge pull request #124 from Nick2bad4u/dependabot/github_actions/github-actions-c18845ae7f

[ci](deps): [dependency] Update dependency group [`(fc8dd01)`](https://github.com/Nick2bad4u/FitFileViewer/commit/fc8dd015068176f1e372a2afc800530aaabd2ead)


- *(deps)* [dependency] Update dependency group [`(848edf4)`](https://github.com/Nick2bad4u/FitFileViewer/commit/848edf44b552bbde528073f02fa864b5f13b8653)


- Update dependabot.yml [`(1d0a556)`](https://github.com/Nick2bad4u/FitFileViewer/commit/1d0a55673eece43fa2afe4018fba4b486a9b2f73)




## [23.1.0] - 2025-06-16


[[3ca4928](https://github.com/Nick2bad4u/FitFileViewer/commit/3ca4928d6e1fdc26311ccc43192777d0486c59d7)...
[7ffb095](https://github.com/Nick2bad4u/FitFileViewer/commit/7ffb095d12f23e64e8ddd674d6fae21666535496)]
([compare](https://github.com/Nick2bad4u/FitFileViewer/compare/3ca4928d6e1fdc26311ccc43192777d0486c59d7...7ffb095d12f23e64e8ddd674d6fae21666535496))


### 🔀 Merge Commits

- [chore] Merge Branch 'main' of https://github.com/nick2bad4u/FitFileViewer [`(7ffb095)`](https://github.com/Nick2bad4u/FitFileViewer/commit/7ffb095d12f23e64e8ddd674d6fae21666535496)



### 💼 Other

- Megalinter FIX [`(3ca4928)`](https://github.com/Nick2bad4u/FitFileViewer/commit/3ca4928d6e1fdc26311ccc43192777d0486c59d7)



### 📦 Dependencies

- Merge pull request #122 from Nick2bad4u/dependabot/github_actions/github-actions-bf04c3e706

[ci](deps): [dependency] Update dependency group [`(147b94b)`](https://github.com/Nick2bad4u/FitFileViewer/commit/147b94be7fde9d2d1bb0c33d21e28a4cfbff7f9c)


- *(deps)* [dependency] Update dependency group [`(6dba014)`](https://github.com/Nick2bad4u/FitFileViewer/commit/6dba0142500a7d6915b704a349883bca5a1f5dd6)




## [22.9.0] - 2025-06-15


[[07cc911](https://github.com/Nick2bad4u/FitFileViewer/commit/07cc9114d60a6c335a36ee937f1c4f8944337813)...
[0931bbd](https://github.com/Nick2bad4u/FitFileViewer/commit/0931bbd36523cdc74818b12147c6434c6866ce4e)]
([compare](https://github.com/Nick2bad4u/FitFileViewer/compare/07cc9114d60a6c335a36ee937f1c4f8944337813...0931bbd36523cdc74818b12147c6434c6866ce4e))


### 🛠️ GitHub Actions

- Update prettier.yml [`(07cc911)`](https://github.com/Nick2bad4u/FitFileViewer/commit/07cc9114d60a6c335a36ee937f1c4f8944337813)



### 💼 Other

- Modularizes map actions and adds themed UI utilities

Refactors map action button logic into dedicated modules for better maintainability and separation of concerns. Introduces new utility classes and theme-aware helper functions to ensure consistent styling across interactive map controls. Adds robust error handling and notification feedback for overlay file operations. Enhances user experience by improving overlay loading, theming, and map centering logic, and updates workflow and linter configurations for improved CI/CD feedback. [`(0931bbd)`](https://github.com/Nick2bad4u/FitFileViewer/commit/0931bbd36523cdc74818b12147c6434c6866ce4e)



### 🛡️ Security

- Merge pull request #121 from step-security-bot/chore/GHA-141913-stepsecurity-remediation

[StepSecurity] ci: Harden GitHub Actions [`(e27f886)`](https://github.com/Nick2bad4u/FitFileViewer/commit/e27f886c860f8822c17d578aae319e0f4a389167)


- [StepSecurity] ci: Harden GitHub Actions

Signed-off-by: StepSecurity Bot <bot@stepsecurity.io> [`(c23f422)`](https://github.com/Nick2bad4u/FitFileViewer/commit/c23f422373f159ed64451bab3c9cfd2fc18d4281)




## [22.1.0] - 2025-06-14


[[25c3b5e](https://github.com/Nick2bad4u/FitFileViewer/commit/25c3b5e09fc01799a354e00c97ea827a48a5dfc8)...
[25c3b5e](https://github.com/Nick2bad4u/FitFileViewer/commit/25c3b5e09fc01799a354e00c97ea827a48a5dfc8)]
([compare](https://github.com/Nick2bad4u/FitFileViewer/compare/25c3b5e09fc01799a354e00c97ea827a48a5dfc8...25c3b5e09fc01799a354e00c97ea827a48a5dfc8))


### 💼 Other

- Standardizes YAML, JSON, and config formatting across repo

Improves consistency by normalizing quotes, indentation, and
key/value styles in all GitHub Actions workflows, project config,
and markdown files. Adds Prettier ignore rules, updates settings,
and syncs formatting to reduce lint noise and tooling friction.

Prepares for cleaner future diffs and better cross-platform collaboration. [`(25c3b5e)`](https://github.com/Nick2bad4u/FitFileViewer/commit/25c3b5e09fc01799a354e00c97ea827a48a5dfc8)




## [22.0.0] - 2025-06-14


[[4f78a54](https://github.com/Nick2bad4u/FitFileViewer/commit/4f78a54c1f5471a093fc2b7f8ae2e8b4c13e43a8)...
[21bf6c1](https://github.com/Nick2bad4u/FitFileViewer/commit/21bf6c1ec76885c59ff8d531cf5a5ac0a9ffb034)]
([compare](https://github.com/Nick2bad4u/FitFileViewer/compare/4f78a54c1f5471a093fc2b7f8ae2e8b4c13e43a8...21bf6c1ec76885c59ff8d531cf5a5ac0a9ffb034))


### 🚀 Features

- *(theme)* Enhance theme management with auto mode and smooth transitions [`(9411374)`](https://github.com/Nick2bad4u/FitFileViewer/commit/9411374418655f6be63e2d0c2c11b9e520d9541b)



### 🐛 Bug Fixes

- Update workflow configurations to ignore CHANGELOG.md and electron-app icons in various GitHub Actions [`(4f78a54)`](https://github.com/Nick2bad4u/FitFileViewer/commit/4f78a54c1f5471a093fc2b7f8ae2e8b4c13e43a8)



### 🛠️ GitHub Actions

- Update electronegativity.yml [`(ff1bbf9)`](https://github.com/Nick2bad4u/FitFileViewer/commit/ff1bbf93d2c440142d8a5d59967974399400aea0)


- Update devskim.yml [`(03d0be6)`](https://github.com/Nick2bad4u/FitFileViewer/commit/03d0be6212908869faad42c460e64576e6626961)


- Update spelling_action.yml [`(66abe1f)`](https://github.com/Nick2bad4u/FitFileViewer/commit/66abe1ff206d70eda294536c0af4ad0e1f417eaf)


- Update trufflehog.yml [`(70f0b9f)`](https://github.com/Nick2bad4u/FitFileViewer/commit/70f0b9f865bbd6fb76a408bab9e19099f871bae9)


- Update updateChangeLogs.yml [`(6ccd567)`](https://github.com/Nick2bad4u/FitFileViewer/commit/6ccd56769bde32d932a6f136a10f06ce4d379a25)


- Update updateChangeLogs.yml [`(3707625)`](https://github.com/Nick2bad4u/FitFileViewer/commit/3707625968fa5d59d1412f934c71b995fa8fc8cb)


- Update updateChangeLogs.yml [`(74a1c8d)`](https://github.com/Nick2bad4u/FitFileViewer/commit/74a1c8df826aaffd5e9fb0e764b0f735d30d48b0)


- Update updateChangeLogs.yml [`(eac41cb)`](https://github.com/Nick2bad4u/FitFileViewer/commit/eac41cbbff102cca5ba75c9efd9165cfbc328a96)


- Update updateChangeLogs.yml [`(56587b8)`](https://github.com/Nick2bad4u/FitFileViewer/commit/56587b83e04fa55f684d448b4913ef9c56218748)


- Update updateChangeLogs.yml [`(e65b73c)`](https://github.com/Nick2bad4u/FitFileViewer/commit/e65b73cd0da1d92ce0b964d99c85ba9eb07cdbf4)


- Update updateChangeLogs.yml [`(58eaaa0)`](https://github.com/Nick2bad4u/FitFileViewer/commit/58eaaa0ab283fca015c47eb68b64ffc9cacae8c0)


- Update updateChangeLogs.yml [`(2bc6c46)`](https://github.com/Nick2bad4u/FitFileViewer/commit/2bc6c467179949fadd3a3f31cf6d3dfabdbf1e80)


- Update summary.yml [`(57a2619)`](https://github.com/Nick2bad4u/FitFileViewer/commit/57a2619d3a661044566886fffd644329f5a9bb3c)


- Update mega-linter.yml [`(52f2a54)`](https://github.com/Nick2bad4u/FitFileViewer/commit/52f2a543c01073606f30c194dc59fe6c4dae1a38)



### 💼 Other

- Run Prettier on all Files. [`(21bf6c1)`](https://github.com/Nick2bad4u/FitFileViewer/commit/21bf6c1ec76885c59ff8d531cf5a5ac0a9ffb034)


- Revamps Chart.js integration with advanced controls and exports

Overhauls the chart rendering system to add a modern, toggleable controls panel, advanced export and sharing options (PNG, CSV, JSON, ZIP, clipboard, Imgur), and improved accessibility and error handling. Introduces support for zone data visualization, lap analysis charts, and professional styling with theme-aware design. Optimizes performance, code structure, and user feedback for a richer FIT file data experience.

Fixes chart layout, enhances maintainability, and prepares for future extensibility. [`(f852b00)`](https://github.com/Nick2bad4u/FitFileViewer/commit/f852b00b5b566dd1b1126cf0dfa108b96a425a46)


- Update pull_request_template.md [`(a4b1473)`](https://github.com/Nick2bad4u/FitFileViewer/commit/a4b14731fd2585c8a2037e99f0b8bad65a6fef0e)



### 📦 Dependencies

- Update dependabot.yml [`(3d61c16)`](https://github.com/Nick2bad4u/FitFileViewer/commit/3d61c1656f182cac8a69bbf2656fc34f7fe2a3ad)


- Update dependabot.yml [`(afdd98d)`](https://github.com/Nick2bad4u/FitFileViewer/commit/afdd98d49655be34ee105e7fb31fb9166c877129)


- Merge pull request #111 from Nick2bad4u/dependabot/github_actions/github-actions-4d40514eb5

[ci](deps): [dependency] Update dependency group [`(57df393)`](https://github.com/Nick2bad4u/FitFileViewer/commit/57df393327e7cbec612dd1d5e3f2be72fb01c49a)


- *(deps)* [dependency] Update dependency group [`(4c436bb)`](https://github.com/Nick2bad4u/FitFileViewer/commit/4c436bbf3be1b9f641810f3f849d1b52b8a2b51b)




## [21.0.0] - 2025-06-10


[[aaa2351](https://github.com/Nick2bad4u/FitFileViewer/commit/aaa23517d155a3c46e218137a7c42c4fe8a09c37)...
[743ca38](https://github.com/Nick2bad4u/FitFileViewer/commit/743ca3876dc493d686bf8ebd1e60f14be6e06a12)]
([compare](https://github.com/Nick2bad4u/FitFileViewer/compare/aaa23517d155a3c46e218137a7c42c4fe8a09c37...743ca3876dc493d686bf8ebd1e60f14be6e06a12))


### 🚀 Features

- Enhance changelog update workflow with check run integration [`(832287c)`](https://github.com/Nick2bad4u/FitFileViewer/commit/832287c170e6ea7395c0e2e3c4269365c09b9aef)


- Update GitHub workflows for improved functionality and scheduling [`(901941b)`](https://github.com/Nick2bad4u/FitFileViewer/commit/901941b4886b15b63fe2233f897acc54318dc2fd)



### 🐛 Bug Fixes

- Update changelog generation workflow to commit changes directly and enhance clean releases configuration [`(743ca38)`](https://github.com/Nick2bad4u/FitFileViewer/commit/743ca3876dc493d686bf8ebd1e60f14be6e06a12)


- Refactor release filtering logic to group by major version and improve debug output [`(0198d9c)`](https://github.com/Nick2bad4u/FitFileViewer/commit/0198d9ceee626b8ab0497f64d73fd69c61fe8078)


- Add initialization step for Build Matrix Summary Table and specify shell for update step [`(bcf8692)`](https://github.com/Nick2bad4u/FitFileViewer/commit/bcf86925c812732cfb8fca69321370e8d34f9f92)


- Improve tag deletion logic and enhance debugging output in cleanReleases workflow [`(f2149ca)`](https://github.com/Nick2bad4u/FitFileViewer/commit/f2149ca2e577459202a854fc2a43d82bed0e2bc5)


- Update git user configuration for cleanReleases workflow [`(c236b8b)`](https://github.com/Nick2bad4u/FitFileViewer/commit/c236b8b1d2b93eab236cd0aafef4aad2c9beec5c)


- Ensure orphan tag deletion does not fail the workflow [`(2010d9c)`](https://github.com/Nick2bad4u/FitFileViewer/commit/2010d9cefdbc63f6e46093ab61ae6c80e6d0ebc1)


- Enhance error handling for orphan tag deletion in cleanReleases workflow [`(9fe58e2)`](https://github.com/Nick2bad4u/FitFileViewer/commit/9fe58e2fcfcd777458a4a131ddc4954fa10f623e)


- Improve error handling for release and tag deletion in cleanReleases workflow [`(05d9621)`](https://github.com/Nick2bad4u/FitFileViewer/commit/05d962112439fce12c2bd89e200faf3c91985980)


- Refactor Check Run update commands for improved readability and efficiency [`(a12b365)`](https://github.com/Nick2bad4u/FitFileViewer/commit/a12b3651a438878dcfef6c472ac26aa99f425bf7)


- Update Build and Update ChangeLogs workflows to refine paths and remove unnecessary status checks [`(dee34b5)`](https://github.com/Nick2bad4u/FitFileViewer/commit/dee34b5ee19cbdb85aae0a299d02f58fa50db00b)



### 🔀 Merge Commits

- [chore] Merge Branch 'main' of https://github.com/Nick2bad4u/FitFileViewer [`(2f6f371)`](https://github.com/Nick2bad4u/FitFileViewer/commit/2f6f37124af395d4d46fd24d0cdeccf16a27269d)


- [chore] Merge Branch 'main' of https://github.com/Nick2bad4u/FitFileViewer [`(640e8c9)`](https://github.com/Nick2bad4u/FitFileViewer/commit/640e8c92d29454bb9d0fc19794699961a6243598)



### 🛠️ GitHub Actions

- Update Build.yml [`(dae64aa)`](https://github.com/Nick2bad4u/FitFileViewer/commit/dae64aa4ef0f6887b9bfee1810a5129b0db0cdb6)


- Update cleanReleases.yml [`(9fe7bd4)`](https://github.com/Nick2bad4u/FitFileViewer/commit/9fe7bd4e0b41fda338dcd5b53c2b78bc46c7b3aa)


- Update flatpak-build.yml [`(dcecae4)`](https://github.com/Nick2bad4u/FitFileViewer/commit/dcecae4cfec9ba4ed924c86cd33a798497f8ab8f)


- Update upload-macos-ia.yml [`(a2fa17b)`](https://github.com/Nick2bad4u/FitFileViewer/commit/a2fa17b9e1570d3f3bfae8e4d53624ec214856fc)


- Update Build.yml [`(cb94d54)`](https://github.com/Nick2bad4u/FitFileViewer/commit/cb94d54f17a2adbda8f8f38285d6912f9b974ea6)



### 💼 Other

- Clarifies workflow name to specify local builds

Updates the workflow name for improved clarity,
indicating it handles both local builds and releases for the Electron app.
Helps distinguish this workflow from others in environments with multiple pipelines. [`(5ad9323)`](https://github.com/Nick2bad4u/FitFileViewer/commit/5ad9323b4bd0ed0fe0df2ce49f7d14f731f6206b)


- Update workflow name to include '(My Runners)' for clarity [`(4a77b8b)`](https://github.com/Nick2bad4u/FitFileViewer/commit/4a77b8b362a4dea9ec1ddedd7d61d36d2aa7d364)


- Adds multi-platform CI workflow to build and release Electron app

Introduces a robust GitHub Actions workflow to automate version bumping, building, artifact management, and release publishing for the Electron app across Windows, macOS, and Linux. Handles platform-specific dependencies, build matrix, release notes generation, artifact naming, hash validation, and asset organization to streamline cross-platform distribution and ensure release integrity. [`(f577a4e)`](https://github.com/Nick2bad4u/FitFileViewer/commit/f577a4e99d3a6f344fafd69a4b8b4243da25c06c)


- Updates repo metrics workflow to target repo-stats branch

Enables workflow runs and metrics generation on pushes and pull requests
to the repo-stats branch, ensuring the displayed repository metrics
reflect changes under active development.

Also updates the README to reference the metrics output from the
repo-stats branch for accurate and current statistics. [`(870c2da)`](https://github.com/Nick2bad4u/FitFileViewer/commit/870c2da04b631ac26611007c31e62ed9e4988ee5)


- Refactor workflow_run syntax in release workflows for consistency [`(aaa2351)`](https://github.com/Nick2bad4u/FitFileViewer/commit/aaa23517d155a3c46e218137a7c42c4fe8a09c37)



### 📦 Dependencies

- Merge pull request #108 from Nick2bad4u/dependabot/github_actions/github-actions-2386549950

[dependency] Update dependency group [`(80f16a1)`](https://github.com/Nick2bad4u/FitFileViewer/commit/80f16a1a3cd9dac532334ab347ff8d6484a03420)


- [dependency] Update dependency group[dependency] Updates the github-actions group with 2 updates: [softprops/action-gh-release](https://github.com/softprops/action-gh-release) and [creyD/prettier_action](https://github.com/creyd/prettier_action).


Updates `softprops/action-gh-release` from 2.2.2 to 2.3.0
- [Release notes](https://github.com/softprops/action-gh-release/releases)
- [Changelog](https://github.com/softprops/action-gh-release/blob/master/CHANGELOG.md)
- [Commits](https://github.com/softprops/action-gh-release/compare/da05d552573ad5aba039eaac05058a918a7bf631...d5382d3e6f2fa7bd53cb749d33091853d4985daf)

Updates `creyD/prettier_action` from 4.5 to 4.6
- [Release notes](https://github.com/creyd/prettier_action/releases)
- [Commits](https://github.com/creyd/prettier_action/compare/5e54c689403b43aac746a34c07656fd4cb71d822...8c18391fdc98ed0d884c6345f03975edac71b8f0)

---
updated-dependencies:
- dependency-name: softprops/action-gh-release
  dependency-version: 2.3.0
  dependency-type: direct:production
  update-type: version-update:semver-minor
  dependency-group: github-actions
- dependency-name: creyD/prettier_action
  dependency-version: '4.6'
  dependency-type: direct:production
  update-type: version-update:semver-minor
  dependency-group: github-actions
...

Signed-off-by: dependabot[bot] <support@github.com> [`(1740d00)`](https://github.com/Nick2bad4u/FitFileViewer/commit/1740d0009d7fb60fcaa4066fcdc1e666df20b548)


- Update dependabot.yml [`(66e3042)`](https://github.com/Nick2bad4u/FitFileViewer/commit/66e3042c904f6e9e9a1b57e708becf639ebcb58e)


- Merge pull request #104 from Nick2bad4u/dependabot/github_actions/github-actions-27328bc44d

[dependency] Update dependency group [`(3b8f3cb)`](https://github.com/Nick2bad4u/FitFileViewer/commit/3b8f3cb6a83c764a150e09e013748a682027c36d)


- [dependency] Update dependency group[dependency] Updates the github-actions group with 2 updates: [peter-evans/create-pull-request](https://github.com/peter-evans/create-pull-request) and [trufflesecurity/trufflehog](https://github.com/trufflesecurity/trufflehog).


Updates `peter-evans/create-pull-request` from 6 to 7
- [Release notes](https://github.com/peter-evans/create-pull-request/releases)
- [Commits](https://github.com/peter-evans/create-pull-request/compare/v6...v7)

Updates `trufflesecurity/trufflehog` from 3.88.35 to 3.89.0
- [Release notes](https://github.com/trufflesecurity/trufflehog/releases)
- [Changelog](https://github.com/trufflesecurity/trufflehog/blob/main/.goreleaser.yml)
- [Commits](https://github.com/trufflesecurity/trufflehog/compare/90694bf9af66e7536abc5824e7a87246dbf933cb...3fbb9e94740526c7ed73d0c7151ebdf57d8e1618)

---
updated-dependencies:
- dependency-name: peter-evans/create-pull-request
  dependency-version: '7'
  dependency-type: direct:production
  update-type: version-update:semver-major
  dependency-group: github-actions
- dependency-name: trufflesecurity/trufflehog
  dependency-version: 3.89.0
  dependency-type: direct:production
  update-type: version-update:semver-minor
  dependency-group: github-actions
...

Signed-off-by: dependabot[bot] <support@github.com> [`(ddc549f)`](https://github.com/Nick2bad4u/FitFileViewer/commit/ddc549f40076ff458c9afd959bdcc2b4b3ce7466)



### 🛡️ Security

- Adds workflow job summaries and updates dependencies

Improves CI transparency by appending detailed job summaries to workflow run outputs for build, changelog, and release processes. Updates Prettier and GitHub release action to specific versions for consistency and reliability. Sets explicit permissions in macOS upload workflow to enhance security. [`(5b65bb9)`](https://github.com/Nick2bad4u/FitFileViewer/commit/5b65bb96c21ad9dc92b654c25d0a9d9748757e0d)


- Improves Linux menu logic and adds menu injection support

Refactors Linux menu handling to remove the minimal menu fallback and adds enhanced logging for improved troubleshooting. Introduces a DevTools-accessible function allowing manual injection or reset of the application menu from the renderer, making menu debugging and development more efficient. Streamlines theme synchronization and implements safeguards to prevent invalid menu setups, boosting stability and UI consistency across platforms.

Also bumps version to 20.5.0 and updates npm dependencies, including a major Jest upgrade and multiple minor and patch updates, enhancing overall security and reliability. [`(aae539e)`](https://github.com/Nick2bad4u/FitFileViewer/commit/aae539eeb94eef693613b973fcac471d1b78690b)


- Merge pull request #105 from step-security-bot/chore/GHA-092136-stepsecurity-remediation

[StepSecurity] ci: Harden GitHub Actions [`(d1b5a38)`](https://github.com/Nick2bad4u/FitFileViewer/commit/d1b5a3824fa399dad4d5643c0672d4056674e0ad)


- [StepSecurity] ci: Harden GitHub Actions

Signed-off-by: StepSecurity Bot <bot@stepsecurity.io> [`(2aee308)`](https://github.com/Nick2bad4u/FitFileViewer/commit/2aee3086f285ae627aa327aa4144e41820d41a32)




## [19.0.0] - 2025-06-07


[[f2ae023](https://github.com/Nick2bad4u/FitFileViewer/commit/f2ae023ee136e38843ea242981753f1bd5e61b73)...
[5debf80](https://github.com/Nick2bad4u/FitFileViewer/commit/5debf805345db114c8a0ff6749ae0be9c5818ee5)]
([compare](https://github.com/Nick2bad4u/FitFileViewer/compare/f2ae023ee136e38843ea242981753f1bd5e61b73...5debf805345db114c8a0ff6749ae0be9c5818ee5))


### 🔀 Merge Commits

- [chore] Merge Branch 'main' of https://github.com/Nick2bad4u/FitFileViewer [`(f2ae023)`](https://github.com/Nick2bad4u/FitFileViewer/commit/f2ae023ee136e38843ea242981753f1bd5e61b73)



### 💼 Other

- Enhance workflows and documentation for Flatpak build process, including versioning updates and new download options [`(5debf80)`](https://github.com/Nick2bad4u/FitFileViewer/commit/5debf805345db114c8a0ff6749ae0be9c5818ee5)


- Fix cache path in Flatpak build workflow to ensure correct node modules directory is used [`(324062e)`](https://github.com/Nick2bad4u/FitFileViewer/commit/324062e4d7e71d0363b70c8c2cff1b0bdfa71bdc)


- Enhance Flatpak build workflow by adding zip step for the Flatpak bundle and ensuring the dist repo is built and up-to-date before creating the bundle. [`(ddc8c19)`](https://github.com/Nick2bad4u/FitFileViewer/commit/ddc8c198e7ae02a8a1328745f7f4ab021661191a)


- Refactor cache path in Flatpak build workflow to remove redundant npm cache directory [`(1c20134)`](https://github.com/Nick2bad4u/FitFileViewer/commit/1c20134b348705a1af0e3b50df761c3948fcca50)


- Add download notes for Mac and Linux build formats in release section [`(707dffb)`](https://github.com/Nick2bad4u/FitFileViewer/commit/707dffb892878276f01eac4f85838ee373b7f246)


- Remove obsolete p5p build workflow and clean up Flatpak build step [`(7ad85db)`](https://github.com/Nick2bad4u/FitFileViewer/commit/7ad85dbc4a1e012a5d7f7e4059f30ff68da7202d)


- Fix package installation command in p5p build workflow [`(71fcb6c)`](https://github.com/Nick2bad4u/FitFileViewer/commit/71fcb6c70f47cb534b4e5037cdbe974a97af39bd)


- Improve caching for node modules and ensure dist repo is always built in Flatpak workflow [`(106c001)`](https://github.com/Nick2bad4u/FitFileViewer/commit/106c001c433bf6ff5138eca8ebb041532b41a657)


- Fix package installation step in p5p build workflow [`(408440f)`](https://github.com/Nick2bad4u/FitFileViewer/commit/408440fe3641ee32967281f18d65bccfbab0f5ad)


- Add check to create dist repo if it doesn't exist in Flatpak build step [`(4605895)`](https://github.com/Nick2bad4u/FitFileViewer/commit/46058950c18f8476157ae8a33420d52ea1980c12)


- Add pkg-utils installation step in p5p build workflow [`(75cbe00)`](https://github.com/Nick2bad4u/FitFileViewer/commit/75cbe00bf6277c58b0f8b2139c46c7ec6b26895e)


- Add GitHub Action workflow for building p5p Linux package using electron-builder [`(7897753)`](https://github.com/Nick2bad4u/FitFileViewer/commit/78977539d1a3fbbd2c229a007e6c1ee9ea6383ee)


- Add Flatpak bundle creation step and update upload path in workflow [`(269afdb)`](https://github.com/Nick2bad4u/FitFileViewer/commit/269afdb41c0817aff5e0a254179337d888f34de7)


- Reorganize caching step for node modules in Flatpak build workflow [`(627bf10)`](https://github.com/Nick2bad4u/FitFileViewer/commit/627bf10ebbd1e4a1c3ddd464f2d2b73163f57af0)


- Refactor Flatpak installation steps in GitHub Actions workflow for clarity and efficiency [`(86cc21e)`](https://github.com/Nick2bad4u/FitFileViewer/commit/86cc21e58222259a32995585fc8221936bb193f4)


- Improve Flatpak installation commands in GitHub Actions workflow [`(1663bcc)`](https://github.com/Nick2bad4u/FitFileViewer/commit/1663bcc668f4866ef9d4660a12dc0df074fc95be)


- Add Flatpak repository and installation steps to build process [`(dbea3f8)`](https://github.com/Nick2bad4u/FitFileViewer/commit/dbea3f839a97d922b6edc932d70f8974c59f971d)


- Add caching for node modules in GitHub Actions workflow [`(4895f98)`](https://github.com/Nick2bad4u/FitFileViewer/commit/4895f98438c2fded825737c2ea555df381c3e11f)


- Fix path to Flatpak manifest in build step of GitHub Actions workflow [`(5f12067)`](https://github.com/Nick2bad4u/FitFileViewer/commit/5f12067044e023921113eeaef7ed6d766950dbb5)


- Fix path to Flatpak manifest in build step of GitHub Actions workflow [`(da8f63f)`](https://github.com/Nick2bad4u/FitFileViewer/commit/da8f63fcfca9f0e4865d72c80eadf601cac7fd12)




## [18.4.0] - 2025-06-07


[[69d2206](https://github.com/Nick2bad4u/FitFileViewer/commit/69d2206e7f3e82fd5cdbf5cc4264a33110641543)...
[13eb50e](https://github.com/Nick2bad4u/FitFileViewer/commit/13eb50e1f0d67da2a731007cf26ee684e25a5f27)]
([compare](https://github.com/Nick2bad4u/FitFileViewer/compare/69d2206e7f3e82fd5cdbf5cc4264a33110641543...13eb50e1f0d67da2a731007cf26ee684e25a5f27))


### 🛠️ GitHub Actions

- Update Build.yml [`(13eb50e)`](https://github.com/Nick2bad4u/FitFileViewer/commit/13eb50e1f0d67da2a731007cf26ee684e25a5f27)


- Add update file sections for Windows and Mac to Build.yml [`(62862ac)`](https://github.com/Nick2bad4u/FitFileViewer/commit/62862aca1c0927ff1051543cf9802550035b5527)


- Remove outdated Windows and Mac update file sections from Build.yml [`(f73e212)`](https://github.com/Nick2bad4u/FitFileViewer/commit/f73e21224af1522824400419fb48c120cc58b85a)


- Update section headers in Build.yml for clarity [`(a873388)`](https://github.com/Nick2bad4u/FitFileViewer/commit/a873388b8447377fcd027e749e07a7547cba3d96)


- Add branch input to checkout step in Build.yml for flexibility [`(dfb79d6)`](https://github.com/Nick2bad4u/FitFileViewer/commit/dfb79d6f456cbb590ed8e9018834a0dff51e4fad)


- Add branch input to workflow_dispatch for Build.yml [`(66077d1)`](https://github.com/Nick2bad4u/FitFileViewer/commit/66077d1c0d5d37d8e7009f26b437b4810633afec)



### 💼 Other

- Add Flatpak build workflow and manifest for Electron app [`(c14189e)`](https://github.com/Nick2bad4u/FitFileViewer/commit/c14189e9d12d6c34e66df37a9c86127773b4546b)


- Sadd [`(9ae11e8)`](https://github.com/Nick2bad4u/FitFileViewer/commit/9ae11e8648786b5aeab6fcef75b8798c0e34c7c9)


- Fdsf [`(e303673)`](https://github.com/Nick2bad4u/FitFileViewer/commit/e3036733551280d867f59ba647ad3069482aa346)


- Df# Please enter the commit message for your changes. Lines starting [`(c21b389)`](https://github.com/Nick2bad4u/FitFileViewer/commit/c21b389b7ee7fb1c263933b1d005afa82eb784ac)


- Cancel in progres [`(1c31b25)`](https://github.com/Nick2bad4u/FitFileViewer/commit/1c31b25e78f52142dfebbf6eb99261bc4b26ef7f)


- Reformat [`(45ca4e4)`](https://github.com/Nick2bad4u/FitFileViewer/commit/45ca4e44f112820a4bd693801e0a0e75ca4ff9ff)


- Rename Squirrel win32 nupkg and RELEASES for release [`(b9715eb)`](https://github.com/Nick2bad4u/FitFileViewer/commit/b9715eb1fb5bcd73b406338b7678f06bb8337d43)


- Enhance GitHub Actions summary report with detailed totals for asset sizes and downloads [`(69d2206)`](https://github.com/Nick2bad4u/FitFileViewer/commit/69d2206e7f3e82fd5cdbf5cc4264a33110641543)



### 📚 Documentation

- Remove detailed auto-updater files section from Build.yml [`(93ad6a7)`](https://github.com/Nick2bad4u/FitFileViewer/commit/93ad6a7b094900c06ed5526ac6640ffa83a792ea)


- Add detailed auto-updater files section with download links for Windows and Mac [`(4b7a4bc)`](https://github.com/Nick2bad4u/FitFileViewer/commit/4b7a4bcd167283bfb9b8f56270cd70062baae561)


- Update section headers for auto-updater files in Build.yml [`(35c564b)`](https://github.com/Nick2bad4u/FitFileViewer/commit/35c564b0132bf65240f711e9a5356a1e3b7f219e)


- Add detailed auto-updater files section with download links for Windows and Mac [`(e2a2c0f)`](https://github.com/Nick2bad4u/FitFileViewer/commit/e2a2c0fa054b41f4ce12350a998bf137f0aa66d1)


- Remove auto-updater files section from Build.yml [`(7882ba7)`](https://github.com/Nick2bad4u/FitFileViewer/commit/7882ba7f69f948a6e92c3d5857b33d32b9e3088e)


- Update formatting for auto-updater files section in Build.yml [`(b0f4be1)`](https://github.com/Nick2bad4u/FitFileViewer/commit/b0f4be1dadf1ab9b6c4e489336c6d81e5fd24111)


- Enhance release notes with detailed merge commit information and changelog link [`(094e1eb)`](https://github.com/Nick2bad4u/FitFileViewer/commit/094e1ebb43f5bd210c7f8ee762c9d23068b5099b)


- Add auto-updater files section with download links for Windows and Mac [`(03831a3)`](https://github.com/Nick2bad4u/FitFileViewer/commit/03831a3cb549ff75b101aa763d912b659656071f)


- Fix formatting in download instructions for Windows and Mac in Build.yml [`(2c8c4f3)`](https://github.com/Nick2bad4u/FitFileViewer/commit/2c8c4f3c495698d78fdc18fb4f0fde3f0e7bbb83)


- Update download instructions for Windows, macOS, and Linux in Build.yml [`(dc6f0d6)`](https://github.com/Nick2bad4u/FitFileViewer/commit/dc6f0d6ee6bb4470659c708a306209b1905fcabb)


- Add download links and update release notes for FitFileViewer [`(b2bc621)`](https://github.com/Nick2bad4u/FitFileViewer/commit/b2bc621d7cd5070585fb0b395247324325db59b2)


- Add user guidance for downloading Mac and Linux versions in Build.yml [`(9b6a4c9)`](https://github.com/Nick2bad4u/FitFileViewer/commit/9b6a4c9649190f2806fe5f4f1020388cc078c378)



### ⚙️ Miscellaneous Tasks

- Remove outdated download links and update release notes formatting in Build.yml [`(655b504)`](https://github.com/Nick2bad4u/FitFileViewer/commit/655b5043351ea3daa2df0637226645b36d337005)


- Update changelogs and scripts for versioning and GitHub Actions enhancements [`(27471d3)`](https://github.com/Nick2bad4u/FitFileViewer/commit/27471d38f7b7749f7b57665551aeb8696b5fbcbe)




## [17.0.0] - 2025-06-05


[[9464e4f](https://github.com/Nick2bad4u/FitFileViewer/commit/9464e4f6549e705d773b29855bb8a3b292817929)...
[58249d4](https://github.com/Nick2bad4u/FitFileViewer/commit/58249d418315ca6224f2dc8b02d34647b5d36c8d)]
([compare](https://github.com/Nick2bad4u/FitFileViewer/compare/9464e4f6549e705d773b29855bb8a3b292817929...58249d418315ca6224f2dc8b02d34647b5d36c8d))


### 🚀 Features

- Add link to full changelog in release notes [`(303bde4)`](https://github.com/Nick2bad4u/FitFileViewer/commit/303bde43298fed31150096240d7d5a583925e95d)


- Enhance drag-and-drop functionality for Zwift iframe and improve tab management [`(f37ec72)`](https://github.com/Nick2bad4u/FitFileViewer/commit/f37ec72fb276c31e9a693a75ef7bdbb28d2055a8)


- Update workflows to download all release assets and improve chart rendering options [`(55838f7)`](https://github.com/Nick2bad4u/FitFileViewer/commit/55838f757ffcc227aef3bbe0b11a769575429e74)


- Add workflows to upload Linux, macOS, and Windows distributables to Archive.org [`(b6a782d)`](https://github.com/Nick2bad4u/FitFileViewer/commit/b6a782d400f222770acbe33c8c78fabe7619f24a)


- Integrate upload step to archive.org into Build workflow and remove UploadToIA workflow [`(2576d5d)`](https://github.com/Nick2bad4u/FitFileViewer/commit/2576d5dc9f7fa876ceca7bf4bb57bbfa50493e51)


- Remove upload step to archive.org from Build workflow and add new UploadToIA workflow for scheduled uploads [`(507f253)`](https://github.com/Nick2bad4u/FitFileViewer/commit/507f25326becbd7b390be5f81c01ec2a2988988d)


- Add support for uploading distributables to archive.org and enhance drag-and-drop functionality in the UI [`(05ff7fd)`](https://github.com/Nick2bad4u/FitFileViewer/commit/05ff7fd76a85cba8eb20700f1df336a48d428afc)



### 🐛 Bug Fixes

- Update CI workflow to support additional architectures for Ubuntu and Windows [`(991e66c)`](https://github.com/Nick2bad4u/FitFileViewer/commit/991e66c7130bfd8ff52aa6ae2ffb03d7a2adfbd3)


- Update artifact naming conventions for macOS and Linux builds to include architecture [`(5884a77)`](https://github.com/Nick2bad4u/FitFileViewer/commit/5884a77b8983edb22c86131a9199ee2917f13efc)


- Remove pull_request trigger and paths-ignore from Build.yml [`(2626cf2)`](https://github.com/Nick2bad4u/FitFileViewer/commit/2626cf27e6f3b3881ce2b6b0aa663edc27ae33ae)


- Update internet-archive-upload action to use the correct repository [`(78a101c)`](https://github.com/Nick2bad4u/FitFileViewer/commit/78a101c6988e135588835a44381b42c5f2694a4b)



### 🔀 Merge Commits

- [chore] Merge Branch 'main' of https://github.com/Nick2bad4u/FitFileViewer [`(4c5887a)`](https://github.com/Nick2bad4u/FitFileViewer/commit/4c5887a84e76c84381018a477fc7bd7d2af6849c)


- [chore] Merge Branch 'main' of https://github.com/Nick2bad4u/FitFileViewer [`(ca4c59b)`](https://github.com/Nick2bad4u/FitFileViewer/commit/ca4c59b68af77d7014a58e34e6398e9f5e77b4cc)



### 🛠️ GitHub Actions

- Update Build.yml [`(30254d0)`](https://github.com/Nick2bad4u/FitFileViewer/commit/30254d09e0677980f1c20743f87f32b94763074b)


- Update release-stats.yml [`(e42b143)`](https://github.com/Nick2bad4u/FitFileViewer/commit/e42b1437782005c0eea4553b431e551c73298428)


- Update release-stats.yml [`(b3a7a54)`](https://github.com/Nick2bad4u/FitFileViewer/commit/b3a7a54c39001cdbfcd92a9d9ea4dbcbb0fcbd0f)


- Update release-stats.yml [`(7c62afa)`](https://github.com/Nick2bad4u/FitFileViewer/commit/7c62afa7b17ad681430f45c589025a6723874745)


- Create release-stats.yml [`(24f6fed)`](https://github.com/Nick2bad4u/FitFileViewer/commit/24f6fedf5686c9578aa69c8b749f638b2487918d)


- Update Build.yml [`(180e8a6)`](https://github.com/Nick2bad4u/FitFileViewer/commit/180e8a6202b5a1b26caf83808632c3f92f44ce1a)


- Update Build.yml [`(87f1147)`](https://github.com/Nick2bad4u/FitFileViewer/commit/87f1147ba47067fea52145b35664f693d7f1fc1f)


- Update Build.yml [`(fc5585e)`](https://github.com/Nick2bad4u/FitFileViewer/commit/fc5585e266f91c877303095feaf477e7bc4a1f2d)


- Update Build.yml [`(6a151f1)`](https://github.com/Nick2bad4u/FitFileViewer/commit/6a151f140f10f307655f3d6eb5760b12d08b5a4b)


- Update Build.yml [`(9dbfb2a)`](https://github.com/Nick2bad4u/FitFileViewer/commit/9dbfb2a690b34d6a42b1d3e4c006cacc4e452dac)


- Update Build.yml [`(3d488e6)`](https://github.com/Nick2bad4u/FitFileViewer/commit/3d488e6662369cd3286ecacf9732140b311de74a)


- Update Build.yml [`(2f4622f)`](https://github.com/Nick2bad4u/FitFileViewer/commit/2f4622f3dcb9a423a27253d6d7382b79bbe64502)


- Update build configuration and versioning

- Remove branch restriction from push event in Build.yml
- Set DEBUG_DEMB environment variable to true in build job
- Add electron-builder configuration for macOS
- Downgrade package version to 14.2.0 in package-lock.json
- Remove trailing comma in stylelint configuration [`(81c7b9b)`](https://github.com/Nick2bad4u/FitFileViewer/commit/81c7b9b8ee749f6caeeb70c4d9a0ea88f3e727cd)


- Add step to rename nsis-web latest.yml to latest-squirrel.yml for Windows [`(9f32260)`](https://github.com/Nick2bad4u/FitFileViewer/commit/9f32260b17069c82e46ca8bd9e5c6ce7436c2ab4)


- Remove unnecessary continue-on-error flags from Build.yml steps [`(8b022ac)`](https://github.com/Nick2bad4u/FitFileViewer/commit/8b022ac06ac7262a17232f0c23abc77535dc977d)


- Update summary.yml [`(58ef64a)`](https://github.com/Nick2bad4u/FitFileViewer/commit/58ef64a05770229df34546e5400a76f010476eb9)


- Update summary.yml [`(84f4f10)`](https://github.com/Nick2bad4u/FitFileViewer/commit/84f4f10bc8fa8f0f75ea09b09d91961b2c61c6ae)


- Update codeql.yml [`(31f1aa3)`](https://github.com/Nick2bad4u/FitFileViewer/commit/31f1aa314deb722807697ead7f2ae1bccf3fc36d)


- Update npm-audit.yml [`(36f0aa0)`](https://github.com/Nick2bad4u/FitFileViewer/commit/36f0aa0551b293eecfeffffb54d1e2277601d12e)


- Update npm-audit.yml [`(bedb6dd)`](https://github.com/Nick2bad4u/FitFileViewer/commit/bedb6dd1a55bf5190086dce7812860701c684f23)


- Update npm-audit.yml [`(197c131)`](https://github.com/Nick2bad4u/FitFileViewer/commit/197c1311308ae18a8107f11305bc0dee6123db09)


- Update npm-audit.yml [`(8c70516)`](https://github.com/Nick2bad4u/FitFileViewer/commit/8c70516e3c7b00f8415431ddcd0f6dba8cb35bfd)


- Update upload-linux-ia.yml [`(a5064ac)`](https://github.com/Nick2bad4u/FitFileViewer/commit/a5064ac2d6d225dc1fbe6b970f213f9744e950e7)


- Update sitemap.yml [`(ce5d303)`](https://github.com/Nick2bad4u/FitFileViewer/commit/ce5d303b7fd40cf835c81fe9a5c29207bac805be)


- Update sitemap.yml to trigger workflow on push events only [`(991971e)`](https://github.com/Nick2bad4u/FitFileViewer/commit/991971e4045f8ad355881fa90b829afce954ff56)


- Update jekyll-gh-pages.yml [`(a07c92d)`](https://github.com/Nick2bad4u/FitFileViewer/commit/a07c92d7036a6509c4ff617cb1bbc76975ffde01)


- Update GitHub workflows to enhance build and linter configurations

- Modify Build.yml to include additional paths for push and pull request triggers.
- Update mega-linter.yml to set defaults for working directory and enhance linter settings. [`(ac88886)`](https://github.com/Nick2bad4u/FitFileViewer/commit/ac88886a8c3fc850a91c263bf9389de4cf0b95ca)


- Refines GitHub Actions workflows for clarity and efficiency

Updates release note formatting in Build.yml to ensure accurate content display. Simplifies file definition syntax in upload workflows for Linux, macOS, and Windows by consolidating file lists into single-line declarations, improving readability and maintainability. [`(9725759)`](https://github.com/Nick2bad4u/FitFileViewer/commit/97257594cf4b10401a85d71bcb97fe6f6f1b0713)


- Update Build.yml [`(13dd47c)`](https://github.com/Nick2bad4u/FitFileViewer/commit/13dd47cce34ada28fa6d453507ba735a0f2fe041)


- Update repo-stats.yml [`(9464e4f)`](https://github.com/Nick2bad4u/FitFileViewer/commit/9464e4f6549e705d773b29855bb8a3b292817929)



### 💼 Other

- Add step to rename Squirrel win32 nupkg for release

Renames Squirrel win32 nupkg for release clarity

Adds a workflow step to rename the Squirrel Windows 32-bit package,
ensuring consistent and descriptive naming for release artifacts.
Improves clarity and makes artifact identification easier during distribution. [`(58249d4)`](https://github.com/Nick2bad4u/FitFileViewer/commit/58249d418315ca6224f2dc8b02d34647b5d36c8d)


- Refactor release management scripts and workflows for improved asset size reporting and cleanup processes [`(224db3a)`](https://github.com/Nick2bad4u/FitFileViewer/commit/224db3a3a48215f5bb6af5e47c81cb27e864220c)


- Update release asset handling and auto-updater URLs for better artifact management [`(2f810dc)`](https://github.com/Nick2bad4u/FitFileViewer/commit/2f810dc92434daab68d5d17c488ae0e77036dba8)


- Enhance artifact organization in release process by adding detailed logging and ensuring all distributables are copied correctly to the release-dist directory. [`(6c0b053)`](https://github.com/Nick2bad4u/FitFileViewer/commit/6c0b053abaa1e76416f1708ab2e3f693f33f87b2)


- Add GitHub Actions workflow and PowerShell script to calculate and print release asset sizes [`(e8e67f9)`](https://github.com/Nick2bad4u/FitFileViewer/commit/e8e67f9132b840583154bf983649420775c536dc)


- Fix path handling in release distribution script for better artifact copying [`(0881de7)`](https://github.com/Nick2bad4u/FitFileViewer/commit/0881de751f565449489ce575051fb23f3ae48cc9)


- Enhance README.md: Add CI badge for Electron Builds, improve formatting, and update supported builds section with detailed platform and architecture information. [`(8fcc2f3)`](https://github.com/Nick2bad4u/FitFileViewer/commit/8fcc2f37d4457c67cc559833a25f39a52afde279)


- Add '.nupkg' pattern to file matching in Windows build steps [`(485c97f)`](https://github.com/Nick2bad4u/FitFileViewer/commit/485c97f667f5d9e17b4ffac7274b4f47cbdee6bb)


- Refactor Electron app build command to handle architecture and OS conditions more explicitly [`(800cb9d)`](https://github.com/Nick2bad4u/FitFileViewer/commit/800cb9dd58d1e149695fd04c06664c1477008e15)


- Fix electron-builder command to conditionally include architecture flag for macOS builds [`(019ac48)`](https://github.com/Nick2bad4u/FitFileViewer/commit/019ac48b1667168fd8b86f2e7c6910c31cbfb1dc)


- Enhance electron-builder command to support multiple macOS architectures [`(35dc735)`](https://github.com/Nick2bad4u/FitFileViewer/commit/35dc735810cbcb04ef34ee5a24be3093f792b68d)


- Fix electron-builder command to correctly handle macOS OS detection [`(0ecc4b3)`](https://github.com/Nick2bad4u/FitFileViewer/commit/0ecc4b3677f9be88232461897df52cd540dfb73c)


- Add macOS 15 and 13 to CI workflow for ia32 architecture [`(1821d26)`](https://github.com/Nick2bad4u/FitFileViewer/commit/1821d2641052961d6361eab62644c97ac7fa98a1)


- Update version to 15.2.0 and set CI environment variable in build workflow [`(6d6e2c8)`](https://github.com/Nick2bad4u/FitFileViewer/commit/6d6e2c86a2f0a2c87e51f74f93016192eee9180e)


- Full win32 support added [`(db4737c)`](https://github.com/Nick2bad4u/FitFileViewer/commit/db4737cfaa6dafc941ac6bdc47d47b4ebc5eb826)


- Add supported builds section to README and enhance download links [`(7d123d5)`](https://github.com/Nick2bad4u/FitFileViewer/commit/7d123d5f2ca0bb94791f25efa430866d97331d9a)


- Refactor Windows build file renaming process for clarity and organization [`(866717c)`](https://github.com/Nick2bad4u/FitFileViewer/commit/866717c8ad8fa09a3165c19a93d11fdf7797e272)


- Update Electron version to 36.3.2 and rename build step for clarity [`(633ee3c)`](https://github.com/Nick2bad4u/FitFileViewer/commit/633ee3c658150f384e62f27ef0bac67f39db2a73)


- Refactor Windows file renaming steps and add fileSystem property for macOS in package.json [`(5c81eab)`](https://github.com/Nick2bad4u/FitFileViewer/commit/5c81eabd344ef357a944a9ae28c60decba1fca4c)


- Adds support for 32-bit Windows auto-update feed

Ensures the auto-updater uses a separate feed URL and renames the update metadata for 32-bit Windows builds, preventing conflicts with other architectures and enabling correct update detection for ia32 users. [`(5d33f01)`](https://github.com/Nick2bad4u/FitFileViewer/commit/5d33f01455624ec6fb9e58577e591d5ee9a8b15f)


- Add branch specification for main in push event of Build workflow [`(ac013c1)`](https://github.com/Nick2bad4u/FitFileViewer/commit/ac013c1eda948db5a81f9409e589755d80c988a5)


- Refactor build workflow and update artifact naming conventions; improve CSS stylelint rules and fix README formatting [`(7e98645)`](https://github.com/Nick2bad4u/FitFileViewer/commit/7e98645c576e0961a125d8aa8edb4df627d43dc7)


- Create PULL_REQUEST_TEMPLATE/pull_request_template.md [`(3e60cea)`](https://github.com/Nick2bad4u/FitFileViewer/commit/3e60cea039b807fff4edae9ead642eb27b8821b7)


- Update issue templates [`(c307863)`](https://github.com/Nick2bad4u/FitFileViewer/commit/c307863a76ed46ce5221472e48b32acd44fc3f6a)


- Refactor code structure and improve readability; no functional changes made.
Removed a ton of un-needed files. [`(077d18c)`](https://github.com/Nick2bad4u/FitFileViewer/commit/077d18cdbfa39b9c68b8e86abdcfbe6e9d101c15)


- Update archive upload action to v1.4 in workflows

Upgrades the internet-archive-upload GitHub Action from v1.3 to v1.4
across Linux, macOS, and Windows workflows to ensure access to the
latest features, improvements, and potential bug fixes. [`(e1f6df6)`](https://github.com/Nick2bad4u/FitFileViewer/commit/e1f6df6380fab22e0d681b994da8a1b790561a1b)


- Updates archive upload action to v1.3 in workflows

Switches the internet-archive-upload GitHub Action to version 1.3
across all platform workflows to benefit from the latest fixes and
improvements. Ensures consistency and up-to-date dependency usage. [`(b77e7e3)`](https://github.com/Nick2bad4u/FitFileViewer/commit/b77e7e322774cc890662ae0f9143b783382225dc)


- Update action to 1.2 [`(98d761c)`](https://github.com/Nick2bad4u/FitFileViewer/commit/98d761cab3017847138f014dfe29281a8cb50955)


- Updates archive.org upload action to new repository

Switches the GitHub Actions workflow to use an alternative maintained fork of the internet-archive-upload action for uploading distributables. Ensures continued support and compatibility with workflow dependencies. [`(cf15948)`](https://github.com/Nick2bad4u/FitFileViewer/commit/cf15948968e9e8afc8d36a71be8b2eb25bd269de)


- Refactor workflows to improve path ignore patterns and update cron schedules [`(e02115e)`](https://github.com/Nick2bad4u/FitFileViewer/commit/e02115e7aef31a598897f3d09ed6b9ef392a234b)


- Refactor git-sizer workflows for scheduled analysis and dispatch execution [`(5ea09b9)`](https://github.com/Nick2bad4u/FitFileViewer/commit/5ea09b9274fea53bbd365736453aedbc34c3e5ad)


- Add Git Sizer workflow for repository size analysis [`(8c74ba4)`](https://github.com/Nick2bad4u/FitFileViewer/commit/8c74ba4e5cb50b02346500898b57bca183befbe9)


- Refactor code structure for improved readability and maintainability [`(04ee88e)`](https://github.com/Nick2bad4u/FitFileViewer/commit/04ee88eb465f46844c5677016c24a6a3d8fa7c13)


- Add concurrency settings to superlinter and typos workflows for improved job management [`(d31616b)`](https://github.com/Nick2bad4u/FitFileViewer/commit/d31616b698ad1cba8a99899e042e4a2c95f62ed5)


- Add write all perms [`(fedfafb)`](https://github.com/Nick2bad4u/FitFileViewer/commit/fedfafbee991374dc94511570ff18839bd5ddb2c)


- Update MegaLinter configuration and VSCode version retrieval to improve linting and version management [`(87a3167)`](https://github.com/Nick2bad4u/FitFileViewer/commit/87a31675aea8744d2c481046deee5a7b150d4f3c)


- Add checkout step to MegaLinter workflow [`(431ec74)`](https://github.com/Nick2bad4u/FitFileViewer/commit/431ec7451fc8713c872d5ae073c0cb2ad7c76b6d)


- Add FILTER_REGEX_INCLUDE to MegaLinter for electron-app directory [`(8d05de0)`](https://github.com/Nick2bad4u/FitFileViewer/commit/8d05de026665c9964809c8752b35282e70f9e40d)


- Remove redundant download steps for macOS release assets [`(d5c9200)`](https://github.com/Nick2bad4u/FitFileViewer/commit/d5c92009b4223799d79106d0b36846410ab8f2a8)


- Rename download step for Windows release assets to use the correct filename [`(3e17b5f)`](https://github.com/Nick2bad4u/FitFileViewer/commit/3e17b5f5d76a7c4d72ce893f61aab599a4458eab)


- Enhance workflows to download additional Linux and macOS release assets and update Windows asset identifiers [`(fa82c8b)`](https://github.com/Nick2bad4u/FitFileViewer/commit/fa82c8b7e0edd4f629e1e2d3bab473bdf9c6722e)


- Refactor workflows to download and upload Linux, macOS, and Windows release assets to archive.org [`(f4758ad)`](https://github.com/Nick2bad4u/FitFileViewer/commit/f4758ad1a837b744f2a89bb4dffca516827af4ff)


- Refactor workflows to list and upload distributables to archive.org for Linux, macOS, and Windows [`(10da187)`](https://github.com/Nick2bad4u/FitFileViewer/commit/10da18726909cda98f3165a0c7965e005b272827)


- Adds option to disable linters for repository git diff

Introduces the `DISABLE_LINTERS` environment variable set to `REPOSITORY_GIT_DIFF` in the MegaLinter workflow, allowing selective disabling of linters based on git diff.

Improves flexibility and efficiency in linting workflows by targeting specific changes. [`(071ed4a)`](https://github.com/Nick2bad4u/FitFileViewer/commit/071ed4a7c224f8bbb388f311840d07d1d4f81f03)


- Update MegaLinter configuration to set working directory and format disable linters list [`(f06ec41)`](https://github.com/Nick2bad4u/FitFileViewer/commit/f06ec414cc64c6fb21745cf91503fbff306aa6bd)


- Enhances workflows and updates dependencies

- Adds exclusions for libraries and node_modules in spellcheck configuration.
- Improves release notes generation with detailed commit information.
- Simplifies VirusTotal artifact scanning configuration.
- Removes redundant version checks in upload scripts for Linux, macOS, and Windows.
- [dependency] Updates application version from 11.6.0 to 12.0.0 in package-lock.json.

These changes streamline automation, improve clarity, and update dependencies for better maintainability. [`(d6ff30b)`](https://github.com/Nick2bad4u/FitFileViewer/commit/d6ff30bdb5cc4166ffbb5bacf1fda298934d547c)


- Remove unused workflows and update CI configurations

Deletes obsolete GitHub Actions workflows for Microsoft Defender for DevOps and OSSAR, streamlining the repository's CI setup. Updates logic in upload workflows to improve handling of archive.org metadata and switches runners to Ubuntu for macOS and Windows workflows. Adds workflow badges to README for better visibility of CI status.

These changes enhance maintainability by removing unused workflows and improving the reliability and consistency of existing workflows. [`(a3ecc3e)`](https://github.com/Nick2bad4u/FitFileViewer/commit/a3ecc3e130312da693e8699eb8f3604473d81ca6)


- Refactor code structure and remove redundant sections for improved readability and maintainability [`(85ec8d0)`](https://github.com/Nick2bad4u/FitFileViewer/commit/85ec8d0b188bec04e99ea841b2239bc20229bef3)



### ⚙️ Miscellaneous Tasks

- Add changelog files for electron-app, tests, and utils [`(b9d2e0a)`](https://github.com/Nick2bad4u/FitFileViewer/commit/b9d2e0a4df3224672415510d505e98054a593934)


- Update workflows for concurrency and improve artifact downloads; add badges to README [`(cbe820d)`](https://github.com/Nick2bad4u/FitFileViewer/commit/cbe820de464dba4544a1d6e33f2f72fbffb76232)



### 📦 Dependencies

- Update dependabot.yml [`(9ac7c5e)`](https://github.com/Nick2bad4u/FitFileViewer/commit/9ac7c5efba0afeb322c699442fab0f697a66391c)


- Update dependabot.yml [`(cfc92d3)`](https://github.com/Nick2bad4u/FitFileViewer/commit/cfc92d3a5ce5559df678d836d0ea4a2357fa4740)


- Update dependabot.yml [`(ff3bef8)`](https://github.com/Nick2bad4u/FitFileViewer/commit/ff3bef8b6ba4fd87a42d16cbb0ee350e98b94457)


- Update dependabot.yml [`(ca8da3a)`](https://github.com/Nick2bad4u/FitFileViewer/commit/ca8da3abc2c21aec3b892220f7375f54b2daabd2)


- Update dependabot.yml [`(bfe3af4)`](https://github.com/Nick2bad4u/FitFileViewer/commit/bfe3af4ee823b1294b018bdb9276bd421c825fac)


- Update dependabot.yml [`(fd9db7f)`](https://github.com/Nick2bad4u/FitFileViewer/commit/fd9db7f15d6183ac0cabcc5c02d3eec1dcb9dadd)


- Update dependabot.yml [`(5dd401f)`](https://github.com/Nick2bad4u/FitFileViewer/commit/5dd401ffb53b46109e2328b30c9d4f994719dc5f)


- Update dependabot.yml [`(d4f38f4)`](https://github.com/Nick2bad4u/FitFileViewer/commit/d4f38f493e627d6a1d85de9de30e84ae54edaef1)


- Update dependabot.yml [`(66fdfb4)`](https://github.com/Nick2bad4u/FitFileViewer/commit/66fdfb4ce17f0f56970cdb43e66d4e682fa240ba)


- Merge pull request #94 from Nick2bad4u/dependabot/github_actions/github-actions-7d0b73f1b5

[dependency] Update dependency group [`(c3dd4ba)`](https://github.com/Nick2bad4u/FitFileViewer/commit/c3dd4bac2e1c95337ee779c533c9db07dec4ca1c)


- [dependency] Update dependency group[dependency] Updates the github-actions group with 2 updates: [github/codeql-action](https://github.com/github/codeql-action) and [crate-ci/typos](https://github.com/crate-ci/typos).


Updates `github/codeql-action` from 3.28.18 to 3.28.19
- [Release notes](https://github.com/github/codeql-action/releases)
- [Changelog](https://github.com/github/codeql-action/blob/main/CHANGELOG.md)
- [Commits](https://github.com/github/codeql-action/compare/ff0a06e83cb2de871e5a09832bc6a81e7276941f...fca7ace96b7d713c7035871441bd52efbe39e27e)

Updates `crate-ci/typos` from 1.32.0 to 1.33.1
- [Release notes](https://github.com/crate-ci/typos/releases)
- [Changelog](https://github.com/crate-ci/typos/blob/master/CHANGELOG.md)
- [Commits](https://github.com/crate-ci/typos/compare/0f0ccba9ed1df83948f0c15026e4f5ccfce46109...b1ae8d918b6e85bd611117d3d9a3be4f903ee5e4)

---
updated-dependencies:
- dependency-name: github/codeql-action
  dependency-version: 3.28.19
  dependency-type: direct:production
  update-type: version-update:semver-patch
  dependency-group: github-actions
- dependency-name: crate-ci/typos
  dependency-version: 1.33.1
  dependency-type: direct:production
  update-type: version-update:semver-minor
  dependency-group: github-actions
...

Signed-off-by: dependabot[bot] <support@github.com> [`(3439452)`](https://github.com/Nick2bad4u/FitFileViewer/commit/3439452ba78079f1b2c63b96a046144fbb0fa412)


- Update dependabot.yml [`(82e9303)`](https://github.com/Nick2bad4u/FitFileViewer/commit/82e93035f1e362a11f475ffe465c04806473a341)


- Merge pull request #90 from Nick2bad4u/dependabot/github_actions/github-actions-3f12c82615

[dependency] Update Nick2bad4u/internet-archive-upload 1.6 in the github-actions group [`(fd646af)`](https://github.com/Nick2bad4u/FitFileViewer/commit/fd646af0a4330f331c1eccbc434dae82f21157a1)


- [dependency] Update Nick2bad4u/internet-archive-upload in the github-actions group

[dependency] Updates the github-actions group with 1 update: [Nick2bad4u/internet-archive-upload](https://github.com/nick2bad4u/internet-archive-upload).


Updates `Nick2bad4u/internet-archive-upload` from 1.5 to 1.6
- [Release notes](https://github.com/nick2bad4u/internet-archive-upload/releases)
- [Commits](https://github.com/nick2bad4u/internet-archive-upload/compare/79b45e1106a9ac95be87ba5eb660f487437d8d6e...947bc6bdf79d0bcf816b576082fd7b503d33ddc9)

---
updated-dependencies:
- dependency-name: Nick2bad4u/internet-archive-upload
  dependency-version: '1.6'
  dependency-type: direct:production
  update-type: version-update:semver-minor
  dependency-group: github-actions
...

Signed-off-by: dependabot[bot] <support@github.com> [`(c15ab05)`](https://github.com/Nick2bad4u/FitFileViewer/commit/c15ab058f0e0dafa0d9b24b4360df3d3700a808d)


- Update dependabot.yml [`(cc9c730)`](https://github.com/Nick2bad4u/FitFileViewer/commit/cc9c7304d72eefc79beef30467cd333edd54f967)


- Merge pull request #83 from Nick2bad4u/dependabot/github_actions/github-actions-896f5400c9

[dependency] Update dependency group [`(dd95c52)`](https://github.com/Nick2bad4u/FitFileViewer/commit/dd95c529bee2b9b3ae93110896bf1dc3661c61fd)


- [dependency] Update dependency group[dependency] Updates the github-actions group with 10 updates:

| Package | From | To |
| --- | --- | --- |
| [actions/checkout](https://github.com/actions/checkout) | `3.6.0` | `4.2.2` |
| [github/codeql-action](https://github.com/github/codeql-action) | `3.28.16` | `3.28.18` |
| [actions/dependency-review-action](https://github.com/actions/dependency-review-action) | `4.7.0` | `4.7.1` |
| [microsoft/DevSkim-Action](https://github.com/microsoft/devskim-action) | `1.0.15` | `1.0.16` |
| [ossf/scorecard-action](https://github.com/ossf/scorecard-action) | `2.4.1` | `2.4.2` |
| [rojopolis/spellcheck-github-actions](https://github.com/rojopolis/spellcheck-github-actions) | `0.48.0` | `0.49.0` |
| [actions/ai-inference](https://github.com/actions/ai-inference) | `1.0.0` | `1.1.0` |
| [super-linter/super-linter](https://github.com/super-linter/super-linter) | `7.3.0` | `7.4.0` |
| [trufflesecurity/trufflehog](https://github.com/trufflesecurity/trufflehog) | `3.88.28` | `3.88.35` |
| [Nick2bad4u/internet-archive-upload](https://github.com/nick2bad4u/internet-archive-upload) | `1.4` | `1.5` |


Updates `actions/checkout` from 3.6.0 to 4.2.2
- [Release notes](https://github.com/actions/checkout/releases)
- [Changelog](https://github.com/actions/checkout/blob/main/CHANGELOG.md)
- [Commits](https://github.com/actions/checkout/compare/v3.6.0...11bd71901bbe5b1630ceea73d27597364c9af683)

Updates `github/codeql-action` from 3.28.16 to 3.28.18
- [Release notes](https://github.com/github/codeql-action/releases)
- [Changelog](https://github.com/github/codeql-action/blob/main/CHANGELOG.md)
- [Commits](https://github.com/github/codeql-action/compare/v3.28.16...ff0a06e83cb2de871e5a09832bc6a81e7276941f)

Updates `actions/dependency-review-action` from 4.7.0 to 4.7.1
- [Release notes](https://github.com/actions/dependency-review-action/releases)
- [Commits](https://github.com/actions/dependency-review-action/compare/38ecb5b593bf0eb19e335c03f97670f792489a8b...da24556b548a50705dd671f47852072ea4c105d9)

Updates `microsoft/DevSkim-Action` from 1.0.15 to 1.0.16
- [Release notes](https://github.com/microsoft/devskim-action/releases)
- [Commits](https://github.com/microsoft/devskim-action/compare/a6b6966a33b497cd3ae2ebc406edf8f4cc2feec6...4b5047945a44163b94642a1cecc0d93a3f428cc6)

Updates `ossf/scorecard-action` from 2.4.1 to 2.4.2
- [Release notes](https://github.com/ossf/scorecard-action/releases)
- [Changelog](https://github.com/ossf/scorecard-action/blob/main/RELEASE.md)
- [Commits](https://github.com/ossf/scorecard-action/compare/f49aabe0b5af0936a0987cfb85d86b75731b0186...05b42c624433fc40578a4040d5cf5e36ddca8cde)

Updates `rojopolis/spellcheck-github-actions` from 0.48.0 to 0.49.0
- [Release notes](https://github.com/rojopolis/spellcheck-github-actions/releases)
- [Changelog](https://github.com/rojopolis/spellcheck-github-actions/blob/master/CHANGELOG.md)
- [Commits](https://github.com/rojopolis/spellcheck-github-actions/compare/23dc186319866e1de224f94fe1d31b72797aeec7...584b2ae95998967a53af7fbfb7f5b15352c38748)

Updates `actions/ai-inference` from 1.0.0 to 1.1.0
- [Release notes](https://github.com/actions/ai-inference/releases)
- [Commits](https://github.com/actions/ai-inference/compare/c7105a4c1e9d7e35f7677b5e6f830f5d631ce76e...d645f067d89ee1d5d736a5990e327e504d1c5a4a)

Updates `super-linter/super-linter` from 7.3.0 to 7.4.0
- [Release notes](https://github.com/super-linter/super-linter/releases)
- [Changelog](https://github.com/super-linter/super-linter/blob/main/CHANGELOG.md)
- [Commits](https://github.com/super-linter/super-linter/compare/4e8a7c2bf106c4c766c816b35ec612638dc9b6b2...12150456a73e248bdc94d0794898f94e23127c88)

Updates `trufflesecurity/trufflehog` from 3.88.28 to 3.88.35
- [Release notes](https://github.com/trufflesecurity/trufflehog/releases)
- [Changelog](https://github.com/trufflesecurity/trufflehog/blob/main/.goreleaser.yml)
- [Commits](https://github.com/trufflesecurity/trufflehog/compare/e42153d44a5e5c37c1bd0c70e074781e9edcb760...90694bf9af66e7536abc5824e7a87246dbf933cb)

Updates `Nick2bad4u/internet-archive-upload` from 1.4 to 1.5
- [Release notes](https://github.com/nick2bad4u/internet-archive-upload/releases)
- [Commits](https://github.com/nick2bad4u/internet-archive-upload/compare/ecf1bdea26a78610d394e48c4162759fc00c1308...79b45e1106a9ac95be87ba5eb660f487437d8d6e)

---
updated-dependencies:
- dependency-name: actions/checkout
  dependency-version: 4.2.2
  dependency-type: direct:production
  update-type: version-update:semver-major
  dependency-group: github-actions
- dependency-name: github/codeql-action
  dependency-version: 3.28.18
  dependency-type: direct:production
  update-type: version-update:semver-patch
  dependency-group: github-actions
- dependency-name: actions/dependency-review-action
  dependency-version: 4.7.1
  dependency-type: direct:production
  update-type: version-update:semver-patch
  dependency-group: github-actions
- dependency-name: microsoft/DevSkim-Action
  dependency-version: 1.0.16
  dependency-type: direct:production
  update-type: version-update:semver-patch
  dependency-group: github-actions
- dependency-name: ossf/scorecard-action
  dependency-version: 2.4.2
  dependency-type: direct:production
  update-type: version-update:semver-patch
  dependency-group: github-actions
- dependency-name: rojopolis/spellcheck-github-actions
  dependency-version: 0.49.0
  dependency-type: direct:production
  update-type: version-update:semver-minor
  dependency-group: github-actions
- dependency-name: actions/ai-inference
  dependency-version: 1.1.0
  dependency-type: direct:production
  update-type: version-update:semver-minor
  dependency-group: github-actions
- dependency-name: super-linter/super-linter
  dependency-version: 7.4.0
  dependency-type: direct:production
  update-type: version-update:semver-minor
  dependency-group: github-actions
- dependency-name: trufflesecurity/trufflehog
  dependency-version: 3.88.35
  dependency-type: direct:production
  update-type: version-update:semver-patch
  dependency-group: github-actions
- dependency-name: Nick2bad4u/internet-archive-upload
  dependency-version: '1.5'
  dependency-type: direct:production
  update-type: version-update:semver-minor
  dependency-group: github-actions
...

Signed-off-by: dependabot[bot] <support@github.com> [`(edfe41a)`](https://github.com/Nick2bad4u/FitFileViewer/commit/edfe41a974da84b42ae2ab5ae6bac9ce907712d2)



### 🛡️ Security

- Improves release cleanup and updates dependencies

Enhances the release cleanup script with parameters to control the number of releases to keep and optionally delete git tags, including orphan tag detection. Updates Electron, vitest, and several dev dependencies to latest versions for improved compatibility and security. Adjusts auto-updater feed URLs for better platform specificity and consistency. [`(945fcad)`](https://github.com/Nick2bad4u/FitFileViewer/commit/945fcadfcdac599ee51566c615aff5fc8ef63a0f)


- Merge pull request #80 from step-security-bot/chore/GHA-301837-stepsecurity-remediation

[StepSecurity] ci: Harden GitHub Actions [`(8307a83)`](https://github.com/Nick2bad4u/FitFileViewer/commit/8307a831043185f4a523362a0287361ce1c99e77)


- [StepSecurity] ci: Harden GitHub Actions

Signed-off-by: StepSecurity Bot <bot@stepsecurity.io> [`(8f87833)`](https://github.com/Nick2bad4u/FitFileViewer/commit/8f87833cfed3ec7c02dc4bd454fdaa26f3281842)


- Improves event handling and security, streamlines startup

Refines event listener options for better touch and scroll control, enhancing responsiveness and preventing unwanted behavior. Strengthens security by blocking navigation to untrusted URLs in new and existing windows. Simplifies tab setup logic and startup functions for maintainability. Excludes certain library files from automated workflows and linting to speed up CI. Small UI and code hygiene improvements. [`(95a1c15)`](https://github.com/Nick2bad4u/FitFileViewer/commit/95a1c15c5c64964801264db90b143e7d68620662)


- Merge pull request #70 from step-security-bot/chore/GHA-182017-stepsecurity-remediation

[StepSecurity] ci: Harden GitHub Actions [`(88e29a8)`](https://github.com/Nick2bad4u/FitFileViewer/commit/88e29a838a99a0a3ecd039411f3c41e1fb41bcb5)


- [StepSecurity] ci: Harden GitHub Actions

Signed-off-by: StepSecurity Bot <bot@stepsecurity.io> [`(6c948de)`](https://github.com/Nick2bad4u/FitFileViewer/commit/6c948de99d0680b66b5b1e4c698bbba291208f35)


- Update GitHub workflows to ignore paths except for the electron-app directory and adjust schedules

Update GitHub workflows to focus on electron-app paths and adjust schedules

Refines workflows to ignore all paths except those related to the electron-app directory for push and pull_request triggers, streamlining CI/CD processes. Adjusts cron schedules for gitleaks, repo-stats, and security-devops workflows to optimize execution timing. Adds workflow_dispatch inputs to scorecards for manual triggering flexibility. [`(2843409)`](https://github.com/Nick2bad4u/FitFileViewer/commit/284340907019bbb51d6cf251b61f8ed79c435de8)




## [10.0.0] - 2025-05-11


[[4c3e6b9](https://github.com/Nick2bad4u/FitFileViewer/commit/4c3e6b92c5018bb50ef8d19ac2bbed83562f32eb)...
[ea9ba1a](https://github.com/Nick2bad4u/FitFileViewer/commit/ea9ba1a537b246d8e257744abbd9d3d08f8c6d74)]
([compare](https://github.com/Nick2bad4u/FitFileViewer/compare/4c3e6b92c5018bb50ef8d19ac2bbed83562f32eb...ea9ba1a537b246d8e257744abbd9d3d08f8c6d74))


### 🚀 Features

- Add dmg-license workaround for macOS builds [`(0ccadbc)`](https://github.com/Nick2bad4u/FitFileViewer/commit/0ccadbc15e85914094ad3a0344b73a1c53d611c2)


- Update ESLint installation commands and bump version to 9.2.0 [`(7989023)`](https://github.com/Nick2bad4u/FitFileViewer/commit/7989023379903e0201cfc19c102e8042d836aa37)


- Update Node.js version to 20 in workflows [`(106a149)`](https://github.com/Nick2bad4u/FitFileViewer/commit/106a149f47fc0291246bb2ede3625de104419ea4)



### 🐛 Bug Fixes

- Simplify npm cache path for Windows builds [`(86376f4)`](https://github.com/Nick2bad4u/FitFileViewer/commit/86376f4bc414ab78fba2e4cfd331418c4951e721)



### 🛠️ GitHub Actions

- Update eslint.yml [`(8127a6b)`](https://github.com/Nick2bad4u/FitFileViewer/commit/8127a6b2b5f96bd00eeba08f0e7eeed9bfaa8e4c)



### 💼 Other

- Enhances map overlay functionality and fixes workflow issues

Refines map rendering with dynamic overlay highlights and improved color management. Updates tooltip display to include filenames and enhances UI accessibility. Exports color palette for consistency across components.

Fixes unsupported input in repo-stats workflow and corrects artifact path in eslint workflow. Updates dependencies to version 9.9.0. [`(ea9ba1a)`](https://github.com/Nick2bad4u/FitFileViewer/commit/ea9ba1a537b246d8e257744abbd9d3d08f8c6d74)



### 🚜 Refactor

- Remove unused VS Code extension files and assets [`(5dee8ce)`](https://github.com/Nick2bad4u/FitFileViewer/commit/5dee8ce6b99dfcb7c38b3a18220009aa39a1c3e8)



### ⚙️ Miscellaneous Tasks

- Update package versions and improve workflow configurations [`(353eea0)`](https://github.com/Nick2bad4u/FitFileViewer/commit/353eea0cfa5ee42c3182a86e3faecc5b2d77a3d3)



### 🛡️ Security

- Merge pull request #61 from step-security-bot/chore/GHA-090317-stepsecurity-remediation

[StepSecurity] ci: Harden GitHub Actions [`(ba8e3e4)`](https://github.com/Nick2bad4u/FitFileViewer/commit/ba8e3e4e5f4d31abe01ecf1dd9168825d387a493)


- [chore] Merge Branch 'main' into chore/GHA-090317-stepsecurity-remediation [`(4c3e6b9)`](https://github.com/Nick2bad4u/FitFileViewer/commit/4c3e6b92c5018bb50ef8d19ac2bbed83562f32eb)




## [9.0.0] - 2025-05-09


[[012b014](https://github.com/Nick2bad4u/FitFileViewer/commit/012b0141eb04038847bdbae1e4e56ae2ab74af8e)...
[45e22a1](https://github.com/Nick2bad4u/FitFileViewer/commit/45e22a1de6eeef84992ac114954c933955d20e59)]
([compare](https://github.com/Nick2bad4u/FitFileViewer/compare/012b0141eb04038847bdbae1e4e56ae2ab74af8e...45e22a1de6eeef84992ac114954c933955d20e59))


### 🚀 Features

- Update GitHub workflows with concurrency settings and add new badges to README [`(4ec7375)`](https://github.com/Nick2bad4u/FitFileViewer/commit/4ec7375d9152866d92948135f2bc85f4588b0028)


- Update GitHub workflows for improved linting and scanning processes [`(c7e0304)`](https://github.com/Nick2bad4u/FitFileViewer/commit/c7e030415cf69e25ba5674b857b87058ec44247b)


- Update Node.js version in Electronegativity workflow and remove unused plugins from repo-stats workflow [`(3a16d20)`](https://github.com/Nick2bad4u/FitFileViewer/commit/3a16d203c9d8a475ea8167c100bf96136c967065)


- Add GitHub Actions for Electronegativity Scan and VSCode Version Matrix [`(fbdf2c0)`](https://github.com/Nick2bad4u/FitFileViewer/commit/fbdf2c0c1fed67578e056b5b7813e79c54d61334)


- Enhance Electron app functionality and UI [`(012b014)`](https://github.com/Nick2bad4u/FitFileViewer/commit/012b0141eb04038847bdbae1e4e56ae2ab74af8e)



### 🛠️ GitHub Actions

- Update electronegativity.yml [`(15d7770)`](https://github.com/Nick2bad4u/FitFileViewer/commit/15d7770c065e340ea31428ae068589e3b8b4474c)


- Update trugglehog.yml [`(74fbcb1)`](https://github.com/Nick2bad4u/FitFileViewer/commit/74fbcb14b1cdc6fb272ddb5d8f050b9503c8ea06)


- Update osv-scanner.yml [`(dd948a2)`](https://github.com/Nick2bad4u/FitFileViewer/commit/dd948a2309d30f50a612705cf6462a09cecf2ed3)



### ⚙️ Miscellaneous Tasks

- Update GitHub Actions workflows and dependencies; fix badge link in README [`(c401c26)`](https://github.com/Nick2bad4u/FitFileViewer/commit/c401c26b48c572958c7a8cb8a3e58fd556c88d12)



### 📦 Dependencies

- Merge pull request #60 from Nick2bad4u/dependabot/github_actions/github-actions-0ba9d3d503

[dependency] Update dependency group [`(45e22a1)`](https://github.com/Nick2bad4u/FitFileViewer/commit/45e22a1de6eeef84992ac114954c933955d20e59)


- [dependency] Update dependency group[dependency] Updates the github-actions group with 3 updates: [actions/dependency-review-action](https://github.com/actions/dependency-review-action), [google/osv-scanner-action](https://github.com/google/osv-scanner-action) and [trufflesecurity/trufflehog](https://github.com/trufflesecurity/trufflehog).


Updates `actions/dependency-review-action` from 4.6.0 to 4.7.0
- [Release notes](https://github.com/actions/dependency-review-action/releases)
- [Commits](https://github.com/actions/dependency-review-action/compare/ce3cf9537a52e8119d91fd484ab5b8a807627bf8...38ecb5b593bf0eb19e335c03f97670f792489a8b)

Updates `google/osv-scanner-action` from 2.0.1 to 2.0.2
- [Release notes](https://github.com/google/osv-scanner-action/releases)
- [Commits](https://github.com/google/osv-scanner-action/compare/6fc714450122bda9d00e4ad5d639ad6a39eedb1f...e69cc6c86b31f1e7e23935bbe7031b50e51082de)

Updates `trufflesecurity/trufflehog` from 3.88.28 to 3.88.29
- [Release notes](https://github.com/trufflesecurity/trufflehog/releases)
- [Changelog](https://github.com/trufflesecurity/trufflehog/blob/main/.goreleaser.yml)
- [Commits](https://github.com/trufflesecurity/trufflehog/compare/v3.88.28...v3.88.29)

---
updated-dependencies:
- dependency-name: actions/dependency-review-action
  dependency-version: 4.7.0
  dependency-type: direct:production
  update-type: version-update:semver-minor
  dependency-group: github-actions
- dependency-name: google/osv-scanner-action
  dependency-version: 2.0.2
  dependency-type: direct:production
  update-type: version-update:semver-patch
  dependency-group: github-actions
- dependency-name: trufflesecurity/trufflehog
  dependency-version: 3.88.29
  dependency-type: direct:production
  update-type: version-update:semver-patch
  dependency-group: github-actions
...

Signed-off-by: dependabot[bot] <support@github.com> [`(09f20a5)`](https://github.com/Nick2bad4u/FitFileViewer/commit/09f20a5bd8482863560b9ebbae13c1352416cdb7)



### 🛡️ Security

- [StepSecurity] ci: Harden GitHub Actions

Signed-off-by: StepSecurity Bot <bot@stepsecurity.io> [`(72b041f)`](https://github.com/Nick2bad4u/FitFileViewer/commit/72b041f295317b56a7223dffe6e7cc9fb94a650f)


- Refactor GitHub Actions workflows and enhance application features

- Updated ESLint workflow to remove unnecessary working directory specification.
- Simplified Prettier workflow by removing SARIF conversion and upload steps, added continue-on-error option.
- Cleaned up repo-stats workflow by removing redundant plugin configurations.
- Enhanced README.md with additional visuals and badges for better project visibility.
- Improved accessibility by adding title attributes to iframes in index.html.
- Obfuscated API keys in index-CQWboq_8.js for security.
- Added IPC handlers in main.js to retrieve app, Electron, Node.js, and Chrome versions.
- Implemented tab button enabling/disabling functionality in main UI and utility functions.
- Added hover effects and improved close button functionality in about modal.
- Removed unnecessary tsconfig.json file.
- Created enableTabButtons.js utility to manage tab button states. [`(ccacc58)`](https://github.com/Nick2bad4u/FitFileViewer/commit/ccacc58627a7877220fa43fd16da97a3f9db74d2)




## [8.0.0] - 2025-05-07


[[94b964c](https://github.com/Nick2bad4u/FitFileViewer/commit/94b964c73525caf9fd9b7166000ec22368057dcb)...
[f7f3de8](https://github.com/Nick2bad4u/FitFileViewer/commit/f7f3de831c09658b6c78e414fd7ab27d148baed9)]
([compare](https://github.com/Nick2bad4u/FitFileViewer/compare/94b964c73525caf9fd9b7166000ec22368057dcb...f7f3de831c09658b6c78e414fd7ab27d148baed9))


### 🚀 Features

- Enhance UI and functionality with modern modal dialog and improved notifications [`(2a544bc)`](https://github.com/Nick2bad4u/FitFileViewer/commit/2a544bc72bf7513bdf3ffe77a452b72760511ee4)


- Update credits section in index.html and enhance accessibility features in the app menu [`(94b964c)`](https://github.com/Nick2bad4u/FitFileViewer/commit/94b964c73525caf9fd9b7166000ec22368057dcb)



### 🔀 Merge Commits

- [chore] Merge Branch 'main' of https://github.com/Nick2bad4u/FitFileViewer [`(3e10be8)`](https://github.com/Nick2bad4u/FitFileViewer/commit/3e10be8bdb8ff033a1f00d9f667183c93c21369f)



### 🛠️ GitHub Actions

- Create devskim.yml [`(e0888ab)`](https://github.com/Nick2bad4u/FitFileViewer/commit/e0888ab16ca35ef5c126415c159de5fa485caa2c)



### 💼 Other

- Add Vitest configuration and Stylelint configuration files

- Created vitest.config.js to set up testing environment with jsdom and specified setup files.
- Added stylelint.config.js to enforce standard stylelint rules, including preventing empty blocks. [`(f7f3de8)`](https://github.com/Nick2bad4u/FitFileViewer/commit/f7f3de831c09658b6c78e414fd7ab27d148baed9)



### 🛡️ Security

- Refactor and enhance Electron app functionality

- Added global variable declaration in renderTable.js for jQuery usage.
- Simplified error handling in setupTheme.js by removing the error parameter.
- Improved showFitData.js by refactoring file name handling and UI updates for better readability and performance.
- Updated windowStateUtils.js to include global variable declarations for better compatibility.
- Removed package-lock.json and package.json to streamline dependencies.
- Introduced GitHub Actions workflows for automated greetings, security scanning with Sobelow, style linting, and code linting with Super Linter.
- Added screenfull.min.js library for fullscreen functionality.
- Implemented setupWindow.js to manage window load events and tab interactions more efficiently. [`(a27cf89)`](https://github.com/Nick2bad4u/FitFileViewer/commit/a27cf8946699acf9c65a5799041abce0c653bc3e)




## [7.1.0] - 2025-05-06


[[62e1600](https://github.com/Nick2bad4u/FitFileViewer/commit/62e1600815c3b46792826c90343ed6aa1d140318)...
[1a61d0e](https://github.com/Nick2bad4u/FitFileViewer/commit/1a61d0ed75293d109c66c84369d708fcfe8e9591)]
([compare](https://github.com/Nick2bad4u/FitFileViewer/compare/62e1600815c3b46792826c90343ed6aa1d140318...1a61d0ed75293d109c66c84369d708fcfe8e9591))


### 🚀 Features

- Update version to 7.0.0 and enhance workflow error handling [`(1a61d0e)`](https://github.com/Nick2bad4u/FitFileViewer/commit/1a61d0ed75293d109c66c84369d708fcfe8e9591)


- Enhance accessibility features with font size and high contrast options [`(2ae1eb2)`](https://github.com/Nick2bad4u/FitFileViewer/commit/2ae1eb2bd1d40d766947b41a8d7f71def0a98928)



### 🔀 Merge Commits

- [chore] Merge Branch 'main' of https://github.com/Nick2bad4u/FitFileViewer [`(f576138)`](https://github.com/Nick2bad4u/FitFileViewer/commit/f5761380971bf9b74865cd5b2bd5bac52ddcea10)



### 🛠️ GitHub Actions

- Update Build.yml [`(6d34bb4)`](https://github.com/Nick2bad4u/FitFileViewer/commit/6d34bb41175ce49a34469ab3a2542cb12307b538)


- Update version to 5.6.0 in package-lock.json and improve indentation in Build.yml [`(6de66a2)`](https://github.com/Nick2bad4u/FitFileViewer/commit/6de66a2a22cb5b94e8444e9e0d2ca275b58bb0ee)


- Update version to 5.5.0 in package-lock.json and enhance SHA512 handling in Build.yml [`(978ff5c)`](https://github.com/Nick2bad4u/FitFileViewer/commit/978ff5c13619fa382c5fd49f032e629a2a32e02e)


- Update version to 5.4.0 in package-lock.json and improve SHA512 handling in Build.yml [`(fb47f6b)`](https://github.com/Nick2bad4u/FitFileViewer/commit/fb47f6b98fdec7d6f985a500d846aaf070571bfe)


- Fix sha512 checksums in latest.yml files for accurate artifact verification [`(62e1600)`](https://github.com/Nick2bad4u/FitFileViewer/commit/62e1600815c3b46792826c90343ed6aa1d140318)



### 💼 Other

- Enhance application menu with About and Keyboard Shortcuts options, and enable restart after updates [`(02c6a7c)`](https://github.com/Nick2bad4u/FitFileViewer/commit/02c6a7c8f5c02f0780e839bddd7454b5e1cc01ee)


- Refactor code structure for improved readability and maintainability [`(829fd2f)`](https://github.com/Nick2bad4u/FitFileViewer/commit/829fd2f4610020d853e8268116d12c21539e1ed9)


- Update version to 6.3.0 and enhance artifact handling in package.json; modify buildAppMenu.js for menu item updates [`(3b8e4d7)`](https://github.com/Nick2bad4u/FitFileViewer/commit/3b8e4d729f8ee430a4a089370c71bfb25f4e31aa)


- Update version to 6.2.0, add makensis dependency, and include LICENSE file [`(386d075)`](https://github.com/Nick2bad4u/FitFileViewer/commit/386d075737feef02afad8b2b17b73ddcf918489a)


- Enhance fullscreen functionality with improved button design and IPC handling for menu actions [`(db9a874)`](https://github.com/Nick2bad4u/FitFileViewer/commit/db9a87499c7ef8fb5902bbc8b23b85b4377ceace)


- Add IPC handlers for file menu actions and enhance export functionality [`(58b851b)`](https://github.com/Nick2bad4u/FitFileViewer/commit/58b851b2c40682059c4a163d7c1397542089e3e7)


- Fix escaping in URL handling and update sed command for sha512 hash replacement [`(a43aab0)`](https://github.com/Nick2bad4u/FitFileViewer/commit/a43aab043e1ef407fba980f033eb4da440ee4cba)


- Refactor buildAppMenu function parameters for improved readability and update package version to 5.2.0 [`(cb7b5b9)`](https://github.com/Nick2bad4u/FitFileViewer/commit/cb7b5b9350f68551dfb3866b559a34eb944cbdc6)


- Update sha512 handling in YAML files and enhance application description [`(e355d72)`](https://github.com/Nick2bad4u/FitFileViewer/commit/e355d720f2c8610c3b039fd171526c6a85358bd3)




## [5.0.0] - 2025-05-05


[[5f2ed49](https://github.com/Nick2bad4u/FitFileViewer/commit/5f2ed49a67e4678045bc11b9f4dd9d0308a932ec)...
[36ba8e7](https://github.com/Nick2bad4u/FitFileViewer/commit/36ba8e7a4b311980ad425746fed7408200dd7675)]
([compare](https://github.com/Nick2bad4u/FitFileViewer/compare/5f2ed49a67e4678045bc11b9f4dd9d0308a932ec...36ba8e7a4b311980ad425746fed7408200dd7675))


### 💼 Other

- Add YAML files to distribution and release artifacts [`(36ba8e7)`](https://github.com/Nick2bad4u/FitFileViewer/commit/36ba8e7a4b311980ad425746fed7408200dd7675)


- Update version to 4.6.0 and refine artifact naming in build process [`(ea4a270)`](https://github.com/Nick2bad4u/FitFileViewer/commit/ea4a270ea0bd15d4283987a55b87d0ebb83a1987)


- Refactor hash printing for Linux and macOS in build workflow [`(8ecf584)`](https://github.com/Nick2bad4u/FitFileViewer/commit/8ecf58482a6e333ab0794056922ac95581dd1801)


- Add hash printing for distributable files in Windows and Linux/macOS [`(bf9a186)`](https://github.com/Nick2bad4u/FitFileViewer/commit/bf9a186d2596d1d2531f171e08e2ff302a185267)


- Use recursive copy for organizing distributables in release process [`(6337f77)`](https://github.com/Nick2bad4u/FitFileViewer/commit/6337f77918d7ff4e44515c46e287bb70a892bb0d)


- Refactor release process to organize distributables by platform and architecture [`(ca0c2c8)`](https://github.com/Nick2bad4u/FitFileViewer/commit/ca0c2c86084a17b0f7f514fa664470308b23b5a8)


- Comment out deduplication and validation step for distributable files in the build workflow [`(5f2ed49)`](https://github.com/Nick2bad4u/FitFileViewer/commit/5f2ed49a67e4678045bc11b9f4dd9d0308a932ec)



### 📦 Dependencies

- [dependency] Update version 4.7.0 and update legal trademarks; refine start-prod script for cross-platform compatibility [`(633a72d)`](https://github.com/Nick2bad4u/FitFileViewer/commit/633a72db15ee43cb8fd79622c06bbddb6938b24e)




## [4.0.0] - 2025-05-04


[[142f71d](https://github.com/Nick2bad4u/FitFileViewer/commit/142f71d8b2859e0a5706aff756b0fabd51fc2940)...
[c87b8b7](https://github.com/Nick2bad4u/FitFileViewer/commit/c87b8b7c64c51550d6b4c1e233e617d1efbf51fd)]
([compare](https://github.com/Nick2bad4u/FitFileViewer/compare/142f71d8b2859e0a5706aff756b0fabd51fc2940...c87b8b7c64c51550d6b4c1e233e617d1efbf51fd))


### 🚀 Features

- Add listener for decoder options changes and update data table [`(236b7ae)`](https://github.com/Nick2bad4u/FitFileViewer/commit/236b7ae7449a7424ae74e4e969dca624b192a62e)


- Add core files for FIT File Viewer application [`(194d975)`](https://github.com/Nick2bad4u/FitFileViewer/commit/194d975ac042f443bdbe18d918f9880d1f230271)


- Add multiple GitHub Actions workflows for enhanced CI/CD processes including ActionLint, Microsoft Defender, Dependency Review, ESLint, OSSAR, OSV-Scanner, Scorecard, Sitemap generation, Stale issue management, and Static content deployment [`(2b34cbd)`](https://github.com/Nick2bad4u/FitFileViewer/commit/2b34cbdbf7f0be1356aa75da9891dfeb05d16a09)



### 🐛 Bug Fixes

- Update artifact patterns to include all YAML and blockmap files [`(7889426)`](https://github.com/Nick2bad4u/FitFileViewer/commit/78894269d0fc90e09bc95dfa14a022e8237c530c)


- Update artifact paths for release process [`(08d0e18)`](https://github.com/Nick2bad4u/FitFileViewer/commit/08d0e18f6b56a291681186e0f3f296d65aceecc7)


- Update Dependabot configuration to use consistent group naming for npm updates [`(ce65a7b)`](https://github.com/Nick2bad4u/FitFileViewer/commit/ce65a7b5ffb1f57f75f6c0e0e199d338b862d22d)


- Enable cancellation of in-progress GitHub Pages deployments [`(060b9f5)`](https://github.com/Nick2bad4u/FitFileViewer/commit/060b9f57e6400b7f50cb4cd563ced2754e1fb950)


- Update base URL in sitemap generation workflow [`(705c631)`](https://github.com/Nick2bad4u/FitFileViewer/commit/705c631fbe2acb46f4660d1334744699440098da)



### 🔀 Merge Commits

- [chore] Merge Branch 'main' of https://github.com/Nick2bad4u/FitFileViewer [`(34122ea)`](https://github.com/Nick2bad4u/FitFileViewer/commit/34122ea628d796a125476535d58ccdd9cdc4ee84)


- [chore] Merge Branch 'main' of https://github.com/Nick2bad4u/FitFileViewer [`(a58b129)`](https://github.com/Nick2bad4u/FitFileViewer/commit/a58b1297d372be61346d4f0f45d94b41966ba09e)


- [chore] Merge Branch 'main' of https://github.com/Nick2bad4u/FitFileViewer [`(203c08d)`](https://github.com/Nick2bad4u/FitFileViewer/commit/203c08d6ca0fc4fc67c222145b5e2dabee13290f)



### 🛠️ GitHub Actions

- Update codeql.yml [`(d20ea1b)`](https://github.com/Nick2bad4u/FitFileViewer/commit/d20ea1b726e1f83ed95a98efba641cefb85cc46e)


- Create summary.yml [`(5b7c14e)`](https://github.com/Nick2bad4u/FitFileViewer/commit/5b7c14e11864ad5d894d75bc597631db187c44b9)


- Update codeql.yml [`(c7c0873)`](https://github.com/Nick2bad4u/FitFileViewer/commit/c7c0873c94cdaf8ed8a2420acad354df90061fc9)


- Update codeql.yml [`(da7d274)`](https://github.com/Nick2bad4u/FitFileViewer/commit/da7d2744470225c048953bfd9dbdcc44be27b244)


- Enhance version bump logic and update release notes formatting in Build.yml [`(d0592e8)`](https://github.com/Nick2bad4u/FitFileViewer/commit/d0592e854a779d2422658d3299a7b73719226af4)


- Update Build.yml [`(9539415)`](https://github.com/Nick2bad4u/FitFileViewer/commit/9539415eec32ff3a073498924e3dec7f32026820)


- Update Build.yml [`(5228c0d)`](https://github.com/Nick2bad4u/FitFileViewer/commit/5228c0d4d029c054cf04f7411ccf319ea21903e9)


- Update Build.yml [`(364d4ee)`](https://github.com/Nick2bad4u/FitFileViewer/commit/364d4ee9cd6f46903e45dd98d2993561e450f2fb)


- Update Build.yml [`(e8e4063)`](https://github.com/Nick2bad4u/FitFileViewer/commit/e8e40637dd1fa40eefa06ce52f672627109808e2)


- Update Build.yml [`(36679a7)`](https://github.com/Nick2bad4u/FitFileViewer/commit/36679a70ad0800a04fbdf2df24acfec2c6710a53)


- Update Build.yml [`(91190ef)`](https://github.com/Nick2bad4u/FitFileViewer/commit/91190ef99e53b80b1337179dd69d230d2661b281)


- Update Build.yml [`(44ec334)`](https://github.com/Nick2bad4u/FitFileViewer/commit/44ec33442827c0271e1efb898c0ca82d1b68d6fb)


- Update Build.yml [`(9322bc2)`](https://github.com/Nick2bad4u/FitFileViewer/commit/9322bc292f7e26e52254ff8874c3acd211aa34e3)


- Update Build.yml [`(6d1917a)`](https://github.com/Nick2bad4u/FitFileViewer/commit/6d1917a17102cde7c5c1a7ef632162da922e239f)


- Update Build.yml [`(9e6ebff)`](https://github.com/Nick2bad4u/FitFileViewer/commit/9e6ebffbaa2dfd7500bbc28ff67b0ee3a5270428)


- Update Build.yml [`(81d66fc)`](https://github.com/Nick2bad4u/FitFileViewer/commit/81d66fc8c677fb623208149d83b7ed266ef629bd)


- Create Build.yml [`(f67c2f0)`](https://github.com/Nick2bad4u/FitFileViewer/commit/f67c2f03e1800f6e78700919b484bd2346790099)


- Create jekyll-gh-pages.yml [`(f261cc4)`](https://github.com/Nick2bad4u/FitFileViewer/commit/f261cc4195186ccda56ccbf7f45b2d65235d15b3)


- Create codeql.yml [`(75706f9)`](https://github.com/Nick2bad4u/FitFileViewer/commit/75706f927fef5404609602fb3b206d392cc758de)


- Update eslint.yml [`(adb753d)`](https://github.com/Nick2bad4u/FitFileViewer/commit/adb753dd858f42bde074927310b6b18a3f5179e5)


- Update eslint.yml [`(4433a79)`](https://github.com/Nick2bad4u/FitFileViewer/commit/4433a799253bfd5f04b7b9b6b81f8c0a899940f5)


- Update eslint.yml [`(548c5a9)`](https://github.com/Nick2bad4u/FitFileViewer/commit/548c5a9034a491b2ac1fe94ad1dfee6a6577af20)


- Update eslint.yml [`(c5cba71)`](https://github.com/Nick2bad4u/FitFileViewer/commit/c5cba71c7c0227546fc31f2dbab6f81862118dc6)



### 💼 Other

- Update caching paths for npm on Windows and enable cross-OS archive support [`(c87b8b7)`](https://github.com/Nick2bad4u/FitFileViewer/commit/c87b8b7c64c51550d6b4c1e233e617d1efbf51fd)


- Exclude ia32 architecture for Windows and update version to 3.7.0 in package.json [`(ce505d0)`](https://github.com/Nick2bad4u/FitFileViewer/commit/ce505d072045f186c94e3645c5c7541c73a130d6)


- Update version to 3.2.0, enhance auto-updater functionality, and adjust cache path for Windows [`(e16aa30)`](https://github.com/Nick2bad4u/FitFileViewer/commit/e16aa3078da3e957e8c9b3e3f523fd6cece5a9a0)


- Refactor code structure for improved readability and maintainability [`(967db82)`](https://github.com/Nick2bad4u/FitFileViewer/commit/967db82e404e61a7fec7a13671fa7c0127740813)


- Enhance version bump logic to include tagging with v prefix and update versioning scheme for major and minor releases [`(7e89d59)`](https://github.com/Nick2bad4u/FitFileViewer/commit/7e89d59990b0bb6bad6374a6c5c4de4b8e9d947f)


- Simplify file listing in workflow by changing path to current directory [`(64f53e8)`](https://github.com/Nick2bad4u/FitFileViewer/commit/64f53e81b8fc941c0d06e15c63d6b4ad9464c62c)


- Update package version to 2.2.0 and adjust build workflow for package.json handling [`(0a1e0b6)`](https://github.com/Nick2bad4u/FitFileViewer/commit/0a1e0b621eebb9ee6d68115c1469aa12dadd26a7)


- Enhance build workflow: add validation for package.json, upload bumped version, and improve deduplication of distributable files [`(4609fc1)`](https://github.com/Nick2bad4u/FitFileViewer/commit/4609fc1fa395d8a428b73c3bb45111ab905faf03)


- Deduplicate distributable files before creating release [`(51fd771)`](https://github.com/Nick2bad4u/FitFileViewer/commit/51fd77162362ddd818a4ef3ef2a689f06241c5b0)


- Enhance release workflow by listing artifacts and updating file patterns for artifact uploads [`(8470c43)`](https://github.com/Nick2bad4u/FitFileViewer/commit/8470c4365144a7309926bb415693f0f85cf29a6a)


- Update artifact upload and release steps in CI workflow [`(1d808ac)`](https://github.com/Nick2bad4u/FitFileViewer/commit/1d808acc2ef11401a9a54bd4c1e1b7aa0058a67b)


- Update release action to include all files in artifacts directory [`(8069386)`](https://github.com/Nick2bad4u/FitFileViewer/commit/8069386f62ec475424a18cf469bbb6c5722d0458)


- Implement automatic minor version bump in CI workflow [`(abd2c63)`](https://github.com/Nick2bad4u/FitFileViewer/commit/abd2c63c838bdc7153da28a8c78a2f62ef8c1ddc)


- Fix exclusion of ia32 architecture for ubuntu-latest in build matrix [`(7fb6fb6)`](https://github.com/Nick2bad4u/FitFileViewer/commit/7fb6fb62b5f362473c1e428223fcb6a6e24f3d08)


- Fix exclusion of macOS ia32 architecture in build matrix [`(83eb944)`](https://github.com/Nick2bad4u/FitFileViewer/commit/83eb9440ec44db2a9a5e35dc58f9a9ef7e6a698d)


- Add build-all script to package.json for building all platforms [`(ca630b7)`](https://github.com/Nick2bad4u/FitFileViewer/commit/ca630b7a810fda59ae24b82801c119e4e20667e2)


- Merge PR #9

build(deps): bump github/codeql-action from 3.28.15 to 3.28.16 in the github-actions group [`(bd433fa)`](https://github.com/Nick2bad4u/FitFileViewer/commit/bd433fa1b45bbc3fd7e28c0f23cf8daeffb39264)


- Refactor Dependabot configuration to remove redundant whitespace and ensure consistent formatting across package ecosystems. [`(e8e76fc)`](https://github.com/Nick2bad4u/FitFileViewer/commit/e8e76fcd8f61cddb4e579c9d09b1b154494686ad)


- Remove CodeQL workflow file as it is no longer needed for the project. [`(62afc9a)`](https://github.com/Nick2bad4u/FitFileViewer/commit/62afc9a34500ca25f114561e12c95b444878d6de)



### 🚜 Refactor

- Simplify version bump logic and improve update notifications in renderer [`(f85a00b)`](https://github.com/Nick2bad4u/FitFileViewer/commit/f85a00b2e1f6457739f2fa8a1045e194a58a9acc)


- Change Dependabot update schedule from daily to monthly for all ecosystems; add lap selection UI logic to a new module [`(23e22ea)`](https://github.com/Nick2bad4u/FitFileViewer/commit/23e22ea4a3b382f4f6dbce8a3f46d3f791cff3d5)


- Simplify ESLint workflow by consolidating steps and updating action versions [`(65ea31f)`](https://github.com/Nick2bad4u/FitFileViewer/commit/65ea31f6c997bbb0abf08fe6299efd56b605700b)



### ⚙️ Miscellaneous Tasks

- Add Copilot instructions for FitFileViewer project [`(0512f60)`](https://github.com/Nick2bad4u/FitFileViewer/commit/0512f601db8c19a29a0dba51bd83604c0786b56b)


- Update eslint to version 9.25.1 and related dependencies in package.json and package-lock.json [`(fa290ff)`](https://github.com/Nick2bad4u/FitFileViewer/commit/fa290ff98278eea759583f6108d19c36d3134b8a)


- Downgrade ESLint version to 9.0.0 and update workflow for improved security and functionality [`(fe53342)`](https://github.com/Nick2bad4u/FitFileViewer/commit/fe5334290abe33f414014c1ca7fd7de16e83c6fc)



### 📦 Dependencies

- [dependency] Update version 3.8.0 and rename latest.yml for architecture in Windows [`(3420901)`](https://github.com/Nick2bad4u/FitFileViewer/commit/34209013b180eaf92883f427fa1fec735795f213)


- [dependency] Update version 3.7.0 and update autoUpdater feed URL for Windows architecture [`(69acfaf)`](https://github.com/Nick2bad4u/FitFileViewer/commit/69acfaf09a4f370aada766676ecd3e68f605cd63)


- [dependency] Update version 3.6.0 and update caching strategy for node modules in Build.yml [`(d35e3f6)`](https://github.com/Nick2bad4u/FitFileViewer/commit/d35e3f6cc28e3a485918d45a159558ca8dd633bc)


- [dependency] Update version 3.5.0 and update artifact naming convention in package.json; add support for additional release artifacts in Build.yml [`(44f56b7)`](https://github.com/Nick2bad4u/FitFileViewer/commit/44f56b7d4492fbbf87c890317b6259c775139501)


- [dependency] Update version 3.4.0, update cache path for consistency, and add update notification functionality [`(77f634d)`](https://github.com/Nick2bad4u/FitFileViewer/commit/77f634dc2cf27ebf54b10f79ccb92b0432502752)


- Update dependabot.yml [`(c4101b9)`](https://github.com/Nick2bad4u/FitFileViewer/commit/c4101b901894360e9b2533c69284c4c6c2ec8315)


- *(deps)* [dependency] Update github/codeql-action in the github-actions group [`(4c1630a)`](https://github.com/Nick2bad4u/FitFileViewer/commit/4c1630a39162eb09c5be1be1abefc03f6fb52086)


- *(deps)* [dependency] Update step-security/harden-runner [`(49874d6)`](https://github.com/Nick2bad4u/FitFileViewer/commit/49874d63b450049ab3f364b0a209979da12fb2e7)


- Create dependabot.yml [`(142f71d)`](https://github.com/Nick2bad4u/FitFileViewer/commit/142f71d8b2859e0a5706aff756b0fabd51fc2940)



### 🛡️ Security

- Merge pull request #19 from step-security-bot/chore/GHA-291632-stepsecurity-remediation

[StepSecurity] Apply security best practices [`(328573a)`](https://github.com/Nick2bad4u/FitFileViewer/commit/328573a0c8743f6ed5facb4bd4682858d8da7f4f)


- [StepSecurity] Apply security best practices

Signed-off-by: StepSecurity Bot <bot@stepsecurity.io> [`(a827f56)`](https://github.com/Nick2bad4u/FitFileViewer/commit/a827f563a3498a1a9c965fd35f490c7fe2c89f2b)


- Merge PR #4

build(deps): bump step-security/harden-runner from 2.11.1 to 2.12.0 in the github-actions group [`(3acf2c1)`](https://github.com/Nick2bad4u/FitFileViewer/commit/3acf2c1ac893c4cdc2461a15ae08184eeb3de8ad)


- Merge pull request #3 from step-security-bot/chore/GHA-211451-stepsecurity-remediation

[StepSecurity] Apply security best practices [`(0bcca04)`](https://github.com/Nick2bad4u/FitFileViewer/commit/0bcca042f97ce4ac01947b269eeb7fda4de21008)


- [StepSecurity] Apply security best practices

Signed-off-by: StepSecurity Bot <bot@stepsecurity.io> [`(5b5d013)`](https://github.com/Nick2bad4u/FitFileViewer/commit/5b5d013f37f9bd83ae22f004889ad630885c1d25)




## Contributors
Thanks to all the [contributors](https://github.com/Nick2bad4u/FitFileViewer/graphs/contributors) for their hard work!
## License
This project is licensed under the [MIT License](https://github.com/Nick2bad4u/FitFileViewer/blob/main/LICENSE.md)
*This changelog was automatically generated with [git-cliff](https://github.com/orhun/git-cliff).*
