# 07 git状态-路径规约与解析坑

文件树每行的 M/D/A 徽标 = **本地工作区 vs 暂存区**的差异（`git status
--porcelain` 的结论），**零网络**；云端对比（ahead/behind、云端领先）走
`rev-list`/`@{upstream}` 读本地远程引用，同样不联网。

## 铁律：只认"当前文件夹自己的仓库"

- 该层不在任何仓库内 → 整层无徽标
- **不做父层聚合**：`D:\repo` 下的 `sub` 若自身是仓库，父层绝不显示它的
  脏状态（用户明确纠正过：文件夹本身没 git 时不许出现幻影 M）
- gitlink（嵌套子仓库，index 里 mode 160000）永远排除——它的脏属于它自己

## 路径规约（全部踩过的坑）

| 现象 | 根因 | 修法 |
|---|---|---|
| `--show-toplevel` 在 Windows 返回**正斜杠**（`D:/repo`），isWithin 全判 false → 状态全部消失 | git 输出风格 | `path.normalize` 后再比较 |
| 子目录 list 的 git 状态全空 | pathspec 相对 cwd 解析：`-- <repo相对路径>` 在 cwd=子目录时错位 | `git status --porcelain -- .`（cwd 相对，天然限定本层子树） |
| `ls-files -s` 路径相对 cwd，与 status 的 repo 根相对约定不一致 → gitlink 识别错位 | 两条命令约定不同 | `ls-files -s --full-name -- .` |
| 层级深时全仓库扫描慢 | 无限定 | 两条命令都 pathspec `.` 限定本层；**status 为空时跳过 ls-files** |
| 每次 list 都跑 git | 无缓存 | 每层 TTL 缓存（1.5s、上限 32 条目，key 小写化路径） |

## 解析函数要点

- `parsePorcelainStatus`：` M path` / `?? path` / `D  path`；**未跟踪目录的
  key 保留尾部斜杠**（`?? dir/`），文件无——直查和聚合要靠它区分
- `parseGitLog`（`%h%x1f%s%x1f%ad%x1f%b%x1e`）：git 在**每条记录后都追加
  `\n`**，第一条之后的所有 hash 都带前导换行 → 云端标记永远匹配不上
  （真根因案例）。必须 `record.replace(/^\r?\n/, '')`
- `parseGitStatus`（`## branch...upstream [ahead N, behind M]`）正则要覆盖
  仅 ahead / 仅 behind / 两者 / 无括号四种形态；`## HEAD (no branch)` 是
  游离 HEAD

## 行级判定

- 文件行：`statuses.get(相对路径)` 直查
- 目录行：直查（未跟踪目录命中尾部斜杠 key）→ 否则文件级前缀匹配子树
  是否有效变更 → 聚合 M（跳过斜杠 key 与 gitlink）
- **D 回填**：删除的文件 readdir 看不到，每层从 status 回填 D 行
  （kind=file、无 size）

## 客户端

- 2s 轮询刷新；文件徽标/着色（M 黄、D 红删除线、A 绿）随 list 结果更新
- 云端领先标记：behind>0 且上游 tip 不在本地历史时，服务端 `git log -1
  <branch>@{upstream}` 补一条 `remoteTip`，客户端在提交列表顶部插"云端领先
  N 个提交"标记行
