/**
 * Microsoft Clarity (owner, 2026-11-27: "add this also"): session recordings and
 * heatmaps. The project ID comes from CLARITY_ID (the live shop only), so test and local
 * copies never send visits. Microsoft's snippet, started once the page has finished
 * loading, so it never slows the first view (owner, the same day: "make it faster to
 * load"). Like Tag Manager, it names no website address.
 */

/** A Clarity project ID, as Clarity shows it: lower-case letters and digits. */
export const CLARITY_ID_PATTERN = /^[a-z0-9]{6,20}$/;

/** Microsoft's snippet, run after the page's load event. */
export function clarityScript(id: string): string {
  if (!CLARITY_ID_PATTERN.test(id)) throw new Error(`Not a Clarity project ID: ${id}`);
  const snippet =
    "(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};" +
    't=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;' +
    "y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);" +
    `})(window,document,"clarity","script","${id}");`;
  return (
    `(function(){function go(){${snippet}}` +
    `if(document.readyState==="complete")go();else window.addEventListener("load",go,{once:true});})();`
  );
}
