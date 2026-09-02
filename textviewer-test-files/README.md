# 格式测试样例

textviewer 支持格式（`ui-cw-textviewer/docs/支持格式.md`，以 `EXT_LANGS` /
`BASENAME_LANGS` 为唯一事实来源）的**逐格式测试文件**：每个格式一个样例，
另附 6 个特殊夹具覆盖编码/二进制/分块/图示错误路径。测试方式：3099 测试服
→ 会话工作区指向本目录（或上一级 `D:\_dev\dsh-plugins`）→ 文件列表逐个
点击验证。

## 普通格式样例（63 个）

按语言组生成，同语言别名共享内容（文件名 = `sample.<扩展名>`）：

| 语言组 | 文件 |
|---|---|
| C/C++（9） | `sample.cpp/.cc/.cxx/.c/.h/.hpp/.hh/.hxx/.inl` |
| Markdown（3） | `sample.md/.markdown/.mdx`（内含 ```mermaid 围栏） |
| Mermaid（1） | `sample.mmd`（默认渲染图，toggle 切源码） |
| YAML（2） | `sample.yaml/.yml` |
| JSON（3） | `sample.json/.jsonc/.json5` |
| JavaScript（3） | `sample.js/.mjs/.cjs` |
| JSX（1） | `sample.jsx` |
| TypeScript（3） | `sample.ts/.mts/.cts` |
| TSX（1） | `sample.tsx` |
| Python（2） | `sample.py/.pyw` |
| Java（1） | `sample.java` |
| Go（1） | `sample.go` |
| Rust（1） | `sample.rs` |
| Shell（3） | `sample.sh/.bash/.zsh` |
| PowerShell（2） | `sample.ps1/.psm1` |
| SQL（1） | `sample.sql` |
| XML（4） | `sample.xml/.svg/.xhtml/.xsl` |
| CSS（3） | `sample.css/.scss/.less` |
| HTML（2） | `sample.html/.htm` |
| INI（2） | `sample.ini/.cfg` |
| TOML（1） | `sample.toml` |
| Kotlin（2） | `sample.kt/.kts` |
| Swift（1） | `sample.swift` |
| PHP（1） | `sample.php` |
| Ruby（1） | `sample.rb` |
| Diff（1） | `sample.diff` |
| Log（1） | `sample.log` |
| 按文件名（2） | `Dockerfile`、`Makefile` |

> 56 个扩展名 + 2 个文件名 = 58 个识别项；`sample.txt` 不在清单内，
> 纯文本兜底可用任意未列扩展名验证（如复制 `sample.log` 改名 `.txt`）。

## 特殊夹具（6 个）

| 文件 | 覆盖路径 | 预期 |
|---|---|---|
| `sample-utf16le.txt` | BOM 探测（UTF-16LE） | 状态条显示 `UTF-16LE`，中文正常 |
| `sample-gbk.txt` | 严格 UTF-8 失败 → GBK 回退 | 状态条显示 `GBK`，中文正常 |
| `sample-binary.bin` | 首块 NUL 嗅探 | 显示"二进制文件，暂不支持预览" |
| `sample-mermaid-bad.mmd` | 图类型无法识别 | 错误箱 + 源码可见，toggle 可切源码 |
| `sample-big.txt`（1.03MB） | 分块续载 | "已加载部分内容"，滚动到底自动加载完 |
| `sample-huge.txt`（4.35MB） | 大文件看全 | 无预览上限，滚动到底完整加载 |

## 重新生成

```sh
node D:\_dev\dsh-plugins\textviewer-test-files\_generate.mjs
```

生成器从 textviewer 插件依赖解析 iconv-lite（GBK 编码），新增格式时：
改 `ui-cw-textviewer/src/client/TextViewer.tsx` 注册表 → 同步
`docs/支持格式.md` → 在本生成器加语言组 → 重跑。
