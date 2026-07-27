import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const sourceRoot = path.resolve("src");
const STATIC_IMPORT_PATTERN = /(?:import|export)\s+(?:[^"']*?\s+from\s+)?["']([^"']+)["']/g;
const DYNAMIC_IMPORT_PATTERN = /import\s*\(\s*["']([^"']+)["']\s*\)/g;

async function javascriptFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return javascriptFiles(entryPath);
    return /\.[jt]sx?$/.test(entry.name) ? [entryPath] : [];
  }));
  return nested.flat();
}

function importedSpecifiers(source) {
  return [STATIC_IMPORT_PATTERN, DYNAMIC_IMPORT_PATTERN].flatMap((pattern) => (
    [...source.matchAll(pattern)].map((match) => match[1])
  ));
}

async function findForbiddenSpecifiers(layer, isForbidden) {
  const files = await javascriptFiles(path.join(sourceRoot, layer));
  const violations = [];
  for (const file of files) {
    const source = await readFile(file, "utf8");
    importedSpecifiers(source)
      .filter(isForbidden)
      .forEach((specifier) => {
        violations.push(`${path.relative(sourceRoot, file)} -> ${specifier}`);
      });
  }
  return violations;
}

test("el dominio no depende de frameworks ni capas externas", async () => {
  const violations = await findForbiddenSpecifiers("domain", (specifier) => {
    if (!specifier.startsWith(".") && !specifier.startsWith("/")) return true;
    return /(^|[/\\])(application|infrastructure|presentation)([/\\]|$)/.test(specifier);
  });
  assert.deepEqual(violations, []);
});

test("la aplicación solo depende del dominio", async () => {
  const violations = await findForbiddenSpecifiers("application", (specifier) => {
    if (!specifier.startsWith(".") && !specifier.startsWith("/")) return true;
    return /(^|[/\\])(infrastructure|presentation)([/\\]|$)/.test(specifier);
  });
  assert.deepEqual(violations, []);
});

test("presentación no importa adaptadores de infraestructura", async () => {
  const violations = await findForbiddenSpecifiers(
    "presentation",
    (specifier) => /(^|[/\\])infrastructure([/\\]|$)/.test(specifier),
  );
  assert.deepEqual(violations, []);
});

test("presentación solo usa SDK externos aprobados", async () => {
  const allowedExternalPackages = ["react", "@fontsource/"];
  const violations = await findForbiddenSpecifiers("presentation", (specifier) => {
    if (specifier.startsWith(".") || specifier.startsWith("/")) return false;
    return !allowedExternalPackages.some((allowed) => (
      specifier === allowed || specifier.startsWith(allowed)
    ));
  });
  assert.deepEqual(violations, []);
});

test("infraestructura no depende de presentación", async () => {
  const violations = await findForbiddenSpecifiers(
    "infrastructure",
    (specifier) => /(^|[/\\])presentation([/\\]|$)/.test(specifier),
  );
  assert.deepEqual(violations, []);
});
