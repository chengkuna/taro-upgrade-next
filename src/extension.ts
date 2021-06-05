// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
'use strict';
const fs = require('fs');
import * as vscode from 'vscode';

// import vscode, { ExtensionContext, commands, languages, window, workspace } from "vscode";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  // const config = vscode.workspace.findFiles('*.ts');
  console.log('Congratulations, your extension "taro-upgrade-next" is now active!');

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  let handleTaroImport = vscode.commands.registerCommand('taro-upgrade-next.TaroUpgradeImport', () => {
    // The code you place here will be executed every time your c
    startFormatImport();
    // const message = 'Hello VS Code';
    // vscode.window.showInformationMessage(message);
  });

  let handleTaroConf = vscode.commands.registerCommand('taro-upgrade-next.TaroUpgradeConfig', () => {});

  context.subscriptions.push(handleTaroImport);
  context.subscriptions.push(handleTaroConf);
}

/* 
 处理import 引用
 import Taro, { useState } from '@tarojs/taro' => import React, { useState } from 'react'
*/
function startFormatImport() {
  const fileType = ['typescript', 'typescriptreact'];
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }

  const currentLanguageId = editor?.document.languageId;
  const isValidFile = currentLanguageId && fileType.includes(currentLanguageId);
  if (isValidFile) {
    replaceTaroText(editor);
  } else {
    vscode.window.showErrorMessage('仅支持tsx,ts文件');
  }
}

function replaceTaroText(editor: vscode.TextEditor) {
  const newEditorText = formatEditorText(editor.document);
  coverDocumentText(editor, newEditorText);
}

function formatEditorText(document: vscode.TextDocument) {
  const taroHooksMeta = [
    'useDidShow',
    'useDidHide',
    'usePullDownRefresh',
    'useReachBottom',
    'usePageScroll',
    'useResize',
    'useShareAppMessage',
    'useTabItemTap',
    'useAddToFavorites',
    'useShareTimeline',
    'useReady',
    'useRouter',
  ];

  let documentText = document.getText();
  if (documentText.search(/from(\s+)['|"]react['|"]/) > -1) {
    return;
  }
  const reg = /import([\s\S]*)\{([\s\S]*)\}([\s\S]*)?(\@tarojs\/taro['|"])/;
  const result = documentText.match(reg);
  // console.log('result:', result);
  if (result && result[2].indexOf('use') !== -1) {
    try {
      let currentHooks = result[2].replace(/\s/g, '').split(',');
      if (!(currentHooks && currentHooks.length)) {
        return;
      }
      let reactHooks: string[] = [];
      let taroHooks: string[] = [];
      currentHooks.forEach((item) => {
        taroHooksMeta.includes(item) ? taroHooks.push(item) : reactHooks.push(item);
      });
      let formatText = `import React, { ${reactHooks.join(', ')} } from 'react'`;
      const hasExistenceTaroApis = documentText.indexOf('Taro.') > -1;
      if (taroHooks && taroHooks.length) {
        if (hasExistenceTaroApis) {
          formatText += `\nimport Taro, { ${taroHooks.join(', ')} } from '@tarojs/taro'`;
        } else {
          formatText += `\nimport { ${taroHooks.join(', ')} } from '@tarojs/taro'`;
        }
      } else if (hasExistenceTaroApis) {
        formatText += `\nimport Taro from '@tarojs/taro'`;
      }
      // console.log('hooks format result:\n', formatText);
      // console.log('formated:', documentText.replace(reg, formatText));
      documentText = documentText.replace(reg, formatText);
    } catch {
      console.error('format error!!!');
      // vscode.window.showErrorMessage('')
    }

    // console.log('formated:', documentText);

    return documentText;
  }
}

// 覆盖完整页面
function coverDocumentText(editor: vscode.TextEditor, editorText?: string) {
  if (!editorText) {
    return;
  }

  editor.edit((edit) => {
      const end = new vscode.Position(editor.document.lineCount + 1, 0);
      edit.replace(new vscode.Range(new vscode.Position(0, 0), end), editorText);
  });
}

// this method is called when your extension is deactivated
export function deactivate() {}
