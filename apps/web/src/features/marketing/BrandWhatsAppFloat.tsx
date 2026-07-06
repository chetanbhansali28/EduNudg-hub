import { useState } from "react";
import { IconWhatsApp } from "@edunudg/ui";
import {
  buildBrandWhatsAppHref,
  isBrandWhatsAppFloatVisible,
  type BrandSocialConnect,
} from "@/lib/brandSocialConnect";

type Props = {
  socialConnect: BrandSocialConnect;
};

export function BrandWhatsAppFloat({ socialConnect }: Props) {
  const [bubbleOpen, setBubbleOpen] = useState(true);

  if (!isBrandWhatsAppFloatVisible(socialConnect)) return null;

  const href = buildBrandWhatsAppHref(socialConnect);
  if (!href) return null;

  const title = socialConnect.whatsappBubbleTitle?.trim();
  const body = socialConnect.whatsappBubbleBody?.trim();
  const showBubble = bubbleOpen && Boolean(title || body);

  return (
    <div className="brand-whatsapp-float" data-testid="brand-whatsapp-float">
      {showBubble ? (
        <div className="brand-whatsapp-float__bubble" role="complementary" aria-label="WhatsApp chat preview">
          <button
            type="button"
            className="brand-whatsapp-float__close"
            aria-label="Dismiss chat preview"
            onClick={() => setBubbleOpen(false)}
          >
            ×
          </button>
          {title ? <p className="brand-whatsapp-float__title">{title}</p> : null}
          {body ? <p className="brand-whatsapp-float__body">{body}</p> : null}
        </div>
      ) : null}
      <a
        href={href}
        className="brand-whatsapp-float__button"
        target="_blank"
        rel="noreferrer"
        aria-label="Chat on WhatsApp"
      >
        <IconWhatsApp aria-hidden />
      </a>
    </div>
  );
}
