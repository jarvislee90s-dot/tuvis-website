import { execFileSync } from "node:child_process";
import { compareStableTags, latestStableTag, parseStableTag } from "./release-policy.mjs";

const TUVIS_REPO_URL = process.env.TUVIS_REPO_URL ?? "https://github.com/jarvislee90s-dot/tuvis.git";

function git(...args) {
  return execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

export function remoteTags(remote) {
  const output = git("ls-remote", "--tags", "--sort=-v:refname", remote);
  const tags = new Map();
  for (const line of output.split("\n").filter(Boolean)) {
    const [sha, ref] = line.split("\t");
    const peeled = ref.endsWith("^{}");
    const name = ref.replace(/^refs\/tags\//, "").replace(/\^\{\}$/, "");
    if (!name.startsWith("v")) continue;
    const entry = tags.get(name) ?? { tagSha: null, commitSha: null };
    if (peeled) entry.commitSha = sha;
    else entry.tagSha = sha;
    tags.set(name, entry);
  }
  for (const entry of tags.values()) entry.commitSha ??= entry.tagSha;
  return tags;
}

function ensure(condition, message) {
  if (!condition) throw new Error(message);
}

export function createWebsiteRelease(tag) {
  ensure(parseStableTag(tag), "version must be an exact stable tag: vMAJOR.MINOR.PATCH");
  ensure(git("branch", "--show-current") === "main", "release must be created from the main branch");
  ensure(git("status", "--porcelain") === "", "release requires a clean working tree");

  git("fetch", "origin", "main", "--quiet");
  const headSha = git("rev-parse", "HEAD");
  const originMainSha = git("rev-parse", "refs/remotes/origin/main");
  ensure(headSha === originMainSha, "local main must match the freshly fetched origin/main SHA");

  const websiteTags = remoteTags("origin");
  ensure(!git("tag", "--list", tag), `${tag} already exists locally`);
  ensure(!websiteTags.has(tag), `${tag} already exists in the website repository`);
  const latestWebsiteTag = latestStableTag([...websiteTags.keys()]);
  if (latestWebsiteTag) {
    ensure(compareStableTags(tag, latestWebsiteTag) > 0, `${tag} must be newer than ${latestWebsiteTag}`);
    ensure(websiteTags.get(latestWebsiteTag).commitSha !== headSha, `new release would reuse the same SHA as ${latestWebsiteTag}`);
  }

  const tuvisTags = remoteTags(TUVIS_REPO_URL);
  ensure(tuvisTags.has(tag), `matching Tuvis tag ${tag} is required before website release`);

  const mainBeforePush = git("ls-remote", "origin", "refs/heads/main").split("\t")[0];
  ensure(mainBeforePush === originMainSha, "origin/main advanced during release preflight; fetch and retry");
  ensure(!remoteTags("origin").has(tag), `${tag} was created remotely during release preflight`);

  git("tag", "-a", tag, "-m", `Tuvis website ${tag}`, headSha);
  try {
    git("push", "origin", `refs/tags/${tag}`);
  } catch (error) {
    try { git("tag", "-d", tag); } catch { /* preserve the push error */ }
    throw error;
  }

  return { tag, sha: headSha };
}

if (process.argv[1]?.endsWith("release-website.mjs")) {
  try {
    const tag = process.argv[2] ?? "";
    const release = createWebsiteRelease(tag);
    console.log(`release: pushed ${release.tag} at ${release.sha}`);
  } catch (error) {
    console.error(`release: ${error.message}`);
    process.exitCode = 1;
  }
}
