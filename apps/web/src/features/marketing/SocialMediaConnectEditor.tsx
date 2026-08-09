import { Input } from "@edunudg/ui";
import { EditorAccordion, EditorFieldsGrid, EditorSectionNote } from "@/features/marketing/HomepageEditorShell";
import type { BrandSocialConnect } from "@/lib/brandSocialConnect";

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
      description="Footer social icons for brand homepage visitors"
    >
      <EditorSectionNote>
        Facebook and Instagram appear as icons in the site footer. Click <strong>Save</strong> on this panel after
        editing.
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
    </EditorAccordion>
  );
}
