import { expect } from '@esm-bundle/chai';
import './index.js';

describe('brow-hovercard', () => {
  let element;

  beforeEach(() => {
    element = document.createElement('brow-hovercard');
    document.body.appendChild(element);
  });

  afterEach(() => {
    element.remove();
  });

  it('should be defined', () => {
    expect(customElements.get('brow-hovercard')).to.exist;
  });

  it('should have default placement bottom', () => {
    expect(element.placement).to.equal('bottom');
  });

  it('should have default delay 300', () => {
    expect(element.delay).to.equal(300);
  });

  it('should reflect placement attribute', () => {
    element.placement = 'top';
    expect(element.getAttribute('placement')).to.equal('top');
  });

  it('should reflect delay attribute', () => {
    element.delay = 500;
    expect(element.getAttribute('delay')).to.equal('500');
  });

  it('should render trigger part with aria-haspopup', () => {
    const trigger = element.shadowRoot.querySelector('[part="trigger"]');
    expect(trigger).to.exist;
    expect(trigger.getAttribute('aria-haspopup')).to.equal('dialog');
  });

  it('should render layer part with popover manual', () => {
    const layer = element.shadowRoot.querySelector('[part="layer"]');
    expect(layer).to.exist;
    expect(layer.getAttribute('popover')).to.equal('manual');
  });

  it('should render card part', () => {
    expect(element.shadowRoot.querySelector('[part="card"]')).to.exist;
  });

  it('should render trigger slot and default slot', () => {
    const triggerSlot = element.shadowRoot.querySelector('slot[name="trigger"]');
    const defaultSlot = element.shadowRoot.querySelector('slot:not([name])');
    expect(triggerSlot).to.exist;
    expect(defaultSlot).to.exist;
  });
});
