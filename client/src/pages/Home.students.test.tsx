// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() } }));

import { Students } from "./Home";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("Students filtering, sorting, and pagination", () => {
  const resultRange = (range: string, count: number) => screen.getByText((_, element) => element?.tagName === "P" && element.textContent === `Showing ${range} of ${count} matching demo records`);

  it("filters records by status and class while updating the result range", async () => {
    const user = userEvent.setup();
    render(<Students addStudent={vi.fn()} />);

    expect(resultRange("1–5", 5)).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("Filter by status"), "Due");

    expect(resultRange("1–2", 2)).toBeInTheDocument();
    expect(screen.getByText("Sana Kapoor")).toBeInTheDocument();
    expect(screen.getByText("Noor Zaman")).toBeInTheDocument();
    expect(screen.queryByText("Aarav Mehta")).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Filter by class"), "Grade 8 · B");
    expect(resultRange("1–1", 1)).toBeInTheDocument();
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
    expect(resultRange("1–1", 1)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect(resultRange("1–5", 5)).toBeInTheDocument();
    expect(screen.getByLabelText("Sort students")).toHaveValue("name-asc");
  });

  it("moves between pages and keeps the active page size visible", async () => {
    const user = userEvent.setup();
    render(<Students addStudent={vi.fn()} />);

    await user.selectOptions(screen.getByLabelText("Rows per page"), "2");
    expect(resultRange("1–2", 5)).toBeInTheDocument();
    expect(screen.getByText("Page 1 of 3")).toBeInTheDocument();
    expect(screen.getByText("Aarav Mehta")).toBeInTheDocument();
    expect(screen.getByText("James Edwards")).toBeInTheDocument();
    expect(screen.queryByText("Noor Zaman")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Next page" }));
    expect(screen.getByRole("status")).toHaveTextContent("Loading student records");
    expect(screen.getAllByRole("row", { name: "Loading student" })).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled();
    await waitFor(() => expect(screen.queryByRole("status")).not.toBeInTheDocument(), { timeout: 500 });
    expect(resultRange("3–4", 5)).toBeInTheDocument();
    expect(screen.getByText("Page 2 of 3")).toBeInTheDocument();
    expect(screen.getByText("Noor Zaman")).toBeInTheDocument();
    expect(screen.getByText("Olivia Anderson")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Next page" }));
    expect(screen.getByRole("status")).toHaveTextContent("Loading student records");
    await waitFor(() => expect(screen.queryByRole("status")).not.toBeInTheDocument(), { timeout: 500 });
    expect(resultRange("5–5", 5)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Previous page" })).not.toBeDisabled();
  });
});
