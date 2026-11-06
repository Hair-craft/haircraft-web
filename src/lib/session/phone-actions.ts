"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { isApiError } from "@/lib/api/errors";
import { updateProfile } from "@/lib/account/api";
import {
  clientFrom,
  forgotPasswordRequest,
  googleSignInRequest,
  resetPasswordRequest,
  sendPhoneChangeCodeRequest,
  sendSignInCodeRequest,
  verifyPhoneChangeRequest,
  verifySignInCodeRequest,
} from "./api";
import { ACCESS_COOKIE, clearedSessionCookies, type PhoneStatus } from "./cookies";
import {
  DEFAULT_AFTER_SIGN_IN,
  indianMobile,
  passwordProblem,
  phoneAuthMessage,
  safeNext,
  smsCode,
} from "./rules";
import { afterSignIn, setCookies, setWhoPhone, startSession } from "./start";

/**
 * The phone on the create-account form, a forgotten password, "Continue with
 * Google", and adding the phone to the account (owner, 2026-11-04). Called
 * from the client step by step; each returns what the next step needs, or an
 * error in the shop's words. On a finished sign-in they redirect to `next`
 * (through the "add your phone" step when the account needs one).
 */

export type StepResult<T = object> =
  ({ ok: true } & T) | { ok: false; error: string; field?: Field };

type Field = "phone" | "code" | "newPassword";

const production = () => process.env.NODE_ENV === "production";
const clip = (value: unknown, max: number) =>
  String(value ?? "")
    .trim()
    .slice(0, max);
const afterSignInPath = (next: unknown) =>
  safeNext(typeof next === "string" ? next.slice(0, 512) : null) ?? DEFAULT_AFTER_SIGN_IN;

function failure(error: unknown, field?: Field): StepResult<never> {
  if (!isApiError(error)) throw error;
  return {
    ok: false,
    error: phoneAuthMessage(error.status, error.code, error.message, error.data),
    field,
  };
}

function readPhone(raw: unknown): string | null {
  const phone = indianMobile(clip(raw, 30));
  return phone ?? null;
}

const BAD_PHONE: StepResult<never> = {
  ok: false,
  error: "Enter a 10-digit Indian mobile number, e.g. 98765 43210.",
  field: "phone",
};
const BAD_CODE: StepResult<never> = {
  ok: false,
  error: "Enter the 6-digit code from the SMS.",
  field: "code",
};

type CodeStep = StepResult<{ phone: string; resendInSeconds: number; devCode: string | null }>;

function codeSent(phone: string, sent: { resendInSeconds: number; devCode?: string }): CodeStep {
  return {
    ok: true,
    phone,
    resendInSeconds: sent.resendInSeconds,
    // The API includes it only in development; never shown on the live shop.
    devCode: production() ? null : (sent.devCode ?? null),
  };
}

// ── Sign in with a code (owner, 2026-11-05) ───────────────────────────

export async function sendSignInCodeAction(rawPhone: string): Promise<CodeStep> {
  const phone = readPhone(rawPhone);
  if (!phone) return BAD_PHONE;
  try {
    return codeSent(phone, await sendSignInCodeRequest(phone, clientFrom(await headers())));
  } catch (error) {
    return failure(error, "phone");
  }
}

/**
 * Signs in with the code (and moves on). A number no account has verified
 * answers `noAccount`: accounts are made with the full form, email included.
 */
export async function verifySignInCodeAction(
  rawPhone: string,
  rawCode: string,
  next: string,
): Promise<StepResult | { ok: false; noAccount: true; error: string }> {
  const phone = readPhone(rawPhone);
  if (!phone) return BAD_PHONE;
  const code = smsCode(clip(rawCode, 20));
  if (!code) return BAD_CODE;
  let destination: string;
  try {
    const result = await verifySignInCodeRequest(phone, code, clientFrom(await headers()));
    if (!result.session)
      return { ok: false, noAccount: true, error: "No account uses this number yet." };
    await startSession(result.session);
    destination = await afterSignIn(result.session, afterSignInPath(next));
  } catch (error) {
    return failure(error, "code");
  }
  redirect(destination);
}

// ── Forgotten password ────────────────────────────────────────────────

export async function sendResetCodeAction(rawPhone: string): Promise<CodeStep> {
  const phone = readPhone(rawPhone);
  if (!phone) return BAD_PHONE;
  try {
    return codeSent(phone, await forgotPasswordRequest(phone, clientFrom(await headers())));
  } catch (error) {
    return failure(error, "phone");
  }
}

