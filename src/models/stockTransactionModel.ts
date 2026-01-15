import { model, Schema, Types } from "mongoose";

const stockTransactionSchema = new Schema({
    item: { type: Types.ObjectId, ref: "Item", required: true },
    type: { type: String, enum: ["IN", "OUT"], required: true },
    quantity: { type: Number, required: true } 

}, {
    timestamps: true
});

export const StockTransaction = model("StockTransaction", stockTransactionSchema);