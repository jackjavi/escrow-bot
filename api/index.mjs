import express from "express";
import TelegramBot from "node-telegram-bot-api";
import dotenv from "dotenv";
dotenv.config();

const app = express();

const port = process.env.PORT || 7777;

const token = process.env.TELEGRAM_TOKEN;

const bot = new TelegramBot(token, { polling: true });

// Listen for any kind of message. There are different kinds of
// messages.
bot.on("message", (msg) => {
  const chatId = msg.chat.id;

  // Send a welcome message when the bot is started
  if (msg.text.toString().toLowerCase() === "/start") {
    bot.sendMessage(
      chatId,
      "Welcome to Intasef Escrow Service. Choose an option:\n1. Escrow\n2. Dispute Resolution\n3. Wallet\n4. Language\n5. Information"
    );
  }

  // Implement commands for different options
  if (msg.text.toString().toLowerCase() === "1") {
    bot.sendMessage(
      chatId,
      "You have chosen Escrow service. Please provide the transaction details."
    );
  }
  if (msg.text.toString().toLowerCase() === "2") {
    bot.sendMessage(
      chatId,
      "You have chosen Dispute Resolution. Provide the username of the involved party."
    );
  }
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log("Server is running on port 7777");
});
