import { describe, expect, test } from "bun:test";
import { countSourceFiles } from "./project-file-count";

describe("countSourceFiles", () => {
  test("counts source arrays from desktop project responses", () => {
    expect(
      countSourceFiles({
        sources: [
          { files: [{ relativePath: "cursor.png" }, { relativePath: "hitcircle.png" }] },
          { files: [{ relativePath: "menu-back.png" }] },
        ],
      }),
    ).toBe(3);
  });

  test("keeps compatibility with grouped source maps", () => {
    expect(
      countSourceFiles({
        sources: {
          main: [{ relativePath: "skin.ini" }],
          source: { files: [{ relativePath: "comboburst.png" }] },
        },
      }),
    ).toBe(2);
  });
});
