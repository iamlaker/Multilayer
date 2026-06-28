# 2D×N 多层知识图谱展示软件

一个基于 Web 的多层流程图/思维导图可视化工具。每一层可独立摆放，层内及跨层指标之间可建立连线，并支持点击高亮、复杂表述弹窗、表格展示与完整的数据编辑。

## 核心特性

- **2D×N 多层画布**：每个图层都是一张独立的 2D 流程图，可在画布上自由拖动摆放。
- **跨图层关联**：支持同层连线和跨层连线，两个指标之间可存在多条不同方向的连线。
- **点击高亮**：点击指标后，高亮该指标及所有相关指标和连线，并显示连线上的简要表述。
- **详情弹窗**：高亮状态下点击连线，弹出小框展示复杂表述与关联表格。
- **完整编辑器**：支持增删改图层、指标、连线，拖拽布局，导入/导出 YAML。
- **AI 生成友好**：数据采用 YAML 格式，项目内提供 `AI_GENERATION_GUIDE.md`，约定 AI 生成格式。

## 技术栈

- React 18 + TypeScript
- Vite
- Cytoscape.js（图渲染）
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

## 数据格式与导入

项目核心数据存储在 YAML 文件中，包含以下字段：

- `layers`：图层数组，每个图层包含 `id`、`name`、`nodes`、`edges` 等。
- `nodes`：指标节点，使用全局唯一 `id`，`name` 用于展示。
- `crossEdges`：跨图层连线数组。

### 支持导入的格式

| 格式 | 扩展名 | 说明 |
|---|---|---|
| YAML | `.yaml` / `.yml` | 本软件原生格式 |
| JSON | `.json` | 通用 `nodes` + `edges` 结构 |
| draw.io | `.drawio` / `.xml` | 支持多 diagram/多图层，自动解压 |
| XMind | `.xmind` | 支持新版（content.json）和旧版（content.xml） |
| Markdown | `.md` / `.mmd` | 支持 Mermaid 流程图和大纲式 Markdown |
| ProcessOn | `.pos` / `.posm` | 最佳-effort JSON 解析（如有样例可继续精确适配） |

详见 [AI_GENERATION_GUIDE.md](./AI_GENERATION_GUIDE.md)。

## 使用说明

1. 左侧边栏管理图层：添加、删除、重命名、显示/隐藏。
2. 顶部工具栏切换模式：
   - **选择**：点击指标高亮关联；双击节点或连线可编辑。
   - **添加指标**：在图层空白处点击添加新指标。
   - **添加连线**：依次点击起点指标和终点指标。
3. 导出 YAML：将当前项目保存为 YAML 文件。
4. 导入 YAML：加载符合格式的 YAML 文件。

## 项目结构

```
├── public/data/example.yaml      # 示例数据
├── src/
│   ├── components/               # React 组件
│   ├── model/                    # 数据类型与校验
│   ├── store/                    # Zustand 状态
│   ├── utils/                    # YAML、Cytoscape 样式工具
│   ├── App.tsx
│   └── main.tsx
├── AI_GENERATION_GUIDE.md        # AI 数据生成格式约定
└── README.md
```

## 后续计划

- 撤销/重做历史栈
- 自动布局算法
- 搜索与过滤
- Tauri 打包桌面版
- 导出 PNG/PDF
