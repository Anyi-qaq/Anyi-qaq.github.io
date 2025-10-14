---
title: Blog部署流程
published: 2025-10-14
description: ''
image: ''
tags: []
category: 'AI开发'
draft: false 
lang: ''
---

### AI太好用了你知道吗

安装AI Cli助手(iflow)

```bash
bash -c "$(curl -fsSL https://cloud.iflow.cn/iflow-cli/install.sh)"
```

~~iflow 真挺好用的~~

启动 iflow

**尽量不要在家目录下启动任何AI助手**

`在当前文件夹部署astro与Fuwari主题`

AI会自动处理报错等信息，AI提示完成后输入 `/quit` 或按 `Ctrl + C` 退出

### 运行

我的项目目录是 `～/Coder` ，AI操作完成后应该会多出一个文件夹 `~/Coder/文件夹名/`

或者是

```bash
~/Coder$ eza -l --icons
.rw-r--r-- 5.1k AnRan 14 10月 13:10  astro.config.mjs
.rw-r--r-- 1.3k AnRan 14 10月 13:10  biome.json
.rw-r--r--  780 AnRan 14 10月 13:10  CONTRIBUTING.md
drwxr-xr-x    - AnRan 14 10月 13:14  dist
drwxr-xr-x    - AnRan 14 10月 13:10  docs
.rw-r--r-- 1.5k AnRan 14 10月 13:10  frontmatter.json
.rw-r--r-- 1.1k AnRan 14 10月 13:10  LICENSE
drwxr-xr-x    - AnRan 14 10月 13:12  node_modules
.rw-r--r-- 2.4k AnRan 14 10月 13:10  package.json
.rw-r--r--  130 AnRan 14 10月 13:10  pagefind.yml
.rw-r--r-- 374k AnRan 14 10月 13:10  pnpm-lock.yaml
.rw-r--r--  348 AnRan 14 10月 13:10  postcss.config.mjs
drwxr-xr-x    - AnRan 14 10月 13:10  public
.rw-r--r-- 6.4k AnRan 14 10月 13:10 󰂺 README.md
drwxr-xr-x    - AnRan 14 10月 13:10  scripts
drwxr-xr-x    - AnRan 14 10月 13:10 󰣞 src
.rw-r--r--  121 AnRan 14 10月 13:10  svelte.config.js
.rw-r--r--  445 AnRan 14 10月 13:10  tailwind.config.cjs
.rw-r--r--  547 AnRan 14 10月 13:10  tsconfig.json
.rw-r--r--    3 AnRan 14 10月 13:10  vercel.json
```

如果是第一种情况，请输入

```bash
pnpm dev
```

如果是第二种情况，请输入

```bash
cd 文件夹名/ && pnpm dev
```

即可运行

具体操作请参见[官方文档](https://github.com/saicaca/fuwari)

我水平不够，用的基本是默认配置
