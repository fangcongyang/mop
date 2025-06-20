# MOP - 音乐播放器

一个基于 Tauri + React + TypeScript 构建的现代化跨平台音乐播放器应用。

## 🎵 项目简介

MOP 是一个功能丰富的音乐播放器，提供了优雅的用户界面和强大的音乐管理功能。应用采用现代化的技术栈，结合了 Web 技术的灵活性和原生应用的性能优势。

## ✨ 主要功能

- 🎶 **音乐播放**: 支持多种音频格式的播放
- 📱 **跨平台**: 支持 Windows、macOS 和 Linux
- 🎨 **现代化 UI**: 基于 Material-UI 的精美界面设计
- 📚 **音乐库管理**: 完整的音乐库浏览和管理功能
- 🔍 **搜索功能**: 强大的音乐搜索和发现功能
- 📝 **歌词显示**: 实时歌词显示功能
- 🎵 **播放列表**: 自定义播放列表管理
- 👤 **用户系统**: 支持用户登录和个人音乐库
- 🌐 **国际化**: 多语言支持
- 🔄 **自动更新**: 内置应用更新机制
- 🎬 **MV 播放**: 音乐视频播放功能
- 📊 **Last.fm 集成**: 支持 Last.fm 音乐统计

## 🛠️ 技术栈

### 前端技术
- **React 18**: 现代化的 React 框架
- **TypeScript**: 类型安全的 JavaScript 超集
- **Vite**: 快速的构建工具
- **Material-UI**: Google Material Design 组件库
- **Redux Toolkit**: 状态管理
- **React Router**: 路由管理
- **Sass**: CSS 预处理器
- **i18next**: 国际化解决方案

### 后端技术
- **Tauri**: 基于 Rust 的跨平台应用框架
- **Rust**: 系统级编程语言

### 核心依赖
- **Howler.js**: 音频播放引擎
- **Plyr**: 视频播放器
- **Dexie**: IndexedDB 数据库封装
- **Day.js**: 日期时间处理
- **Crypto-js**: 加密功能

## 📁 项目结构

```
mop/
├── src/                    # 前端源码
│   ├── api/               # API 接口
│   ├── components/        # React 组件
│   ├── pages/            # 页面组件
│   ├── store/            # Redux 状态管理
│   ├── hooks/            # 自定义 Hooks
│   ├── utils/            # 工具函数
│   ├── business/         # 业务逻辑
│   ├── i18n/             # 国际化配置
│   └── assets/           # 静态资源
├── src-tauri/             # Tauri 后端
│   ├── src/              # Rust 源码
│   ├── icons/            # 应用图标
│   ├── capabilities/     # 权限配置
│   └── initData/         # 初始化数据
├── public/               # 公共资源
└── tauri-plugin-crypto/  # 自定义 Tauri 插件
```

## 🚀 快速开始

### 环境要求

- Node.js 16+
- pnpm
- Rust 1.70+
- Tauri CLI

### 安装依赖

```bash
# 安装前端依赖
pnpm install

# 安装 Tauri CLI
cargo install tauri-cli
```

### 开发模式

```bash
# 启动开发服务器
pnpm dev

# 或者使用 Tauri 开发模式
pnpm tauri dev
```

### 构建应用

```bash
# 构建前端
pnpm build

# 构建 Tauri 应用
pnpm tauri build
```

## 📱 主要页面

- **首页 (Home)**: 音乐推荐和快速访问
- **探索 (Explore)**: 发现新音乐
- **音乐库 (Library)**: 个人音乐收藏管理
- **搜索 (Search)**: 音乐搜索功能
- **播放列表 (Playlist)**: 播放列表管理
- **专辑 (Album)**: 专辑详情页面
- **艺术家 (Artist)**: 艺术家详情页面
- **歌词 (Lyrics)**: 歌词显示页面
- **设置 (Settings)**: 应用设置

## 🔧 开发工具推荐

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
- [React Developer Tools](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi)
- [Redux DevTools](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd)

## 📄 许可证

本项目采用开源许可证，详见 [LICENSE](./LICENSE) 文件。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来帮助改进项目！

## 📝 更新日志

查看 [CHANGELOG.md](./CHANGELOG.md) 了解版本更新详情。
