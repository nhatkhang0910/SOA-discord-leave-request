# Discord Webhook - Leave Request System

> Academic Seminar Project — Discord Webhook / Service-Oriented Architecture

## Team

| Member | Responsibility |
|---|---|
| **Gia Hòa** | REST API & Leave Request Service |
| **Nhật Khang** | Discord Webhook Integration |
| **Tuấn** | Discord Bot & Interaction |

## 1. Project Overview

This project demonstrates a leave-request workflow integrated with Discord.

The system uses **Discord Webhook** as the notification channel from the Leave API to Discord. A **Discord Bot** handles manager interactions such as Approve and Reject, then calls the Leave API. The API remains responsible for business logic and updates the original Discord Webhook message.

## 2. Architecture

```text
Employee
   |
   | POST /api/employee/leave-requests
   v
Leave API
   |
   | Discord Webhook
   v
Discord notification message
   |
   | Bot sends interaction controls
   v
[ Approve ] [ Reject ]
   |             |
   |             +--> Reject Modal
   v
Discord Bot
   |
   | POST /api/boss/leave-requests/:id/approve
   | POST /api/boss/leave-requests/:id/reject
   v
Leave API
   |
   | Update business state
   v
Store
   |
   | PATCH original Discord Webhook message
   v
Discord
```

### Responsibility separation

- **Leave API**: request validation, business rules, request state changes.
- **Discord Webhook**: sends and updates the official leave-request notification.
- **Discord Bot**: displays Approve/Reject controls and forwards manager actions to the Leave API.
- **Store**: temporary in-memory storage for the seminar demo.

## 3. Technology Stack

- Node.js 24+
- Express.js
- Discord Webhook
- discord.js 14
- REST API
- Postman
- Git / GitHub

## 4. Prerequisites

Install before the hands-on session:

- Node.js 24+
- Git
- VS Code or another code editor
- Postman
- Discord account

Check installation:

```bash
node -v
npm -v
git --version
```

## 5. Clone and Install

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd <YOUR_PROJECT_FOLDER>
npm install
```

## 6. Environment Configuration

Copy `.env.example` to `.env` and fill in your own Discord configuration:

```env
DISCORD_WEBHOOK_URL=YOUR_DISCORD_WEBHOOK_URL
DISCORD_CHANNEL_ID=YOUR_DISCORD_CHANNEL_ID
DISCORD_BOT_TOKEN=YOUR_DISCORD_BOT_TOKEN
PORT=3000
```

### Security

Never commit `.env` to GitHub.

Never publish a Discord Webhook URL or Bot Token.

## 7. Discord Setup

### 7.1 Create a Webhook

In your Discord server:

```text
Channel Settings
→ Integrations
→ Webhooks
→ New Webhook
→ Copy Webhook URL
```

Put the URL into `DISCORD_WEBHOOK_URL`.

### 7.2 Get Channel ID

Enable Developer Mode in Discord, then right-click the target channel and choose **Copy Channel ID**.

Put it into `DISCORD_CHANNEL_ID`.

### 7.3 Create and Install the Bot

In the Discord Developer Portal:

1. Create an Application.
2. Create a Bot.
3. Copy the Bot Token into `DISCORD_BOT_TOKEN`.
4. Enable **Message Content Intent** only if your own extension requires message-content access. The current project does not read ordinary message content for interaction handling.
5. Install the Bot into your Discord server.

The Bot needs permission to view the target channel and send messages.

## 8. Run the Project

The project starts the API and Discord Bot from the same Node.js process.

```bash
npm start
```

Expected output:

```text
Discord Bot is online: <bot-name>
Server is running at http://localhost:3000
```

## 9. Test with Postman

Import:

```text
postman/Discord-Leave-Request.postman_collection.json
```

The main demo flow is:

1. Create Leave Request
2. Check Discord
3. Click Approve or Reject
4. Verify the Discord status message
5. Check the request status through the API

## 10. API Reference

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/employee/leave-requests` | Create a leave request |
| GET | `/api/employee/leave-requests/:id` | Get request status |
| GET | `/api/employee/leave-requests/by-employee/:employeeID` | Get employee requests |
| GET | `/api/boss/leave-requests?status=pending` | Get requests by status |
| POST | `/api/boss/leave-requests/:id/approve` | Approve a request |
| POST | `/api/boss/leave-requests/:id/reject` | Reject a request |

## 11. Expected Workflow

### Pending

```text
📋 Leave Request

🟡 Pending Approval

Manager action required:
[ ✅ Approve ] [ ❌ Reject ]
```

### Approved

```text
🟢 Approved by <manager>
```

### Rejected

```text
🔴 Rejected by <manager>
Reason: <rejection reason>
```

## 12. Error Handling

- `400 Bad Request`: required input is missing.
- `404 Not Found`: request does not exist.
- `409 Conflict`: request has already been processed.
- `500 Internal Server Error`: unexpected server or Discord integration error.

## 13. Limitations

- Requests are stored in memory using a JavaScript `Map`.
- Data is lost when the server restarts.
- API and Bot run locally during the seminar demo.
- Authentication and manager authorization are simplified for demonstration.
- The system is not intended for production deployment in its current form.

## 14. Future Improvements

- Replace in-memory storage with PostgreSQL or MongoDB.
- Add employee and manager authentication.
- Add manager-role authorization in Discord.
- Add retry and logging strategies for Discord Webhook failures.
- Deploy the API and Bot to a server/cloud environment.
- Add Docker support.

## 15. Project Structure

```text
.
├── server.js
├── discordBot.js
├── discordService.js
├── store.js
├── package.json
├── package-lock.json
├── .env.example
├── .gitignore
├── README.md
└── postman/
    └── Discord-Leave-Request.postman_collection.json
```
