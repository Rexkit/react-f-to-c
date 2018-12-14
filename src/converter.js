class Converter {
  constructor (window) {
    this.window = window;
    this.supportedLangs = ['javascript', 'javascriptreact'];
  }

  getComponentName(source) {
    const dict = ['const', 'export', 'function', 'default'];
    const lineArr = source.split('\r', 1)[0].split(' ');
    let componentName = '';
    for (let word of lineArr) {
      if (dict.indexOf(word) !== -1) {
        continue;
      } else {
        word.indexOf('(') !== -1 ? componentName = word.split('(')[0] : componentName = word;
        break;
      }
    }

    // const endIndex = source.indexOf('(');
    // const startIndex = source.lastIndexOf(' ', endIndex);
    // const componentName = source.substring(startIndex+1, endIndex);

    return componentName;
  }

  convert(source) {
    let templateStrings = {
      'componentName': 'placeholder',
      'notRender': 'placeholder',
      'renderReturn': 'placeholder'
    };

    templateStrings.componentName = this.getComponentName(source);

    const template = `
class ${templateStrings.componentName} extends React.Component {
  constructor(props) {
    super(props);
  }

  ${templateStrings.notRender}

  render() {
    const {
      props,
    } = this;

    return (
      ${templateStrings.renderReturn}
    );
  }
}
    `;

    return template;
  }

  execute() {
    let editor = this.window.activeTextEditor;
      if (!editor) {
        return;
    }

    const doc = editor.document;

    if (this.supportedLangs.indexOf(doc.languageId) === -1) {
      const msg = 'only available for javascript or react file types';
      this.window.showInformationMessage(msg);
      return;
    }

    const selection = editor.selection;
    const text = doc.getText(selection);

    let output = this.convert(text); //TODO

    editor.edit(function(builder) {
        builder.replace(selection, output);
    });
  }
}
module.exports = Converter;