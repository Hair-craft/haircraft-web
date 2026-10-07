import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

/** The size WhatsApp, Facebook, LinkedIn and X expect for a large link preview. */
export const SHARE_SIZE = { width: 1200, height: 630 };

const MINT = "#edf9e5";
const DEEP = "#16362a";
const DEEP_SOFT = "#3d6b54";
const GOLD = "#d9982f";

let assets: Promise<{ display: Buffer; sans: Buffer; logo: string }> | undefined;

/** The brand fonts and logo, read once per server. */
function brandAssets() {
  assets ??= (async () => {
    const [display, sans, logo] = await Promise.all([
      readFile(join(process.cwd(), "assets/fonts/CormorantGaramond-Medium.woff")),
      readFile(join(process.cwd(), "assets/fonts/Geist-Medium.woff")),
      readFile(join(process.cwd(), "public/images/logo.png")),
    ]);
    return { display, sans, logo: `data:image/png;base64,${logo.toString("base64")}` };
  })();
  return assets;
}

/**
 * A product photo (an address from the API) as a data URI the image drawer
 * can use: JPEG or PNG only (it can't draw WebP or AVIF), within 5 seconds,
 * or null to fall back to the plain design.
 */
export async function sharePhoto(url: string | null | undefined): Promise<string | null> {
  if (!url) return null;
  try {
    const response = await fetch(url, {
      headers: { Accept: "image/jpeg,image/png;q=0.9" },
      signal: AbortSignal.timeout(5000),
    });
    const type = response.headers.get("content-type")?.split(";")[0].trim() ?? "";
    if (!response.ok || !["image/jpeg", "image/png"].includes(type)) return null;
    const bytes = Buffer.from(await response.arrayBuffer());
    return bytes.length > 8 * 1024 * 1024
      ? null
      : `data:${type};base64,${bytes.toString("base64")}`;
  } catch {
    return null;
  }
}

/**
 * A branded 1200×630 link preview: the logo, a small label, a title in the
 * display font and the address, with a photo on the right when there is one.
 */
export async function shareImage({
  eyebrow,
  title,
  photo,
}: {
  eyebrow: string;
  title: string;
  /** An absolute photo address (a product photo), or null for the plain design. */
  photo?: string | null;
}): Promise<ImageResponse> {
  const { display, sans, logo } = await brandAssets();
  const long = title.length > 34;
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: MINT,
        color: DEEP,
        fontFamily: "Geist",
      }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- next/og draws plain <img> */}
        <img src={logo} width={137} height={120} alt="" />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 22,
              letterSpacing: 7,
              textTransform: "uppercase",
              color: DEEP_SOFT,
            }}
          >
            {eyebrow}
          </div>
          <div
            style={{
              marginTop: 18,
              fontFamily: "Cormorant Garamond",
              fontSize: long ? 64 : 80,
              lineHeight: 1.05,
            }}
          >
            {title}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", fontSize: 24, color: DEEP_SOFT }}>
          <div
            style={{ width: 48, height: 3, background: GOLD, marginRight: 18, display: "flex" }}
          />
          haircraft.in
        </div>
      </div>
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element -- next/og draws plain <img>
        <img
          src={photo}
          width={440}
          height={630}
          alt=""
          style={{ objectFit: "cover", width: 440, height: 630 }}
        />
      ) : (
        <div
          style={{
            width: 360,
            height: 630,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: DEEP,
          }}
        >
          <div
            style={{
              width: 220,
              height: 220,
              borderRadius: 999,
              border: `3px solid ${GOLD}`,
              display: "flex",
            }}
          />
        </div>
      )}
    </div>,
    {
      ...SHARE_SIZE,
      fonts: [
        { name: "Cormorant Garamond", data: display, style: "normal", weight: 500 },
        { name: "Geist", data: sans, style: "normal", weight: 500 },
      ],
    },
  );
}
