"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { isApiError } from "@/lib/api/errors";
import {
  clientFrom,
  completePhoneSignupRequest,
  googleSignInRequest,
  sendPhoneChangeCodeRequest,
  sendSignInCodeRequest,
  verifyPhoneChangeRequest,
  verifySignInCodeRequest,
} from "./api";
import { ACCESS_COOKIE, clearedSessionCookies } from "./cookies";
import { DEFAULT_AFTER_SIGN_IN, indianMobile, phoneAuthMessage, safeNext, smsCode } from "./rules";
import { setCookies, startSession } from "./start";

/**
 * Signing in and registering with a phone code, "Continue with Google", and
 * adding a verified number to the account (owner, 2026-11-04). Called from
 * the client step by step; each returns what the next step needs, or an
 * error in the shop's words. On a finished sign-in they redirect to `next`.
 */

export type StepResult<T = object> =
  | ({ ok: true } & T)
  | { ok: false; error: string; field?: "phone" | "code" | "firstName" | "email" };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const production = () => process.env.NODE_ENV === "production";
const clip = (value: unknown, max: number) =>
  String(value ?? "")
    .trim()
    .slice(0, max);
const afterSignIn = (next: unknown) =>
  safeNext(typeof next === "string" ? next.slice(0, 512) : null) ?? DEFAULT_AFTER_SIGN_IN;

function failure(
  error: unknown,
  field?: "phone" | "code" | "firstName" | "email",
): StepResult<never> {
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

// ── Sign in / register ────────────────────────────────────────────────

export async function sendSignInCodeAction(
  rawPhone: string,
): Promise<StepResult<{ phone: string; resendInSeconds: number; devCode: string | null }>> {
  const phone = readPhone(rawPhone);
  if (!phone) return BAD_PHONE;
  try {
    const sent = await sendSignInCodeRequest(phone, clientFrom(await headers()));
    return {
      ok: true,
      phone,
      resendInSeconds: sent.resendInSeconds,
      // The API includes it only in development; never shown on the live shop.
      devCode: production() ? null : (sent.devCode ?? null),
    };
  } catch (error) {
    return failure(error, "phone");
  }
}

/** A known number signs in (and redirects); a new one returns a sign-up token. */
export async function verifySignInCodeAction(
  rawPhone: string,
  rawCode: string,
  next: string,
): Promise<StepResult<{ signupToken: string }>> {
  const phone = readPhone(rawPhone);
  if (!phone) return BAD_PHONE;
  const code = smsCode(clip(rawCode, 20));
  if (!code) return BAD_CODE;
  let signupToken: string;
  try {
    const result = await verifySignInCodeRequest(phone, code, clientFrom(await headers()));
    if (result.session) {
      await startSession(result.session);
      signupToken = "";
    } else if (result.signupToken) {
      signupToken = result.signupToken;
    } else {
      return { ok: false, error: "Something went wrong. Please try again." };
    }
  } catch (error) {
    return failure(error, "code");
  }
  // Outside try: redirect works by throwing.
  if (!signupToken) redirect(afterSignIn(next));
  return { ok: true, signupToken };
}

export async function completePhoneSignupAction(input: {
  signupToken: string;
  firstName: string;
  lastName: string;
  email: string;
  next: string;
}): Promise<StepResult> {
  const firstName = clip(input.firstName, 100);
  const lastName = clip(input.lastName, 100);
  const email = clip(input.email, 254).toLowerCase();
  if (!firstName) return { ok: false, error: "Enter your first name.", field: "firstName" };
  if (email && !EMAIL.test(email))
    return { ok: false, error: "Enter a valid email address, or leave it empty.", field: "email" };
  try {
    await startSession(
      await completePhoneSignupRequest(
        {
          signupToken: clip(input.signupToken, 2048),
          firstName,
          ...(lastName ? { lastName } : {}),
          ...(email ? { email } : {}),
        },
        clientFrom(await headers()),
      ),
    );
  } catch (error) {
    const field =
      isApiError(error) && error.code === "EMAIL_ALREADY_REGISTERED" ? "email" : undefined;
    return failure(error, field);
  }
  redirect(afterSignIn(input.next));
}

/** Google's button gives the page an ID token ("credential"); the API checks it. */
export async function googleSignInAction(idToken: string, next: string): Promise<StepResult> {
  const token = clip(idToken, 4096);
  if (!token) return { ok: false, error: "Google sign-in didn't work. Please try again." };
  try {
    await startSession(await googleSignInRequest(token, clientFrom(await headers())));
  } catch (error) {
    return failure(error);
  }
  redirect(afterSignIn(next));
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
    return { ok: true, phone: profile.phone ?? phone };
  } catch (error) {
    if (isApiError(error) && error.status === 401) return sessionEnded("/account/profile");
    return failure(error, "code");
  }
}
