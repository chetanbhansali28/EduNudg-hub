type Props = {
  items: { question: string; answer: string }[];
};

export function EduLearnFaq({ items }: Props) {
  if (items.length === 0) return null;

  return (
    <section className="el-section" id="faq">
      <div className="el-section-inner">
        <div className="el-section-head">
          <h2>Questions parents ask</h2>
        </div>
        <div className="el-faq">
          {items.map((item, index) => (
            <details key={`${item.question}-${index}`} className="el-faq__item" open={index === 0}>
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
