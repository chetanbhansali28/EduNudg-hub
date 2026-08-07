import { useEffect } from "react";
import { describe, expect, it } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { LeadModalHashOpener } from "./LeadModalHashOpener";
import { LeadModalProvider, useLeadModal } from "./LeadModalContext";

function ModalProbe({ onKind }: { onKind: (kind: string | null) => void }) {
  const { activeModal } = useLeadModal();
  useEffect(() => {
    onKind(activeModal);
  }, [activeModal, onKind]);
  return null;
}

function renderWithHash(hashPath: string, onKind: (kind: string | null) => void) {
  return render(
    <MemoryRouter initialEntries={[hashPath]}>
      <LeadModalProvider>
        <LeadModalHashOpener />
        <ModalProbe onKind={onKind} />
        <Routes>
          <Route path="/" element={<div />} />
        </Routes>
      </LeadModalProvider>
    </MemoryRouter>
  );
}

describe("LeadModalHashOpener", () => {
  it("regression_hash_enroll_student_opens_enroll_modal", async () => {
    let latest: string | null = null;
    renderWithHash("/#enroll-student", (k) => {
      latest = k;
    });
    await waitFor(() => expect(latest).toBe("enroll"));
  });

  it("regression_hash_apply_opens_apply_modal", async () => {
    let latest: string | null = null;
    renderWithHash("/#apply", (k) => {
      latest = k;
    });
    await waitFor(() => expect(latest).toBe("apply"));
  });
});
