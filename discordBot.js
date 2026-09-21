const {
  Client,
  GatewayIntentBits,
  Events,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} = require("discord.js");

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Discord Bot is online: ${readyClient.user.tag}`);
});

function buildApprovalControls(requestId) {
  const approveButton = new ButtonBuilder()
    .setCustomId(`approve:${requestId}`)
    .setLabel("Approve")
    .setEmoji("✅")
    .setStyle(ButtonStyle.Success);

  const rejectButton = new ButtonBuilder()
    .setCustomId(`reject:${requestId}`)
    .setLabel("Reject")
    .setEmoji("❌")
    .setStyle(ButtonStyle.Danger);

  return new ActionRowBuilder().addComponents(
    approveButton,
    rejectButton
  );
}

// Sends a separate control message below the Webhook notification.
async function sendApprovalControls(request) {
  const channelId = process.env.DISCORD_CHANNEL_ID;

  if (!channelId) {
    throw new Error("DISCORD_CHANNEL_ID is missing in .env");
  }

  const channel = await client.channels.fetch(channelId);

  if (!channel || !channel.isTextBased()) {
    throw new Error("Discord channel not found or is not text-based");
  }

  const message = await channel.send({
    content: `Manager action required for request **${request.id}**:`,
    components: [buildApprovalControls(request.id)]
  });

  return message.id;
}

async function callLeaveApi(path, body) {
  const response = await fetch(
    `http://localhost:${process.env.PORT || 3000}${path}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Leave API request failed");
  }

  return data;
}

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (interaction.isButton()) {
      const [action, requestId] = interaction.customId.split(":");

      if (action === "approve") {
        await interaction.deferReply({ ephemeral: true });

        await callLeaveApi(
          `/api/boss/leave-requests/${requestId}/approve`,
          {
            reviewerName: interaction.user.username
          }
        );

        await interaction.editReply(
          "✅ Leave request approved successfully."
        );

        await interaction.message.edit({
          content: `✅ Request **${requestId}** was approved by ${interaction.user.username}.`,
          components: []
        });

        return;
      }

      if (action === "reject") {
        const modal = new ModalBuilder()
          .setCustomId(`rejectModal:${requestId}`)
          .setTitle("Reject Leave Request");

        const reasonInput = new TextInputBuilder()
          .setCustomId("reason")
          .setLabel("Reason for rejection")
          .setPlaceholder("Enter the rejection reason...")
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
          .setMinLength(3)
          .setMaxLength(500);

        const row = new ActionRowBuilder().addComponents(reasonInput);
        modal.addComponents(row);

        await interaction.showModal(modal);
        return;
      }
    }

    if (interaction.isModalSubmit()) {
      const [action, requestId] = interaction.customId.split(":");

      if (action !== "rejectModal") {
        return;
      }

      const reason = interaction.fields.getTextInputValue("reason");

      await interaction.deferReply({ ephemeral: true });

      await callLeaveApi(
        `/api/boss/leave-requests/${requestId}/reject`,
        {
          reviewerName: interaction.user.username,
          reasonForRejection: reason
        }
      );

      await interaction.editReply(
        "❌ Leave request rejected successfully."
      );

      if (interaction.message) {
        await interaction.message.edit({
          content:
            `❌ Request **${requestId}** was rejected by ${interaction.user.username}.\n` +
            `Reason: ${reason}`,
          components: []
        });
      }
    }
  } catch (error) {
    console.error("Discord interaction error:", error);

    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: `❌ ${error.message}`,
        ephemeral: true
      }).catch(() => {});
    } else {
      await interaction.editReply(
        `❌ ${error.message}`
      ).catch(() => {});
    }
  }
});

async function startBot() {
  const token = process.env.DISCORD_BOT_TOKEN;

  if (!token) {
    throw new Error("DISCORD_BOT_TOKEN is missing in .env");
  }

  await client.login(token);
}

module.exports = {
  startBot,
  sendApprovalControls
};
