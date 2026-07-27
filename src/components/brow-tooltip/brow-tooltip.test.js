import { expect } from '@esm-bundle/chai';
import './index.js';

describe('brow-tooltip', () => {
  let element;

  beforeEach(() => {
    element = document.createElement('brow-tooltip');
    document.body.appendChild(element);
  });

  afterEach(() => {
    element.remove();
  });

  it('should be defined', () => {
    expect(customElements.get('brow-tooltip')).to.exist;
  });

  it('should have default placement top', () => {
    expect(element.placement).to.equal('top');
  });

  it('should have default delay 200', () => {
    expect(element.delay).to.equal(200);
  });

  it('should reflect text attribute', () => {
    element.text = 'Hello world';
    expect(element.getAttribute('text')).to.equal('Hello world');
  });

  it('should reflect placement attribute', () => {
    element.placement = 'bottom';
    expect(element.getAttribute('placement')).to.equal('bottom');
  });

  it('should reflect delay attribute', () => {
    element.delay = 500;
    expect(element.getAttribute('delay')).to.equal('500');
  });

  it('should render trigger part', () => {
    expect(element.shadowRoot.querySelector('[part="trigger"]')).to.exist;
  });

  it('should render layer part with popover', () => {
    const layer = element.shadowRoot.querySelector('[part="layer"]');
    expect(layer).to.exist;
    expect(layer.getAttribute('popover')).to.equal('manual');
  });

  it('should render tooltip role', () => {
    expect(element.shadowRoot.querySelector('[role="tooltip"]')).to.exist;
  });
});
