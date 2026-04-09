import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { AlexaApiClient } from "../alexa-client.js";
import type { ToolResult } from "../types.js";

export const createReminderSchema = {
  text: z.string().min(1).max(4096).describe("The reminder text Alexa will speak"),
  scheduledTime: z
    .string()
    .min(1)
    .describe("ISO 8601 datetime for the reminder (e.g. 2024-12-25T09:00:00)"),
  timeZoneId: z
    .string()
    .min(1)
    .describe("IANA time zone ID (e.g. America/New_York, Europe/London)"),
  locale: z
    .string()
    .default("en-US")
    .describe("Locale for the reminder text"),
};

export const deleteReminderSchema = {
  alertToken: z
    .string()
    .min(1)
    .describe("The alert token of the reminder to delete"),
};

export async function handleCreateReminder(
  client: AlexaApiClient,
  args: { text: string; scheduledTime: string; timeZoneId: string; locale: string }
): Promise<ToolResult> {
  try {
    const result = await client.createReminder(
      args.text,
      args.scheduledTime,
      args.timeZoneId,
      args.locale
    );
    return {
      content: [
        {
          type: "text",
          text: `Reminder created successfully.\nAlert Token: ${result.alertToken}\nScheduled: ${args.scheduledTime} (${args.timeZoneId})\nText: "${args.text}"`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Failed to create reminder: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
}

export async function handleGetReminders(
  client: AlexaApiClient
): Promise<ToolResult> {
  try {
    const result = await client.getReminders();
    if (result.totalCount === 0) {
      return {
        content: [{ type: "text", text: "No reminders found." }],
      };
    }
    const lines = result.alerts.map(
      (r) => `- [${r.alertToken}] Status: ${r.status}, Created: ${r.createdTime}`
    );
    return {
      content: [
        {
          type: "text",
          text: `Found ${result.totalCount} reminder(s):\n${lines.join("\n")}`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Failed to get reminders: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
}

export async function handleDeleteReminder(
  client: AlexaApiClient,
  args: { alertToken: string }
): Promise<ToolResult> {
  try {
    await client.deleteReminder(args.alertToken);
    return {
      content: [
        {
          type: "text",
          text: `Reminder ${args.alertToken} deleted successfully.`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Failed to delete reminder: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
}

export function registerReminderTools(
  server: McpServer,
  client: AlexaApiClient
): void {
  server.tool(
    "create_reminder",
    "Create a new reminder on Alexa. Alexa will speak the reminder text at the scheduled time.",
    createReminderSchema,
    async (args) => handleCreateReminder(client, args)
  );

  server.tool(
    "get_reminders",
    "Get all existing Alexa reminders.",
    async () => handleGetReminders(client)
  );

  server.tool(
    "delete_reminder",
    "Delete an existing Alexa reminder by its alert token.",
    deleteReminderSchema,
    async (args) => handleDeleteReminder(client, args)
  );
}
