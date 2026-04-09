import { TokenManager } from "./auth.js";
import {
  ALEXA_API_BASE,
  type CreateListItemRequest,
  type CreateReminderRequest,
  type CreateTimerRequest,
  type ListItemsResponse,
  type ListsResponse,
  type ReminderResponse,
  type RemindersListResponse,
  type SendAnnouncementRequest,
  type SendNotificationRequest,
  type TimerResponse,
  type TriggerRoutineRequest,
  type UpdateListItemRequest,
} from "./types.js";

/**
 * HTTP client for the Amazon Alexa API.
 *
 * Security notes:
 * - All requests go ONLY to ALEXA_API_BASE (https://api.amazonalexa.com)
 * - No user-supplied URLs are used for requests
 * - Authentication uses Amazon's official OAuth2 token flow
 * - All inputs are validated before sending to the API
 */
export class AlexaApiClient {
  private tokenManager: TokenManager;
  private fetchFn: typeof fetch;

  constructor(tokenManager: TokenManager, fetchFn: typeof fetch = globalThis.fetch) {
    this.tokenManager = tokenManager;
    this.fetchFn = fetchFn;
  }

  /**
   * Make an authenticated request to the Alexa API.
   * Only sends requests to ALEXA_API_BASE - never to arbitrary URLs.
   */
  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const token = await this.tokenManager.getAccessToken();
    // Construct URL from the constant base + path - no user-supplied URLs
    const url = `${ALEXA_API_BASE}${path}`;

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    const options: RequestInit = { method, headers };
    if (body !== undefined) {
      options.body = JSON.stringify(body);
    }

    const response = await this.fetchFn(url, options);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Alexa API error (${response.status} ${method} ${path}): ${errorText}`
      );
    }

    // Some DELETE endpoints return 204 with no body
    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }

  // ─── Announcements ──────────────────────────────────────────────────

  /** Send a voice announcement to specified Alexa device units */
  async sendAnnouncement(
    text: string,
    unitIds: string[],
    locale: string = "en-US"
  ): Promise<unknown> {
    const payload: SendAnnouncementRequest = {
      recipients: unitIds.map((id) => ({ type: "Unit", id })),
      notification: {
        variants: [
          {
            type: "SpokenText",
            values: [{ locale, text }],
          },
        ],
      },
    };
    return this.request("POST", "/v3/notifications", payload);
  }

  // ─── Notifications ──────────────────────────────────────────────────

  /** Send a notification (visual + audio) to specified Alexa device units */
  async sendNotification(
    text: string,
    unitIds: string[],
    locale: string = "en-US"
  ): Promise<unknown> {
    const payload: SendNotificationRequest = {
      recipients: unitIds.map((id) => ({ type: "Unit", id })),
      notification: {
        variants: [
          {
            type: "SpokenText",
            values: [{ locale, text }],
          },
          {
            type: "DisplayText",
            values: [{ locale, text }],
          },
        ],
      },
    };
    return this.request("POST", "/v3/notifications", payload);
  }

  // ─── Reminders ──────────────────────────────────────────────────────

  /** Create a new reminder */
  async createReminder(
    text: string,
    scheduledTime: string,
    timeZoneId: string,
    locale: string = "en-US"
  ): Promise<ReminderResponse> {
    const payload: CreateReminderRequest = {
      requestTime: new Date().toISOString(),
      trigger: {
        type: "SCHEDULED_ABSOLUTE",
        scheduledTime,
        timeZoneId,
      },
      alertInfo: {
        spokenInfo: {
          content: [{ locale, text }],
        },
      },
      pushNotification: {
        status: "ENABLED",
      },
    };
    return this.request<ReminderResponse>(
      "POST",
      "/v1/alerts/reminders",
      payload
    );
  }

  /** Get all reminders */
  async getReminders(): Promise<RemindersListResponse> {
    return this.request<RemindersListResponse>("GET", "/v1/alerts/reminders");
  }

  /** Delete a specific reminder by its alert token */
  async deleteReminder(alertToken: string): Promise<void> {
    return this.request<void>(
      "DELETE",
      `/v1/alerts/reminders/${encodeURIComponent(alertToken)}`
    );
  }

  // ─── Timers ─────────────────────────────────────────────────────────

  /** Create a new timer with the specified ISO 8601 duration */
  async createTimer(
    duration: string,
    label?: string,
    announceText?: string,
    locale: string = "en-US"
  ): Promise<TimerResponse> {
    const payload: CreateTimerRequest = {
      duration,
      timerLabel: label,
      creationBehavior: {
        displayExperience: { visibility: "VISIBLE" },
      },
      triggeringBehavior: {
        operation: announceText
          ? {
              type: "ANNOUNCE",
              textToAnnounce: [{ locale, text: announceText }],
            }
          : { type: "NOTIFY_ONLY" },
        notificationConfig: { playAudible: true },
      },
    };
    return this.request<TimerResponse>(
      "POST",
      "/v1/alerts/timers",
      payload
    );
  }

  /** Delete a specific timer by ID */
  async deleteTimer(timerId: string): Promise<void> {
    return this.request<void>(
      "DELETE",
      `/v1/alerts/timers/${encodeURIComponent(timerId)}`
    );
  }

  // ─── Lists ──────────────────────────────────────────────────────────

  /** Get all household lists */
  async getLists(): Promise<ListsResponse> {
    return this.request<ListsResponse>("GET", "/v2/householdlists");
  }

  /** Get items in a specific list */
  async getListItems(listId: string, status: string = "active"): Promise<ListItemsResponse> {
    return this.request<ListItemsResponse>(
      "GET",
      `/v2/householdlists/${encodeURIComponent(listId)}/${encodeURIComponent(status)}`
    );
  }

  /** Add an item to a list */
  async addListItem(
    listId: string,
    value: string,
    status: "active" | "completed" = "active"
  ): Promise<unknown> {
    const payload: CreateListItemRequest = { value, status };
    return this.request(
      "POST",
      `/v2/householdlists/${encodeURIComponent(listId)}/items`,
      payload
    );
  }

  /** Update an existing list item */
  async updateListItem(
    listId: string,
    itemId: string,
    value: string,
    status: "active" | "completed",
    version: number
  ): Promise<unknown> {
    const payload: UpdateListItemRequest = { value, status, version };
    return this.request(
      "PUT",
      `/v2/householdlists/${encodeURIComponent(listId)}/items/${encodeURIComponent(itemId)}`,
      payload
    );
  }

  /** Delete an item from a list */
  async deleteListItem(listId: string, itemId: string): Promise<void> {
    return this.request<void>(
      "DELETE",
      `/v2/householdlists/${encodeURIComponent(listId)}/items/${encodeURIComponent(itemId)}`
    );
  }

  // ─── Routines ───────────────────────────────────────────────────────

  /** Trigger a custom routine by utterance */
  async triggerRoutine(utterance: string): Promise<unknown> {
    const payload: TriggerRoutineRequest = { utterance };
    return this.request(
      "POST",
      "/v1/routines/triggerInstances",
      payload
    );
  }
}
