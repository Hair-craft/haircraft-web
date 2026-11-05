"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { isApiError } from "@/lib/api/errors";
import { forgetCart } from "@/lib/cart/server";
import { forgetWishlist } from "@/lib/wishlist/server";
import type { FieldError } from "@/lib/api/types";
import {
  clientFrom,
  registerRequest,
  signInRequest,
  signOutEverywhereRequest,
  signOutRequest,
} from "./api";
import { ACCESS_COOKIE, clearedSessionCookies, flashCookie, REFRESH_COOKIE } from "./cookies";
import { afterSignIn, setCookies, smsCodesOn, startSession } from "./start";
import {
  authErrorMessage,
  DEFAULT_AFTER_SIGN_IN,
  indianMobile,
  passwordProblem,
  safeNext,
} from "./rules";

export interface AuthFormState {
  /** The message at the top of the form. */
  error: string | null;
  /** A message under each field that has a problem. */
  fields: Record<string, string>;
  /** What was typed (never the password), to fill the form in again. */
  values: Record<string, string>;
  /** The email is already registered: offer "Sign in instead". */
  emailTaken?: boolean;
}

const production = () => process.env.NODE_ENV === "production";
const text = (form: FormData, name: string, max = 254) =>
  String(form.get(name) ?? "")
    .trim()
    .slice(0, max);
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** The API's field errors in plain sentences ("password must contain …" → "Password must contain …."). */
function fieldMessages(errors: FieldError[]): Record<string, string> {
  return Object.fromEntries(
    errors.map(({ field, messages }) => {
      const message = messages[0] ?? "Please check this.";
      const sentence = message.charAt(0).toUpperCase() + message.slice(1);
      return [field, /[.!?]$/.test(sentence) ? sentence : `${sentence}.`];
    }),
  );
}

export async function signInAction(
  _previous: AuthFormState,
  form: FormData,
): Promise<AuthFormState> {
  // The email or the phone number (owner, 2026-11-04).
  const login = text(form, "login");
  const password = String(form.get("password") ?? "").slice(0, 1024);
  const next = safeNext(text(form, "next", 512)) ?? DEFAULT_AFTER_SIGN_IN;
  const values = { login };

  const fields: Record<string, string> = {};
  if (login.includes("@") ? !EMAIL.test(login) : !indianMobile(login))
    fields.login = "Enter your email address or 10-digit mobile number.";
  if (!password) fields.password = "Enter your password.";
  if (Object.keys(fields).length > 0)
    return { error: "Please check the details below.", fields, values };

  let destination: string;
  try {
    const tokens = await signInRequest(login, password, clientFrom(await headers()));
    await startSession(tokens);
    destination = await afterSignIn(tokens, next);
  } catch (error) {
    if (!isApiError(error)) throw error;
    return {
      error: authErrorMessage(error.status, error.code, error.message),
      fields: error.code === "VALIDATION_FAILED" ? fieldMessages(error.fieldErrors) : {},
      values,
    };
  }
  redirect(destination);
}

export async function registerAction(
  _previous: AuthFormState,
  form: FormData,
): Promise<AuthFormState> {
  const firstName = text(form, "firstName", 100);
  const lastName = text(form, "lastName", 100);
  const email = text(form, "email");
  const phoneText = text(form, "phone", 30);
  const phoneToken = text(form, "phoneToken", 2000);
  const password = String(form.get("password") ?? "").slice(0, 1024);
  const next = safeNext(text(form, "next", 512)) ?? DEFAULT_AFTER_SIGN_IN;
  const values = { firstName, lastName, email, phone: phoneText };

  const fields: Record<string, string> = {};
  if (!firstName) fields.firstName = "Enter your first name.";
  if (!EMAIL.test(email)) fields.email = "Enter a valid email address.";
  // Required (owner, 2026-11-04), and verified first while SMS codes are on.
  const phone = indianMobile(phoneText);
  if (!phone) fields.phone = "Enter your 10-digit mobile number.";
  else if (!phoneToken && (await smsCodesOn()))
    fields.phone = "Verify your mobile number with the code we send you.";
  const problem = passwordProblem(password);
  if (problem) fields.password = problem;
  if (Object.keys(fields).length > 0)
    return { error: "Please check the details below.", fields, values };

  let destination: string;
  try {
    const tokens = await registerRequest(
      {
        email,
        password,
        firstName,
        ...(lastName ? { lastName } : {}),
        phone: phone as string,
        ...(phoneToken ? { phoneToken } : {}),
      },
      clientFrom(await headers()),
    );
    await startSession(tokens);
    destination = await afterSignIn(tokens, next);
  } catch (error) {
    if (!isApiError(error)) throw error;
    const taken = error.code === "EMAIL_ALREADY_REGISTERED";
    return {
      error: authErrorMessage(error.status, error.code, error.message),
      fields: taken
        ? { email: "An account with this email already exists." }
        : fieldMessages(error.fieldErrors),
      values,
      emailTaken: taken,
    };
  }
  redirect(destination);
}

/** Signs out of this device: the API ends the session; the cookies go. */
export async function signOutAction(): Promise<void> {
  const refreshToken = (await cookies()).get(REFRESH_COOKIE)?.value;
  if (refreshToken) {
    try {
      await signOutRequest(refreshToken);
    } catch (error) {
      // Signing out locally still works when the API can't be reached.
      if (!isApiError(error)) throw error;
    }
  }
  await forgetCart();
  await forgetWishlist();
  await setCookies([
    ...clearedSessionCookies(production()),
    flashCookie("signed-out", production()),
  ]);
  redirect("/");
}

/** Signs out on every device (this one included). */
export async function signOutEverywhereAction(): Promise<void> {
  const accessToken = (await cookies()).get(ACCESS_COOKIE)?.value;
  // Only say "everywhere" when the API confirmed it.
  let everywhere = false;
  if (accessToken) {
    try {
      await signOutEverywhereRequest(accessToken);
      everywhere = true;
    } catch (error) {
      if (!isApiError(error)) throw error;
    }
  }
  await forgetCart();
  await forgetWishlist();
  await setCookies([
    ...clearedSessionCookies(production()),
    flashCookie(everywhere ? "signed-out-everywhere" : "signed-out", production()),
  ]);
  redirect("/");
}
