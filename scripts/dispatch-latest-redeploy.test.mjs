import { describe, expect, it } from "vitest";
import { dispatchLatestRedeploy } from "./dispatch-latest-redeploy.mjs";

describe("dispatchLatestRedeploy", () => {
  it("dispatches the selected stable tag through main and can wait for the orchestrator", () => {
    const calls = [];
    const run = (command, args, options) => {
      calls.push({ command, args, options });
      return args[0] === "api" ? JSON.stringify({ workflow_run_id: 123 }) : "";
    };

    expect(dispatchLatestRedeploy("v0.8.0", { wait: true, run, repository: "owner/site" })).toBe(123);
    expect(calls).toHaveLength(2);
    expect(calls[0].args).toContain("ref=main");
    expect(calls[0].args).toContain("inputs[release_tag]=v0.8.0");
    expect(calls[0].args).toContain("return_run_details=true");
    expect(calls[1].args).toEqual(["run", "watch", "123", "--exit-status"]);
  });

  it("rejects non-stable tags before calling GitHub", () => {
    const run = () => { throw new Error("must not reach GitHub"); };
    expect(() => dispatchLatestRedeploy("v0.8.0-rc.1", { run })).toThrow(/stable release tag/);
  });
});
