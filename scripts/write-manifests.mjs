import { writeFile } from "node:fs/promises";

const manifests = [
  ["dist/esm/package.json", { type: "module" }],
  ["dist/cjs/package.json", { type: "commonjs" }],
];

for (const [path, body] of manifests) {
  await writeFile(path, `${JSON.stringify(body, null, 2)}\n`, "utf-8");
}
