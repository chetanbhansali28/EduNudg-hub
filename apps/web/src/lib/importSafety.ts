/** Detect duplicate named import specifiers in a single import statement. */

export function findDuplicateNamedImports(source: string): string[] {
  const importBlockRegex = /import\s*\{([^}]+)\}/g;
  const duplicates: string[] = [];

  for (const match of source.matchAll(importBlockRegex)) {
    const specifiers = match[1]
      .split(",")
      .map((part) =>
        part
          .trim()
          .replace(/^type\s+/, "")
          .split(/\s+as\s+/)[0]
          ?.trim()
      )
      .filter((name): name is string => Boolean(name));

    const seen = new Set<string>();
    for (const name of specifiers) {
      if (seen.has(name)) duplicates.push(name);
      seen.add(name);
    }
  }

  return duplicates;
}
