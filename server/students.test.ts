import { describe, expect, it } from "vitest";
import { appRouter, studentListInputSchema } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): TrpcContext {
  return { user: null, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

describe("server-side Students listing", () => {
  it("normalizes pagination and filter defaults", () => {
    expect(studentListInputSchema.parse({})).toEqual({ search: "", status: "all", className: "all", sortBy: "name-asc", page: 1, pageSize: 25 });
    expect(studentListInputSchema.parse({ search: " Noor ", page: 2, pageSize: 50 }).search).toBe("Noor");
  });

  it("rejects invalid page sizes and unsupported sorting", () => {
    expect(() => studentListInputSchema.parse({ pageSize: 101 })).toThrow();
    expect(() => studentListInputSchema.parse({ sortBy: "created-desc" })).toThrow();
  });

  it("protects the paginated Students query behind the signed-in session", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.students.list({})).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
