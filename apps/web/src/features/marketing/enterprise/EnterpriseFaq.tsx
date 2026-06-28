import type { HomepageFaq } from "@/types/homepage";

type Props = {
  items: HomepageFaq[];
};

export function EnterpriseFaq({ items }: Props) {
  if (items.length === 0) return null;

  return (
    <section id="faq" className="ent-faq ent-reveal">
      <h2>Got questions?</h2>
      <div className="ent-faq__list">
        {items.map((item) => (
          <details key={item.question} className="ent-faq__item">
            <summary className="ent-faq__question">{item.question}</summary>
            <p className="ent-faq__answer">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
