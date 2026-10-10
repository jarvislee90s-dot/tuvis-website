# Tuvis 兔维斯 · 品牌决策记录（BRAND.md）

> 本文件是品牌线的单一事实源（定名 / 四关 / 吉祥物 / 域名 / 官网待办）。
> 更新日期：2026-10-10。执行清单（issue #76）尚未启动，见 §6。
>
> **🔴 2026-10-10 晚·视觉依据换代**：`brand/final/`（「少年兔科技管家」角色设定图 + 《Tuvis Mascot & Brand System v1.0》 + 赛博兔侠全身立绘）为**最终视觉唯一依据**。本文 §3 的 candidate-34 方案（白轻框目镜/暖铜饰线/阿卡姆结构）及全部衍生素材**降级为历史稿**，已归档至 `brand/archive/`。新方案要点：暖铜退役、青蓝 HUD 强调、大头三头身少年感、胡萝卜徽章冻结结构（叶片/包边固定、仅灯体变色）。裁切与抠图工作素材见 `final/extracted/`（含 Hero 透明立绘），官网对接详见 `../SPEC.md` §2 决策 25/26。

## 1. 命名定稿 ✅

| 项 | 定稿 |
|---|---|
| 品牌名（英） | **Tuvis** |
| 品牌名（中） | **兔维斯** |
| 描述语（中） | 兔维斯 —— 你的桌面多 Agent 指挥台 |
| 描述语（英） | Tuvis —— Your desktop multi-agent command deck |
| 类目词 / SEO 槽位 | multi-agent manager / 多 Agent 管理（repo description、topics、上架关键词用） |
| bundle identifier（⚠️ 上架前硬时点） | 建议 `io.github.jarvislee90s.tuvis` 或 `com.jarvislee90s.tuvis`，未定 |

**命名公式**（用户裁决）：熟悉词 × 萌哺乳动物，自然拼接好读；中文直接读出动物（兔维斯）；英文侧动物认知交给吉祥物；-vis 尾音保留对个人品牌 Jarvis 的呼应（加分项非硬约束）。

