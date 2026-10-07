"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { isApiError, type ApiError } from "@/lib/api/errors";
import { clientFrom } from "@/lib/session/api";
import {
  ACCESS_COOKIE,
  clearedSessionCookies,
  decodeWho,
  encodeWho,
  flashCookie,
  sessionCookieOptions,
  sessionCookies,
  WHO_COOKIE,
  type CookieToSet,
} from "@/lib/session/cookies";
import { safeNext } from "@/lib/session/rules";
import {
  changePasswordRequest,
  createAddress,
  deleteAddress,
  updateAddress,
  updateProfile,
} from "./api";
import {
  accountErrorMessage,
  apiFieldMessages,
  checkAddress,
  checkPasswordChange,
  checkProfile,
} from "./rules";

export interface AccountFormState {
  /** The message at the top of the form. */
  error: string | null;
  /** A message under each field that has a problem. */
  fields: Record<string, string>;
  /** What was typed (never a password), to fill the form in again. */
  values: Record<string, string>;
  /** Saved: the form says so. */
  saved?: boolean;
}

/** A problem shown at the top of the address book (codes only, never text from the address bar). */
export type AddressProblem = "gone" | "unavailable" | "failed";

const production = () => process.env.NODE_ENV === "production";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const text = (form: FormData, name: string, max = 300) =>
  String(form.get(name) ?? "").slice(0, max);

async function setCookies(list: CookieToSet[]) {
  const store = await cookies();
  for (const cookie of list) store.set(cookie.name, cookie.value, cookie.options);
}

async function token(): Promise<string | null> {
  return (await cookies()).get(ACCESS_COOKIE)?.value || null;
}

/** Signed out elsewhere (401) or suspended: this session is over. */
const sessionOver = (error: ApiError) => error.status === 401 || error.code === "ACCOUNT_SUSPENDED";

/** Ends this browser's session and asks the shopper to sign in again, coming back to `next`. */
async function endSession(next: string): Promise<never> {
  await setCookies(clearedSessionCookies(production()));
  redirect(`/sign-in?notice=ended&next=${encodeURIComponent(next)}`);
}

/** A failed API call as the form's state (or the end of the session). */
async function formFailure(
  error: unknown,
  values: Record<string, string>,
  next: string,
): Promise<AccountFormState> {
  if (!isApiError(error)) throw error;
  if (sessionOver(error)) return endSession(next);
  return {
    error: accountErrorMessage(error.status, error.code),
    fields: apiFieldMessages(error.fieldErrors),
    values,
  };
}

/** Profile: name and mobile. The header's name follows at once. */
export async function saveProfileAction(
  _previous: AccountFormState,
  form: FormData,
): Promise<AccountFormState> {
  const values = {
    firstName: text(form, "firstName", 120),
    lastName: text(form, "lastName", 120),
    phone: text(form, "phone", 30),
  };
  const checked = checkProfile(values);
  if ("fields" in checked)
    return { error: "Please check the details below.", fields: checked.fields, values };
  const accessToken = await token();
  if (!accessToken) return endSession("/account/profile");
  try {
    const profile = await updateProfile(accessToken, checked.input);
    const store = await cookies();
    const who = decodeWho(store.get(WHO_COOKIE)?.value);
    // The display name lives as long as a session can (7 days); signing out removes it.
    store.set(
      WHO_COOKIE,
      encodeWho({ firstName: profile.firstName, email: who?.email ?? profile.email }),
      sessionCookieOptions(7 * 24 * 3600, production()),
    );
    return { error: null, fields: {}, values, saved: true };
  } catch (error) {
    return formFailure(error, values, "/account/profile");
  }
}

const ADDRESS_FIELDS = [
  "labelChoice",
  "labelOther",
  "fullName",
  "phone",
  "line1",
  "line2",
  "landmark",
  "city",
  "state",
  "postalCode",
] as const;

