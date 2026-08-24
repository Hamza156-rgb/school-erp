import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: { origin: "https://school.example.edu" } } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("auth.signUp", () => {
  it("rejects client-supplied role and organisation assignment fields before account creation", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.auth.signUp({
      schoolName: "Northstar Academy",
      name: "Olivia Harris",
      email: "olivia@example.edu",
      password: "SecureSchoolPassword!2026",
      role: "super_admin",
      organizationId: 999,
    } as never)).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
