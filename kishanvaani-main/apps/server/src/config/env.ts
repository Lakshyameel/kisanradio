import "dotenv/config";

/**
 * Sanitizes an environment variable value:
 * - Trims whitespace
 * - Strips surrounding single or double quotes
 */
function sanitizeEnvValue(val: string | undefined): string {
  if (!val) return "";
  let clean = val.trim();
  if (
    (clean.startsWith('"') && clean.endsWith('"')) ||
    (clean.startsWith("'") && clean.endsWith("'"))
  ) {
    clean = clean.slice(1, -1).trim();
  }
  return clean;
}

// Read once at startup
const rawDataGovKey = sanitizeEnvValue(process.env.DATA_GOV_IN_API_KEY);

/**
 * Returns the sanitized data.gov.in API key, or empty string if unset.
 */
export function getDataGovKey(): string {
  return rawDataGovKey;
}

/**
 * Returns true if a non-empty data.gov.in API key is configured.
 */
export function hasDataGovKey(): boolean {
  return rawDataGovKey.length > 0;
}

/**
 * Redacts api-key parameter from a URL string or object, replacing value with '***'.
 */
export function redactUrlApiKey(urlStr: string): string {
  try {
    const parsed = new URL(urlStr);
    if (parsed.searchParams.has("api-key")) {
      parsed.searchParams.set("api-key", "***");
      return parsed.toString();
    }
    return urlStr;
  } catch {
    return urlStr.replace(/([?&]api-key=)[^&]*/gi, "$1***");
  }
}
