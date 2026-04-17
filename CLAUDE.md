# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # 开发模式（electron-vite hot-reload）
npm run build        # 构建三端产物到 out/
npm run typecheck    # vue-tsc + tsc 类型检查（无构建）
npm run package      # build + electron-builder 打包安装包
```

## Architecture

三进程 Electron + Vue3 应用，使用 electron-vite 构建。

### 进程划分

```
electron/main/      主进程 Node.js
electron/preload/   预加载脚本（contextBridge 桥接）
src/                渲染进程 Vue3
```

**主进程模块依赖顺序：**
`WindowManager` → `NotificationManager` → `Scheduler` / `TrayManager`，均在 `electron/main/index.ts` 实例化。

**IPC 通信约定：**
- 所有通道名定义于 `electron/shared/channels.ts`（`Channels` 常量对象）
- 类型定义共享于 `electron/shared/types.ts`（`AppSettings`、`PetState` 等）
- 预加载层将所有 IPC 封装为 `window.electronAPI.*`（见 `electron/preload/index.ts`），渲染进程只能通过此对象通信，不能直接使用 `ipcRenderer`

### 渲染进程结构

- `src/app/stores/pet.ts` — Pinia store，持有 `PetStateMachine` 实例，将状态机事件桥接为 reactive ref
- `src/modules/pet/state-machine/index.ts` — 状态机核心，权重随机自动转换，支持外部触发 (`triggerClick` / `triggerRemind`)
- `src/modules/pet/components/PetCharacter.vue` — 纯 SVG 宠物，CSS keyframe 动画，接收 `state` + `animOverride` + `isHovered` prop
- `src/app/composables/useDrag.ts` — 拖拽逻辑，通过 `movePetWindowBy` IPC 增量移动，结束时调 `snapPetToEdge`
- `src/pages/pet-window/PetWindow.vue` — 宠物主页面，组合上述所有模块

### 当前状态机（与 v1 规格的差异）

**当前实现** (`electron/shared/types.ts`):
```
idle → walk → idle
idle → sleep → idle
idle → happy → idle（点击触发）
idle → remind → idle（提醒系统触发）
```

**v1 规格目标** (`《桌面宠物当前版本功能清单 v1》.md`):
```
idle / follow / wait / sleep / drag / react
```
v1 的 `follow`（跟随鼠标移动）、`wait`（原地注视鼠标）在当前代码中**尚未实现**。

### 持久化

`electron-store` 封装于 `electron/main/store.ts`，通过 `STORE_GET` / `STORE_SET` IPC 读写。宠物位置在 `petWindow` 的 `moved` 事件中自动持久化。

### 路径别名

`@` → `src/`（在 `electron.vite.config.ts` 配置，在 `tsconfig.json` 中同步声明）

### 宠物窗口特性

200×200px，透明无边框，`alwaysOnTop`，`skipTaskbar`。Windows 平台需要 `enable-transparent-visuals` 命令行开关（已在 `main/index.ts` 启用）。
