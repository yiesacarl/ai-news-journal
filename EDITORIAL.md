# 早晚精选编辑规范

## 时间与范围

每天北京时间（Asia/Shanghai）07:00、19:00在云端开始。morning早报精选10条，evening晚报另选10条，全天目标20条不同事件；上线时间取决于搜索、核验和部署。围绕综合AI动态，增加科研、科学发现、可复现工具和有实质进展的研究内容。

每批至少15个针对性中英文检索，尽量建立30条不同事件的候选池，然后筛选。覆盖产品模型、论文研究、开源工具、融资商业、监管政策与社区热点。参考量子位、机器之心、36氪、极客公园、TechCrunch、The Verge、Ars Technica、MIT Technology Review、The Batch、AI Weekly、Hacker News和Reddit发现线索；回到公司官方公告、论文、项目原仓库及政府原文核验。

优先近12小时新进展，再查24小时遗漏的重要事件；必要时可选近72小时未收录的重要内容，并明确标“近期精选补充”及真实发布日期。不得把旧闻、网页更新时间或收录时间冒充事件日期。

按影响、创新性、实际用途、证据与时效筛选。排除传闻、纯营销、小版本凑数和同一事件多篇报道。比较当日另一批及最近7天归档，事件无实质新进展不重复收录。充分检索仍不足10条时报告缺额及原因，不伪造，不用低质内容补数。

## 原文与写作

实际打开原文核验，技术事实依靠一手来源；重要争议交叉核验。搜索摘要不能代替原文。原文不可读时换来源或跳过。论文仅读摘要必须如实注明。独立撰写中文摘要，不转载全文；事实与解读分开，数据明确实验条件，未审稿论文不写成已确证结论。

每条写明为什么值得关注、原文发布日期与实际读取范围，附完整原文链接。不得编造关注度、点赞或GitHub Star增量。

## 数据合同

一期输入为JSON：

```json
{
  "date": "YYYY-MM-DD",
  "edition": "morning",
  "publishedAt": "ISO-8601 timestamp",
  "searchCount": 15,
  "collectionWindow": { "start": "ISO timestamp", "end": "ISO timestamp", "timezone": "Asia/Shanghai" },
  "stories": [{
    "id": "stable-unique-id", "title": "中文标题", "summary": "独立摘要",
    "whyItMatters": "入选理由", "context": "原文发布日期、读取范围及限制",
    "url": "https://original-source.example/article", "publisher": "发布者",
    "publishedAt": "真实原文日期", "retrievedAt": "实际读取时间",
    "category": "research", "tags": ["科学发现"], "importance": 4
  }]
}
```

category仅为product/research/opensource/business/policy/community；importance为1–5整数。edition为morning/evening。编号、事件、原文URL均去重。

存储：`public/data/YYYY-MM-DD.json`含schemaVersion:1、date、updatedAt、editions。editions.morning/evening各含publishedAt、searchCount、collectionWindow、stories。`public/data/index.json`含schemaVersion:1、updatedAt、days；每个days条目含date、updatedAt、morning和evening两个真实条目数，按日期升序。

以“日期+批次”为幂等单位。当前批次10条已完成时验证部署，不重复发；不足时补齐完整批次，再用--replace-edition替换该批。晚报可以补齐早报缺额，但必须分别记录且两批不同事件。始终保留另一批和本项目所有历史。不能因早报已发而跳过晚报。

## 云端发布

1. 读取远程main最新说明、index及本日和最近7日数据，不使用旧副本覆盖远程。
2. 在云端临时副本运行scripts/publish-edition.mjs；无执行工具时通过GitHub插件生成同等格式，完整核对日期、字段、链接、条目数及批次。
3. 提交前再检查head，有变更则重读、重合并。基于当前tree提交，更新main校验expected_sha，禁止强推。
4. 只提交本期JSON及index和必要的编辑规则修正；不提交凭据、私人日志或原文全文。
5. 检查对应Pages工作流与公开数据，日期、批次、数量及版本一致才报告已上线。失败保留可用内容，说明具体错误及可恢复步骤。

用户已授权按规则自动发布。不要连接站主电脑或浏览器，不购买服务、不发送邮件、不调用另行计费模型API、不新建定时任务。成功报告本批新增数和全天累计数及网站链接；重复无变化不打扰。补跑使用真实日期和时间。
