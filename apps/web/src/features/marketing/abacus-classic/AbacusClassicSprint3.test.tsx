import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { mergeAbacusClassicLandingConfig } from "@/lib/brandLandingDefaults";
import { setSectionEnabled } from "@/lib/homepageSections";
import type { HomepageConfig } from "@/types/homepage";
import { FoundersSection } from "./FoundersSection";
import { TrustMediaSection } from "./TrustMediaSection";
import { GalleryMarqueeSection } from "./GalleryMarqueeSection";
import { AbacusClassicFooter } from "./AbacusClassicFooter";
import { AbacusClassicContent } from "./AbacusClassicContent";
import { LeadModalProvider } from "./LeadModalContext";

function sprint3Config(): HomepageConfig {
  const base = mergeAbacusClassicLandingConfig("Smart Brain Abacus");
  return {
    ...base,
    gallery: {
      title: "Moments from our journey",
      images: [
        { url: "https://example.com/event-a.jpg", alt: "Annual day" },
        { url: "https://example.com/event-b.jpg", alt: "Competition" },
      ],
    },
    founders: [
      {
        roleBadge: "FOUNDER & CEO",
        name: "Jane Doe",
        title: "Smart Brain Abacus Education Pvt. Ltd.",
        bio: "Leading abacus education across Maharashtra.",
        photoUrl: "https://example.com/jane.jpg",
        statBadge: { value: "12+", label: "YEARS OF LEGACY" },
      },
      {
        roleBadge: "CO-FOUNDER",
        name: "John Smith",
        title: "Smart Brain Abacus Education Pvt. Ltd.",
        bio: "Operations and franchise growth.",
        photoUrl: "",
      },
    ],
    trustMedia: {
      eyebrow: "MEDIA RECOGNITION",
      title: "Why families trust",
      titleHighlight: "Smart Brain Abacus",
      intro: "Holistic cognitive development with certified instructors.",
      youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      cards: [
        { title: "50,000+ students trained", subtitle: "Growing network.", accentColor: "#2563eb" },
        { title: "Lightning fast calculations", subtitle: "Mental math in seconds.", accentColor: "#eab308" },
      ],
      ctaLabel: "Watch our story",
      ctaHref: "#trust",
    },
    footer: {
      ...base.footer,
      rich: {
        ...base.footer.rich!,
        description: "Premier abacus and Vedic maths institute.",
        badges: [{ label: "ISO 9001:2015 Certified" }],
        customStats: [{ value: "100+", label: "Awards" }],
        showLiveStats: true,
        presence: [{ region: "Maharashtra & Goa", cities: ["Pune", "Satara"] }],
        headOffice: {
          address: "123 Main Road, Pune",
          phone: "+91 98765 43210",
          website: "www.smartbrainabacus.com",
        },
        socialLinks: [{ platform: "Facebook", url: "https://facebook.com/example" }],
      },
    },
  };
}

