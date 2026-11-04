/**
 * Sign-in rules that need no server or browser, so they are unit-tested:
 * where a shopper may be sent after signing in, how long each cookie lives,
 * what a failed refresh means, the API's errors as friendly words, and the
 * password rules (the same as the API's).
 */

/** Where to go after signing in when `next` is missing or not allowed. */
export const DEFAULT_AFTER_SIGN_IN = "/account";

/**
 * A `next` address, only if it is a path on this site ("/account/orders"),
 * never another site ("//evil.com", "https://…", "/\evil.com") and never the
 * sign-in pages themselves (which would loop).
 */
export function safeNext(raw: string | null | undefined): string | null {
  if (!raw || raw.length > 512) return null;
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return null;
  if (/[\u0000-\u001f\\]/.test(raw)) return null;
  try {
    const url = new URL(raw, "https://haircraft.invalid");
    if (url.origin !== "https://haircraft.invalid") return null;
    if (["/sign-in", "/register", "/forgot-password"].includes(url.pathname)) return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

/** Refresh this many seconds before the access token really expires. */
export const ACCESS_TOKEN_MARGIN_SECONDS = 30;

/** Seconds the access-token cookie lives: a little less than the token, so it's renewed in time. */
export function accessCookieSeconds(accessTokenExpiresIn: number): number {
  return Math.max(1, Math.floor(accessTokenExpiresIn) - ACCESS_TOKEN_MARGIN_SECONDS);
}

/** Seconds the refresh-token cookie lives: until the token itself expires. */
export function refreshCookieSeconds(refreshTokenExpiresAt: string, now: number): number {
  const seconds = Math.floor((Date.parse(refreshTokenExpiresAt) - now) / 1000);
  return Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
}

/**
 * What a failed refresh means for the shopper's cookies:
 * - `ended`: the session is over (reused token, suspended account): clear them
 * - `keep`: not ours to clear. The API answers a token that lost a race
 *   between two requests ("second refresh within 10 seconds") exactly like an
 *   expired one, and clearing could delete the winner's new cookies. This
 *   request continues as a guest; a dead token simply expires.
 * - `unavailable`: the API couldn't be reached: keep everything, try later
 */
export type RefreshFailure = "ended" | "keep" | "unavailable";

export function refreshFailure(status: number, code: string): RefreshFailure {
  if (status === 0 || status >= 500 || status === 429) return "unavailable";
  if (code === "REFRESH_TOKEN_REUSED" || code === "ACCOUNT_SUSPENDED") return "ended";
  return "keep";
}

/** "Too many incorrect passwords. This account is locked for 14 more minutes." → 14. */
export function lockedMinutes(message: string): number | null {
  const match = /(\d+)\s+more\s+minute/i.exec(message);
  return match ? Number(match[1]) : null;
}

/** The API's sign-in and register errors in the shop's words. */
export function authErrorMessage(status: number, code: string, message: string): string {
  switch (code) {
    case "INVALID_CREDENTIALS":
      return "Incorrect email or password.";
    case "ACCOUNT_LOCKED": {
      const minutes = lockedMinutes(message);
      return minutes
        ? `Too many attempts. Please try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`
        : "Too many attempts. Please try again in a few minutes.";
    }
    case "ACCOUNT_SUSPENDED":
      return "This account has been suspended. Please contact us.";
    case "EMAIL_ALREADY_REGISTERED":
      return "An account with this email already exists.";
    case "TOO_MANY_REQUESTS":
      return "Too many attempts from here. Please wait a minute and try again.";
  }
  if (status === 0 || status >= 500)
    return "We can't reach the shop at the moment. Please try again in a minute.";
  return "Please check the details below.";
}

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_BYTES = 72;

/** Each password rule and whether `password` meets it (shown as a checklist while typing). */
export function passwordChecks(password: string): { label: string; met: boolean }[] {
  return [
    {
      label: `At least ${PASSWORD_MIN_LENGTH} characters`,
      met: password.length >= PASSWORD_MIN_LENGTH,
    },
    { label: "A letter", met: /\p{L}/u.test(password) },
    { label: "A number", met: /\p{N}/u.test(password) },
  ];
}

/** The password problem to show, or null when it meets every rule. */
export function passwordProblem(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH)
    return `Use at least ${PASSWORD_MIN_LENGTH} characters.`;
  if (new TextEncoder().encode(password).length > PASSWORD_MAX_BYTES)
    return "That password is too long.";
  if (!/\p{L}/u.test(password) || !/\p{N}/u.test(password))
    return "Use at least one letter and one number.";
  return null;
}

/**
 * An Indian mobile number as the API stores it (+91 and 10 digits), from
 * what people type: "98765 43210", "+91 98765-43210", "098765 43210".
 * `null` for an empty field; `undefined` when it isn't a valid number.
 */
export function indianMobile(raw: string): string | null | undefined {
  const digits = raw.replace(/[\s\-()]/g, "");
  if (digits === "") return null;
  const match = /^(?:\+?91|0)?([6-9]\d{9})$/.exec(digits);
  return match ? `+91${match[1]}` : undefined;
}

/**
 * The API's phone-code and Google sign-in errors in the shop's words
 * (owner, 2026-11-04). `data` is the error's extra detail (tries left, wait).
 */
export function phoneAuthMessage(
  status: number,
  code: string,
  message: string,
  data: unknown = null,
): string {
  const detail = (data ?? {}) as { attemptsLeft?: unknown; retryAfterSeconds?: unknown };
  switch (code) {
    case "OTP_INVALID": {
      const left = typeof detail.attemptsLeft === "number" ? detail.attemptsLeft : null;
      return left === null
        ? "That code isn't right. Please check it and try again."
        : `That code isn't right. ${left} ${left === 1 ? "try" : "tries"} left.`;
    }
    case "OTP_EXPIRED":
      return "This code has expired. Please ask for a new one.";
    case "OTP_TOO_MANY_ATTEMPTS":
      return "Too many wrong codes. Please ask for a new one.";
    case "OTP_RATE_LIMITED":
      // The API's sentence already says how long to wait.
      return message || "Too many codes requested. Please try again later.";
    case "SMS_UNAVAILABLE":
      return "We couldn't send the code just now. Please try again in a minute.";
    case "SIGN_IN_METHOD_UNAVAILABLE":
      return "This way of signing in isn't available right now. Please use another one.";
    case "SIGNUP_TOKEN_INVALID":
      return "That took a little too long. Please enter your number again.";
    case "PHONE_IN_USE":
      return "This number is already used by another account.";
    case "EMAIL_ALREADY_REGISTERED":
      return "An account with this email already exists. Sign in with it, or leave the email empty.";
    case "ACCOUNT_SUSPENDED":
      return "This account has been suspended. Please contact us.";
    case "GOOGLE_TOKEN_INVALID":
      return "Google sign-in didn't work. Please try again.";
    case "GOOGLE_STAFF_ACCOUNT":
      return "This Google account belongs to a staff member. Please use your email and password.";
    case "TOO_MANY_REQUESTS":
      return "Too many attempts from here. Please wait a minute and try again.";
    case "FORBIDDEN":
      return "This number can't be used to sign in to the shop.";
  }
  if (status === 0 || status >= 500)
    return "We can't reach the shop at the moment. Please try again in a minute.";
  return "Please check the details and try again.";
}

/** A 6-digit SMS code from what was typed or pasted ("123 456", "Code: 123456"). */
export function smsCode(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  return digits.length === 6 ? digits : null;
}
