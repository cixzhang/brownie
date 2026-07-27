import { expect } from '@esm-bundle/chai';
import './index.js';

describe('brow-select', () => {
  let element;

  beforeEach(() => {
    element = document.createElement('brow-select');
    document.body.appendChild(element);
  });

  afterEach(() => {
    element.remove();
  });

  it('should be defined', () => {
    expect(customElements.get('brow-select')).to.exist;
  });

  it('should also register brow-option', () => {
    expect(customElements.get('brow-option')).to.exist;
  });

  it('should also register brow-option-group', () => {
    expect(customElements.get('brow-option-group')).to.exist;
  });

  it('should have default placeholder', () => {
    expect(element.placeholder).to.equal('Select...');
  });

  it('should have null value by default', () => {
    expect(element.value).to.be.null;
  });

  it('should not be disabled by default', () => {
    expect(element.disabled).to.be.false;
  });

  it('should not be required by default', () => {
    expect(element.required).to.be.false;
  });

  it('should not be searchable by default', () => {
    expect(element.searchable).to.be.false;
  });

  it('should reflect placeholder attribute', () => {
    element.placeholder = 'Choose...';
    expect(element.getAttribute('placeholder')).to.equal('Choose...');
  });

  it('should reflect value attribute', () => {
    element.value = 'option1';
    expect(element.getAttribute('value')).to.equal('option1');
  });

  it('should reflect disabled attribute', () => {
    element.disabled = true;
    expect(element.hasAttribute('disabled')).to.be.true;
  });

  it('should reflect searchable attribute', () => {
    element.searchable = true;
    expect(element.hasAttribute('searchable')).to.be.true;
  });

  it('should render trigger part', () => {
    expect(element.shadowRoot.querySelector('[part="trigger"]')).to.exist;
  });

  it('should render layer part with popover', () => {
    const layer = element.shadowRoot.querySelector('[part="layer"]');
    expect(layer).to.exist;
    expect(layer.hasAttribute('popover')).to.be.true;
  });

  it('should render listbox part', () => {
    expect(element.shadowRoot.querySelector('[part="listbox"]')).to.exist;
  });
});
