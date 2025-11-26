---
id: fit-parser-migration
title: FIT Parser Migration Guide
sidebar_label: 📦 FIT Parser Migration
sidebar_position: 3
description: Guide for migrating FIT parser implementations.
---

# FIT Parser Migration Guide

Guide for updating or migrating the FIT file parser implementation.

## Current Implementation

FitFileViewer uses the **Garmin FIT SDK** for JavaScript:

```javascript
import { Decoder, Stream } from '@garmin/fitsdk';

function parseFitFile(arrayBuffer) {
    const stream = new Stream(arrayBuffer);
    const decoder = new Decoder(stream);

    // Decode all messages
    const { messages } = decoder.read();

    return {
        records: messages.recordMesgs,
        laps: messages.lapMesgs,
        sessions: messages.sessionMesgs,
        events: messages.eventMesgs
    };
}
```

## Migration Considerations

### When to Migrate

Consider migration when:
- New SDK version with breaking changes
- Performance improvements needed
- Bug fixes required
- New message types supported

### SDK Version Update

```bash
# Check current version
npm list @garmin/fitsdk

# Update to latest
npm update @garmin/fitsdk

# Or specific version
npm install @garmin/fitsdk@21.x.x
```

## Data Structure Changes

### Record Fields

FIT SDK may add/change field names:

```javascript
// Map old field names to new
const fieldMapping = {
    // Old SDK           New SDK
    'positionLat':     'position_lat',
    'positionLong':    'position_long',
    'enhancedSpeed':   'enhanced_speed',
};

function normalizeRecord(record) {
    const normalized = {};
    for (const [key, value] of Object.entries(record)) {
        const newKey = fieldMapping[key] || key;
        normalized[newKey] = value;
    }
    return normalized;
}
```

### Timestamp Handling

```javascript
// FIT timestamps are seconds from Dec 31, 1989
const FIT_EPOCH = new Date('1989-12-31T00:00:00Z').getTime();

function fitTimestampToDate(fitTimestamp) {
    return new Date(FIT_EPOCH + (fitTimestamp * 1000));
}
```

### Coordinate Conversion

```javascript
// FIT uses semicircles, need to convert to degrees
const SEMICIRCLES_TO_DEGREES = 180 / Math.pow(2, 31);

function semicirclesToDegrees(semicircles) {
    return semicircles * SEMICIRCLES_TO_DEGREES;
}
```

## Testing Migration

### Test Suite

```javascript
import { describe, it, expect } from 'vitest';
import { parseFitFile } from '../fitParser.js';

describe('FIT Parser Migration', () => {
    it('should parse sample file correctly', async () => {
        const buffer = await loadTestFile('sample.fit');
        const result = parseFitFile(buffer);

        expect(result.records).toBeDefined();
        expect(result.records.length).toBeGreaterThan(0);
    });

    it('should have correct field names', async () => {
        const buffer = await loadTestFile('sample.fit');
        const result = parseFitFile(buffer);
        const record = result.records[0];

        expect(record.position_lat).toBeDefined();
        expect(record.position_long).toBeDefined();
        expect(record.timestamp).toBeDefined();
    });

    it('should convert coordinates correctly', async () => {
        const buffer = await loadTestFile('sample.fit');
        const result = parseFitFile(buffer);
        const record = result.records[0];

        // Latitude should be in degrees (-90 to 90)
        expect(record.position_lat).toBeGreaterThan(-90);
        expect(record.position_lat).toBeLessThan(90);
    });
});
```

### Sample Files

Use test files from:
```
fit-test-files/
├── _Fenton_Michigan_*.fit
├── Virtual_Zwift_*.fit
└── ...
```

## Backwards Compatibility

### Version Detection

```javascript
function detectSdkVersion() {
    // Check for new features/fields
    try {
        const decoder = new Decoder();
        if (typeof decoder.read === 'function') {
            return '21.x';
        }
    } catch {
        return 'unknown';
    }
}
```

### Graceful Fallback

```javascript
function getRecords(messages) {
    // Try new format first
    if (messages.recordMesgs) {
        return messages.recordMesgs;
    }

    // Fall back to old format
    if (messages.records) {
        return messages.records;
    }

    return [];
}
```

## Resources

- [Garmin FIT SDK Documentation](https://developer.garmin.com/fit/overview/)
- [FIT Protocol Specification](https://developer.garmin.com/fit/protocol/)
- [FIT Profile Definitions](https://developer.garmin.com/fit/file-types/)

---

**Related:** [Architecture Overview](/docs/architecture/overview)
