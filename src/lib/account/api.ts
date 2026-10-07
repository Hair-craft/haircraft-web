import "server-only";
import { apiFetch } from "@/lib/api/client";
import { clientHeaders, type Profile, type ShopperClient } from "@/lib/session/api";
import type { TokenPair } from "@/lib/session/cookies";
import type { Address, AddressInput } from "./rules";

/** The customer's saved addresses: the default first, then the most recently changed. */
export function getAddresses(token: string): Promise<Address[]> {
  return apiFetch<Address[]>("/addresses", { token });
}

export function createAddress(token: string, input: AddressInput): Promise<Address> {
  return apiFetch<Address>("/addresses", { method: "POST", token, body: input });
}

export function updateAddress(
  token: string,
  id: string,
  input: Partial<AddressInput>,
): Promise<Address> {
  return apiFetch<Address>(`/addresses/${encodeURIComponent(id)}`, {
    method: "PATCH",
    token,
    body: input,
  });
}

export function deleteAddress(token: string, id: string): Promise<unknown> {
  return apiFetch(`/addresses/${encodeURIComponent(id)}`, { method: "DELETE", token });
}

/** Changes the name and phone (B9); returns the profile. */
export function updateProfile(
  token: string,
  input: { firstName: string; lastName: string | null; phone: string | null },
): Promise<Profile> {
  return apiFetch<Profile>("/profile", { method: "PATCH", token, body: input });
}

/** Signs out every other device and returns a fresh session for this one. */
export function changePasswordRequest(
  token: string,
  currentPassword: string,
  newPassword: string,
  client: ShopperClient,
): Promise<TokenPair> {
  return apiFetch<TokenPair>("/auth/change-password", {
    method: "POST",
    token,
    body: { currentPassword, newPassword },
    headers: clientHeaders(client),
  });
}