describe("Abacus Classic Sprint 3 — founders", () => {
  it("returns null when founders list is empty", () => {
    const { container } = render(<FoundersSection founders={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders multiple founder profiles with stat badge and photo placeholder", () => {
    render(<FoundersSection founders={sprint3Config().founders!} />);

    expect(screen.getByRole("heading", { level: 2, name: "Jane Doe" })).toBeDefined();
    expect(screen.getByRole("heading", { level: 2, name: "John Smith" })).toBeDefined();
    expect(screen.getByText("12+")).toBeDefined();
    expect(screen.getByText("YEARS OF LEGACY")).toBeDefined();
    expect(screen.getByRole("img", { name: "Jane Doe" })).toBeDefined();
    expect(document.querySelector(".ac-founders__photo--placeholder")).toBeDefined();
  });
});

describe("Abacus Classic Sprint 3 — trust and video", () => {
  it("renders YouTube iframe when URL is valid", () => {
    render(<TrustMediaSection trust={sprint3Config().trustMedia!} />);

    const iframe = document.querySelector("iframe");
    expect(iframe?.getAttribute("src")).toBe("https://www.youtube.com/embed/dQw4w9WgXcQ");
    expect(screen.getByText("MEDIA RECOGNITION")).toBeDefined();
    expect(screen.getByText("Smart Brain Abacus")).toBeDefined();
    expect(screen.getByRole("heading", { level: 3, name: "50,000+ students trained" })).toBeDefined();
    expect(screen.getByRole("link", { name: "Watch our story" })).toBeDefined();
  });

  it("shows placeholder when YouTube URL is missing", () => {
    const trust = { ...sprint3Config().trustMedia!, youtubeUrl: "" };
    render(<TrustMediaSection trust={trust} />);

    expect(document.querySelector("iframe")).toBeNull();
    expect(screen.getByText(/Add a YouTube link/i)).toBeDefined();
  });
});

describe("Abacus Classic Sprint 3 — photo gallery", () => {
  it("returns null when gallery has no images", () => {
    const { container } = render(
      <GalleryMarqueeSection gallery={{ title: "Gallery", images: [] }} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("duplicates images for marquee loop", () => {
    render(<GalleryMarqueeSection gallery={sprint3Config().gallery!} />);

    expect(screen.getByRole("heading", { level: 2, name: "Moments from our journey" })).toBeDefined();
    expect(screen.getAllByRole("img", { name: "Annual day" })).toHaveLength(2);
    expect(screen.getAllByRole("img", { name: "Competition" })).toHaveLength(2);
  });
});

describe("Abacus Classic Sprint 3 — rich footer", () => {
  it("renders live DB stats, custom stats, presence, and head office", () => {
    render(
      <MemoryRouter>
        <AbacusClassicFooter
          config={sprint3Config()}
          publicStats={{ centersCount: 12, studentsCount: 5200 }}
        />
      </MemoryRouter>
    );

    expect(screen.getByText("12+")).toBeDefined();
    expect(screen.getByText("Franchises")).toBeDefined();
    expect(screen.getByText("5k+")).toBeDefined();
    expect(screen.getByText("Students")).toBeDefined();
    expect(screen.getByText("100+")).toBeDefined();
    expect(screen.getByText("Awards")).toBeDefined();
    expect(screen.getByText("ISO 9001:2015 Certified")).toBeDefined();
    expect(screen.getByText("Maharashtra & Goa")).toBeDefined();
    expect(screen.getByText("Pune, Satara")).toBeDefined();
    expect(screen.getByText("123 Main Road, Pune")).toBeDefined();
    expect(screen.getByRole("link", { name: "Facebook" })).toBeDefined();
  });

  it("hides live stats when showLiveStats is false but keeps custom stats", () => {
    const config = sprint3Config();
    config.footer.rich = { ...config.footer.rich!, showLiveStats: false };

    render(
      <MemoryRouter>
        <AbacusClassicFooter config={config} publicStats={{ centersCount: 12, studentsCount: 5200 }} />
      </MemoryRouter>
    );

    expect(screen.queryByText("Franchises")).toBeNull();
    expect(screen.queryByText("Students")).toBeNull();
    expect(screen.getByText("100+")).toBeDefined();
    expect(screen.getByText("Awards")).toBeDefined();
  });
});

describe("Abacus Classic Sprint 3 — content section order and toggles", () => {
  it("renders founders, trust, and gallery in document order", () => {
    render(
      <LeadModalProvider>
        <AbacusClassicContent config={sprint3Config()} publicCurriculum={[]} />
      </LeadModalProvider>
    );

    const main = screen.getByRole("main");
    const sectionIds = Array.from(main.querySelectorAll("section[id]")).map((el) => el.id);

    expect(sectionIds.indexOf("founders")).toBeLessThan(sectionIds.indexOf("trust"));
    expect(sectionIds.indexOf("trust")).toBeLessThan(sectionIds.indexOf("faq"));
    expect(sectionIds.indexOf("faq")).toBeLessThan(sectionIds.indexOf("gallery"));
  });

  it("hides founders section when disabled in editor toggles", () => {
    let config = sprint3Config();
    config = setSectionEnabled(config, "founders", false);

    render(
      <LeadModalProvider>
        <AbacusClassicContent config={config} publicCurriculum={[]} />
      </LeadModalProvider>
    );

    expect(document.querySelector("#founders")).toBeNull();
    expect(document.querySelector("#trust")).toBeDefined();
  });
});
