import { describe, it, expect, vi } from "vitest";
import { handleTriggerRoutine } from "../../src/tools/routines.js";
import type { AlexaApiClient } from "../../src/alexa-client.js";

function createMockClient(overrides: Partial<AlexaApiClient> = {}): AlexaApiClient {
  return {
    triggerRoutine: vi.fn().mockResolvedValue({}),
    ...overrides,
  } as unknown as AlexaApiClient;
}

describe("handleTriggerRoutine", () => {
  it("should return success message", async () => {
    const client = createMockClient();
    const result = await handleTriggerRoutine(client, {
      utterance: "good morning",
    });

    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain("Routine triggered successfully");
    expect(result.content[0].text).toContain("good morning");
  });

  it("should call client with correct utterance", async () => {
    const client = createMockClient();
    await handleTriggerRoutine(client, { utterance: "bedtime routine" });

    expect(client.triggerRoutine).toHaveBeenCalledWith("bedtime routine");
  });

  it("should return error on failure", async () => {
    const client = createMockClient({
      triggerRoutine: vi.fn().mockRejectedValue(new Error("Routine not found")),
    });

    const result = await handleTriggerRoutine(client, {
      utterance: "bad routine",
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Failed to trigger routine");
    expect(result.content[0].text).toContain("Routine not found");
  });

  it("should handle non-Error thrown values", async () => {
    const client = createMockClient({
      triggerRoutine: vi.fn().mockRejectedValue({ status: 500 }),
    });

    const result = await handleTriggerRoutine(client, {
      utterance: "test",
    });

    expect(result.isError).toBe(true);
  });
});
