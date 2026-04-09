# mcp-alexa-server

An MCP (Model Context Protocol) server that enables AI assistants to control Amazon Alexa devices. Send announcements, manage reminders, shopping lists, timers, and trigger routines — all through natural language via MCP-compatible clients like Claude.

## Tools

| Tool | Description |
|------|-------------|
| `send_announcement` | Make Alexa speak text aloud on specified devices |
| `send_notification` | Send visual + audio notifications to Alexa devices |
| `create_reminder` | Create a scheduled reminder |
| `get_reminders` | List all existing reminders |
| `delete_reminder` | Delete a reminder by alert token |
| `create_timer` | Create a countdown timer with optional announcement |
| `delete_timer` | Delete a timer by ID |
| `get_lists` | Get all household lists (shopping, to-do, etc.) |
| `get_list_items` | Get items from a specific list |
| `add_list_item` | Add an item to a list |
| `update_list_item` | Update an existing list item |
| `delete_list_item` | Remove an item from a list |
| `trigger_routine` | Trigger a pre-configured Alexa routine |

## Prerequisites

1. An [Amazon Developer Account](https://developer.amazon.com/)
2. A [Login with Amazon (LWA)](https://developer.amazon.com/loginwithamazon/console/site/lwa/overview.html) security profile
3. OAuth credentials: Client ID, Client Secret, and a Refresh Token

### Getting OAuth Credentials

1. Go to the [LWA Console](https://developer.amazon.com/loginwithamazon/console/site/lwa/overview.html)
2. Create a new Security Profile
3. Note your **Client ID** and **Client Secret**
4. Use the OAuth Authorization Code flow to obtain a **Refresh Token** with the required Alexa scopes

## Installation

```bash
npm install
npm run build
```

## Configuration

Set the following environment variables (see `.env.example`):

```bash
export ALEXA_CLIENT_ID=your_client_id
export ALEXA_CLIENT_SECRET=your_client_secret
export ALEXA_REFRESH_TOKEN=your_refresh_token
```

## Usage

### With Claude Desktop

Add to your Claude Desktop MCP configuration (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "alexa": {
      "command": "node",
      "args": ["/path/to/mcp-alexa-server/dist/index.js"],
      "env": {
        "ALEXA_CLIENT_ID": "your_client_id",
        "ALEXA_CLIENT_SECRET": "your_client_secret",
        "ALEXA_REFRESH_TOKEN": "your_refresh_token"
      }
    }
  }
}
```

### Standalone

```bash
npm start
```

The server communicates over stdio using the MCP protocol.

## Development

```bash
npm run dev          # Run with tsx (hot reload)
npm test             # Run tests
npm run test:coverage # Run tests with coverage report
npm run lint         # Type check
```

## Security

- All HTTP requests go **only** to official Amazon API endpoints (`api.amazonalexa.com` and `api.amazon.com`)
- No user-supplied URLs are used for outbound requests
- OAuth tokens are never logged or exposed
- All tool inputs are validated with Zod schemas
- No `eval()`, `child_process`, or dynamic code execution
- Credentials are read exclusively from environment variables

## License

MIT
