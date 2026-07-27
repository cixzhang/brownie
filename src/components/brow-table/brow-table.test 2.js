import { expect } from '@esm-bundle/chai';
import './index.js';

describe('brow-table', () => {
  let element;

  beforeEach(() => {
    element = document.createElement('brow-table');
    document.body.appendChild(element);
  });

  afterEach(() => {
    element.remove();
  });

  it('should be defined', () => {
    expect(customElements.get('brow-table')).to.exist;
  });

  it('should also register sub-components', () => {
    expect(customElements.get('brow-table-header')).to.exist;
    expect(customElements.get('brow-table-row')).to.exist;
    expect(customElements.get('brow-table-footer')).to.exist;
    expect(customElements.get('brow-table-empty')).to.exist;
    expect(customElements.get('brow-table-column')).to.exist;
    expect(customElements.get('brow-table-sort')).to.exist;
    expect(customElements.get('brow-table-select')).to.exist;
    expect(customElements.get('brow-table-paginate')).to.exist;
    expect(customElements.get('brow-table-tree')).to.exist;
  });

  it('should not be striped by default', () => {
    expect(element.striped).to.be.false;
  });

  it('should not be bordered by default', () => {
    expect(element.bordered).to.be.false;
  });

  it('should not be compact by default', () => {
    expect(element.compact).to.be.false;
  });

  it('should reflect striped attribute', () => {
    element.striped = true;
    expect(element.hasAttribute('striped')).to.be.true;
  });

  it('should reflect bordered attribute', () => {
    element.bordered = true;
    expect(element.hasAttribute('bordered')).to.be.true;
  });

  it('should reflect compact attribute', () => {
    element.compact = true;
    expect(element.hasAttribute('compact')).to.be.true;
  });

  it('should render a table with parts', () => {
    expect(element.shadowRoot.querySelector('[part="base"]')).to.exist;
    expect(element.shadowRoot.querySelector('[part="head"]')).to.exist;
    expect(element.shadowRoot.querySelector('[part="body"]')).to.exist;
  });
});
