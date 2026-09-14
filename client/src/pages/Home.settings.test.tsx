// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  update: vi.fn(),
  updateOptions: null as { onError?: (error: Error) => void } | null,
  setCurrentCampus: vi.fn(),
  invalidate: vi.fn().mockResolvedValue(undefined),
  settingsData: { organization: { name: "Northstar Academy", email: "admin@northstar.edu", phone: "+1 555 0100", address: "1 Academy Way" }, campuses: [{ id: 12, name: "North Campus", code: "NORTH", phone: "+1 555 0101", address: "1 North Avenue" }, { id: 13, name: "South Campus", code: "SOUTH", phone: "+1 555 0102", address: "2 South Avenue" }], selectedCampusId: 12, currentSessions: [{ id: 1, campusId: 12, name: "2026–27", startsOn: new Date("2026-08-01T00:00:00.000Z"), endsOn: new Date("2027-06-30T00:00:00.000Z"), isCurrent: true }], currentSession: null },
}));

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() } }));
vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ user: { role: "school_owner" } }) }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ settings: { get: { invalidate: mocks.invalidate } }, auth: { me: { invalidate: mocks.invalidate } } }),
    settings: {
      get: { useQuery: () => ({ data: mocks.settingsData, isLoading: false, isError: false, refetch: vi.fn() }) },
      update: { useMutation: (options?: { onError?: (error: Error) => void }) => { mocks.updateOptions = options ?? null; return { mutate: mocks.update, isPending: false }; } },
      setCurrentCampus: { useMutation: () => ({ mutate: mocks.setCurrentCampus, isPending: false }) },
    },
  },
}));

import { Settings } from "./Home";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("persistent Settings editor", () => {
  it("loads persisted school and campus values, saves them, and persists campus selection", async () => {
    const user = userEvent.setup();
    render(<Settings />);

    await waitFor(() => expect(screen.getByLabelText("School name")).toHaveValue("Northstar Academy"));
    await user.clear(screen.getByLabelText("School name"));
    await user.type(screen.getByLabelText("School name"), "Northstar Learning Trust");
    await user.selectOptions(screen.getByLabelText("Campus to edit"), "13");

    expect(mocks.setCurrentCampus).toHaveBeenCalledWith({ campusId: 13 });
    expect(screen.getByLabelText("Campus name")).toHaveValue("South Campus");
    expect(screen.getByLabelText("Session name")).toHaveValue("");

    await user.click(screen.getByRole("button", { name: "Save settings" }));
    expect(mocks.update).toHaveBeenCalledWith({ campusId: 13, organization: { name: "Northstar Learning Trust", email: "admin@northstar.edu", phone: "+1 555 0100", address: "1 Academy Way" }, campus: { name: "South Campus", code: "SOUTH", phone: "+1 555 0102", address: "2 South Avenue" }, session: { name: "", startsOn: "", endsOn: "" } });
  });

  it("shows a clear error when saving settings fails", async () => {
    render(<Settings />);

    await waitFor(() => expect(screen.getByLabelText("School name")).toHaveValue("Northstar Academy"));
    mocks.updateOptions?.onError?.(new Error("The selected campus does not belong to this school."));

    const { toast } = await import("sonner");
    expect(toast.error).toHaveBeenCalledWith("The selected campus does not belong to this school.");
  });
});
