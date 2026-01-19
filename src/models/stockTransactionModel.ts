import { model, Schema, Types } from "mongoose";

const stockTransactionSchema = new Schema({
    item: { type: Types.ObjectId, ref: "Item", required: true },
    category: { type: Types.ObjectId, ref: "Category", required: true },
    user: { type: Types.ObjectId, ref: "User", required: false }, // Made optional for now to allow migration/transition
    type: { type: String, enum: ["IN", "OUT"], required: true },
    quantity: { type: Number, required: true },
    balanceAfter: { type: Number },
    remarks: { type: String }
}, {
    timestamps: true
});

export const StockTransaction = model("StockTransaction", stockTransactionSchema);