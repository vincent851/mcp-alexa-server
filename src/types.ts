/** Alexa API base URL - all requests go only to this Amazon domain */
export const ALEXA_API_BASE = "https://api.amazonalexa.com";

/** Amazon OAuth token endpoint */
export const AMAZON_TOKEN_URL = "https://api.amazon.com/auth/o2/token";

/** OAuth token response from Amazon LWA */
export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
}

/** Configuration for the Alexa MCP server */
export interface AlexaConfig {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}

/** Notification variant for spoken text */
export interface SpokenTextVariant {
  type: "SpokenText";
  values: Array<{
    locale: string;
    text: string;
  }>;
}

/** Notification variant for display text */
export interface DisplayTextVariant {
  type: "DisplayText";
  values: Array<{
    locale: string;
    text: string;
  }>;
}

/** Notification recipient targeting a unit/device */
export interface NotificationRecipient {
  type: "Unit";
  id: string;
}

/** Request body for sending notifications */
export interface SendNotificationRequest {
  recipients: NotificationRecipient[];
  notification: {
    variants: Array<SpokenTextVariant | DisplayTextVariant>;
  };
}

/** Request body for sending announcements */
export interface SendAnnouncementRequest {
  recipients: NotificationRecipient[];
  notification: {
    variants: [SpokenTextVariant];
  };
}

/** Reminder schedule (absolute time) */
export interface ReminderSchedule {
  scheduledTime: string;
  timeZoneId: string;
  recurrence?: {
    freq: "WEEKLY" | "DAILY";
    byDay?: string[];
  };
}

/** Request to create a reminder */
export interface CreateReminderRequest {
  requestTime: string;
  trigger: {
    type: "SCHEDULED_ABSOLUTE";
    scheduledTime: string;
    timeZoneId: string;
    recurrence?: {
      freq: "WEEKLY" | "DAILY";
      byDay?: string[];
    };
  };
  alertInfo: {
    spokenInfo: {
      content: Array<{
        locale: string;
        text: string;
      }>;
    };
  };
  pushNotification: {
    status: "ENABLED" | "DISABLED";
  };
}

/** Response from creating a reminder */
export interface ReminderResponse {
  alertToken: string;
  createdTime: string;
  updatedTime: string;
  status: string;
}

/** Response from listing reminders */
export interface RemindersListResponse {
  totalCount: number;
  alerts: ReminderResponse[];
}

/** Request to create a timer */
export interface CreateTimerRequest {
  duration: string;
  timerLabel?: string;
  creationBehavior: {
    displayExperience: {
      visibility: "VISIBLE" | "HIDDEN";
    };
  };
  triggeringBehavior: {
    operation: {
      type: "ANNOUNCE" | "LAUNCH_TASK" | "NOTIFY_ONLY";
      textToAnnounce?: Array<{
        locale: string;
        text: string;
      }>;
    };
    notificationConfig: {
      playAudible: boolean;
    };
  };
}

/** Response from creating a timer */
export interface TimerResponse {
  id: string;
  status: string;
  duration: string;
  timerLabel?: string;
  createdTime: string;
  updatedTime: string;
}

/** Alexa household list */
export interface AlexaList {
  listId: string;
  name: string;
  state: string;
  version: number;
  statusMap?: Record<string, number>;
}

/** Response from listing household lists */
export interface ListsResponse {
  lists: AlexaList[];
}

/** Item in an Alexa list */
export interface ListItem {
  id: string;
  value: string;
  status: "active" | "completed";
  version: number;
  createdTime: string;
  updatedTime: string;
}

/** Response from getting list items */
export interface ListItemsResponse {
  listId: string;
  items: ListItem[];
}

/** Request to create a list item */
export interface CreateListItemRequest {
  value: string;
  status: "active" | "completed";
}

/** Request to update a list item */
export interface UpdateListItemRequest {
  value: string;
  status: "active" | "completed";
  version: number;
}

/** Request to trigger a routine */
export interface TriggerRoutineRequest {
  utterance: string;
}

/** Generic Alexa API error response */
export interface AlexaApiError {
  message: string;
  code?: string;
}

/** MCP tool result content - index signature required by MCP SDK */
export type ToolResult = {
  [key: string]: unknown;
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
};
