// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() },
}));

vi.mock("recharts", () => ({
  ResponsiveContainer: () => null,
  AreaChart: () => null,
  Area: () => null,
  BarChart: () => null,
  Bar: () => null,
  CartesianGrid: () => null,
  Cell: () => null,
  Legend: () => null,
  Line: () => null,
  LineChart: () => null,
  Pie: () => null,
  PieChart: () => null,
  Tooltip: () => null,
  XAxis: () => null,
  YAxis: () => null,
}));

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({ logout: vi.fn() }),
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    settings: {
      get: { useQuery: () => ({ data: { campuses: [{ id: 12, name: "North Campus" }], selectedCampusId: 12, currentSession: { name: "2025–26" } }, isLoading: false }) },
    },
    students: { list: { useQuery: () => ({ data: { rows: [], total: 0, totalPages: 1, classOptions: [] }, isLoading: false, isFetching: false, isError: false, refetch: vi.fn() }) } },
  },
}));

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

vi.stubGlobal("ResizeObserver", ResizeObserverMock);

import { toast } from "sonner";
import Home, { Admissions, Finance, Notices, Staff, WorkspaceActionDialog } from "./Home";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("WorkspaceActionDialog", () => {
  it("cancels a new enquiry without submission", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<WorkspaceActionDialog action="enquiry" onOpenChange={onOpenChange} />);

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("validates blank entries and confirms a completed invoice action", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<WorkspaceActionDialog action="invoice" onOpenChange={onOpenChange} />);

    await user.click(screen.getByRole("button", { name: "Create invoice draft" }));
    expect(toast.error).toHaveBeenCalled();

    await user.type(screen.getByLabelText("Family or student"), "Kapoor family");
    await user.click(screen.getByRole("button", { name: "Create invoice draft" }));
    expect(toast.success).toHaveBeenCalledWith("Create fee invoice is ready for the next step.");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});

describe("workspace module action entry points", () => {
  it.each([
    ["Admissions", Admissions, "New enquiry", "enquiry"],
    ["Staff", Staff, "Add staff", "staff"],
    ["Finance", Finance, "Create invoice", "invoice"],
    ["Notices", Notices, "Post notice", "notice"],
  ] as const)("opens the %s primary action flow", async (_name, Module, buttonName, expectedAction) => {
    const user = userEvent.setup();
    const openAction = vi.fn();
    render(<Module openAction={openAction} />);

    await user.click(screen.getByRole("button", { name: buttonName }));
    expect(openAction).toHaveBeenCalledWith(expectedAction);
  });
});

describe("workspace primary actions end to end", () => {
  it.each([
    ["Admissions", "New enquiry", "Applicant name", "Samira Patel", "Create enquiry", "New enquiry is ready for the next step."],
    ["Staff", "Add staff", "Staff member name", "Priya Shah", "Create staff record", "Add staff member is ready for the next step."],
    ["Finance", "Create invoice", "Family or student", "Kapoor family", "Create invoice draft", "Create fee invoice is ready for the next step."],
    ["Notices", "Post notice", "Notice title", "Athletics day", "Post notice", "Post a notice is ready for the next step."],
  ] as const)("opens, cancels, and submits the %s primary action", async (moduleName, trigger, fieldLabel, value, confirm, successText) => {
    const user = userEvent.setup();
    render(<Home />);

    await user.click(screen.getByRole("button", { name: new RegExp(`^${moduleName}`) }));
    await user.click(screen.getByRole("button", { name: trigger }));
    expect(screen.getByLabelText(fieldLabel)).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByLabelText(fieldLabel)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: trigger }));
    await user.type(screen.getByLabelText(fieldLabel), value);
    await user.click(screen.getByRole("button", { name: confirm }));
    expect(toast.success).toHaveBeenCalledWith(successText);
  });
});
