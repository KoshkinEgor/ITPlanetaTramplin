/* eslint-env node */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, "src");
const CSS_EXT = ".css";

const FILE_ALLOWLIST = new Set([
  path.normalize("src/shared/styles/tokens.css"),
  path.normalize("src/shared/styles/typescale.generated.css"),
  path.normalize("src/shared/styles/globals.css"),
]);

const ICON_ONLY_PATTERNS = [
  /^\s*font-size:\s*0(?:px|rem|em|%)?;\s*$/i,
  /^\s*line-height:\s*0(?:px|rem|em|%)?;\s*$/i,
];

const TYPOGRAPHY_PROPERTIES = new Set(["font-size", "line-height", "letter-spacing"]);

function isAllowedTypographyValue(property, value) {
  const normalized = value.trim().toLowerCase();

  if (normalized.includes("var(")) {
    return true;
  }

  if (["inherit", "initial", "unset", "normal", "revert"].includes(normalized)) {
    return true;
  }

  if (property === "line-height" && /^calc\([^)]*var\(/.test(normalized)) {
    return true;
  }

  return false;
}

function collectCssFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectCssFiles(fullPath));
      continue;
    }

    if (entry.isFile() && fullPath.endsWith(CSS_EXT)) {
      files.push(fullPath);
    }
  }

  return files;
}

const violations = [];

for (const filePath of collectCssFiles(SRC_DIR)) {
  const relativePath = path.normalize(path.relative(ROOT, filePath));
  if (FILE_ALLOWLIST.has(relativePath)) {
    continue;
  }

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);

  lines.forEach((line, index) => {
    if (ICON_ONLY_PATTERNS.some((pattern) => pattern.test(line))) {
      return;
    }

    const declarationMatch = line.match(/^\s*(font-size|line-height|letter-spacing)\s*:\s*([^;]+);\s*$/i);
    if (!declarationMatch) {
      return;
    }

    const [, property, value] = declarationMatch;
    const normalizedProperty = property.toLowerCase();

    if (!TYPOGRAPHY_PROPERTIES.has(normalizedProperty)) {
      return;
    }

    if (!isAllowedTypographyValue(normalizedProperty, value)) {
      violations.push(`${relativePath}:${index + 1}: ${line.trim()}`);
    }
  });
}

if (violations.length) {
  console.error("Raw typography declarations found outside the allowlist:");
  console.error(violations.join("\n"));
  process.exit(1);
}

console.log("Typography check passed.");
