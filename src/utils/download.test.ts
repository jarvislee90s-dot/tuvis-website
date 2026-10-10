import { describe, expect, it } from "vitest";
import { detectOS, matchAsset } from "./download";

const ASSETS = [
  { name: "Tuvis-0.5.5-macOS.dmg", url: "https://x/Tuvis-0.5.5-macOS.dmg" },
  { name: "Tuvis-0.5.5-Windows-x64-setup.exe", url: "https://x/Tuvis-0.5.5-Windows-x64-setup.exe" },
  { name: "latest.json", url: "https://x/latest.json" },
];

describe("download", () => {
  it("detectOS 识别三大平台 UA", () => {
    expect(detectOS("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15)")).toBe("macos");
    expect(detectOS("Mozilla/5.0 (Windows NT 10.0)")).toBe("windows");
    expect(detectOS("Mozilla/5.0 (X11; Linux)")).toBe("other");
  });
  it("matchAsset 按平台匹配安装包", () => {
    expect(matchAsset(ASSETS, "macos")).toBe(ASSETS[0].url);
    expect(matchAsset(ASSETS, "windows")).toBe(ASSETS[1].url);
    expect(matchAsset(ASSETS, "other")).toBeNull();
  });
});
