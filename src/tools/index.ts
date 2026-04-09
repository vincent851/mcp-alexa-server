import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { AlexaApiClient } from "../alexa-client.js";
import { registerAnnouncementTools } from "./announcements.js";
import { registerNotificationTools } from "./notifications.js";
import { registerReminderTools } from "./reminders.js";
import { registerTimerTools } from "./timers.js";
import { registerListTools } from "./lists.js";
import { registerRoutineTools } from "./routines.js";

/**
 * Register all Alexa MCP tools on the given server.
 * Each tool category is registered in its own module for maintainability.
 */
export function registerAllTools(
  server: McpServer,
  client: AlexaApiClient
): void {
  registerAnnouncementTools(server, client);
  registerNotificationTools(server, client);
  registerReminderTools(server, client);
  registerTimerTools(server, client);
  registerListTools(server, client);
  registerRoutineTools(server, client);
}
