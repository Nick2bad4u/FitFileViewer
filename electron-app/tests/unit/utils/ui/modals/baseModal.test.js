/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { BaseModal, handleEscapeKey, injectStyles, trapFocus } from '../../../../../utils/ui/modals/baseModal.js';

// Test subclass to access protected methods
class TestModal extends BaseModal {
    /**
     * @param {HTMLElement} modal
     */
    testSetupEventListeners(modal) {
        return this.setupEventListeners(modal);
    }

    /**
     * @param {HTMLElement} modal
     */
    testSetupExternalLinks(modal) {
        return this.setupExternalLinks(modal);
    }

    /**
     * @param {HTMLElement} modal
     */
    testFocusFirstElement(modal) {
        return this.focusFirstElement(modal);
    }
}

describe('BaseModal', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
        vi.clearAllMocks();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.useRealTimers();
    });

    describe('constructor', () => {
        it('should create instance with default config', () => {
            const modal = new BaseModal({ id: 'test-modal' });

            expect(modal.config.id).toBe('test-modal');
            expect(modal.config.animationDuration).toBe(300);
            expect(modal.config.closeOnBackdrop).toBe(true);
            expect(modal.config.closeOnEscape).toBe(true);
            expect(modal.lastFocusedElement).toBe(null);
            expect(modal.modalElement).toBe(null);
        });

        it('should merge custom config with defaults', () => {
            const onShow = vi.fn();
            const onHide = vi.fn();
            const modal = new BaseModal({
                id: 'test-modal',
                className: 'custom-class',
                animationDuration: 500,
                closeOnBackdrop: false,
                closeOnEscape: false,
                onShow,
                onHide
            });

            expect(modal.config.className).toBe('custom-class');
            expect(modal.config.animationDuration).toBe(500);
            expect(modal.config.closeOnBackdrop).toBe(false);
            expect(modal.config.closeOnEscape).toBe(false);
            expect(modal.config.onShow).toBe(onShow);
            expect(modal.config.onHide).toBe(onHide);
        });
    });

    describe('create', () => {
        it('should create new modal element if it doesn\'t exist', () => {
            const modal = new BaseModal({ id: 'test-modal' });
            const content = '<div class="modal-content">Test</div>';

            const element = modal.create(content);

            expect(element).toBeInstanceOf(HTMLDivElement);
            expect(element.id).toBe('test-modal');
            expect(element.className).toBe('modal');
            expect(element.innerHTML).toBe(content);
            expect(element.style.display).toBe('none');
            expect(document.body.contains(element)).toBe(true);
        });

        it('should reuse existing modal element', () => {
            const existing = document.createElement('div');
            existing.id = 'test-modal';
            document.body.appendChild(existing);

            const modal = new BaseModal({ id: 'test-modal' });
            const content = '<div>New content</div>';

            const element = modal.create(content);

            expect(element).toBe(existing);
            expect(element.innerHTML).toBe(content);
        });

        it('should add custom className', () => {
            const modal = new BaseModal({ id: 'test-modal', className: 'custom' });
            const element = modal.create('<div>Test</div>');

            expect(element.className).toBe('modal custom');
        });

        it('should set modalElement property', () => {
            const modal = new BaseModal({ id: 'test-modal' });
            modal.create('<div>Test</div>');

            expect(modal.modalElement).toBeInstanceOf(HTMLDivElement);
        });
    });

    describe('show', () => {
        it('should display and animate modal', async () => {
            const modal = new BaseModal({ id: 'test-modal' });
            const content = '<button id="first-btn">First</button>';

            const showPromise = modal.show(content);

            const element = document.getElementById('test-modal');
            expect(element?.style.display).toBe('flex');

            // Trigger requestAnimationFrame
            await vi.runAllTimersAsync();

            expect(element?.classList.contains('show')).toBe(true);

            await showPromise;
        });

        it('should save last focused element', async () => {
            const button = document.createElement('button');
            document.body.appendChild(button);
            button.focus();

            const modal = new BaseModal({ id: 'test-modal' });
            await modal.show('<div>Test</div>');

            expect(modal.lastFocusedElement).toBe(button);
        });

        it('should call onShow callback', async () => {
            const onShow = vi.fn();
            const modal = new BaseModal({ id: 'test-modal', onShow });

            await modal.show('<div>Test</div>');

            expect(onShow).toHaveBeenCalled();
        });

        it('should focus first element after animation', async () => {
            const modal = new BaseModal({ id: 'test-modal', animationDuration: 100 });
            const content = '<button id="first">First</button><button id="second">Second</button>';

            await modal.show(content);

            vi.advanceTimersByTime(100);
            await vi.runAllTimersAsync();

            const firstBtn = document.getElementById('first');
            expect(document.activeElement).toBe(firstBtn);
        });
    });

    describe('hide', () => {
        it('should hide modal with animation', () => {
            const modal = new BaseModal({ id: 'test-modal' });
            const element = modal.create('<div>Test</div>');
            element.classList.add('show');
            element.style.display = 'flex';

            modal.hide();

            expect(element.classList.contains('show')).toBe(false);

            vi.advanceTimersByTime(300);

            expect(element.style.display).toBe('none');
        });

        it('should restore focus to last focused element', () => {
            const button = document.createElement('button');
            document.body.appendChild(button);

            const modal = new BaseModal({ id: 'test-modal' });
            modal.lastFocusedElement = button;
            modal.create('<div>Test</div>');

            modal.hide();
            vi.advanceTimersByTime(300);

            expect(document.activeElement).toBe(button);
        });

        it('should call onHide callback', () => {
            const onHide = vi.fn();
            const modal = new BaseModal({ id: 'test-modal', onHide });
            modal.create('<div>Test</div>');

            modal.hide();
            vi.advanceTimersByTime(300);

            expect(onHide).toHaveBeenCalled();
        });

        it('should handle missing modal element', () => {
            const modal = new BaseModal({ id: 'nonexistent' });

            expect(() => modal.hide()).not.toThrow();
        });

        it('should clear lastFocusedElement', () => {
            const modal = new BaseModal({ id: 'test-modal' });
            modal.lastFocusedElement = document.createElement('button');
            modal.create('<div>Test</div>');

            modal.hide();
            vi.advanceTimersByTime(300);

            expect(modal.lastFocusedElement).toBe(null);
        });
    });

    describe('setupEventListeners', () => {
        it('should close modal on close button click', () => {
            const modal = new TestModal({ id: 'test-modal' });
            const element = modal.create('<button class="modal-close">Close</button>');
            modal.testSetupEventListeners(element);

            const hideSpy = vi.spyOn(modal, 'hide');
            const closeBtn = element.querySelector('.modal-close');
            closeBtn?.dispatchEvent(new Event('click'));

            expect(hideSpy).toHaveBeenCalled();
        });

        it('should close modal on close button Enter key', () => {
            const modal = new TestModal({ id: 'test-modal' });
            const element = modal.create('<button class="modal-close">Close</button>');
            modal.testSetupEventListeners(element);

            const hideSpy = vi.spyOn(modal, 'hide');
            const closeBtn = element.querySelector('.modal-close');
            closeBtn?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));

            expect(hideSpy).toHaveBeenCalled();
        });

        it('should close modal on close button Space key', () => {
            const modal = new TestModal({ id: 'test-modal' });
            const element = modal.create('<button class="modal-close">Close</button>');
            modal.testSetupEventListeners(element);

            const hideSpy = vi.spyOn(modal, 'hide');
            const closeBtn = element.querySelector('.modal-close');
            closeBtn?.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));

            expect(hideSpy).toHaveBeenCalled();
        });

        it('should close on backdrop click when enabled', () => {
            const modal = new TestModal({ id: 'test-modal', closeOnBackdrop: true });
            const element = modal.create('<div class="modal-content">Content</div>');
            modal.testSetupEventListeners(element);

            const hideSpy = vi.spyOn(modal, 'hide');
            element.dispatchEvent(new MouseEvent('click', { bubbles: true }));

            expect(hideSpy).toHaveBeenCalled();
        });

        it('should not close on modal content click', () => {
            const modal = new TestModal({ id: 'test-modal', closeOnBackdrop: true });
            const element = modal.create('<div class="modal-content">Content</div>');
            modal.testSetupEventListeners(element);

            const hideSpy = vi.spyOn(modal, 'hide');
            const content = element.querySelector('.modal-content');
            content?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

            expect(hideSpy).not.toHaveBeenCalled();
        });

        it('should not setup backdrop close when disabled', () => {
            const modal = new TestModal({ id: 'test-modal', closeOnBackdrop: false });
            const element = modal.create('<div>Content</div>');
            modal.testSetupEventListeners(element);

            const hideSpy = vi.spyOn(modal, 'hide');
            element.dispatchEvent(new MouseEvent('click'));

            expect(hideSpy).not.toHaveBeenCalled();
        });

        it('should close on Escape key when enabled', () => {
            const modal = new TestModal({ id: 'test-modal', closeOnEscape: true });
            const element = modal.create('<div>Content</div>');
            modal.testSetupEventListeners(element);

            const hideSpy = vi.spyOn(modal, 'hide');
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

            expect(hideSpy).toHaveBeenCalled();
        });
    });

    describe('setupExternalLinks', () => {
        it('should open external links via electronAPI', () => {
            const openExternal = vi.fn();
			/** @type {any} */(globalThis).electronAPI = { openExternal };

            const modal = new TestModal({ id: 'test-modal' });
            const element = modal.create('<a href="https://example.com" data-external-link>Link</a>');
            modal.testSetupExternalLinks(element);

            const link = element.querySelector('[data-external-link]');
            link?.dispatchEvent(new Event('click'));

            expect(openExternal).toHaveBeenCalledWith('https://example.com');

            delete /** @type {any} */(globalThis).electronAPI;
        });

        it('should fallback to window.open without electronAPI', () => {
            const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

            const modal = new TestModal({ id: 'test-modal' });
            const element = modal.create('<a href="https://example.com" data-external-link>Link</a>');
            modal.testSetupExternalLinks(element);

            const link = element.querySelector('[data-external-link]');
            link?.dispatchEvent(new Event('click'));

            expect(windowOpenSpy).toHaveBeenCalledWith('https://example.com', '_blank', 'noopener,noreferrer');

            windowOpenSpy.mockRestore();
        });

        it('should handle Enter key on external links', () => {
            const openExternal = vi.fn();
			/** @type {any} */(globalThis).electronAPI = { openExternal };

            const modal = new TestModal({ id: 'test-modal' });
            const element = modal.create('<a href="https://example.com" data-external-link>Link</a>');
            modal.testSetupExternalLinks(element);

            const link = element.querySelector('[data-external-link]');
            link?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));

            expect(openExternal).toHaveBeenCalledWith('https://example.com');

            delete /** @type {any} */(globalThis).electronAPI;
        });

        it('should handle Space key on external links', () => {
            const openExternal = vi.fn();
			/** @type {any} */(globalThis).electronAPI = { openExternal };

            const modal = new TestModal({ id: 'test-modal' });
            const element = modal.create('<a href="https://example.com" data-external-link>Link</a>');
            modal.testSetupExternalLinks(element);

            const link = element.querySelector('[data-external-link]');
            link?.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));

            expect(openExternal).toHaveBeenCalledWith('https://example.com');

            delete /** @type {any} */(globalThis).electronAPI;
        });
    });

    describe('focusFirstElement', () => {
        it('should focus first focusable element', () => {
            const modal = new TestModal({ id: 'test-modal' });
            const element = modal.create('<button id="first">First</button><button id="second">Second</button>');

            modal.testFocusFirstElement(element);

            expect(document.activeElement?.id).toBe('first');
        });

        it('should handle modal with no focusable elements', () => {
            const modal = new TestModal({ id: 'test-modal' });
            const element = modal.create('<div>No focusable elements</div>');

            expect(() => modal.testFocusFirstElement(element)).not.toThrow();
        });
    });
});

