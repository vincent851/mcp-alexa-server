import { describe, it, expect, vi, beforeEach } from "vitest";
import { AlexaApiClient } from "../src/alexa-client.js";
import { TokenManager } from "../src/auth.js";
import { ALEXA_API_BASE } from "../src/types.js";

// Mock TokenManager
function createMockTokenManager(): TokenManager {
  const mock = {
    getAccessToken: vi.fn().mockResolvedValue("mock-token"),
  } as unknown as TokenManager;
  return mock;
}

function createMockFetch(
  responseData: unknown = {},
  status = 200
): ReturnType<typeof vi.fn> {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(responseData),
    text: () => Promise.resolve(JSON.stringify(responseData)),
  });
}

describe("AlexaApiClient", () => {
  let client: AlexaApiClient;
  let mockTokenManager: TokenManager;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockTokenManager = createMockTokenManager();
    mockFetch = createMockFetch();
    client = new AlexaApiClient(mockTokenManager, mockFetch as unknown as typeof fetch);
  });

  describe("sendAnnouncement", () => {
    it("should send POST to /v3/notifications with announcement payload", async () => {
      await client.sendAnnouncement("Hello", ["unit-1", "unit-2"]);

      expect(mockFetch).toHaveBeenCalledWith(
        `${ALEXA_API_BASE}/v3/notifications`,
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer mock-token",
            "Content-Type": "application/json",
          }),
        })
      );

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.recipients).toEqual([
        { type: "Unit", id: "unit-1" },
        { type: "Unit", id: "unit-2" },
      ]);
      expect(body.notification.variants[0].type).toBe("SpokenText");
      expect(body.notification.variants[0].values[0].text).toBe("Hello");
    });

    it("should use custom locale", async () => {
      await client.sendAnnouncement("Hola", ["unit-1"], "es-ES");

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.notification.variants[0].values[0].locale).toBe("es-ES");
    });

    it("should default to en-US locale", async () => {
      await client.sendAnnouncement("Hello", ["unit-1"]);

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.notification.variants[0].values[0].locale).toBe("en-US");
    });
  });

  describe("sendNotification", () => {
    it("should send POST with both SpokenText and DisplayText variants", async () => {
      await client.sendNotification("Test notification", ["unit-1"]);

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.notification.variants).toHaveLength(2);
      expect(body.notification.variants[0].type).toBe("SpokenText");
      expect(body.notification.variants[1].type).toBe("DisplayText");
    });

    it("should use custom locale", async () => {
      await client.sendNotification("Bonjour", ["unit-1"], "fr-FR");

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.notification.variants[0].values[0].locale).toBe("fr-FR");
      expect(body.notification.variants[1].values[0].locale).toBe("fr-FR");
    });
  });

  describe("createReminder", () => {
    it("should send POST to /v1/alerts/reminders", async () => {
      mockFetch = createMockFetch({
        alertToken: "token-123",
        createdTime: "2024-01-01T00:00:00Z",
        updatedTime: "2024-01-01T00:00:00Z",
        status: "ON",
      });
      client = new AlexaApiClient(mockTokenManager, mockFetch as unknown as typeof fetch);

      const result = await client.createReminder(
        "Buy milk",
        "2024-12-25T09:00:00",
        "America/New_York"
      );

      expect(result.alertToken).toBe("token-123");
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.trigger.type).toBe("SCHEDULED_ABSOLUTE");
      expect(body.trigger.scheduledTime).toBe("2024-12-25T09:00:00");
      expect(body.trigger.timeZoneId).toBe("America/New_York");
      expect(body.alertInfo.spokenInfo.content[0].text).toBe("Buy milk");
      expect(body.pushNotification.status).toBe("ENABLED");
    });

    it("should use custom locale for reminder text", async () => {
      mockFetch = createMockFetch({ alertToken: "t1", createdTime: "", updatedTime: "", status: "ON" });
      client = new AlexaApiClient(mockTokenManager, mockFetch as unknown as typeof fetch);

      await client.createReminder("Comprar leche", "2024-12-25T09:00:00", "America/Mexico_City", "es-MX");

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.alertInfo.spokenInfo.content[0].locale).toBe("es-MX");
    });
  });

  describe("getReminders", () => {
    it("should send GET to /v1/alerts/reminders", async () => {
      mockFetch = createMockFetch({ totalCount: 2, alerts: [] });
      client = new AlexaApiClient(mockTokenManager, mockFetch as unknown as typeof fetch);

      const result = await client.getReminders();

      expect(mockFetch).toHaveBeenCalledWith(
        `${ALEXA_API_BASE}/v1/alerts/reminders`,
        expect.objectContaining({ method: "GET" })
      );
      expect(result.totalCount).toBe(2);
    });
  });

  describe("deleteReminder", () => {
    it("should send DELETE to /v1/alerts/reminders/{alertToken}", async () => {
      mockFetch = createMockFetch(undefined, 204);
      client = new AlexaApiClient(mockTokenManager, mockFetch as unknown as typeof fetch);

      await client.deleteReminder("token-123");

      expect(mockFetch).toHaveBeenCalledWith(
        `${ALEXA_API_BASE}/v1/alerts/reminders/token-123`,
        expect.objectContaining({ method: "DELETE" })
      );
    });

    it("should encode special characters in alertToken", async () => {
      mockFetch = createMockFetch(undefined, 204);
      client = new AlexaApiClient(mockTokenManager, mockFetch as unknown as typeof fetch);

      await client.deleteReminder("token/with spaces");

      expect(mockFetch).toHaveBeenCalledWith(
        `${ALEXA_API_BASE}/v1/alerts/reminders/token%2Fwith%20spaces`,
        expect.anything()
      );
    });
  });

  describe("createTimer", () => {
    it("should create a basic timer with NOTIFY_ONLY", async () => {
      mockFetch = createMockFetch({
        id: "timer-1",
        status: "ON",
        duration: "PT5M",
        createdTime: "",
        updatedTime: "",
      });
      client = new AlexaApiClient(mockTokenManager, mockFetch as unknown as typeof fetch);

      const result = await client.createTimer("PT5M");

      expect(result.id).toBe("timer-1");
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.duration).toBe("PT5M");
      expect(body.triggeringBehavior.operation.type).toBe("NOTIFY_ONLY");
    });

    it("should create timer with announcement text", async () => {
      mockFetch = createMockFetch({
        id: "timer-2",
        status: "ON",
        duration: "PT10M",
        timerLabel: "Cooking",
        createdTime: "",
        updatedTime: "",
      });
      client = new AlexaApiClient(mockTokenManager, mockFetch as unknown as typeof fetch);

      const result = await client.createTimer(
        "PT10M",
        "Cooking",
        "Your food is ready!"
      );

      expect(result.timerLabel).toBe("Cooking");
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.triggeringBehavior.operation.type).toBe("ANNOUNCE");
      expect(body.triggeringBehavior.operation.textToAnnounce[0].text).toBe(
        "Your food is ready!"
      );
    });

    it("should use custom locale for timer announcement", async () => {
      mockFetch = createMockFetch({ id: "t1", status: "ON", duration: "PT1M", createdTime: "", updatedTime: "" });
      client = new AlexaApiClient(mockTokenManager, mockFetch as unknown as typeof fetch);

      await client.createTimer("PT1M", undefined, "Fertig!", "de-DE");

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.triggeringBehavior.operation.textToAnnounce[0].locale).toBe("de-DE");
    });
  });

  describe("deleteTimer", () => {
    it("should send DELETE to /v1/alerts/timers/{id}", async () => {
      mockFetch = createMockFetch(undefined, 204);
      client = new AlexaApiClient(mockTokenManager, mockFetch as unknown as typeof fetch);

      await client.deleteTimer("timer-123");

      expect(mockFetch).toHaveBeenCalledWith(
        `${ALEXA_API_BASE}/v1/alerts/timers/timer-123`,
        expect.objectContaining({ method: "DELETE" })
      );
    });
  });

  describe("getLists", () => {
    it("should send GET to /v2/householdlists", async () => {
      mockFetch = createMockFetch({ lists: [{ listId: "l1", name: "Shopping" }] });
      client = new AlexaApiClient(mockTokenManager, mockFetch as unknown as typeof fetch);

      const result = await client.getLists();

      expect(mockFetch).toHaveBeenCalledWith(
        `${ALEXA_API_BASE}/v2/householdlists`,
        expect.objectContaining({ method: "GET" })
      );
      expect(result.lists).toHaveLength(1);
    });
  });

  describe("getListItems", () => {
    it("should send GET with status in path", async () => {
      mockFetch = createMockFetch({ listId: "l1", items: [] });
      client = new AlexaApiClient(mockTokenManager, mockFetch as unknown as typeof fetch);

      await client.getListItems("list-123", "active");

      expect(mockFetch).toHaveBeenCalledWith(
        `${ALEXA_API_BASE}/v2/householdlists/list-123/active`,
        expect.anything()
      );
    });

    it("should default to active status", async () => {
      mockFetch = createMockFetch({ listId: "l1", items: [] });
      client = new AlexaApiClient(mockTokenManager, mockFetch as unknown as typeof fetch);

      await client.getListItems("list-123");

      expect(mockFetch).toHaveBeenCalledWith(
        `${ALEXA_API_BASE}/v2/householdlists/list-123/active`,
        expect.anything()
      );
    });
  });

  describe("addListItem", () => {
    it("should send POST to /v2/householdlists/{listId}/items", async () => {
      await client.addListItem("list-1", "Milk");

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.value).toBe("Milk");
      expect(body.status).toBe("active");
    });

    it("should support completed status", async () => {
      await client.addListItem("list-1", "Done item", "completed");

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.status).toBe("completed");
    });
  });

  describe("updateListItem", () => {
    it("should send PUT with value, status, and version", async () => {
      await client.updateListItem("list-1", "item-1", "Updated milk", "completed", 2);

      expect(mockFetch).toHaveBeenCalledWith(
        `${ALEXA_API_BASE}/v2/householdlists/list-1/items/item-1`,
        expect.objectContaining({ method: "PUT" })
      );
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.value).toBe("Updated milk");
      expect(body.status).toBe("completed");
      expect(body.version).toBe(2);
    });
  });

  describe("deleteListItem", () => {
    it("should send DELETE to correct URL", async () => {
      mockFetch = createMockFetch(undefined, 204);
      client = new AlexaApiClient(mockTokenManager, mockFetch as unknown as typeof fetch);

      await client.deleteListItem("list-1", "item-1");

      expect(mockFetch).toHaveBeenCalledWith(
        `${ALEXA_API_BASE}/v2/householdlists/list-1/items/item-1`,
        expect.objectContaining({ method: "DELETE" })
      );
    });
  });

  describe("triggerRoutine", () => {
    it("should send POST to /v1/routines/triggerInstances", async () => {
      await client.triggerRoutine("good morning");

      expect(mockFetch).toHaveBeenCalledWith(
        `${ALEXA_API_BASE}/v1/routines/triggerInstances`,
        expect.objectContaining({ method: "POST" })
      );
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.utterance).toBe("good morning");
    });
  });

  describe("error handling", () => {
    it("should throw on non-OK API response", async () => {
      mockFetch = createMockFetch({ message: "Unauthorized" }, 401);
      client = new AlexaApiClient(mockTokenManager, mockFetch as unknown as typeof fetch);

      await expect(client.getLists()).rejects.toThrow(
        "Alexa API error (401 GET /v2/householdlists)"
      );
    });

    it("should include path and method in error message", async () => {
      mockFetch = createMockFetch({ message: "Not Found" }, 404);
      client = new AlexaApiClient(mockTokenManager, mockFetch as unknown as typeof fetch);

      await expect(client.deleteReminder("bad-token")).rejects.toThrow(
        "Alexa API error (404 DELETE /v1/alerts/reminders/bad-token)"
      );
    });

    it("should propagate token manager errors", async () => {
      const badTokenManager = {
        getAccessToken: vi.fn().mockRejectedValue(new Error("Token refresh failed")),
      } as unknown as TokenManager;
      const c = new AlexaApiClient(badTokenManager, mockFetch as unknown as typeof fetch);

      await expect(c.getLists()).rejects.toThrow("Token refresh failed");
    });
  });

  describe("authorization header", () => {
    it("should include Bearer token from token manager", async () => {
      await client.getLists();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer mock-token",
          }),
        })
      );
    });
  });
});
