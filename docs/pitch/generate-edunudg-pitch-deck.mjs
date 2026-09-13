/**
 * EduNudg sales pitch deck generator
 * Run: node docs/pitch/generate-edunudg-pitch-deck.mjs
 */
import PptxGenJS from "pptxgenjs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, "EduNudg-Pitch-Deck.pptx");

const C = {
  bg: "0B1F33",
  bgAlt: "122A40",
  card: "16324A",
  ink: "F4F7FA",
  muted: "A8B8C8",
  accent: "2DD4BF",
  accentDeep: "0D9488",
  warm: "F59E0B",
  white: "FFFFFF",
  soft: "E8EEF4",
  danger: "FB7185",
  line: "2A455C",
};

const pptx = new PptxGenJS();
pptx.defineLayout({ name: "WIDE", width: 13.333, height: 7.5 });
pptx.layout = "WIDE";
pptx.author = "EduNudg";
pptx.title = "EduNudg — Franchise Learning OS Pitch Deck";
pptx.subject = "Sales pitch for education brand and institute owners";

function bg(slide, color = C.bg) {
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: 0,
    y: 0,
    w: 13.333,
    h: 7.5,
    fill: { color },
    line: { color },
  });
}

function accentBar(slide) {
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: 0,
    y: 0,
    w: 13.333,
    h: 0.08,
    fill: { color: C.accent },
    line: { color: C.accent },
  });
}

function footer(slide, page, total = 12) {
  slide.addText("EduNudg  ·  The learning OS for education networks", {
    x: 0.5,
    y: 7.1,
    w: 10,
    h: 0.25,
    fontSize: 10,
    fontFace: "Calibri",
    color: C.muted,
    margin: 0,
  });
  slide.addText(`${page} / ${total}`, {
    x: 11.5,
    y: 7.1,
    w: 1.3,
    h: 0.25,
    fontSize: 10,
    fontFace: "Calibri",
    color: C.muted,
    align: "right",
    margin: 0,
  });
}

function notes(slide, text) {
  slide.addNotes(text.trim());
}

function pill(slide, x, y, w, label) {
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x,
    y,
    w,
    h: 0.32,
    fill: { color: C.accentDeep },
    line: { color: C.accentDeep },
    rectRadius: 0.1,
  });
  slide.addText(label, {
    x,
    y,
    w,
    h: 0.32,
    fontSize: 11,
    fontFace: "Calibri",
    color: C.white,
    align: "center",
    valign: "middle",
    margin: 0,
    bold: true,
  });
}

function card(slide, x, y, w, h) {
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x,
    y,
    w,
    h,
    fill: { color: C.card },
    line: { color: C.line },
    rectRadius: 0.12,
  });
}

// ─── 1. Title ───────────────────────────────────────────────────────────────
{
  const s = pptx.addSlide();
  bg(s);
  accentBar(s);

  pill(s, 0.7, 1.6, 2.6, "FOR EDUCATION BRANDS");

  s.addText("Teaching scales.\nSpreadsheets don’t.", {
    x: 0.7,
    y: 2.2,
    w: 8,
    h: 1.8,
    fontSize: 44,
    fontFace: "Georgia",
    color: C.ink,
    bold: true,
    margin: 0,
  });

  s.addText(
    "EduNudg is the operating system for education brands that run centers —\nwebsite, leads, franchises, curriculum, fees, and student learning in one place.",
    {
      x: 0.7,
      y: 4.2,
      w: 8.2,
      h: 0.9,
      fontSize: 16,
      fontFace: "Calibri",
      color: C.muted,
      margin: 0,
    },
  );

  s.addText("Learn with clarity.  Lead with confidence.", {
    x: 0.7,
    y: 5.4,
    w: 8,
    h: 0.35,
    fontSize: 14,
    fontFace: "Georgia",
    color: C.accent,
    italic: true,
    margin: 0,
  });

  card(s, 9.4, 2.0, 3.3, 3.6);
  s.addText("Today’s ask", {
    x: 9.65,
    y: 2.25,
    w: 2.9,
    h: 0.35,
    fontSize: 12,
    fontFace: "Calibri",
    color: C.accent,
    bold: true,
    margin: 0,
  });
  s.addText(
    "See the problem clearly.\nSee how EduNudg fixes it.\nLeave ready to start a trial.",
    {
      x: 9.65,
      y: 2.75,
      w: 2.9,
      h: 2.2,
      fontSize: 15,
      fontFace: "Calibri",
      color: C.ink,
      margin: 0,
      paraSpacingAfter: 10,
    },
  );

  footer(s, 1);
  notes(
    s,
    `OPENING (45–60 sec)

"Thank you for the time. I’m not here to show you another school app with fifty menus. I’m here because most institute owners don’t fail on teaching — they fail when growth outruns the office.

You start with WhatsApp, Excel, and a website builder. It works for one center. Then you add a second branch — or a franchisee — and suddenly parents inquire in five places, each center teaches a slightly different course, and you become the glue chasing follow-ups every evening.

EduNudg replaces that glue. By the end of this short deck, you’ll see the problem, the solution, and why a trial is the lowest-risk way to prove it with your own brand."

Pause. Smile. Then go to slide 2.`,
  );
}

