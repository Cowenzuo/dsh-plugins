/**
 * 格式测试样例生成器：为 textviewer 支持的每个格式（docs/支持格式.md 的
 * EXT_LANGS/BASENAME_LANGS 清单）生成一个真实样例文件，外加 4 个特殊夹具
 * （UTF-16LE BOM / GBK / 二进制 / 大文件分块）。运行：
 *   node D:\_dev\dsh-plugins\测试样例\_generate.mjs
 * 特殊夹具的编码能力（iconv-lite）从 textviewer 插件的依赖解析。
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire('D:/_dev/dsh-plugins/ui-cw-textviewer/package.json')
const iconv = require('iconv-lite')

// 生成器所在目录（fileURLToPath 处理中文路径，pathname 会带回百分号编码）
const OUT = dirname(fileURLToPath(import.meta.url))

/** 语言组：扩展名列表 + 样例内容（同语言别名共享内容）。 */
const GROUPS = [
  {
    label: 'C/C++', extensions: ['cpp', 'cc', 'cxx', 'c', 'h', 'hpp', 'hh', 'hxx', 'inl'],
    content: `// ${'sample'}.${'EXT'} — C/C++ 样例：类与函数
#pragma once

class Sample {
public:
  explicit Sample(int value) : value_(value) {}
  int get() const { return value_; }

private:
  int value_;
};

template <typename T>
T add(T a, T b) {
  return a + b;
}
`,
  },
  {
    label: 'Markdown', extensions: ['md', 'markdown', 'mdx'],
    content: `# 标题

**加粗**与*斜体*，[链接](https://example.com)。

| 列A | 列B |
|---|---|
| 1 | 2 |

- [x] 任务一
- [ ] 任务二

\`\`\`js
console.log('code block')
\`\`\`
`,
  },
  {
    label: 'YAML', extensions: ['yaml', 'yml'],
    content: `# 配置样例
server:
  host: 127.0.0.1
  port: 8080
features:
  - git-states
  - lazy-tree
`,
  },
  {
    label: 'JSON', extensions: ['json', 'jsonc', 'json5'],
    content: `{
  "name": "sample",
  "version": "1.0.0",
  "features": ["tree", "viewer"],
  "meta": { "nested": true }
}
`,
  },
  {
    label: 'JavaScript', extensions: ['js', 'mjs', 'cjs'],
    content: `// JavaScript 样例
function greet(name) {
  return \`Hello, \${name}!\`
}

const items = [1, 2, 3].map((n) => n * 2)
export { greet, items }
`,
  },
  {
    label: 'JSX', extensions: ['jsx'],
    content: `// JSX 样例
export function Card({ title, children }) {
  return (
    <div className="card">
      <h2>{title}</h2>
      {children}
    </div>
  )
}
`,
  },
  {
    label: 'TypeScript', extensions: ['ts', 'mts', 'cts'],
    content: `// TypeScript 样例
interface User {
  id: number
  name: string
}

function find(users: User[], id: number): User | undefined {
  return users.find((u) => u.id === id)
}
`,
  },
  {
    label: 'TSX', extensions: ['tsx'],
    content: `// TSX 样例
export function List<T>({ items }: { items: T[] }): React.JSX.Element {
  return (
    <ul>
      {items.map((item, i) => <li key={i}>{String(item)}</li>)}
    </ul>
  )
}
`,
  },
  {
    label: 'Python', extensions: ['py', 'pyw'],
    content: `# Python 样例
def fib(n: int) -> int:
    if n < 2:
        return n
    return fib(n - 1) + fib(n - 2)


if __name__ == "__main__":
    print([fib(i) for i in range(10)])
`,
  },
  {
    label: 'Java', extensions: ['java'],
    content: `// Java 样例
public class Sample {
    public static void main(String[] args) {
        System.out.println("hello");
    }
}
`,
  },
  {
    label: 'Go', extensions: ['go'],
    content: `// Go 样例
package main

import "fmt"

func main() {
    fmt.Println("hello")
}
`,
  },
  {
    label: 'Rust', extensions: ['rs'],
    content: `// Rust 样例
fn main() {
    let v: Vec<i32> = (0..5).collect();
    println!("{:?}", v);
}
`,
  },
  {
    label: 'Shell', extensions: ['sh', 'bash', 'zsh'],
    content: `#!/usr/bin/env bash
# Shell 样例
set -euo pipefail
for f in *.txt; do
  echo "found: $f"
done
`,
  },
  {
    label: 'PowerShell', extensions: ['ps1', 'psm1'],
    content: `# PowerShell 样例
function Get-Sample {
  param([string]$Name)
  "Hello, $Name"
}
Get-Sample -Name 'dsh'
`,
  },
  {
    label: 'SQL', extensions: ['sql'],
    content: `-- SQL 样例
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL
);

SELECT name FROM users WHERE id = 1;
`,
  },
  {
    label: 'XML', extensions: ['xml', 'svg', 'xhtml', 'xsl'],
    content: `<?xml version="1.0" encoding="UTF-8"?>
<root>
  <item id="1">value</item>
  <item id="2">other</item>
</root>
`,
  },
  {
    label: 'CSS', extensions: ['css', 'scss', 'less'],
    content: `/* CSS 样例 */
.card {
  padding: 12px;
  border-radius: 8px;
  color: var(--dsw-alias-label-primary);
}
`,
  },
  {
    label: 'HTML', extensions: ['html', 'htm'],
    content: `<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8">
  <title>Sample</title>
</head>
<body>
  <h1>标题</h1>
  <p>正文内容</p>
</body>
</html>
`,
  },
  {
    label: 'INI', extensions: ['ini', 'cfg'],
    content: `; INI 样例
[server]
host = 127.0.0.1
port = 8080

[log]
level = info
`,
  },
  {
    label: 'TOML', extensions: ['toml'],
    content: `# TOML 样例
[server]
host = "127.0.0.1"
port = 8080

[[features]]
name = "tree"
enabled = true
`,
  },
  {
    label: 'Kotlin', extensions: ['kt', 'kts'],
    content: `// Kotlin 样例
fun main() {
    val items = listOf(1, 2, 3)
    println(items.map { it * 2 })
}
`,
  },
  {
    label: 'Swift', extensions: ['swift'],
    content: `// Swift 样例
struct Sample {
    let value: Int
}

let s = Sample(value: 42)
print(s.value)
`,
  },
  {
    label: 'PHP', extensions: ['php'],
    content: `<?php
// PHP 样例
function greet(string $name): string {
    return "Hello, $name";
}

echo greet('dsh');
`,
  },
  {
    label: 'Ruby', extensions: ['rb'],
    content: `# Ruby 样例
class Sample
  def initialize(value)
    @value = value
  end

  attr_reader :value
end

puts Sample.new(42).value
`,
  },
  {
    label: 'Diff', extensions: ['diff'],
    content: `--- a/file.txt
+++ b/file.txt
@@ -1,3 +1,3 @@
-old line
+new line
 context
`,
  },
  {
    label: 'Log', extensions: ['log'],
    content: `2026-09-01 10:00:01 INFO  server started
2026-09-01 10:00:02 DEBUG request /textviewer/read-text
2026-09-01 10:00:03 WARN  slow git status (1.2s)
2026-09-01 10:00:04 ERROR renderer bundle fetch failed
`,
  },
  {
    label: 'Docker', basename: 'Dockerfile',
    content: `FROM node:22-alpine
WORKDIR /app
COPY package.json .
RUN npm install --omit=dev
COPY . .
CMD ["node", "index.js"]
`,
  },
  {
    label: 'Make', basename: 'Makefile',
    content: `.PHONY: build test

build:
	pnpm build

test:
	pnpm test
`,
  },
]

