import { latestStableTag } from "./release-policy.mjs";
import { remoteTags } from "./release-website.mjs";

const latest = latestStableTag([...remoteTags("origin").keys()]);
if (latest) console.log(latest);
