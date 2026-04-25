import { describe, expect, it } from "vitest";

describe("ExcalidrawFigure extension", () => {
  it("can be imported without missing view modules", async () => {
    await expect(
      import("../../src/features/editor/extensions/ExcalidrawFigure"),
    ).resolves.toMatchObject({
      EXCALIDRAW_CLASS: "excalidraw",
      ExcalidrawFigure: expect.anything(),
    });
  });
});