await mkdir(OUT, { recursive: true })
let count = 0
for (const group of GROUPS) {
  const extensions = group.extensions ?? []
  const names = extensions.map((ext) => `sample.${ext}`)
  if (group.basename !== undefined) names.push(group.basename)
  for (const name of names) {
    const content = group.content.replaceAll('${EXT}', name.split('.').pop() ?? '')
    await writeFile(join(OUT, name), content, 'utf8')
    count += 1
  }
}

// —— 特殊夹具 ——
// UTF-16LE 带 BOM（探测 BOM 分支）
await writeFile(join(OUT, 'sample-utf16le.txt'), Buffer.concat([
  Buffer.from([0xff, 0xfe]),
  Buffer.from('UTF-16LE 编码样例\n第二行内容\n', 'utf16le'),
]))
count += 1
// GBK（无 BOM，严格 UTF-8 失败回退分支）
await writeFile(join(OUT, 'sample-gbk.txt'), Buffer.concat([
  iconv.encode('GBK 编码样例（无 BOM）\n回退路径验证\n', 'gbk'),
]))
count += 1
// 二进制（NUL 嗅探 → 提示不预览）
await writeFile(join(OUT, 'sample-binary.bin'), Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x00, 0x00, 0x00, 0x00, 0x1a, 0x2b, 0x03, 0x04]))
count += 1
// 大文件（约 1MB：首块 256KB 后滚动续载到底，覆盖分块拼接路径）
const line = '这是一行用于分块续载测试的内容，共约 120 字节。'.repeat(6)
const bigLines = []
for (let i = 0; i < 2600; i += 1) bigLines.push(`${i}: ${line}`)
await writeFile(join(OUT, 'sample-big.txt'), bigLines.join('\n'), 'utf8')
count += 1
// 超大文件（约 4.3MB：超过 2MB 预览上限，覆盖"仅预览前 2MB"提示路径）
const hugeLines = []
for (let i = 0; i < 11000; i += 1) hugeLines.push(`${i}: ${line}`)
await writeFile(join(OUT, 'sample-huge.txt'), hugeLines.join('\n'), 'utf8')
count += 1

console.log(`生成完成：${count} 个文件 → ${OUT}`)
