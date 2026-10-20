import type { Point, Rect, SceneDefinition } from "../types";

const EPS = 1e-7;

export function pointInPolygon(point: Point, polygon: readonly Point[]): boolean {
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    // Boundary counts as inside.
    if (
      (Math.abs(xi - xj) < EPS && Math.abs(x - xi) < EPS && y >= Math.min(yi, yj) - EPS && y <= Math.max(yi, yj) + EPS) ||
      (Math.abs(yi - yj) < EPS && Math.abs(y - yi) < EPS && x >= Math.min(xi, xj) - EPS && x <= Math.max(xi, xj) + EPS)
    ) {
      return true;
    }
    const intersects = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

export function distancePointToSegment(point: Point, a: Point, b: Point): number {
  const [px, py] = point;
  const [ax, ay] = a;
  const [bx, by] = b;
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSq = dx * dx + dy * dy;
  if (lengthSq === 0) return Math.hypot(px - ax, py - ay);
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lengthSq));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

function orientation(a: Point, b: Point, c: Point): number {
  const value = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  if (Math.abs(value) < EPS) return 0;
  return value > 0 ? 1 : -1;
}

function onSegment(a: Point, b: Point, p: Point): boolean {
  return (
    Math.min(a[0], b[0]) - EPS <= p[0] && p[0] <= Math.max(a[0], b[0]) + EPS &&
    Math.min(a[1], b[1]) - EPS <= p[1] && p[1] <= Math.max(a[1], b[1]) + EPS
  );
}

export function segmentsIntersect(a: Point, b: Point, c: Point, d: Point): boolean {
  const o1 = orientation(a, b, c);
  const o2 = orientation(a, b, d);
  const o3 = orientation(c, d, a);
  const o4 = orientation(c, d, b);
  if (o1 !== o2 && o3 !== o4) return true;
  if (o1 === 0 && onSegment(a, b, c)) return true;
  if (o2 === 0 && onSegment(a, b, d)) return true;
  if (o3 === 0 && onSegment(c, d, a)) return true;
  if (o4 === 0 && onSegment(c, d, b)) return true;
  return false;
}

export function distanceSegmentToSegment(a: Point, b: Point, c: Point, d: Point): number {
  if (segmentsIntersect(a, b, c, d)) return 0;
  return Math.min(
    distancePointToSegment(a, c, d),
    distancePointToSegment(b, c, d),
    distancePointToSegment(c, a, b),
    distancePointToSegment(d, a, b),
  );
}

function distanceToPolygon(point: Point, polygon: readonly Point[]): number {
  if (pointInPolygon(point, polygon)) return 0;
  let min = Infinity;
  for (let i = 0; i < polygon.length; i += 1) {
    min = Math.min(min, distancePointToSegment(point, polygon[i], polygon[(i + 1) % polygon.length]));
  }
  return min;
}

function segmentDistanceToPolygon(a: Point, b: Point, polygon: readonly Point[]): number {
  if (pointInPolygon(a, polygon) || pointInPolygon(b, polygon)) return 0;
  let min = Infinity;
  for (let i = 0; i < polygon.length; i += 1) {
    min = Math.min(min, distanceSegmentToSegment(a, b, polygon[i], polygon[(i + 1) % polygon.length]));
  }
  return min;
}

/** Foot centre is inside the walkable polygon and clear of every obstacle. */
export function isWalkable(point: Point, scene: SceneDefinition): boolean {
  if (!pointInPolygon(point, scene.walkable)) return false;
  const radius = scene.footRadius ?? 0;
  for (const obstacle of scene.obstacles) {
    if (pointInPolygon(point, obstacle)) return false;
    if (distanceToPolygon(point, obstacle) < radius - EPS) return false;
  }
  return true;
}

/** A straight move is legal only when the whole segment stays clear. */
export function isSegmentClear(a: Point, b: Point, scene: SceneDefinition): boolean {
  if (!isWalkable(a, scene) || !isWalkable(b, scene)) return false;
  if (a[0] === b[0] && a[1] === b[1]) return true;

  for (let i = 0; i < scene.walkable.length; i += 1) {
    if (segmentsIntersect(a, b, scene.walkable[i], scene.walkable[(i + 1) % scene.walkable.length])) {
      return false;
    }
  }

  const radius = scene.footRadius ?? 0;
  for (const obstacle of scene.obstacles) {
    if (segmentDistanceToPolygon(a, b, obstacle) < radius - EPS) return false;
  }
  return true;
}

/**
 * Convert a client-space pointer into scene pixels using the actual rendered
 * image rectangle, so letterboxing and CSS scaling never shift the click.
 */
export function toScenePoint(client: Point, rendered: Rect, sceneSize: Point): Point | null {
  const [left, top, width, height] = rendered;
  if (width <= 0 || height <= 0) return null;
  const [clientX, clientY] = client;
  if (clientX < left || clientX >= left + width || clientY < top || clientY >= top + height) {
    return null;
  }
  return [
    ((clientX - left) / width) * sceneSize[0],
    ((clientY - top) / height) * sceneSize[1],
  ];
}
