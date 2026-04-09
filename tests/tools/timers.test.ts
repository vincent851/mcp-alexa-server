import { describe, it, expect, vi } from "vitest";
import {
  handleCreateTimer,
  handleDeleteTimer,
} from "../../src/tools/timers.js";
import type { AlexaApiClient } from "../../src/alexa-client.js";

function createMockClient(overrides: Partial<AlexaApiClient> = {}): AlexaApiClient {
  return {
    createTimer: vi.fn().mockResolvedValue({
      id: "timer-123",
      status: "ON",
      duration: "PT5M",
      timerLabel: "Test timer",
      createdTime: "2024-01-01T00:00:00Z",
      updatedTime: "2024-01-01T00:00:00Z",
    }),
    deleteTimer: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as AlexaApiClient;
}

describe("handleCreateTimer", () => {
  it("should return success with timer details", async () => {
    const client = createMockClient();
    const result = await handleCreateTimer(client, {
      duration: "PT5M",
      label: "Test timer",
      locale: "en-US",
    });

    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain("Timer created successfully");
    expect(result.content[0].text).toContain("timer-123");
    expect(result.content[0].text).toContain("PT5M");
    expect(result.content[0].text).toContain("Test timer");
  });

  it("should show 'none' for missing label", async () => {
    const client = createMockClient({
      createTimer: vi.fn().mockResolvedValue({
        id: "timer-456",
        status: "ON",
        duration: "PT1H",
        createdTime: "",
        updatedTime: "",
      }),
    });

    const result = await handleCreateTimer(client, {
      duration: "PT1H",
      locale: "en-US",
    });

    expect(result.content[0].text).toContain("Label: none");
  });

  it("should pass correct args to client", async () => {
    const client = createMockClient();
    await handleCreateTimer(client, {
      duration: "PT30M",
      label: "Workout",
      announceText: "Time is up!",
      locale: "en-US",
    });

    expect(client.createTimer).toHaveBeenCalledWith(
      "PT30M",
      "Workout",
      "Time is up!",
      "en-US"
    );
  });

  it("should pass undefined for optional params", async () => {
    const client = createMockClient();
    await handleCreateTimer(client, {
      duration: "PT5M",
      locale: "en-US",
    });

    expect(client.createTimer).toHaveBeenCalledWith(
      "PT5M",
      undefined,
      undefined,
      "en-US"
    );
  });

  it("should return error on failure", async () => {
    const client = createMockClient({
      createTimer: vi.fn().mockRejectedValue(new Error("Limit exceeded")),
    });

    const result = await handleCreateTimer(client, {
      duration: "PT5M",
      locale: "en-US",
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Failed to create timer");
    expect(result.content[0].text).toContain("Limit exceeded");
  });

  it("should handle non-Error thrown values", async () => {
    const client = createMockClient({
      createTimer: vi.fn().mockRejectedValue({ code: 500 }),
    });

    const result = await handleCreateTimer(client, {
      duration: "PT5M",
      locale: "en-US",
    });

    expect(result.isError).toBe(true);
  });
});

describe("handleDeleteTimer", () => {
  it("should return success message", async () => {
    const client = createMockClient();
    const result = await handleDeleteTimer(client, { timerId: "timer-123" });

    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain("timer-123");
    expect(result.content[0].text).toContain("deleted successfully");
  });

  it("should call client with correct ID", async () => {
    const client = createMockClient();
    await handleDeleteTimer(client, { timerId: "t-999" });

    expect(client.deleteTimer).toHaveBeenCalledWith("t-999");
  });

  it("should return error on failure", async () => {
    const client = createMockClient({
      deleteTimer: vi.fn().mockRejectedValue(new Error("Timer not found")),
    });

    const result = await handleDeleteTimer(client, { timerId: "bad" });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Failed to delete timer");
  });

  it("should handle non-Error thrown values", async () => {
    const client = createMockClient({
      deleteTimer: vi.fn().mockRejectedValue("boom"),
    });

    const result = await handleDeleteTimer(client, { timerId: "bad" });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("boom");
  });
});
