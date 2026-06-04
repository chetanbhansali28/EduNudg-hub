import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ManualStudentLeadCard } from "./ManualStudentLeadCard";

const createBrandStudentLeadStaff = vi.fn();
const createCenterStudentLeadStaff = vi.fn();

vi.mock("@/lib/manualLeadsApi", () => ({
  createBrandStudentLeadStaff: (...args: unknown[]) => createBrandStudentLeadStaff(...args),
  createCenterStudentLeadStaff: (...args: unknown[]) => createCenterStudentLeadStaff(...args),
}));

describe("ManualStudentLeadCard", () => {
  beforeEach(() => {
    createBrandStudentLeadStaff.mockReset();
    createCenterStudentLeadStaff.mockReset();
    createBrandStudentLeadStaff.mockResolvedValue({ id: "l1", error: null });
    createCenterStudentLeadStaff.mockResolvedValue({ id: "l2", error: null });
  });

  it("regression_manual_brand_student_matches_public_enroll_fields", async () => {
    const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <ManualStudentLeadCard scope="brand" brandId="brand-1" invalidateKey={["leads"]} />
      </QueryClientProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Add lead" }));

    expect(screen.getByLabelText("School name (optional)")).toBeDefined();
    expect(screen.getByLabelText("Child date of birth")).toBeDefined();

    fireEvent.change(screen.getByLabelText("Parent name"), { target: { value: "Priya" } });
    fireEvent.change(screen.getByLabelText("WhatsApp number"), { target: { value: "+919876543210" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "priya@example.com" } });
    fireEvent.change(screen.getByLabelText("City"), { target: { value: "Mumbai" } });
    fireEvent.change(screen.getByLabelText("Pincode"), { target: { value: "400001" } });
    fireEvent.change(screen.getByLabelText("Child name"), { target: { value: "Arjun" } });
    fireEvent.change(screen.getByLabelText("Child date of birth"), { target: { value: "2018-05-01" } });
    fireEvent.change(screen.getByLabelText("School name (optional)"), { target: { value: "DPS" } });

    fireEvent.click(screen.getByRole("button", { name: "Create lead" }));

    await vi.waitFor(() => {
      expect(createBrandStudentLeadStaff).toHaveBeenCalledWith("brand-1", {
        parentName: "Priya",
        whatsappE164: "+919876543210",
        email: "priya@example.com",
        city: "Mumbai",
        pincode: "400001",
        childName: "Arjun",
        childDob: "2018-05-01",
        schoolName: "DPS",
        notes: "",
      });
    });
  });

  it("regression_manual_center_student_matches_public_register_fields", async () => {
    const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <ManualStudentLeadCard scope="center" centerId="center-1" invalidateKey={["center-leads"]} />
      </QueryClientProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Add lead" }));

    expect(screen.getByLabelText("City (optional)")).toBeDefined();
    expect(screen.getByLabelText("Pincode (optional)")).toBeDefined();
    expect(screen.queryByLabelText("School name (optional)")).toBeNull();

    fireEvent.change(screen.getByLabelText("Parent name"), { target: { value: "Ravi" } });
    fireEvent.change(screen.getByLabelText("WhatsApp number"), { target: { value: "+919876543210" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "ravi@example.com" } });
    fireEvent.change(screen.getByLabelText("Child name"), { target: { value: "Meera" } });
    fireEvent.change(screen.getByLabelText("Child date of birth"), { target: { value: "2019-01-15" } });

    fireEvent.click(screen.getByRole("button", { name: "Create lead" }));

    await vi.waitFor(() => {
      expect(createCenterStudentLeadStaff).toHaveBeenCalledWith("center-1", {
        parentName: "Ravi",
        whatsappE164: "+919876543210",
        email: "ravi@example.com",
        city: "",
        pincode: undefined,
        childName: "Meera",
        childDob: "2019-01-15",
        schoolName: undefined,
        notes: "",
      });
    });
  });
});
