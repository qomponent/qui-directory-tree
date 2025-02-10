import { LitElement, html, css } from 'lit';

class QuiDirectoryTree extends LitElement {
  static properties = {
    directory: { type: Array },
    selectedPath: { type: String },
    folderSelectable: { type: Boolean },
    contextMenuItems: { type: Array } // Context menu items for files
  };

  constructor() {
    super();
    this.directory = [];
    this.selectedPath = '';
    this.folderSelectable = false;
    this.contextMenuItems = []; // Default: no context menu
    this._collapsedPaths = new Set();
  }

  static styles = css`
    :host {

      --tree-node-font-family: var(--lumo-font-family, 'Arial', sans-serif);
      --tree-node-font-size: var(--lumo-font-size-m, 14px);
      --tree-icon-size: var(--lumo-icon-size-s, 16px);
      --tree-node-bg-hover: var(--lumo-contrast-5pct, #f0f0f0);
      --tree-node-bg-selected: var(--lumo-primary-color-50pct, #d0e8ff);
      --tree-node-color: var(--lumo-body-text-color, black);
      --tree-node-selected-color: var(--lumo-body-text-color, black);
      --folder-icon-closed: 📁;
      --folder-icon-open: 📂;
      --file-icon: 📄;
    }

    .tree {
      list-style: none;
      padding-left: 20px;
      font-family: var(--tree-node-font-family);
      font-size: var(--tree-node-font-size);
    }
    .node {
      padding: 5px;
      border-radius: 5px;
      display: flex;
      align-items: center;
      gap: 5px;
      color: var(--tree-node-color);
    }
    .node:hover {
      background-color: var(--tree-node-bg-hover);
    }
    .node.selected {
      background-color: var(--tree-node-bg-selected);
      color: var(--tree-node-selected-color);
    }
    .icon {
      font-size: var(--tree-icon-size);
    }

    .label {
      cursor: pointer;
    }

    .label.disabled {
      cursor: default;
    }

    .context-menu {
      position: absolute;
      background: var(--lumo-base-color, white);
      border: 1px solid var(--lumo-base-color, white);
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
      z-index: 1000;
    }
    .context-menu-item {
      padding: 5px 10px;
      cursor: pointer;
    }
    .context-menu-item:hover {
      background-color: var(--tree-node-bg-hover);
    }
  `;

  render() {
    return html`
      <ul class="tree">${this._renderTree(this.directory, '')}</ul>
      ${this._renderContextMenu()}
    `;
  }

  _renderTree(nodes, currentPath) {
    return nodes.map((node) => {
      const path = currentPath ? `${currentPath}/${node.name}` : node.name;
      const isCollapsed = this._collapsedPaths.has(path);
      const isFolder = node.type === 'folder';
      const isSelectable = isFolder ? this.folderSelectable : true;

      return html`
        <li>
          <div
            class="node ${this.selectedPath === path ? 'selected' : ''}"
            @contextmenu="${(e) => this._onContextMenu(e, path, node)}"
          >
            <span class="icon" @click="${(e) => this._toggleCollapse(e, path)}">
              ${isFolder
                ? isCollapsed
                  ? this._getIcon('folder-icon-closed')
                  : this._getIcon('folder-icon-open')
                : this._getIcon('file-icon')}
            </span>
            <span
              class="label ${!isSelectable ? 'disabled' : ''}"
              @click="${isSelectable ? (e) => this._onNodeClick(e, path, node) : null}"
            >
              ${node.name}
            </span>
          </div>
          ${node.children && !isCollapsed
            ? html`<ul class="tree">${this._renderTree(node.children, path)}</ul>`
            : ''}
        </li>
      `;
    });
  }

  _renderContextMenu() {
    if (!this._contextMenuData) return '';
    const { x, y, filePath, node } = this._contextMenuData;

    return html`
      <div class="context-menu" style="top: ${y}px; left: ${x}px;">
        ${this.contextMenuItems.map(
          (item) => html`
            <div
              class="context-menu-item"
              @click="${() => this._onContextMenuItemClick(item, filePath, node)}"
            >
              ${item.title}
            </div>
          `
        )}
      </div>
    `;
  }

  _getIcon(variableName) {
    return getComputedStyle(this).getPropertyValue(`--${variableName}`).trim() || '📄';
  }

  _toggleCollapse(event, path) {
    event.stopPropagation();
    if (this._collapsedPaths.has(path)) {
      this._collapsedPaths.delete(path);
    } else {
      this._collapsedPaths.add(path);
    }
    this.requestUpdate();
  }

  _onNodeClick(event, path, node) {
    event.stopPropagation();
    if (node.type === 'folder' && !this.folderSelectable) return;

    this.selectedPath = path;
    this._contextMenuData = null; // Hide context menu on selection
    this.dispatchEvent(
      new CustomEvent('file-select', {
        detail: {
          file: path,
          isFile: node.type === 'file',
          nodeType: node.type
        },
        bubbles: true,
        composed: true
      })
    );
  }

  _onContextMenu(event, filePath, node) {
    event.preventDefault();
    if (node.type !== 'file' || this.contextMenuItems.length === 0) return;

    this._contextMenuData = {
      x: event.clientX,
      y: event.clientY,
      filePath,
      node
    };
    this.requestUpdate();
  }

  _onContextMenuItemClick(item, filePath, node) {
    this._contextMenuData = null;
    this.requestUpdate();
    if (item.callback) item.callback(filePath, node);
  }

  selectFile(filePath) {
    this._expandToPath(filePath);
    this.selectedPath = filePath;
    this.requestUpdate();
  }

  _expandToPath(filePath) {
    const parts = filePath.split('/');
    let path = '';
    for (let i = 0; i < parts.length - 1; i++) {
      path = path ? `${path}/${parts[i]}` : parts[i];
      this._collapsedPaths.delete(path);
    }
  }

  expandAll() {
    this._collapsedPaths.clear();
    this.requestUpdate();
  }

  collapseAll() {
    const collectPaths = (nodes, currentPath = '') => {
      nodes.forEach((node) => {
        const path = currentPath ? `${currentPath}/${node.name}` : node.name;
        if (node.children) {
          this._collapsedPaths.add(path);
          collectPaths(node.children, path);
        }
      });
    };

    collectPaths(this.directory);
    this.requestUpdate();
  }
}

customElements.define('qui-directory-tree', QuiDirectoryTree);
