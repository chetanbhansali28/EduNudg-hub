import type { HomepageConfig } from "@/types/homepage";

type Props = {
  privacy: HomepageConfig["privacy"];
};

export function EnterprisePrivacy({ privacy }: Props) {
  return (
    <section id="privacy" className="ent-privacy ent-reveal">
      <div className="ent-privacy__card">
        <h2>{privacy.title}</h2>
        <p>{privacy.body}</p>
      </div>
    </section>
  );
}
