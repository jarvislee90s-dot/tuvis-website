import { describe, expect, it } from "vitest";
import { detectSiteLang, LANG_PREF_KEY, readManualLang, rememberManualLang, resolveLangEntry, resolveLangEntryFromBrowser } from "@/utils/langRedirect";
import { denyLocalStorage } from "@/test/domStubs";


/** 「屏蔽所有 Cookie」等存储访问器抛错形态（区别于「存储为空」） */
const deniedStorage = {
  getItem(): string | null {
    throw new DOMException("Access is denied for this document", "SecurityError");
  },
  setItem(): void {
    throw new DOMException("Access is denied for this document", "SecurityError");
  },
};

describe("W1 detectSiteLang 浏览器语言归流（§1.3：简繁一律归中文，其余归英文）", () => {
  it.each([
    [["zh"], "zh"],
    [["zh-CN"], "zh"],
    [["zh-TW"], "zh"],
    [["zh-HK"], "zh"],
    [["zh-SG"], "zh"],
    [["zh-Hans"], "zh"],
    [["zh-Hant"], "zh"],
    [["ZH-TW"], "zh"], // 大小写不敏感
    [["ja", "zh-HK"], "zh"], // 任一标签命中即归中文
  ])("navigator.languages=%j → %s", (langs, expected) => {
    expect(detectSiteLang(langs)).toBe(expected);
  });

  it.each([
    [["en-US"]],
    [["ja"]],
    [["de"]],
    [["fr-CA", "en"]],
    [[]],
    [undefined],
  ])("navigator.languages=%j → en（非中文系一律英文，含不可得）", (langs) => {
    expect(detectSiteLang(langs)).toBe("en");
  });
});

describe("W2 手动偏好：读/写与容错", () => {
  it("remember → read 往返，仅接受 zh/en 白名单值", () => {
    localStorage.removeItem(LANG_PREF_KEY);
    expect(readManualLang()).toBeNull();

    rememberManualLang("en");
    expect(readManualLang()).toBe("en");

    localStorage.setItem(LANG_PREF_KEY, "fr"); // 脏值（非白名单）按无偏好处理
    expect(readManualLang()).toBeNull();

    localStorage.removeItem(LANG_PREF_KEY);
  });

  it("存储访问器抛错时：读取视为无偏好、写入静默不抛", () => {
    expect(readManualLang(deniedStorage)).toBeNull();
    expect(() => rememberManualLang("en", deniedStorage)).not.toThrow();
  });

  it("全局 localStorage 访问器本身抛错（屏蔽 Cookie 真实形态）且不传 storage 实参 → 安全回退，不炸调用方", () => {
    const restore = denyLocalStorage();
    try {
      expect(readManualLang()).toBeNull();
      expect(() => rememberManualLang("en")).not.toThrow();
      // 分流入口（组件实际调用形态：不传 storage）在此环境回自动检测而非崩溃
      expect(resolveLangEntry(["zh-CN"])).toBe("zh");
      expect(resolveLangEntry(["en-US"])).toBe("en");
    } finally {
      restore();
    }
  });
});

describe("入口分流 resolveLangEntry：手动偏好优先（W2），否则检测（W1）", () => {
  it("有偏好 → 一律以偏好为准，不做语言检测", () => {
    expect(resolveLangEntry(["zh-CN"], { getItem: () => "en" })).toBe("en");
    expect(resolveLangEntry(["en-US"], { getItem: () => "zh" })).toBe("zh");
  });

  it("无偏好/脏偏好 → 按浏览器语言检测", () => {
    expect(resolveLangEntry(["zh-CN"], { getItem: () => null })).toBe("zh");
    expect(resolveLangEntry(["zh-CN"], { getItem: () => "fr" })).toBe("zh");
    expect(resolveLangEntry(["en-US"], { getItem: () => null })).toBe("en");
  });

  it("存储不可用 → 回自动检测", () => {
    expect(resolveLangEntry(["zh-CN"], deniedStorage)).toBe("zh");
    expect(resolveLangEntry(["en-US"], deniedStorage)).toBe("en");
  });
});

describe("resolveLangEntryFromBrowser 浏览器回退链（languages 缺失/空 → language → en）", () => {
  it("languages 非空 → 直接归流", () => {
    expect(resolveLangEntryFromBrowser({ languages: ["zh-TW"], language: "en-US" })).toBe("zh");
    expect(resolveLangEntryFromBrowser({ languages: ["de"], language: "zh-CN" })).toBe("en");
  });

  it("languages 空/缺失 → 回退 language", () => {
    expect(resolveLangEntryFromBrowser({ languages: [], language: "zh-CN" })).toBe("zh");
    expect(resolveLangEntryFromBrowser({ languages: undefined, language: "ja-JP" })).toBe("en");
  });

  it("两者皆不可得 → 归英文", () => {
    expect(resolveLangEntryFromBrowser({ languages: [], language: "" })).toBe("en");
  });
});
