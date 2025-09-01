/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
    isHTMLElement,
    query,
    queryAll,
    requireElement,
    setText,
    addClass,
    removeClass,
    setDisabled,
    getValue,
    setValue,
    setChecked,
    getChecked,
    setStyle,
    clearElement,
    on,
    getData,
    setData,
    focus
} from '../../../utils/dom/domHelpers.js';

describe('domHelpers.js - Comprehensive Tests', () => {
    let testContainer;

    beforeEach(() => {
        // Create a test container for each test
        testContainer = document.createElement('div');
        testContainer.id = 'test-container';
        document.body.appendChild(testContainer);
    });

    afterEach(() => {
        // Clean up after each test
        if (testContainer && testContainer.parentNode) {
            testContainer.parentNode.removeChild(testContainer);
        }
        document.body.innerHTML = '';
    });

    describe('isHTMLElement', () => {
        it('should return true for valid HTML elements', () => {
            const div = document.createElement('div');
            const span = document.createElement('span');
            const input = document.createElement('input');

            expect(isHTMLElement(div)).toBe(true);
            expect(isHTMLElement(span)).toBe(true);
            expect(isHTMLElement(input)).toBe(true);
        });

        it('should return false for non-HTML elements', () => {
            expect(isHTMLElement(null)).toBe(false);
            expect(isHTMLElement(undefined)).toBe(false);
            expect(isHTMLElement('')).toBe(false);
            expect(isHTMLElement(123)).toBe(false);
            expect(isHTMLElement({})).toBe(false);
            expect(isHTMLElement([])).toBe(false);
            expect(isHTMLElement(document.createTextNode('text'))).toBe(false);
        });

        it('should handle edge cases', () => {
            expect(isHTMLElement(document)).toBe(false);
            expect(isHTMLElement(window)).toBe(false);
            expect(isHTMLElement(document.createDocumentFragment())).toBe(false);
        });
    });

    describe('query', () => {
        beforeEach(() => {
            testContainer.innerHTML = `
                <div class="test-class" id="test-id">Test Div</div>
                <span class="test-class">Test Span</span>
                <input type="text" name="test-input" />
            `;
        });

        it('should find elements by various selectors', () => {
            expect(query('#test-id')).toBe(testContainer.querySelector('#test-id'));
            expect(query('.test-class')).toBe(testContainer.querySelector('.test-class'));
            expect(query('input[name="test-input"]')).toBe(testContainer.querySelector('input[name="test-input"]'));
        });

        it('should return null for non-existing elements', () => {
            expect(query('#non-existing')).toBe(null);
            expect(query('.non-existing-class')).toBe(null);
        });

        it('should throw for invalid selectors', () => {
            expect(() => query('')).toThrow();
            // Valid string selectors should not throw
            expect(query('#non-existing')).toBe(null);
        });

        it('should work with custom parent element', () => {
            const customParent = document.createElement('div');
            customParent.innerHTML = '<p class="custom">Custom Content</p>';
            testContainer.appendChild(customParent);

            expect(query('.custom', customParent)).toBe(customParent.querySelector('.custom'));
            expect(query('.custom', testContainer)).toBe(testContainer.querySelector('.custom'));
        });
    });

    describe('queryAll', () => {
        beforeEach(() => {
            testContainer.innerHTML = `
                <div class="test-class">Div 1</div>
                <div class="test-class">Div 2</div>
                <span class="test-class">Span 1</span>
                <p class="different">Paragraph</p>
            `;
        });

        it('should find all matching elements', () => {
            const elements = queryAll('.test-class');
            expect(elements).toHaveLength(3);
            expect(elements[0].tagName).toBe('DIV');
            expect(elements[1].tagName).toBe('DIV');
            expect(elements[2].tagName).toBe('SPAN');
        });

        it('should return empty array for non-existing elements', () => {
            expect(queryAll('.non-existing')).toEqual([]);
        });

        it('should throw for invalid selectors', () => {
            expect(() => queryAll('')).toThrow();
            // Valid string selectors should not throw
            expect(queryAll('.non-existing')).toEqual([]);
        });

        it('should work with custom parent element', () => {
            const customParent = document.createElement('div');
            customParent.innerHTML = '<span class="custom">Custom 1</span><span class="custom">Custom 2</span>';
            testContainer.appendChild(customParent);

            const elements = queryAll('.custom', customParent);
            expect(elements).toHaveLength(2);
        });
    });

    describe('requireElement', () => {
        beforeEach(() => {
            testContainer.innerHTML = '<div id="existing-element">Existing</div>';
        });

        it('should return element when it exists', () => {
            const element = requireElement('#existing-element');
            expect(element).toBe(testContainer.querySelector('#existing-element'));
        });

        it('should throw error when element does not exist', () => {
            expect(() => requireElement('#non-existing')).toThrow('Required element not found: #non-existing');
        });

        it('should throw error for invalid selectors', () => {
            expect(() => requireElement('')).toThrow();
            expect(() => requireElement('#non-existing')).toThrow('Required element not found: #non-existing');
        });

        it('should work with custom parent and provide proper error message', () => {
            const customParent = document.createElement('div');
            customParent.innerHTML = '<p class="custom">Custom</p>';

            expect(requireElement('.custom', customParent)).toBe(customParent.querySelector('.custom'));
            expect(() => requireElement('.missing', customParent)).toThrow('Required element not found: .missing');
        });
    });

    describe('setText', () => {
        let testElement;

        beforeEach(() => {
            testElement = document.createElement('div');
            testContainer.appendChild(testElement);
        });

        it('should set text content for valid elements', () => {
            setText(testElement, 'New Text Content');
            expect(testElement.textContent).toBe('New Text Content');
        });

        it('should handle empty text', () => {
            testElement.textContent = 'Original Text';
            setText(testElement, '');
            expect(testElement.textContent).toBe('');
        });

        it('should handle null/undefined text (no change)', () => {
            testElement.textContent = 'Original Text';
            setText(testElement, null);
            expect(testElement.textContent).toBe('Original Text');

            setText(testElement, undefined);
            expect(testElement.textContent).toBe('Original Text');
        });

        it('should do nothing for invalid elements', () => {
            setText(null, 'Text');
            setText(undefined, 'Text');
            setText('not-element', 'Text');
            // Should not throw errors
        });

        it('should convert non-string values to strings', () => {
            setText(testElement, 123);
            expect(testElement.textContent).toBe('123');
        });
    });

    describe('addClass', () => {
        let testElement;

        beforeEach(() => {
            testElement = document.createElement('div');
            testElement.className = 'existing-class';
            testContainer.appendChild(testElement);
        });

        it('should add single CSS classes to valid elements', () => {
            addClass(testElement, 'new-class');
            expect(testElement.classList.contains('new-class')).toBe(true);
            expect(testElement.classList.contains('existing-class')).toBe(true);
        });

        it('should handle adding to elements one class at a time', () => {
            addClass(testElement, 'class1');
            addClass(testElement, 'class2');
            addClass(testElement, 'class3');
            expect(testElement.classList.contains('class1')).toBe(true);
            expect(testElement.classList.contains('class2')).toBe(true);
            expect(testElement.classList.contains('class3')).toBe(true);
        });

        it('should do nothing for invalid elements', () => {
            addClass(null, 'test-class');
            addClass(undefined, 'test-class');
            addClass('not-element', 'test-class');
            // Should not throw errors
        });

        it('should throw for empty class names', () => {
            const originalClasses = testElement.className;
            expect(() => addClass(testElement, '')).toThrow();
            // Element should remain unchanged since error was thrown
            expect(testElement.className).toBe(originalClasses);
        });

        it('should not add duplicate classes', () => {
            addClass(testElement, 'existing-class');
            expect(testElement.classList.length).toBe(1);
        });
    });

    describe('removeClass', () => {
        let testElement;

        beforeEach(() => {
            testElement = document.createElement('div');
            testElement.className = 'class1 class2 class3';
            testContainer.appendChild(testElement);
        });

        it('should remove single CSS classes from valid elements', () => {
            removeClass(testElement, 'class2');
            expect(testElement.classList.contains('class1')).toBe(true);
            expect(testElement.classList.contains('class2')).toBe(false);
            expect(testElement.classList.contains('class3')).toBe(true);
        });

        it('should handle removing classes one at a time', () => {
            removeClass(testElement, 'class1');
            removeClass(testElement, 'class3');
            expect(testElement.classList.contains('class1')).toBe(false);
            expect(testElement.classList.contains('class2')).toBe(true);
            expect(testElement.classList.contains('class3')).toBe(false);
        });

        it('should do nothing for invalid elements', () => {
            removeClass(null, 'test-class');
            removeClass(undefined, 'test-class');
            removeClass('not-element', 'test-class');
            // Should not throw errors
        });

        it('should handle non-existing classes gracefully', () => {
            const originalClasses = testElement.className;
            removeClass(testElement, 'non-existing-class');
            expect(testElement.className).toBe(originalClasses);
        });

        it('should throw for empty class names', () => {
            const originalClasses = testElement.className;
            expect(() => removeClass(testElement, '')).toThrow();
            // Element should remain unchanged since error was thrown
            expect(testElement.className).toBe(originalClasses);
        });
    });

    describe('setDisabled', () => {
        let inputElement, buttonElement, selectElement;

        beforeEach(() => {
            inputElement = document.createElement('input');
            buttonElement = document.createElement('button');
            selectElement = document.createElement('select');
            testContainer.appendChild(inputElement);
            testContainer.appendChild(buttonElement);
            testContainer.appendChild(selectElement);
        });

        it('should set disabled property for form elements', () => {
            setDisabled(inputElement, true);
            setDisabled(buttonElement, true);
            setDisabled(selectElement, true);

            expect(inputElement.disabled).toBe(true);
            expect(buttonElement.disabled).toBe(true);
            expect(selectElement.disabled).toBe(true);
        });

        it('should enable form elements', () => {
            inputElement.disabled = true;
            buttonElement.disabled = true;
            selectElement.disabled = true;

            setDisabled(inputElement, false);
            setDisabled(buttonElement, false);
            setDisabled(selectElement, false);

            expect(inputElement.disabled).toBe(false);
            expect(buttonElement.disabled).toBe(false);
            expect(selectElement.disabled).toBe(false);
        });

        it('should do nothing for invalid elements', () => {
            setDisabled(null, true);
            setDisabled(undefined, true);
            setDisabled('not-element', true);
            // Should not throw errors
        });

        it('should handle non-form elements gracefully (no disabled property)', () => {
            const divElement = document.createElement('div');
            testContainer.appendChild(divElement);

            setDisabled(divElement, true);
            // Div doesn't have disabled property, so setDisabled does nothing
            expect('disabled' in divElement).toBe(false);
        });

        it('should handle truthy/falsy values', () => {
            setDisabled(inputElement, 1);
            expect(inputElement.disabled).toBe(true);

            setDisabled(inputElement, 0);
            expect(inputElement.disabled).toBe(false);

            setDisabled(inputElement, 'true');
            expect(inputElement.disabled).toBe(true);

            setDisabled(inputElement, '');
            expect(inputElement.disabled).toBe(false);
        });
    });

    describe('getValue', () => {
        let inputElement, selectElement, textareaElement;

        beforeEach(() => {
            inputElement = document.createElement('input');
            inputElement.type = 'text';
            inputElement.value = 'test-value';

            selectElement = document.createElement('select');
            const option = document.createElement('option');
            option.value = 'option-value';
            option.selected = true;
            selectElement.appendChild(option);

            textareaElement = document.createElement('textarea');
            textareaElement.value = 'textarea-value';

            testContainer.appendChild(inputElement);
            testContainer.appendChild(selectElement);
            testContainer.appendChild(textareaElement);
        });

        it('should get value from form elements', () => {
            expect(getValue(inputElement)).toBe('test-value');
            expect(getValue(selectElement)).toBe('option-value');
            expect(getValue(textareaElement)).toBe('textarea-value');
        });

        it('should return undefined for elements without value', () => {
            const divElement = document.createElement('div');
            expect(getValue(divElement)).toBeUndefined();
        });

        it('should return undefined for invalid elements', () => {
            expect(getValue(null)).toBeUndefined();
            expect(getValue(undefined)).toBeUndefined();
        });

        it('should handle different input types', () => {
            const numberInput = document.createElement('input');
            numberInput.type = 'number';
            numberInput.value = '123';

            const checkboxInput = document.createElement('input');
            checkboxInput.type = 'checkbox';
            checkboxInput.value = 'checkbox-value';

            expect(getValue(numberInput)).toBe('123');
            expect(getValue(checkboxInput)).toBe('checkbox-value');
        });
    });

    describe('setValue', () => {
        let inputElement, selectElement, textareaElement;

        beforeEach(() => {
            inputElement = document.createElement('input');
            inputElement.type = 'text';

            selectElement = document.createElement('select');
            const option1 = document.createElement('option');
            option1.value = 'option1';
            const option2 = document.createElement('option');
            option2.value = 'option2';
            selectElement.appendChild(option1);
            selectElement.appendChild(option2);

            textareaElement = document.createElement('textarea');

            testContainer.appendChild(inputElement);
            testContainer.appendChild(selectElement);
            testContainer.appendChild(textareaElement);
        });

        it('should set value for form elements', () => {
            setValue(inputElement, 'new-input-value');
            setValue(selectElement, 'option2');
            setValue(textareaElement, 'new-textarea-value');

            expect(inputElement.value).toBe('new-input-value');
            expect(selectElement.value).toBe('option2');
            expect(textareaElement.value).toBe('new-textarea-value');
        });

        it('should do nothing for invalid elements', () => {
            setValue(null, 'value');
            setValue(undefined, 'value');
            setValue('not-element', 'value');
            // Should not throw errors
        });

        it('should handle non-form elements gracefully (no value property)', () => {
            const divElement = document.createElement('div');
            setValue(divElement, 'div-value');
            // Div doesn't have value property, so setValue does nothing
            expect('value' in divElement).toBe(false);
        });

        it('should handle null/undefined values (no change)', () => {
            inputElement.value = 'original';
            setValue(inputElement, null);
            expect(inputElement.value).toBe('original');

            setValue(inputElement, undefined);
            expect(inputElement.value).toBe('original');
        });
    });

    describe('setChecked', () => {
        let checkboxElement, radioElement;

        beforeEach(() => {
            checkboxElement = document.createElement('input');
            checkboxElement.type = 'checkbox';

            radioElement = document.createElement('input');
            radioElement.type = 'radio';

            testContainer.appendChild(checkboxElement);
            testContainer.appendChild(radioElement);
        });

        it('should set checked property for checkable elements', () => {
            setChecked(checkboxElement, true);
            setChecked(radioElement, true);

            expect(checkboxElement.checked).toBe(true);
            expect(radioElement.checked).toBe(true);
        });

        it('should uncheck elements', () => {
            checkboxElement.checked = true;
            radioElement.checked = true;

            setChecked(checkboxElement, false);
            setChecked(radioElement, false);

            expect(checkboxElement.checked).toBe(false);
            expect(radioElement.checked).toBe(false);
        });

        it('should do nothing for invalid elements', () => {
            setChecked(null, true);
            setChecked(undefined, true);
            setChecked('not-element', true);
            // Should not throw errors
        });

        it('should handle non-checkable elements gracefully', () => {
            const textInput = document.createElement('input');
            textInput.type = 'text';

            setChecked(textInput, true);
            expect(textInput.checked).toBe(true);
        });

        it('should handle truthy/falsy values', () => {
            setChecked(checkboxElement, 1);
            expect(checkboxElement.checked).toBe(true);

            setChecked(checkboxElement, 0);
            expect(checkboxElement.checked).toBe(false);

            setChecked(checkboxElement, 'true');
            expect(checkboxElement.checked).toBe(true);

            setChecked(checkboxElement, '');
            expect(checkboxElement.checked).toBe(false);
        });
    });

    describe('getChecked', () => {
        let checkboxElement, radioElement, textInput;

        beforeEach(() => {
            checkboxElement = document.createElement('input');
            checkboxElement.type = 'checkbox';

            radioElement = document.createElement('input');
            radioElement.type = 'radio';

            textInput = document.createElement('input');
            textInput.type = 'text';

            testContainer.appendChild(checkboxElement);
            testContainer.appendChild(radioElement);
            testContainer.appendChild(textInput);
        });

        it('should get checked property from checkable elements', () => {
            checkboxElement.checked = true;
            radioElement.checked = false;

            expect(getChecked(checkboxElement)).toBe(true);
            expect(getChecked(radioElement)).toBe(false);
        });

        it('should return undefined for invalid elements', () => {
            expect(getChecked(null)).toBeUndefined();
            expect(getChecked(undefined)).toBeUndefined();
        });

        it('should return undefined for elements without checked property', () => {
            const divElement = document.createElement('div');
            expect(getChecked(divElement)).toBeUndefined();
        });
    });

    describe('setStyle', () => {
        let testElement;

        beforeEach(() => {
            testElement = document.createElement('div');
            testContainer.appendChild(testElement);
        });

        it('should set CSS styles for valid elements using setProperty', () => {
            setStyle(testElement, 'color', 'red');
            setStyle(testElement, 'font-size', '16px');
            setStyle(testElement, 'background-color', 'blue');

            expect(testElement.style.color).toBe('red');
            expect(testElement.style.fontSize).toBe('16px');
            expect(testElement.style.backgroundColor).toBe('blue');
        });

        it('should do nothing for invalid elements', () => {
            setStyle(null, 'color', 'red');
            setStyle(undefined, 'color', 'red');
            setStyle('not-element', 'color', 'red');
            // Should not throw errors
        });

        it('should handle various CSS properties', () => {
            setStyle(testElement, 'display', 'none');
            setStyle(testElement, 'margin', '10px');
            setStyle(testElement, 'border', '1px solid black');

            expect(testElement.style.display).toBe('none');
            expect(testElement.style.margin).toBe('10px');
            expect(testElement.style.border).toBe('1px solid black');
        });

        it('should handle empty or null values', () => {
            testElement.style.color = 'red';
            setStyle(testElement, 'color', '');
            expect(testElement.style.color).toBe('');

            setStyle(testElement, 'fontSize', null);
            setStyle(testElement, 'margin', undefined);
        });
    });

    describe('clearElement', () => {
        let testElement;

        beforeEach(() => {
            testElement = document.createElement('div');
            testElement.innerHTML = '<p>Child 1</p><span>Child 2</span><div>Child 3</div>';
            testContainer.appendChild(testElement);
        });

        it('should clear all children from valid elements', () => {
            expect(testElement.children.length).toBe(3);
            clearElement(testElement);
            expect(testElement.children.length).toBe(0);
            expect(testElement.innerHTML).toBe('');
        });

        it('should do nothing for invalid elements', () => {
            clearElement(null);
            clearElement(undefined);
            clearElement('not-element');
            // Should not throw errors
        });

        it('should handle already empty elements', () => {
            const emptyElement = document.createElement('div');
            testContainer.appendChild(emptyElement);

            clearElement(emptyElement);
            expect(emptyElement.innerHTML).toBe('');
        });

        it('should clear both elements and text nodes', () => {
            testElement.innerHTML = '<p>Element</p>Text Node<span>Another Element</span>';
            clearElement(testElement);
            expect(testElement.innerHTML).toBe('');
        });
    });

    describe('on', () => {
        let testElement, mockHandler;

        beforeEach(() => {
            testElement = document.createElement('button');
            testContainer.appendChild(testElement);
            mockHandler = vi.fn();
        });

        it('should attach event listeners to valid elements', () => {
            on(testElement, 'click', mockHandler);

            testElement.click();
            expect(mockHandler).toHaveBeenCalledTimes(1);
        });

        it('should handle multiple event types', () => {
            const mockMouseOver = vi.fn();
            const mockMouseOut = vi.fn();

            on(testElement, 'mouseover', mockMouseOver);
            on(testElement, 'mouseout', mockMouseOut);

            testElement.dispatchEvent(new Event('mouseover'));
            testElement.dispatchEvent(new Event('mouseout'));

            expect(mockMouseOver).toHaveBeenCalledTimes(1);
            expect(mockMouseOut).toHaveBeenCalledTimes(1);
        });

        it('should do nothing for invalid elements', () => {
            on(null, 'click', mockHandler);
            on(undefined, 'click', mockHandler);
            on('not-element', 'click', mockHandler);
            // Should not throw errors
        });

        it('should handle custom events', () => {
            on(testElement, 'customEvent', mockHandler);

            const customEvent = new CustomEvent('customEvent', { detail: { data: 'test' } });
            testElement.dispatchEvent(customEvent);

            expect(mockHandler).toHaveBeenCalledTimes(1);
            expect(mockHandler).toHaveBeenCalledWith(customEvent);
        });

        it('should handle elements without addEventListener method', () => {
            const mockElement = {};
            on(mockElement, 'click', mockHandler);
            // Should not throw error
        });

        it('should pass event object to handler', () => {
            on(testElement, 'click', mockHandler);

            const clickEvent = new MouseEvent('click', { bubbles: true });
            testElement.dispatchEvent(clickEvent);

            expect(mockHandler).toHaveBeenCalledWith(clickEvent);
        });
    });

    describe('getData', () => {
        let testElement;

        beforeEach(() => {
            testElement = document.createElement('div');
            testElement.dataset.testKey = 'test-value';
            testElement.dataset.anotherKey = 'another-value';
            testContainer.appendChild(testElement);
        });

        it('should get data attributes from valid elements', () => {
            expect(getData(testElement, 'testKey')).toBe('test-value');
            expect(getData(testElement, 'anotherKey')).toBe('another-value');
        });

        it('should return undefined for non-existing data attributes', () => {
            expect(getData(testElement, 'nonExisting')).toBeUndefined();
        });

        it('should return undefined for invalid elements', () => {
            expect(getData(null, 'testKey')).toBeUndefined();
            expect(getData(undefined, 'testKey')).toBeUndefined();
            expect(getData('not-element', 'testKey')).toBeUndefined();
        });

        it('should handle elements without dataset property', () => {
            const mockElement = {};
            expect(getData(mockElement, 'testKey')).toBeUndefined();
        });

        it('should handle various data key formats', () => {
            testElement.dataset.camelCase = 'camel-value';
            testElement.dataset.kebabCase = 'kebab-value';
            testElement.dataset.number123 = 'number-value';

            expect(getData(testElement, 'camelCase')).toBe('camel-value');
            expect(getData(testElement, 'kebabCase')).toBe('kebab-value');
            expect(getData(testElement, 'number123')).toBe('number-value');
        });
    });

    describe('setData', () => {
        let testElement;

        beforeEach(() => {
            testElement = document.createElement('div');
            testContainer.appendChild(testElement);
        });

        it('should set data attributes on valid elements', () => {
            setData(testElement, 'testKey', 'test-value');
            setData(testElement, 'anotherKey', 'another-value');

            expect(testElement.dataset.testKey).toBe('test-value');
            expect(testElement.dataset.anotherKey).toBe('another-value');
        });

        it('should do nothing for invalid elements', () => {
            setData(null, 'testKey', 'value');
            setData(undefined, 'testKey', 'value');
            setData('not-element', 'testKey', 'value');
            // Should not throw errors
        });

        it('should handle elements without dataset property', () => {
            const mockElement = {};
            setData(mockElement, 'testKey', 'value');
            // Should not throw error
        });

        it('should convert values to strings', () => {
            setData(testElement, 'numberValue', 123);
            setData(testElement, 'booleanValue', true);
            setData(testElement, 'nullValue', null);

            expect(testElement.dataset.numberValue).toBe('123');
            expect(testElement.dataset.booleanValue).toBe('true');
            expect(testElement.dataset.nullValue).toBe('null');
        });

        it('should handle various data key formats', () => {
            setData(testElement, 'camelCase', 'camel-value');
            setData(testElement, 'number123', 'number-value');

            expect(testElement.dataset.camelCase).toBe('camel-value');
            expect(testElement.dataset.number123).toBe('number-value');
        });
    });

    describe('focus', () => {
        let focusableElement, nonFocusableElement;

        beforeEach(() => {
            focusableElement = document.createElement('input');
            focusableElement.type = 'text';

            nonFocusableElement = document.createElement('div');

            testContainer.appendChild(focusableElement);
            testContainer.appendChild(nonFocusableElement);
        });

        it('should focus valid focusable elements', () => {
            const mockFocus = vi.fn();
            focusableElement.focus = mockFocus;

            focus(focusableElement);
            expect(mockFocus).toHaveBeenCalledTimes(1);
        });

        it('should do nothing for invalid elements', () => {
            focus(null);
            focus(undefined);
            focus('not-element');
            // Should not throw errors
        });

        it('should handle elements without focus method', () => {
            focus(nonFocusableElement);
            // Should not throw error even though div might not have focus method
        });

        it('should not handle elements with focus method that throws', () => {
            const elementWithBrokenFocus = document.createElement('input');
            elementWithBrokenFocus.focus = () => {
                throw new Error('Focus failed');
            };

            // This will throw since focus() doesn't have error handling
            expect(() => focus(elementWithBrokenFocus)).toThrow('Focus failed');
        });

        it('should work with various focusable element types', () => {
            const button = document.createElement('button');
            const select = document.createElement('select');
            const textarea = document.createElement('textarea');

            const mockButtonFocus = vi.fn();
            const mockSelectFocus = vi.fn();
            const mockTextareaFocus = vi.fn();

            button.focus = mockButtonFocus;
            select.focus = mockSelectFocus;
            textarea.focus = mockTextareaFocus;

            focus(button);
            focus(select);
            focus(textarea);

            expect(mockButtonFocus).toHaveBeenCalledTimes(1);
            expect(mockSelectFocus).toHaveBeenCalledTimes(1);
            expect(mockTextareaFocus).toHaveBeenCalledTimes(1);
        });
    });

    describe('Integration Tests', () => {
        it('should work with chained operations', () => {
            const element = document.createElement('div');
            testContainer.appendChild(element);

            // Chain multiple operations (one class at a time)
            setText(element, 'Initial Text');
            addClass(element, 'test-class');
            addClass(element, 'active');
            setStyle(element, 'color', 'red');
            setData(element, 'testId', '123');

            expect(element.textContent).toBe('Initial Text');
            expect(element.classList.contains('test-class')).toBe(true);
            expect(element.classList.contains('active')).toBe(true);
            expect(element.style.color).toBe('red');
            expect(element.dataset['testId']).toBe('123');

            // Modify existing element
            setText(element, 'Updated Text');
            removeClass(element, 'active');
            setStyle(element, 'background-color', 'blue');

            expect(element.textContent).toBe('Updated Text');
            expect(element.classList.contains('test-class')).toBe(true);
            expect(element.classList.contains('active')).toBe(false);
            expect(element.style.backgroundColor).toBe('blue');
        });

        it('should handle complex form interactions', () => {
            const form = document.createElement('form');
            const input = document.createElement('input');
            const checkbox = document.createElement('input');
            const button = document.createElement('button');

            input.type = 'text';
            input.name = 'testInput';
            checkbox.type = 'checkbox';
            checkbox.name = 'testCheckbox';

            form.appendChild(input);
            form.appendChild(checkbox);
            form.appendChild(button);
            testContainer.appendChild(form);

            // Set up form
            setValue(input, 'form-value');
            setChecked(checkbox, true);
            setDisabled(button, false);
            addClass(form, 'active-form');

            expect(getValue(input)).toBe('form-value');
            expect(getChecked(checkbox)).toBe(true);
            expect(button.disabled).toBe(false);
            expect(form.classList.contains('active-form')).toBe(true);

            // Disable form
            setDisabled(input, true);
            setDisabled(checkbox, true);
            setDisabled(button, true);
            removeClass(form, 'active-form');
            addClass(form, 'disabled-form');

            expect(input.disabled).toBe(true);
            expect(checkbox.disabled).toBe(true);
            expect(button.disabled).toBe(true);
            expect(form.classList.contains('disabled-form')).toBe(true);
        });

        it('should handle error scenarios gracefully', () => {
            // All these operations should not throw errors
            const invalidElements = [null, undefined];

            invalidElements.forEach(invalid => {
                setText(invalid, 'text');
                addClass(invalid, 'class');
                removeClass(invalid, 'class');
                setDisabled(invalid, true);
                setValue(invalid, 'value');
                setChecked(invalid, true);
                setStyle(invalid, 'color', 'red');
                clearElement(invalid);
                on(invalid, 'click', () => {});
                setData(invalid, 'key', 'value');
                focus(invalid);

                expect(getValue(invalid)).toBeUndefined();
                expect(getChecked(invalid)).toBeUndefined();
                expect(getData(invalid, 'key')).toBeUndefined();
            });
        });
    });

    describe('Performance Tests', () => {
        it('should handle large numbers of elements efficiently', () => {
            const elements = [];
            const startTime = performance.now();

            // Create many elements
            for (let i = 0; i < 1000; i++) {
                const element = document.createElement('div');
                element.id = `test-element-${i}`;
                testContainer.appendChild(element);
                elements.push(element);
            }

            // Perform operations on all elements
            elements.forEach((element, index) => {
                setText(element, `Text ${index}`);
                addClass(element, `class-${index}`);
                setData(element, 'index', index.toString());
            });

            const endTime = performance.now();
            const duration = endTime - startTime;

            // Should complete in reasonable time (less than 1 second)
            expect(duration).toBeLessThan(1000);

            // Verify operations worked
            expect(elements[0].textContent).toBe('Text 0');
            expect(elements[999].textContent).toBe('Text 999');
            expect(elements[500].classList.contains('class-500')).toBe(true);
            expect(getData(elements[250], 'index')).toBe('250');
        });
    });
});
