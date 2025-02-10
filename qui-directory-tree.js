import { LitElement, html, css } from 'lit';
import '@vaadin/grid';
import '@vaadin/grid/vaadin-grid-tree-column.js';
import '@vaadin/grid/vaadin-grid-tree-toggle.js';
import { columnBodyRenderer } from '@vaadin/grid/lit.js';

export class QuiDirectoryTree extends LitElement {

  static styles = css`
    vaadin-grid-tree-toggle {
      cursor: pointer;
    }
    .selected {
      background-color: var(--lumo-primary-color-50pct);
      color: var(--lumo-base-color);
    }
    .item {
      padding-right: 10px;
      padding-top: 3px;
      padding-bottom: 3px;
    }
  `;

  static properties = {
    directory: { type: Array },
    header: { type: String },
    _expandedItems: { type: Array },
    _selectedItem: { type: Object }, // Track the selected item
  };

  constructor() {
    super();
    this.directory = [];
    this._expandedItems = [];
    this._selectedItem = null;
    this.header = '';
  }

  render() {
    return html`
      <vaadin-grid
        theme="compact no-border no-row-borders"
        .dataProvider="${this._dataProvider.bind(this)}"
        .expandedItems="${this._expandedItems}"
      >
        <vaadin-grid-column
          auto-width
          header="${this.header}"
          ${columnBodyRenderer(this._directoryRenderer.bind(this), [])}
        ></vaadin-grid-column>
      </vaadin-grid>
    `;
  }

  _directoryRenderer(item, model) {
    const path = this._buildPath(item);
    const isSelected = this._selectedItem === item;
    return html`
      <vaadin-grid-tree-toggle
        class="${isSelected ? 'selected' : ''}"
        .leaf="${!item.children}"
        .level="${model.level ?? 0}"
        .expanded="${this._expandedItems.includes(item)}"
        @expanded-changed="${(e) => this._handleExpandedChanged(e, item)}"
        @click="${() => this._handleFileSelect(item, path)}"
      >
        <div class="item">${item.name}</div>
      </vaadin-grid-tree-toggle>
    `;
  }

  // Handle expansion state changes for folders
  _handleExpandedChanged(event, item) {
    if (event.detail.value) {
      this._expandedItems = [...this._expandedItems, item];
    } else {
      this._expandedItems = this._expandedItems.filter((i) => i !== item);
    }
  }

  // Emit file-select event if a file is selected
  _handleFileSelect(item, path) {
    if (item.type === 'file') {
      item.path = path;
      this._selectedItem = item; // Set the selected item
      this.dispatchEvent(
        new CustomEvent('file-select', {
          detail: { file: item },
          bubbles: true,
          composed: true,
        })
      );
    }
  }

  _buildPath(item) {
    let path = item.name;
    let current = item.parent;

    while (current) {
      if (current.name) {
        path = `${current.name}/${path}`;
      }
      current = current.parent;
    }

    return path;
  }

  async _dataProvider(params, callback) {
    const parentItem = params.parentItem || { children: this.directory };
    const items = parentItem.children || [];
    items.forEach((child) => {
      child.parent = parentItem !== this.directory ? parentItem : null;
    });
    callback(items, items.length);
  }

  selectFile(path) {
    const file = this._findFileByPath(this.directory, path.split('/'));
    if (file) {
      this._expandToFile(file);
      this._selectedItem = file;
    }
  }

  _findFileByPath(directory, segments) {
    if (!segments.length) return null;
    const [current, ...rest] = segments;
    const item = directory.find((child) => child.name === current);
    if (!item || !rest.length) return item;
    return this._findFileByPath(item.children || [], rest);
  }

  _expandToFile(file) {
    const toExpand = [];
    let current = file.parent;
    while (current) {
      toExpand.unshift(current);
      current = current.parent;
    }
    this._expandedItems = [...this._expandedItems, ...toExpand];
  }
}

customElements.define('qui-directory-tree', QuiDirectoryTree);