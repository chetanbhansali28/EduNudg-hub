import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ManualStudentLeadCard } from "./ManualStudentLeadCard";
import { exactAccessibleName } from "@/test/exactAccessibleName";

const createBrandStudentLeadStaff = vi.fn();
const createCenterStudentLeadStaff = vi.fn();

vi.mock("@/lib/manualLeadsApi", () => ({
  createBrandStudentLeadStaff: (...args: unknown[]) => createBrandStudentLeadStaff(...args),
  createCenterStudentLeadStaff: (...args: unknown[]) => createCenterStudentLeadStaff(...args),
}));

function polyfillDialog() {
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
    this.open = true;
  });
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.open = false;
  });
}

const csvAlignedFields = [
  "Student name",
  "Parent name",
  "WhatsApp number",
  "Email",
  "Student date of birth",
  "Login email (optional)",
  "School name (optional)",
  "Address line 1 (optional)",
  "City (optional)",
  "State (optional)",
  "Pincode (optional)",
  "Program name (optional)",
  "Starting level (optional)",
];

describe("ManualStudentLeadCard", () => {
  beforeEach(() => {
    polyfillDialog();
    createBrandStudentLeadStaff.mockReset();
    createCenterStudentLeadStaff.mockReset();
    createBrandStudentLeadStaff.mockResolvedValue({ id: "l1", error: null });
    createCenterStudentLeadStaff.mockResolvedValue({ id: "l2", error: null });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("regression_manual_brand_student_matches_public_enroll_fields", async () => {
    const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const onClose = vi.fn();
    render(
      <QueryClientProvider client={qc}>
        <ManualStudentLeadCard scope="brand" brandId="brand-1" invalidateKey={["leads"]} open onClose={onClose} />
      </QueryClientProvider>
    );

    expect(screen.getByRole("heading", { name: "Add student lead" })).toBeDefined();
    expect(document.querySelector(".ed-franchise-app-manual-dialog")).not.toBeNull();
    expect(screen.getByLabelText("School name (optional)")).toBeDefined();
    expect(screen.getByLabelText("Student date of birth")).toBeDefined();

    fireEvent.change(screen.getByLabelText("Parent name"), { target: { value: "Priya" } });
    fireEvent.change(screen.getByLabelText("WhatsApp number"), { target: { value: "+919876543210" } });
    fireEvent.change(screen.getByLabelText(exactAccessibleName("Email")), { target: { value: "priya@example.com" } });
    fireEvent.change(screen.getByLabelText("City"), { target: { value: "Mumbai" } });
    fireEvent.change(screen.getByLabelText("Pincode"), { target: { value: "400001" } });
    fireEvent.change(screen.getByLabelText("Student name"), { target: { value: "Arjun" } });
    fireEvent.change(screen.getByLabelText("Student date of birth"), { target: { value: "2018-05-01" } });
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
        loginEmail: undefined,
        addressLine1: undefined,
        state: undefined,
        programName: undefined,
        startingLevel: undefined,
      });
    });
    expect(onClose).toHaveBeenCalled();
  });

  it("regression_manual_center_student_matches_csv_import_fields", async () => {
    const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const onClose = vi.fn();
    render(
      <QueryClientProvider client={qc}>
        <ManualStudentLeadCard
          scope="center"
          centerId="center-1"
          invalidateKey={["center-leads"]}
          open
          onClose={onClose}
        />
      </QueryClientProvider>
    );

    for (const label of csvAlignedFields) {
      expect(screen.getByLabelText(exactAccessibleName(label))).toBeDefined();
    }

    fireEvent.change(screen.getByLabelText("Parent name"), { target: { value: "Ravi" } });
    fireEvent.change(screen.getByLabelText("WhatsApp number"), { target: { value: "+919876543210" } });
    fireEvent.change(screen.getByLabelText(exactAccessibleName("Email")), { target: { value: "ravi@example.com" } });
    fireEvent.change(screen.getByLabelText("Student name"), { target: { value: "Meera" } });
    fireEvent.change(screen.getByLabelText("Student date of birth"), { target: { value: "2019-01-15" } });
    fireEvent.change(screen.getByLabelText("Login email (optional)"), { target: { value: "meera.login@example.com" } });
    fireEvent.change(screen.getByLabelText("School name (optional)"), { target: { value: "Ryan" } });
    fireEvent.change(screen.getByLabelText("Address line 1 (optional)"), { target: { value: "12 MG Road" } });
    fireEvent.change(screen.getByLabelText("City (optional)"), { target: { value: "Bengaluru" } });
    fireEvent.change(screen.getByLabelText("State (optional)"), { target: { value: "Karnataka" } });
    fireEvent.change(screen.getByLabelText("Pincode (optional)"), { target: { value: "560001" } });
    fireEvent.change(screen.getByLabelText("Program name (optional)"), { target: { value: "Abacus Core" } });
    fireEvent.change(screen.getByLabelText("Starting level (optional)"), { target: { value: "Level 1" } });

    fireEvent.click(screen.getByRole("button", { name: "Create lead" }));

    await vi.waitFor(() => {
      expect(createCenterStudentLeadStaff).toHaveBeenCalledWith("center-1", {
        parentName: "Ravi",
        whatsappE164: "+919876543210",
        email: "ravi@example.com",
        city: "Bengaluru",
        pincode: "560001",
        childName: "Meera",
        childDob: "2019-01-15",
        schoolName: "Ryan",
        notes: "",
        loginEmail: "meera.login@example.com",
        addressLine1: "12 MG Road",
        state: "Karnataka",
        programName: "Abacus Core",
        startingLevel: "Level 1",
      });
    });
    expect(onClose).toHaveBeenCalled();
  });
});
