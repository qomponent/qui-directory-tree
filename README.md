# qui-directory-tree
A Lit-based web component to show files in a directory structure.

## Installation

```bash
npm i @qomponent/qui-directory-tree
```

## Usage

```javascript


import { LitElement, html, css } from 'lit';
import '@qomponent/qui-directory-tree';

class MyMainComponent extends LitElement {
  static styles = css`
    .file-info {
      font-weight: bold;
      color: blue;
      margin-top: 10px;
    }
  `;

  static properties = {
    selectedFilePath: { type: String },
  };

  constructor() {
    super();
    this.selectedFilePath = '';
    this.directoryData = [
      {
        name: 'Folder1',
        type: 'folder',
        children: [
          { name: 'File1.txt', type: 'file' },
          {
            name: 'SubFolder1',
            type: 'folder',
            children: [{ name: 'File2.txt', type: 'file' }],
          },
        ],
      },
      { name: 'File3.txt', type: 'file' },
    ];
  }

  handleFileSelect(event) {
    const { file } = event.detail;
    this.selectedFilePath = file.path;
  }

  render() {
    return html`
      <h2>Directory Tree</h2>
      <qui-directory-tree
        .directory="${this.directoryData}"
        header="Files and Folders"
        @file-select="${this.handleFileSelect}"
      ></qui-directory-tree>

      ${this.selectedFilePath
        ? html`<div class="file-info">Selected File Path: ${this.selectedFilePath}</div>`
        : html`<div class="file-info">No file selected</div>`}
    `;
  }
}

customElements.define('my-main-component', MyMainComponent);


```

## Example

To run the example:

```bash
npm install
npm start
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first
to discuss what you would like to change.

## License

[Apache 2](http://www.apache.org/licenses/LICENSE-2.0)
