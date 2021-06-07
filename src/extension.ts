// 'use strict';
const fs = require('fs');
const path = require('path');
import * as vscode from 'vscode';

// import vscode, { ExtensionContext, commands, languages, window, workspace } from "vscode";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "taro-upgrade-next" is now active!');
  let handleTaroImport = vscode.commands.registerCommand('taro-upgrade-next.TaroUpgradeImport', () => {
    startFormatImport();
  });

  let handleTaroConf = vscode.commands.registerCommand('taro-upgrade-next.TaroUpgradeConfig', () => {
    startFormatConfig();
  });

  let handleTaroCssModule = vscode.commands.registerCommand('taro-upgrade-next.TaroUpgradeCssModule', () => {
    startFormatCssModule();
  });

  context.subscriptions.push(handleTaroImport);
  context.subscriptions.push(handleTaroConf);
  context.subscriptions.push(handleTaroCssModule);
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

  if (verifyFileType(editor?.document.languageId)) {
    const newEditorText = replaceImportText(editor.document);
    // 更新内容
    coverDocumentText(editor, newEditorText);
    // editor.document.save();
  }
}

/* 
 处理页面config配置
*/
function startFormatConfig() {
  // [a-zA-Z0-9]+.config[\s]*=[\s]*\{[\s\S\n]*?\}
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }

  if (verifyFileType(editor?.document.languageId)) {
    const newEditorText = replaceConfigText(editor.document);
    // 更新内容
    coverDocumentText(editor, newEditorText);
    // editor.document.save();
  }
}
/* 
 处理CSS-Module
*/
function startFormatCssModule() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }

  if (verifyFileType(editor?.document.languageId)) {
    const newEditorText = replaceCssText(editor.document);
    // 更新内容
    coverDocumentText(editor, newEditorText);
    // editor.document.save();
  }
}

