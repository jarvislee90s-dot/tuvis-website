import type { Direction, Point, SceneDefinition } from "../types";
import { isSegmentClear, isWalkable } from "./geometry";

/**
 * Map a movement delta to one of the four isometric poses. Pure horizontal or
 * vertical motion keeps the current diagonal when it already faces that way.
 */
export function directionFor(from: Point, to: Point, current: Direction): Direction {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  if (Math.abs(dx) < 1e-9 && Math.abs(dy) < 1e-9) return current;
  if (Math.abs(dx) < 1e-9) {
    if (dy < 0) return current === "nw" ? "nw" : "ne";
    return current === "sw" ? "sw" : "se";
  }
  if (Math.abs(dy) < 1e-9) {
    if (dx > 0) return current === "ne" ? "ne" : "se";
    return current === "nw" ? "nw" : "sw";
  }
  if (dx > 0) return dy > 0 ? "se" : "ne";
  return dy > 0 ? "sw" : "nw";
}

type Edge = readonly [number, number, number];

/**
 * Shortest legal route across the hand-authored channel graph. The temporary
 * start/end points are connected to every channel node with a fully checked
 * segment, and the returned polyline is re-validated segment by segment.
 */
export function findPath(from: Point, to: Point, scene: SceneDefinition): Point[] | null {
  if (!isWalkable(from, scene) || !isWalkable(to, scene)) return null;
  if (from[0] === to[0] && from[1] === to[1]) return [from];

  const nodeIds = Object.keys(scene.nav.nodes);
  const nodeIndex = new Map(nodeIds.map((id, index) => [id, index]));
  const points: Point[] = nodeIds.map((id) => scene.nav.nodes[id]);
  const start = points.length;
  const goal = start + 1;

  const edges: Edge[] = [];
  const addEdge = (a: number, b: number) => {
    if (a === b) return;
    const [ax, ay] = points[a];
    const [bx, by] = points[b];
    edges.push([a, b, Math.hypot(bx - ax, by - ay)]);
  };

  for (const [a, b] of scene.nav.edges) {
    const ai = nodeIndex.get(a);
    const bi = nodeIndex.get(b);
    if (ai === undefined || bi === undefined) continue;
    if (!isSegmentClear(points[ai], points[bi], scene)) continue;
    addEdge(ai, bi);
    addEdge(bi, ai);
  }

  points.push(from, to);
  for (let i = 0; i < nodeIds.length; i += 1) {
    if (isSegmentClear(from, points[i], scene)) addEdge(start, i);
    if (isSegmentClear(points[i], to, scene)) addEdge(i, goal);
  }
  if (isSegmentClear(from, to, scene)) addEdge(start, goal);

  const size = points.length;
  const dist = new Array<number>(size).fill(Infinity);
  const previous = new Array<number>(size).fill(-1);
  const visited = new Array<boolean>(size).fill(false);
  dist[start] = 0;

  for (let step = 0; step < size; step += 1) {
    let current = -1;
    let best = Infinity;
    for (let i = 0; i < size; i += 1) {
      if (!visited[i] && dist[i] < best) {
        best = dist[i];
        current = i;
      }
    }
    if (current === -1 || current === goal) break;
    visited[current] = true;
    for (const [a, b, weight] of edges) {
      if (a !== current || visited[b]) continue;
      const candidate = dist[current] + weight;
      if (candidate < dist[b]) {
        dist[b] = candidate;
        previous[b] = current;
      }
    }
  }

  if (!Number.isFinite(dist[goal])) return null;

  const route: Point[] = [];
  for (let at = goal; at !== -1; at = previous[at]) {
    route.push(points[at]);
    if (at === start) break;
  }
  route.reverse();

  for (let i = 1; i < route.length; i += 1) {
    if (!isSegmentClear(route[i - 1], route[i], scene)) return null;
  }
  return route;
}

export type MotionTarget = {
  token: number;
  path: Point[];
  hotspotId?: string;
  /** Arrive as a pickup run (collect the floating part) when true. */
  pickup?: boolean;
};

export type MotionState = {
  position: Point;
  direction: Direction;
  target: MotionTarget | null;
};

/**
 * Advance at most 100 ms of travel per call (190 px/s by default), testing
 * every traversed segment. A large frame gap therefore cannot tunnel through
 * furniture. The arrival token fires exactly once because the target is
 * cleared on the frame that reaches the final point.
 */
export function advanceMotion(
  motion: MotionState,
  elapsedMs: number,
  scene: SceneDefinition,
): { motion: MotionState; arrived?: { token: number; hotspotId?: string; pickup?: boolean } } {
  const target = motion.target;
  if (!target) return { motion };

  const clamped = Math.max(0, Math.min(elapsedMs, 100));
  let budget = (scene.speed * clamped) / 1000;
  let position = motion.position;
  let direction = motion.direction;
  const path = [...target.path];

  while (path.length > 0 && path[0][0] === position[0] && path[0][1] === position[1]) {
    path.shift();
  }
  if (path.length === 0) {
    return {
      motion: { position, direction, target: null },
      arrived: { token: target.token, hotspotId: target.hotspotId, pickup: target.pickup },
    };
  }

  while (budget > 0 && path.length > 0) {
    const next = path[0];
    if (!isSegmentClear(position, next, scene)) {
      return { motion: { position, direction, target: null } };
    }
    const distance = Math.hypot(next[0] - position[0], next[1] - position[1]);
    const nextDirection = directionFor(position, next, direction);
    if (distance <= budget) {
      position = next;
      direction = nextDirection;
      budget -= distance;
      path.shift();
    } else {
      const ratio = budget / distance;
      position = [
        position[0] + (next[0] - position[0]) * ratio,
        position[1] + (next[1] - position[1]) * ratio,
      ];
      direction = nextDirection;
      budget = 0;
    }
  }

  return {
    motion: {
      position,
      direction,
      target: path.length > 0 ? { ...target, path } : null,
    },
    ...(path.length === 0
      ? { arrived: { token: target.token, hotspotId: target.hotspotId, pickup: target.pickup } }
      : {}),
  };
}