// ─── 2. Problem ─────────────────────────────────────────────────────────────
{
  const s = pptx.addSlide();
  bg(s);
  accentBar(s);

  s.addText("THE PROBLEM", {
    x: 0.7,
    y: 0.4,
    w: 6,
    h: 0.3,
    fontSize: 12,
    fontFace: "Calibri",
    color: C.accent,
    bold: true,
    margin: 0,
  });
  s.addText("Growth creates chaos — not because teaching is weak.", {
    x: 0.7,
    y: 0.75,
    w: 11.5,
    h: 0.55,
    fontSize: 28,
    fontFace: "Georgia",
    color: C.ink,
    margin: 0,
  });

  const pains = [
    {
      t: "Lost inquiries",
      d: "Parent leads land in WhatsApp, forms, and phone notes. Nobody owns the follow-up.",
    },
    {
      t: "Inconsistent delivery",
      d: "Each center teaches a slightly different version of your method.",
    },
    {
      t: "Blind network",
      d: "You can’t see which centers convert — and which leak opportunities.",
    },
    {
      t: "Scattered ops",
      d: "Fees, kits, and student lists live in separate tools — or someone’s phone.",
    },
  ];

  pains.forEach((p, i) => {
    const x = 0.7 + (i % 2) * 6.2;
    const y = 1.6 + Math.floor(i / 2) * 2.2;
    card(s, x, y, 5.9, 2.0);
    s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: x + 0.25,
      y: y + 0.35,
      w: 0.12,
      h: 1.2,
      fill: { color: C.danger },
      line: { color: C.danger },
      rectRadius: 0.06,
    });
    s.addText(p.t, {
      x: x + 0.55,
      y: y + 0.35,
      w: 5.0,
      h: 0.4,
      fontSize: 18,
      fontFace: "Georgia",
      color: C.ink,
      margin: 0,
    });
    s.addText(p.d, {
      x: x + 0.55,
      y: y + 0.9,
      w: 5.0,
      h: 0.8,
      fontSize: 14,
      fontFace: "Calibri",
      color: C.muted,
      margin: 0,
    });
  });

  footer(s, 2);
  notes(
    s,
    `PROBLEM SCRIPT (~90 sec) — deliver almost verbatim

"Most institute owners don’t fail because the teaching is weak. They fail when growth outruns the office.

You start with WhatsApp, Excel, and a website builder. It works for one center. Then you add a second branch — or a franchisee — and suddenly:

• Parent inquiries land in five places and nobody owns the follow-up
• Each center teaches a slightly different version of your course
• You can’t see, from one screen, which centers are converting and which are leaking leads
• Fees, kits, and student lists live in separate tools — or in someone’s phone
• Your brand looks polished on Instagram, but the enrollment experience feels amateur

So the owner becomes the glue: chasing franchises, re-sending brochures, asking ‘did that parent enroll?’ every evening.

If you want parents to trust you at scale, your operations have to look as good as your teaching."

Ask: "Does any of this sound familiar?" — wait for a nod before continuing.`,
  );
}

