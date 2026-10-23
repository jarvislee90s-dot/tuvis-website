import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { execFileSync } from "node:child_process";
import { waitForRun } from "./wait-for-run.mjs";

// The waiter shells out to `gh api` for every poll. Mocking node:child_process
// keeps the whole suite hermetic — no real gh subprocess, no network — and the
// global mock throws, so an implementation that ignores the injected `run`
// fails loudly instead of leaking a real subprocess.
vi.mock("node:child_process", () => {
  const mocked = { execFileSync: vi.fn() };
  return { ...mocked, default: mocked };
});

const RUN_ID = "997788";
const REPOSITORY = "owner/site";
const RUN_PATH = `repos/${REPOSITORY}/actions/runs/${RUN_ID}`;

describe("waitForRun", () => {
  let calls;
  let state;

  const recordingRun = (command, args) => {
    calls.push({ command, args: [...args] });
    if (command !== "gh") throw new Error(`unexpected subprocess: ${command} ${args.join(" ")}`);
    return JSON.stringify(state.response);
  };

  beforeEach(() => {
    calls = [];
    state = { response: { status: "completed", conclusion: "success" } };
    vi.mocked(execFileSync).mockImplementation(() => {
      throw new Error("real child_process must never be reached in waitForRun tests");
    });
  });

  afterEach(() => {
    vi.mocked(execFileSync).mockReset();
  });

  it("validates the run id and repository before calling GitHub", () => {
    const run = (command, args) => {
      calls.push({ command, args: [...args] });
      throw new Error("must not reach GitHub");
    };
    expect(() => waitForRun("12abc", { run, repository: REPOSITORY })).toThrow(/numeric/);
    expect(() => waitForRun(RUN_ID, { run, repository: "" })).toThrow(/GITHUB_REPOSITORY/);
    expect(calls).toEqual([]);
  });

  it("returns the parsed run immediately when it has already completed successfully", () => {
    const sleeps = [];
    const response = waitForRun(RUN_ID, {
      run: recordingRun,
      repository: REPOSITORY,
      now: () => 0,
      sleepMs: (ms) => sleeps.push(ms),
    });

    expect(response).toEqual({ status: "completed", conclusion: "success" });
    expect(calls).toHaveLength(1);
    expect(calls[0]).toEqual({ command: "gh", args: ["api", RUN_PATH] });
    expect(sleeps).toEqual([]);
  });

  it("polls again after the interval until the run completes successfully", () => {
    const sequence = [
      { status: "in_progress", conclusion: null },
      { status: "completed", conclusion: "success" },
    ];
    let poll = 0;
    const run = (command, args) => {
      calls.push({ command, args: [...args] });
      return JSON.stringify(sequence[poll++]);
    };
    const sleeps = [];

    const response = waitForRun(RUN_ID, {
      run,
      repository: REPOSITORY,
      intervalSeconds: 15,
      now: () => 0,
      sleepMs: (ms) => sleeps.push(ms),
    });

    expect(response).toEqual({ status: "completed", conclusion: "success" });
    expect(calls).toHaveLength(2);
    expect(calls[0].args).toEqual(["api", RUN_PATH]);
    expect(calls[1].args).toEqual(["api", RUN_PATH]);
    expect(sleeps).toEqual([15000]);
  });

  it("fails when the watched run completes with a non-success conclusion", () => {
    state.response = { status: "completed", conclusion: "failure" };
    const sleeps = [];
    let error;
    try {
      waitForRun(RUN_ID, {
        run: recordingRun,
        repository: REPOSITORY,
        now: () => 0,
        sleepMs: (ms) => sleeps.push(ms),
      });
    } catch (caught) {
      error = caught;
    }

    expect(error).toBeTruthy();
    expect(error.message).toContain("failure");
    expect(error.message).toContain(RUN_ID);
    expect(sleeps).toEqual([]);
  });

  it("times out when the run never completes within the budget", () => {
    state.response = { status: "in_progress", conclusion: null };
    let clock = 0;
    const sleeps = [];
    let error;
    try {
      waitForRun(RUN_ID, {
        run: recordingRun,
        repository: REPOSITORY,
        intervalSeconds: 15,
        timeoutSeconds: 60,
        now: () => clock,
        sleepMs: (ms) => {
          sleeps.push(ms);
          clock += ms;
        },
      });
    } catch (caught) {
      error = caught;
    }

    expect(error).toBeTruthy();
    expect(error.message).toMatch(/timed out/);
    expect(error.message).toContain("60");
    // Four sleeps push the fake clock to exactly the 60s deadline; the fifth
    // poll must hit the timeout instead of sleeping again.
    expect(sleeps).toHaveLength(4);
  });

  it("logs a heartbeat with the run id and current status while the run is still running", () => {
    const sequence = [
      { status: "in_progress", conclusion: null },
      { status: "completed", conclusion: "success" },
    ];
    let poll = 0;
    const run = (command, args) => {
      calls.push({ command, args: [...args] });
      return JSON.stringify(sequence[poll++]);
    };
    const heartbeats = [];

    const response = waitForRun(RUN_ID, {
      run,
      repository: REPOSITORY,
      now: () => 0,
      sleepMs: () => {},
      log: (message) => heartbeats.push(String(message)),
    });

    expect(response).toEqual({ status: "completed", conclusion: "success" });
    expect(heartbeats).toHaveLength(1);
    expect(heartbeats[0]).toContain(RUN_ID);
    expect(heartbeats[0]).toContain("in_progress");
  });
});
