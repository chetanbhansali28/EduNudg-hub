import { Input, ToggleField } from "@edunudg/ui";
import { EditorAccordion, EditorFieldSpan, EditorFieldsGrid, EditorSectionNote } from "@/features/marketing/HomepageEditorShell";
import type { BrandSocialConnect } from "@/lib/brandSocialConnect";
import { BRAND_SOCIAL_WHATSAPP_MESSAGE_MAX } from "@/lib/brandSocialConnect";

type Props = {
  socialConnect: BrandSocialConnect;
  onSocialConnectChange: (next: BrandSocialConnect) => void;
};

export function SocialMediaConnectEditor({ socialConnect, onSocialConnectChange }: Props) {
  const update = (patch: Partial<BrandSocialConnect>) => {
    onSocialConnectChange({ ...socialConnect, ...patch });
  };

  return (
    <EditorAccordion
      sectionId="socialConnect"
      title="Social Media Connect"
      description="Footer icons and WhatsApp chat button for brand homepage visitors"
    >
      <EditorSectionNote>
        Facebook and Instagram appear as icons in the site footer. WhatsApp shows as a floating chat button on the
        homepage only. Click <strong>Save</strong> on this panel after editing.
      </EditorSectionNote>

      <EditorFieldsGrid>
        <Input
          label="Facebook page URL"
          value={socialConnect.facebookUrl ?? ""}
          onChange={(facebookUrl) => update({ facebookUrl: facebookUrl || undefined })}
          placeholder="https://facebook.com/your-page"
        />
        <Input
          label="Instagram profile URL"
          value={socialConnect.instagramUrl ?? ""}
          onChange={(instagramUrl) => update({ instagramUrl: instagramUrl || undefined })}
          placeholder="https://instagram.com/your-profile"
        />
      </EditorFieldsGrid>

      <EditorFieldSpan>
        <Input
          label="WhatsApp Business number"
          value={socialConnect.whatsappPhoneE164 ?? ""}
          onChange={(whatsappPhoneE164) =>
            update({
              whatsappPhoneE164: whatsappPhoneE164 || undefined,
              whatsappEnabled: whatsappPhoneE164 ? socialConnect.whatsappEnabled !== false : false,
            })
          }
          placeholder="+91 90219 24968"
        />
      </EditorFieldSpan>

      <EditorFieldSpan>
        <label className="ed-field-label" htmlFor="whatsapp-prefill-message">
          Pre-filled WhatsApp message
        </label>
        <textarea
          id="whatsapp-prefill-message"
          className="ed-input ed-input--textarea"
          rows={3}
          maxLength={BRAND_SOCIAL_WHATSAPP_MESSAGE_MAX}
          value={socialConnect.whatsappPrefillMessage ?? ""}
          onChange={(e) => update({ whatsappPrefillMessage: e.target.value || undefined })}
          placeholder="Hello! I visited your website and would like to inquire about your batches."
        />
      </EditorFieldSpan>

      <EditorFieldsGrid>
        <Input
          label="Chat bubble name"
          value={socialConnect.whatsappBubbleTitle ?? ""}
          onChange={(whatsappBubbleTitle) => update({ whatsappBubbleTitle: whatsappBubbleTitle || undefined })}
          placeholder="Neha Patil (Mentor)"
        />
        <Input
          label="Chat bubble message"
          value={socialConnect.whatsappBubbleBody ?? ""}
          onChange={(whatsappBubbleBody) => update({ whatsappBubbleBody: whatsappBubbleBody || undefined })}
          placeholder="Let's coordinate a free demo schedule over WhatsApp!"
        />
      </EditorFieldsGrid>

      <EditorFieldSpan>
        <ToggleField
          label="Show WhatsApp chat button on homepage"
          checked={socialConnect.whatsappEnabled !== false && Boolean(socialConnect.whatsappPhoneE164?.trim())}
          disabled={!socialConnect.whatsappPhoneE164?.trim()}
          onChange={(whatsappEnabled) => update({ whatsappEnabled })}
        />
      </EditorFieldSpan>
    </EditorAccordion>
  );
}
