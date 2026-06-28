# AI 生成数据格式指南

本文件约定 2D×N 多层知识图谱展示软件所需的数据格式。任何 AI 工具在生成、补充或修改项目数据时，都应遵循本指南。

## 一、文件格式

- 主数据文件使用 **YAML**（推荐）或 **JSON**。
- 文件编码为 UTF-8。
- 文件后缀建议为 `.yaml` 或 `.yml`。

## 二、顶层结构

```yaml
project: "项目名称"      # 字符串，必填
version: "1.0"         # 字符串，必填
layers: []             # 图层数组，必填
crossEdges: []         # 跨图层连线数组，可选，默认为空
```

## 三、图层（Layer）

每个 `layer` 代表一个独立的 2D 流程图或思维导图。

```yaml
layers:
  - id: "layer-1"                # 图层唯一 ID，必填，全局唯一
    name: "战略目标层"            # 图层名称，必填
    description: "..."           # 图层描述，可选
    color: "#dbeafe"             # 图层主题色，可选（HTML 颜色值）
    x: 50                         # 图层原点 X，可选，默认 0
    y: 50                         # 图层原点 Y，可选，默认 0
    nodes: []                     # 指标节点数组，必填
    edges: []                     # 层内连线数组，必填
```

## 四、指标节点（Node）

```yaml
nodes:
  - id: "node-1-1"               # 指标唯一 ID，必填，全局唯一
    name: "提高客户满意度"        # 指标显示名称，必填
    type: "indicator"            # 指标类型，可选，默认 indicator
    x: 100                        # 相对图层原点的 X 坐标，可选，默认 0
    y: 80                         # 相对图层原点的 Y 坐标，可选，默认 0
```

> **重要**：指标使用全局唯一 ID 标识，`name` 仅用于展示。不同图层允许出现同名指标，但 ID 必须不同。

## 五、连线（Edge）

连线既可以在 `layers[i].edges` 中定义（同层内关系），也可以在 `crossEdges` 中定义（跨层关系）。

```yaml
edges:
  - id: "edge-1-1"               # 连线唯一 ID，必填
    source: "node-1-1"           # 起点指标 ID，必填
    target: "node-1-2"           # 终点指标 ID，必填
    direction: "forward"         # 箭头方向：forward / backward / bidirectional
    type: "drives"               # 连线类型，自由字符串
    brief: "满意度提升 → 投诉减少"    # 简要表述，点击高亮时显示在连线上
    detail: "客户满意度每提高 1 分..."  # 复杂表述，点击连线后弹窗展示
    table: "| 指标 | 数值 |\n|---|---|\n| ... | ... |"   # 关联表格，Markdown 表格格式
```

### 5.1 方向说明

- `forward`：箭头从 `source` 指向 `target`。
- `backward`：箭头从 `target` 指向 `source`。
- `bidirectional`：双向箭头。

### 5.2 连线不唯一

两个指标之间**允许存在多条连线**，只要 `id` 不同即可。例如：

```yaml
- id: "edge-a"
  source: "node-1"
  target: "node-2"
  direction: "forward"
  brief: "A 驱动 B"
- id: "edge-b"
  source: "node-1"
  target: "node-2"
  direction: "backward"
  brief: "B 反哺 A"
```

## 六、跨图层连线

跨图层连线统一放在 `crossEdges` 中，`source` 和 `target` 只需是任意两个指标节点的 ID，不要求在同一图层：

```yaml
crossEdges:
  - id: "cross-1"
    source: "node-1-1"
    target: "node-2-3"
    direction: "forward"
    type: "influences"
    brief: "满意度驱动售后响应"
    detail: "..."
    table: "..."
```

## 七、数据校验规则

1. 所有 ID（项目内）必须全局唯一：图层 ID、指标 ID、连线 ID 互不重复。
2. `source` 和 `target` 必须引用已存在的指标 ID。
3. `direction` 必须是 `forward`、`backward`、`bidirectional` 之一。
4. `x`、`y` 应为数值类型。
5. `table` 如使用 Markdown 表格，应包含表头分隔行 `|---|---|`。

## 八、AI 生成建议

- 先生成 `layers` 列表，明确每一层的业务含义。
- 为每层生成 `nodes` 时，确保 ID 有清晰前缀（如 `layer-1` 的节点用 `node-1-x`）。
- 同层关系放入 `edges`，跨层关系放入 `crossEdges`。
- 为每条连线撰写 `brief` 和 `detail`，`brief` 控制在 20 字以内，`detail` 可展开说明。
- 如有关联数据，用 `table` 字段以 Markdown 表格形式补充。

## 九、示例模板

```yaml
project: "新项目名称"
version: "1.0"
layers:
  - id: "layer-1"
    name: "第一层"
    color: "#dbeafe"
    x: 50
    y: 50
    nodes:
      - id: "node-1-1"
        name: "指标 A"
        type: "indicator"
        x: 100
        y: 100
    edges: []
crossEdges: []
```