**关键裁决摘要**（2026-10-10 六问定案）：
- 中国文化从硬约束降为加分项（修订 issue #76 六轮海选沉淀的约束）
- 音链不硬性；直接叫 Jarvis 出局（Jasper.ai 判例：2022 年漫威/迪士尼商标压力下改名；microsoft/JARVIS 25.4k★）
- Mavis 模式原型已被占：腾讯 [Marvis 马维斯](https://marvis.qq.com)（操作系统级 AI 管家，同品类）；marvis-ai/marvis 同域撞名
- 萌哺乳动物空间已扫干（猫被拼音 Mao 撞死、骆驼科被 LLM 家族注册、河狸死于英语俚语、水豚/quokka 是吉祥物不是名字……），兔是唯一同时满足「萌 × 中文直读 × -vis 尾音」的头部
- 竞品 Tuvis Solutions（B2B 消息合规，原 Whatslly）：不同赛道无品类混淆，中文市场零存在，可共存

## 2. 四关记录（issue #76 门槛）

| 关 | 结果 |
|---|---|
| 1. GitHub 命名空间 | ✅ 干净（最高 1★ 噪音 repo；`tuvis-ai` org 有 0★ 占位） |
| 2. App Store / 在架应用 | ✅ 无消费级同名 app；注记：Tuvis Solutions 企业市场在架（Salesforce AppExchange / AWS Marketplace） |
| 3. 域名 | ✅ 见 §4（tuvis.app 可注册） |
| 4. 无 Agent 厂商商标 | ✅；正式商标清查（9/42 类）列为上架前待办 |

## 3. 吉祥物

**形象定稿**（2026-10-10 终版，candidate-34-whiteframe 系列为基准）：

- **头**：毛茸茸灰白兔头（侏儒兔式圆脸大眼、平静沉稳的管家表情），站姿挺拔、头身比适中
- **目镜**：白色轻薄边框护目镜——单块天蓝色半透明大镜片、淡青色 HUD 微光、右侧一粒青蓝传感器灯；**生物眼睛清晰可见、绝不发光**（发光眼=失去生物感，红线）
- **体**：深灰色哑光科技连体衣打底 + 银白色金属装甲板块（胸甲、肩甲、前臂护甲、小腿护甲、手套战靴）；枪灰关节 + 少量暖铜细饰线。结构参考《蝙蝠侠：阿卡姆骑士》"连体衣+板块"分层（仅借结构，不借配色与符号）
- **灯**：胸甲正中一枚**胡萝卜轮廓磨砂玻璃透镜**（上宽下尖、无叶子、细银包边），灯芯颜色=状态（绿=运行 / 黄=等待批准 / 红=中断，对应卡面状态）
- **IP 三不要**：红+金主色；三角/弧形反应堆造型；暗色头套+竖直尖耳剪影
- **装饰演进史**（备查）：耳环（弃）→ 耳机（弃：兔耳难做）→ 半盔面甲（candidate-28，过于机甲）→ 无边框发光边（candidate-34-edgeglow，备选方案）→ **白色轻框目镜（定稿）**
- 待产出：手持全息平板站指挥台的场景版（官网 hero 用）

**资产索引**（同目录）：
- **Logo 定稿（亮/暗双版）**：`final/logo/versions/05-aigen/final-light-v3.png`（亮色主题）/ `final-dark-v3.png`（暗色主题）——深藏青兔头 + 白框目镜带，圆角砖底；已接入远程看板品牌行（主仓库 `src/mobile/Board.tsx`，主题自适应 dark: 变体，256px 压缩版在主仓库 `src/mobile/assets/`）；App 图标/托盘候选见 `final/extracted/13-14-15-*`；母版副本已镜像至主仓库 `assets/brand/`（final-light/dark-v3 + favicon-64，应用引用自包含）
- **主定稿三态**：`mascot-gen/candidate-34-whiteframe.png`（绿·运行）/ `candidate-34-state-yellow.png`（黄·等待）/ `candidate-34-state-red.png`（红·中断）；已同步到 `../assets/`
- **主形象·讲解姿态**：`mascot-gen/style-7-uscartoon-b.png`（美漫经典卡通，单指讲解——文档/教程/视频区配图；已入官网视频占位区，`website/assets/tuvis-explain.png`）；style-7-a 摊手为社区变体
- 候补：candidate-28/29（面甲形态）、candidate-34-edgeglow（发光无边框）、candidate-33 系列（薄 AR 目镜）、candidate-24/25（连体衣结构稿）
- 选型参考表：sheet-A 表情 / sheet-B 动作 / sheet-C-v2 毛色 / sheet-D 品种 / sheet-E 体型 / sheet-F 表情；`ref-armor-style.jpg`（装甲结构参考，阿卡姆骑士）
- 历史稿：tuvis-mascot-draft.svg/.png（旧全机械方案代码版，spec 的 token 体系仍可参考）、tuvis-lineart-badge.svg/.png（线稿徽章）、candidate-1~33 过程稿
- **风格矩阵**（style-1~7，2026-10-10）：贴纸（图标/周边）/ 赛璐璐（二次元物料）/ 像素（favicon·README 彩蛋）/ 粘土·毛毡（实体周边预览）/ **水墨（中文发布物料，中国文化加分项）** / **美漫经典卡通（style-7-a 摊手·b 讲解，国际社区物料；借黄金时代画法，规避兔八哥专属特征，对外不提 IP 名）**；⚠️ style-2/4/6/7 灯被画成真胡萝卜或椭圆宝石，正式资产须收口为轮廓灯
- **Emblem 复杂徽标**（emblem-1-engrave / emblem-2-heraldic，2026-10-10）：雕版圆徽（纸币式排线+齿轮环+蓝镜片）与古典纹章（盾牌+月桂+顶星+空白绶带预留 TUVIS 字位）。管线=agnes 插图 → 灰度中值去纹 → 二值化 → imagetracerjs 描摹 → SVG；**263/269 条路径、约 1.1–1.3 万绘图命令、156–177KB**（对照简单标仅 7 个形状）；单色母版（彩色参考见同名 .png），回渲染 1024/128 已验证。用途：官网装饰、大尺寸物料、周边、印章；favicon/托盘仍用简单标——即品牌惯例的"双标体系"（复杂 emblem + 简化 icon，Hermès 同款打法）
- 已知事项：三态为图生图重生成、细节轻微漂移，正式物料应锁定 34 号底图调色派生；UI 内状态表达用托盘矢量灯
- **生成谱系**（复现用）：主形象是**多代图生图链**，非纯文生图——起点 candidate-6（纯提示词文生图）→ 9 → 25（双参考：角色图+阿卡姆装甲结构图）→ 26 → 29-v2 → 31 → 32-blue-d → 33-slim-b → **34-whiteframe（定稿）**；黄/红态=34 底图换色图生图；style-7-uscartoon-b=34+美漫画风参考图双参考生图。同提示词无法精确复现同一张脸，新物料一律以 34 底图 img2img 派生。**主链全量原始提示词见 `brand/PROMPTS.md`**

**小尺寸降级规则**（沿用 spec）：≤48px 只用头+耳+面罩；≤16px 托盘只用胡萝卜灯单符号，三态即三个托盘图标。

## 4. 域名调研（快照 2026-10-09/10，价格以结算页为准）

**推荐组合（约 ¥150–200/年）**：

| 角色 | 域名 | 价格 | 说明 |
|---|---|---|---|
| 主域名 | **tuvis.app** | 海外约 $14–20/年（Cloudflare/Porkbun） | 唯一存活的纯品牌+主流后缀；强制 HTTPS 配合落地页；国内注册商不售 |
| 国内兜底/防御 | **tuvisai.cn** | ¥38 首年 / ¥42 续费 | 全场最低；实测非溢价非保留字；可备案；重定向主域 |
| 可选 | tuvis.bot | 海外 $40–100/年 | 2023-10 起取消资质审核先到先得；续费偏贵 |

**可注册（10）**：tuvis.app / .io / .me / .cc；tuvisai.cn / tuvis-ai.com / tuvisagent.com / tuvis-agent.com / gettuvis.com / tuvis.bot
**已被注册**：tuvis.com（Tuvis Solutions）/ .ai / .dev / .net / .top / .xyz / .co / tuvis.cn / .com.cn / tuvisai.com
**避坑**：.me 续费 135；.xyz 续费 106–120；.io/.app/.dev/.bot 国内阿里云/腾讯云均不售；腾讯云 .co 暂停注册；.cc/.me 不可备案

**🔴 情报**：tuvis.cn 与 tuvis.com.cn 同一注册人，**2026-12-18 到期（约 2 个月）**。若掉落可捡回纯品牌 .cn——不可作为规划前提，严禁抢注/预订；12 月中下旬可再查一次。

**待办**：用户拍板后购买 tuvis.app（海外）+ tuvisai.cn（阿里云），均开自动续费。

## 5. 官网

> 品牌档案在 `brand/` 子目录；官网草稿已被建站会话移至 `legacy/index.html`，正式站按 `SPEC.md`（v1.3）待 P0 动工。

- **favicon 资产已备**：`brand/tuvis-favicon-64.png`（从定稿深砖版 final-dark-v3 缩出）——新站动工时直接引用
- 介绍视频位：占位框已留（讲解姿态图打底），视频做好后嵌入
- 语言：先中文单页；英文版预留（ccswitch 用 /zh/ /en/ 路径模式）
- 上线渠道：GitHub Pages 或 tuvis.app（§4）——建议与仓库改名同批上线，避免双名期 URL 反复
- 扁平矢量 logo：`brand/mascot-gen/logo-flat-candidate-1.png`（候选 1，待选方向后手写参数化 SVG 终版）

## 6. 执行清单状态

- issue #76（改名 playbook）**未启动**；定稿记录以本文件为准，启动时照单执行
- 待用户裁决：执行时点（定稿先行 vs 连执行一起）
- 上架前硬时点提醒：bundle identifier 定稿、正式商标清查、updater 签名密钥连续性
