# 一个小工具，治好了我的 AI 会话焦虑

---

天天用 Claude Code / Codex 写代码，会话越攒越多，慢慢就开始头疼：

- 想接着昨天那个会话干活，却找不到了——几十上百个 session 散在文件夹里，文件名全是哈希，只能凭印象一个个翻。
- 想搜"上次让 AI 改鉴权那段对话"，没有任何全文搜索，grep 一堆 jsonl 翻到崩溃。
- 想让新会话接着上次的思路干，可 AI 记不住你以前怎么解决的，每次都得自己翻历史、复制粘贴喂回去。
- 远程开发机上的会话更是黑洞——SSH 上去的那些 Claude 会话，本地根本看不到，想恢复得先想起在哪台机器、哪个目录。

后来发现了一个本地小工具，把这些事都收拾妥帖了。

## Agent-Session-Search

一个常驻菜单栏的桌面应用，**⌥Option+Space 一键唤起**，所有 AI 会话尽收眼底。开源、本地运行，原始会话文件全程只读，整理数据单独存在本地 SQLite，互不污染。

### 功能一览

- **统一搜索与管理**：在一个桌面应用里统一搜索 Claude Code、Codex，以及设置中启用的 CodeBuddy、Cursor、Trae、OpenCode 等会话。支持全文检索自定义标题、原始标题、首个用户问题、会话正文和项目路径；可以给每个会话加自定义标题、标签、收藏、置顶、隐藏，按项目 / 环境 / 标签 / 来源 / 状态筛选，按最近活动 / 创建 / 更新排序。原始 session 文件只读不改，整理数据单独存本地 SQLite。
- **AI 帮你找会话**：右上角点开 AI 助手，用人话问一句"我之前怎么解决那个鉴权 bug 的？"，AI 自动翻历史，返回能点开的会话卡片，不用再手动找。
- **MCP 让 AI 自己记起你**：开启后 Claude / Codex / CodeBuddy 能直接检索你全部历史会话，对话里说一句"搜搜我以前关于 X 的会话"，AI 自己去翻，不用手动贴上下文。
- **跨 Agent 会话搬家**：Claude ↔ Codex ↔ CodeBuddy 的会话能互相迁移，换工具也不丢上下文，搬完直接接着干。
- **一键 Resume**：Terminal / iTerm / Ghostty / WezTerm / Warp 直接恢复；检测到会话已打开时，会前置已有终端窗口而不是重复启动。
- **SSH 远程会话**：远端零安装，直接读开发机会话，支持远端文件监听自动同步。
- **AI 会话摘要**：用自定义 API Provider 为会话生成可搜索的"问题 + 方案"一句话摘要，并入全文索引提升检索召回。
- **用量统计**：按今日 / 7天 / 30天 / 全部统计消息数和 token 消耗，涵盖缓存读写在内的全部计费 token；Codex 订阅额度、Claude 额度可视化。
- **Skills 管理**：查看 / 搜索 / 预览已安装 skills，看每个 skill 的使用次数，复制路径、定位目录、删除。
- **完成通知**：长任务跑完弹窗提醒，可设最短时长，不用一直干盯。
- **Provider 切换**：内置 DeepSeek / GLM / Kimi 等预设，支持自定义 base URL、model、key，切换前自动备份配置。

### 安装

```bash
git clone https://github.com/zszz3/agent-session-search.git
cd agent-session-search
nvm install 22 && nvm use 22 && npm ci && npm run build && npm install -g .
agent-session-search
```

macOS / Windows 都支持，装好 ⌥Option+Space 唤起。

开源地址：https://github.com/zszz3/agent-session-search

---

最近在整理自己的 AI 编程工作流，如果你也在用 Claude Code / Codex，欢迎评论区聊聊你的会话管理方式。

#ClaudeCode #Codex #AI编程 #开源 #效率工具 #程序员日常 #AI工具
