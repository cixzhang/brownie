import { expect } from '@esm-bundle/chai';
import './index.js';

describe('brow-section', () => {
  let element;

  beforeEach(() => {
    element = document.createElement('brow-section');
    document.body.appendChild(element);
  });

  afterEach(() => {
    element.remove();
  });

  it('should be defined', () => {
    expect(customElements.get('brow-section')).to.exist;
  });

  it('should have default height 100%', () => {
    expect(element.height).to.equal('100%');
  });

  it('should have default width 100%', () => {
    expect(element.width).to.equal('100%');
  });

  it('should have default padding layout-padding', () => {
    expect(element.padding).to.equal('layout-padding');
  });

  it('should have undefined divider by default', () => {
    expect(element.divider).to.equal(undefined);
  });

  it('should reflect height attribute', () => {
    element.height = '300px';
    expect(element.getAttribute('height')).to.equal('300px');
  });

  it('should reflect width attribute', () => {
    element.width = '50%';
    expect(element.getAttribute('width')).to.equal('50%');
  });

  it('should reflect padding attribute', () => {
    element.padding = 'space-2';
    expect(element.getAttribute('padding')).to.equal('space-2');
  });

  it('should reflect variant attribute', () => {
    element.variant = 'muted';
    expect(element.getAttribute('variant')).to.equal('muted');
  });

  it('should render a default slot', () => {
    expect(element.shadowRoot.querySelector('slot')).to.exist;
  });
});
