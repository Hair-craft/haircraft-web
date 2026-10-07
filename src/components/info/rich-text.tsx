import Link from "next/link";
import { Fragment } from "react";
import { parseRich } from "@/lib/info/rich-text";

const linkClass =
  "font-medium text-deep underline decoration-gold/60 underline-offset-2 hover:decoration-deep focus-visible:outline-2 focus-visible:outline-deep";

/** A string with `**bold**` and `[links](/path)` (see lib/info/rich-text). */
export function RichText({ text }: { text: string }) {
  return parseRich(text).map((part, i) => {
    if (part.kind === "bold")
      return (
        <strong key={i} className="font-semibold text-deep">
          {part.text}
        </strong>
      );
    if (part.kind === "link") {
      if (part.external)
        return (
          <a
            key={i}
            href={part.href}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass}
          >
            {part.text}
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        );
      if (part.href.startsWith("/"))
        return (
          <Link key={i} href={part.href} className={linkClass}>
            {part.text}
          </Link>
        );
      return (
        <a key={i} href={part.href} className={linkClass}>
          {part.text}
        </a>
      );
    }
    return <Fragment key={i}>{part.text}</Fragment>;
  });
}
