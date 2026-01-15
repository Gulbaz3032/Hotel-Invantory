import type { Request, Response } from "express";
import { Item } from "../models/item.js";
import { calculateInventory } from "../services/inventoryServices.js";

export const getInventoryReport = async (req: Request, res: Response) => {
  const items = await Item.find();
  const report = [];

  for (const item of items) {
    const inventory = await calculateInventory(item._id.toString());

    report.push({
      itemName: item.name,
      unit: item.unit,
      totalAdded: inventory.totalIn,
      totalUsed: inventory.totalOut,
      remainingStock: inventory.remaining,
      alert:
        inventory.remaining <= item.minStockLevel
          ? "⚠️ Stock running low"
          : "✅ Stock sufficient"
    });
  }

  res.json(report);
};