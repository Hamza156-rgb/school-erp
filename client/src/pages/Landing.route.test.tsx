// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => cleanup());
import Landing from "./Landing";

vi.mock("@/components/ui/button", () => ({ Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props}>{children}</button> }));

describe("public landing page", () => {
  it("routes both desktop CTAs to their intended authentication entry points", async () => {
    const user = userEvent.setup();
    Object.defineProperty(window, "location", { configurable: true, value: { ...window.location, href: "https://school.example.edu/" } });
    render(<Landing />);

    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(window.location.href).toContain("/sign-in");

    cleanup();
    Object.defineProperty(window, "location", { configurable: true, value: { ...window.location, href: "https://school.example.edu/" } });
    render(<Landing />);
    await user.click(screen.getByRole("button", { name: "Create workspace" }));
    expect(window.location.href).toContain("/sign-in?mode=signup");

    cleanup();
    Object.defineProperty(window, "location", { configurable: true, value: { ...window.location, href: "https://school.example.edu/" } });
    render(<Landing />);
    expect(screen.getByRole("link", { name: "Why Northstar" })).toHaveAttribute("href", "#why-northstar");
    expect(screen.getByRole("link", { name: "How it works" })).toHaveAttribute("href", "#workflow");
    const whyLink = screen.getByRole("link", { name: "Why Northstar" });
    const workflowLink = screen.getByRole("link", { name: "How it works" });
    const rolesLink = screen.getByRole("link", { name: "For every role" });
    expect(whyLink).toHaveAttribute("href", "#why-northstar");
    expect(workflowLink).toHaveAttribute("href", "#workflow");
    expect(rolesLink).toHaveAttribute("href", "#roles");
    await user.click(whyLink);
    expect(whyLink).toHaveAttribute("href", "#why-northstar");
    await user.click(workflowLink);
    expect(workflowLink).toHaveAttribute("href", "#workflow");
    await user.click(rolesLink);
    expect(rolesLink).toHaveAttribute("href", "#roles");
  });

  it("opens the mobile menu and routes both mobile CTAs", async () => {
    const user = userEvent.setup();
    Object.defineProperty(window, "location", { configurable: true, value: { ...window.location, href: "https://school.example.edu/" } });
    render(<Landing />);

    await user.click(screen.getAllByRole("button", { name: "Toggle navigation" })[1]!);
    expect(screen.getByRole("link", { name: "Why Northstar" })).toBeVisible();
    await user.click(screen.getAllByRole("button", { name: "Sign in" }).at(-1)!);
    expect(window.location.href).toContain("/sign-in");

    cleanup();
    Object.defineProperty(window, "location", { configurable: true, value: { ...window.location, href: "https://school.example.edu/" } });
    render(<Landing />);
    await user.click(screen.getAllByRole("button", { name: "Toggle navigation" })[1]!);
    await user.click(screen.getAllByRole("button", { name: "Create workspace" }).at(-1)!);
    expect(window.location.href).toContain("/sign-in?mode=signup");

    cleanup();
    Object.defineProperty(window, "location", { configurable: true, value: { ...window.location, href: "https://school.example.edu/" } });
    render(<Landing />);
    await user.click(screen.getAllByRole("button", { name: "Toggle navigation" })[1]!);
    const mobileWhy = screen.getAllByRole("link", { name: "Why Northstar" }).at(-1)!;
    await user.click(mobileWhy);
    expect(mobileWhy).toHaveAttribute("href", "#why-northstar");
    expect(screen.getAllByRole("link", { name: "Why Northstar" })).toHaveLength(1);
  });
});
