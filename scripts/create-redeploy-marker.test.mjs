import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { execFileSync } from "node:child_process";
import { createRedeployMarker } from "./create-redeploy-marker.mjs";

// Hard safety net: marker creation used to drive `git checkout/commit/push`
// with local credentials. Every subprocess must be faked so no test can ever
// touch the real working tree, the real remote, or the network — regardless
// of which implementation (old local-git one or new GitHub-API one) runs.
// `default` mirrors the same mock object so both ESM named imports and CJS
// interop resolve to the identical vi.fn; no real function leaks either way.
vi.mock("node:child_process", () => {
  const mocked = { execFileSync: vi.fn() };
  return { ...mocked, default: mocked };
});

const TAG = "v0.6.1";
const RUN_ID = "1234567";
const ATTEMPT = "3";
const BRANCH = `${TAG}-redeploy-${RUN_ID}-${ATTEMPT}`;
const REPOSITORY = "owner/site";
const RELEASE_COMMIT = "a1b2c3release";
const RELEASE_TREE = "d4e5f6tree";
const MARKER_SHA = "f7e8d9marker";
const BOT = { name: "github-actions[bot]", email: "41898282+github-actions[bot]@users.noreply.github.com" };
const FORBIDDEN_LOCAL_GIT = new Set(["push", "checkout", "switch", "commit"]);

const DEPLOY_WORKFLOW = [
  "name: deploy website",
  "# recovery-marker-protocol: v1",
  "on:",
  '  push:',
  '    tags: ["v*"]',
  "",
].join("\n");

function ghApiArgs(path) {
  return ["api", "--method", "POST", "--header", "X-GitHub-Api-Version: 2022-11-28", path, "--input", "-"];
}

