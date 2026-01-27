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
      message: "Failed to create Item, Server error",
      error: error.message
    });
  }
};

export const getItems = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, search, category, minStockLevel, sortBy = "createdAt", sortOrder = "desc", status } = req.query;

    const pageNumber = parseInt(page as string);
    const limitNumber = parseInt(limit as string);
    const skip = (pageNumber - 1) * limitNumber;

    // Build Query
    const query: any = { isActive: true };

    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    if (category) {
      query.category = category;
    }

    if (minStockLevel === 'low') {
      query.$expr = { $lte: ["$currentStock", "$minStockLevel"] };
    }


    const sort: any = {};
    if (sortBy) {
      sort[sortBy as string] = sortOrder === "asc" ? 1 : -1;
    }


    const [items, total] = await Promise.all([
      Item.find(query)
        .populate('category', 'name')
        .sort(sort)
        .skip(skip)
        .limit(limitNumber),
      Item.countDocuments(query)
    ]);

    res.status(200).json({
      items,
      currentPage: pageNumber,
      totalPages: Math.ceil(total / limitNumber),
      totalItems: total
    });
  } catch (error: any) {
    res.status(500).json({ message: "Failed to get items, server error", error: error.message });
  }
}



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
    res.status(500).json({ message: "Failed to add stock, server error", error: error.message });
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
    res.status(500).json({ message: "failed to use stock, Server error", error: error.message });
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
    res.status(500).json({ message: "Failed to get inventory reports, Server error", error: error.message });
  }
};

//   update items

export const updateItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, unit, minStockLevel, categoryId } = req.body;

    if (!id) {
      return res.status(400).json({
        message: "Invalid item id"
      });
    }

    // Check if item exists
    const item = await Item.findById(id);
    if (!item) {
      return res.status(404).json({
        message: "Item not found"
      });
    }

    // If categoryId is being updated, validate it
    if (categoryId) {
      const categoryExists = await Category.findById(categoryId);
      if (!categoryExists) {
        return res.status(404).json({
          message: "Category not found"
        });
      }
      item.category = categoryId;
    }

    // Update fields if provided
    if (name) item.name = name;
    if (unit) item.unit = unit;
    if (minStockLevel !== undefined) item.minStockLevel = minStockLevel;

    const updatedItem = await item.save();

    return res.status(200).json(updatedItem);

  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({
        message: "Item with this name already exists",
        success: false
      });
    }

    return res.status(500).json({
      message: "Failed to update item",
      error: error.message
    });
  }
};

//        Delete items   

export const deleteItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        message: "Invalid item id"
      });
    }

    const item = await Item.findByIdAndDelete(id);

    if (!item) {
      return res.status(404).json({
        message: "Item not found"
      });
    }

    return res.status(200).json({
      message: "Item deleted successfully"
    });

  } catch (error: any) {
    return res.status(500).json({
      message: "Failed to delete item, Server error",
      error: error.message
    });
  }
};


