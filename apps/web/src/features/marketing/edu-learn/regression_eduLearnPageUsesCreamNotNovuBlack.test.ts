import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("EduLearn theme CSS", () => {
  it("regression_edu_learn_page_uses_cream_not_novu_black", () => {
    const css = readFileSync(resolve(__dirname, "edu-learn.css"), "utf8");
    expect(css).toMatch(/--el-page:\s*#f6f3ed/);
    expect(css).toMatch(
      /\.marketing-page\.marketing-page--edu-learn[\s\S]*?background:\s*var\(--el-page\)/
    );
    expect(css).not.toMatch(/\.marketing-page--edu-learn[^{]*\{[^}]*background:\s*#000/);
  });
});
