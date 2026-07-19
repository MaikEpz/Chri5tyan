import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const sourceRoot = path.resolve("src");

async function javascriptFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return javascriptFiles(entryPath);
    return /\.[jt]sx?$/.test(entry.name) ? [entryPath] : [];
  }));
  return nested.flat();
}

async function findForbiddenImports(layer, forbiddenPatterns) {
  const files = await javascriptFiles(path.join(sourceRoot, layer));
  const violations = [];
  for (const file of files) {
    const source = await readFile(file, "utf8");
    for (const pattern of forbiddenPatterns) {
      if (pattern.test(source)) {
        violations.push(`${path.relative(sourceRoot, file)} -> ${pattern}`);
      }
    }
  }
  return violations;
}

test("el dominio no depende de frameworks ni capas externas", async () => {
  const violations = await findForbiddenImports("domain", [
    /from\s+["']react/,
    /from\s+["'][^"']*application/,
    /from\s+["'][^"']*infrastructure/,
    /from\s+["'][^"']*presentation/,
  ]);
  assert.deepEqual(violations, []);
});

test("la aplicación solo depende del dominio", async () => {
  const violations = await findForbiddenImports("application", [
    /from\s+["']react/,
    /from\s+["'][^"']*infrastructure/,
    /from\s+["'][^"']*presentation/,
  ]);
  assert.deepEqual(violations, []);
});

test("presentación no importa adaptadores de infraestructura", async () => {
  const violations = await findForbiddenImports("presentation", [
    /from\s+["'][^"']*infrastructure/,
  ]);
  assert.deepEqual(violations, []);
});