// ─── 3. Insight ─────────────────────────────────────────────────────────────
{
  const s = pptx.addSlide();
  bg(s);
  accentBar(s);

  s.addText("THE INSIGHT", {
    x: 0.7,
    y: 0.5,
    w: 6,
    h: 0.3,
    fontSize: 12,
    fontFace: "Calibri",
    color: C.accent,
    bold: true,
    margin: 0,
  });

  s.addText("You don’t need another school ERP.", {
    x: 0.7,
    y: 1.5,
    w: 12,
    h: 0.7,
    fontSize: 32,
    fontFace: "Georgia",
    color: C.ink,
    margin: 0,
  });
  s.addText("You need a franchise learning operating system.", {
    x: 0.7,
    y: 2.25,
    w: 12,
    h: 0.7,
    fontSize: 32,
    fontFace: "Georgia",
    color: C.accent,
    margin: 0,
  });

  const cols = [
    { h: "Single-center tools", b: "Built for one school office. Break when you franchise." },
    { h: "Generic ERPs", b: "Heavy menus. Weak brand experience. Parents don’t feel your institute." },
    { h: "EduNudg", b: "Built for Brand → Center → Student. White-label. One source of truth." },
  ];
  cols.forEach((c, i) => {
    const x = 0.7 + i * 4.1;
    card(s, x, 3.4, 3.9, 2.6);
    if (i === 2) {
      s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
        x,
        y: 3.4,
        w: 3.9,
        h: 2.6,
        fill: { color: "0F3D3A" },
        line: { color: C.accent },
        rectRadius: 0.12,
      });
    }
    s.addText(c.h, {
      x: x + 0.25,
      y: 3.7,
      w: 3.4,
      h: 0.5,
      fontSize: 16,
      fontFace: "Georgia",
      color: i === 2 ? C.accent : C.ink,
      margin: 0,
    });
    s.addText(c.b, {
      x: x + 0.25,
      y: 4.4,
      w: 3.4,
      h: 1.2,
      fontSize: 14,
      fontFace: "Calibri",
      color: C.muted,
      margin: 0,
    });
  });

  footer(s, 3);
  notes(
    s,
    `INSIGHT (~40 sec)

"Most products you’ll be shown are either a single-center admin tool — which breaks the day you open a second location — or a heavy ERP that makes your brand feel like software, not an institute parents trust.

EduNudg is different by design. It’s a franchise learning operating system: Brand at the top, Centers underneath, Students after enrollment — three portals, one source of truth.

Hobby classes that still feel personal — even when you run twenty centers."`,
  );
}

// ─── 4. Solution ────────────────────────────────────────────────────────────
{
  const s = pptx.addSlide();
  bg(s);
  accentBar(s);

  s.addText("THE SOLUTION", {
    x: 0.7,
    y: 0.4,
    w: 6,
    h: 0.3,
    fontSize: 12,
    fontFace: "Calibri",
    color: C.accent,
    bold: true,
    margin: 0,
  });
  s.addText("One system. Your brand. Every center.", {
    x: 0.7,
    y: 0.75,
    w: 12,
    h: 0.55,
    fontSize: 28,
    fontFace: "Georgia",
    color: C.ink,
    margin: 0,
  });

  const pillars = [
    { n: "01", t: "Acquire", d: "Branded website + lead pipeline so every inquiry has an owner." },
    { n: "02", t: "Operate", d: "Franchise control, center front desk, fees, inventory, analytics." },
    { n: "03", t: "Teach", d: "Shared curriculum + student learning portal after enrollment." },
    { n: "04", t: "Grow", d: "Merchandise, competitions, batches — switch on when ready." },
  ];
  pillars.forEach((p, i) => {
    const x = 0.55 + i * 3.15;
    card(s, x, 1.7, 3.0, 4.5);
    s.addText(p.n, {
      x: x + 0.25,
      y: 2.0,
      w: 2.5,
      h: 0.45,
      fontSize: 22,
      fontFace: "Georgia",
      color: C.accent,
      margin: 0,
    });
    s.addText(p.t, {
      x: x + 0.25,
      y: 2.7,
      w: 2.5,
      h: 0.5,
      fontSize: 22,
      fontFace: "Georgia",
      color: C.ink,
      margin: 0,
    });
    s.addText(p.d, {
      x: x + 0.25,
      y: 3.5,
      w: 2.5,
      h: 2.0,
      fontSize: 14,
      fontFace: "Calibri",
      color: C.muted,
      margin: 0,
    });
  });

  footer(s, 4);
  notes(
    s,
    `SOLUTION (~45 sec)

"EduNudg gives your brand a professional public face, a lead-to-enrollment pipeline, control of curriculum across centers, and a student learning portal.

Four jobs, one platform:
1. Acquire — websites and leads
2. Operate — franchises, fees, day-to-day
3. Teach — curriculum consistency and the student portal
4. Grow — kits, contests, batches when you’re ready

You don’t rip out your teaching method. You put the network around it."`,
  );
}

