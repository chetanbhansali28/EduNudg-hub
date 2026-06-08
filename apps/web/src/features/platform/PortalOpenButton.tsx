import { useState } from "react";
import { Button } from "@edunudg/ui";
import type { PortalTarget } from "@/lib/brandPortalUrl";
import { openPortalAsPlatformAdmin, openPortalBackendFallback } from "@/lib/portalHandoffApi";

type Props = {
  target: PortalTarget;
  label?: string;
};

export function PortalOpenButton({ target, label = "Open" }: Props) {
  const [pending, setPending] = useState(false);

  return (
    <Button
      variant="ghost"
      disabled={pending}
      onClick={() => {
        setPending(true);
        void openPortalAsPlatformAdmin(target)
          .catch(() => {
            openPortalBackendFallback(target);
          })
          .finally(() => setPending(false));
      }}
    >
      {pending ? "Opening…" : label}
    </Button>
  );
}
