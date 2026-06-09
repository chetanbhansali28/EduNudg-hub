import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { mergeSparkAcademyLandingConfig } from "@/lib/brandLandingDefaults";
import { LeadModalProvider } from "@/features/marketing/abacus-classic/LeadModalContext";
import { SparkAcademyFooter } from "./SparkAcademyFooter";

describe("SparkAcademyFooter", () => {
  it("regression_renders_dark_footer_with_cta_contact_social_and_payments", () => {
    const config = mergeSparkAcademyLandingConfig("Digitley");
    render(
      <MemoryRouter>
        <LeadModalProvider>
          <SparkAcademyFooter config={config} />
        </LeadModalProvider>
      </MemoryRouter>
    );

    expect(document.querySelector(".sa-site-footer")).toBeDefined();
    expect(screen.getByText("(222) 545-4543")).toBeDefined();
    expect(screen.getByText("Start Your Learning Journey Today!")).toBeDefined();
    expect(screen.getByText(/Browse courses and unlock new skills/)).toBeDefined();
    expect(screen.getByPlaceholderText("Email Address")).toBeDefined();
    expect(screen.getByRole("link", { name: "Login" })).toBeDefined();
    expect(screen.getByText("Social Media")).toBeDefined();
    expect(screen.getByLabelText("Facebook")).toBeDefined();
    expect(screen.getByLabelText("Instagram")).toBeDefined();
    expect(screen.getByText("Digitley")).toBeDefined();
    expect(screen.getByRole("navigation", { name: "Footer" })).toBeDefined();
    expect(screen.getByText("Shop")).toBeDefined();
    expect(screen.getByText("Terms & Conditions")).toBeDefined();
    expect(screen.getByText("Privacy Policy")).toBeDefined();
    expect(screen.getByText(/Copyright ©/)).toBeDefined();
    expect(screen.getByLabelText("Accepted payment methods")).toBeDefined();
    expect(screen.getByText("Visa")).toBeDefined();
    expect(screen.getByText("Mastercard")).toBeDefined();
  });
});
