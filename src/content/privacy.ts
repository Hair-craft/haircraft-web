import { business, sellerName } from "./business";
import type { InfoContent } from "./types";

/**
 * DRAFT — FOR A QUALIFIED (LEGAL) REVIEW BEFORE LAUNCH. Written from what the
 * shop really collects and who it shares data with, following the Digital
 * Personal Data Protection Act 2023 and the Consumer Protection (E-Commerce)
 * Rules 2020. It is not legal advice.
 */
export function privacyContent(): InfoContent {
  const seller = sellerName();
  return {
    intro: `This policy explains what personal data ${seller} collects when you use this website, why, who we share it with, and the choices you have. We collect only what we need to sell and deliver your order and look after your account.`,
    sections: [
      {
        id: "who",
        heading: "Who we are",
        blocks: [
          `This website is run by ${seller}${business.address ? `, ${business.address.join(", ")}` : ""}. We decide how your personal data is used (we are the "data fiduciary"). You can reach us at [${business.email}](mailto:${business.email}).`,
        ],
      },
      {
        id: "collect",
        heading: "What we collect",
        blocks: [
          {
            list: [
              "**Your account:** your name, email address, phone number (if you give it) and a securely scrambled form of your password (we can't read it).",
              "**Delivery addresses:** the names, phone numbers and addresses you save.",
              "**Your orders:** what you bought, prices, payment status, delivery and any cancellations or refunds.",
              "**Payments:** Razorpay handles your payment. We receive only a payment reference and its status; we never see or keep your card, UPI or bank details.",
              "**Your bag and wishlist:** the products you add.",
              "**Reviews:** the stars, words and photos you post, shown with your first name and the first letter of your surname.",
              "**Technical data:** your IP address and browser type, kept in our security logs to protect accounts (for example, to stop repeated sign-in attempts).",
            ],
          },
        ],
      },
      {
        id: "why",
        heading: "Why we use it",
        blocks: [
          {
            list: [
              "to create and look after your account and keep it secure",
              "to take payment for, pack, deliver, cancel or refund your orders",
              "to contact you about your orders and answer your questions",
              "to show your reviews, after we've checked them",
              "to meet our legal duties, such as tax and accounting records",
            ],
          },
          "We use your data with your consent (given when you create an account or place an order) or because we need it to fulfil your order or meet the law. We don't sell your data, and we don't send marketing messages unless you've asked for them.",
        ],
      },
      {
        id: "share",
        heading: "Who we share it with",
        blocks: [
          "Only with the services that help us run the shop, and only what they need:",
          {
            list: [
              "**Razorpay**, to take and refund payments",
              "**our courier partners**, who receive your name, phone number and delivery address",
              "**Cloudinary**, which stores and shows product and review photos",
              "**our hosting providers**, which run the website and store its data securely",
            ],
          },
          "We may also share data when the law requires it, for example with tax authorities or in answer to a valid legal request.",
        ],
      },
      {
        id: "cookies",
        heading: "Cookies",
        blocks: [
          "We use only the cookies the shop needs to work. We don't use advertising or tracking cookies.",
          {
            list: [
              "**hc_at, hc_rt:** keep you signed in (removed when you sign out)",
              "**hc_who:** shows your first name in the menu while you're signed in",
              "**hc_cart, hc_count:** remember your bag and the number of items in it",
              "**hc_wish, hc_save:** show your wishlist count, and save an item you chose before signing in",
              '**hc_flash:** shows a one-time message, such as "Order cancelled"',
            ],
          },
        ],
      },
      {
        id: "keep",
        heading: "How long we keep it",
        blocks: [
          "We keep your account data while your account is open. Order and payment records are kept for as long as tax and accounting laws require, even if you close your account. Security logs are kept for a limited time and then deleted.",
        ],
      },
      {
        id: "rights",
        heading: "Your rights",
        blocks: [
          "You can see and correct your name, phone number, addresses and password at any time in [My account](/account). You can also ask us to:",
          {
            list: [
              "give you a summary of the personal data we hold about you",
              "correct or complete it",
              "delete your account and data (except records the law makes us keep)",
              "withdraw your consent (we may then be unable to take orders from you)",
            ],
          },
          `Write to [${business.email}](mailto:${business.email}); we'll reply within 30 days. You can also name someone to act for you if you are unable to.`,
        ],
      },
      {
        id: "security",
        heading: "Keeping it safe",
        blocks: [
          "Your data travels over encrypted connections, passwords are stored scrambled, and staff can only see what their job needs. If a data breach ever affects you, we'll tell you and the authorities as the law requires.",
        ],
      },
      {
        id: "grievance",
        heading: "Questions and complaints",
        blocks: [
          `Our grievance officer${business.grievanceOfficer.name ? `, ${business.grievanceOfficer.name},` : ""} handles questions and complaints about your data: [${business.grievanceOfficer.email}](mailto:${business.grievanceOfficer.email}). If you're not satisfied with our answer, you may complain to the Data Protection Board of India.`,
        ],
      },
      {
        id: "changes",
        heading: "Changes to this policy",
        blocks: [
          "If we change this policy, we'll update the date at the top of this page, and tell you by email if the change is important.",
        ],
      },
    ],
  };
}
