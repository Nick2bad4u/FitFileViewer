# Performance Baselines

Use the performance baseline runner when renderer, parser, chart, map, table, or dependency changes could affect real FIT-file responsiveness.

```powershell
npm run perf:baseline
```

The command builds the runtime app, launches Electron through Playwright, loads representative files from `fit-test-files/`, and writes `artifacts/performance-baseline.json`. The `artifacts/` directory is ignored because baseline numbers are machine-dependent.

The JSON records:

- FIT file byte size and name
- parse time
- initial renderer handoff time
- map route render time
- chart render time
- raw Data tab table render time after expanding the first table
- renderer heap usage before load, after load, and after unload when Chromium exposes heap data
- route, chart canvas, raw-data table, record, and session counts
- renderer console and page errors

For release work, compare the generated baseline against the latest trusted baseline from the same machine or CI runner. Large regressions should be explained or fixed before tagging.
