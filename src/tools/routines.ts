import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { AlexaApiClient } from "../alexa-client.js";
import type { ToolResult } from "../types.js";

export const triggerRoutineSchema = {
  utterance: z
    .string()
    .min(1)
    .max(1024)
    .describe(
      "The utterance text to trigger the routine (must match a configured custom trigger)"
    ),
};

export async function handleTriggerRoutine(
  client: AlexaApiClient,
  args: { utterance: string }
): Promise<ToolResult> {
  try {
    await client.triggerRoutine(args.utterance);
    return {
      content: [
        {
          type: "text",
          text: `Routine triggered successfully with utterance: "${args.utterance}"`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Failed to trigger routine: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
}

export function registerRoutineTools(
  server: McpServer,
  client: AlexaApiClient
): void {
  server.tool(
    "trigger_routine",
    "Trigger an Alexa routine using a custom trigger utterance. The routine must be pre-configured in the Alexa app.",
    triggerRoutineSchema,
    async (args) => handleTriggerRoutine(client, args)
  );
}
