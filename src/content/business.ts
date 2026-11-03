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
  /** The address on Google Maps (shown as a link, e.g. while there is no written address). */
  mapUrl: string | null;
  /** The company's Corporate Identification Number. */
  cin: string | null;
  gstin: string | null;
  email: string;
  /** International format, e.g. "+919876543210". */
  phone: string | null;
  /** WhatsApp number in international format, if it differs or is used. */
  whatsapp: string | null;
  /**
   * WhatsApp's own chat link (wa.me/message/…), from WhatsApp Business →
   * Short link. Used by the floating WhatsApp button and the Contact page;
   * preferred over a number.
   */
  whatsappChat: string | null;
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
  // Owner, 2026-11-03.
  legalName: "House of Jana Private Limited",
  address: null,
  mapUrl:
    "https://maps.google.com/maps?vet=10CAAQoqAOahcKEwjIsO-mnuuXAxUAAAAAHQAAAAAQBQ..i&udm&fvr=1&pvq=Cg0vZy8xMXlxcm54ajBfIhMKDWhvdXNlIG9mIGphbmEQAhgDiQH_mhf0DOltnQ&lqi=Cg1ob3VzZSBvZiBqYW5hSJ-AufravYCACFolEAAQARACGAAYARgCIg1ob3VzZSBvZiBqYW5hKggIAhAAEAEQApIBGGhhaXJfZXh0ZW5zaW9uc19zdXBwbGllcg&cs=1&um=1&ie=UTF-8&fb=1&gl=in&sa=X&ftid=0x39f89fded047d143:0x9d6de90cf4179aff",
  cin: "U32904WB2024PTC273691",
  gstin: null,
  email: "contact@haircraft.in",
  phone: "+919903411497",
  whatsapp: null,
  whatsappChat: "https://wa.me/message/5EXU5MQ2N5Y3B1",
  hours: "Monday to Saturday, 10 am to 6 pm (IST)",
  replyTime: "We reply within one working day.",
  grievanceOfficer: { name: null, email: "contact@haircraft.in", phone: "+919903411497" },
  socialProfiles: [],
};

/** "HairCraft" or "HairCraft (HairCraft Private Limited)". */
export function sellerName(b: Business = business): string {
  return b.legalName && b.legalName !== b.tradingName
    ? `${b.tradingName} (${b.legalName})`
    : b.tradingName;
}
