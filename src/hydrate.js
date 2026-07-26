/**
 * Brownie Hydrate — Client-side hydration patch for Declarative Shadow DOM.
 *
 * This script MUST run before component modules load. It patches
 * HTMLElement.prototype.attachShadow() so that when a component's
 * constructor calls attachShadow() on an element that already has a
 * DSD shadow root (created by <template shadowrootmode="open">),
 * it returns the existing root instead of throwing.
 *
 * In Chrome 124+ this behavior is built-in. This patch is a safety
 * net for broader browser support.
 *
 * When served via Brownie SSR's page() function, this script is
 * automatically inlined in <head> as a regular <script> (not module),
 * ensuring it executes before any deferred ES module imports.
 *
 * To serve manually:
 *   <script src="/path/to/hydrate.js"></script>
 *   <!-- must be a regular script, not type="module" -->
 *   <!-- must appear before component module imports -->
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
