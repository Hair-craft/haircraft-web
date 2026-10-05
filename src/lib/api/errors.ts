import type { FieldError } from "./types";

/** Codes the storefront adds for failures that never reached the API. */
export const CLIENT_ERROR_CODES = {
  unreachable: "API_UNREACHABLE",
  timeout: "API_TIMEOUT",
  badResponse: "API_BAD_RESPONSE",
} as const;

/**
 * A failed API call. `status` 0 means the API could not be reached.
 * `code` is the API's error code (e.g. `VALIDATION_FAILED`) or one of
 * CLIENT_ERROR_CODES; `fieldErrors` map onto form fields.
 */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly fieldErrors: FieldError[] = [],
    readonly data: unknown = null,
    readonly requestId: string | null = null,
  ) {
    super(message);
    this.name = "ApiError";
  }

  /** The API (or the network to it) is down: show "try again", not "you did something wrong". */
  get unavailable(): boolean {
    return this.status === 0 || this.status >= 500;
  }

  /** Messages for one field, e.g. `email`. */
  messagesFor(field: string): string[] {
    return this.fieldErrors.find((error) => error.field === field)?.messages ?? [];
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/**
 * What to tell a customer. API messages are written for customers, so they
 * are shown as they are; technical failures get calm, generic wording.
 */
export function friendlyMessage(error: unknown): string {
  if (isApiError(error)) {
    if (error.status === 0 || error.code === CLIENT_ERROR_CODES.badResponse) {
      return "We can't reach the shop right now. Please try again in a moment.";
    }
    if (error.status >= 500) return "Something went wrong on our side. Please try again in a moment.";
    if (error.status === 429) return "Too many attempts. Please wait a minute and try again.";
    return error.message;
  }
  return "Something went wrong. Please try again.";
}