/** Add an address (no `id`) or change one; then back to the address book. */
export async function saveAddressAction(
  _previous: AccountFormState,
  form: FormData,
): Promise<AccountFormState> {
  const id = text(form, "id", 40);
  const values: Record<string, string> = Object.fromEntries(
    ADDRESS_FIELDS.map((name) => [name, text(form, name)]),
  );
  const back = safeNext(text(form, "back", 300)) ?? "/account/addresses";
  if (id && !UUID.test(id)) redirect("/account/addresses?problem=gone");
  const checked = checkAddress({
    labelChoice: values.labelChoice,
    labelOther: values.labelOther,
    fullName: values.fullName,
    phone: values.phone,
    line1: values.line1,
    line2: values.line2,
    landmark: values.landmark,
    city: values.city,
    state: values.state,
    postalCode: values.postalCode,
    isDefault: form.get("isDefault") === "on",
  });
  if ("fields" in checked)
    return { error: "Please check the details below.", fields: checked.fields, values };
  const accessToken = await token();
  const here = id
    ? `/account/addresses/${id}`
    : (safeNext(text(form, "here", 300)) ?? "/account/addresses/new");
  if (!accessToken) return endSession(here);
  let savedId: string;
  try {
    savedId = id
      ? (await updateAddress(accessToken, id, checked.input)).id
      : (await createAddress(accessToken, checked.input)).id;
  } catch (error) {
    if (isApiError(error) && error.status === 404) redirect("/account/addresses?problem=gone");
    return formFailure(error, values, here);
  }
  // Checkout: back to it with the new address chosen (it shows there; no note needed).
  if (form.get("pick") === "1") {
    const url = new URL(back, "http://shop.local");
    url.searchParams.set("address", savedId);
    redirect(`${url.pathname}${url.search}`);
  }
  await setCookies([flashCookie(id ? "address-updated" : "address-added", production())]);
  redirect(back);
}

/** Make default / Delete, from the address book (plain forms: they work without JavaScript). */
async function changeAddress(form: FormData, change: "default" | "delete"): Promise<void> {
  const id = text(form, "id", 40);
  if (!UUID.test(id)) redirect("/account/addresses?problem=gone");
  const accessToken = await token();
  if (!accessToken) return endSession("/account/addresses");
  let problem: AddressProblem | null = null;
  try {
    if (change === "delete") await deleteAddress(accessToken, id);
    else await updateAddress(accessToken, id, { isDefault: true });
  } catch (error) {
    if (!isApiError(error)) throw error;
    if (sessionOver(error)) return endSession("/account/addresses");
    problem =
      error.status === 404
        ? "gone"
        : error.status === 0 || error.status >= 500
          ? "unavailable"
          : "failed";
  }
  if (problem) redirect(`/account/addresses?problem=${problem}`);
  await setCookies([
    flashCookie(change === "delete" ? "address-deleted" : "address-default", production()),
  ]);
  redirect("/account/addresses");
}

export async function deleteAddressAction(form: FormData): Promise<void> {
  return changeAddress(form, "delete");
}

export async function makeDefaultAddressAction(form: FormData): Promise<void> {
  return changeAddress(form, "default");
}

/**
 * Changes the password. The API signs out every other device and returns a
 * fresh session for this one, which replaces this browser's cookies.
 */
export async function changePasswordAction(
  _previous: AccountFormState,
  form: FormData,
): Promise<AccountFormState> {
  const currentPassword = String(form.get("currentPassword") ?? "").slice(0, 1024);
  const newPassword = String(form.get("newPassword") ?? "").slice(0, 1024);
  const confirmPassword = String(form.get("confirmPassword") ?? "").slice(0, 1024);
  const fields = checkPasswordChange({ currentPassword, newPassword, confirmPassword });
  if (Object.keys(fields).length > 0)
    return { error: "Please check the details below.", fields, values: {} };
  const accessToken = await token();
  if (!accessToken) return endSession("/account/security");
  try {
    const tokens = await changePasswordRequest(
      accessToken,
      currentPassword,
      newPassword,
      clientFrom(await headers()),
    );
    await setCookies([
      ...sessionCookies(tokens, production(), Date.now()),
      flashCookie("password-changed", production()),
    ]);
  } catch (error) {
    if (isApiError(error) && error.code === "INVALID_CURRENT_PASSWORD")
      return {
        error: accountErrorMessage(error.status, error.code),
        fields: { currentPassword: "Your current password is incorrect." },
        values: {},
      };
    return formFailure(error, {}, "/account/security");
  }
  redirect("/account/security");
}
