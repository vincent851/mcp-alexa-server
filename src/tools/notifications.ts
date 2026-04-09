import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { AlexaApiClient } from "../alexa-client.js";
import type { ToolResult } from "../types.js";

export const sendNotificationSchema = {
  text: z.string().min(1).max(4096).describe("The notification text content"),
  unitIds: z
    .array(z.string().min(1))
    .min(1)
    .describe("Array of Alexa unit/device IDs to send the notification to"),
  locale: z
    .string()
    .default("en-US")
    .describe("Locale for the notification (e.g. en-US, en-GB)"),
};

export async function handleSendNotification(
  client: AlexaApiClient,
  args: { text: string; unitIds: string[]; locale: string }
): Promise<ToolResult> {
  try {
    await client.sendNotification(args.text, args.unitIds, args.locale);
    return {
      content: [
        {
          type: "text",
          text: `Notification sent successfully to ${args.unitIds.length} device(s): "${args.text}"`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Failed to send notification: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
}

export function registerNotificationTools(
  server: McpServer,
  client: AlexaApiClient
): void {
  server.tool(
    "send_notification",
    "Send a notification to Alexa devices. Shows visual notification and plays audio chime.",
    sendNotificationSchema,
    async (args) => handleSendNotification(client, args)
  );
}
