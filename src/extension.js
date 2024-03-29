const vscode = require('vscode');
const Converter = require('./converter');

function activate(context) {
  const converter = new Converter(vscode.window);

  let disposable = vscode.commands.registerCommand('extension.convertComponent', () => {
    converter.execute();
  });

  context.subscriptions.push(disposable);
}
exports.activate = activate;