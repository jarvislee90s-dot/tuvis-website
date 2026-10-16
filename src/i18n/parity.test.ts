import { describe, expect, it } from "vitest";
import zh from "./zh.json";
import en from "./en.json";

describe("i18n parity", () => {
  it("en 的 key 集合与 zh 完全一致", () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(zh).sort());
  });
  it("没有空值", () => {
    for (const v of Object.values(zh)) expect(v.trim()).not.toBe("");
    for (const v of Object.values(en)) expect(v.trim()).not.toBe("");
  });
  // 全量闸门：本批次起 /en 零中文为硬红线。新键不必单点补测（keys.test 定点哨兵已并入此处）
  it("en 值不含 CJK", () => {
    for (const [k, v] of Object.entries(en)) expect(v, `en.${k}`).not.toMatch(/[\u4e00-\u9fff]/);
  });
});
