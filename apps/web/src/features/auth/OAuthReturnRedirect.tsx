import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { isOAuthCallbackHash } from "@/services/auth/oauthRedirect";

/** Send Supabase OAuth hash callbacks on `/` (legacy redirect) to `/login` for membership gate. */
export function OAuthReturnRedirect() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isOAuthCallbackHash(location.hash)) return;
    if (location.pathname === "/login" || location.pathname === "/auth/handoff") return;
    navigate(`/login${location.search}${location.hash}`, { replace: true });
  }, [location.hash, location.pathname, location.search, navigate]);

  return null;
}
