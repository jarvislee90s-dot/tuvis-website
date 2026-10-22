import { appendFileSync } from "node:fs";
import { isLatestStableTag, latestStableTag } from "./release-policy.mjs";
import { remoteTags } from "./release-website.mjs";

const tag = process.argv[2] ?? "";
const tags = [...remoteTags("origin").keys()];
const latestTag = latestStableTag(tags);
const isLatest = isLatestStableTag(tag, tags);

if (!isLatest) console.log(`::notice::skipping stale release ${tag}; latest is ${latestTag ?? "none"}`);
console.log(`is_latest=${String(isLatest)}`);
console.log(`latest_tag=${latestTag ?? ""}`);
if (process.env.GITHUB_OUTPUT) {
  appendFileSync(process.env.GITHUB_OUTPUT, `is_latest=${String(isLatest)}\n`);
  appendFileSync(process.env.GITHUB_OUTPUT, `latest_tag=${latestTag ?? ""}\n`);
}