describe('handleEscapeKey', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should call callback on Escape key', () => {
        const callback = vi.fn();
        handleEscapeKey(callback);

        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

        expect(callback).toHaveBeenCalled();
    });

    it('should not call callback on other keys', () => {
        const callback = vi.fn();
        handleEscapeKey(callback);

        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

        expect(callback).not.toHaveBeenCalled();
    });

    it('should return cleanup function', () => {
        const callback = vi.fn();
        const cleanup = handleEscapeKey(callback);

        cleanup();

        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

        expect(callback).not.toHaveBeenCalled();
    });
});

describe('injectStyles', () => {
    beforeEach(() => {
        document.head.innerHTML = '';
    });

    it('should inject styles', () => {
        const result = injectStyles('test-styles', 'body { color: red; }');

        expect(result).toBe(true);
        const style = document.getElementById('test-styles');
        expect(style).toBeInstanceOf(HTMLStyleElement);
        expect(style?.textContent).toBe('body { color: red; }');
    });

    it('should not inject duplicate styles', () => {
        injectStyles('test-styles', 'body { color: red; }');
        const result = injectStyles('test-styles', 'body { color: blue; }');

        expect(result).toBe(false);
        const style = document.getElementById('test-styles');
        expect(style?.textContent).toBe('body { color: red; }'); // Should keep original
    });
});

