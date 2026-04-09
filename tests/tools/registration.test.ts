import { describe, it, expect, vi } from "vitest";
import { registerAnnouncementTools } from "../../src/tools/announcements.js";
import { registerNotificationTools } from "../../src/tools/notifications.js";
import { registerReminderTools } from "../../src/tools/reminders.js";
import { registerTimerTools } from "../../src/tools/timers.js";
import { registerListTools } from "../../src/tools/lists.js";
import { registerRoutineTools } from "../../src/tools/routines.js";
import { registerAllTools } from "../../src/tools/index.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { AlexaApiClient } from "../../src/alexa-client.js";

function createMockServer(): McpServer {
  return {
    tool: vi.fn(),
  } as unknown as McpServer;
}

function createMockClient(): AlexaApiClient {
  return {} as AlexaApiClient;
}

describe("Tool Registration", () => {
  describe("registerAnnouncementTools", () => {
    it("should register send_announcement tool", () => {
      const server = createMockServer();
      const client = createMockClient();
      registerAnnouncementTools(server, client);

      expect(server.tool).toHaveBeenCalledTimes(1);
      expect(server.tool).toHaveBeenCalledWith(
        "send_announcement",
        expect.any(String),
        expect.any(Object),
        expect.any(Function)
      );
    });
  });

  describe("registerNotificationTools", () => {
    it("should register send_notification tool", () => {
      const server = createMockServer();
      const client = createMockClient();
      registerNotificationTools(server, client);

      expect(server.tool).toHaveBeenCalledTimes(1);
      expect(server.tool).toHaveBeenCalledWith(
        "send_notification",
        expect.any(String),
        expect.any(Object),
        expect.any(Function)
      );
    });
  });

  describe("registerReminderTools", () => {
    it("should register 3 reminder tools", () => {
      const server = createMockServer();
      const client = createMockClient();
      registerReminderTools(server, client);

      expect(server.tool).toHaveBeenCalledTimes(3);

      const toolNames = (server.tool as ReturnType<typeof vi.fn>).mock.calls.map(
        (call: unknown[]) => call[0]
      );
      expect(toolNames).toContain("create_reminder");
      expect(toolNames).toContain("get_reminders");
      expect(toolNames).toContain("delete_reminder");
    });
  });

  describe("registerTimerTools", () => {
    it("should register 2 timer tools", () => {
      const server = createMockServer();
      const client = createMockClient();
      registerTimerTools(server, client);

      expect(server.tool).toHaveBeenCalledTimes(2);

      const toolNames = (server.tool as ReturnType<typeof vi.fn>).mock.calls.map(
        (call: unknown[]) => call[0]
      );
      expect(toolNames).toContain("create_timer");
      expect(toolNames).toContain("delete_timer");
    });
  });

  describe("registerListTools", () => {
    it("should register 5 list tools", () => {
      const server = createMockServer();
      const client = createMockClient();
      registerListTools(server, client);

      expect(server.tool).toHaveBeenCalledTimes(5);

      const toolNames = (server.tool as ReturnType<typeof vi.fn>).mock.calls.map(
        (call: unknown[]) => call[0]
      );
      expect(toolNames).toContain("get_lists");
      expect(toolNames).toContain("get_list_items");
      expect(toolNames).toContain("add_list_item");
      expect(toolNames).toContain("update_list_item");
      expect(toolNames).toContain("delete_list_item");
    });
  });

  describe("registerRoutineTools", () => {
    it("should register trigger_routine tool", () => {
      const server = createMockServer();
      const client = createMockClient();
      registerRoutineTools(server, client);

      expect(server.tool).toHaveBeenCalledTimes(1);
      expect(server.tool).toHaveBeenCalledWith(
        "trigger_routine",
        expect.any(String),
        expect.any(Object),
        expect.any(Function)
      );
    });
  });

  describe("registerAllTools", () => {
    it("should register all 13 tools total", () => {
      const server = createMockServer();
      const client = createMockClient();
      registerAllTools(server, client);

      // 1 announcement + 1 notification + 3 reminders + 2 timers + 5 lists + 1 routine = 13
      expect(server.tool).toHaveBeenCalledTimes(13);
    });
  });
});
