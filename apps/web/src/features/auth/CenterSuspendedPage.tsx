import { ThemeProvider } from "@edunudg/ui";

export function CenterSuspendedPage() {
  return (
    <ThemeProvider>
      <div className="ed-login">
        <div className="ed-login__card" style={{ maxWidth: "28rem" }}>
          <h1 className="ed-login__title">Franchise suspended</h1>
          <p className="ed-text-sm ed-muted">
            This franchise center has been temporarily suspended by the brand. Center staff cannot access the app until
            the brand re-enables the franchise.
          </p>
          <p className="ed-text-sm ed-muted">If you believe this is an error, contact your brand administrator.</p>
        </div>
      </div>
    </ThemeProvider>
  );
}
