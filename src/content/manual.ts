// 用户手册目录表（13 页 5 组）——与兔维斯仓 docs/user-manual/{zh,en}/*.md 的 slug 一一对应。
// 真值的正文在产品仓（GitHub 可读可编辑），本表只登记导航用元数据（双语标题/分组）：
// 新增/删除章节 = 产品仓增删 MD + 本表增删一行（两边不同步时，文章页 fetch 404 或
// 侧栏挂空链接，肉眼可见，不会静默）
export interface ManualPage {
  slug: string;
  zh: string;
  en: string;
}

export interface ManualGroup {
  zh: string;
  en: string;
  pages: ManualPage[];
}

export const MANUAL_GROUPS: ManualGroup[] = [
  {
    zh: "开始使用",
    en: "Get started",
    pages: [
      { slug: "01-overview", zh: "兔维斯是什么", en: "What is Tuvis" },
      { slug: "02-installation", zh: "下载与安装", en: "Download & install" },
      { slug: "03-quick-start", zh: "快速上手", en: "Quick start" },
    ],
  },
  {
    zh: "会话与看板",
    en: "Sessions & board",
    pages: [
      { slug: "04-dashboard", zh: "会话看板", en: "Session board" },
      { slug: "05-subagent-observatory", zh: "子 Agent 观察台", en: "Sub-agent observatory" },
      { slug: "06-notifications", zh: "通知与提醒", en: "Notifications" },
    ],
  },
  {
    zh: "桌宠与远程",
    en: "Pet & remote",
    pages: [
      { slug: "07-pet", zh: "桌宠", en: "Desktop pet" },
      { slug: "08-mobile-remote", zh: "手机看板与远程注入", en: "Mobile board & remote injection" },
    ],
  },
  {
    zh: "资源与用量",
    en: "Resources & usage",
    pages: [
      { slug: "09-resources", zh: "资源管理", en: "Resources" },
      { slug: "10-presets", zh: "预设组", en: "Presets" },
      { slug: "11-usage", zh: "用量统计", en: "Usage stats" },
    ],
  },
  {
    zh: "帮助",
    en: "Help",
    pages: [
      { slug: "12-troubleshooting", zh: "故障排查", en: "Troubleshooting" },
      { slug: "13-faq", zh: "常见问题 FAQ", en: "FAQ" },
    ],
  },
];

/** 扁平序（上一页/下一页 pager 的顺序） */
export const MANUAL_FLAT = MANUAL_GROUPS.flatMap((g) => g.pages);