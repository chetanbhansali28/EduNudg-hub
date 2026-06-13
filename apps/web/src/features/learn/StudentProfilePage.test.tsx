import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { StudentProfilePage } from "./StudentProfilePage";

const fetchStudentProfile = vi.fn();
const updateStudentSelfProfile = vi.fn();

vi.mock("@/bootstrap/AuthProvider", () => ({
  useAuth: () => ({
    user: { id: "u1", email: "student@edunudg.com", user_metadata: { full_name: "Asha Kumar" } },
  }),
}));

vi.mock("@/bootstrap/TenantProvider", () => ({
  useTenant: () => ({ brandId: "brand-1", brandSlug: "abacusworld" }),
}));

vi.mock("@/lib/studentLearnApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/studentLearnApi")>();
  return {
    ...actual,
    fetchStudentProfile: (...args: unknown[]) => fetchStudentProfile(...args),
    updateStudentSelfProfile: (...args: unknown[]) => updateStudentSelfProfile(...args),
  };
});

const mockProfile = {
  student: {
    id: "s1",
    full_name: "Asha Kumar",
    student_code: "STU-001",
    date_of_birth: "2015-06-01",
    profile: {
      school_name: "Demo School",
      city: "Bengaluru",
      pincode: "560001",
      address_line1: "12 Main St",
      state: "KA",
      phone: "+919876543210",
      photo_url: "https://cdn/student.jpg",
    },
  },
  brand: { id: "brand-1", name: "Abacus World", logo_url: null },
  enrollment: {
    enrollment_id: "e1",
    status: "active",
    enrolled_at: "2024-01-01T00:00:00Z",
    center_id: "c1",
    batch_name: "Morning batch",
    program_id: "p1",
    program_name: "Abacus Core",
  },
  center: {
    id: "c1",
    display_name: "Koramangala",
    short_description: null,
    city: "Bengaluru",
    contact_phone: "+919999999999",
    public_url: "http://koramangala.abacusworld.localhost:9000/",
  },
  enrollment_history: [],
};

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <StudentProfilePage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("StudentProfilePage", () => {
  beforeEach(() => {
    fetchStudentProfile.mockResolvedValue(mockProfile);
    updateStudentSelfProfile.mockResolvedValue(mockProfile.student);
  });

  it("regression_profile_shows_student_details_form_and_my_center", async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Student Details" })).toBeDefined();
      expect(screen.getByLabelText(/Full name/)).toBeDefined();
      expect(screen.getByLabelText("Email")).toBeDefined();
      expect(screen.getByDisplayValue("student@edunudg.com")).toBeDefined();
      expect(screen.queryByRole("button", { name: "Edit" })).toBeNull();
      expect(screen.queryByText("Abacus World")).toBeNull();
    });

    expect(screen.getByRole("heading", { name: "My center" })).toBeDefined();
    expect(screen.getByText("Koramangala")).toBeDefined();
  });

  it("regression_profile_saves_from_inline_form", async () => {
    renderPage();

    await waitFor(() => expect(screen.getByLabelText("School name")).toBeDefined());

    fireEvent.change(screen.getByLabelText("School name"), { target: { value: "New School" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(updateStudentSelfProfile).toHaveBeenCalledWith(
        "brand-1",
        expect.objectContaining({ schoolName: "New School", photoUrl: "https://cdn/student.jpg" })
      );
    });
  });
});
