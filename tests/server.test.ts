import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createServer, getConfigFromEnv } from "../src/server.js";

describe("createServer", () => {
  it("should create a McpServer instance", () => {
    const mockFetch = vi.fn() as unknown as typeof fetch;
    const server = createServer(
      {
        clientId: "id",
        clientSecret: "secret",
        refreshToken: "token",
      },
      mockFetch
    );

    expect(server).toBeDefined();
  });

  it("should create server without custom fetch", () => {
    const server = createServer({
      clientId: "id",
      clientSecret: "secret",
      refreshToken: "token",
    });

    expect(server).toBeDefined();
  });
});

describe("getConfigFromEnv", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should return config from environment variables", () => {
    process.env.ALEXA_CLIENT_ID = "test-id";
    process.env.ALEXA_CLIENT_SECRET = "test-secret";
    process.env.ALEXA_REFRESH_TOKEN = "test-token";

    const config = getConfigFromEnv();

    expect(config).toEqual({
      clientId: "test-id",
      clientSecret: "test-secret",
      refreshToken: "test-token",
    });
  });

  it("should throw when ALEXA_CLIENT_ID is missing", () => {
    process.env.ALEXA_CLIENT_SECRET = "secret";
    process.env.ALEXA_REFRESH_TOKEN = "token";
    delete process.env.ALEXA_CLIENT_ID;

    expect(() => getConfigFromEnv()).toThrow("ALEXA_CLIENT_ID");
  });

  it("should throw when ALEXA_CLIENT_SECRET is missing", () => {
    process.env.ALEXA_CLIENT_ID = "id";
    process.env.ALEXA_REFRESH_TOKEN = "token";
    delete process.env.ALEXA_CLIENT_SECRET;

    expect(() => getConfigFromEnv()).toThrow("ALEXA_CLIENT_SECRET");
  });

  it("should throw when ALEXA_REFRESH_TOKEN is missing", () => {
    process.env.ALEXA_CLIENT_ID = "id";
    process.env.ALEXA_CLIENT_SECRET = "secret";
    delete process.env.ALEXA_REFRESH_TOKEN;

    expect(() => getConfigFromEnv()).toThrow("ALEXA_REFRESH_TOKEN");
  });

  it("should list all missing variables in error message", () => {
    delete process.env.ALEXA_CLIENT_ID;
    delete process.env.ALEXA_CLIENT_SECRET;
    delete process.env.ALEXA_REFRESH_TOKEN;

    expect(() => getConfigFromEnv()).toThrow(
      "Missing required environment variables: ALEXA_CLIENT_ID, ALEXA_CLIENT_SECRET, ALEXA_REFRESH_TOKEN"
    );
  });

  it("should mention .env.example in error message", () => {
    delete process.env.ALEXA_CLIENT_ID;
    delete process.env.ALEXA_CLIENT_SECRET;
    delete process.env.ALEXA_REFRESH_TOKEN;

    expect(() => getConfigFromEnv()).toThrow(".env.example");
  });

  it("should treat empty string as missing", () => {
    process.env.ALEXA_CLIENT_ID = "";
    process.env.ALEXA_CLIENT_SECRET = "secret";
    process.env.ALEXA_REFRESH_TOKEN = "token";

    expect(() => getConfigFromEnv()).toThrow("ALEXA_CLIENT_ID");
  });
});
