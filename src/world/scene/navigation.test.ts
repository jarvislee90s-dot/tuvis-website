import { describe, expect, it } from "vitest";
import { scene } from "../testFixtures";
import type { Direction } from "../types";
import { isSegmentClear, isWalkable, pointInPolygon, toScenePoint } from "./geometry";
import { directionFor, findPath } from "./navigation";

describe("toScenePoint", () => {
  it("maps a full-size rendered rect 1:1", () => {
    expect(toScenePoint([868, 562], [100, 50, 1536, 1024], [1536, 1024])).toEqual([768, 512]);
  });

  it("maps a scaled rendered rect to scene pixels", () => {
    expect(toScenePoint([484, 306], [100, 50, 768, 512], [1536, 1024])).toEqual([768, 512]);
  });

  it("rejects clicks outside the rendered image", () => {
    expect(toScenePoint([99, 50], [100, 50, 768, 512], [1536, 1024])).toBeNull();
    expect(toScenePoint([100 + 768, 306], [100, 50, 768, 512], [1536, 1024])).toBeNull();
  });
});

describe("walkability", () => {
  it("rejects a point inside a furniture obstacle", () => {
    expect(isWalkable([1070, 714], scene)).toBe(false);
  });

  it("rejects the garden outside the room", () => {
    expect(isWalkable([40, 40], scene)).toBe(false);
  });

  it("rejects a straight segment through the lounge chair", () => {
    expect(isSegmentClear([950, 714], [1190, 714], scene)).toBe(false);
  });

  it("accepts the spawn point and a short legal segment", () => {
    expect(isWalkable(scene.spawn, scene)).toBe(true);
    expect(isSegmentClear(scene.spawn, scene.nav.nodes.center, scene)).toBe(true);
  });
});

describe("findPath", () => {
  it("reaches every hotspot approach point from spawn", () => {
    expect(scene.hotspots).toHaveLength(12);
    for (const hotspot of scene.hotspots) {
      const path = findPath(scene.spawn, hotspot.approach, scene);
      expect(path, hotspot.id).not.toBeNull();
      expect(path!.length).toBeGreaterThan(0);
      expect(path![0]).toEqual(scene.spawn);
      expect(path![path!.length - 1]).toEqual(hotspot.approach);
    }
  });

  it("routes around the lounge chair and validates every segment", () => {
    const path = findPath([950, 714], [1190, 714], scene);
    expect(path).not.toBeNull();
    expect(path!.length).toBeGreaterThan(2);
    for (let i = 1; i < path!.length; i += 1) {
      expect(isSegmentClear(path![i - 1], path![i], scene), `segment ${i}`).toBe(true);
    }
    for (const point of path!) {
      for (const obstacle of scene.obstacles) {
        expect(pointInPolygon(point, obstacle), `${point} inside obstacle`).toBe(false);
      }
    }
  });

  it("returns null for unreachable garden coordinates", () => {
    expect(findPath(scene.spawn, [40, 40], scene)).toBeNull();
  });

  it("returns a single point for a zero-distance request", () => {
    expect(findPath(scene.spawn, scene.spawn, scene)).toEqual([scene.spawn]);
  });
});

describe("directionFor", () => {
  const cases: Array<[Direction, readonly [number, number]]> = [
    ["se", [10, 10]],
    ["sw", [-10, 10]],
    ["ne", [10, -10]],
    ["nw", [-10, -10]],
  ];
  for (const [expected, delta] of cases) {
    it(`faces ${expected} for delta ${delta.join(",")}`, () => {
      expect(directionFor([100, 100], [100 + delta[0], 100 + delta[1]], "se")).toBe(expected);
    });
  }

  it("keeps the current direction for zero distance", () => {
    expect(directionFor([100, 100], [100, 100], "nw")).toBe("nw");
  });

  it("keeps a matching diagonal for axis-aligned movement", () => {
    expect(directionFor([100, 100], [80, 100], "nw")).toBe("nw");
    expect(directionFor([100, 100], [100, 80], "nw")).toBe("nw");
    expect(directionFor([100, 100], [120, 100], "se")).toBe("se");
  });
});
