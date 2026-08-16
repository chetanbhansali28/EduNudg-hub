import { Link } from "react-router-dom";
import type { LoginBrandingCopy } from "@/lib/portalBranding";

export function LoginCopyPreview({ copy }: { copy: LoginBrandingCopy }) {
  const initial = (copy.productName.trim()[0] ?? "B").toUpperCase();

  return (
    <aside className="ed-brand-settings-login-preview" aria-label="Login greeting preview">
      <p className="ed-brand-settings-login-preview__label">Updates as you type · Save Copy to publish</p>
      <div className="ed-brand-settings-login-preview__frame">
        <div className="ed-brand-settings-login-preview__hero">
          {copy.logoUrl ? (
            <img src={copy.logoUrl} alt="" className="ed-brand-settings-login-preview__logo" />
          ) : (
            <span className="ed-brand-settings-login-preview__mark" aria-hidden>
              {initial}
            </span>
          )}
          <h3 className="ed-brand-settings-login-preview__headline">{copy.headline}</h3>
          <p className="ed-brand-settings-login-preview__subtext">{copy.subtext}</p>
        </div>
        <div className="ed-brand-settings-login-preview__panel">
          <p className="ed-brand-settings-login-preview__form-title">{copy.accountTitle}</p>
          <p className="ed-brand-settings-login-preview__form-sub">{copy.accountSubtitle}</p>
          <span className="ed-brand-settings-login-preview__field" />
          <span className="ed-brand-settings-login-preview__field" />
          <span className="ed-brand-settings-login-preview__btn">Log in</span>
        </div>
      </div>
      <Link to="/login" className="ed-brand-settings-login-preview__link">
        Open login page
      </Link>
    </aside>
  );
}