describe('trapFocus', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
    });

    it('should trap focus within modal', () => {
        const modal = document.createElement('div');
        modal.innerHTML = '<button id="first">First</button><button id="last">Last</button>';
        document.body.appendChild(modal);

        trapFocus(modal);

        const first = document.getElementById('first');
        const last = document.getElementById('last');

        first?.focus();
        const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true });
        modal.dispatchEvent(event);

        // Should wrap to last element
        expect(document.activeElement).toBe(last);
    });

    it('should handle Tab key forward', () => {
        const modal = document.createElement('div');
        modal.innerHTML = '<button id="first">First</button><button id="last">Last</button>';
        document.body.appendChild(modal);

        const cleanup = trapFocus(modal);

        const first = document.getElementById('first');
        const last = document.getElementById('last');
        last?.focus();

        const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: false, bubbles: true });
        Object.defineProperty(event, 'preventDefault', { value: vi.fn() });
        modal.dispatchEvent(event);

        // Test that cleanup works
        cleanup();
        expect(cleanup).toBeInstanceOf(Function);
    });

    it('should return cleanup function', () => {
        const modal = document.createElement('div');
        modal.innerHTML = '<button id="first">First</button><button id="last">Last</button>';
        document.body.appendChild(modal);

        const cleanup = trapFocus(modal);

        expect(cleanup).toBeInstanceOf(Function);
        expect(() => cleanup()).not.toThrow();
    });

    it('should handle modal with no focusable elements', () => {
        const modal = document.createElement('div');
        modal.innerHTML = '<div>No focusable elements</div>';
        document.body.appendChild(modal);

        const cleanup = trapFocus(modal);

        expect(cleanup).toBeInstanceOf(Function);
        expect(() => cleanup()).not.toThrow();
    });

    it('should not trap on non-Tab keys', () => {
        const modal = document.createElement('div');
        modal.innerHTML = '<button id="first">First</button><button id="last">Last</button>';
        document.body.appendChild(modal);

        trapFocus(modal);

        const first = document.getElementById('first');
        first?.focus();

        const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
        modal.dispatchEvent(event);

        expect(document.activeElement).toBe(first);
    });
});
