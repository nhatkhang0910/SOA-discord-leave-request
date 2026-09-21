# GitHub Pre-Publish Checklist

## Source code

- [ ] `server.js` uses `discordService.sendLeaveRequest()` for the official Webhook notification.
- [ ] `discordBot.js` handles only Discord interaction and sends control messages.
- [ ] `discordService.js` contains the Webhook integration and original-message update logic.
- [ ] `store.js` is documented as in-memory demo storage.

## Secrets

- [ ] `.env` is NOT committed.
- [ ] `.env.example` is committed.
- [ ] The Discord Webhook URL has been rotated after exposure during development.
- [ ] The Discord Bot Token has been reset after exposure during development.

## Documentation

- [ ] README contains prerequisites.
- [ ] README contains installation steps.
- [ ] README explains Webhook and Bot responsibilities.
- [ ] README contains API reference.
- [ ] README contains hands-on test flow.
- [ ] README lists team members and responsibilities.
- [ ] README contains limitations and future improvements.

## Testing before seminar

- [ ] `npm install` works on a clean machine.
- [ ] `npm start` starts both API and Bot.
- [ ] Creating a leave request posts the official notification through Webhook.
- [ ] Bot posts Approve / Reject controls.
- [ ] Approve updates the original Webhook message to Approved.
- [ ] Reject updates the original Webhook message to Rejected and shows the reason.
- [ ] A second action on an already processed request returns HTTP 409.
- [ ] Postman collection works from a fresh import.
