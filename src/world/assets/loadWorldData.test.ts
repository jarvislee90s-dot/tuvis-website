import { describe, expect, it } from "vitest";
import { assetUrl, loadWorldContent, loadWorldData, preloadCoreAssets } from "./loadWorldData";
import { bundle, fixtureFetch } from "../testFixtures";

describe("assetUrl", () => {
  it("maps pack-relative paths under world/v1 and the deployment base", () => {
    expect(assetUrl("assets/scene/workshop-base.png", "/tuvis-website/")).toBe(
      "/tuvis-website/world/v1/assets/scene/workshop-base.png",
    );
    expect(assetUrl("/assets/hero.png", "/tuvis-website")).toBe(
      "/tuvis-website/world/v1/assets/hero.png",
    );
  });
});

describe("loadWorldContent", () => {
  it("requests only manifest and content JSON, never scene.json", async () => {
    const fetcher = fixtureFetch();
    const result = await loadWorldContent(fetcher);
    expect(result.content.equipment).toHaveLength(4);
    expect(fetcher.calls).toHaveLength(2);
    expect(fetcher.calls.some((url) => url.endsWith("manifest.json"))).toBe(true);
    expect(fetcher.calls.some((url) => url.endsWith("content/world.zh.json"))).toBe(true);
    expect(fetcher.calls.some((url) => url.endsWith("scene.json"))).toBe(false);
  });

  it("still renders content when scene.json would fail", async () => {
    const base = fixtureFetch();
    const fetcher = (async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url.endsWith("scene.json")) throw new Error("scene offline");
      return base(input);
    }) as typeof fetch;
    const result = await loadWorldContent(fetcher);
    expect(result.content.title).toContain("兔维斯世界");
  });
});

describe("loadWorldData", () => {
  it("loads scene.json only for the workshop", async () => {
    const fetcher = fixtureFetch();
    const result = await loadWorldData(fetcher);
    expect(result.scene.hotspots).toHaveLength(12);
    expect(fetcher.calls.some((url) => url.endsWith("scene.json"))).toBe(true);
  });

  it("rejects an unsupported manifest schema", async () => {
    const mockSchemaVersion2 = fixtureFetch({ manifest: { schemaVersion: 2 } });
    await expect(loadWorldData(mockSchemaVersion2)).rejects.toThrow(/schema/i);
  });

  it("rejects a manifest frame that references a missing asset", async () => {
    const broken = structuredClone(bundle.manifest);
    broken.frames.sw.asset = "missing-asset";
    const fetcher = fixtureFetch({ manifest: broken });
    await expect(loadWorldContent(fetcher)).rejects.toThrow(/unknown asset/i);
  });
});

describe("preloadCoreAssets", () => {
  it("rejects when any core image fails", async () => {
    await expect(
      preloadCoreAssets(bundle, async () => {
        throw Error("offline");
      }),
    ).rejects.toThrow("offline");
  });

  it("loads every core asset URL", async () => {
    const urls: string[] = [];
    await preloadCoreAssets(bundle, async (url) => {
      urls.push(url);
    });
    expect(urls).toHaveLength(bundle.manifest.coreAssets.length);
    expect(urls.every((url) => url.includes("/world/v1/assets/"))).toBe(true);
  });

  it("rejects an unknown asset id", async () => {
    const { preloadAssets } = await import("./loadWorldData");
    await expect(preloadAssets(bundle, ["nope"], async () => undefined)).rejects.toThrow(/unknown asset/i);
  });
});
