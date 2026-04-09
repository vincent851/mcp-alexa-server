import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { AlexaApiClient } from "../alexa-client.js";
import type { ToolResult } from "../types.js";

export const createTimerSchema = {
  duration: z
    .string()
    .min(1)
    .describe("ISO 8601 duration (e.g. PT5M for 5 minutes, PT1H30M for 1.5 hours)"),
  label: z
    .string()
    .optional()
    .describe("Optional label for the timer"),
  announceText: z
    .string()
    .optional()
    .describe("Optional text for Alexa to announce when the timer expires"),
  locale: z
    .string()
    .default("en-US")
    .describe("Locale for the announcement text"),
};

export const deleteTimerSchema = {
  timerId: z.string().min(1).describe("The ID of the timer to delete"),
};

export async function handleCreateTimer(
  client: AlexaApiClient,
  args: { duration: string; label?: string; announceText?: string; locale: string }
): Promise<ToolResult> {
  try {
    const result = await client.createTimer(
      args.duration,
      args.label,
      args.announceText,
      args.locale
    );
    return {
      content: [
        {
          type: "text",
          text: `Timer created successfully.\nID: ${result.id}\nDuration: ${result.duration}\nLabel: ${result.timerLabel ?? "none"}\nStatus: ${result.status}`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Failed to create timer: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
}

export async function handleDeleteTimer(
  client: AlexaApiClient,
  args: { timerId: string }
): Promise<ToolResult> {
  try {
    await client.deleteTimer(args.timerId);
    return {
      content: [
        {
          type: "text",
          text: `Timer ${args.timerId} deleted successfully.`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Failed to delete timer: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
}

export function registerTimerTools(
  server: McpServer,
  client: AlexaApiClient
): void {
  server.tool(
    "create_timer",
    "Create a new timer on Alexa. Optionally announce custom text when the timer expires.",
    createTimerSchema,
    async (args) => handleCreateTimer(client, args)
  );

  server.tool(
    "delete_timer",
    "Delete an existing Alexa timer by its ID.",
    deleteTimerSchema,
    async (args) => handleDeleteTimer(client, args)
  );
}
