# 桌面宠物

面向打工人群体的 Windows 桌面宠物客户端。

## 技术栈

- Electron 28 + Vue 3 + TypeScript + Vite
- electron-vite（多进程构建）
- electron-store（本地持久化）
- Pinia + Vue Router

## 目录结构

```
desktop-pet/
├─ electron/
│  ├─ main/            # 主进程：窗口管理、IPC、调度
│  ├─ preload/         # Preload 桥接层（安全 API 暴露）
│  └─ shared/          # 主进程与渲染进程共享类型/常量
├─ src/
│  ├─ pages/           # 宠物窗口 / 设置窗口
│  ├─ modules/         # 业务模块（pet / bubble / reminder）
│  ├─ app/stores/      # Pinia 状态管理
│  ├─ data/quotes.json # 本地文案库
│  └─ router/          # Vue Router
├─ resources/          # 打包图标资源
├─ electron.vite.config.ts
└─ electron-builder.yml
```

## 本地开发

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build
```

输出到 `out/` 目录：
- `out/main/` — 主进程
- `out/preload/` — preload
- `out/renderer/` — 渲染进程

## 打包（P4 阶段）

```bash
# 需先在 resources/ 放置 icon.ico（256x256）
npm run package
```

输出到 `dist/`，包含 NSIS 安装包和便携版 exe。

## 开发阶段

| 阶段 | 内容 | 状态 |
|------|------|------|
| P0 | 工程初始化、三进程打通、基础窗口 | ✅ 完成 |
| P1 | 宠物状态机、透明悬浮、拖拽动画 | 待开发 |
| P2 | 点击互动、气泡文案系统 | 待开发 |
| P3 | 提醒调度、托盘菜单、系统通知 | 待开发 |
| P4 | 持久化收口、打包验证 | 待开发 |
