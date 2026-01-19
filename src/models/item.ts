import { model, Schema } from "mongoose";

const itemSchema = new Schema({
    name: { type: String, required: true, unique: true },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    unit: { type: String, required: true },
    minStockLevel: { type: Number, required: true },
    currentStock: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
}, {
    timestamps: true
});

export const Item = model("Item", itemSchema);