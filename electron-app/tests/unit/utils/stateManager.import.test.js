/**
 * @fileoverview State Manager Import Test
 */
import { describe, it, expect } from 'vitest';
import { getState, setState, subscribe } from '../../../utils/state/core/stateManager.js';

describe('State Manager Import Test', () => {
    it('should import stateManager functions', () => {
        expect(typeof getState).toBe('function');
        expect(typeof setState).toBe('function');
        expect(typeof subscribe).toBe('function');
    });
});
