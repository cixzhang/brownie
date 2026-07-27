import { expect } from '@esm-bundle/chai';
import './index.js';

describe('brow-menu', () => {
  let element;

  beforeEach(() => {
    element = document.createElement('brow-menu');
    document.body.appendChild(element);
  });

  afterEach(() => {
    element.remove();
  });

  it('should be defined', () => {
    expect(customElements.get('brow-menu')).to.exist;
  });

  it('should also register brow-menu-item', () => {
    expect(customElements.get('brow-menu-item')).to.exist;
  });

  it('should have default placement bottom-end', () => {
    expect(element.placement).to.equal('bottom-end');
  });

  it('should reflect placement attribute', () => {
    element.placement = 'top-start';
    expect(element.getAttribute('placement')).to.equal('top-start');
  });

  it('should render trigger part with aria-haspopup', () => {
    const trigger = element.shadowRoot.querySelector('[part="trigger"]');
    expect(trigger).to.exist;
    expect(trigger.getAttribute('aria-haspopup')).to.equal('menu');
  });

  it('should render layer part with popover auto', () => {
    const layer = element.shadowRoot.querySelector('[part="layer"]');
    expect(layer).to.exist;
    expect(layer.getAttribute('popover')).to.equal('auto');
  });

  it('should render trigger and default slots', () => {
    const triggerSlot = element.shadowRoot.querySelector('slot[name="trigger"]');
    const defaultSlot = element.shadowRoot.querySelector('slot:not([name])');
    expect(triggerSlot).to.exist;
    expect(defaultSlot).to.exist;
  });
});
