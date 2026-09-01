# 13 开发环境-双DSH_HOME与构建链路

## 两套 DSH_HOME（隔离铁律）

| | 测试 | 正式 |
|---|---|---|
| 位置 | `D:\_dev\dsh-plugins\.dsh-test-home` | `C:\Users\cowen\.dsh` |
| 端口 | 3099 | 3081 |
| 数据 | 测试会话/存储（可随时整个删） | 真实会话/凭据（**测试绝不写这里**） |
| 插件 | `link:` 直连源码（junction） | vendor tgz 快照 |

共用同一 DSH_HOME 的后果：测试会话写进正式数据、两实例互踩存储文件。
`settings.yaml`、`sessions/`、`storages/`、`.credentials.yaml` 都是 home 级
共享的，这是隔离的根本原因。

## 启动命令

```powershell
# 测试服（改了插件 build 后重启此命令，浏览器刷新即新 bundle）
$env:DSH_HOME='D:\_dev\dsh-plugins\.dsh-test-home'
node D:\framework\deepseek-harness-test\apps\cli\lib\bin.js --profile web-fileexplorer --port 3099 --no-open
#   → 输出 dsh web: http://127.0.0.1:3099/?token=<每次不同>

# 正式服（用户自己跑 harness 源码；发布插件后需重启加载新 bundle）
node --import tsx/esm apps/cli/src/bin.ts web --port 3081
```

## harness 构建链路

- 插件类型指向 harness 源码类型：tsconfig `paths` →
  `D:/framework/deepseek-harness/packages/<pkg>/lib/types/...`
- harness 本体有两个副本：主源码 `D:\framework\deepseek-harness` 与测试构建
  `D:\framework\deepseek-harness-test`（3099 跑后者）
- harness API 变更后重建：`pnpm clean` + `pnpm build`（在 harness-test 目录
  `Push-Location` 执行——后台 job 的 workdir 参数不可靠）
- 重建后插件可能需要迁移（`ctx.slots` 归属包变化、`rpc.handle` 签名变化），
  以新 `lib/types` 为准

## 常用排查

- 端口占用/进程：`Get-NetTCPConnection -LocalPort 3099 -State Listen`
- 测试服被用户主动杀过（exit 1 无输出）：那是用户行为，不自动重启
- 浏览器验证是最终验收（无 CDP/截图工具）；F12 控制台 + 服务端 HTTP
  探针（带 cookie 罐，见 04）是可用手段
- plugin client bundle 走 combo URL（`/plugins/??id/client.js,...&rev=`），
  单文件 404 是正常的；roster 是否含插件查页面 HTML 里的 `??` 串
