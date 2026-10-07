import type { Business } from "@/content/business";

export interface ContactMethod {
  kind: "email" | "phone" | "whatsapp";
  label: string;
  /** As shown on the page. */
  value: string;
  href: string;
  /** Opens outside the shop (a new tab). */
  external: boolean;
}

const digits = (phone: string) => phone.replace(/[^\d]/g, "");

/** "+919876543210" → "+91 98765 43210" (Indian mobiles); other numbers as given. */
export function displayPhone(phone: string): string {
  const d = digits(phone);
  if (d.length === 12 && d.startsWith("91")) return `+91 ${d.slice(2, 7)} ${d.slice(7)}`;
  if (d.length === 10) return `${d.slice(0, 5)} ${d.slice(5)}`;
  return phone.trim();
}

export function telHref(phone: string): string {
  const d = digits(phone);
  return `tel:+${d.length === 10 ? `91${d}` : d}`;
}

/** WhatsApp's click-to-chat link (country code, no plus). */
export function whatsappHref(phone: string): string {
  const d = digits(phone);
  return `https://wa.me/${d.length === 10 ? `91${d}` : d}`;
}

/** The ways to reach the shop, leaving out any the owner hasn't filled in. */
export function contactMethods(b: Business): ContactMethod[] {
  const methods: ContactMethod[] = [
    { kind: "email", label: "Email", value: b.email, href: `mailto:${b.email}`, external: false },
  ];
  if (b.phone)
    methods.push({
      kind: "phone",
      label: "Phone",
      value: displayPhone(b.phone),
      href: telHref(b.phone),
      external: false,
    });
  if (b.whatsapp)
    methods.push({
      kind: "whatsapp",
      label: "WhatsApp",
      value: displayPhone(b.whatsapp),
      href: whatsappHref(b.whatsapp),
      external: true,
    });
  return methods;
}
