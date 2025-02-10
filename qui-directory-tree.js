import { LitElement, html, css } from 'lit';

class QuiDirectoryTree extends LitElement {
  static properties = {
    directory: { type: Array }, // Directory data
    selectedPath: { type: String } // Currently selected path
  };

  constructor() {
    super();
    this.directory = [];
    this.selectedPath = '';
    this._collapsedPaths = new Set(); // Track collapsed nodes
  }

  static styles = css`
    :host {
      --tree-node-font-family: 'Arial', sans-serif;
      --tree-node-font-size: 14px;
      --tree-icon-size: 16px;
      --tree-node-bg-hover: #f0f0f0;
      --tree-node-bg-selected: #d0e8ff;
      --tree-node-color: black;
      --tree-node-selected-color: black;
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
      cursor: pointer;
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
  `;

  render() {
    return html`<ul class="tree">${this._renderTree(this.directory, '')}</ul>`;
  }

  _renderTree(nodes, currentPath) {
    return nodes.map((node) => {
      const path = currentPath ? `${currentPath}/${node.name}` : node.name;
      const isCollapsed = this._collapsedPaths.has(path);

      return html`
        <li>
          <div class="node ${this.selectedPath === path ? 'selected' : ''}">
            <span
              class="icon"
              @click="${(e) => this._toggleCollapse(e, path)}"
            >
              ${node.type === 'folder'
                ? isCollapsed
                  ? this._getIcon('folder-icon-closed')
                  : this._getIcon('folder-icon-open')
                : this._getIcon('file-icon')}
            </span>
            <span @click="${(e) => this._onNodeClick(e, path, node)}">${node.name}</span>
          </div>
          ${node.children && !isCollapsed
            ? html`<ul class="tree">${this._renderTree(node.children, path)}</ul>`
            : ''}
        </li>
      `;
    });
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
    this.selectedPath = path;
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
    this._collapsedPaths.clear(); // Remove all paths from the collapsed set
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