// ─── 5. How it works ────────────────────────────────────────────────────────
{
  const s = pptx.addSlide();
  bg(s);
  accentBar(s);

  s.addText("HOW IT WORKS", {
    x: 0.7,
    y: 0.4,
    w: 6,
    h: 0.3,
    fontSize: 12,
    fontFace: "Calibri",
    color: C.accent,
    bold: true,
    margin: 0,
  });
  s.addText("The power of three — one source of truth.", {
    x: 0.7,
    y: 0.75,
    w: 12,
    h: 0.5,
    fontSize: 28,
    fontFace: "Georgia",
    color: C.ink,
    margin: 0,
  });

  const layers = [
    {
      t: "Brand HQ",
      sub: "Franchisor / institute network",
      items: "Website · Leads · Franchises · Curriculum · Analytics · Billing",
    },
    {
      t: "Center / Franchise",
      sub: "Each location’s front desk",
      items: "Assigned leads · Students · Fees · Inventory · Local site",
    },
    {
      t: "Student / Family",
      sub: "After enrollment",
      items: "Learn portal · Progress · Events · Profile · Center link",
    },
  ];
  layers.forEach((L, i) => {
    const y = 1.5 + i * 1.65;
    card(s, 0.7, y, 11.9, 1.5);
    s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: 0.95,
      y: y + 0.35,
      w: 0.55,
      h: 0.8,
      fill: { color: C.accentDeep },
      line: { color: C.accentDeep },
      rectRadius: 0.1,
    });
    s.addText(String(i + 1), {
      x: 0.95,
      y: y + 0.35,
      w: 0.55,
      h: 0.8,
      fontSize: 20,
      fontFace: "Georgia",
      color: C.white,
      align: "center",
      valign: "middle",
      margin: 0,
      bold: true,
    });
    s.addText(L.t, {
      x: 1.8,
      y: y + 0.25,
      w: 5,
      h: 0.4,
      fontSize: 20,
      fontFace: "Georgia",
      color: C.ink,
      margin: 0,
    });
    s.addText(L.sub, {
      x: 1.8,
      y: y + 0.7,
      w: 4,
      h: 0.35,
      fontSize: 13,
      fontFace: "Calibri",
      color: C.accent,
      margin: 0,
    });
    s.addText(L.items, {
      x: 6.5,
      y: y + 0.45,
      w: 5.7,
      h: 0.6,
      fontSize: 14,
      fontFace: "Calibri",
      color: C.muted,
      margin: 0,
    });
  });

  footer(s, 5);
  notes(
    s,
    `HOW IT WORKS (~50 sec)

"Think of three portals sharing one truth.

Brand HQ — that’s you. You control the website, the curriculum, franchise approvals, and you see the whole network.

Each Center gets a simple front desk: leads assigned to them, students, fees, inventory — not a complex ERP.

After a child enrolls, they get your branded Learn portal — progress, events, profile — so the relationship continues inside your brand, not on random apps.

Commercial note: the brand pays EduNudg. Franchisees use the system; they don’t buy the platform from us."`,
  );
}

