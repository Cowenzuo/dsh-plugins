# 11 样式主题-纯token与明暗联动

所有面板样式遵循官方 web 设计系统：**只用语义 token，禁字面量颜色**。

## Token 纪律

- 颜色只允许 `--dsw-alias-*` / `--dsw-specific-*`（官方主题变量）：
  `--dsw-specific-sidebar-fill`（面板底）、`--dsw-alias-label-primary/
  secondary/tertiary`（文字三级）、`--dsw-alias-border-l2`（细线）、
  `--dsw-alias-interactive-bg-hover`（悬停）、`--dsw-alias-state-warn/
  error/success-primary`（状态色）、`--dsw-alias-state-business-primary`
  （品牌蓝：选中/焦点）
- 滚动条用官方间接层：`--dsh-scrollbar-thumb: var(--dsw-alias-scrollbar-bg-l2)`
  + hover 变体（面板内自设，滚动条跟随主题）
- 内联样式只放几何/动态值（宽度、flex 比例、paddingLeft 缩进）；
  静态样式一律 `.module.css`

## 明暗主题检测（渲染器联动）

- 官方主题管线：ui-theme 解析 light/dark/system → ui-layout 的
  ThemePresenter 投影到 **`document.body[data-ds-dark-theme]`**（有该属性 =
  暗色；另有 `meta[name=theme-color]` 与内联 token 变量）
- 客户端检测：
  ```ts
  const observer = new MutationObserver(() => setDark(document.body.hasAttribute('data-ds-dark-theme')))
  observer.observe(document.body, { attributes: true, attributeFilter: ['data-ds-dark-theme'] })
  ```
- Shiki 双主题（github-light/github-dark）按 `dark` 重渲染；高亮重算期间
  保留旧 HTML 防闪烁

## CSS Modules 打包（tsdown 虚拟 id 管线）

- lightningcss 编译：**内容哈希**类名 `[content-hash]_[local]`——不是路径
  哈希！路径哈希跨版本稳定，HMR 新旧样式会共享类名，旧规则按级联顺序
  覆盖新规则（收起态 rail 居中被旧样式打回去的真实事故）
- 注入守卫：`style[data-plugin-css=<tagId>]` 已存在则跳过（多 bundle 共用
  同一 CSS 模块时不会重复注入）
- 对第三方 HTML 内部类（Shiki 的 `.line`）用 `:global()` 包裹选择器

## 交互样式要点

- 焦点环只给键盘：`.xxx:focus-visible`（`:focus` 清 outline）——鼠标点击
  打开系统窗口后浏览器会恢复焦点到按钮，留一个卡住的 focus ring
- 选中行：`color-mix(in srgb, var(--dsw-alias-state-business-primary) 10%,
  transparent)` 半透明品牌色底（hover 14%）
- 字体：等宽代码用 `var(--ds-font-family-code)`；动画缓动用
  `var(--ds-ease-in-out)`
