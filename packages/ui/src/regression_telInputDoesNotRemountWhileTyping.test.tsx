import { useState } from "react";
import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Input } from "./components";

function TelInputHarness({ initial = "" }: { initial?: string }) {
  const [value, setValue] = useState(initial);
  return <Input label="Phone" type="tel" value={value} onChange={setValue} />;
}

describe("Input type=tel typing", () => {
  it("regression_tel_input_does_not_remount_while_typing", () => {
    render(<TelInputHarness />);
    const input = screen.getByLabelText("Phone") as HTMLInputElement;
    input.focus();
    fireEvent.change(input, { target: { value: "9" } });
    fireEvent.change(input, { target: { value: "98" } });
    fireEvent.change(input, { target: { value: "+91 98" } });

    const sameInput = screen.getByLabelText("Phone") as HTMLInputElement;
    expect(sameInput).toBe(input);
    expect(sameInput.value).toBe("+91 98");
    expect(document.activeElement).toBe(input);
  });

  it("regression_tel_input_accepts_spaces_and_punctuation_while_typing", () => {
    render(<TelInputHarness />);
    const input = screen.getByLabelText("Phone") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "98765 43210" } });
    expect(input.value).toBe("98765 43210");
    fireEvent.change(input, { target: { value: "+91-98765-43210" } });
    expect(input.value).toBe("+91-98765-43210");
    expect(screen.queryByRole("link", { name: "Call +91-98765-43210" })).not.toBeNull();
  });
});