// ─── 6. Acquire ─────────────────────────────────────────────────────────────
{
  const s = pptx.addSlide();
  bg(s);
  accentBar(s);

  s.addText("01  ·  ACQUIRE", {
    x: 0.7,
    y: 0.4,
    w: 6,
    h: 0.3,
    fontSize: 12,
    fontFace: "Calibri",
    color: C.accent,
    bold: true,
    margin: 0,
  });
  s.addText("Parents meet your institute — not software.", {
    x: 0.7,
    y: 0.75,
    w: 12,
    h: 0.5,
    fontSize: 26,
    fontFace: "Georgia",
    color: C.ink,
    margin: 0,
  });

  const left = [
    ["White-label brand website", "Hero, courses, mentors, stories, events, FAQ — your look."],
    ["Center public pages", "Each location inherits your brand chrome."],
    ["Public course pages", "Curriculum drives what parents see online."],
    ["Branded login", "Staff and students sign in looking like your institute."],
  ];
  const right = [
    ["Parent applications", "Brand-wide or direct to a center."],
    ["Assign & reallocate", "Pincode suggestions; you override when needed."],
    ["Stale-lead alerts", "Quiet franchises don’t sit on opportunities."],
    ["Lost + reopen + CSV", "Reasons captured; brand can reopen; export anytime."],
  ];

  card(s, 0.55, 1.5, 6.0, 5.1);
  s.addText("Your public brand", {
    x: 0.85,
    y: 1.75,
    w: 5.4,
    h: 0.4,
    fontSize: 16,
    fontFace: "Georgia",
    color: C.accent,
    margin: 0,
  });
  left.forEach((row, i) => {
    const y = 2.35 + i * 0.95;
    s.addText(row[0], {
      x: 0.85,
      y,
      w: 5.4,
      h: 0.3,
      fontSize: 15,
      fontFace: "Calibri",
      color: C.ink,
      bold: true,
      margin: 0,
    });
    s.addText(row[1], {
      x: 0.85,
      y: y + 0.32,
      w: 5.4,
      h: 0.4,
      fontSize: 13,
      fontFace: "Calibri",
      color: C.muted,
      margin: 0,
    });
  });

  card(s, 6.8, 1.5, 6.0, 5.1);
  s.addText("Lead → enrollment", {
    x: 7.1,
    y: 1.75,
    w: 5.4,
    h: 0.4,
    fontSize: 16,
    fontFace: "Georgia",
    color: C.accent,
    margin: 0,
  });
  right.forEach((row, i) => {
    const y = 2.35 + i * 0.95;
    s.addText(row[0], {
      x: 7.1,
      y,
      w: 5.4,
      h: 0.3,
      fontSize: 15,
      fontFace: "Calibri",
      color: C.ink,
      bold: true,
      margin: 0,
    });
    s.addText(row[1], {
      x: 7.1,
      y: y + 0.32,
      w: 5.4,
      h: 0.4,
      fontSize: 13,
      fontFace: "Calibri",
      color: C.muted,
      margin: 0,
    });
  });

  footer(s, 6);
  notes(
    s,
    `ACQUIRE (~55 sec)

"Pitch line: Parents meet your institute online — not a software company’s portal.

On the left: your white-label site. Themes built for education brands. Homepage you control. Course pages from your curriculum. Even login looks like you.

On the right: the pipeline. Parents apply on brand or center site. You assign to the right center. Centers convert to student or mark lost with a reason. Stale alerts mean quiet franchises don’t bury opportunities.

Every inquiry has an owner, a timeline, and an outcome — not a forgotten WhatsApp."`,
  );
}

// ─── 7. Operate ─────────────────────────────────────────────────────────────
{
  const s = pptx.addSlide();
  bg(s);
  accentBar(s);

  s.addText("02  ·  OPERATE", {
    x: 0.7,
    y: 0.4,
    w: 6,
    h: 0.3,
    fontSize: 12,
    fontFace: "Calibri",
    color: C.accent,
    bold: true,
    margin: 0,
  });
  s.addText("Open a new center without inventing a new process.", {
    x: 0.7,
    y: 0.75,
    w: 12,
    h: 0.5,
    fontSize: 26,
    fontFace: "Georgia",
    color: C.ink,
    margin: 0,
  });

  const ops = [
    { t: "Franchise applications", d: "Approve → center goes live + operator invited in one flow." },
    { t: "Import / export centers", d: "Bulk CSV for network rollouts; export the full franchise list." },
    { t: "Curriculum enablement", d: "You decide which courses each center may offer." },
    { t: "Center front desk", d: "Leads, students, fees, inventory — simple enough franchisees will use." },
    { t: "Network roster", d: "See students across franchises; search by name, city, center; export CSV." },
    { t: "Analytics pulse", d: "Conversion and enrollment visibility across the network." },
  ];
  ops.forEach((o, i) => {
    const x = 0.55 + (i % 3) * 4.2;
    const y = 1.55 + Math.floor(i / 3) * 2.5;
    card(s, x, y, 4.0, 2.25);
    s.addText(o.t, {
      x: x + 0.25,
      y: y + 0.35,
      w: 3.5,
      h: 0.55,
      fontSize: 16,
      fontFace: "Georgia",
      color: C.ink,
      margin: 0,
    });
    s.addText(o.d, {
      x: x + 0.25,
      y: y + 1.05,
      w: 3.5,
      h: 0.9,
      fontSize: 13,
      fontFace: "Calibri",
      color: C.muted,
      margin: 0,
    });
  });

  footer(s, 7);
  notes(
    s,
    `OPERATE (~55 sec)

"Pitch line: Open a new center without inventing a new process.

Franchise applications: approve, and the center site plus operator invite happen together.

You can import franchises by CSV when you’re rolling out fast. You enable which curriculum each center teaches — so your method stays yours.

Franchisees get a real front desk: leads, students, fees, inventory — not fifty screens they’ll ignore.

From HQ you see the network roster and analytics. Disable a center if needed. Open their public site or staff app from one panel.

Important: royalties and kit money between you and franchises stay your business terms. EduNudg is the operating layer — you still run your franchise economics."`,
  );
}

