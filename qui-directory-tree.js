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
  `;

  static properties = {
    directory: { type: Array },
    header: { type: String },
    _expandedItems: { type: Array },
  };

  constructor() {
    super();
    this.directory = [];
    this._expandedItems = [];
    this.header = "";
  }

  render() {
    return html`
      <vaadin-grid theme="compact no-border no-row-borders"
        .dataProvider="${this._dataProvider.bind(this)}"
        .expandedItems="${this._expandedItems}"
      >
        <vaadin-grid-column auto-width
          header="${this.header}"
          ${columnBodyRenderer(this._directoryRenderer.bind(this), [])}
        ></vaadin-grid-column>
      </vaadin-grid>
    `;
  }

  _directoryRenderer(item, model) {
    const path = this._buildPath(item);
    return html`
      <vaadin-grid-tree-toggle
        .leaf="${!item.children}"
        .level="${model.level ?? 0}"
        .expanded="${this._expandedItems.includes(item)}"
        @expanded-changed="${(e) => this._handleExpandedChanged(e, item)}"
        @click="${() => this._handleFileSelect(item, path)}"
      >
        ${item.name}
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
      if (current.name) {  // Only add if `name` is defined
        path = `${current.name}/${path}`;
      }
      current = current.parent;
    }

    return path;
  }

  // Data provider method for loading hierarchical data
  async _dataProvider(params, callback) {
    const parentItem = params.parentItem || { children: this.directory };
    const items = parentItem.children || [];

    // Add a `parent` reference to each item
    items.forEach((child) => {
      child.parent = parentItem !== this.directory ? parentItem : null;
    });

    callback(items, items.length);
  }
}

customElements.define('qui-directory-tree', QuiDirectoryTree);
