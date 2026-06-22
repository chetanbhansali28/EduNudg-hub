import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Input, PhoneLink, ShippingAddressPreview, ThemeProvider } from "@edunudg/ui";

describe("PhoneLink theme", () => {
  it("renders a tel link for phone numbers", () => {
    render(<PhoneLink phone="+91 98765 43210" />);
    const link = screen.getByRole("link", { name: "+91 98765 43210" });
    expect(link.getAttribute("href")).toBe("tel:+919876543210");
  });

  it("renders phone as a dial link inside shipping address preview", () => {
    render(
      <ShippingAddressPreview
        prefix="Shipping preview: "
        address={{
          name: "Koramangala Center",
          phone: "+91 98765 43210",
          addressLine1: "12 Main Road",
          city: "Bengaluru",
          pincode: "560034",
        }}
      />
    );

    expect(screen.getByText(/Shipping preview:/)).toBeDefined();
    const link = screen.getByRole("link", { name: "+91 98765 43210" });
    expect(link.getAttribute("href")).toBe("tel:+919876543210");
  });
});

describe("Input phone dial", () => {
  it("regression_renders_dial_link_for_tel_inputs", () => {
    render(
      <ThemeProvider>
        <Input label="Phone" type="tel" value="+91 98765 43210" onChange={() => undefined} />
      </ThemeProvider>
    );

    expect(screen.getByLabelText("Phone").getAttribute("type")).toBe("tel");
    expect(screen.getByRole("link", { name: "Call +91 98765 43210" }).getAttribute("href")).toBe(
      "tel:+919876543210"
    );
  });
});