describe("createRedeployMarker", () => {
  let calls;
  let state;

  const fakeRun = (command, args, options) => {
    calls.push({ command, args: [...args], options });
    const [sub, ...rest] = args;

    if (command === "git") {
      if (sub === "status" && rest[0] === "--porcelain") return state.workingTree;
      if (sub === "show" && rest[0] === `${TAG}:.github/workflows/deploy.yml`) return state.deployWorkflow;
      if (sub === "ls-remote" && rest[0] === "--tags") return `${RELEASE_COMMIT}\trefs/tags/${TAG}\n`;
      if (sub === "ls-remote" && rest[0] === "--heads") {
        return state.markerBranchExists ? `${RELEASE_COMMIT}\trefs/heads/${BRANCH}\n` : "";
      }
      if (sub === "rev-parse" && rest[0]?.endsWith("^{commit}")) return RELEASE_COMMIT;
      if (sub === "rev-parse" && rest[0]?.endsWith("^{tree}")) return RELEASE_TREE;
      if (sub === "rev-parse" && rest[0] === "HEAD") return MARKER_SHA;
      if (sub === "rev-list" && rest[0] === "--parents") return `${MARKER_SHA} ${RELEASE_COMMIT}`;
      // Local mutations (git push/checkout/switch/commit, including the
      // `git -c user.name=... commit` form) are recorded but inert: nothing
      // real ever runs, and the tests below assert they never happen at all.
      if (args.some((arg) => FORBIDDEN_LOCAL_GIT.has(arg))) return "";
      throw new Error(`unexpected subprocess invocation in test: ${command} ${args.join(" ")}`);
    }

    if (command === "gh") {
      const path = args.find((arg) => typeof arg === "string" && arg.startsWith("/repos/"));
      if (state.failGhEndpoint && path?.endsWith(state.failGhEndpoint)) {
        throw new Error(`GitHub rejected the marker request on ${state.failGhEndpoint}`);
      }
      if (path?.endsWith("/git/commits")) return state.commitsResponse;
      if (path?.endsWith("/git/refs")) return state.refsResponse;
      throw new Error(`unexpected subprocess invocation in test: ${command} ${args.join(" ")}`);
    }

    throw new Error(`unexpected subprocess invocation in test: ${command} ${args.join(" ")}`);
  };

  const markerArgs = (overrides = {}) => ({
    tag: TAG,
    runId: RUN_ID,
    attempt: ATTEMPT,
    run: fakeRun,
    listRemoteTags: (remote) => {
      state.remoteTagQueries.push(remote);
      return new Map([[TAG, RELEASE_COMMIT]]);
    },
    repository: REPOSITORY,
    ...overrides,
  });

  const ghCalls = () => calls.filter((call) => call.command === "gh");
  const ghCallsTo = (suffix) => ghCalls().filter((call) => call.args.some((arg) => typeof arg === "string" && arg.endsWith(suffix)));
  const forbiddenGitCalls = () =>
    calls.filter((call) => call.command === "git" && call.args.some((arg) => FORBIDDEN_LOCAL_GIT.has(arg)));

  beforeEach(() => {
    calls = [];
    state = {
      remoteTagQueries: [],
      workingTree: "",
      deployWorkflow: DEPLOY_WORKFLOW,
      markerBranchExists: false,
      failGhEndpoint: null,
      commitsResponse: JSON.stringify({
        sha: MARKER_SHA,
        tree: { sha: RELEASE_TREE },
        parents: [{ sha: RELEASE_COMMIT }],
      }),
      refsResponse: JSON.stringify({ ref: `refs/heads/${BRANCH}`, object: { sha: MARKER_SHA } }),
    };
    vi.mocked(execFileSync).mockImplementation(fakeRun);
  });

  afterEach(() => {
    vi.mocked(execFileSync).mockReset();
  });

  it("creates the marker commit and ref through the GitHub API without any local git mutation", () => {
    const marker = createRedeployMarker(markerArgs());

    expect(forbiddenGitCalls().map((call) => ["git", ...call.args])).toEqual([]);

    const apiCalls = ghCalls();
    expect(apiCalls).toHaveLength(2);

    const [commitCall, refCall] = apiCalls;
    expect(commitCall.args).toEqual(ghApiArgs(`/repos/${REPOSITORY}/git/commits`));
    expect(commitCall.options?.input).toEqual(
      JSON.stringify({
        message: `chore(redeploy): ${TAG} run ${RUN_ID}.${ATTEMPT}`,
        tree: RELEASE_TREE,
        parents: [RELEASE_COMMIT],
        author: BOT,
        committer: BOT,
      }),
    );

    expect(refCall.args).toEqual(ghApiArgs(`/repos/${REPOSITORY}/git/refs`));
    expect(refCall.options?.input).toEqual(JSON.stringify({ ref: `refs/heads/${BRANCH}`, sha: MARKER_SHA }));

    expect(marker).toEqual({ branch: BRANCH, markerSha: MARKER_SHA, releaseCommit: RELEASE_COMMIT });
    expect(state.remoteTagQueries).toEqual(["origin"]);
  });

  it("refuses to create a marker branch that already exists without calling GitHub", () => {
    state.markerBranchExists = true;

    expect(() => createRedeployMarker(markerArgs())).toThrow(/already exists/);
    expect(ghCalls()).toEqual([]);
    expect(forbiddenGitCalls()).toEqual([]);
  });

  it("rejects a tag whose deploy workflow predates the recovery marker protocol without calling GitHub", () => {
    state.deployWorkflow = DEPLOY_WORKFLOW.replace("# recovery-marker-protocol: v1\n", "");

    expect(() => createRedeployMarker(markerArgs())).toThrow(/recovery marker protocol|recovery protocol/);
    expect(ghCalls()).toEqual([]);
    expect(forbiddenGitCalls()).toEqual([]);
  });

  it("rejects a GitHub commits response that does not preserve the release tree and parent", () => {
    state.commitsResponse = JSON.stringify({
      sha: MARKER_SHA,
      tree: { sha: "0000wrong-tree" },
      parents: [{ sha: RELEASE_COMMIT }],
    });

    expect(() => createRedeployMarker(markerArgs())).toThrow(/recovery marker/);
    expect(ghCallsTo("/git/refs")).toEqual([]);
  });

  it("rejects a GitHub refs response that does not point the branch at the verified commit", () => {
    state.refsResponse = JSON.stringify({ ref: `refs/heads/${BRANCH}`, object: { sha: "fffflying-sha" } });
    expect(() => createRedeployMarker(markerArgs())).toThrow(/did not create the marker branch/);

    state.refsResponse = JSON.stringify({ ref: "refs/heads/somewhere-else", object: { sha: MARKER_SHA } });
    expect(() => createRedeployMarker(markerArgs())).toThrow(/did not create the marker branch/);
  });

  it("propagates GitHub failures from the commits call without creating the ref", () => {
    state.failGhEndpoint = "/git/commits";

    expect(() => createRedeployMarker(markerArgs())).toThrow(/marker request/);
    expect(ghCallsTo("/git/refs")).toEqual([]);
  });

  it("requires GITHUB_REPOSITORY before talking to GitHub", () => {
    expect(() => createRedeployMarker(markerArgs({ repository: "" }))).toThrow(/GITHUB_REPOSITORY/);
    expect(ghCalls()).toEqual([]);
  });

  it("validates run id, attempt and the working tree before any subprocess work", () => {
    expect(() => createRedeployMarker(markerArgs({ runId: "12latest" }))).toThrow(/numeric/);
    expect(calls).toEqual([]);

    state.workingTree = " M scripts/create-redeploy-marker.mjs\n";
    expect(() => createRedeployMarker(markerArgs())).toThrow(/clean working tree/);
    expect(ghCalls()).toEqual([]);
  });
});
