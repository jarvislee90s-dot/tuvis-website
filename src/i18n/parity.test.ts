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
});