// ─── 8. Teach ───────────────────────────────────────────────────────────────
{
  const s = pptx.addSlide();
  bg(s);
  accentBar(s);

  s.addText("03  ·  TEACH", {
    x: 0.7,
    y: 0.4,
    w: 6,
    h: 0.3,
    fontSize: 12,
    fontFace: "Calibri",
    color: C.accent,
    bold: true,
    margin: 0,
  });
  s.addText("Your method stays consistent — even across twenty classrooms.", {
    x: 0.7,
    y: 0.75,
    w: 12,
    h: 0.55,
    fontSize: 24,
    fontFace: "Georgia",
    color: C.ink,
    margin: 0,
  });

  card(s, 0.55, 1.55, 6.0, 5.0);
  s.addText("Curriculum as source of truth", {
    x: 0.85,
    y: 1.85,
    w: 5.4,
    h: 0.4,
    fontSize: 18,
    fontFace: "Georgia",
    color: C.accent,
    margin: 0,
  });
  const curr = [
    "Courses → Levels → Units",
    "Draft vs published — go live when ready",
    "Marketing banners per course",
    "What parents see matches what centers teach",
    "Per-center enablement of programs",
  ];
  curr.forEach((t, i) => {
    s.addText(`▸  ${t}`, {
      x: 0.85,
      y: 2.55 + i * 0.65,
      w: 5.4,
      h: 0.5,
      fontSize: 15,
      fontFace: "Calibri",
      color: C.ink,
      margin: 0,
    });
  });

  card(s, 6.8, 1.55, 6.0, 5.0);
  s.addText("Student Learn portal", {
    x: 7.1,
    y: 1.85,
    w: 5.4,
    h: 0.4,
    fontSize: 18,
    fontFace: "Georgia",
    color: C.accent,
    margin: 0,
  });
  const learn = [
    "Invite-only after enrollment",
    "Home + curriculum progress ladder",
    "Events & competitions (when enabled)",
    "Profile with center website link",
    "Branded experience under your name",
  ];
  learn.forEach((t, i) => {
    s.addText(`▸  ${t}`, {
      x: 7.1,
      y: 2.55 + i * 0.65,
      w: 5.4,
      h: 0.5,
      fontSize: 15,
      fontFace: "Calibri",
      color: C.ink,
      margin: 0,
    });
  });

  footer(s, 8);
  notes(
    s,
    `TEACH (~50 sec)

"Pitch line: Your method stays consistent — even when you have twenty classrooms.

Curriculum is the system of record: courses, levels, units. Publish when ready. Marketing banners per course. Public course pages and center offerings all pull from the same place.

After enrollment, students land in your Learn portal — progress through the ladder, events if you run competitions, profile linked back to their center.

This is how enrollment becomes a relationship, not a one-time form fill."`,
  );
}

// ─── 9. Grow ────────────────────────────────────────────────────────────────
{
  const s = pptx.addSlide();
  bg(s);
  accentBar(s);

  s.addText("04  ·  GROW", {
    x: 0.7,
    y: 0.4,
    w: 6,
    h: 0.3,
    fontSize: 12,
    fontFace: "Calibri",
    color: C.accent,
    bold: true,
    margin: 0,
  });
  s.addText("Start simple. Switch modules on when the network is ready.", {
    x: 0.7,
    y: 0.75,
    w: 12,
    h: 0.5,
    fontSize: 24,
    fontFace: "Georgia",
    color: C.ink,
    margin: 0,
  });

  const mods = [
    { t: "Merchandise", d: "Brand catalog, promo codes, center shop & inventory — SKUs tied to courses." },
    { t: "Competitions", d: "Events and MCQ quizzes students take in the Learn portal." },
    { t: "Batches", d: "Class grouping and schedule at the center when you enable it." },
    { t: "Campaigns", d: "Brand campaigns — available when you turn the flag on." },
  ];
  mods.forEach((m, i) => {
    const x = 0.55 + (i % 2) * 6.35;
    const y = 1.55 + Math.floor(i / 2) * 2.45;
    card(s, x, y, 6.1, 2.25);
    s.addShape(pptx.shapes.OVAL, {
      x: x + 0.3,
      y: y + 0.85,
      w: 0.35,
      h: 0.35,
      fill: { color: C.warm },
      line: { color: C.warm },
    });
    s.addText(m.t, {
      x: x + 0.9,
      y: y + 0.4,
      w: 4.8,
      h: 0.45,
      fontSize: 20,
      fontFace: "Georgia",
      color: C.ink,
      margin: 0,
    });
    s.addText(m.d, {
      x: x + 0.9,
      y: y + 1.05,
      w: 4.8,
      h: 0.85,
      fontSize: 14,
      fontFace: "Calibri",
      color: C.muted,
      margin: 0,
    });
  });

  footer(s, 9);
  notes(
    s,
    `GROW (~35 sec)

"You’re not forced to turn everything on day one.

When kits matter, Merchandise connects brand catalog to center shop and inventory — scoped to the courses each center teaches.

Competitions give you events and quizzes in the student portal. Batches help centers schedule. Campaigns when you need brand-level pushes.

Start with website + leads + curriculum. Grow the modules with the network."`,
  );
}