/** Sets the new password and signs the customer in. */
export async function resetPasswordAction(input: {
  phone: string;
  code: string;
  newPassword: string;
  next: string;
}): Promise<StepResult> {
  const phone = readPhone(input.phone);
  if (!phone) return BAD_PHONE;
  const code = smsCode(clip(input.code, 20));
  if (!code) return BAD_CODE;
  const newPassword = String(input.newPassword ?? "").slice(0, 1024);
  const problem = passwordProblem(newPassword);
  if (problem) return { ok: false, error: problem, field: "newPassword" };
  let destination: string;
  try {
    const tokens = await resetPasswordRequest(
      { phone, code, newPassword },
      clientFrom(await headers()),
    );
    await startSession(tokens);
    destination = await afterSignIn(tokens, afterSignInPath(input.next));
  } catch (error) {
    const field = isApiError(error) && error.code === "VALIDATION_FAILED" ? "newPassword" : "code";
    return failure(error, field);
  }
  redirect(destination);
}

/** Google's button gives the page an ID token ("credential"); the API checks it. */
export async function googleSignInAction(idToken: string, next: string): Promise<StepResult> {
  const token = clip(idToken, 4096);
  if (!token) return { ok: false, error: "Google sign-in didn't work. Please try again." };
  let destination: string;
  try {
    const tokens = await googleSignInRequest(token, clientFrom(await headers()));
    await startSession(tokens);
    destination = await afterSignIn(tokens, afterSignInPath(next));
  } catch (error) {
    return failure(error);
  }
  redirect(destination);
}

// ── Add or change the number on the account ──────────────────────────

async function accessToken(): Promise<string | null> {
  return (await cookies()).get(ACCESS_COOKIE)?.value || null;
}

async function sessionEnded(next: string): Promise<never> {
  await setCookies(clearedSessionCookies(production()));
  redirect(`/sign-in?notice=ended&next=${encodeURIComponent(next)}`);
}

export async function sendPhoneChangeCodeAction(
  rawPhone: string,
): Promise<StepResult<{ phone: string; resendInSeconds: number; devCode: string | null }>> {
  const phone = readPhone(rawPhone);
  if (!phone) return BAD_PHONE;
  const token = await accessToken();
  if (!token) return sessionEnded("/account/profile");
  try {
    const sent = await sendPhoneChangeCodeRequest(token, phone, clientFrom(await headers()));
    return {
      ok: true,
      phone,
      resendInSeconds: sent.resendInSeconds,
      // The API includes it only in development; never shown on the live shop.
      devCode: production() ? null : (sent.devCode ?? null),
    };
  } catch (error) {
    if (isApiError(error) && error.status === 401) return sessionEnded("/account/profile");
    return failure(error, "phone");
  }
}

export async function verifyPhoneChangeAction(
  rawPhone: string,
  rawCode: string,
): Promise<StepResult<{ phone: string }>> {
  const phone = readPhone(rawPhone);
  if (!phone) return BAD_PHONE;
  const code = smsCode(clip(rawCode, 20));
  if (!code) return BAD_CODE;
  const token = await accessToken();
  if (!token) return sessionEnded("/account/profile");
  try {
    const profile = await verifyPhoneChangeRequest(token, phone, code);
    await setWhoPhone("verified");
    return { ok: true, phone: profile.phone ?? phone };
  } catch (error) {
    if (isApiError(error) && error.status === 401) return sessionEnded("/account/profile");
    return failure(error, "code");
  }
}

/**
 * While SMS codes are off: saves the phone on the account, unverified, for
 * the "add your phone" step (owner, 2026-11-04).
 */
export async function savePhoneAction(rawPhone: string): Promise<StepResult<{ phone: string }>> {
  const phone = readPhone(rawPhone);
  if (!phone) return BAD_PHONE;
  const token = await accessToken();
  if (!token) return sessionEnded("/add-phone");
  try {
    await updateProfile(token, { phone });
    await setWhoPhone("unverified");
    return { ok: true, phone };
  } catch (error) {
    if (isApiError(error) && error.status === 401) return sessionEnded("/add-phone");
    return failure(error, "phone");
  }
}

/** The "add your phone" step found the account already has one: note it here and go on. */
export async function notePhoneAddedAction(status: PhoneStatus, next: string): Promise<void> {
  if (status === "verified" || status === "unverified") await setWhoPhone(status);
  redirect(afterSignInPath(next));
}
