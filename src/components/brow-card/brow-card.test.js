import { expect } from '@esm-bundle/chai';
import './index.js';

describe('brow-card', () => {
  let element;

  beforeEach(() => {
    element = document.createElement('brow-card');
    document.body.appendChild(element);
  });

  afterEach(() => {
    element.remove();
  });

  it('should be defined', () => {
    expect(customElements.get('brow-card')).to.exist;
  });

  it('should have default height auto', () => {
    expect(element.height).to.equal('auto');
  });

  it('should have default width auto', () => {
    expect(element.width).to.equal('auto');
  });

  it('should have default padding space-4', () => {
    expect(element.padding).to.equal('space-4');
  });

  it('should reflect height attribute', () => {
    element.height = '200px';
    expect(element.getAttribute('height')).to.equal('200px');
  });

  it('should reflect width attribute', () => {
    element.width = '50%';
    expect(element.getAttribute('width')).to.equal('50%');
  });

  it('should reflect padding attribute', () => {
    element.padding = 'space-2';
    expect(element.getAttribute('padding')).to.equal('space-2');
  });

  it('should render a base part div', () => {
    expect(element.shadowRoot.querySelector('[part="base"]')).to.exist;
  });

  it('should render a slot for content', () => {
    expect(element.shadowRoot.querySelector('slot')).to.exist;
  });

  it('should parse multi-value padding sides', () => {
    element.padding = 'space-1 space-2';
    const sides = element.getValuesForSides(element.padding);
    expect(sides.top).to.equal('space-1');
    expect(sides.end).to.equal('space-2');
  });
});
