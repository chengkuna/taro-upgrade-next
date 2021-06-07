# taro-upgrade-next README

This is the README for your extension "taro-upgrade-next". After writing up a brief description, we recommend including the following sections.

## 使用
![avatar](./src/images/01.png#pic_center)
### 处理`@tarojs/taro` import 导入
快捷键：`Ctrl+Alt+F5`
说明：自动将`useState`, `useEffect`改为'react'引入
风险项：不支持换行引入的情况（主要是因为不知道怎么写这个正则 '-'）
``` js
// before
import Taro, { useEffect, useState, useRouter, useMemo } from '@tarojs/taro'

// after
import React, { useEffect, useState, useMemo } from '@tarojs/taro'
import Taro, { useRouter } from '@tarojs/taro'
```

### 处理.config={} 配置
快捷键：`Ctrl+Alt+F6`
说明：自动生成xxx.config.ts文件，去除当前文件的`.config={}`代码块
风险项：暂未发现

### 转为 CSS-Module 
快捷键：`Ctrl+Alt+F7`
说明：将className引入改为CSS-Module方式：
1. 若当前文件未引入`CSS-module CSS`文件，会试图去自动将同目录scss（scss文件的命名必须和上一级文件夹相同）文件改为`xxxx.module.scss`并引入，常见的场景有自定义组件scss
![avatar](./src/images/02.png#pic_center)
2. 不满足上一个条件也可以先手动引入 `CSS-module CSS` 再执行脚本
3. 正则替换仅支持以下类型：
3.1 纯字符串类型
```js
<view className="button size-large" />
```
3.2 简单模板字符串类型
```js
// 支持
<view className={`input ${type}`} />
<view className={`input input-${type}`} />
<view className={`input input-${type}-mini`} />
// 不支持
<view className={`input ${type === 'default' ? 'default' : 'primary'}`} />
// 转换成功但是会出问题的情况
const titleClassNames = 'size color'
<view className={`input ${titleClassNames}`} />
```
风险性：className使用方式过于多变，建议转换后检查一下代码变化，使用变量或表达式的请正则搜索后手动处理吧。
```js
/className=\{[^`'"]+/
```
