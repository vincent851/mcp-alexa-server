import { describe, it, expect, vi } from "vitest";
import { handleSendNotification } from "../../src/tools/notifications.js";
import type { AlexaApiClient } from "../../src/alexa-client.js";

function createMockClient(overrides: Partial<AlexaApiClient> = {}): AlexaApiClient {
  return {
    sendNotification: vi.fn().mockResolvedValue({}),
    ...overrides,
  } as unknown as AlexaApiClient;
}

describe("handleSendNotification", () => {
  it("should return success message on successful notification", async () => {
    const client = createMockClient();
    const result = await handleSendNotification(client, {
      text: "You have a package",
      unitIds: ["unit-1"],
      locale: "en-US",
    });

    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain("Notification sent successfully");
    expect(result.content[0].text).toContain("1 device(s)");
  });

  it("should call client.sendNotification with correct args", async () => {
    const client = createMockClient();
    await handleSendNotification(client, {
      text: "Alert",
      unitIds: ["u1", "u2"],
      locale: "fr-FR",
    });

    expect(client.sendNotification).toHaveBeenCalledWith("Alert", ["u1", "u2"], "fr-FR");
  });

  it("should return error result on client failure", async () => {
    const client = createMockClient({
      sendNotification: vi.fn().mockRejectedValue(new Error("API error")),
    });

    const result = await handleSendNotification(client, {
      text: "Test",
      unitIds: ["u1"],
      locale: "en-US",
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Failed to send notification");
    expect(result.content[0].text).toContain("API error");
  });

  it("should handle non-Error thrown values", async () => {
    const client = createMockClient({
      sendNotification: vi.fn().mockRejectedValue(42),
    });

    const result = await handleSendNotification(client, {
      text: "Test",
      unitIds: ["u1"],
      locale: "en-US",
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("42");
  });
});
