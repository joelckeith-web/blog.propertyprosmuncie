/**
 * Google Indexing API — ping Google to index new blog posts immediately.
 *
 * Requires a Google Cloud service account with the Indexing API enabled.
 * The service account email must be added as an owner in Google Search Console.
 *
 * Environment variables:
 * - GOOGLE_INDEXING_CLIENT_EMAIL: Service account email
 * - GOOGLE_INDEXING_PRIVATE_KEY: Service account private key (PEM format)
 *
 * Docs: https://developers.google.com/search/apis/indexing-api/v3/quickstart
 */

const INDEXING_API_URL =
  "https://indexing.googleapis.com/v3/urlNotifications:publish";

const TOKEN_URL = "https://oauth2.googleapis.com/token";

interface IndexingResult {
  success: boolean;
  url: string;
  error?: string;
}

/**
 * Notify Google Indexing API that a new URL has been published.
 * Returns silently if credentials are not configured (optional feature).
 */
export async function notifyGoogleIndexing(
  pageUrl: string
): Promise<IndexingResult> {
  const clientEmail = process.env.GOOGLE_INDEXING_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_INDEXING_PRIVATE_KEY;

  if (!clientEmail || !privateKey) {
    console.log(
      "ℹ️ Google Indexing API not configured — skipping index ping."
    );
    return { success: false, url: pageUrl, error: "Not configured" };
  }

  try {
    // Step 1: Get an access token via JWT
    const accessToken = await getAccessToken(clientEmail, privateKey);

    // Step 2: Send the indexing request
    const response = await fetch(INDEXING_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: pageUrl,
        type: "URL_UPDATED",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `❌ Google Indexing API error: ${response.status} ${errorText}`
      );
      return {
        success: false,
        url: pageUrl,
        error: `HTTP ${response.status}: ${errorText}`,
      };
    }

    console.log(`✅ Google Indexing API notified for: ${pageUrl}`);
    return { success: true, url: pageUrl };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error(`❌ Google Indexing API failed: ${msg}`);
    return { success: false, url: pageUrl, error: msg };
  }
}

/**
 * Get an OAuth2 access token using a service account JWT.
 * This avoids needing the googleapis npm package.
 */
async function getAccessToken(
  clientEmail: string,
  privateKey: string
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  // Build JWT header + claims
  const header = { alg: "RS256", typ: "JWT" };
  const claims = {
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/indexing",
    aud: TOKEN_URL,
    iat: now,
    exp: now + 3600,
  };

  // Encode + sign the JWT
  const encodedHeader = base64url(JSON.stringify(header));
  const encodedClaims = base64url(JSON.stringify(claims));
  const signatureInput = `${encodedHeader}.${encodedClaims}`;

  const signature = await signRS256(signatureInput, privateKey);
  const jwt = `${signatureInput}.${signature}`;

  // Exchange JWT for access token
  const tokenRes = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!tokenRes.ok) {
    throw new Error(
      `Token exchange failed: ${tokenRes.status} ${await tokenRes.text()}`
    );
  }

  const tokenData = await tokenRes.json();
  return tokenData.access_token;
}

/**
 * Sign a string with RS256 using the service account private key.
 * Uses Node.js crypto module.
 */
async function signRS256(
  input: string,
  privateKeyPem: string
): Promise<string> {
  // Handle escaped newlines from env vars
  const key = privateKeyPem.replace(/\\n/g, "\n");

  const { createSign } = await import("crypto");
  const signer = createSign("RSA-SHA256");
  signer.update(input);
  signer.end();

  const signatureBuffer = signer.sign(key);
  return base64url(signatureBuffer);
}

function base64url(input: string | Buffer): string {
  const buf =
    typeof input === "string" ? Buffer.from(input, "utf-8") : input;
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}