function verifyFileType(languageId: string, showError = true) {
  const fileType = ['typescript', 'typescriptreact', 'javascript', 'javascriptreact'];
  const isValidFile = languageId && fileType.includes(languageId);

  if (!isValidFile) {
    vscode.window.showErrorMessage('仅支持tsx,ts文件');
  }
  return isValidFile;
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
    vscode.window.showErrorMessage('当前页已引入react, 无法执行操作');
    return;
  }
  // const reg = /^import.*\{(.|[])*\}.*?(\@tarojs\/taro['|"])/;
  const reg = /import.*\{(.*)\}.*?(\@tarojs\/taro['|"])/;
  const result = documentText.match(reg);
  // console.log('result:', result);
  if (result && result[1]) {
    try {
      let currentHooks = result[1].replace(/\s|\r|\n/g, '').split(',');
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
      documentText = documentText.replace(reg, formatText);
    } catch (err) {
      vscode.window.showErrorMessage('已找到,但是转换失败:', err);
      return;
    }
    return documentText;
  } else {
    vscode.window.showErrorMessage('没引用@tarojs/taro或使用了换行引入导致寻找失败，请检查');
  }
}

function replaceConfigText(document: vscode.TextDocument) {
  // const document = editor.document
  let documentText = document.getText();

  const reg = /[a-zA-Z0-9]+\.config[\s]*=[\s]*(\{[\s\S\n]*?\})/;
  const isExistConfig = documentText.search(reg) > -1;
  if (isExistConfig) {
    const { dir: configDir, name: baseFileName } = getFileConf(document.fileName);

    const result = documentText.match(reg);
    if (result && result[1]) {
      const writeFile = `${configDir}/${baseFileName}.config.ts`;
      const newConfigText = `export default ${result[1]}`;
      try {
        fs.writeFileSync(writeFile, newConfigText);
        vscode.window.showInformationMessage(`写入成功: ${writeFile}`);
        documentText = documentText.replace(reg, '');
      } catch {
        vscode.window.showErrorMessage('写入文件失败: ', writeFile);
      }
    }
  }
  return documentText;
}

function replaceCssText(document: vscode.TextDocument) {
  let documentText = document.getText();
  const reg = /import[\s]*([a-zA-Z0-9]+).*?.scss['|"]/;
  const result = documentText.match(reg);
  if (result && result[1]) {
    // console.log('replaceCssText result:', result);
    const moduleName = result[1];
    // updateCssCall(document, moduleName);
    updateCssCall(document, moduleName, () => {
      vscode.window.showInformationMessage('（最开始命中）处理成功，请验收');
    });
  } else {
    // vscode.window.showErrorMessage(`没找CSS-Module引入的样式文件，例子: \nimport classes from 'xxx.module.scss'`);
    /* vscode.window.showQuickPick(['是', '否'], {
      title: '没有找到，是否自动创建CSS-Module文件处理？',
      placeHolder: '直接选择"是"or"否"，创建完成后自动进行脚本处理',
      onDidSelectItem: (item) => {
        console.log('item:', item);
      },
    }); */

    // 自动创建文件 并 接着执行操作
    createCssModule(document);
  }
  // const { dir: configDir, name: baseFileName } = getFileConf(document.fileName);
  return documentText;
}

function createCssModule(document: vscode.TextDocument) {
  const { dir, name } = getFileConf(document.fileName);
  let errorMsg = '创建失败，请检查后手动创建';
  let isShowError = false;
  if (name === 'index') {
    const dirNameList = dir.split('\\');
    const dirName = dirNameList[dirNameList.length - 1];
    const scssFile = `${dir}/${dirName}.scss`;
    const scssModuleFile = `${dir}/${dirName}.module.scss`;
    // console.log('existsSync:', fs.existsSync(`${dir}/${dirName}.module.scss`));
    if (fs.existsSync(scssFile) && !fs.existsSync(scssModuleFile)) {
      // 文件重命名 加上module.
      fs.renameSync(scssFile, scssModuleFile);
    }
    updateImportCss(document, dirName);
    return;
  }
  vscode.window.showErrorMessage(errorMsg);
}

function updateImportCss(document: vscode.TextDocument, dirName: string) {
  // 引入路径更新
  const moduleName = 'classes';
  let documentText = document.getText();
  var reg = new RegExp('import[\\s]*[\'|"]./' + dirName + '.scss[\'|"]', 'g');
  documentText = documentText.replace(reg, `import ${moduleName} from './${dirName}.module.scss'`);

  const editor = vscode.window.activeTextEditor;
  coverDocumentText(editor, documentText);
  setTimeout(() => {
    updateCssCall(document, moduleName, () => {
      vscode.window.showInformationMessage('处理成功，请验收');
    });
  }, 500);
}
/* 

*/

/* 更新正文中的className引用 */
function updateCssCall(document: vscode.TextDocument, moduleName: string = 'classes', callback?: Function) {
  const signMsg = '/* \n 自动升级3.x留下的一些注释(taro-upgrade-next)\n 已做过CSS-Module处理(code: 23333)\n*/';
  let documentText = document.getText();
  if (documentText.indexOf('(code: 23333)') > -1) {
    vscode.window.showErrorMessage(`这是一块已被标记处理的领土，换一个试试，标记暗号：${signMsg}`);
    return;
  }
  let isUpdated = false;

  // 变量

  // 模板字符串
  let isImportClassNames = false;
  const tplStrReg = /className=\{`([^`|\s]*)`\}/g;
  documentText = documentText.replace(tplStrReg, (match, $1) => {
    if (!$1) {
      return '';
    }

    isImportClassNames = true;
    let classList = $1.split(' ').map((item: string) => {
      let current;
      if (item.indexOf('$') > -1) {
        current = item.replace(/(.*)\$\{([^\}]*)\}(.*)/, (match, $$1, $$2, $$3) => {
          if (!$$1 && !$$3) {
            return $$2;
          } else if ($$1 && !$$3) {
            return `'$$1'+$$2`;
          } else if (!$$1 && $$3) {
            return `$$2+'$$3'`;
          } else {
            return `'$$1'+$$2+'$$3'`;
          }
        });
      } else {
        current = `'${item}'`;
      }
      return `${moduleName}[${current}]`;
    });
    isUpdated = true;
    return `className={ClassNames(${classList.join(', ')})}`;
  });

  // 字符串
  const stringReg = /className=['|"]([^'"]*)['|"]/g;
  documentText = documentText.replace(stringReg, (match, $1) => {
    if (!$1) {
      return '';
    }
    let classList = $1.split(' ').map((item: string) => {
      return `${moduleName}['${item}']`;
    });

    const useClassNames = classList.length > 1;
    isUpdated = true;
    if (useClassNames) {
      isImportClassNames = useClassNames;
    }
    return `className={${useClassNames ? 'ClassNames(' : ''}${classList.join(', ')}${useClassNames ? ')' : ''}}`;
  });

  // 引入 ClassNames
  const classReg = /import\s*ClassNames\s*from\s*'classnames?(';?)/;
  console.log('search classnames:', isImportClassNames, documentText.search(classReg));
  if (isImportClassNames && documentText.search(classReg) === -1) {
    documentText = documentText.replace("'@tarojs/components'", `'@tarojs/components'\nimport ClassNames from 'classnames'`);
  }

  // 做标识 防止死循
  if (isUpdated) {
    documentText += `\n${signMsg}`;
    const editor = vscode.window.activeTextEditor;
    coverDocumentText(editor, documentText);
    if (callback) {
      callback();
    }
  }
}

// 覆盖完整页面
function coverDocumentText(editor?: vscode.TextEditor, editorText?: string) {
  if (!editor || !editorText) {
    return;
  }
  editor.edit((edit) => {
    const end = new vscode.Position(editor.document.lineCount + 1, 0);
    edit.replace(new vscode.Range(new vscode.Position(0, 0), end), editorText);
  });
  editor.document.save();
}

function getFileConf(fileName?: string) {
  const configDir = path.dirname(fileName);
  const baseFileName = path.basename(fileName).split('.')[0];
  return {
    dir: configDir,
    name: baseFileName,
  };
}

// this method is called when your extension is deactivated
export function deactivate() {}
