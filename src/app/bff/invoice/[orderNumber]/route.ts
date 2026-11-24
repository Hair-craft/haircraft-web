import { NextResponse, type NextRequest } from "next/server";
import { buildUrl } from "@/lib/api/client";
import { settings } from "@/lib/env";
import { INVOICE_ORDER_NUMBER, INVOICE_RECEIPT_TOKEN, invoiceApiPath } from "@/lib/orders/invoice";
import { getSession } from "@/lib/session/session";

const NO_STORE = { "Cache-Control": "private, no-store" };

function message(text: string, status: number) {
  return new NextResponse(text, {
    status,
    headers: { ...NO_STORE, "Content-Type": "text/plain; charset=utf-8" },
  });
}

/**
 * GET /bff/invoice/HC-100001[?t=…]: downloads the order's GST tax invoice
 * (owner, 2026-11-24) for the signed-in shopper, or for a guest by the
 * order's private link. The PDF is passed on from the API, never cached.
 */
export async function GET(
  request: NextRequest,
  { params }: RouteContext<"/bff/invoice/[orderNumber]">,
) {
  const { orderNumber } = await params;
  const t = request.nextUrl.searchParams.get("t");
  if (!INVOICE_ORDER_NUMBER.test(orderNumber) || (t !== null && !INVOICE_RECEIPT_TOKEN.test(t)))
    return message("Invoice not found.", 404);

  const { accessToken } = await getSession();
  const here = `/account/orders/${orderNumber.toUpperCase()}`;
  if (!accessToken && !t) {
    const signIn = new URL("/sign-in", request.url);
    signIn.searchParams.set("next", here);
    return NextResponse.redirect(signIn);
  }

  const { apiBaseUrl, apiTimeoutMs } = settings();
  let response: Response;
  try {
    response = await fetch(
      buildUrl(apiBaseUrl, invoiceApiPath(orderNumber, accessToken ? null : t)),
      {
        headers: {
          Accept: "application/pdf",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        cache: "no-store",
        signal: AbortSignal.timeout(apiTimeoutMs * 2),
      },
    );
  } catch {
    return message("The shop could not be reached. Please try again.", 503);
  }

  if (response.status === 401 && accessToken) {
    const end = new URL("/bff/session/end", request.url);
    end.searchParams.set("next", here);
    return NextResponse.redirect(end);
  }
  if (!response.ok || !response.body)
    return message(
      response.status === 404
        ? "This order has no invoice yet."
        : "The invoice could not be downloaded. Please try again.",
      response.status === 404 ? 404 : 502,
    );

  return new NextResponse(response.body, {
    status: 200,
    headers: {
      ...NO_STORE,
      "Content-Type": "application/pdf",
      "Content-Disposition":
        response.headers.get("content-disposition") ??
        `attachment; filename="${orderNumber.toUpperCase()}-invoice.pdf"`,
    },
  });
}
