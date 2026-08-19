export function EduLearnDoodles({ variant }: { variant: "hero" | "stats" | "cta" }) {
  if (variant === "hero") {
    return (
      <svg className="el-doodles el-doodles--hero" viewBox="0 0 420 420" aria-hidden>
        <path d="M48 90c18-22 42-8 28 12" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
        <path d="M360 70l8 18 18-6-12 16 14 14-20-2-8 18-8-18-20 2 14-14z" fill="#f9a825" />
        <path d="M40 300c40 18 80-10 70-40" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
        <circle cx="380" cy="240" r="6" fill="none" stroke="#fff" strokeWidth="2" />
        <path d="M300 40c20 0 20 24 0 24s-20-24 0-24z" fill="none" stroke="#f9a825" strokeWidth="2" />
      </svg>
    );
  }
  if (variant === "stats") {
    return (
      <svg className="el-doodles el-doodles--stats" viewBox="0 0 160 160" aria-hidden>
        <path d="M20 40c30-24 70 8 90-10" fill="none" stroke="#f9a825" strokeWidth="3" strokeLinecap="round" />
        <path d="M120 110l6 14 14-4-10 12 12 10-16-2-6 14-6-14-16 2 12-10z" fill="#1e5631" />
      </svg>
    );
  }
  return (
    <svg className="el-doodles el-doodles--cta" viewBox="0 0 80 80" aria-hidden>
      <path d="M40 8l6 14 16 2-12 10 4 16-14-8-14 8 4-16-12-10 16-2z" fill="none" stroke="#f9a825" strokeWidth="3" />
    </svg>
  );
}
