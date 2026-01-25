/**
 * Interactive element utilities.
 *
 * Shared logic for detecting interactive elements and checking
 * if an element is naturally focusable.
 */

/**
 * Selector for interactive elements that should capture clicks
 * and prevent parent handlers from firing.
 */
export const INTERACTIVE_SELECTOR = 'a, button, input, select, textarea, [tabindex], [data-interactive]';

/**
 * Check if an element is naturally interactive/focusable.
 * Used to determine if we need to add tabindex for accessibility.
 *
 * @param {HTMLElement} el
 * @returns {boolean}
 */
export function isInteractive(el) {
  const interactiveTags = ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'];
  if (interactiveTags.includes(el.tagName)) return true;
  if (el.hasAttribute('tabindex')) return true;
  if (el.hasAttribute('contenteditable')) return true;
  return false;
}

/**
 * Check if a click event target is an interactive element within a container.
 * Used to prevent parent click handlers from firing when clicking on
 * buttons, links, inputs, etc.
 *
 * @param {Event} event - The click event
 * @param {Element} container - The container element to check within
 * @returns {boolean} True if the click target is an interactive element
 */
export function isInteractiveClick(event, container) {
  const target = /** @type {HTMLElement} */ (event.target);
  const interactive = target.closest(INTERACTIVE_SELECTOR);
  return !!(interactive && container.contains(interactive));
}
