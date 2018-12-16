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

    return componentName;
  }

  getRender(source) {
    const lineArr = source.split('\r');
    let returnRender = '';
    // const startIndex = source.indexOf('(',  source.indexOf('(') + 1) + 1;
    // const endIndex = source.lastIndexOf(')');
    // const returnRender = source.substring(startIndex, endIndex);
    for (let i = lineArr.length - 1; i >= 0; i--) {
      const returnIndex = lineArr[i].indexOf('return');
      if (returnIndex !== -1) {
        returnRender = lineArr[i].substring(returnIndex) + returnRender;
        if (returnRender.indexOf('(') !== -1) {
          returnRender = returnRender.substring(returnRender.indexOf('(') + 1, returnRender.lastIndexOf(')'));
        } else {
          returnRender = lineArr[i].substring(lineArr[i].indexOf('return') + 6, lineArr[i].indexOf(';') !== -1 ? lineArr[i].indexOf(';') : null);
        }      
        break;
      } else if (i === 0) {
        returnRender = lineArr[i].substring(lineArr[i].indexOf('=>') + 2) + returnRender;
        returnRender = returnRender.substring(returnRender.indexOf('(') + 1 || 6, returnRender.lastIndexOf(')'));
        break;
      } 
      returnRender = lineArr[i] + returnRender;
    }
    return returnRender;
  }

  convert(source) {
    let templateStrings = {
      'componentName': 'placeholder',
      'notRender': 'placeholder',
      'renderReturn': 'placeholder'
    };

    templateStrings.componentName = this.getComponentName(source);
    templateStrings.renderReturn = this.getRender(source);

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

    return (${templateStrings.renderReturn});
  }
}`;

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