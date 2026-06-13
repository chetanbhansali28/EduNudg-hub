import { describe, expect, it } from "vitest";
import { isStudentProfileFormValid } from "./StudentProfileEditForm";

describe("isStudentProfileFormValid", () => {
  it("requires name, dob, phone, pincode, and photo", () => {
    expect(
      isStudentProfileFormValid({
        fullName: "Asha",
        dateOfBirth: "2015-06-01",
        phone: "9876543210",
        pincode: "560001",
        photoUrl: "https://cdn/photo.jpg",
      })
    ).toBe(true);

    expect(
      isStudentProfileFormValid({
        fullName: "A",
        dateOfBirth: "2015-06-01",
        phone: "9876543210",
        pincode: "560001",
        photoUrl: "https://cdn/photo.jpg",
      })
    ).toBe(false);

    expect(
      isStudentProfileFormValid({
        fullName: "Asha Kumar",
        dateOfBirth: "",
        phone: "9876543210",
        pincode: "560001",
        photoUrl: "https://cdn/photo.jpg",
      })
    ).toBe(false);

    expect(
      isStudentProfileFormValid({
        fullName: "Asha Kumar",
        dateOfBirth: "2015-06-01",
        phone: "",
        pincode: "560001",
        photoUrl: "https://cdn/photo.jpg",
      })
    ).toBe(false);

    expect(
      isStudentProfileFormValid({
        fullName: "Asha Kumar",
        dateOfBirth: "2015-06-01",
        phone: "9876543210",
        pincode: "",
        photoUrl: "https://cdn/photo.jpg",
      })
    ).toBe(false);

    expect(
      isStudentProfileFormValid({
        fullName: "Asha Kumar",
        dateOfBirth: "2015-06-01",
        phone: "9876543210",
        pincode: "560001",
        photoUrl: "",
      })
    ).toBe(false);
  });
});
