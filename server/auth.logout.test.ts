import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { SCHOOL_SESSION_COOKIE } from "./customAuth";
import type { TrpcContext } from "./_core/context";

type CookieCall = { name: string; options: Record<string, unknown> };

function createContext(): { ctx: TrpcContext; clearedCookies: CookieCall[] } {
  const clearedCookies: CookieCall[] = [];
  return {
    ctx: {
      user: null,
      req: { protocol: "https", headers: { "x-forwarded-proto": "https" } } as TrpcContext["req"],
      res: { clearCookie: (name: string, options: Record<string, unknown>) => clearedCookies.push({ name, options }) } as TrpcContext["res"],
    },
    clearedCookies,
  };
}

describe("auth.logout", () => {
  it("clears the custom School ERP session cookie", async () => {
    const { ctx, clearedCookies } = createContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.auth.logout()).resolves.toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe(SCHOOL_SESSION_COOKIE);
    expect(clearedCookies[0]?.options).toMatchObject({
      maxAge: -1,
      secure: true,
      sameSite: "none",
      httpOnly: true,
      path: "/",
    });
  });
});
