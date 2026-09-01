# 02 挂载方式-零官方改动的overlay与推挤

插件 UI 挂进 dsh web 页面**不改任何官方源码**，两条技术：
`shell.overlay` 槽注入（组件层）+ CSS 推挤让位（布局层）。

## overlay 槽注入

```ts
ctx.slots.inject('shell.overlay', () => ctx.slots.register({
  name: 'shell.overlay',
  id: 'textviewer',
  locale: NS,
  order: 1000,        // overlay 层 DOM 顺序，多个插件同 order 按注册先后
  inject: (): Face => ({ list: client.list, readText: client.readText }),
}, DockComponent))
```

- 组件只收四类 props：`PropsRuntime<'shell.overlay'>`（含 `useSessions`）、
  `InjectFace<T>`（业务回调）、`PropsLocale<typeof NS>`（`t`）
- 组件**不接触 ctx**：数据全从注入面进，测试/复用都容易
- `useSessions(state => state.current)` 拿当前会话 id，`byId[id].cwd` 即
  工作区根（VS Code 式锁定根：插件只能在其内部浏览）

## CSS 推挤让位（better-sidebar 验证过的技巧）

```css
:root { --dsh-fileexplorer-width: 28px; }          /* 收起时也要占 rail 宽 */
#root { margin-right: var(--dsh-fileexplorer-width); transition: margin-right 160ms ease; }
:root[data-dsh-fileexplorer-dragging] #root { transition: none; }
```

- 面板本身 `position: fixed; right: 0; top: 0; bottom: 0; z-index: 30`
- 拖宽时直接写 CSS 变量 + 面板 width（零 React 渲染），pointerup 回填 state
- 收起态变量保留 rail 宽（28px）：**其他读这个变量的消费者（如底部 dock）
  不会看到 0 而误盖住 rail**

## 多 dock 并排（fileexplorer + textviewer 的联动）

- 后一个 dock 读前一个的宽度变量定位：
  `right: calc(var(--dsh-fileexplorer-width, 0px))`
- 推挤用合计：`#root { margin-right: calc(var(--dsh-fileexplorer-width, 0px)
  + var(--dsh-textviewer-width, 0px)) !important; }`
  （`!important` 压过兄弟插件的普通规则，与样式表加载顺序无关）
- 拖拽禁用过渡的规则要覆盖**两个** dock 的拖拽态选择器
- **z-index 共享边界**：fileexplorer 的左缘拖拽条（7px 悬停带）越过接缝伸进
  邻居 3px——后挂的 dock 若同 z-index 会盖住它。textviewer 用 z-index 29
  （低 1 级），让兄弟的拖拽条完整可交互；两面板本体不重叠，无视觉影响

## 右 dock 让位底部终端（高度契约）

- 终端面板水平方向延伸到 `right: var(--dsh-fileexplorer-width)`——右 dock
  （textviewer）若 `top:0; bottom:0` 全高，会**盖住终端区域**，且终端展开时
  dock 纹丝不动（像不在一个图层）
- 根修法：终端把高度发布到 **documentElement**（`--dsh-terminal-height`，
  面板元素上也有但自定义属性只向下继承，兄弟读不到），右 dock 用
  `bottom: var(--dsh-terminal-height, 0px)` 让位——终端展开/收起时 dock
  自动升降
- 几何契约三件套：`--dsh-fileexplorer-width`（右缘 dock）、
  `--dsh-textviewer-width`（并排 dock）、`--dsh-terminal-height`（底部 dock）
  全部发布在 documentElement 上，谁都能读
- 背景分层：右 dock 用 `--dsw-alias-bg-base`（会话区底色）还是
  `--dsw-specific-sidebar-fill`（侧栏底色）按"它属于哪一层"决定——查看器
  与会话区同层（bg-base），文件列表与侧栏同层（sidebar-fill）

## 通用交互模式

- **整条标题栏点击切换**（收起/展开）：pointerdown 记起点，click 时校验
  位移 ≤4px 且无文本选区，否则视为选择拖拽不触发；内部按钮 stopPropagation
- **分隔线拖拽**：7px 宽透明热区 + hover 亮细线；pointer capture 拖拽，
  拖拽中直写 flexBasis / 宽度（无渲染），结束回填 state；`touch-action: none`
- 高度份额语义：主面板 flexGrow 1（永不自己收起，收起的是整个 dock），
  辅助抽屉各自 flexBasis 百分比 + 独立收起 + 独立把手
