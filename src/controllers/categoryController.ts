import type { Request, Response } from "express";
import { Category } from "../models/categoryModel.js";
import { Item } from "../models/item.js";

// Create a new category
export const createCategory = async (req: Request, res: Response) => {
    try {
        const { name, description } = req.body;

        if (!name) {
            return res.status(400).json({ message: "Category name is required" });
        }

        const category = await Category.create({ name, description });
        res.status(201).json(category);
    } catch (error: any) {
        if (error.code === 11000) {
            return res.status(400).json({ message: "Category already exists" });
        }
        res.status(500).json({ message: error.message });
    }
};

// Get all categories
export const getCategories = async (req: Request, res: Response) => {
    try {
        const categories = await Category.find({ isActive: true });
        res.status(200).json(categories);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// Update a category
export const updateCategory = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;

        const category = await Category.findByIdAndUpdate(
            id,
            { name, description },
            { new: true }
        );

        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }

        res.status(200).json({ message: "Category updated", category });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// Delete a category (Soft delete safely)
export const deleteCategory = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Check if items exist in this category
        const itemsExist = await Item.exists({ category: id });
        if (itemsExist) {
            return res.status(400).json({
                message: "Cannot delete category. Items are assigned to it."
            });
        }

        const category = await Category.findByIdAndDelete(id);

        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }

        res.status(200).json({ message: "Category deleted successfully" });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
