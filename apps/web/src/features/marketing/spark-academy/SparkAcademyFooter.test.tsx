import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { mergeSparkAcademyLandingConfig } from "@/lib/brandLandingDefaults";
import { SparkAcademyFooter } from "./SparkAcademyFooter";

describe("SparkAcademyFooter", () => {
  it("regression_spark_footer_is_column_layout_without_newsletter", () => {
    const config = mergeSparkAcademyLandingConfig("Digitley");
    render(
      <MemoryRouter>
        <SparkAcademyFooter
          config={config}
          socialConnect={{
            facebookUrl: "https://facebook.com/brand",
            instagramUrl: "https://instagram.com/brand",
          }}
        />
      </MemoryRouter>
    );

    expect(document.querySelector(".sa-site-footer")).toBeDefined();
    expect(document.querySelector(".sa-site-footer__grid")).toBeDefined();
    expect(screen.getByText("Digitley")).toBeDefined();
    expect(screen.getByText(/structured learning programs/i)).toBeDefined();
    expect(screen.getByRole("heading", { name: "Explore" })).toBeDefined();
    expect(screen.getByText("Shop")).toBeDefined();
    expect(screen.getByRole("heading", { name: "Contact" })).toBeDefined();
    expect(screen.getByText("(222) 545-4543")).toBeDefined();
    expect(screen.getByText("Head office address")).toBeDefined();
    expect(screen.getByText("Our presence")).toBeDefined();
    expect(screen.getByLabelText("Facebook")).toBeDefined();
    expect(screen.getByLabelText("Instagram")).toBeDefined();
    expect(screen.getByText(/Copyright ©/)).toBeDefined();
    expect(screen.queryByText("Start Your Learning Journey Today!")).toBeNull();
    expect(screen.queryByPlaceholderText("Email Address")).toBeNull();
    expect(screen.queryByRole("link", { name: "Login" })).toBeNull();
    expect(screen.queryByText("Social Media")).toBeNull();
    expect(screen.queryByLabelText("Accepted payment methods")).toBeNull();
    expect(screen.queryByText("Visa")).toBeNull();
    expect(screen.queryByText("Mastercard")).toBeNull();
  });

  it("regression_spark_footer_hides_novu_newsletter_cta", () => {
    const config = mergeSparkAcademyLandingConfig("Digitley", {
      footerCta: {
        title: "Start your network differently.",
        subtitle: "Join our newsletter for franchise updates.",
        ctaLabel: "Login",
        ctaHref: "enroll",
      },
    });
    render(
      <MemoryRouter>
        <SparkAcademyFooter config={config} />
      </MemoryRouter>
    );

    expect(screen.queryByText("Start your network differently.")).toBeNull();
    expect(screen.queryByText(/Join our newsletter/i)).toBeNull();
    expect(screen.queryByPlaceholderText("Email Address")).toBeNull();
    expect(screen.getByRole("heading", { name: "Explore" })).toBeDefined();
  });

  it("regression_center_footer_uses_franchise_phone_not_placeholder", () => {
    const config = mergeSparkAcademyLandingConfig("Digitley");
    render(
      <MemoryRouter>
        <SparkAcademyFooter
          config={config}
          centerContact={{
            addressLines: ["12 Main Road"],
            phone: "+918806232153",
          }}
        />
      </MemoryRouter>
    );

    expect(screen.getByText("+918806232153")).toBeDefined();
    expect(screen.getByText("12 Main Road")).toBeDefined();
    expect(screen.queryByText("(222) 545-4543")).toBeNull();
    expect(screen.queryByText("Our presence")).toBeNull();
    expect(screen.queryByText("Head office address")).toBeNull();
  });
});
