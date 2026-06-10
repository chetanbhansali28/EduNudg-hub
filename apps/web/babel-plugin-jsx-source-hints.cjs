const path = require("path");

function toRepoPath(filename, rootDir) {
  const repoRoot = path.resolve(rootDir);
  const absolute = path.resolve(filename);
  const relative = path.relative(repoRoot, absolute);
  if (!relative || relative.startsWith("..")) {
    return `/${path.basename(absolute)}`;
  }
  return `/${relative.split(path.sep).join("/")}`;
}

/**
 * Dev-only Babel plugin: adds data-* attributes on JSX for DevTools inspect.
 * Paths are relative to the monorepo root (e.g. /apps/web/src/Foo.tsx).
 */
function jsxSourceHintsPlugin(babel, options = {}) {
  const { types: t } = babel;
  const {
    enabled = process.env.NODE_ENV === "development",
    rootDir = process.cwd(),
  } = options;

  const repoRoot = path.resolve(rootDir);
  const filePathFor = (filename) => toRepoPath(filename, repoRoot);

  const plugin = {
    name: "jsx-source-hints",
    visitor: {
      JSXElement(elementPath, state) {
        if (!enabled) return;

        const filename = state.file.opts.filename;
        if (!filename || filename.includes("node_modules")) return;
        if (!elementPath.node.loc) return;

        const opening = elementPath.node.openingElement;

        // Fragment only accepts `key` and `children`; skip shorthand <> and <Fragment>.
        if (t.isJSXOpeningFragment(opening)) return;
        if (t.isJSXIdentifier(opening.name) && opening.name.name === "Fragment") return;

        if (
          opening.attributes.some(
            (attr) => t.isJSXAttribute(attr) && t.isJSXIdentifier(attr.name) && attr.name.name === "data-at"
          )
        ) {
          return;
        }

        const startLine = elementPath.node.loc.start.line;
        const endLine = elementPath.node.loc.end.line;
        const lineRange = startLine === endLine ? `${startLine}` : `${startLine}-${endLine}`;

        let tagName = "Unknown";
        if (opening.name) {
          if (t.isJSXIdentifier(opening.name)) {
            tagName = opening.name.name;
          } else if (t.isJSXMemberExpression(opening.name)) {
            tagName = opening.name.property.name;
          }
        }

        let parentName = "";
        const parentFn = elementPath.findParent(
          (p) =>
            t.isFunctionDeclaration(p.node) ||
            t.isArrowFunctionExpression(p.node) ||
            t.isFunctionExpression(p.node) ||
            t.isClassDeclaration(p.node)
        );
        if (parentFn) {
          if (t.isFunctionDeclaration(parentFn.node) && parentFn.node.id) {
            parentName = parentFn.node.id.name;
          } else if (t.isClassDeclaration(parentFn.node) && parentFn.node.id) {
            parentName = parentFn.node.id.name;
          } else {
            const declarator = parentFn.findParent((p) => t.isVariableDeclarator(p.node));
            if (declarator && t.isIdentifier(declarator.node.id)) {
              parentName = declarator.node.id.name;
            }
          }
        }

        const baseName = path.basename(filename);
        const repoPath = filePathFor(filename);

        const attrs = [
          t.jsxAttribute(t.jsxIdentifier("data-line"), t.stringLiteral(String(startLine))),
          t.jsxAttribute(t.jsxIdentifier("data-filepath"), t.stringLiteral(repoPath)),
          ...(parentName
            ? [t.jsxAttribute(t.jsxIdentifier("data-in"), t.stringLiteral(parentName))]
            : []),
          t.jsxAttribute(t.jsxIdentifier("data-is"), t.stringLiteral(tagName)),
          t.jsxAttribute(t.jsxIdentifier("data-at"), t.stringLiteral(`${baseName}:${lineRange}`)),
        ];

        opening.attributes.unshift(...attrs);
      },
    },
  };

  return plugin;
}

module.exports = jsxSourceHintsPlugin;
module.exports.toRepoPath = toRepoPath;
