import type { HomepageEcosystemIntro } from "@/types/homepage";

type Props = {
  intro: HomepageEcosystemIntro;
};

export function EnterpriseEcosystemIntro({ intro }: Props) {
  return (
    <section className="ent-section ent-section--alt ent-ecosystem ent-reveal">
      <div className="ent-section__inner ent-ecosystem__inner">
        <h2 className="ent-ecosystem__title">{intro.title}</h2>
        <p className="ent-ecosystem__subtitle">{intro.subtitle}</p>
      </div>
    </section>
  );
}
