/**
 * Google Tag Manager (owner, 2026-11-27: "use this in every page header section"). The
 * container ID comes from GTM_ID (the live shop only), so test and local copies never
 * send visits. Google's standard snippet, built from that ID: the script in <head>, the
 * <noscript> frame at the top of <body>. It names no website address, so it keeps working
 * when the shop moves from shop.haircraft.in to haircraft.in.
 */

/** A Tag Manager container ID, as Google shows it: "GTM-" and letters or digits. */
export const GTM_ID_PATTERN = /^GTM-[A-Z0-9]{4,12}$/;

/** Google's <head> snippet: starts the dataLayer and loads the container. */
export function gtmHeadScript(id: string): string {
  if (!GTM_ID_PATTERN.test(id)) throw new Error(`Not a Tag Manager ID: ${id}`);
  return (
    "(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});" +
    "var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';" +
    "j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);" +
    `})(window,document,'script','dataLayer','${id}');`
  );
}

/** Google's <noscript> frame, for browsers with JavaScript off. */
export function gtmNoscriptSrc(id: string): string {
  if (!GTM_ID_PATTERN.test(id)) throw new Error(`Not a Tag Manager ID: ${id}`);
  return `https://www.googletagmanager.com/ns.html?id=${id}`;
}