// ─── 10. Demo path ──────────────────────────────────────────────────────────
{
  const s = pptx.addSlide();
  bg(s);
  accentBar(s);

  s.addText("SEE IT IN 4 STEPS", {
    x: 0.7,
    y: 0.4,
    w: 6,
    h: 0.3,
    fontSize: 12,
    fontFace: "Calibri",
    color: C.accent,
    bold: true,
    margin: 0,
  });
  s.addText("The trial walkthrough parents and owners feel.", {
    x: 0.7,
    y: 0.75,
    w: 12,
    h: 0.5,
    fontSize: 26,
    fontFace: "Georgia",
    color: C.ink,
    margin: 0,
  });

  const steps = [
    { n: "1", t: "Parent applies", d: "On your branded site — brand or center." },
    { n: "2", t: "Brand assigns", d: "Right center. Owner and SLA visible." },
    { n: "3", t: "Center converts", d: "Lead becomes a student. Invite Learn portal." },
    { n: "4", t: "Student learns", d: "Progress under your brand — not a random app." },
  ];
  steps.forEach((st, i) => {
    const x = 0.55 + i * 3.2;
    card(s, x, 1.7, 3.05, 4.4);
    s.addText(st.n, {
      x: x + 0.25,
      y: 2.1,
      w: 2.5,
      h: 0.7,
      fontSize: 40,
      fontFace: "Georgia",
      color: C.accent,
      margin: 0,
    });
    s.addText(st.t, {
      x: x + 0.25,
      y: 3.1,
      w: 2.55,
      h: 0.7,
      fontSize: 18,
      fontFace: "Georgia",
      color: C.ink,
      margin: 0,
    });
    s.addText(st.d, {
      x: x + 0.25,
      y: 4.0,
      w: 2.55,
      h: 1.4,
      fontSize: 14,
      fontFace: "Calibri",
      color: C.muted,
      margin: 0,
    });
  });

  footer(s, 10);
  notes(
    s,
    `DEMO PATH (~40 sec, or live demo)

"If we do a live walkthrough in the trial, this is the story:

1. A parent applies on your branded site
2. Brand HQ assigns the lead to the right center
3. The center converts them to a student and invites the Learn portal
4. The student sees progress under your brand

That’s the full loop from inquiry to learning — without WhatsApp archaeology.

If you’re presenting without a live demo, say: ‘This is exactly what we’ll set up with your brand in the trial.’"`,
  );
}

