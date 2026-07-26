/**
 * hydrate.js — Client-side hydration patch for Declarative Shadow DOM.
 *
 * Load this BEFORE component modules. Use a regular <script> tag (not type="module")
 * so it executes before the deferred ES module that defines the components.
 *
 * Why this is needed:
 * Brownie components call attachShadow({mode: 'open'}) in their constructors.
 * With DSD, the browser already created a shadow root from the
 * <template shadowrootmode="open"> in the HTML. Calling attachShadow() on an
 * element that already has a shadow root would throw in some browsers.
 *
 * This patch makes attachShadow() return the existing DSD shadow root when
 * one already exists, instead of throwing. In Chrome 124+ this behavior is
 * built-in; this patch is a safety net for broader compatibility.
 *
 * After attachShadow returns the existing root, the component's connectedCallback
 * calls render() which sets innerHTML to the same content that was already in
 * the DSD template — no visual change. The adoptedStyleSheets assignment replaces
 * the <style> tag with the equivalent constructable stylesheet — same CSS.
 */
(function () {
  var origAttachShadow = HTMLElement.prototype.attachShadow;

  HTMLElement.prototype.attachShadow = function (init) {
    // If DSD already created a shadow root, return it instead of throwing
    if (this.shadowRoot) {
      return this.shadowRoot;
    }
    return origAttachShadow.call(this, init);
  };
})();
