# Claude Code 被封了会话找不到怎么办？

---

这两天 Claude Code 被封号的消息刷屏了。很多人最慌的其实不是工具没法用，而是——**过去几个月跟 AI 聊的上百个会话，是不是就这么没了？** 那些调试记录、架构讨论、代码方案，全在会话里，丢了等于丢了半个脑子。

**先别慌，会话都还在。**

Claude Code 的每一次对话，都以 jsonl 文件的形式存在你本地。不管账号能不能用、工具能不能开，这些文件一个都不会少。真正的麻烦只是：文件都在，但你不知道怎么找、怎么看、怎么接着往下用。

## 换个工具，会话直接带走

分享一个开源工具：**[Agent-Session-Search](https://github.com/zszz3/agent-session-search)**。它最关键的能力，是**跨 Agent 会话迁移**。

简单说，它能把你 Claude Code 里的会话，一键搬到 Codex 或 CodeBuddy 里继续用。迁移的不是一份导出的文档，而是**完整的上下文**——换了工具，AI 依然接着你上次停下的地方往下干。

- Claude Code 的会话一键迁移到 Codex / CodeBuddy
- 迁移的是完整上下文，不用再手动复制粘贴历史
- 搬完直接 resume，思路不断档

**所以 Claude Code 用不了了？没关系。你的会话换个工具照样活着。**

## 不只是迁移：所有 AI 会话统一管起来

它是一个常驻菜单栏的桌面应用，**⌥Option+Space 一键唤起**，所有 AI 会话一目了然。开源、本地运行，原始会话文件全程只读不改，整理出来的数据单独存在本地 SQLite。

### 核心功能

- **统一搜索**：一个应用里全文检索 Claude Code、Codex、CodeBuddy、Cursor、Trae、OpenCode 等所有来源的会话。搜标题、搜问题、搜正文、搜项目路径，再也不用 grep 一堆 jsonl 翻到崩溃。还能加自定义标题、标签、收藏、置顶、隐藏，按项目 / 环境 / 标签 / 来源 / 状态筛选。

- **AI 帮你找会话**：点开右上角的 AI 助手，用大白话问一句"我之前是怎么解决那个鉴权 bug 的？"，它自动翻历史，直接返回能点开的会话卡片。

- **MCP 让 AI 自己记起你**：开启后，Claude / Codex / CodeBuddy 能直接检索你的全部历史会话。对话里说一句"搜搜我以前关于 X 的会话"，AI 自己去翻，不用你手动贴上下文。

- **一键 Resume**：支持 Terminal / iTerm / Ghostty / WezTerm / Warp 直接恢复会话；如果检测到会话已经开着，会帮你把已有窗口调到前面，而不是重复打开。

- **SSH 远程会话**：远端零安装，直接读开发机上的会话，还能监听远端文件自动同步。远程机器上的会话不再是找不回来的黑洞。

- **会话迁移**：也就是前面重点讲的跨 Agent 搬家能力，让你彻底摆脱工具绑定。

- **AI 会话摘要**：用自定义 API 为会话生成一句话的"问题 + 方案"摘要，可搜索，并入全文索引提升召回率。

- **用量统计**：按今日 / 7天 / 30天 / 全部统计消息数和 token 消耗，Codex 订阅额度、Claude 额度都能可视化。

- **Skills 管理**：查看 / 搜索 / 预览已安装的 skills，顺带看每个用了多少次。

- **完成通知**：长任务跑完弹窗提醒，不用一直盯着。

- **Provider 切换**：内置 DeepSeek / GLM / Kimi 等预设，也支持自定义 base URL、model、key。

### 安装

```bash
git clone https://github.com/zszz3/agent-session-search.git
cd agent-session-search
nvm install 22 && nvm use 22 && npm ci && npm run build && npm install -g .
agent-session-search
```

macOS / Windows 都支持，装好后 ⌥Option+Space 一键唤起。

开源地址：https://github.com/zszz3/agent-session-search

---

封号是工具层面的事，但**你积累的知识和经验一直躺在本地，谁也拿不走**。换个工具，把会话原样带过去，思路不断档——这才是正经该操心的事。

#ClaudeCode #Codex #CodeBuddy #会话迁移 #AI编程 #开源 #效率工具 #程序员日常
