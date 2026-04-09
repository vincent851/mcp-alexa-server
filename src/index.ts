#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer, getConfigFromEnv } from "./server.js";

async function main(): Promise<void> {
  const config = getConfigFromEnv();
  const server = createServer(config);
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Server is now running and listening on stdio
  // It will exit when the transport is closed
}

main().catch((error) => {
  process.stderr.write(`Fatal error: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
