const {parse} = require('@babel/parser');
const traverse = require('@babel/traverse');
const generate = require('@babel/generator');
const t = require('babel-types');

class Converter {
  constructor (window) {
    this.window = window;
    this.supportedLangs = ['javascript', 'javascriptreact'];
  }

  getComponentName(codeAST) {
    let componentName = '';

    traverse.default(codeAST, {
      FunctionDeclaration(path) {
        componentName = path.node.id.name;
        return;
      },
      
      ArrowFunctionExpression(path) {
        componentName = path.parent.id.name;
        return;
      }
    });
    
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

    let codeAST = parse(source, {
      plugins: [
        "jsx"
      ]
    });
    

    templateStrings.componentName = this.getComponentName(codeAST);
    
    let classAST = t.classDeclaration(
      t.identifier(templateStrings.componentName),
      t.memberExpression(t.identifier('React'), t.identifier('Component')),
      t.classBody(
        [t.classMethod(
          'constructor',
          t.identifier('constructor'),
          [t.identifier('props')],
          t.blockStatement(
            [t.expressionStatement(
              t.callExpression(
                t.identifier('super'),
                [t.identifier('props')]
              )
            )]
        ))]
      ),
      []
    );
    
    let output = generate.default(classAST, {}, source);

    return output.code;
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