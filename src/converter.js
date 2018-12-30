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
    let componentParams = [];

    traverse.default(codeAST, {
      FunctionDeclaration(path) {
        componentNameNode = t.identifier(path.node.id.name);
        componentParams = path.node.params;
        path.stop();
      },
      
      ArrowFunctionExpression(path) {
        componentNameNode = t.identifier(path.parent.id.name);
        componentParams = path.node.params;
        path.stop();
      }
    });
    
    return {
      componentNameNode,
      componentParams
    };
  }

  getRenderMethodNode(codeAST, params) { //TODO
    let returnNodeOfRenderMethod, paramsNode;
    
    traverse.default(codeAST, {
      Function(path) {
        if (t.isJSXElement(path.get('body').node)) {
          let jsxEl = path.get('body').node;
          returnNodeOfRenderMethod = t.returnStatement(jsxEl);
        } else {
          let tempArr = path.get('body').get('body');
          returnNodeOfRenderMethod = tempArr[tempArr.length - 1].node;
        }
        path.stop();
      }
    });

    if (!t.isObjectPattern(params[0])) {
      paramsNode = t.objectPattern(
        [t.objectProperty(
          t.identifier('props'),
          t.identifier('props'),
          false, true)]);
    } else {
      paramsNode = params[0];
    }

    let renderMethodNode = t.classMethod(
      'method',
      t.identifier('render'),
      [],
      t.blockStatement([
        t.variableDeclaration(
        'const',
        [t.variableDeclarator(
          paramsNode,
          t.thisExpression())
        ]),
        returnNodeOfRenderMethod
      ])
    );
    return renderMethodNode;
  }

  getBody(codeAST) {
    let body = [];
    let classBody = [];

    traverse.default(codeAST, {
      Function(path) {
        if (!t.isJSXElement(path.get('body').node)) {
          let tempArr = path.get('body').get('body');
          tempArr.forEach((el, i) => {
            if (i !== tempArr.length - 1) {
              body.push(el.node);
            }
          });
        }
        path.stop();
      }
    });

    body.forEach(el => {
      if (t.isFunction(el)) {
        classBody.push(
          t.classMethod(
            'method',
            el.id,
            el.params,
            el.body
          )
        );
      } else if (t.isVariableDeclaration(el)) {
        classBody.push(
          t.classProperty(
            el.declarations[0].id,
            el.declarations[0].init
          )
        );
      }
    });

    return classBody;
  }

  convert(source) {
    let templateNodes= {};

    let codeAST = parse(source, {
      plugins: [
        "jsx"
      ]
    });
    

    templateNodes = this.getComponentNameNode(codeAST);
    templateNodes.renderMethodNode = this.getRenderMethodNode(codeAST, templateNodes.componentParams);
    templateNodes.bodyNodes = this.getBody(codeAST);
    
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
        ...templateNodes.bodyNodes,
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