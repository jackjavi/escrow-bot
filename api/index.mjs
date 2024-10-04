import express from "express";
import TelegramBot from "node-telegram-bot-api";
import dotenv from "dotenv";
import mongoose from "mongoose";
import Escrow from "./models/Escrow.mjs";

dotenv.config();

const app = express();
const port = process.env.PORT || 7777;

// Telegram bot token
const token = `xxxxxxxxxxxxxxxxxx`;

// Create a new Telegram bot using long polling
const bot = new TelegramBot(token, { polling: true });

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("MongoDB connection error:", err));

// Listen for any kind of message
bot.on("message", async (msg) => {
  const chatType = msg.chat.type; // Check if message is from 'private' or 'group'
  const chatId = msg.chat.id;
  const firstName = msg.from.first_name;
  const username = msg.from.username;

  // Check if the message is a /start command
  if (msg.text && msg.text.toString().toLowerCase() === "/start") {
    // Handle private chat
    if (chatType === "private") {
      const truncatedTimestamp = Date.now().toString().slice(-5); // Truncate to last 5 digits
      const groupName = `Intasef_${truncatedTimestamp}`;

      // Send the welcome message and options
      bot.sendMessage(
        chatId,
        "Welcome to Intasef Escrow Service. Choose an option:\n1. Escrow\n2. Dispute Resolution\n3. Wallet\n4. Language\n5. Information\n6. Intasef.com"
      );

      // Ask if the user is a buyer or seller
      bot.sendMessage(
        chatId,
        `Hello ${firstName}, welcome to Intasef Escrow Service!Choose an option.\n`,
        {
          reply_markup: {
            keyboard: [
              ["Escrow"],
              ["Dispute Resolution"],
              ["Wallet"],
              ["Language"],
              ["Information"],
              ["Intasef.com"],
            ],
            one_time_keyboard: true,
            resize_keyboard: true,
          },
        }
      );

      // Capture their option
      bot.once("message", async (roleMsg) => {
        const role = roleMsg.text.toLowerCase();

        if (
          role === "escrow" ||
          role === "1" ||
          role === "dispute resolution" ||
          role === "2"
        ) {
          bot.sendMessage(
            chatId,
            `Please create a Telegram group with the name "${groupName}", add the bot (@esccrow_javi_bot), and give it admin rights. Once done, type /start in the group chat.`
          );

          // Save the role and chat details
          const transactionId = truncatedTimestamp;
          const newEscrow = new Escrow({
            transactionId,
            user1: { name: username, chatId, groupName: groupName },
            type: role,
          });
          await newEscrow.save();
        }
      });
    }
    // Handle group chat
    else if (chatType === "group" || chatType === "supergroup") {
      bot
        .getChatAdministrators(chatId)
        .then((admins) => {
          const botAdmin = admins.find(
            (admin) => admin.user.username === "esccrow_javi_bot"
          );

          // If bot is not an admin, notify the user
          if (!botAdmin) {
            bot.sendMessage(
              chatId,
              "Please make me an admin in this group to proceed."
            );
          } else {
            // Generate group invite link
            bot
              .createChatInviteLink(chatId)
              .then((inviteLink) => {
                bot.sendMessage(
                  chatId,
                  `Group setup is complete! Please invite the other party using this link: ${inviteLink.invite_link}`
                );
              })
              .catch((error) => {
                bot.sendMessage(
                  chatId,
                  `Error generating invite link: ${error.message}`
                );
              });
          }
        })
        .catch((err) => console.log("Error fetching admins:", err));
    }
  }
});

// Default web route
app.get("/", (req, res) => {
  res.send("Hello World!");
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
