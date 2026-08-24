import { describe, expect, it } from "vitest";
import { hashPassword, hashOpaqueToken, normalizeEmail, verifyPassword } from "./customAuth";

describe("custom School ERP authentication helpers", () => {
  it("normalizes emails and verifies a matching password without accepting a different password", async () => {
    const passwordHash = await hashPassword("SchoolERP!2026");
    expect(normalizeEmail("  ADMIN@NORTHSTAR.EDU  ")).toBe("admin@northstar.edu");
    await expect(verifyPassword("SchoolERP!2026", passwordHash)).resolves.toBe(true);
    await expect(verifyPassword("incorrect-password", passwordHash)).resolves.toBe(false);
  });

  it("derives a stable, non-plaintext opaque-token digest", () => {
    const token = "verification-token-for-test-only";
    expect(hashOpaqueToken(token)).toHaveLength(64);
    expect(hashOpaqueToken(token)).toBe(hashOpaqueToken(token));
    expect(hashOpaqueToken(token)).not.toBe(token);
  });
});
