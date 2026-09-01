# 03 RPC通道与错误码

插件与 host 的数据通道：`ctx.connection.rpc.handle(channel, handler)` 挂载
webserver 前缀路由，浏览器半用 `ctx.get('connection').rpc.call(channel, endpoint, payload, signal)`。

## 通道与信封

- 通道名 `/fileexplorer`、`/textviewer` 等（kebab-case）；端点 `list`、
  `read-text`、`git` 等（kebab-case）
- 传输信封：`{ type: 'client-request', rpcId, method, payload }` →
  `{ type: 'server-response', rpcId, result }`；`result` 是 `RpcResult`：
  `{ ok: true, value } | { ok: false, error: { code, message, details } }`
- **信任栅栏**：Host/Origin 双重校验（防 DNS rebinding 与跨站）；页面 token
  换签名 cookie（`?token=` 首次访问换 `set-cookie`），后续请求带 cookie 才放行
  ——命令行探针验证端点要带 cookie 罐（见 04-测试策略）

## handler 工厂模式（关键架构）

```ts
export function createTextviewerHandler(options: Options = {}): ConnectionRpcHandler {
  const readHidden = options.readHidden ?? (win32 ? readWindowsHidden : undefined)
  return async (endpoint, payload, signal): Promise<RpcResult<unknown>> => { ... }
}
```

- **纯模块无 ctx**：`apply` 只负责接线，测试直接调工厂——不用 cordis、不上网络
- **测试缝（seam）**：`readHidden`（attrib 探针）、`runGit`（git 命令）、
  `readRenderer`（懒渲染包读取）、`maxEntries` 等全部可注入
- 同步校验放最前：端点未知 → `bad-request`；路径不合法（非完全限定绝对路径）
  → `directory-unreadable`；`signal.aborted` → `cancelled`；文件级错误映射
  `directory-unreadable`（封闭错误码里没有 file 级码，复用最接近的）

## 错误码纪律

- **只用官方封闭错误码**：`directory-unreadable` / `cancelled` / `bad-request` /
  `internal`，绝不自定义（客户端才能统一处理）
- 路径校验两个铁律：
  - `isQualifiedAbsolutePath`：Windows 上 `parse(path).root.length >= 3`
    （排除 `\foo` 这种盘符缺失的 rooted 相对路径）
  - **工作区锁定**：`root` 在 payload 里由客户端提交，host 侧用 `isWithin`
    强制 `path` 不得越出（`D:\work` 不得匹配 `D:\workspace`，比较前
    trim 尾部分隔符；Windows 不区分大小写）

## 客户端封装

- `service.ts` 里薄封装：`connection.rpc.call(channel, endpoint, payload, signal)`
  + `as RpcResult<T>`；`ctx.get('connection') as unknown as ConnectionHandle`
  （单 tsconfig 下 node 半的 Context 增强会污染类型，需要 cast）
- 注入面（`FileExplorerInjected` 等）是视图与传输的唯一接缝：视图只见
  `(root, path, signal) => Promise<RpcResult<T>>` 形态的回调
