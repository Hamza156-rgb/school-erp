// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() } }));

import { Students } from "./Home";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("Students filtering and sorting", () => {
  const resultCount = (count: number) => screen.getByText((_, element) => element?.tagName === "P" && element.textContent === `Showing ${count} of 5 demo records`);

  it("filters records by status and class while updating the result count", async () => {
    const user = userEvent.setup();
    render(<Students addStudent={vi.fn()} />);

    expect(resultCount(5)).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("Filter by status"), "Due");

    expect(resultCount(2)).toBeInTheDocument();
    expect(screen.getByText("Sana Kapoor")).toBeInTheDocument();
    expect(screen.getByText("Noor Zaman")).toBeInTheDocument();
    expect(screen.queryByText("Aarav Mehta")).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Filter by class"), "Grade 8 · B");
    expect(resultCount(1)).toBeInTheDocument();
    expect(screen.getByText("Noor Zaman")).toBeInTheDocument();
    expect(screen.queryByText("Sana Kapoor")).not.toBeInTheDocument();
  });

  it("sorts matching records by balance and clears active filters", async () => {
    const user = userEvent.setup();
    render(<Students addStudent={vi.fn()} />);

    await user.selectOptions(screen.getByLabelText("Sort students"), "balance-desc");
    const names = screen.getAllByText(/Aarav Mehta|Sana Kapoor|James Edwards|Noor Zaman|Olivia Anderson/).map(element => element.textContent);
    expect(names.slice(0, 3)).toEqual(["Sana Kapoor", "Noor Zaman", "Aarav Mehta"]);

    await user.type(screen.getByLabelText("Search students"), "Noor");
    expect(resultCount(1)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect(resultCount(5)).toBeInTheDocument();
    expect(screen.getByLabelText("Sort students")).toHaveValue("name-asc");
  });
});
