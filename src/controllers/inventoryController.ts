import type { Request, Response } from "express";
import { Item } from "../models/item.js";
import { StockTransaction } from "../models/stockTransactionModel.js"; // Corrected import
import { Category } from "../models/categoryModel.js";
import mongoose from "mongoose";

// --- Item Management ---

export const createItem = async (req: Request, res: Response) => {
  try {
    const { name, unit, minStockLevel, categoryId } = req.body;

    if (!name || !unit || minStockLevel === undefined || !categoryId) {
      return res.status(400).json({
        message: "name, unit, minStockLevel, and categoryId are required"
      });
    }

    const categoryExists = await Category.findById(categoryId);
    if (!categoryExists) {
      return res.status(404).json({ message: "Category not found" });
    }

    const item = await Item.create({
      name,
      unit,
      minStockLevel,
      category: categoryId
    });

    res.status(201).json(item);
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Item with this name already exists" });
    }
    res.status(500).json({
      message: error.message
    });
  }
};

export const getItems = async (req: Request, res: Response) => {
  try {
    const items = await Item.find({ isActive: true }).populate('category', 'name');
    res.status(200).json(items);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}


// --- Stock Transactions ---

export const addStock = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { itemId, quantity, remarks, userId } = req.body; // userId for now passed in body, later from Auth

    if (!itemId || !quantity || quantity <= 0) {
      return res.status(400).json({ message: "Invalid item or quantity" });
    }

    const item = await Item.findById(itemId).session(session);
    if (!item) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Item not found" });
    }

    const newStock = item.currentStock + quantity;
    item.currentStock = newStock;
    await item.save({ session });

    await StockTransaction.create([{
      item: itemId,
      category: item.category,
      user: userId, // Optional if not provided
      type: "IN",
      quantity,
      balanceAfter: newStock,
      remarks
    }], { session });

    await session.commitTransaction();
    res.status(200).json({
      message: "Stock added successfully",
      currentStock: newStock
    });
  } catch (error: any) {
    await session.abortTransaction();
    res.status(500).json({ message: error.message });
  } finally {
    session.endSession();
  }
}

export const useStock = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { itemId, quantity, remarks, userId } = req.body;

    if (!itemId || !quantity || quantity <= 0) {
      return res.status(400).json({ message: "Invalid item or quantity" });
    }

    const item = await Item.findById(itemId).session(session);
    if (!item) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Item not found" });
    }

    if (item.currentStock < quantity) {
      await session.abortTransaction();
      return res.status(400).json({
        message: "Insufficient stock",
        currentStock: item.currentStock,
        requested: quantity
      });
    }

    const newStock = item.currentStock - quantity;
    item.currentStock = newStock;
    await item.save({ session });

    await StockTransaction.create([{
      item: itemId,
      category: item.category,
      user: userId,
      type: "OUT",
      quantity,
      balanceAfter: newStock,
      remarks
    }], { session });

    await session.commitTransaction();

    // Check for Low Stock Alert
    let alert = null;
    if (newStock <= item.minStockLevel) {
      alert = `⚠️ Alert: ${item.name} stock is low! Remaining: ${newStock} ${item.unit}`;
    }

    res.status(200).json({
      message: "Stock used successfully",
      currentStock: newStock,
      alert
    });

  } catch (error: any) {
    await session.abortTransaction();
    res.status(500).json({ message: error.message });
  } finally {
    session.endSession();
  }
}


// --- Basic Reporting (Refactored) ---

export const getInventoryReport = async (req: Request, res: Response) => {
  try {
    // Simplified report fetching directly from Items (Real-time)
    const items = await Item.find().populate('category', 'name');
    const report = items.map(item => ({
      itemName: item.name,
      category: (item.category as any)?.name || 'Uncategorized',
      unit: item.unit,
      currentStock: item.currentStock,
      status: item.currentStock <= item.minStockLevel ? "Low Stock" : "Good"
    }));
    res.json(report);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

