/**
 * Account rules that need no server or browser, so they are unit-tested:
 * the address form's checks (the API checks again), labels and messages.
 */
import type { FieldError } from "@/lib/api/types";
import { indianMobile, passwordProblem } from "@/lib/session/rules";

/**
 * India's 28 states and 8 union territories, exactly as the API accepts
 * them (backend `addresses/indian-states.ts`; the API has no endpoint for
 * the list, so a unit test pins it).
 */
export const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
] as const;

/** The API's limit (backend `addresses.service.ts`). */
export const MAX_ADDRESSES = 20;

/** A saved address, as the API returns it. */
export interface Address {
  id: string;
  label: string | null;
  fullName: string;
  phone: string;
  line1: string;
  line2: string | null;
  landmark: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

/** What the address form sends to the API. */
export interface AddressInput {
  label: string | null;
  fullName: string;
  phone: string;
  line1: string;
  line2: string | null;
  landmark: string | null;
  city: string;
  state: string;
  postalCode: string;
  isDefault?: true;
}

/** The label's quick choices; "Other" takes a typed label. */
export const LABEL_CHOICES = ["Home", "Work", "Other"] as const;
export type LabelChoice = (typeof LABEL_CHOICES)[number];

/** The label to save: Home or Work as is, Other's typed text (or none). */
export function labelFrom(choice: string, other: string): string | null {
  if (choice === "Home" || choice === "Work") return choice;
  if (choice === "Other") return other.trim().replace(/\s+/g, " ").slice(0, 30) || null;
  return null;
}

/** The form's choice for a saved label (anything but Home and Work is "Other"). */
export function labelChoice(label: string | null): { choice: LabelChoice | ""; other: string } {
  if (label === "Home" || label === "Work") return { choice: label, other: "" };
  return label ? { choice: "Other", other: label } : { choice: "", other: "" };
}

/** A 6-digit PIN code (spaces allowed while typing), or null if it isn't one. */
export function pinCode(raw: string): string | null {
  const digits = raw.replace(/\s/g, "");
  return /^[1-9]\d{5}$/.test(digits) ? digits : null;
}

/** "+919812345678" → "98123 45678", for showing and for filling a form in again. */
export function localMobile(phone: string | null): string {
  const match = phone ? /^\+91(\d{5})(\d{5})$/.exec(phone) : null;
  return match ? `${match[1]} ${match[2]}` : (phone ?? "");
}

export interface AddressFormValues {
  labelChoice: string;
  labelOther: string;
  fullName: string;
  phone: string;
  line1: string;
  line2: string;
  landmark: string;
  city: string;
  state: string;
  postalCode: string;
  isDefault: boolean;
}

const tidy = (value: string) => value.trim().replace(/\s+/g, " ");
const optional = (value: string) => tidy(value) || null;

/**
 * The address form's checks, in the shop's words (the same rules as the
 * API). Returns the problems by field, or the input to send.
 */
export function checkAddress(
  values: AddressFormValues,
): { fields: Record<string, string> } | { input: AddressInput } {
  const fields: Record<string, string> = {};
  const phone = indianMobile(values.phone);
  const postalCode = pinCode(values.postalCode);
  if (!tidy(values.fullName)) fields.fullName = "Enter the name of the person receiving the order.";
  else if (tidy(values.fullName).length > 100) fields.fullName = "Use at most 100 characters.";
  if (!phone) fields.phone = "Enter a 10-digit Indian mobile number, e.g. 98765 43210.";
  if (!tidy(values.line1)) fields.line1 = "Enter the flat, house or building and street.";
  else if (tidy(values.line1).length > 200) fields.line1 = "Use at most 200 characters.";
  if (tidy(values.line2).length > 200) fields.line2 = "Use at most 200 characters.";
  if (tidy(values.landmark).length > 100) fields.landmark = "Use at most 100 characters.";
  if (!tidy(values.city)) fields.city = "Enter the town or city.";
  else if (tidy(values.city).length > 100) fields.city = "Use at most 100 characters.";
  if (!(INDIAN_STATES as readonly string[]).includes(values.state))
    fields.state = "Choose a state or union territory.";
  if (!postalCode) fields.postalCode = "Enter a 6-digit PIN code, e.g. 400001.";
  if (values.labelChoice === "Other" && tidy(values.labelOther).length > 30)
    fields.labelOther = "Use at most 30 characters.";
  if (Object.keys(fields).length > 0) return { fields };
  return {
    input: {
      label: labelFrom(values.labelChoice, values.labelOther),
      fullName: tidy(values.fullName),
      phone: phone!,
      line1: tidy(values.line1),
      line2: optional(values.line2),
      landmark: optional(values.landmark),
      city: tidy(values.city),
      state: values.state,
      postalCode: postalCode!,
      ...(values.isDefault ? { isDefault: true as const } : {}),
    },
  };
}

/** The profile form's checks. */
export function checkProfile(values: {
  firstName: string;
  lastName: string;
  phone: string;
}):
  | { fields: Record<string, string> }
  | { input: { firstName: string; lastName: string | null; phone: string | null } } {
  const fields: Record<string, string> = {};
  const phone = indianMobile(values.phone);
  if (!tidy(values.firstName)) fields.firstName = "Enter your first name.";
  else if (tidy(values.firstName).length > 100) fields.firstName = "Use at most 100 characters.";
  if (tidy(values.lastName).length > 100) fields.lastName = "Use at most 100 characters.";
  if (phone === undefined)
    fields.phone = "Enter a 10-digit Indian mobile number, or leave it empty.";
  if (Object.keys(fields).length > 0) return { fields };
  return {
    input: {
      firstName: tidy(values.firstName),
      lastName: optional(values.lastName),
      phone: phone ?? null,
    },
  };
}

/** The password form's checks (the API checks the current password). */
export function checkPasswordChange(values: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}): Record<string, string> {
  const fields: Record<string, string> = {};
  if (!values.currentPassword) fields.currentPassword = "Enter your current password.";
  const problem = passwordProblem(values.newPassword);
  if (problem) fields.newPassword = problem;
  else if (values.newPassword === values.currentPassword)
    fields.newPassword = "Choose a password different from your current one.";
  if (!fields.newPassword && values.confirmPassword !== values.newPassword)
    fields.confirmPassword = "The passwords don't match.";
  return fields;
}

