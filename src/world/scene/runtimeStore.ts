import { createContext, useContext } from "react";
import { createStore, type StoreApi } from "zustand/vanilla";
import type { Direction, Overlay, Point, SceneDefinition } from "../types";
import { INITIAL_QUEST, isModuleId, questReducer, type QuestEvent, type QuestState } from "../quest/quest";
import { directionFor, findPath, type MotionState } from "./navigation";
import type { ActionAnim } from "./petFrames";

export type Pose = Direction | "sit" | "coffee" | "display";

export type Arrival = { token: number; hotspotId?: string; pickup?: boolean };

export type ActionAnimation = {
  kind: ActionAnim;
  /** Increments on every trigger so remounting restarts the strip. */
  id: number;
};

export type RuntimeState = {
  motion: MotionState;
  quest: QuestState;
  overlay: Overlay;
  pose: Pose;
  action: ActionAnimation | null;
  latestRequestId: number;
  pendingArrival: Arrival | null;
  notice: string | null;
  requestMove(point: Point, hotspotId?: string, pickup?: boolean): void;
  cancelMovement(): void;
  setOverlay(overlay: Overlay): void;
  arrive(token: number, hotspotId?: string, pickup?: boolean): void;
  clearArrival(): void;
  dispatchQuest(event: QuestEvent): void;
  setPose(pose: Pose): void;
  setNotice(notice: string | null): void;
  triggerAction(kind: ActionAnim): void;
  clearAction(): void;
};

/**
 * Scene runtime state. The store is created per workshop mount and shared via
 * RuntimeStoreContext so the page controls persistence/reset while SceneView
 * renders the moving character.
 */
export function createRuntimeStore(
  scene: SceneDefinition,
  initialQuest: QuestState = INITIAL_QUEST,
): StoreApi<RuntimeState> {
  return createStore<RuntimeState>()((set, get) => ({
    motion: { position: scene.spawn, direction: "se", target: null },
    quest: initialQuest,
    overlay: null,
    pose: "se",
    action: null,
    latestRequestId: 0,
    pendingArrival: null,
    notice: null,

    requestMove(point, hotspotId, pickup) {
      const state = get();
      if (state.overlay !== null) return;
      const token = state.latestRequestId + 1;
      const path = findPath(state.motion.position, point, scene);
      if (!path) {
        set({
          latestRequestId: token,
          motion: { ...state.motion, target: null },
          notice: "unreachable",
          pendingArrival: null,
          // A new destination always ends a daily pose, even when unreachable.
          pose: state.motion.direction,
        });
        return;
      }
      const nextDirection =
        path.length > 1
          ? directionFor(state.motion.position, path[1], state.motion.direction)
          : state.motion.direction;
      set({
        latestRequestId: token,
        notice: null,
        pendingArrival: null,
        pose: nextDirection,
        motion: {
          position: state.motion.position,
          direction: nextDirection,
          target: { token, path, hotspotId, pickup },
        },
      });
    },

    cancelMovement() {
      const state = get();
      if (!state.motion.target) return;
      set({
        latestRequestId: state.latestRequestId + 1,
        motion: { ...state.motion, target: null },
        pendingArrival: null,
      });
    },

    setOverlay(overlay) {
      const state = get();
      if (overlay === null) {
        set({ overlay });
        return;
      }
      // Any open panel pauses movement and invalidates in-flight arrivals.
      set({
        overlay,
        latestRequestId: state.latestRequestId + 1,
        motion: { ...state.motion, target: null },
        pendingArrival: null,
      });
    },

    arrive(token, hotspotId, pickup) {
      const state = get();
      if (token !== state.latestRequestId) return;
      set({
        motion: { ...state.motion, target: null },
        pendingArrival: { token, hotspotId, pickup },
      });
    },

    clearArrival() {
      set({ pendingArrival: null });
    },

    dispatchQuest(event) {
      const state = get();
      // Guard the public boundary as well as the reducer.
      if (event.type === "COLLECT" || event.type === "INSTALL") {
        if (!isModuleId(event.moduleId)) return;
      }
      const quest = questReducer(state.quest, event);
      if (quest === state.quest) return;
      set({ quest });
    },

    setPose(pose) {
      set({ pose });
    },

    setNotice(notice) {
      set({ notice });
    },

    triggerAction(kind) {
      const state = get();
      set({ action: { kind, id: (state.action?.id ?? 0) + 1 } });
    },

    clearAction() {
      set({ action: null });
    },
  }));
}

export const RuntimeStoreContext = createContext<StoreApi<RuntimeState> | null>(null);

export function useRuntimeStore(): StoreApi<RuntimeState> {
  const store = useContext(RuntimeStoreContext);
  if (!store) throw new Error("RuntimeStoreContext is missing");
  return store;
}
