/**
 * DRAFT — OWNER TO CONFIRM: who runs the shop and how to reach them, used by
 * Contact, the privacy policy and the terms. Indian e-commerce rules ask for
 * the seller's legal name, address and contact details, and a grievance
 * officer; anything left `null` is simply not shown until it is filled in.
 * The S16 launch checklist blocks opening until every field is set.
 */
export interface Business {
  /** The name customers know. */
  tradingName: string;
  /** The registered business name (e.g. "HairCraft Private Limited"). */
  legalName: string | null;
  /** Registered address, one line per entry. */
  address: string[] | null;
  gstin: string | null;
  email: string;
  /** International format, e.g. "+919876543210". */
  phone: string | null;
  /** WhatsApp number in international format, if it differs or is used. */
  whatsapp: string | null;
  /** When messages and calls are answered. */
  hours: string;
  /** How soon we reply. */
  replyTime: string;
  grievanceOfficer: { name: string | null; email: string; phone: string | null };
  /** Instagram, Facebook, YouTube… profile addresses (search engines link them to the shop). */
  socialProfiles: string[];
}

export const business: Business = {
  tradingName: "HairCraft",
  legalName: null,
  address: null,
  gstin: null,
  email: "care@haircraft.in",
  phone: null,
  whatsapp: null,
  hours: "Monday to Saturday, 10 am to 6 pm (IST)",
  replyTime: "We reply within one working day.",
  grievanceOfficer: { name: null, email: "care@haircraft.in", phone: null },
  socialProfiles: [],
};

/** "HairCraft" or "HairCraft (HairCraft Private Limited)". */
export function sellerName(b: Business = business): string {
  return b.legalName && b.legalName !== b.tradingName
    ? `${b.tradingName} (${b.legalName})`
    : b.tradingName;
}