/** Field messages the API might send, in the shop's words. */
const FIELD_MESSAGES: Record<string, string> = {
  phone: "Enter a 10-digit Indian mobile number, e.g. 98765 43210.",
  postalCode: "Enter a 6-digit PIN code, e.g. 400001.",
  state: "Choose a state or union territory.",
};

/** The API's field errors as messages under the form's fields. */
export function apiFieldMessages(errors: FieldError[]): Record<string, string> {
  return Object.fromEntries(
    errors.map(({ field, messages }) => {
      if (FIELD_MESSAGES[field]) return [field, FIELD_MESSAGES[field]];
      const message = messages[0] ?? "Please check this.";
      // "newPassword must be different …" → "Must be different …."
      const text = message.startsWith(`${field} `) ? message.slice(field.length + 1) : message;
      const sentence = text.charAt(0).toUpperCase() + text.slice(1);
      return [field, /[.!?]$/.test(sentence) ? sentence : `${sentence}.`];
    }),
  );
}

/** The API's refusals for account changes, in the shop's words. */
export function accountErrorMessage(status: number, code: string): string {
  switch (code) {
    case "ADDRESS_LIMIT_REACHED":
      return `You can save up to ${MAX_ADDRESSES} addresses. Delete one you no longer use first.`;
    case "INVALID_CURRENT_PASSWORD":
      return "Your current password is incorrect.";
    case "VALIDATION_FAILED":
      return "Please check the details below.";
    case "TOO_MANY_REQUESTS":
      return "Too many attempts. Please wait a minute and try again.";
  }
  if (status === 404) return "That address no longer exists. It may have been deleted elsewhere.";
  if (status === 429) return "Too many attempts. Please wait a minute and try again.";
  if (status === 0 || status >= 500)
    return "We can't reach the shop at the moment. Please try again in a minute.";
  return "That didn't work. Please try again.";
}

/** One line for an address card: "Flat 12B, Sea View, Bandra West, Mumbai, Maharashtra 400050". */
export function addressLines(address: Address): string[] {
  return [
    address.line1,
    address.line2,
    address.landmark ? `Near ${address.landmark}` : null,
    `${address.city}, ${address.state} ${address.postalCode}`,
  ].filter((line): line is string => Boolean(line));
}
