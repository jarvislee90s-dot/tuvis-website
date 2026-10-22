import { readFileSync, writeFileSync } from "node:fs";
let html = readFileSync("dist/index.html", "utf8");
// import.meta.env.BASE_URL 由 vite 构建时注入；纯 node 下为 undefined，回退字面量（与 vite.config.ts base 一致）
const inject = `<script>sessionStorage.setItem("tuvis-redirect", location.href);location.replace("${import.meta?.env?.BASE_URL ?? "/"}");</script>`;
html = html.replace("<head>", "<head>" + inject);
writeFileSync("dist/404.html", html);
console.log("dist/404.html written");
