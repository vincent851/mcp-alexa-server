import { describe, it, expect, vi, beforeEach } from "vitest";
import { TokenManager } from "../src/auth.js";
import { AMAZON_TOKEN_URL } from "../src/types.js";

const TEST_CONFIG = {
  clientId: "test-client-id",
  clientSecret: "test-client-secret",
  refreshToken: "test-refresh-token",
};

function createMockFetch(responseData: unknown, status = 200): typeof fetch {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(responseData),
    text: () => Promise.resolve(JSON.stringify(responseData)),
  }) as unknown as typeof fetch;
}

describe("TokenManager", () => {
  let tokenManager: TokenManager;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          access_token: "mock-access-token",
          token_type: "bearer",
          expires_in: 3600,
        }),
      text: () => Promise.resolve(""),
    });
    tokenManager = new TokenManager(TEST_CONFIG, mockFetch as unknown as typeof fetch);
  });

  describe("getAccessToken", () => {
    it("should refresh token on first call", async () => {
      const token = await tokenManager.getAccessToken();
      expect(token).toBe("mock-access-token");
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("should return cached token on subsequent calls", async () => {
      const token1 = await tokenManager.getAccessToken();
      const token2 = await tokenManager.getAccessToken();
      expect(token1).toBe("mock-access-token");
      expect(token2).toBe("mock-access-token");
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("should refresh when token is expired", async () => {
      // Get initial token
      await tokenManager.getAccessToken();

      // Simulate expiry by clearing
      tokenManager.clearToken();

      // Should trigger another refresh
      await tokenManager.getAccessToken();
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe("refreshAccessToken", () => {
    it("should call Amazon token endpoint with correct parameters", async () => {
      await tokenManager.refreshAccessToken();

      expect(mockFetch).toHaveBeenCalledWith(AMAZON_TOKEN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: expect.stringContaining("grant_type=refresh_token"),
      });

      const callArgs = mockFetch.mock.calls[0];
      const body = callArgs[1].body as string;
      expect(body).toContain(`client_id=${TEST_CONFIG.clientId}`);
      expect(body).toContain(`client_secret=${TEST_CONFIG.clientSecret}`);
      expect(body).toContain(`refresh_token=${TEST_CONFIG.refreshToken}`);
    });

    it("should throw on non-OK response", async () => {
      const errorFetch = createMockFetch({ error: "invalid_grant" }, 400);
      const tm = new TokenManager(TEST_CONFIG, errorFetch);

      await expect(tm.refreshAccessToken()).rejects.toThrow(
        "Token refresh failed (400)"
      );
    });

    it("should update the cached token after refresh", async () => {
      const token = await tokenManager.refreshAccessToken();
      expect(token).toBe("mock-access-token");
      expect(tokenManager.hasValidToken()).toBe(true);
    });
  });

  describe("hasValidToken", () => {
    it("should return false when no token is cached", () => {
      expect(tokenManager.hasValidToken()).toBe(false);
    });

    it("should return true after a successful refresh", async () => {
      await tokenManager.getAccessToken();
      expect(tokenManager.hasValidToken()).toBe(true);
    });

    it("should return false after clearToken", async () => {
      await tokenManager.getAccessToken();
      tokenManager.clearToken();
      expect(tokenManager.hasValidToken()).toBe(false);
    });
  });

  describe("clearToken", () => {
    it("should clear cached token and expiry", async () => {
      await tokenManager.getAccessToken();
      tokenManager.clearToken();
      expect(tokenManager.hasValidToken()).toBe(false);

      // Next getAccessToken call should trigger a refresh
      await tokenManager.getAccessToken();
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe("constructor", () => {
    it("should accept config and use provided fetch", async () => {
      const customFetch = createMockFetch({
        access_token: "custom-token",
        token_type: "bearer",
        expires_in: 1800,
      });
      const tm = new TokenManager(TEST_CONFIG, customFetch);
      const token = await tm.getAccessToken();
      expect(token).toBe("custom-token");
      expect(customFetch).toHaveBeenCalled();
    });
  });
});
