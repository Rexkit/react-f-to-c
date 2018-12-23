const {parse} = require('@babel/parser');
const traverse = require('@babel/traverse');
const generate = require('@babel/generator');
const t = require('babel-types');

class Converter {
  constructor (window) {
    this.window = window;
    this.supportedLangs = ['javascript', 'javascriptreact'];
  }

  getComponentNameNode(codeAST) {
    let componentNameNode;

    traverse.default(codeAST, {
      FunctionDeclaration(path) {
        componentNameNode = t.identifier(path.node.id.name);
        path.stop();
      },
      
      ArrowFunctionExpression(path) {
        componentNameNode = t.identifier(path.parent.id.name);
        path.stop();
      }
    });
    
    return componentNameNode;
  }

  getRenderMethodNode(codeAST) {
    let returnNodeOfRenderMethod;
    
    traverse.default(codeAST, {
      FunctionDeclaration(path) {
        let tempArr = path.get('body').get('body');
        returnNodeOfRenderMethod = tempArr[tempArr.length - 1].node;
        path.stop();
      },
      
      ArrowFunctionExpression(path) {
        let tempArr = path.get('body').get('body');
        returnNodeOfRenderMethod = tempArr[tempArr.length - 1].node;
        path.stop();
      }
    });

    let renderMethodNode = t.classMethod(
      'method',
      t.identifier('render'),
      [],
      t.blockStatement([
        t.variableDeclaration(
        'const',
        [t.variableDeclarator(
          t.objectPattern(
            [t.objectProperty(
              t.identifier('props'),
              t.identifier('props'),
              false, true)]),
            t.thisExpression())
        ]),
        returnNodeOfRenderMethod
      ])
    );
    return renderMethodNode;
  }

  convert(source) {
    let templateNodes= {};

    let codeAST = parse(source, {
      plugins: [
        "jsx"
      ]
    });
    

    templateNodes.componentNameNode = this.getComponentNameNode(codeAST);
    templateNodes.renderMethodNode = this.getRenderMethodNode(codeAST);

    this.getRenderMethodNode(codeAST);
    
    let classAST = t.classDeclaration(
      templateNodes.componentNameNode,
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
        )),
        templateNodes.renderMethodNode]
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