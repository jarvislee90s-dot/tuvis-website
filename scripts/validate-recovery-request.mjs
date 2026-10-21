import { assertLatestRecoverableTag } from "./release-policy.mjs";
import { remoteTags } from "./release-website.mjs";

try {
  const tag = process.env.RELEASE_TAG ?? "";
  assertLatestRecoverableTag(tag, [...remoteTags("origin").keys()]);
  console.log(`recovery: ${tag} is the latest stable website release`);
} catch (error) {
  console.error(`::error::${error.message}`);
  process.exitCode = 1;
}
