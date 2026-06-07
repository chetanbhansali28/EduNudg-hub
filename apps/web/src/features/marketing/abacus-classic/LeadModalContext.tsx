import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export type LeadModalKind = "enroll" | "apply" | null;

type LeadModalContextValue = {
  activeModal: LeadModalKind;
  openModal: (kind: Exclude<LeadModalKind, null>) => void;
  closeModal: () => void;
};

const LeadModalContext = createContext<LeadModalContextValue | null>(null);

export function LeadModalProvider({ children }: { children: ReactNode }) {
  const [activeModal, setActiveModal] = useState<LeadModalKind>(null);

  const openModal = useCallback((kind: Exclude<LeadModalKind, null>) => {
    setActiveModal(kind);
  }, []);

  const closeModal = useCallback(() => {
    setActiveModal(null);
  }, []);

  const value = useMemo(
    () => ({ activeModal, openModal, closeModal }),
    [activeModal, openModal, closeModal]
  );

  return <LeadModalContext.Provider value={value}>{children}</LeadModalContext.Provider>;
}

export function useLeadModal() {
  const ctx = useContext(LeadModalContext);
  if (!ctx) throw new Error("useLeadModal must be used within LeadModalProvider");
  return ctx;
}

/** Safe hook when provider may be absent (Novu layout). */
export function useLeadModalOptional() {
  return useContext(LeadModalContext);
}
