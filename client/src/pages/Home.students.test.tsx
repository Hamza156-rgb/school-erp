// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const rows = [
    { id: 1, firstName: "Aarav", lastName: "Mehta", name: "Aarav Mehta", admissionNumber: "STU-10482", className: "Grade 10 · A", guardian: "Neel Mehta", balance: 0, status: "Current" },
    { id: 2, firstName: "Sana", lastName: "Kapoor", name: "Sana Kapoor", admissionNumber: "STU-10463", className: "Grade 10 · A", guardian: "Riya Kapoor", balance: 320, status: "Due" },
    { id: 3, firstName: "James", lastName: "Edwards", name: "James Edwards", admissionNumber: "STU-10451", className: "Grade 9 · C", guardian: "Naomi Edwards", balance: 0, status: "Current" },
    { id: 4, firstName: "Noor", lastName: "Zaman", name: "Noor Zaman", admissionNumber: "STU-10429", className: "Grade 8 · B", guardian: "Aisha Zaman", balance: 185, status: "Due" },
    { id: 5, firstName: "Olivia", lastName: "Anderson", name: "Olivia Anderson", admissionNumber: "STU-10412", className: "Grade 7 · A", guardian: "Mark Anderson", balance: 0, status: "Current" },
  ];
  const list = vi.fn((input: { search: string; status: string; className: string; sortBy: string; page: number; pageSize: number }) => {
    let filtered = rows.filter(row => !input.search || `${row.name} ${row.admissionNumber} ${row.guardian}`.toLowerCase().includes(input.search.toLowerCase())).filter(row => input.status === "all" || row.status === input.status).filter(row => input.className === "all" || row.className === input.className);
    filtered = [...filtered].sort((a, b) => input.sortBy === "name-desc" ? b.name.localeCompare(a.name) : input.sortBy === "balance-desc" ? b.balance - a.balance : a.name.localeCompare(b.name));
    const start = (input.page - 1) * input.pageSize;
    return { data: { rows: filtered.slice(start, start + input.pageSize), total: filtered.length, page: input.page, pageSize: input.pageSize, totalPages: Math.max(1, Math.ceil(filtered.length / input.pageSize)), classOptions: ["Grade 10 · A", "Grade 9 · C", "Grade 8 · B", "Grade 7 · A"] }, isLoading: false, isFetching: false, isError: false, refetch: vi.fn() };
  });
  return { list };
});

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() } }));
vi.mock("@/lib/trpc", () => ({ trpc: { students: { list: { useQuery: (input: unknown) => mocks.list(input as Parameters<typeof mocks.list>[0]) } } } }));

import { Students } from "./Home";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("Students server-side filtering, sorting, and pagination", () => {
  it("sends search and filters to the server query", async () => {
    const user = userEvent.setup();
    render(<Students addStudent={vi.fn()} />);

    await user.selectOptions(screen.getByLabelText("Filter by status"), "Due");
    await user.selectOptions(screen.getByLabelText("Filter by class"), "Grade 8 · B");
    await user.type(screen.getByLabelText("Search students"), "Noor");

    expect(mocks.list).toHaveBeenLastCalledWith(expect.objectContaining({ search: "Noor", status: "Due", className: "Grade 8 · B", page: 1 }));
    expect(screen.getByText("Noor Zaman")).toBeInTheDocument();
  });

  it("sends sorting and pagination inputs to the server", async () => {
    const user = userEvent.setup();
    render(<Students addStudent={vi.fn()} />);

    await user.selectOptions(screen.getByLabelText("Sort students"), "balance-desc");
    await user.selectOptions(screen.getByLabelText("Rows per page"), "2");
    expect(mocks.list).toHaveBeenLastCalledWith(expect.objectContaining({ sortBy: "balance-desc", page: 1, pageSize: 2 }));

    await user.click(screen.getByRole("button", { name: "Next page" }));
    expect(mocks.list).toHaveBeenLastCalledWith(expect.objectContaining({ sortBy: "balance-desc", page: 2, pageSize: 2 }));
  });

  it("renders the query loading skeleton while the server request is pending", () => {
    mocks.list.mockReturnValue({ data: undefined, isLoading: true, isFetching: true, isError: false, refetch: vi.fn() } as never);
    render(<Students addStudent={vi.fn()} />);

    expect(screen.getByRole("status")).toHaveTextContent("Loading student records");
    expect(screen.getAllByRole("row", { name: "Loading student" })).toHaveLength(5);
  });
});