// ─── 11. Who + commercial ───────────────────────────────────────────────────
{
  const s = pptx.addSlide();
  bg(s);
  accentBar(s);

  s.addText("WHO IT’S FOR  ·  HOW IT’S SOLD", {
    x: 0.7,
    y: 0.4,
    w: 10,
    h: 0.3,
    fontSize: 12,
    fontFace: "Calibri",
    color: C.accent,
    bold: true,
    margin: 0,
  });
  s.addText("Built for network owners. Used by every center.", {
    x: 0.7,
    y: 0.75,
    w: 12,
    h: 0.5,
    fontSize: 26,
    fontFace: "Georgia",
    color: C.ink,
    margin: 0,
  });

  card(s, 0.55, 1.5, 7.5, 5.0);
  s.addText("Ideal buyers", {
    x: 0.85,
    y: 1.8,
    w: 6.9,
    h: 0.4,
    fontSize: 16,
    fontFace: "Georgia",
    color: C.accent,
    margin: 0,
  });
  const buyers = [
    ["Education brand / franchisor", "Governance + growth across centers"],
    ["Multi-location institute owner", "Same brand, shared curriculum, one pipeline"],
    ["Planning to franchise", "Apply → approve → live center + staff access"],
  ];
  buyers.forEach((b, i) => {
    const y = 2.45 + i * 1.15;
    s.addText(b[0], {
      x: 0.85,
      y,
      w: 6.9,
      h: 0.35,
      fontSize: 16,
      fontFace: "Calibri",
      color: C.ink,
      bold: true,
      margin: 0,
    });
    s.addText(b[1], {
      x: 0.85,
      y: y + 0.4,
      w: 6.9,
      h: 0.4,
      fontSize: 14,
      fontFace: "Calibri",
      color: C.muted,
      margin: 0,
    });
  });

  card(s, 8.3, 1.5, 4.5, 5.0);
  s.addText("Commercial", {
    x: 8.6,
    y: 1.8,
    w: 3.9,
    h: 0.4,
    fontSize: 16,
    fontFace: "Georgia",
    color: C.accent,
    margin: 0,
  });
  s.addText(
    "Brand pays EduNudg subscription.\n\nFranchises use the product — they don’t buy the platform.\n\nRoyalties & kits stay your terms with franchisees.\n\nTrial first: one brand, one or two centers, real inquiries.",
    {
      x: 8.6,
      y: 2.45,
      w: 3.9,
      h: 3.6,
      fontSize: 14,
      fontFace: "Calibri",
      color: C.ink,
      margin: 0,
    },
  );

  footer(s, 11);
  notes(
    s,
    `WHO + COMMERCIAL (~45 sec)

"Ideal buyers: education brands and franchisors; institute owners with multiple locations; anyone planning to franchise.

Even if you’re one center today — build the brand system now so the second center copies the first instead of reinventing it.

How it’s sold: the brand pays. Franchises use EduNudg; they don’t buy it from us. Your royalty and kit arrangements with franchisees stay yours.

Trial: put one brand live with one or two centers and real parent inquiries. That’s how we prove value without a leap of faith."`,
  );
}

// ─── 12. CTA ────────────────────────────────────────────────────────────────
{
  const s = pptx.addSlide();
  bg(s);
  accentBar(s);

  s.addText("NEXT STEP", {
    x: 0.7,
    y: 1.3,
    w: 6,
    h: 0.3,
    fontSize: 12,
    fontFace: "Calibri",
    color: C.accent,
    bold: true,
    margin: 0,
  });
  s.addText("Start your trial brand this week.", {
    x: 0.7,
    y: 1.8,
    w: 12,
    h: 0.7,
    fontSize: 34,
    fontFace: "Georgia",
    color: C.ink,
    margin: 0,
  });

  s.addText(
    "I’m not asking you to rip out everything tomorrow.\nI’m asking you to put one brand on EduNudg — website live, one or two centers, real inquiries in a pipeline you can see.",
    {
      x: 0.7,
      y: 2.7,
      w: 11.5,
      h: 1.1,
      fontSize: 16,
      fontFace: "Calibri",
      color: C.muted,
      margin: 0,
    },
  );

  card(s, 0.7, 4.1, 11.9, 2.0);
  s.addText(
    "If by the end of the trial you still need WhatsApp to know who enrolled — we haven’t earned your business.\nIf leads are owned, centers are consistent, and parents see a professional brand — you’ll wonder how you ran the network without it.",
    {
      x: 1.0,
      y: 4.4,
      w: 11.3,
      h: 1.4,
      fontSize: 15,
      fontFace: "Calibri",
      color: C.ink,
      margin: 0,
    },
  );

  footer(s, 12);
  notes(
    s,
    `CLOSE (~30 sec) — deliver slowly

"I’m not asking you to rip out everything tomorrow. I’m asking you to put one brand on EduNudg for a trial: your website live, one or two centers, real parent inquiries flowing into a pipeline you can see.

If by the end of the trial you still need WhatsApp to know who enrolled — we haven’t earned your business.
If leads are owned, centers are consistent, and parents see a professional brand — you’ll wonder how you ran the network without it.

Shall we set up your trial brand this week?"

Then STOP. Let them answer. Do not keep talking.

OBJECTION CHEAT SHEET (if they push back):
• “We already have a website.” → A brochure site doesn’t assign leads or keep curriculum consistent across centers.
• “WhatsApp works.” → Until the second location — then you become the bottleneck.
• “Franchisees won’t use software.” → They get a simple front desk: leads, students, fees — not a complex ERP.
• “We’re only one center.” → Perfect — build the brand system now so the second center copies the first.
• “Is this for students or for me?” → Both: you run the network; students get a branded learning portal after enrollment.

DO NOT PROMISE as live today: full parent portal, dedicated attendance module, or full AI copilot.`,
  );
}

await pptx.writeFile({ fileName: outPath });
console.log(`Wrote ${outPath}`);
