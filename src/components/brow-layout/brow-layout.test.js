import { expect } from '@esm-bundle/chai';
import './index.js';

describe('brow-layout', () => {
  let element;

  beforeEach(() => {
    element = document.createElement('brow-layout');
    document.body.appendChild(element);
  });

  afterEach(() => {
    element.remove();
  });

  it('should be defined', () => {
    expect(customElements.get('brow-layout')).to.exist;
  });

  it('should have default height 100%', () => {
    expect(element.height).to.equal('100%');
  });

  it('should have default width 100%', () => {
    expect(element.width).to.equal('100%');
  });

  it('should have default padding space-3', () => {
    expect(element.padding).to.equal('space-3');
  });

  it('should reflect height attribute', () => {
    element.height = '500px';
    expect(element.getAttribute('height')).to.equal('500px');
  });

  it('should reflect width attribute', () => {
    element.width = '80%';
    expect(element.getAttribute('width')).to.equal('80%');
  });

  it('should reflect padding attribute', () => {
    element.padding = 'space-4';
    expect(element.getAttribute('padding')).to.equal('space-4');
  });

  it('should render named slots for header, content, footer, start, end', () => {
    const slots = element.shadowRoot.querySelectorAll('slot');
    const names = [...slots].map((s) => s.getAttribute('name'));
    expect(names).to.include('header');
    expect(names).to.include('content');
    expect(names).to.include('footer');
    expect(names).to.include('start');
    expect(names).to.include('end');
  });
});
