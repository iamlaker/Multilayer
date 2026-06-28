# 2D×N 多层知识图谱展示软件

一个基于 Web 的多层流程图/思维导图可视化工具。每一层可独立摆放，层内及跨层指标之间可建立连线，并支持点击高亮、复杂表述弹窗、表格展示与完整的数据编辑。

## 核心特性

- **2D×N 多层画布**：每个图层都是一张独立的 2D 流程图，可在画布上自由拖动摆放。
- **跨图层关联**：支持同层连线和跨层连线，两个指标之间可存在多条不同方向的连线。
- **点击高亮**：点击指标后，高亮该指标及所有相关指标和连线，并显示连线上的简要表述。
- **详情弹窗**：高亮状态下点击连线，弹出小框展示复杂表述与关联表格；弹窗内可直接编辑并实时保存。
- **完整编辑器**：支持增删改图层、指标、连线，拖拽布局，导入/导出 YAML。
- **删除快捷操作**：工具栏提供删除按钮，也支持选中后按 `Delete` / `Backspace` 删除节点、连线或图层。
- **多选与批量操作**：按住 `Ctrl` / `Cmd` 点击或框选多个指标，可批量移动、统一缩放，并通过「批量编辑」一次性调整样式。
- **撤销/重做**：基于历史栈的 `Ctrl+Z` / `Ctrl+Y` 撤销与重做。
- **搜索**：顶部搜索框实时高亮匹配指标及其关联。
- **自动布局**：支持力导向、网格、层次、环形等布局算法。
- **AI 生成友好**：数据采用 YAML 格式，项目内提供 `AI_GENERATION_GUIDE.md`，约定 AI 生成格式。

## 技术栈

- React 19 + TypeScript
- Vite
- Cytoscape.js（图渲染）
- mxGraph / draw.io（图形库形状渲染）
- Zustand（状态管理）
- Zod（数据校验）
- js-yaml（YAML 解析）
- Tailwind CSS

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

Windows 环境下也可以使用项目自带的 Node 运行时启动：

```bash
start.bat
```

## 数据格式与导入

项目核心数据存储在 YAML 文件中，包含以下字段：

- `layers`：图层数组，每个图层包含 `id`、`name`、`nodes`、`edges` 等。
- `nodes`：指标节点，使用全局唯一 `id`，`name` 用于展示；支持 `shape`、`width`、`height`、`backgroundColor`、`borderColor`、`borderStyle`、`fontColor`、`fontSize`、`fontFamily`、`fontWeight` 等样式字段。
- `edges`：连线，支持 `direction`、`type`、`brief`、`detail`、`table`、`lineStyle`、`lineColor`。
- `crossEdges`：跨图层连线数组。

### 支持导入的格式

| 格式 | 扩展名 | 说明 |
|---|---|---|
| YAML | `.yaml` / `.yml` | 本软件原生格式，导出后可再次导入 |
| JSON | `.json` | 通用 `nodes` + `edges` 结构 |
| draw.io | `.drawio` / `.xml` | 支持多 diagram/多图层，自动解压 |
| XMind | `.xmind` | 支持新版（content.json）和旧版（content.xml） |
| Markdown | `.md` / `.mmd` | 支持 Mermaid 流程图和结构化 Markdown 大纲 |
| ProcessOn | `.pos` / `.posm` | 最佳-effort JSON 解析（如有样例可继续精确适配） |

详见 [AI_GENERATION_GUIDE.md](./AI_GENERATION_GUIDE.md)。

## 使用说明

1. 左侧边栏管理图层：添加、删除、重命名、显示/隐藏、自动布局。
2. 顶部工具栏切换模式：
   - **选择**：点击指标高亮关联；双击节点或连线可编辑。
   - **添加指标**：在图层空白处点击添加新指标；也可从左侧「图形库」拖拽形状到图层。
   - **添加连线**：依次点击起点指标和终点指标，或切换到「添加连线」模式拖拽连接。
3. **多选**：按住 `Ctrl` / `Cmd` 点击指标，或按住 `Shift` / `Ctrl` 在空白处拖拽框选；选中的多个指标可一起拖动，并通过四周控制点统一缩放。
4. **批量编辑**：选中多个指标后，工具栏出现「批量编辑」按钮，可统一修改形状、颜色、边框、字体、字号等。
5. **删除**：选中节点、连线或图层后，点击工具栏「删除」按钮，或直接按 `Delete` / `Backspace`。
6. **编辑连线详情**：点击连线弹出详情弹窗，可直接修改简要表述、复杂表述和相关表格。
7. 导出 YAML：将当前项目保存为 YAML 文件。
8. 导入 YAML：加载符合格式的 YAML 文件（覆盖当前项目或追加为图层）。

## 项目结构

```
├── public/data/                  # 静态示例数据
├── src/
│   ├── components/               # React 组件
│   │   ├── BatchNodeEditor.tsx   # 批量编辑指标样式
│   │   ├── DetailPopup.tsx       # 连线详情弹窗（可编辑）
│   │   ├── GraphCanvas.tsx       # Cytoscape 画布与交互
│   │   ├── LayerEditor.tsx       # 图层样式编辑
│   │   ├── LayerSidebar.tsx      # 图层列表与自动布局
│   │   ├── NodeEditor.tsx        # 指标样式编辑
│   │   ├── ResizeHandles.tsx     # 节点/多选缩放控制点
│   │   ├── ShapeLibrary.tsx      # draw.io 图形库
│   │   └── Toolbar.tsx           # 顶部工具栏
│   ├── model/                    # 数据类型与校验
│   ├── store/                    # Zustand 状态
│   ├── utils/                    # YAML、Cytoscape 样式、导入器
│   ├── App.tsx
│   └── main.tsx
├── AI_GENERATION_GUIDE.md        # AI 数据生成格式约定
└── README.md
```

## 后续计划

- Tauri 打包桌面版
- 导出 PNG/PDF
- 更多 draw.io / mxGraph 形状与样式支持
