import express from "express";
import TelegramBot from "node-telegram-bot-api";
import dotenv from "dotenv";
dotenv.config();

const app = express();
const port = process.env.PORT || 7777;

// Telegram bot token
const token = `7386678640:AAFVAduijrBqHUWBOIEUzRDDNaxuDLb6XKQ`;

// Create a new Telegram bot using long polling
const bot = new TelegramBot(token, { polling: true });

let escrowDetails = {}; // Object to store escrow details

// Listen for any kind of message
bot.on("message", (msg) => {
  const chatId = msg.chat.id;
  const buyerUsername = msg.from.username; // The buyer's username (current user)
  console.log("MESSAGE", msg); // Log the entire message object for debugging

  // Check if the buyer has a username
  if (!buyerUsername) {
    bot.sendMessage(chatId, "You need to set a Telegram username to proceed.");
    return;
  }

  // Handle the /start command
  if (msg.text.toString().toLowerCase() === "/start") {
    bot.sendMessage(
      chatId,
      "Welcome to Intasef Escrow Service. Choose an option:\n1. Escrow\n2. Dispute Resolution\n3. Wallet\n4. Language\n5. Information\n6. Intasef.com"
    );
  }

  // Handle the escrow process
  if (msg.text.toString().toLowerCase() === "1") {
    // Step 1: Ask for the seller's username and transaction details
    bot.sendMessage(
      chatId,
      `You have chosen Escrow service. Please provide the following transaction details in this format:

1. Username of Buyer
2. Username of Seller
3. Transaction Amount
4. Item Name
5. Payment Method

For example:
Buyer: @buyerusername
Seller: @sellerusername
Amount: $100
Item: Laptop
Payment Method: Telegram Wallet`
    );

    // Step 2: Capture the seller's username and other details
    bot.once("message", (msg) => {
      const details = msg.text.split("\n");
      if (details.length >= 5) {
        const sellerUsername = details[1].split(":")[1].trim();

        // Step 3: Store the buyer and seller usernames and transaction details
        escrowDetails[chatId] = {
          buyer: buyerUsername,
          seller: sellerUsername,
          amount: details[2].split(":")[1].trim(),
          item: details[3].split(":")[1].trim(),
          paymentMethod: details[4].split(":")[1].trim(),
          transactionId: `escrow_${Date.now()}_${chatId}`, // Generate unique transaction ID
        };

        // Step 4: Confirm the transaction details with the user
        bot.sendMessage(
          chatId,
          `Escrow Transaction Details:
Buyer: ${escrowDetails[chatId].buyer}
Seller: ${escrowDetails[chatId].seller}
Amount: ${escrowDetails[chatId].amount}
Item: ${escrowDetails[chatId].item}
Payment Method: ${escrowDetails[chatId].paymentMethod}

Proceed with this transaction? (yes/no)`
        );

        // Step 5: Listen for confirmation
        bot.once("message", (confirmationMsg) => {
          const confirmation = confirmationMsg.text.toLowerCase();
          if (confirmation === "yes") {
            // Step 6: Prompt the user to manually create the group
            const transactionId = escrowDetails[chatId].transactionId;

            bot.sendMessage(
              chatId,
              `Please create a new Telegram group with the name "${transactionId}", add the bot (@esccrow_javi_bot), and invite the seller.

Once the group is created and the bot has been added, please type "group ready".`
            );

            // Step 7: Wait for the user to confirm the group is ready
            bot.once("message", (groupReadyMsg) => {
              if (groupReadyMsg.text.toLowerCase() === "group ready") {
                bot.sendMessage(
                  chatId,
                  "Great! Please wait while I verify the group."
                );

                // Step 8: Listen for the group message from the bot being added
                bot.once("message", (groupMsg) => {
                  // Check if the message is from the group
                  if (
                    groupMsg.chat.type === "group" ||
                    groupMsg.chat.type === "supergroup"
                  ) {
                    const groupId = groupMsg.chat.id; // Get the group ID
                    const groupName = groupMsg.chat.title; // Get the name of the group

                    console.log(groupMsg); // Log the entire group message for debugging
                    const userId = groupMsg.from.id; // Get the user ID from the message

                    // Step 9: Create and capture the group invite link after confirming the group creation
                    bot
                      .createChatInviteLink(groupId)
                      .then((link) => {
                        bot.sendMessage(
                          chatId,
                          `The group has been created.\n Check your inbox for the link and share it with the second party (Buyer/Seller).\n
                          Once they join we will Proceed with the transaction.
                          `
                        );

                        // Notify the seller with the invite link
                        bot.sendMessage(
                          userId,
                          `You have been invited to join the escrow group for the transaction. Please use the following link to join the group:\n${link.invite_link}`
                        );
                      })
                      .catch((error) => {
                        bot.sendMessage(
                          chatId,
                          `Error creating the invite link: ${error.message}`
                        );
                      });
                  } else {
                    bot.sendMessage(
                      chatId,
                      "The bot was not added to the expected group. Please check the group settings."
                    );
                  }
                });
              } else {
                bot.sendMessage(
                  chatId,
                  "Please type 'group ready' once the group is ready and the bot has been added."
                );
              }
            });
          } else {
            bot.sendMessage(chatId, "Transaction canceled.");
          }
        });
      } else {
        bot.sendMessage(
          chatId,
          "Invalid input format. Please provide the details in the correct format."
        );
      }
    });
  }

  // Handle other options like Dispute Resolution, etc.
  else if (msg.text.toString().toLowerCase() === "2") {
    bot.sendMessage(
      chatId,
      "You have chosen Dispute Resolution. Provide the username of the involved party."
    );
  } else if (msg.text.toString().toLowerCase() === "6") {
    // Handle Intasef.com link
    bot.sendMessage(
      chatId,
      "Visit our website: [Intasef.com](https://intasef.com)",
      {
        parse_mode: "Markdown",
      }
    );
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
