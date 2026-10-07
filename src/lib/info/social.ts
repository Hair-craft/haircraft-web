const NAMES: Record<string, string> = {
  "instagram.com": "Instagram",
  "facebook.com": "Facebook",
  "youtube.com": "YouTube",
  "pinterest.com": "Pinterest",
  "x.com": "X",
  "twitter.com": "X",
  "linkedin.com": "LinkedIn",
  "threads.net": "Threads",
};

/** "https://www.instagram.com/haircraft" → "Instagram" (or the site's own name). */
export function socialName(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^(www|m)\./, "");
    return NAMES[host] ?? host;
  } catch {
    return url;
  }
}
