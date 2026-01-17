import { expect } from '@esm-bundle/chai';
import '../src/components/brow-button.js';

describe('brow-button', () => {
  let element;

  beforeEach(() => {
    element = document.createElement('brow-button');
    document.body.appendChild(element);
  });

  afterEach(() => {
    element.remove();
  });

  it('should be defined', () => {
    expect(customElements.get('brow-button')).to.exist;
  });

  it('should render with default variant', () => {
    expect(element.variant).to.equal('default');
  });

  it('should reflect variant attribute', () => {
    element.variant = 'primary';
    expect(element.getAttribute('variant')).to.equal('primary');
  });

  it('should handle disabled state', () => {
    element.disabled = true;
    expect(element.hasAttribute('disabled')).to.be.true;

    element.disabled = false;
    expect(element.hasAttribute('disabled')).to.be.false;
  });

  it('should render slot content', async () => {
    element.textContent = 'Click me';
    await new Promise(resolve => setTimeout(resolve, 0));

    const slot = element.shadowRoot.querySelector('slot');
    expect(slot).to.exist;
  });
});
