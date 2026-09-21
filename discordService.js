// Handles outbound Discord Webhook notifications and message updates.

const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

function buildEmbed(request) {
  const statusMap = {
    pending: {
      text: "🟡 Pending Approval",
      color: 16776960
    },
    approved: {
      text: `🟢 Approved by ${request.reviewedBy || "Manager"}`,
      color: 3066993
    },
    rejected: {
      text: `🔴 Rejected by ${request.reviewedBy || "Manager"}`,
      color: 15158332
    }
  };

  const status = statusMap[request.status] || statusMap.pending;

  const fields = [
    {
      name: "Request ID",
      value: String(request.id),
      inline: false
    },
    {
      name: "Employee",
      value: String(request.employeeName),
      inline: true
    },
    {
      name: "Employee ID",
      value: String(request.employeeID),
      inline: true
    },
    {
      name: "From Date",
      value: String(request.fromDate),
      inline: true
    },
    {
      name: "To Date",
      value: String(request.toDate),
      inline: true
    },
    {
      name: "Reason",
      value: String(request.reason),
      inline: false
    },
    {
      name: "Status",
      value: status.text,
      inline: false
    }
  ];

  if (request.status === "rejected" && request.rejectionReason) {
    fields.push({
      name: "Rejection Reason",
      value: String(request.rejectionReason),
      inline: false
    });
  }

  return {
    title: "📋 Leave Request",
    color: status.color,
    fields,
    timestamp: new Date().toISOString()
  };
}

async function sendLeaveRequest(request) {
  if (!WEBHOOK_URL) {
    throw new Error("DISCORD_WEBHOOK_URL is missing in .env");
  }

  const res = await fetch(`${WEBHOOK_URL}?wait=true`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      username: "Leave Request System",
      embeds: [buildEmbed(request)]
    })
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(
      `Discord Webhook request failed: ${res.status} - ${errorText}`
    );
  }

  const message = await res.json();
  return message.id;
}

async function updateLeaveRequestMessage(request) {
  if (!request.discordMessageId) {
    console.warn("Request has no Discord message ID");
    return;
  }

  if (!WEBHOOK_URL) {
    throw new Error("DISCORD_WEBHOOK_URL is missing in .env");
  }

  const res = await fetch(
    `${WEBHOOK_URL}/messages/${request.discordMessageId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        embeds: [buildEmbed(request)],
        components: []
      })
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(
      `Discord Webhook update failed: ${res.status} - ${errorText}`
    );
  }
}

module.exports = {
  sendLeaveRequest,
  updateLeaveRequestMessage
};
