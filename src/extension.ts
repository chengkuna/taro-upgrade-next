// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
'use strict';
const fs = require('fs');
import * as vscode from 'vscode';

// import vscode, { ExtensionContext, commands, languages, window, workspace } from "vscode";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "taro-upgrade-next" is now active!');
  let handleTaroImport = vscode.commands.registerCommand('taro-upgrade-next.TaroUpgradeImport', () => {
    startFormatImport();
  });

  /* let handleTaroConf = vscode.commands.registerCommand('taro-upgrade-next.TaroUpgradeConfig', () => {

    startFormatConfig();
  }); */

  context.subscriptions.push(handleTaroImport);
  // context.subscriptions.push(handleTaroConf);
}

/* 
 处理import 引用
 import Taro, { useState } from '@tarojs/taro' => import React, { useState } from 'react'
*/
function startFormatImport() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }

  // const isValidFile = verifyFileType(editor?.document.languageId)
  if (verifyFileType(editor?.document.languageId)) {
    const newEditorText = replaceImportText(editor.document);
    coverDocumentText(editor, newEditorText);
  }
}

function startFormatConfig() {
  // [a-zA-Z0-9]+.config[\s]*=[\s]*\{[\s\S\n]*?\}
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }

  if (verifyFileType(editor?.document.languageId)) {
    const newEditorText = replaceConfigText(editor.document);
    coverDocumentText(editor, newEditorText);
  }
}

function verifyFileType(languageId: string, showError = true) {
  const fileType = ['typescript', 'typescriptreact', 'javascript', 'javascriptreact'];
  const isValidFile = languageId && fileType.includes(languageId);

  if (!isValidFile) {
    vscode.window.showErrorMessage('仅支持tsx,ts文件');
  }
  return isValidFile
}

function replaceImportText(document: vscode.TextDocument) {
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

function replaceConfigText(document: vscode.TextDocument) {
  let documentText = document.getText()

  const reg = /[a-zA-Z0-9]+.config[\s]*=[\s]*\{[\s\S\n]*?\}/
  documentText = documentText.replace(reg, '')
  return documentText
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
