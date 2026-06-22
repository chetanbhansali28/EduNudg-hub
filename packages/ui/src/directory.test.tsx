import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import {
  DirectoryBrandRow,
  DirectoryNoticePanel,
  DirectoryPageHeader,
  DirectoryShell,
} from "./directory";

describe("directory primitives", () => {
  it("renders page header with title and subtitle", () => {
    render(
      <DirectoryPageHeader
        title="Brands"
        subtitle="Manage and monitor all active brand ecosystems."
        action={<button type="button">+ Add brand</button>}
      />
    );

    expect(screen.getByText("Brands")).toBeDefined();
    expect(screen.getByText("Manage and monitor all active brand ecosystems.")).toBeDefined();
    expect(screen.getByRole("button", { name: "+ Add brand" })).toBeDefined();
  });

  it("renders notice panel status", () => {
    render(
      <DirectoryNoticePanel
        title="Signup requests"
        description="0 pending brand signups awaiting review."
        status="Everything up to date"
      />
    );

    expect(screen.getByText("Signup requests")).toBeDefined();
    expect(screen.getByText("Everything up to date")).toBeDefined();
  });

  it("renders brand row actions", () => {
    render(
      <MemoryRouter>
        <DirectoryShell>
          <DirectoryBrandRow
            name="Alpha Academy"
            slug="alpha"
            status={<span>ACTIVE</span>}
            backendAction={<button type="button">Brand backend</button>}
            editAction={<button type="button">Edit</button>}
            deleteAction={<button type="button">Delete</button>}
          />
        </DirectoryShell>
      </MemoryRouter>
    );

    expect(screen.getByText("Alpha Academy")).toBeDefined();
    expect(screen.getByRole("button", { name: "Brand backend" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Edit" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Delete" })).toBeDefined();
    expect(document.querySelector(".ed-directory")).toBeTruthy();
  });
});
