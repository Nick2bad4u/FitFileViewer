---
id: dependency-audits
title: Dependency Audits
sidebar_label: Dependency Audits
sidebar_position: 6
description: Dependency audit thresholds and narrowly scoped build-tool exceptions.
---

# Dependency Audits

`npm run audit` checks the application and the separate Docusaurus dependency
graphs. The release gate requires it to pass. The application threshold is
**moderate** and the documentation threshold is **high**.

## Approved Temporary Exceptions

The maintainer approved the following exceptions on October 8, 2026 (UTC), after
reviewing their reachability in the current build tools. These exceptions accept
the assessed denial-of-service exposure; they do not fix the dependencies.

| Dependency         | Advisory                                                                 | Approved scope                                                                       |
| ------------------ | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| `braces@3.0.3`     | [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) | Assessed application development dependencies and separate documentation build paths |
| `sprintf-js@1.1.3` | [GHSA-hp3w-g68c-fv3c](https://github.com/advisories/GHSA-hp3w-g68c-fv3c) | Assessed application development dependencies only                                   |

The application production dependency audit reports no vulnerabilities. The
inspected packaged application contains neither dependency. Documentation tools
can be regular dependencies in the Docusaurus package; the documentation
exception is restricted to the assessed static-site build graph and does not
depend on those packages having npm's `dev` flag.

The `braces` finding requires attacker-controlled nested glob patterns. The
reviewed callers receive repository-controlled include, ignore, or watch
patterns. Activity contents and filenames are not used as glob patterns. The
application's `sprintf-js` path belongs to Electron download/proxy logging;
reviewed callers use fixed format strings and put variable values in structured
log context. New untrusted pattern or format-string inputs require a fresh
assessment.

## Gate Behavior

The approved node inventories live in `scripts/audit-policy/root.json` and
`scripts/audit-policy/docs.json`. They are reviewed inputs to the gate and must
not be regenerated automatically from failing audit output.

Exceptions match the exact advisory ID, package name, severity, vulnerable range,
installed version, lockfile integrity, and assessed dependency-node paths. Every affected
intermediary must remain in the reviewed scope. Application nodes must remain
development-only. Updating a parent package or moving a vulnerable dependency
into the application runtime can therefore invalidate an exception even if its
advisory identifier stays the same.

An npm finding propagated through several packages is accepted only when all
causes at or above the existing threshold are explicitly approved and remain in
scope. Valid dependency cycles must lead to concrete advisories. Missing
references, cycles without an advisory, malformed reports, audit service errors,
process signals, and contradictory exit codes fail the gate.

The gate retains npm's known warning that package-level `allowScripts` takes
precedence over `.npmrc` configuration. Only that exact diagnostic is recognized;
other stderr output fails validation. The wrapper does not rewrite user or global
registry, authentication, or lifecycle configuration.

Below-threshold findings retain the existing threshold behavior. This policy
does not add exceptions for KaTeX, the documentation graph's moderate findings,
or the previously accepted `image-size` advisories.

## Reassessment and Removal

Before every release, check for compatible upstream fixes and re-evaluate the
current dependency graph and its inputs. Remove an exception when a compatible
fixed version is available, its dependency is removed, or its advisory no longer
appears in the fresh audit. Do not automatically expand the assessed versions,
integrities, package paths, or advisory list to make a dependency update pass.

A changed severity, advisory range, package identity, dependency scope, or input
trust boundary requires a new assessment. Retain the negative regression tests
when removing an exception so new findings continue to block release.
