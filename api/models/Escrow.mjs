import mongoose from "mongoose";

const escrowSchema = new mongoose.Schema({
  transactionId: { type: String, required: true, unique: true },
  user1: {
    name: { type: String, required: false },
    chatId: { type: String, required: false },
    groupName: { type: String, required: false },
    role: { type: String, required: false }, // Buyer or Seller
  },
  user2: {
    name: { type: String, required: false },
    chatId: { type: String, required: false },
    groupName: { type: String, required: false },
    role: { type: String, required: false }, // Buyer or Seller
  },
  type: { type: String, required: true }, // Escrow or Dispute Resolution or Wallet or Information or Intasef.com or Language
  status: { type: String, default: "pending" }, // Status of the transaction
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model("Escrow", escrowSchema);
