import { afterEach, describe, expect, it, vi } from "vitest";
import { sendSchoolEmail } from "./email";

describe("transactional email delivery", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("fails closed and performs no outbound request without a configured sender and API key", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("EMAIL_FROM", "");
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    await expect(sendSchoolEmail({ to: "guardian@example.edu", subject: "School ERP", html: "<p>Test</p>" })).resolves.toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});
