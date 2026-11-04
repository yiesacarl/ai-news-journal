# AI 资讯日报

每天早晚，读懂值得关注的 AI 进展。综合 AI 资讯，增加科研相关精选。

本项目的页面、样式、交互和内容发布程序独立编写。资讯通过公开原文核验后撰写中文摘要，每条保留原文链接、发布时间、阅读范围和入选理由。首期收录2026年11月4日独立整理的早报10条。

## 阅读功能

- 早报、晚报和日期归档
- 产品、研究、开源、商业、治理与社区主题筛选
- 科研精选入口、关键词搜索、浏览器本地阅读清单
- 原文链接与核验说明，适配手机和桌面

## 发布

网站使用无依赖的 HTML、CSS、JavaScript 和 JSON。GitHub Pages 从本仓库的 `public` 目录发布；在仓库 Settings → Pages 中选择 GitHub Actions，推送 main 后触发发布。

本地预览：`python3 -m http.server 8781 --directory public`。

## 内容更新

北京时间07:00、19:00分别开始整理10条精选，核验后发布。内容搜集由账号中的云端任务执行，GitHub Actions只部署，不采集资讯。运行依赖可用额度和有效GitHub连接，不需要电脑开机，不使用单独计费的模型API。

将一期输入保存为JSON，然后运行：

```sh
node scripts/publish-edition.mjs /path/to/edition.json
```

程序校验输入、保留另一批内容并重建日期索引；修订已经发布的批次时，需要完整的新批次内容并加 `--replace-edition`。数据格式与编辑规则见 [EDITORIAL.md](EDITORIAL.md)。

运行数据发布检查：`node --test tests/publishing.test.mjs`。

网站程序与编辑摘要由站主维护；链接指向的论文、公告和新闻属于相应发布者。本项目不转载原文全文。
