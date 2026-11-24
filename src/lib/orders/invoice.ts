const ORDER_NUMBER = /^HC-\d{4,10}$/i;
const RECEIPT_TOKEN = /^[0-9a-f]{48}$/;

/**
 * Where the shop downloads an order's GST tax invoice (owner, 2026-11-24):
 * the BFF adds the signed-in shopper's session, or passes on a guest's
 * private order link. Null for a malformed order number or link.
 */
export function invoiceHref(orderNumber: string, receiptToken?: string | null): string | null {
  if (!ORDER_NUMBER.test(orderNumber)) return null;
  const path = `/bff/invoice/${encodeURIComponent(orderNumber.toUpperCase())}`;
  if (!receiptToken) return path;
  return RECEIPT_TOKEN.test(receiptToken) ? `${path}?t=${receiptToken}` : null;
}

/** The API path for the PDF: the shopper's own order, or a guest's private link. */
export function invoiceApiPath(orderNumber: string, receiptToken: string | null): string {
  return receiptToken
    ? `/checkout/magic/receipts/${receiptToken}/invoice.pdf`
    : `/orders/${encodeURIComponent(orderNumber.toUpperCase())}/invoice.pdf`;
}

export { ORDER_NUMBER as INVOICE_ORDER_NUMBER, RECEIPT_TOKEN as INVOICE_RECEIPT_TOKEN };
