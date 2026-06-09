type Props = {
  items: { question: string; answer: string }[];
  title?: string;
};

export function FaqSection({ items, title = "Your questions, answered" }: Props) {
  if (items.length === 0) return null;

  return (
    <section className="sa-faq" id="faq">
      <div className="sa-section-head sa-section-head--center">
        <h2 className="sa-section-title">{title}</h2>
      </div>
      <div className="sa-faq__list">
        {items.map((item, i) => (
          <details key={`${item.question}-${i}`} className="sa-faq__item" open={i === 0}>
            <summary>
              {item.question}
              <span className="sa-faq__chevron" aria-hidden />
            </summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
