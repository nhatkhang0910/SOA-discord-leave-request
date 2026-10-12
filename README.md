# Discord Webhook – Leave Request System

> Academic seminar project demonstrating a leave-request API integrated with Discord Webhook and a Discord Bot.

## Team

| Member | Responsibility |
|---|---|
| **Gia Hòa** | REST API and leave-request service |
| **Nhật Khang** | Discord Webhook integration |
| **Tuấn** | Discord Bot and interactions |

## 1. Project overview

An employee submits a leave request through the REST API. The API sends the official request notification to Discord using a Webhook. A Discord Bot posts **Approve** and **Reject** controls for the manager. After the manager clicks a control, the Bot sends a JSON callback to `POST /api/discord/result`. The API validates the callback, updates the request status, and updates the original Webhook message.

## 2. Architecture and workflow

```text
Employee
  | POST /api/employee/leave-requests
  v
Leave Request API -----> Store (in-memory Map)
  |                            ^
  | Discord Webhook            | update request status
  v                            |
Official Discord notification  |
                               |
Discord Bot posts [Approve] [Reject]
  |                            |
  | POST /api/discord/result --+
  |    { requestId, action, reviewerName, reason? }
  v
Leave Request API
  |
  | PATCH original Webhook message
  v
Discord notification shows Approved / Rejected
```

- **REST API:** validates requests and owns the business logic/state changes.
- **Discord Webhook:** sends the official notification and edits that message when the state changes.
- **Discord Bot:** presents the action buttons, collects a rejection reason, and forwards the manager's decision to the API.
- **Store:** uses an in-memory JavaScript `Map` for this seminar demo.

## 3. Requirements

Install:

- Node.js 18 or newer
- Git
- VS Code or another code editor
- Postman
- A Discord account and a Discord server where you can manage a channel

Verify Node.js and npm:

```bash
node -v
npm -v
git --version
```

## 4. Clone and install

```bash
git clone https://github.com/nhatkhang0910/SOA-discord-leave-request.git
cd SOA-discord-leave-request
npm install
```

## 5. Configure environment variables

Create a `.env` file by copying `.env.example`, then replace the sample values with your own Discord settings:

```env
DISCORD_WEBHOOK_URL=YOUR_DISCORD_WEBHOOK_URL
DISCORD_CHANNEL_ID=YOUR_DISCORD_CHANNEL_ID
DISCORD_BOT_TOKEN=YOUR_DISCORD_BOT_TOKEN
PORT=3000
```

Keep `.env` private. Do not commit or share your real Webhook URL or Bot Token. Only `.env.example` with placeholders belongs in GitHub.

### Discord setup

1. **Create a Webhook:** In the target channel, open **Edit Channel → Integrations → Webhooks → New Webhook**, then copy its URL into `DISCORD_WEBHOOK_URL`.
2. **Copy the channel ID:** Enable Developer Mode in Discord, right-click the channel, select **Copy Channel ID**, and set `DISCORD_CHANNEL_ID`.
3. **Create the Bot:** In the Discord Developer Portal, create an application and Bot, then put its token in `DISCORD_BOT_TOKEN`.
4. **Invite the Bot:** Install it in the same server and grant it permission to view the target channel and send messages. The current interaction flow only needs the `Guilds` intent; it does not require Message Content Intent.

## 6. Run the project

The API and Bot run in the same Node.js process:

```bash
npm start
```

Expected logs include messages similar to:

```text
Discord Bot is online: <bot-name>
Server is running at http://localhost:3000
```

## 7. Test with Postman

Import `postman/Discord-Leave-System.postman_collection.json` into Postman. Start the app before sending requests.

1. Send **Create Leave Request**.
2. Check the response and copy `data.id` if needed.
3. Check Discord for the official Webhook message and the Bot's Approve/Reject controls.
4. Click **Approve** or **Reject** in Discord. Reject opens a modal asking for a reason.
5. Use **Get Leave Request by UUID** to verify the final status.

The collection also has simulated Approve and Reject callback requests for testing the API directly. Use a request that is still `pending`; processing the same request twice returns `409 Conflict`.

## 8. API reference

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/employee/leave-requests` | Submit a new leave request and notify Discord |
| `GET` | `/api/employee/leave-requests/:id` | Get a request by UUID |
| `GET` | `/api/employee/leave-requests/by-employee/:employeeID` | Get requests for an employee |
| `GET` | `/api/boss/leave-requests?status=pending` | List requests, optionally filtered by status |
| `POST` | `/api/boss/leave-requests/:id/approve` | Approve through the manager API endpoint |
| `POST` | `/api/boss/leave-requests/:id/reject` | Reject through the manager API endpoint |
| `POST` | `/api/discord/result` | Receive the Bot's Approve/Reject callback as JSON |

Example callback JSON for approval:

```json
{
  "requestId": "<leave-request-uuid>",
  "action": "approve",
  "reviewerName": "Manager"
}
```

Example callback JSON for rejection:

```json
{
  "requestId": "<leave-request-uuid>",
  "action": "reject",
  "reviewerName": "Manager",
  "reason": "Not enough staff"
}
```

The rejection reason must contain at least 3 characters.

## 9. Error responses

- `400 Bad Request`: required data is missing or the callback is invalid.
- `404 Not Found`: the leave request ID does not exist.
- `409 Conflict`: the request has already been processed.
- `500 Internal Server Error`: unexpected server or integration error.

## 10. Known limitations

- Requests are stored in memory and are lost when the server restarts.
- The API and Bot are intended for a local seminar demonstration.
- Authentication and manager authorization are simplified; the callback endpoint should be protected before production use.
- The project does not use a persistent database.

## 11. Possible improvements

- Use PostgreSQL or MongoDB for persistent data.
- Add employee authentication and manager-role authorization.
- Protect the Bot callback endpoint with authentication/signature verification.
- Add retry handling, structured logs, automated tests, and deployment configuration.