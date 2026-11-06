"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isApiError } from "@/lib/api/errors";
import {
  clientFrom,
  sendEmailCodeRequest,
  sendSignInCodeRequest,
  verifyEmailCodeRequest,
  verifySignInCodeRequest,
} from "./api";
import {
  DEFAULT_AFTER_SIGN_IN,
  emailAddress,
  indianMobile,
  phoneAuthMessage,
  safeNext,
  smsCode,
} from "./rules";
import { afterSignIn, startSession } from "./start";

/**
 * Sign in like Gemeria's (owner, 2026-11-06): one box for an email or a
 * mobile number, a 6-digit code sent there, then signed in; a new email or
 * number gets its account then ("we just login"). Each step answers what the next one needs,
 * or an error in the shop's words; a finished sign-in redirects to `next`.
 */

export type Channel = "email" | "phone";
type Field = "login" | "code";

export type CodeStepResult<T = object> =
  ({ ok: true } & T) | { ok: false; error: string; field?: Field };

const production = () => process.env.NODE_ENV === "production";
const clip = (value: unknown, max: number) =>
  String(value ?? "")
    .trim()
    .slice(0, max);
const afterSignInPath = (next: unknown) =>
  safeNext(typeof next === "string" ? next.slice(0, 512) : null) ?? DEFAULT_AFTER_SIGN_IN;

function failure(error: unknown, field?: Field): CodeStepResult<never> {
  if (!isApiError(error)) throw error;
  const message =
    error.code === "FORBIDDEN"
      ? "This account can't be used to sign in to the shop."
      : error.code === "SIGNUP_TOKEN_INVALID" ||
          (error.code === "VALIDATION_FAILED" && /sign-up has expired/i.test(error.message))
        ? "That took a little too long. Please ask for a new code."
        : phoneAuthMessage(error.status, error.code, error.message, error.data);
  return { ok: false, error: message, field };
}

/** Where the code goes: an email address or an Indian mobile number. */
function readLogin(raw: unknown): { channel: Channel; to: string } | null {
  const text = clip(raw, 254);
  if (text.includes("@")) {
    const email = emailAddress(text);
    return email ? { channel: "email", to: email } : null;
  }
  const phone = indianMobile(text);
  return phone ? { channel: "phone", to: phone } : null;
}

export type SentStep = CodeStepResult<{
  channel: Channel;
  to: string;
  resendInSeconds: number;
  devCode: string | null;
}>;

export async function sendCodeAction(rawLogin: string): Promise<SentStep> {
  const login = readLogin(rawLogin);
  if (!login)
    return {
      ok: false,
      error: "Enter your email address or a 10-digit Indian mobile number.",
      field: "login",
    };
  try {
    const client = clientFrom(await headers());
    const sent =
      login.channel === "email"
        ? await sendEmailCodeRequest(login.to, client)
        : await sendSignInCodeRequest(login.to, client);
    return {
      ok: true,
      ...login,
      resendInSeconds: sent.resendInSeconds,
      // The API includes it only in development; never shown on the live shop.
      devCode: production() ? null : (sent.devCode ?? null),
    };
  } catch (error) {
    return failure(error, "login");
  }
}

/** Signs in with the code and moves on; a new email or number gets its account then. */
export async function verifyCodeAction(
  channel: Channel,
  rawTo: string,
  rawCode: string,
  next: string,
): Promise<CodeStepResult> {
  const login = readLogin(rawTo);
  if (!login || login.channel !== channel)
    return { ok: false, error: "Please start again.", field: "login" };
  const code = smsCode(clip(rawCode, 20));
  if (!code) return { ok: false, error: "Enter the 6-digit code.", field: "code" };
  let destination: string;
  try {
    const client = clientFrom(await headers());
    const result =
      channel === "email"
        ? await verifyEmailCodeRequest(login.to, code, client)
        : await verifySignInCodeRequest(login.to, code, client);
    // A new email or number is signed straight in (the API makes the account).
    if (!result.session) return { ok: false, error: "Please start again.", field: "login" };
    await startSession(result.session);
    destination = await afterSignIn(result.session, afterSignInPath(next));
  } catch (error) {
    return failure(error, "code");
  }
  redirect(destination);
}
