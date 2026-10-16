import { describe, expect, it } from "vitest";
import en from "./en.json";
import zh from "./zh.json";

/** 「/en 完全英文化」批次新键定点闸门：双侧存在、非空、en 值零 CJK（集合级 parity 由 parity.test 兜底）。 */
const NEW_KEYS = ["matrix.colCap", "dl.currentOs"] as const;

const dict = {
  zh: zh as Record<string, string>,
  en: en as Record<string, string>,
};

describe("i18n 新键：矩阵表头与下载徽标", () => {
  it.each(NEW_KEYS)("%s zh/en 双侧存在且非空", (key) => {
    for (const lng of ["zh", "en"] as const) {
      expect(dict[lng][key], `${lng} 侧缺键 ${key}`).toBeTruthy();
      expect(dict[lng][key].trim(), `${lng} 侧 ${key} 为空`).not.toBe("");
    }
  });

  it.each(NEW_KEYS)("%s 的 en 值不含 CJK", (key) => {
    expect(dict.en[key]).not.toMatch(/[\u4e00-\u9fff]/);
  });
});
