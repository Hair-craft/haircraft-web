import type { Metadata } from "next";
import { ContactCards } from "@/components/info/contact-cards";
import { InfoPage } from "@/components/info/info-page";
import { RichText } from "@/components/info/rich-text";
import { business, sellerName } from "@/content/business";
import { displayPhone, telHref } from "@/lib/info/contact";

export const metadata: Metadata = {
  title: "Contact us",
  description: "Email or call HairCraft about an order, a product, or choosing your hair.",
  alternates: { canonical: "/contact" },
};

const linkClass =
  "font-medium underline decoration-gold/60 underline-offset-2 hover:decoration-deep";

/** `/contact`: ways to reach us, the business details and the grievance officer. */
export default function ContactPage() {
  const officer = business.grievanceOfficer;
  return (
    <InfoPage slug="contact" eyebrow="We're here to help" title="Contact us">
      <p className="mt-6 text-lg leading-relaxed text-deep/80">
        Questions about an order, a product, or which length and shade would suit you? Get in touch.{" "}
        {business.replyTime}
      </p>
      <ContactCards business={business} />
      <p className="mt-6 text-sm text-deep/70">
        <span className="font-medium text-deep">Hours:</span> {business.hours}
      </p>
      <p className="mt-2 text-sm text-deep/70">
        <RichText text="About an order? Include its order number (it's in [My orders](/account/orders)). Many answers are in the [FAQ](/faq)." />
      </p>

      <section aria-labelledby="business" className="mt-12">
        <h2 id="business" className="scroll-mt-28 font-display text-2xl md:text-3xl">
          The business
        </h2>
        <dl className="mt-4 grid grid-cols-[auto_minmax(0,1fr)] gap-x-6 gap-y-2 leading-relaxed">
          <dt className="text-deep/70">Seller</dt>
          <dd>{sellerName()}</dd>
          {business.address ? (
            <>
              <dt className="text-deep/70">Address</dt>
              <dd>
                <address className="not-italic">
                  {business.address.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </address>
              </dd>
            </>
          ) : null}
          {business.gstin ? (
            <>
              <dt className="text-deep/70">GSTIN</dt>
              <dd>{business.gstin}</dd>
            </>
          ) : null}
        </dl>
      </section>

      <section aria-labelledby="grievance" className="mt-12">
        <h2 id="grievance" className="scroll-mt-28 font-display text-2xl md:text-3xl">
          Grievance officer
        </h2>
        <p className="mt-4 leading-relaxed text-deep/80">
          If we haven&apos;t resolved a complaint about an order or your personal data, you can
          write to our grievance officer. They acknowledge complaints within 48 hours and aim to
          resolve them within one month.
        </p>
        <dl className="mt-4 grid grid-cols-[auto_minmax(0,1fr)] gap-x-6 gap-y-2 leading-relaxed">
          {officer.name ? (
            <>
              <dt className="text-deep/70">Name</dt>
              <dd>{officer.name}</dd>
            </>
          ) : null}
          <dt className="text-deep/70">Email</dt>
          <dd>
            <a href={`mailto:${officer.email}`} className={linkClass}>
              {officer.email}
            </a>
          </dd>
          {officer.phone ? (
            <>
              <dt className="text-deep/70">Phone</dt>
              <dd>
                <a href={telHref(officer.phone)} className={linkClass}>
                  {displayPhone(officer.phone)}
                </a>
              </dd>
            </>
          ) : null}
        </dl>
      </section>
    </InfoPage>
  );
}
