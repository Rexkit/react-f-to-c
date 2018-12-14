class Converter {
  constructor (window) {
    this.window = window;
    this.supportedLangs = ['javascript', 'javascriptreact'];
  }

  convert(source) {
    let templateStrings = {
      'componentName': 'placeholder',
      'notRender': 'placeholder',
      'renderReturn': 'placeholder'
    };

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