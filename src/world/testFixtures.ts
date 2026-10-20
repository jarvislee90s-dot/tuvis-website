import manifestJson from "../../tuvis-world/05_handoff/v1/manifest.json";
import sceneJson from "../../tuvis-world/05_handoff/v1/scene.json";
import contentJson from "../../tuvis-world/05_handoff/v1/content/world.zh.json";
import type { SceneDefinition, WorldBundle, WorldContent, WorldManifest } from "./types";

export const manifest = manifestJson as unknown as WorldManifest;
export const scene = sceneJson as unknown as SceneDefinition;
export const content = contentJson as unknown as WorldContent;
export const bundle: WorldBundle = { manifest, scene, content };

export type WorldFixtureOverrides = Partial<Record<"manifest" | "scene" | "content", unknown>>;

type FixtureFetch = typeof fetch & { calls: string[] };

function urlOf(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

/**
 * Static JSON fetcher for component and loader tests. `calls` records the
 * requested URLs so tests can assert lazy loading (landing never asks for
 * scene.json).
 */
export function fixtureFetch(overrides: WorldFixtureOverrides = {}): FixtureFetch {
  const bodies = {
    manifest: overrides.manifest ?? manifest,
    scene: overrides.scene ?? scene,
    content: overrides.content ?? content,
  };
  const calls: string[] = [];
  const fetcher = async (input: RequestInfo | URL): Promise<Response> => {
    const url = urlOf(input);
    calls.push(url);
    const manifestBody = bodies.manifest as { contentPath?: string; scenePath?: string };
    const contentPath = manifestBody?.contentPath ?? "content/world.zh.json";
    const scenePath = manifestBody?.scenePath ?? "scene.json";
    let body: unknown;
    if (url.endsWith("/manifest.json")) body = bodies.manifest;
    else if (url.endsWith(`/${contentPath}`)) body = bodies.content;
    else if (url.endsWith(`/${scenePath}`)) body = bodies.scene;
    else return new Response("not found", { status: 404 });
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };
  return Object.assign(fetcher, { calls }) as unknown as FixtureFetch;
}
