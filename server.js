require("dotenv").config();

const express = require("express");
const { v4: uuidv4 } = require("uuid");
const store = require("./store");
const discord = require("./discordService");
const discordBot = require("./discordBot");

const app = express();
app.use(express.json());

// ========================================
// EMPLOYEE API
// ========================================

// Employee submits a leave request
app.post("/api/employee/leave-requests", async (req, res) => {
  try {
    const {
      employeeName,
      employeeID,
      reason,
      fromDate,
      toDate
    } = req.body;

    if (!employeeName || !employeeID || !reason || !fromDate || !toDate) {
      return res.status(400).json({
        error: "Missing required information"
      });
    }

    const request = {
      id: uuidv4(),
      employeeName,
      employeeID,
      reason,
      fromDate,
      toDate,
      status: "pending",
      reviewedBy: null,
      rejectionReason: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      discordMessageId: null,
      discordControlMessageId: null
    };

    store.create(request);

    // 1. Send the official leave request notification through Discord Webhook.
    const discordMessageId = await discord.sendLeaveRequest(request);

    const updated = store.update(request.id, {
      discordMessageId
    });

    // 2. Send interactive Approve / Reject controls through the Discord Bot.
    // The Bot does not own business logic; it only handles Discord interaction.
    try {
      const controlMessageId = await discordBot.sendApprovalControls(updated);

      store.update(request.id, {
        discordControlMessageId: controlMessageId
      });
    } catch (controlError) {
      console.error("Failed to send Discord control message:", controlError);
    }

    return res.status(201).json({
      message: "Leave request submitted successfully",
      data: store.getById(request.id)
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: err.message
    });
  }
});

// Employee checks a leave request by request ID
app.get("/api/employee/leave-requests/:id", (req, res) => {
  const request = store.getById(req.params.id);

  if (!request) {
    return res.status(404).json({
      error: "Leave request not found"
    });
  }

  return res.json({
    data: request
  });
});

// Employee checks all leave requests by employee ID
app.get(
  "/api/employee/leave-requests/by-employee/:employeeID",
  (req, res) => {
    const { employeeID } = req.params;

    const all = store
      .getAll()
      .filter((r) => r.employeeID === employeeID);

    return res.json({
      data: all
    });
  }
);

// ========================================
// MANAGER API
// ========================================

// Discord Bot sends the manager's decision back to the API.
app.post("/api/discord/result", async (req, res) => {
  try {
    const { requestId, action, reviewerName, reason } = req.body || {};

    if (!requestId || !["approve", "reject"].includes(action)) {
      return res.status(400).json({
        error: "Invalid requestId or action"
      });
    }

    if (
      action === "reject" &&
      (typeof reason !== "string" || reason.trim().length < 3)
    ) {
      return res.status(400).json({
        error: "Rejection reason must contain at least 3 characters"
      });
    }

    const existing = store.getById(requestId);
    if (!existing) {
      return res.status(404).json({
        error: "Leave request not found"
      });
    }

    if (existing.status !== "pending") {
      return res.status(409).json({
        error: "This leave request has already been processed"
      });
    }

    const updated = store.update(requestId, {
      status: action === "approve" ? "approved" : "rejected",
      reviewedBy: reviewerName || "Manager",
      rejectionReason: action === "reject" ? reason.trim() : null
    });

    console.log("[DISCORD RESULT] " + requestId + " -> " + updated.status);

    // Update the original Discord Webhook notification after recording the result.
    try {
      await discord.updateLeaveRequestMessage(updated);
    } catch (discordError) {
      console.error("Discord Webhook update failed:", discordError);
    }

    return res.json({
      message: "Discord result received successfully",
      data: updated
    });
  } catch (error) {
    console.error("Discord result error:", error);
    return res.status(500).json({
      error: error.message
    });
  }
});

// Manager views leave requests
app.get("/api/boss/leave-requests", (req, res) => {
  const { status } = req.query;

  return res.json({
    data: store.getAll({ status })
  });
});

// Manager approves a leave request
app.post(
  "/api/boss/leave-requests/:id/approve",
  async (req, res) => {
    try {
      const { reviewerName } = req.body;
      const existing = store.getById(req.params.id);

      if (!existing) {
        return res.status(404).json({
          error: "Leave request not found"
        });
      }

      if (existing.status !== "pending") {
        return res.status(409).json({
          error: "This leave request has already been processed"
        });
      }

      const updated = store.update(req.params.id, {
        status: "approved",
        reviewedBy: reviewerName || "Manager"
      });

      // Update the original Webhook message.
      await discord.updateLeaveRequestMessage(updated);

      return res.json({
        message: "Leave request approved successfully",
        data: updated
      });
    } catch (err) {
      console.error(err);

      return res.status(500).json({
        error: err.message
      });
    }
  }
);

// Manager rejects a leave request
app.post(
  "/api/boss/leave-requests/:id/reject",
  async (req, res) => {
    try {
      const {
        reviewerName,
        reasonForRejection
      } = req.body;

      const existing = store.getById(req.params.id);

      if (!existing) {
        return res.status(404).json({
          error: "Leave request not found"
        });
      }

      if (existing.status !== "pending") {
        return res.status(409).json({
          error: "This leave request has already been processed"
        });
      }

      const updated = store.update(req.params.id, {
        status: "rejected",
        reviewedBy: reviewerName || "Manager",
        rejectionReason: reasonForRejection || null
      });

      // Update the original Webhook message.
      await discord.updateLeaveRequestMessage(updated);

      return res.json({
        message: "Leave request rejected successfully",
        data: updated
      });
    } catch (err) {
      console.error(err);

      return res.status(500).json({
        error: err.message
      });
    }
  }
);

const PORT = process.env.PORT || 3000;

async function startServer() {
  await discordBot.startBot();

  app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start application:", error);
  process.exit(1);
});
