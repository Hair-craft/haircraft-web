import type { Business } from "@/content/business";
import { contactMethods, type ContactMethod } from "@/lib/info/contact";
import { ChatIcon, MailIcon, PhoneIcon } from "@/components/ui/icons";

const ICONS: Record<ContactMethod["kind"], typeof MailIcon> = {
  email: MailIcon,
  phone: PhoneIcon,
  whatsapp: ChatIcon,
};

/** One card per way to reach us; each is a single tap (mail app, dialler, WhatsApp). */
export function ContactCards({ business }: { business: Business }) {
  return (
    <ul className="mt-8 grid gap-4 sm:grid-cols-2">
      {contactMethods(business).map((method) => {
        const Icon = ICONS[method.kind];
        return (
          <li key={method.kind}>
            <a
              href={method.href}
              {...(method.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="flex h-full items-start gap-4 rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-deep/5 transition hover:ring-deep/25 focus-visible:outline-2 focus-visible:outline-deep"
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-mint text-deep">
                <Icon />
              </span>
              <span className="min-w-0">
                <span className="block text-sm text-deep/70">{method.label}</span>
                <span className="block font-medium break-words">{method.value}</span>
                {method.external ? <span className="sr-only"> (opens in a new tab)</span> : null}
              </span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
