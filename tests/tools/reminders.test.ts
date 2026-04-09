import { describe, it, expect, vi } from "vitest";
import {
  handleCreateReminder,
  handleGetReminders,
  handleDeleteReminder,
} from "../../src/tools/reminders.js";
import type { AlexaApiClient } from "../../src/alexa-client.js";

function createMockClient(overrides: Partial<AlexaApiClient> = {}): AlexaApiClient {
  return {
    createReminder: vi.fn().mockResolvedValue({
      alertToken: "token-abc",
      createdTime: "2024-01-01T00:00:00Z",
      updatedTime: "2024-01-01T00:00:00Z",
      status: "ON",
    }),
    getReminders: vi.fn().mockResolvedValue({
      totalCount: 0,
      alerts: [],
    }),
    deleteReminder: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as AlexaApiClient;
}

describe("handleCreateReminder", () => {
  it("should return success with alert token", async () => {
    const client = createMockClient();
    const result = await handleCreateReminder(client, {
      text: "Buy milk",
      scheduledTime: "2024-12-25T09:00:00",
      timeZoneId: "America/New_York",
      locale: "en-US",
    });

    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain("Reminder created successfully");
    expect(result.content[0].text).toContain("token-abc");
    expect(result.content[0].text).toContain("Buy milk");
  });

  it("should pass correct args to client", async () => {
    const client = createMockClient();
    await handleCreateReminder(client, {
      text: "Dentist",
      scheduledTime: "2024-06-01T14:00:00",
      timeZoneId: "Europe/London",
      locale: "en-GB",
    });

    expect(client.createReminder).toHaveBeenCalledWith(
      "Dentist",
      "2024-06-01T14:00:00",
      "Europe/London",
      "en-GB"
    );
  });

  it("should return error on failure", async () => {
    const client = createMockClient({
      createReminder: vi.fn().mockRejectedValue(new Error("Permission denied")),
    });

    const result = await handleCreateReminder(client, {
      text: "Test",
      scheduledTime: "2024-01-01T00:00:00",
      timeZoneId: "UTC",
      locale: "en-US",
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Failed to create reminder");
    expect(result.content[0].text).toContain("Permission denied");
  });

  it("should handle non-Error thrown values", async () => {
    const client = createMockClient({
      createReminder: vi.fn().mockRejectedValue("oops"),
    });

    const result = await handleCreateReminder(client, {
      text: "Test",
      scheduledTime: "2024-01-01T00:00:00",
      timeZoneId: "UTC",
      locale: "en-US",
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("oops");
  });
});

describe("handleGetReminders", () => {
  it("should return 'no reminders' when list is empty", async () => {
    const client = createMockClient();
    const result = await handleGetReminders(client);

    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toBe("No reminders found.");
  });

  it("should format reminders list", async () => {
    const client = createMockClient({
      getReminders: vi.fn().mockResolvedValue({
        totalCount: 2,
        alerts: [
          { alertToken: "t1", status: "ON", createdTime: "2024-01-01T00:00:00Z" },
          { alertToken: "t2", status: "COMPLETED", createdTime: "2024-01-02T00:00:00Z" },
        ],
      }),
    });

    const result = await handleGetReminders(client);

    expect(result.content[0].text).toContain("Found 2 reminder(s)");
    expect(result.content[0].text).toContain("[t1]");
    expect(result.content[0].text).toContain("[t2]");
    expect(result.content[0].text).toContain("Status: ON");
    expect(result.content[0].text).toContain("Status: COMPLETED");
  });

  it("should return error on failure", async () => {
    const client = createMockClient({
      getReminders: vi.fn().mockRejectedValue(new Error("Timeout")),
    });

    const result = await handleGetReminders(client);

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Failed to get reminders");
  });

  it("should handle non-Error thrown values", async () => {
    const client = createMockClient({
      getReminders: vi.fn().mockRejectedValue(null),
    });

    const result = await handleGetReminders(client);

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("null");
  });
});

describe("handleDeleteReminder", () => {
  it("should return success message", async () => {
    const client = createMockClient();
    const result = await handleDeleteReminder(client, { alertToken: "token-abc" });

    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain("token-abc");
    expect(result.content[0].text).toContain("deleted successfully");
  });

  it("should call client with correct token", async () => {
    const client = createMockClient();
    await handleDeleteReminder(client, { alertToken: "xyz" });

    expect(client.deleteReminder).toHaveBeenCalledWith("xyz");
  });

  it("should return error on failure", async () => {
    const client = createMockClient({
      deleteReminder: vi.fn().mockRejectedValue(new Error("Not found")),
    });

    const result = await handleDeleteReminder(client, { alertToken: "bad" });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Failed to delete reminder");
  });

  it("should handle non-Error thrown values", async () => {
    const client = createMockClient({
      deleteReminder: vi.fn().mockRejectedValue(undefined),
    });

    const result = await handleDeleteReminder(client, { alertToken: "bad" });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("undefined");
  });
});
