import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { BrandWhatsAppFloat } from "./BrandWhatsAppFloat";

describe("BrandWhatsAppFloat", () => {
  it("regression_renders_bubble_and_opens_whatsapp_with_prefill", () => {
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    render(
      <BrandWhatsAppFloat
        socialConnect={{
          whatsappPhoneE164: "+919021924968",
          whatsappPrefillMessage: "Hello from the website",
          whatsappBubbleTitle: "Neha Patil (Mentor)",
          whatsappBubbleBody: "Let's coordinate a demo!",
          whatsappEnabled: true,
        }}
      />
    );

    expect(screen.getByText("Neha Patil (Mentor)")).toBeDefined();
    expect(screen.getByText("Let's coordinate a demo!")).toBeDefined();

    const link = screen.getByRole("link", { name: "Chat on WhatsApp" });
    expect(link.getAttribute("href")).toBe(
      "https://wa.me/919021924968?text=Hello%20from%20the%20website"
    );

    fireEvent.click(screen.getByRole("button", { name: "Dismiss chat preview" }));
    expect(screen.queryByText("Neha Patil (Mentor)")).toBeNull();

    openSpy.mockRestore();
  });
});
