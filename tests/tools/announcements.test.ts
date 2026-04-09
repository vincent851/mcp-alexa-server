import { describe, it, expect, vi } from "vitest";
import { handleSendAnnouncement } from "../../src/tools/announcements.js";
import type { AlexaApiClient } from "../../src/alexa-client.js";

function createMockClient(overrides: Partial<AlexaApiClient> = {}): AlexaApiClient {
  return {
    sendAnnouncement: vi.fn().mockResolvedValue({}),
    ...overrides,
  } as unknown as AlexaApiClient;
}

describe("handleSendAnnouncement", () => {
  it("should return success message on successful announcement", async () => {
    const client = createMockClient();
    const result = await handleSendAnnouncement(client, {
      text: "Hello everyone",
      unitIds: ["unit-1", "unit-2"],
      locale: "en-US",
    });

    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain("Announcement sent successfully");
    expect(result.content[0].text).toContain("2 device(s)");
    expect(result.content[0].text).toContain("Hello everyone");
  });

  it("should call client.sendAnnouncement with correct args", async () => {
    const client = createMockClient();
    await handleSendAnnouncement(client, {
      text: "Test",
      unitIds: ["u1"],
      locale: "en-GB",
    });

    expect(client.sendAnnouncement).toHaveBeenCalledWith("Test", ["u1"], "en-GB");
  });

  it("should return error result on client failure", async () => {
    const client = createMockClient({
      sendAnnouncement: vi.fn().mockRejectedValue(new Error("Network error")),
    });

    const result = await handleSendAnnouncement(client, {
      text: "Hello",
      unitIds: ["u1"],
      locale: "en-US",
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Failed to send announcement");
    expect(result.content[0].text).toContain("Network error");
  });

  it("should handle non-Error thrown values", async () => {
    const client = createMockClient({
      sendAnnouncement: vi.fn().mockRejectedValue("string error"),
    });

    const result = await handleSendAnnouncement(client, {
      text: "Hello",
      unitIds: ["u1"],
      locale: "en-US",
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("string error");
  });
});
