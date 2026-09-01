# 04 测试策略-直测handler与真环境集成

测试分两层：**无 ctx 直测 handler 工厂**（主体）+ **真环境集成**（少量、带
`skipIf` 守卫）。跑 `pnpm test`（vitest），typecheck 全绿是提交门槛。

## 直测工厂（不碰 cordis/网络）

```ts
function expectListing(result: unknown): FileExplorerListing {
  const r = result as { ok: true; value: FileExplorerListing } | { ok: false; error: { code: string } }
  expect(r.ok).toBe(true)
  return (r as { ok: true; value: FileExplorerListing }).value
}
const listing = expectListing(await handler('list', { root, path: root }, new AbortController().signal))
```

- 真实临时目录（`mkdtemp` + afterEach `rm -rf`），真实 fs 读写
- **注入缝测假行为**：`readHidden` 假返回隐藏集、`runGit` 假 git 输出、
  `readRenderer` 假 bundle 内容——覆盖失败分支不需要真命令
- 解析纯函数单独测（`parseGitLog`、`parsePorcelainStatus`、`detectEncoding`、
  `decodeChunk` 等），边界要刻意构造（尾随换行、奇数 offset、空文件）

## 真环境集成（git 真实仓库、真实大文件）

```ts
const hasGit = spawnSync('git', ['--version']).status === 0
it.skipIf(!hasGit)('...', async () => { /* git init + commit 后测状态/历史 */ })
```

- git 场景：临时仓库 init + 提交，验证多提交历史、ahead/behind、子目录
  逐文件状态（回归测试防 pathspec 类 bug 复发）
- 大文件/编码场景：600KB 文件分块拼接还原、GBK 字节夹具
  （`Buffer.from([0xd6,0xd0,0xce,0xc4])` = "中文"）、UTF-16LE/BE BOM 夹具

## 传输层探针（浏览器外验证全链路）

- 浏览器才走完整传输（cookie 认证 + 信封），命令行验证要两步：
  1. `Invoke-WebRequest 'http://127.0.0.1:3099/?token=<页面token>' -WebSession $s`
     换 cookie（`dsh-auth-*`）
  2. 同会话 POST `/textviewer/<端点>`，body = 信封 JSON
- 插件 client bundle 走 **combo URL**（`/plugins/??a/client.js,b/client.js&rev=`），
  单文件 URL 404 是正常的，别被误导
- **探针文件/脚本用后即删**（工作区卫生）；测试服务器由用户授权后才拉起

## 教训

- 期望值自己算错会写出"错的正确测试"：UTF-16 偏移对齐那次，先写 Node 复现
  脚本看清字节布局，再定断言（offset 2 起就是 'hello'，不是 'ello'）
- 测试数随探针增删会漂移（publish 输出 40、仓库里 41）：以仓库为准，探针
  即用即删
