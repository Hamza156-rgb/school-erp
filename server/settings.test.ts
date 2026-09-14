import { describe, expect, it } from "vitest";
import { schoolSettingsInputSchema, appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const validSettings = {
  campusId: 12,
  organization: { name: "Northstar Academy", email: "admin@northstar.edu", phone: "+1 555 0100", address: "1 Academy Way" },
  campus: { name: "North Campus", code: "NORTH", phone: "+1 555 0101", address: "1 North Avenue" },
  session: { name: "2026–27", startsOn: "2026-08-01", endsOn: "2027-06-30" },
};

function createPublicContext(): TrpcContext {
  return { user: null, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

describe("school settings input", () => {
  it("accepts the tenant settings payload used by the Settings editor", () => {
    expect(schoolSettingsInputSchema.parse(validSettings)).toEqual(validSettings);
  });

  it("rejects an academic session whose end date is not after its start date", () => {
    expect(() => schoolSettingsInputSchema.parse({ ...validSettings, session: { ...validSettings.session, endsOn: "2026-07-01" } })).toThrow("The end date must be after the start date.");
  });

  it("accepts school and campus settings when no academic session is configured yet", () => {
    expect(schoolSettingsInputSchema.parse({ ...validSettings, session: { name: "", startsOn: "", endsOn: "" } }).session).toEqual({ name: "", startsOn: "", endsOn: "" });
  });

  it("rejects a partially completed academic session", () => {
    expect(() => schoolSettingsInputSchema.parse({ ...validSettings, session: { name: "2026–27", startsOn: "", endsOn: "2027-06-30" } })).toThrow("Complete the session name, start date, and end date together.");
  });

  it("rejects client-controlled organization fields outside the settings contract", () => {
    expect(() => schoolSettingsInputSchema.parse({ ...validSettings, organizationId: 999 })).toThrow();
  });

  it("protects settings reads and writes behind the signed-in session", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.settings.get()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.settings.setCurrentCampus({ campusId: 12 })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.settings.update(validSettings)).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
