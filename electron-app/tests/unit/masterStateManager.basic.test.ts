import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { masterStateManager } from '../../utils/state/core/masterStateManager.js';
import { setState, subscribe, resetState } from '../../utils/state/core/stateManager.js';

describe('MasterStateManager Basic Functionality', () => {
  beforeEach(() => {
    // Reset state before each test
    resetState();
  });

  afterEach(() => {
    // Clean up after each test
    resetState();
  });

  describe('Introspection Methods', () => {
    it('should provide getState method', () => {
      expect(typeof masterStateManager.getState).toBe('function');

      // Test basic state access
      const initialState = masterStateManager.getState();
      expect(initialState).toBeDefined();
    });

    it('should provide getHistory method', () => {
      expect(typeof masterStateManager.getHistory).toBe('function');

      // Test history access
      const history = masterStateManager.getHistory();
      expect(Array.isArray(history)).toBe(true);
    });

    it('should provide getSubscriptions method', () => {
      expect(typeof masterStateManager.getSubscriptions).toBe('function');

      // Test subscriptions access
      const subscriptions = masterStateManager.getSubscriptions();
      expect(subscriptions).toBeDefined();
      expect(typeof subscriptions).toBe('object');
    });
  });

  describe('State Management Integration', () => {
    it('should get state changes through masterStateManager', () => {
      // Set a test value using direct stateManager
      setState('test.value', 'hello world');

      // Get it back through masterStateManager
      const value = masterStateManager.getState('test.value');
      expect(value).toBe('hello world');
    });

    it('should track state history through masterStateManager', () => {
      // Make some state changes using direct stateManager
      setState('test.counter', 1);
      setState('test.counter', 2);
      setState('test.counter', 3);

      // Check history through masterStateManager
      const history = masterStateManager.getHistory();
      expect(history.length).toBeGreaterThan(0);
    });

    it('should access subscriptions through masterStateManager', () => {
      let callCount = 0;

      // Subscribe using direct stateManager
      const unsubscribe = subscribe('test.subscription', () => {
        callCount++;
      });

      // Make a change using direct stateManager
      setState('test.subscription', 'triggered');

      // Check subscription was called
      expect(callCount).toBe(1);

      // Check subscriptions list through masterStateManager
      const subscriptions = masterStateManager.getSubscriptions();
      expect((subscriptions as any).subscriptionDetails).toBeDefined();
      expect((subscriptions as any).subscriptionDetails?.['test.subscription']).toBeDefined();

      // Clean up
      unsubscribe();
    });
  });

  describe('Initialization Status', () => {
    it('should provide initialization status', () => {
      expect(typeof masterStateManager.getInitializationStatus).toBe('function');

      const status = masterStateManager.getInitializationStatus();
      expect(status).toBeDefined();
      expect(typeof status).toBe('object');
      expect((status as any).isInitialized).toBeDefined();
      expect((status as any).components).toBeDefined();
      expect((status as any).systemState).toBeDefined();
    });
  });
});
