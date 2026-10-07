"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { isApiError } from "@/lib/api/errors";
import { forgetCart, mergeGuestCartInto } from "@/lib/cart/server";
import { forgetWishlist, wishlistAfterSignIn } from "@/lib/wishlist/server";
import type { FieldError } from "@/lib/api/types";
import {
  clientFrom,
  registerRequest,
  signInRequest,
  signOutEverywhereRequest,
  signOutRequest,
} from "./api";
import {
  ACCESS_COOKIE,
  clearedSessionCookies,
  flashCookie,
  REFRESH_COOKIE,
  sessionCookies,
  type CookieToSet,
  type TokenPair,
} from "./cookies";
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

async function setCookies(list: CookieToSet[]) {
  const store = await cookies();
  for (const cookie of list) store.set(cookie.name, cookie.value, cookie.options);
}

/**
 * Signs the shopper in on this browser, and brings their guest bag along
 * (it joins the account's; a note says if anything couldn't be added), and
 * saves the product they pressed a heart on as a guest.
 */
async function startSession(tokens: TokenPair) {
  await setCookies(sessionCookies(tokens, production(), Date.now()));
  const skipped = await mergeGuestCartInto(tokens.accessToken);
  await wishlistAfterSignIn(tokens.accessToken);
  if (skipped > 0) await setCookies([flashCookie("cart-skipped", production())]);
}

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
  const email = text(form, "email");
  const password = String(form.get("password") ?? "").slice(0, 1024);
  const next = safeNext(text(form, "next", 512)) ?? DEFAULT_AFTER_SIGN_IN;
  const values = { email };

  const fields: Record<string, string> = {};
  if (!EMAIL.test(email)) fields.email = "Enter your email address.";
  if (!password) fields.password = "Enter your password.";
  if (Object.keys(fields).length > 0)
    return { error: "Please check the details below.", fields, values };

  try {
    await startSession(await signInRequest(email, password, clientFrom(await headers())));
  } catch (error) {
    if (!isApiError(error)) throw error;
    return {
      error: authErrorMessage(error.status, error.code, error.message),
      fields: error.code === "VALIDATION_FAILED" ? fieldMessages(error.fieldErrors) : {},
      values,
    };
  }
  redirect(next);
}

export async function registerAction(
  _previous: AuthFormState,
  form: FormData,
): Promise<AuthFormState> {
  const firstName = text(form, "firstName", 100);
  const lastName = text(form, "lastName", 100);
  const email = text(form, "email");
  const phoneText = text(form, "phone", 30);
  const password = String(form.get("password") ?? "").slice(0, 1024);
  const next = safeNext(text(form, "next", 512)) ?? DEFAULT_AFTER_SIGN_IN;
  const values = { firstName, lastName, email, phone: phoneText };

  const fields: Record<string, string> = {};
  if (!firstName) fields.firstName = "Enter your first name.";
  if (!EMAIL.test(email)) fields.email = "Enter a valid email address.";
  const phone = indianMobile(phoneText);
  if (phone === undefined)
    fields.phone = "Enter a 10-digit Indian mobile number, or leave it empty.";
  const problem = passwordProblem(password);
  if (problem) fields.password = problem;
  if (Object.keys(fields).length > 0)
    return { error: "Please check the details below.", fields, values };

  try {
    await startSession(
      await registerRequest(
        {
          email,
          password,
          firstName,
          ...(lastName ? { lastName } : {}),
          ...(phone ? { phone } : {}),
        },
        clientFrom(await headers()),
      ),
    );
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
  redirect(next);
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
