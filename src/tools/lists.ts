import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { AlexaApiClient } from "../alexa-client.js";
import type { ToolResult } from "../types.js";

export const getListItemsSchema = {
  listId: z.string().min(1).describe("The ID of the list to get items from"),
  status: z
    .string()
    .default("active")
    .describe("Filter by item status: 'active' or 'completed'"),
};

export const addListItemSchema = {
  listId: z.string().min(1).describe("The ID of the list to add the item to"),
  value: z.string().min(1).max(256).describe("The text value of the list item"),
  status: z
    .enum(["active", "completed"])
    .default("active")
    .describe("Initial status of the item"),
};

export const updateListItemSchema = {
  listId: z.string().min(1).describe("The list ID"),
  itemId: z.string().min(1).describe("The item ID to update"),
  value: z.string().min(1).max(256).describe("New text value for the item"),
  status: z.enum(["active", "completed"]).describe("New status for the item"),
  version: z.number().int().min(0).describe("Current version of the item (for optimistic locking)"),
};

export const deleteListItemSchema = {
  listId: z.string().min(1).describe("The list ID"),
  itemId: z.string().min(1).describe("The item ID to delete"),
};

export async function handleGetLists(
  client: AlexaApiClient
): Promise<ToolResult> {
  try {
    const result = await client.getLists();
    if (!result.lists || result.lists.length === 0) {
      return {
        content: [{ type: "text", text: "No lists found." }],
      };
    }
    const lines = result.lists.map(
      (l) => `- [${l.listId}] "${l.name}" (state: ${l.state})`
    );
    return {
      content: [
        {
          type: "text",
          text: `Found ${result.lists.length} list(s):\n${lines.join("\n")}`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Failed to get lists: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
}

export async function handleGetListItems(
  client: AlexaApiClient,
  args: { listId: string; status: string }
): Promise<ToolResult> {
  try {
    const result = await client.getListItems(args.listId, args.status);
    if (!result.items || result.items.length === 0) {
      return {
        content: [
          { type: "text", text: `No ${args.status} items found in list.` },
        ],
      };
    }
    const lines = result.items.map(
      (i) =>
        `- [${i.id}] "${i.value}" (status: ${i.status}, v${i.version})`
    );
    return {
      content: [
        {
          type: "text",
          text: `Found ${result.items.length} item(s):\n${lines.join("\n")}`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Failed to get list items: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
}

export async function handleAddListItem(
  client: AlexaApiClient,
  args: { listId: string; value: string; status: "active" | "completed" }
): Promise<ToolResult> {
  try {
    await client.addListItem(args.listId, args.value, args.status);
    return {
      content: [
        {
          type: "text",
          text: `Item "${args.value}" added to list successfully.`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Failed to add list item: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
}

export async function handleUpdateListItem(
  client: AlexaApiClient,
  args: {
    listId: string;
    itemId: string;
    value: string;
    status: "active" | "completed";
    version: number;
  }
): Promise<ToolResult> {
  try {
    await client.updateListItem(
      args.listId,
      args.itemId,
      args.value,
      args.status,
      args.version
    );
    return {
      content: [
        {
          type: "text",
          text: `List item ${args.itemId} updated successfully.`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Failed to update list item: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
}

export async function handleDeleteListItem(
  client: AlexaApiClient,
  args: { listId: string; itemId: string }
): Promise<ToolResult> {
  try {
    await client.deleteListItem(args.listId, args.itemId);
    return {
      content: [
        {
          type: "text",
          text: `List item ${args.itemId} deleted successfully.`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Failed to delete list item: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
}

export function registerListTools(
  server: McpServer,
  client: AlexaApiClient
): void {
  server.tool(
    "get_lists",
    "Get all Alexa household lists (shopping lists, to-do lists, etc.).",
    async () => handleGetLists(client)
  );

  server.tool(
    "get_list_items",
    "Get items from a specific Alexa list.",
    getListItemsSchema,
    async (args) => handleGetListItems(client, args)
  );

  server.tool(
    "add_list_item",
    "Add a new item to an Alexa list.",
    addListItemSchema,
    async (args) => handleAddListItem(client, args)
  );

  server.tool(
    "update_list_item",
    "Update an existing item in an Alexa list.",
    updateListItemSchema,
    async (args) => handleUpdateListItem(client, args)
  );

  server.tool(
    "delete_list_item",
    "Delete an item from an Alexa list.",
    deleteListItemSchema,
    async (args) => handleDeleteListItem(client, args)
  );
}
