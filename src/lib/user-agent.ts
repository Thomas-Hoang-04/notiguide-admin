export function parseUserAgent(
  ua: string | null,
): { browser: string; os: string; isMobile: boolean } {
  if (!ua) {
    return { browser: "Unknown", os: "Unknown", isMobile: false }
  }

  const browser = detectBrowser(ua)
  const os = detectOS(ua)
  const isMobile = /Mobile|Android|iPhone/.test(ua)

  return { browser, os, isMobile }
}

function detectBrowser(ua: string): string {
  if (/Edg\//.test(ua)) return "Edge"
  if (/OPR\/|Opera\//.test(ua)) return "Opera"
  if (/Chrome\//.test(ua)) return "Chrome"
  if (/Firefox\//.test(ua)) return "Firefox"
  if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) return "Safari"
  return "Unknown"
}

function detectOS(ua: string): string {
  if (/Android/.test(ua)) return "Android"
  if (/iPhone|iPad|iPod/.test(ua)) return "iOS"
  if (/Windows/.test(ua)) return "Windows"
  if (/Mac OS X|Macintosh/.test(ua)) return "macOS"
  if (/Linux/.test(ua)) return "Linux"
  return "Unknown"
}
