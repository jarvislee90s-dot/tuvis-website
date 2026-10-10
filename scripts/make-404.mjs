import { readFileSync, writeFileSync } from "node:fs";
let html = readFileSync("dist/index.html", "utf8");
const inject = `<script>sessionStorage.setItem("tuvis-redirect", location.href);location.replace("${import.meta?.env?.BASE_URL ?? "/tuvis-website/"}");</script>`;
html = html.replace("<head>", "<head>" + inject);
writeFileSync("dist/404.html", html);
console.log("dist/404.html written");
