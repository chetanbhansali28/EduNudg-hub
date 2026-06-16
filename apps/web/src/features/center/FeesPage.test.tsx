import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider } from "@edunudg/ui";
import { FeesPage } from "./FeesPage";

vi.mock("@/bootstrap/TenantProvider", () => ({
  useTenant: () => ({
    brandId: "brand-1",
    centerId: "center-1",
    brandSlug: "abacusworld",
    centerSlug: "koramangala",
  }),
}));

vi.mock("@/features/platform/hooks/useMutationError", () => ({
  useMutationError: () => ({ error: null, clear: vi.fn(), capture: vi.fn() }),
}));

const fetchCenterStudents = vi.fn();
const fetchCenterInvoices = vi.fn();
const fetchCenterPayments = vi.fn();
const createCenterInvoice = vi.fn();
const recordCenterPayment = vi.fn();

vi.mock("@/lib/centerStudentsApi", () => ({
  fetchCenterStudents: (...args: unknown[]) => fetchCenterStudents(...args),
}));

vi.mock("@/lib/centerFeesApi", () => ({
  fetchCenterInvoices: (...args: unknown[]) => fetchCenterInvoices(...args),
  fetchCenterPayments: (...args: unknown[]) => fetchCenterPayments(...args),
  createCenterInvoice: (...args: unknown[]) => createCenterInvoice(...args),
  recordCenterPayment: (...args: unknown[]) => recordCenterPayment(...args),
}));

const sampleInvoice = {
  id: "inv-1",
  invoice_number: "FEE-001",
  amount_cents: 250000,
  currency: "INR",
  status: "sent" as const,
  due_at: "2026-07-01T00:00:00Z",
  created_at: "2026-06-01T00:00:00Z",
  student_id: "student-1",
  student_name: "Aarav Sharma",
  student_code: "STU-001",
};

const samplePayment = {
  id: "pay-1",
  amount_cents: 100000,
  currency: "INR",
  method: "upi",
  paid_at: "2026-06-10T00:00:00Z",
  invoice_id: "inv-1",
  invoice_number: "FEE-001",
  student_name: "Aarav Sharma",
};

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <ThemeProvider>
        <MemoryRouter>
          <FeesPage />
        </MemoryRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

describe("FeesPage", () => {
  beforeEach(() => {
    fetchCenterStudents.mockResolvedValue([
      { id: "student-1", full_name: "Aarav Sharma", student_code: "STU-001" },
    ]);
    fetchCenterInvoices.mockResolvedValue([sampleInvoice]);
    fetchCenterPayments.mockResolvedValue([samplePayment]);
    createCenterInvoice.mockResolvedValue("inv-2");
    recordCenterPayment.mockResolvedValue(undefined);
  });

  it("regression_center_fees_lists_invoices_and_payments", async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Fees & Payments")).toBeDefined();
      expect(screen.getByText("FEE-001")).toBeDefined();
      expect(screen.getAllByText(/Aarav Sharma/).length).toBeGreaterThan(0);
      expect(screen.getByText(/via upi/i)).toBeDefined();
    });
    expect(screen.getByRole("heading", { name: "Add invoice" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "Record payment" })).toBeDefined();
  });

  it("regression_center_fees_create_invoice_submits_form", async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText("FEE-001")).toBeDefined());

    fireEvent.change(screen.getByLabelText("Student"), { target: { value: "student-1" } });
    fireEvent.change(screen.getAllByLabelText("Amount (₹)")[0]!, { target: { value: "1500" } });
    fireEvent.click(screen.getByRole("button", { name: "Create invoice" }));

    await waitFor(() => {
      expect(createCenterInvoice).toHaveBeenCalledWith(
        expect.objectContaining({
          studentId: "student-1",
          amountCents: 150000,
        })
      );
    });
  });
});
