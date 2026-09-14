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
      get: { useQuery: () => ({ data: { campuses: [{ id: 12, name: "South Campus" }], selectedCampusId: 12, currentSession: { name: "2026–27" } }, isLoading: false }) },
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

import Home from "./Home";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("responsive workspace interactions", () => {
  it("renders the selected campus and academic session from persisted settings", () => {
    render(<Home />);

    expect(screen.getByText("South Campus")).toBeInTheDocument();
    expect(screen.getByText("2026–27")).toBeInTheDocument();
  });

  it("opens the mobile navigation and dismisses it from the overlay and Escape", async () => {
    const user = userEvent.setup();
    render(<Home />);

    expect(screen.queryByRole("button", { name: "Close navigation" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Open navigation" }));
    expect(screen.getByRole("button", { name: "Close navigation" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Close navigation" }));
    expect(screen.queryByRole("button", { name: "Close navigation" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Open navigation" }));
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("button", { name: "Close navigation" })).not.toBeInTheDocument();
  });

  it("opens the account menu without changing the active dashboard view", async () => {
    const user = userEvent.setup();
    render(<Home />);

    expect(screen.getByText("Good morning, Olivia")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Open account menu" }));

    expect(screen.getByRole("menuitem", { name: "Account preferences" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Switch campus" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Sign out" })).toBeInTheDocument();
    expect(screen.getByText("Good morning, Olivia")).toBeInTheDocument();
  });
});
