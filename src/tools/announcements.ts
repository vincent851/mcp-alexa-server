import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { AlexaApiClient } from "../alexa-client.js";
import type { ToolResult } from "../types.js";

export const sendAnnouncementSchema = {
  text: z.string().min(1).max(4096).describe("The text for Alexa to speak aloud"),
  unitIds: z
    .array(z.string().min(1))
    .min(1)
    .describe("Array of Alexa unit/device IDs to send the announcement to"),
  locale: z
    .string()
    .default("en-US")
    .describe("Locale for the announcement (e.g. en-US, en-GB)"),
};

export async function handleSendAnnouncement(
  client: AlexaApiClient,
  args: { text: string; unitIds: string[]; locale: string }
): Promise<ToolResult> {
  try {
    await client.sendAnnouncement(args.text, args.unitIds, args.locale);
    return {
      content: [
        {
          type: "text",
          text: `Announcement sent successfully to ${args.unitIds.length} device(s): "${args.text}"`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Failed to send announcement: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
}

export function registerAnnouncementTools(
  server: McpServer,
  client: AlexaApiClient
): void {
  server.tool(
    "send_announcement",
    "Send a voice announcement to Alexa devices. Alexa will speak the provided text aloud.",
    sendAnnouncementSchema,
    async (args) => handleSendAnnouncement(client, args)
  );
}
