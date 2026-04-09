import { describe, it, expect, vi } from "vitest";
import {
  handleGetLists,
  handleGetListItems,
  handleAddListItem,
  handleUpdateListItem,
  handleDeleteListItem,
} from "../../src/tools/lists.js";
import type { AlexaApiClient } from "../../src/alexa-client.js";

function createMockClient(overrides: Partial<AlexaApiClient> = {}): AlexaApiClient {
  return {
    getLists: vi.fn().mockResolvedValue({ lists: [] }),
    getListItems: vi.fn().mockResolvedValue({ listId: "l1", items: [] }),
    addListItem: vi.fn().mockResolvedValue({}),
    updateListItem: vi.fn().mockResolvedValue({}),
    deleteListItem: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as AlexaApiClient;
}

describe("handleGetLists", () => {
  it("should return 'no lists' when empty", async () => {
    const client = createMockClient();
    const result = await handleGetLists(client);

    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toBe("No lists found.");
  });

  it("should handle null lists array", async () => {
    const client = createMockClient({
      getLists: vi.fn().mockResolvedValue({ lists: null }),
    });
    const result = await handleGetLists(client);

    expect(result.content[0].text).toBe("No lists found.");
  });

  it("should format lists", async () => {
    const client = createMockClient({
      getLists: vi.fn().mockResolvedValue({
        lists: [
          { listId: "l1", name: "Shopping", state: "active" },
          { listId: "l2", name: "To-Do", state: "active" },
        ],
      }),
    });

    const result = await handleGetLists(client);

    expect(result.content[0].text).toContain("Found 2 list(s)");
    expect(result.content[0].text).toContain('[l1] "Shopping"');
    expect(result.content[0].text).toContain('[l2] "To-Do"');
  });

  it("should return error on failure", async () => {
    const client = createMockClient({
      getLists: vi.fn().mockRejectedValue(new Error("Unauthorized")),
    });

    const result = await handleGetLists(client);

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Failed to get lists");
  });

  it("should handle non-Error thrown values", async () => {
    const client = createMockClient({
      getLists: vi.fn().mockRejectedValue(false),
    });

    const result = await handleGetLists(client);

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("false");
  });
});

describe("handleGetListItems", () => {
  it("should return 'no items' when empty", async () => {
    const client = createMockClient();
    const result = await handleGetListItems(client, {
      listId: "l1",
      status: "active",
    });

    expect(result.content[0].text).toContain("No active items found");
  });

  it("should handle null items array", async () => {
    const client = createMockClient({
      getListItems: vi.fn().mockResolvedValue({ listId: "l1", items: null }),
    });
    const result = await handleGetListItems(client, {
      listId: "l1",
      status: "active",
    });

    expect(result.content[0].text).toContain("No active items found");
  });

  it("should format items list", async () => {
    const client = createMockClient({
      getListItems: vi.fn().mockResolvedValue({
        listId: "l1",
        items: [
          { id: "i1", value: "Milk", status: "active", version: 1, createdTime: "", updatedTime: "" },
          { id: "i2", value: "Bread", status: "active", version: 2, createdTime: "", updatedTime: "" },
        ],
      }),
    });

    const result = await handleGetListItems(client, {
      listId: "l1",
      status: "active",
    });

    expect(result.content[0].text).toContain("Found 2 item(s)");
    expect(result.content[0].text).toContain('[i1] "Milk"');
    expect(result.content[0].text).toContain('[i2] "Bread"');
  });

  it("should call client with correct args", async () => {
    const client = createMockClient();
    await handleGetListItems(client, { listId: "list-99", status: "completed" });

    expect(client.getListItems).toHaveBeenCalledWith("list-99", "completed");
  });

  it("should return error on failure", async () => {
    const client = createMockClient({
      getListItems: vi.fn().mockRejectedValue(new Error("Not found")),
    });

    const result = await handleGetListItems(client, {
      listId: "bad",
      status: "active",
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Failed to get list items");
  });

  it("should handle non-Error thrown values", async () => {
    const client = createMockClient({
      getListItems: vi.fn().mockRejectedValue(123),
    });

    const result = await handleGetListItems(client, {
      listId: "l1",
      status: "active",
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("123");
  });
});

describe("handleAddListItem", () => {
  it("should return success message", async () => {
    const client = createMockClient();
    const result = await handleAddListItem(client, {
      listId: "l1",
      value: "Eggs",
      status: "active",
    });

    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('"Eggs" added to list');
  });

  it("should call client with correct args", async () => {
    const client = createMockClient();
    await handleAddListItem(client, {
      listId: "l1",
      value: "Butter",
      status: "completed",
    });

    expect(client.addListItem).toHaveBeenCalledWith("l1", "Butter", "completed");
  });

  it("should return error on failure", async () => {
    const client = createMockClient({
      addListItem: vi.fn().mockRejectedValue(new Error("Quota exceeded")),
    });

    const result = await handleAddListItem(client, {
      listId: "l1",
      value: "Test",
      status: "active",
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Failed to add list item");
  });

  it("should handle non-Error thrown values", async () => {
    const client = createMockClient({
      addListItem: vi.fn().mockRejectedValue(null),
    });

    const result = await handleAddListItem(client, {
      listId: "l1",
      value: "Test",
      status: "active",
    });

    expect(result.isError).toBe(true);
  });
});

describe("handleUpdateListItem", () => {
  it("should return success message", async () => {
    const client = createMockClient();
    const result = await handleUpdateListItem(client, {
      listId: "l1",
      itemId: "i1",
      value: "Updated",
      status: "completed",
      version: 1,
    });

    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain("i1 updated successfully");
  });

  it("should call client with correct args", async () => {
    const client = createMockClient();
    await handleUpdateListItem(client, {
      listId: "l1",
      itemId: "i1",
      value: "New value",
      status: "active",
      version: 3,
    });

    expect(client.updateListItem).toHaveBeenCalledWith(
      "l1",
      "i1",
      "New value",
      "active",
      3
    );
  });

  it("should return error on failure", async () => {
    const client = createMockClient({
      updateListItem: vi.fn().mockRejectedValue(new Error("Conflict")),
    });

    const result = await handleUpdateListItem(client, {
      listId: "l1",
      itemId: "i1",
      value: "Test",
      status: "active",
      version: 1,
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Failed to update list item");
  });

  it("should handle non-Error thrown values", async () => {
    const client = createMockClient({
      updateListItem: vi.fn().mockRejectedValue(undefined),
    });

    const result = await handleUpdateListItem(client, {
      listId: "l1",
      itemId: "i1",
      value: "Test",
      status: "active",
      version: 1,
    });

    expect(result.isError).toBe(true);
  });
});

describe("handleDeleteListItem", () => {
  it("should return success message", async () => {
    const client = createMockClient();
    const result = await handleDeleteListItem(client, {
      listId: "l1",
      itemId: "i1",
    });

    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain("i1 deleted successfully");
  });

  it("should call client with correct args", async () => {
    const client = createMockClient();
    await handleDeleteListItem(client, { listId: "l1", itemId: "i1" });

    expect(client.deleteListItem).toHaveBeenCalledWith("l1", "i1");
  });

  it("should return error on failure", async () => {
    const client = createMockClient({
      deleteListItem: vi.fn().mockRejectedValue(new Error("Not found")),
    });

    const result = await handleDeleteListItem(client, {
      listId: "l1",
      itemId: "bad",
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Failed to delete list item");
  });

  it("should handle non-Error thrown values", async () => {
    const client = createMockClient({
      deleteListItem: vi.fn().mockRejectedValue("error string"),
    });

    const result = await handleDeleteListItem(client, {
      listId: "l1",
      itemId: "bad",
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("error string");
  });
});
