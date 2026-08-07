import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useLeadModal } from "./LeadModalContext";
import { resolveLeadModalKind } from "./resolveLeadModalKind";

/** Opens enroll/apply modals when the URL hash is a lead deep link. */
export function LeadModalHashOpener() {
  const location = useLocation();
  const { openModal } = useLeadModal();

  useEffect(() => {
    const kind = resolveLeadModalKind(location.hash);
    if (kind) openModal(kind);
  }, [location.hash, openModal]);

  return null;
}
