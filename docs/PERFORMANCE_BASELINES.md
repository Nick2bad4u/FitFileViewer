# Performance Baselines

Use the performance baseline runner when renderer, parser, chart, map, table, or dependency changes could affect real FIT-file responsiveness.

```powershell
npm run perf:baseline
```

The command builds the runtime app, launches Electron through Playwright, loads representative files from `fit-test-files/`, and writes `artifacts/performance-baseline.json`. The `artifacts/` directory is ignored because baseline numbers are machine-dependent.

The default fixtures cover small, medium, and large real FIT files from
`fit-test-files/`. The JSON records:

- FIT file byte size, size class, and name
- parse time
- initial renderer handoff time
- map route render time
- chart render time
- raw Data tab table render time after expanding the first table
- renderer heap usage before load, after load, and after unload when Chromium exposes heap data
- route, chart canvas, raw-data table, record, and session counts
- renderer console and page errors

For release work, compare the generated baseline against the latest trusted baseline from the same machine or CI runner. Large regressions should be explained or fixed before tagging.

Use comparison mode when you have a trusted prior baseline from the same runner:

```powershell
npm run perf:compare
```

`perf:compare` reads `artifacts/performance-baseline.previous.json`, writes
`artifacts/performance-baseline.current.json`, and fails when matching fixture
metrics exceed the default 25 percent regression threshold.

For a different baseline file or threshold, pass arguments through the baseline
runner:

```powershell
npm run perf:baseline -- --compare artifacts/performance-baseline.previous.json --threshold-percent 15
```

The comparison checks `parseMs`, `renderMs`, `mapRouteRenderMs`,
`chartRenderMs`, and `dataTableRenderMs` for matching fixture names. Regressions
above the configured threshold fail the command after writing the current JSON
when the fixture's aggregate comparable timing also regresses beyond the
threshold. Isolated metric spikes are reported as filtered regressions so noisy
CI runs stay visible without failing config-only or otherwise faster runs. The
JSON includes a `comparison` section with skipped fixtures, filtered metric
spikes, and failing metrics.

CI trend checks use:

```powershell
npm run perf:trend
```

The `Performance Baseline` workflow runs this command on `ubuntu-latest` on a
schedule or manual dispatch. It restores the most recent cached
`artifacts/performance-baseline-cache/performance-baseline.json` for the branch,
copies it to `artifacts/performance-baseline.previous.json`, runs the comparison
when that file exists, and writes the next trusted baseline back to the cache
path after a successful run. The first run on a branch records a seed baseline
without failing for a missing comparison file.

Every workflow run uploads `artifacts/performance-baseline.log`, the restored
previous baseline when present, and the current baseline JSON so performance
regressions can be diagnosed without rerunning the benchmark locally. When
running in GitHub Actions, the baseline runner also appends the comparison
status, fixture count, threshold, regressions, filtered metric spikes, skipped
fixtures, and output path to the job summary through `GITHUB_STEP_SUMMARY`.
