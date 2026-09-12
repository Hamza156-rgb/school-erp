import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const homeSource = readFileSync(new URL("./Home.tsx", import.meta.url), "utf8");

describe("responsive workspace shell", () => {
  it("constrains the mobile navigation drawer to the viewport", () => {
    expect(homeSource).toContain("w-[min(274px,calc(100vw-56px))]");
    expect(homeSource).toContain("overflow-hidden bg-navy/30 lg:hidden");
    expect(homeSource).toContain("left-[min(274px,calc(100vw-56px))]");
  });

  it("prevents horizontal dashboard displacement on narrow screens", () => {
    expect(homeSource).toContain("w-full max-w-full overflow-x-hidden bg-cloud");
    expect(homeSource).toContain("min-w-0 max-w-full");
    expect(homeSource).toContain("min-w-0 max-w-[1580px] overflow-x-hidden");
  });

  it("keeps the account menu collision-safe beside the mobile drawer", () => {
    expect(homeSource).toContain('side="right" align="end" sideOffset={8} collisionPadding={12}');
    expect(homeSource).toContain("max-w-[calc(100vw-24px)]");
  });
});
