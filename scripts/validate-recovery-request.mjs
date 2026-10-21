import { execFileSync } from "node:child_process";
import { assertRecoveryTagSupportsMarker } from "./release-policy.mjs";
import { remoteTags } from "./release-website.mjs";

function git(...args) {
  return execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

try {
  const tag = process.env.RELEASE_TAG ?? "";
  const deployWorkflow = git("show", `${tag}:.github/workflows/deploy.yml`);
  assertRecoveryTagSupportsMarker(tag, [...remoteTags("origin").keys()], deployWorkflow);
  console.log(`recovery: ${tag} is the latest stable website release`);
} catch (error) {
  console.error(`::error::${error.message}`);
  process.exitCode = 1;
}
