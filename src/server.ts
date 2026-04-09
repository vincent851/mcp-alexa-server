import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { AlexaApiClient } from "./alexa-client.js";
import { TokenManager } from "./auth.js";
import type { AlexaConfig } from "./types.js";
import { registerAllTools } from "./tools/index.js";

/**
 * Creates and configures the MCP server with all Alexa tools registered.
 *
 * @param config - Alexa OAuth credentials (client ID, secret, refresh token)
 * @param fetchFn - Optional fetch function override (useful for testing)
 * @returns Configured McpServer instance ready to connect a transport
 */
export function createServer(
  config: AlexaConfig,
  fetchFn?: typeof fetch
): McpServer {
  const server = new McpServer({
    name: "mcp-alexa-server",
    version: "1.0.0",
  });

  const tokenManager = new TokenManager(config, fetchFn);
  const alexaClient = new AlexaApiClient(tokenManager, fetchFn);

  registerAllTools(server, alexaClient);

  return server;
}

/**
 * Reads Alexa configuration from environment variables.
 * Throws descriptive errors if required variables are missing.
 */
export function getConfigFromEnv(): AlexaConfig {
  const clientId = process.env.ALEXA_CLIENT_ID;
  const clientSecret = process.env.ALEXA_CLIENT_SECRET;
  const refreshToken = process.env.ALEXA_REFRESH_TOKEN;

  const missing: string[] = [];
  if (!clientId) missing.push("ALEXA_CLIENT_ID");
  if (!clientSecret) missing.push("ALEXA_CLIENT_SECRET");
  if (!refreshToken) missing.push("ALEXA_REFRESH_TOKEN");

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}. ` +
        "See .env.example for the required configuration."
    );
  }

  return {
    clientId: clientId!,
    clientSecret: clientSecret!,
    refreshToken: refreshToken!,
  };
}
