import fs from "node:fs";
import path from "node:path";

export function loadPage(name) {
  const fixturePath = path.resolve(__dirname, "..", "fixtures", "pages", `${name}.html`);
  document.open();
  document.write(fs.readFileSync(fixturePath, "utf8"));
  document.close();
  window.localStorage.clear();
}
