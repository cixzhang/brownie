/**
 * hydrate.js — DSD-aware attachShadow patch.
 * Same as the SSR example — makes attachShadow return existing DSD roots.
 */
(function () {
  var origAttachShadow = HTMLElement.prototype.attachShadow;
  HTMLElement.prototype.attachShadow = function (init) {
    if (this.shadowRoot) {
      return this.shadowRoot;
    }
    return origAttachShadow.call(this, init);
  };
})();
