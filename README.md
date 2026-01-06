# 📋 Modern Clipboard Manager

一个现代化的 Windows 剪贴板管理工具，采用 Electron + React + Vite 构建，提供流畅的用户体验和强大的剪贴板历史管理功能。

![License](https://img.shields.io/badge/license-ISC-blue.svg)
![Electron](https://img.shields.io/badge/Electron-28.0.0-47848F.svg)
![React](https://img.shields.io/badge/React-18.3.1-61DAFB.svg)

## ✨ 核心特性

### 🎯 功能亮点
- **📝 智能剪贴板监控** - 自动捕获文本和图片内容
- **🔍 快速搜索** - 实时搜索历史记录
- **⭐ 收藏管理** - 标记重要内容，永久保存
- **🎨 主题定制** - 5种精美主题颜色可选
- **⌨️ 全局快捷键** - 默认 `Ctrl+Shift+V` 快速唤起
- **🖼️ 图片支持** - 完整的图片剪贴板支持
- **💾 持久化存储** - SQLite 数据库存储，数据永不丢失
- **🚀 性能优化** - 虚拟滚动，支持海量历史记录

### 🎨 界面特点
- **现代化设计** - 仿 Windows 11 风格的暗色主题
- **双面板布局** - 列表 + 预览的高效工作流
- **动态窗口** - 智能调整窗口大小
- **系统托盘** - 最小化到托盘，不占用任务栏

## 🖥️ 系统要求

- **操作系统**: Windows 10/11
- **Node.js**: 16.x 或更高版本
- **Python**: 3.x（用于自动粘贴功能）

## 📦 安装

### 开发环境

```bash
# 克隆仓库
git clone https://github.com/hwc2357300448/modern-clipboard-manager.git

# 进入项目目录
cd modern-clipboard-manager

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 构建生产版本

```bash
# 构建应用
npm run build
```

构建完成后，可执行文件将位于 `dist_electron` 目录中。

## 🎮 使用指南

### 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+Shift+V` | 打开/关闭剪贴板管理器 |
| `↑` / `↓` | 在列表中导航 |
| `Enter` | 粘贴选中的内容 |
| `Esc` | 关闭窗口 |

### 基本操作

1. **复制内容** - 正常使用 `Ctrl+C` 复制，内容会自动保存到历史记录
2. **查看历史** - 按 `Ctrl+Shift+V` 打开管理器
3. **搜索内容** - 在搜索框输入关键词快速查找
4. **粘贴内容** - 选中项目后按 `Enter` 或点击"粘贴到应用"按钮
5. **收藏内容** - 点击星标图标将重要内容标记为收藏
6. **删除记录** - 点击垃圾桶图标删除单条记录

### 设置选项

在设置页面中，你可以：

- **调整历史记录上限** - 设置数据库中保存的最大记录数（10-100000条）
- **开机自动启动** - 开启后应用会随系统启动
- **更换主题颜色** - 选择你喜欢的主题色（蓝色/紫色/绿色/橙色/粉色）

## 🏗️ 技术架构

### 技术栈

**前端**
- React 18.3.1 - UI 框架
- Vite 5.3.1 - 构建工具
- Tailwind CSS 3.4.4 - 样式框架
- Lucide React - 图标库
- date-fns - 日期处理

**后端**
- Electron 28.0.0 - 桌面应用框架
- SQLite (better-sqlite3) - 本地数据库
- Node.js - 运行时环境

### 项目结构

```
modern-clipboard-manager/
├── src/
│   ├── main/              # Electron 主进程
│   │   ├── main.js        # 应用入口
│   │   ├── db.js          # 数据库操作
│   │   ├── settings.js    # 设置管理
│   │   ├── preload.js     # 预加载脚本
│   │   └── paste.py       # 自动粘贴脚本
│   └── renderer/          # React 渲染进程
│       ├── App.jsx        # 主应用组件
│       ├── components/    # UI 组件
│       └── index.css      # 全局样式
├── dist/                  # Vite 构建输出
├── dist_electron/         # Electron 打包输出
└── package.json           # 项目配置
```

### 核心功能实现

**剪贴板监控**
- 每秒轮询系统剪贴板
- 自动识别文本和图片类型
- 去重处理，避免重复记录

**数据存储**
- SQLite 数据库持久化
- 图片以文件形式存储
- 支持全文搜索

**自动粘贴**
- 使用 Python 脚本模拟键盘操作
- 自动将内容粘贴到活动窗口

## 🔧 开发指南

### 可用脚本

```bash
# 开发模式（热重载）
npm run dev

# 构建生产版本
npm run build
```


### 开发注意事项

- 开发模式下，Vite 运行在 `http://localhost:3000`
- 修改代码后会自动热重载
- 数据库文件存储在用户数据目录

## 📝 待办事项

- [ ] 支持更多剪贴板格式（HTML、RTF等）
- [ ] 添加云同步功能
- [ ] 支持剪贴板内容分类
- [ ] 添加快捷短语功能
- [ ] 支持 macOS 和 Linux 平台

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启一个 Pull Request

## 📄 许可证

本项目采用 ISC 许可证。详见 [LICENSE](LICENSE) 文件。

## 👨‍💻 作者

**hwc2357300448**

## 🙏 致谢

- [Electron](https://www.electronjs.org/) - 跨平台桌面应用框架
- [React](https://reactjs.org/) - 用户界面库
- [Vite](https://vitejs.dev/) - 下一代前端构建工具
- [Tailwind CSS](https://tailwindcss.com/) - 实用优先的 CSS 框架

---

⭐ 如果这个项目对你有帮助，请给它一个星标！
