import type { Request, Response } from "express";
import { Item } from "../models/item.js";
import { calculateInventory } from "../services/inventoryServices.js";
import { StockTransaction } from "../models/stockTransactionModel.js";


export const addStock = async (req: Request, res: Response) => {
  const { itemId, quantity } = req.body;

  await StockTransaction.create({
    item: itemId,
    type: "IN",
    quantity
  });

  res.status(200).json({
    message: "Stock added successfully"
  });
}

export const useStock = async (req: Request, res: Response) => {
  const { itemId, quantity } = req.body;
  await StockTransaction.create({
    item: itemId,
    type: "OUT",
    quantity
  });

  res.status(200).json({
    message: "Stock used successfully"
  })
}

export const createItem = async (req: Request, res: Response) => {
  try {
    const { name, unit, minStockLevel } = req.body;

    if (!name || !unit || minStockLevel === undefined) {
      return res.status(400).json({
        message: "name, unit, and minStockLevel are required"
      });
    }

    const item = await Item.create({
      name,
      unit,
      minStockLevel
    });

    res.status(201).json(item);
  } catch (error: any) {
    res.status(500).json({
      message: error.message
    });
  }
};



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

