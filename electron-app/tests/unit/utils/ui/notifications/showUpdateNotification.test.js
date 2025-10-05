/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { showUpdateNotification } from '../../../../../utils/ui/notifications/showUpdateNotification.js';

describe('showUpdateNotification', () => {
    /** @type {HTMLElement} */
    let notificationElement;

    beforeEach(() => {
        // Create notification element
        notificationElement = document.createElement('div');
        notificationElement.id = 'notification';
        document.body.appendChild(notificationElement);

        vi.clearAllMocks();
        vi.spyOn(console, 'log').mockImplementation(() => { });
        vi.spyOn(console, 'warn').mockImplementation(() => { });
        vi.spyOn(console, 'error').mockImplementation(() => { });
        vi.spyOn(console, 'info').mockImplementation(() => { });
    });

    afterEach(() => {
        document.body.innerHTML = '';
        vi.restoreAllMocks();
    });

    describe('Basic Functionality', () => {
        it('should display a basic notification', () => {
            showUpdateNotification('Test message', 'info');

            expect(notificationElement.style.display).toBe('block');
            expect(notificationElement.className).toBe('notification info');
            expect(notificationElement.textContent).toContain('Test message');
        });

        it('should use default type and duration', () => {
            showUpdateNotification('Test');

            expect(notificationElement.className).toBe('notification info');
        });

        it('should set notification type correctly', () => {
            showUpdateNotification('Warning message', 'warning');
            expect(notificationElement.className).toBe('notification warning');

            notificationElement.innerHTML = '';
            showUpdateNotification('Error message', 'error');
            expect(notificationElement.className).toBe('notification error');

            notificationElement.innerHTML = '';
            showUpdateNotification('Success message', 'success');
            expect(notificationElement.className).toBe('notification success');
        });
    });

    describe('Update Downloaded Notification', () => {
        it('should create update downloaded buttons', () => {
            const installUpdate = vi.fn();
			/** @type {any} */(globalThis).electronAPI = { installUpdate };

            showUpdateNotification('Update downloaded', 'success', 0, 'update-downloaded');

            const buttons = notificationElement.querySelectorAll('button');
            expect(buttons.length).toBe(2);
            expect(buttons[0].textContent).toBe('Restart & Update');
            expect(buttons[1].textContent).toBe('Later');

            delete /** @type {any} */(globalThis).electronAPI;
        });

        it('should call installUpdate on restart button click', () => {
            const installUpdate = vi.fn();
			/** @type {any} */(globalThis).electronAPI = { installUpdate };

            showUpdateNotification('Update ready', 'info', 0, 'update-downloaded');

            const restartBtn = notificationElement.querySelector('button');
            restartBtn?.click();

            expect(installUpdate).toHaveBeenCalled();

            delete /** @type {any} */(globalThis).electronAPI;
        });

        it('should hide notification on later button click', () => {
            showUpdateNotification('Update ready', 'info', 0, 'update-downloaded');

            const laterBtn = notificationElement.querySelectorAll('button')[1];
            laterBtn?.click();

            expect(notificationElement.style.display).toBe('none');
        });
    });

    describe('Simple Update Action', () => {
        it('should create simple update action button', () => {
            const installUpdate = vi.fn();
			/** @type {any} */(globalThis).electronAPI = { installUpdate };

            showUpdateNotification('Update available', 'info', 0, true);

            const button = notificationElement.querySelector('button');
            expect(button).toBeTruthy();
            expect(button?.textContent).toBe('Restart & Update');

            delete /** @type {any} */(globalThis).electronAPI;
        });

        it('should call installUpdate on button click', () => {
            const installUpdate = vi.fn();
			/** @type {any} */(globalThis).electronAPI = { installUpdate };

            showUpdateNotification('Update ready', 'info', 0, true);

            const button = notificationElement.querySelector('button');
            button?.click();

            expect(installUpdate).toHaveBeenCalled();

            delete /** @type {any} */(globalThis).electronAPI;
        });
    });

    describe('Auto-hide', () => {
        it('should auto-hide after duration', () => {
            vi.useFakeTimers();

            showUpdateNotification('Test', 'info', 1000, false);

            expect(notificationElement.style.display).toBe('block');

            vi.advanceTimersByTime(1000);

            expect(notificationElement.style.display).toBe('none');

            vi.useRealTimers();
        });

        it('should not auto-hide with update-downloaded action', () => {
            vi.useFakeTimers();

            showUpdateNotification('Update ready', 'info', 1000, 'update-downloaded');

            expect(notificationElement.style.display).toBe('block');

            vi.advanceTimersByTime(1000);

            // Should still be visible
            expect(notificationElement.style.display).toBe('block');

            vi.useRealTimers();
        });
    });

    describe('Error Handling', () => {
        it('should handle missing notification element', () => {
            document.body.innerHTML = '';

            expect(() => showUpdateNotification('Test')).not.toThrow();
            expect(console.error).toHaveBeenCalled();
        });

        it('should handle electronAPI not available', () => {
            showUpdateNotification('Update', 'info', 0, true);

            const button = notificationElement.querySelector('button');
            button?.click();

            expect(console.warn).toHaveBeenCalled();
        });

        it('should handle missing installUpdate function', () => {
			/** @type {any} */(globalThis).electronAPI = {};

            showUpdateNotification('Update', 'info', 0, true);

            const button = notificationElement.querySelector('button');
            button?.click();

            expect(console.warn).toHaveBeenCalled();

            delete /** @type {any} */(globalThis).electronAPI;
        });

        it('should handle errors during button creation', () => {
            // Mock createElement to throw an error for buttons only
            const originalCreateElement = document.createElement.bind(document);
            vi.spyOn(document, 'createElement').mockImplementation((/** @type {string} */ tagName) => {
                if (tagName === 'button') {
                    throw new Error('Button creation failed');
                }
                return originalCreateElement(tagName);
            });

            showUpdateNotification('Test', 'info', 0, true);

            expect(console.error).toHaveBeenCalled();
        });
    });

    describe('Content Clearing', () => {
        it('should clear previous notification content', () => {
            notificationElement.innerHTML = '<div>Old content</div>';

            showUpdateNotification('New message', 'info');

            expect(notificationElement.textContent).toBe('New message');
            expect(notificationElement.querySelector('div')).toBeFalsy();
        });

        it('should handle errors when clearing content', () => {
            // Mock remove to throw an error
            const child = document.createElement('div');
            notificationElement.appendChild(child);
            vi.spyOn(child, 'remove').mockImplementation(() => {
                throw new Error('Remove failed');
            });

            showUpdateNotification('Test', 'info');

            expect(console.error).toHaveBeenCalled();
        });
    });

    describe('Logging', () => {
        it('should log notification display', () => {
            showUpdateNotification('Test message', 'info');

            expect(console.info).toHaveBeenCalledWith(
                expect.stringContaining('[ShowUpdateNotification] Showing update notification'),
                expect.objectContaining({ message: 'Test message', type: 'info' })
            );
        });

        it('should log successful display', () => {
            showUpdateNotification('Test', 'info');

            expect(console.info).toHaveBeenCalledWith(
                expect.stringContaining('Update notification displayed successfully')
            );
        });

        it('should log errors with context', () => {
            document.body.innerHTML = '';

            showUpdateNotification('Test', 'info');

            expect(console.error).toHaveBeenCalledWith(
                expect.stringContaining('Notification element not found')
            );
        });
    });
});
