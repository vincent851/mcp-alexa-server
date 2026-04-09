import { AMAZON_TOKEN_URL, type AlexaConfig, type TokenResponse } from "./types.js";

/**
 * Manages OAuth access tokens for the Alexa API.
 * Handles token refresh using Login with Amazon (LWA) OAuth2 flow.
 * Only communicates with Amazon's official token endpoint.
 */
export class TokenManager {
  private accessToken: string | null = null;
  private expiresAt: number = 0;
  private config: AlexaConfig;
  private fetchFn: typeof fetch;

  constructor(config: AlexaConfig, fetchFn: typeof fetch = globalThis.fetch) {
    this.config = config;
    this.fetchFn = fetchFn;
  }

  /**
   * Returns a valid access token, refreshing if expired.
   * Tokens are refreshed 60 seconds before actual expiry for safety.
   */
  async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.expiresAt) {
      return this.accessToken;
    }
    return this.refreshAccessToken();
  }

  /**
   * Forces a token refresh using the stored refresh token.
   * Only communicates with AMAZON_TOKEN_URL (https://api.amazon.com/auth/o2/token).
   */
  async refreshAccessToken(): Promise<string> {
    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: this.config.refreshToken,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
    });

    const response = await this.fetchFn(AMAZON_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Token refresh failed (${response.status}): ${errorText}`
      );
    }

    const data = (await response.json()) as TokenResponse;

    this.accessToken = data.access_token;
    // Expire 60 seconds early to avoid edge cases
    this.expiresAt = Date.now() + (data.expires_in - 60) * 1000;

    return this.accessToken;
  }

  /** Check if we currently have a non-expired token cached */
  hasValidToken(): boolean {
    return this.accessToken !== null && Date.now() < this.expiresAt;
  }

  /** Clear the cached token (useful for testing or forced re-auth) */
  clearToken(): void {
    this.accessToken = null;
    this.expiresAt = 0;
  }
}
