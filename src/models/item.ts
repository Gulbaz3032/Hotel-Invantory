import { model, Schema } from "mongoose";

const itemSchema = new Schema({
    name: { type: String, required: true, unique: true },
    unit: { type: String, required: true },
    minStockLevel: { type: Number, required: true }

});

export const Item = model("Item", itemSchema);