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

// Detect when a new member joins the group
bot.on("new_chat_members", (msg) => {
  const chatId = msg.chat.id;
  const newMembers = msg.new_chat_members; // List of new members added to the group
  console.log(msg); // Log the entire message object for debugging

  newMembers.forEach((member) => {
    const memberName = member.first_name || member.username;

    // Send a message to the group welcoming the new member
    bot.sendMessage(
      chatId,
      `Welcome ${memberName}! You have been added to the group.`
    );

    // Optional: Perform any additional logic, e.g., notify admins or log the event
    console.log(`New member added: ${memberName} (@${member.username})`);
  });
});

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

      // Ask the user to choose an option
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

        if (role === "escrow" || role === "1") {
          bot.sendMessage(
            chatId,
            `Please create a Telegram group with the name "${groupName}", add the bot (@esccrow_javi_bot), and give it admin rights. Once done, type /start in the group chat.`
          );

          // Save the role and chat details
          const transactionId = truncatedTimestamp;
          const newEscrow = new Escrow({
            transactionId,
            groupName: `Intasef_${truncatedTimestamp}`,
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
            bot.sendMessage(
              chatId,
              `You have chosen Escrow service. Please provide the following transaction details in this format:

1. Item Name
2. Transaction Amount
3. Payment Method

For example:
Item: Edusson Account Writing
AMount: $100
Payment Method: Telegram Wallet`
            );
            // LIsten for the details and extract them and store them in db by use the patch method

            bot.once("message", async (msg) => {
              const details = msg.text.split("\n");
              if (details.length >= 3) {
                const itemName = details[0].split(":")[1].trim();
                const amount = details[1].split(":")[1].trim();
                const paymentMethod = details[2].split(":")[1].trim();

                console.log("chat title", msg.chat.title);

                // Ensure the groupName exists in the database before updating else tell the user to create a group with the title the bot allocated

                await Escrow.findOne({
                  groupName: msg.chat.title,
                }).then(async (escrow) => {
                  if (!escrow) {
                    bot.sendMessage(
                      chatId,
                      `Please create a new Telegram group with the name the bot allocated this transaction.`
                    );
                  }
                });

                const updateDeets = await Escrow.findOne({
                  groupName: msg.chat.title,
                });
                if (!updateDeets) {
                  bot.sendMessage(
                    chatId,
                    `Please create a new Telegram group with the name the bot allocated this transaction.`
                  );
                } else {
                  updateDeets.itemName = itemName;
                  updateDeets.amount = Number(amount);
                  updateDeets.paymentMethod = paymentMethod;
                  await escrow.save();
                  // Ask the user to confirm details and provide him to click on yes or no

                  bot.sendMessage(
                    chatId,
                    `Escrow Transaction Details:
Item: ${updateDeets.itemName}
Amount: ${updateDeets.amount}
Payment Method: ${updateDeets.paymentMethod}

Proceed with this transaction? (yes/no)`,

                    {
                      reply_markup: {
                        keyboard: [["Yes"], ["No"]],
                        one_time_keyboard: true,
                        resize_keyboard: true,
                      },
                    }
                  );

                  // Listen for the confirmation and if yes, generate a group invite link
                  bot.once("message", async (msg) => {
                    const confirmation = msg.text.toLowerCase();
                    if (confirmation === "yes") {
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
                  });
                }
              }
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
