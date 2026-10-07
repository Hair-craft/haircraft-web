import { describe, expect, it } from "vitest";
import {
  accountErrorMessage,
  addressLines,
  apiFieldMessages,
  checkAddress,
  checkPasswordChange,
  checkProfile,
  INDIAN_STATES,
  labelChoice,
  labelFrom,
  localMobile,
  MAX_ADDRESSES,
  pinCode,
  type Address,
  type AddressFormValues,
} from "@/lib/account/rules";

const form = (overrides: Partial<AddressFormValues> = {}): AddressFormValues => ({
  labelChoice: "Home",
  labelOther: "",
  fullName: " Meera  Iyer ",
  phone: "98123 45678",
  line1: "Flat 12B, Sea View",
  line2: "",
  landmark: "",
  city: "Mumbai",
  state: "Maharashtra",
  postalCode: "400 050",
  isDefault: false,
  ...overrides,
});

describe("the states list", () => {
  it("has India's 28 states and 8 union territories, as the API spells them", () => {
    expect(INDIAN_STATES).toHaveLength(36);
    expect(new Set(INDIAN_STATES).size).toBe(36);
    expect(INDIAN_STATES).toContain("Dadra and Nagar Haveli and Daman and Diu");
    expect(INDIAN_STATES).toContain("Delhi");
    expect(INDIAN_STATES).toContain("Puducherry");
  });
});

describe("the address form", () => {
  it("tidies a good address into what the API takes", () => {
    const result = checkAddress(form());
    expect(result).toEqual({
      input: {
        label: "Home",
        fullName: "Meera Iyer",
        phone: "+919812345678",
        line1: "Flat 12B, Sea View",
        line2: null,
        landmark: null,
        city: "Mumbai",
        state: "Maharashtra",
        postalCode: "400050",
      },
    });
  });

  it("asks for the default only when ticked", () => {
    const result = checkAddress(form({ isDefault: true }));
    expect("input" in result && result.input.isDefault).toBe(true);
  });

  it("names every problem in the shop's words", () => {
    const result = checkAddress(
      form({
        fullName: " ",
        phone: "12345",
        line1: "",
        city: "",
        state: "Atlantis",
        postalCode: "012345",
        labelChoice: "Other",
        labelOther: "x".repeat(31),
      }),
    );
    expect("fields" in result && Object.keys(result.fields).sort()).toEqual(
      ["city", "fullName", "labelOther", "line1", "phone", "postalCode", "state"].sort(),
    );
    expect("fields" in result && result.fields.postalCode).toBe(
      "Enter a 6-digit PIN code, e.g. 400001.",
    );
  });
});

describe("labels", () => {
  it("keeps Home and Work, takes Other's text, and nothing when none is chosen", () => {
    expect(labelFrom("Home", "ignored")).toBe("Home");
    expect(labelFrom("Other", "  Mum's   place ")).toBe("Mum's place");
    expect(labelFrom("Other", "  ")).toBeNull();
    expect(labelFrom("", "")).toBeNull();
    expect(labelFrom("Anything", "x")).toBeNull();
  });

  it("fills the form in again from a saved label", () => {
    expect(labelChoice("Work")).toEqual({ choice: "Work", other: "" });
    expect(labelChoice("Studio")).toEqual({ choice: "Other", other: "Studio" });
    expect(labelChoice(null)).toEqual({ choice: "", other: "" });
  });
});

describe("PIN codes and mobiles", () => {
  it("accepts six digits not starting with 0", () => {
    expect(pinCode("400 050")).toBe("400050");
    expect(pinCode("040005")).toBeNull();
    expect(pinCode("40005")).toBeNull();
  });

  it("shows +91 mobiles the local way", () => {
    expect(localMobile("+919812345678")).toBe("98123 45678");
    expect(localMobile("+14155550123")).toBe("+14155550123");
    expect(localMobile(null)).toBe("");
  });
});

describe("the profile form", () => {
  it("allows an empty last name and mobile", () => {
    expect(checkProfile({ firstName: " Priya ", lastName: "", phone: "" })).toEqual({
      input: { firstName: "Priya", lastName: null, phone: null },
    });
  });

  it("needs a first name and a real mobile", () => {
    const result = checkProfile({ firstName: "", lastName: "", phone: "123" });
    expect("fields" in result && Object.keys(result.fields)).toEqual(["firstName", "phone"]);
  });
});

describe("the password form", () => {
  it("passes a strong, confirmed, different password", () => {
    expect(
      checkPasswordChange({
        currentPassword: "Silky2026!",
        newPassword: "Wavy2027!",
        confirmPassword: "Wavy2027!",
      }),
    ).toEqual({});
  });

  it("refuses a weak, unchanged or unconfirmed one", () => {
    expect(
      checkPasswordChange({ currentPassword: "", newPassword: "short", confirmPassword: "short" }),
    ).toEqual({
      currentPassword: "Enter your current password.",
      newPassword: expect.any(String),
    });
    expect(
      checkPasswordChange({
        currentPassword: "Silky2026!",
        newPassword: "Silky2026!",
        confirmPassword: "Silky2026!",
      }).newPassword,
    ).toBe("Choose a password different from your current one.");
    expect(
      checkPasswordChange({
        currentPassword: "Silky2026!",
        newPassword: "Wavy2027!",
        confirmPassword: "Wavy2027",
      }).confirmPassword,
    ).toBe("The passwords don't match.");
  });
});

describe("the API's messages", () => {
  it("rewords field errors for the form", () => {
    expect(
      apiFieldMessages([
        { field: "postalCode", messages: ["postalCode must be a 6-digit PIN code, e.g. 400001"] },
        { field: "newPassword", messages: ["newPassword must not be the same as your email"] },
      ]),
    ).toEqual({
      postalCode: "Enter a 6-digit PIN code, e.g. 400001.",
      newPassword: "Must not be the same as your email.",
    });
  });

  it("explains the address limit, a wrong password and an unreachable shop", () => {
    expect(accountErrorMessage(422, "ADDRESS_LIMIT_REACHED")).toContain(String(MAX_ADDRESSES));
    expect(accountErrorMessage(400, "INVALID_CURRENT_PASSWORD")).toBe(
      "Your current password is incorrect.",
    );
    expect(accountErrorMessage(0, "NETWORK_ERROR")).toMatch(/can't reach the shop/);
    expect(accountErrorMessage(429, "TOO_MANY_REQUESTS")).toMatch(/wait a minute/);
  });
});

describe("an address card", () => {
  it("shows only the lines that are filled in", () => {
    const address = {
      line1: "Flat 12B",
      line2: null,
      landmark: "the library",
      city: "Mumbai",
      state: "Maharashtra",
      postalCode: "400050",
    } as Address;
    expect(addressLines(address)).toEqual([
      "Flat 12B",
      "Near the library",
      "Mumbai, Maharashtra 400050",
    ]);
  });
});
