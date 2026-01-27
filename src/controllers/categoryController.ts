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
        res.status(500).json({
            message: "Failed to create category server error",
            error: error.message

        });
    }
};

// Get all categories with pagination and search
export const getCategories = async (req: Request, res: Response) => {
    try {
        const { page = 1, limit = 10, search } = req.query;

        const pageNumber = parseInt(page as string);
        const limitNumber = parseInt(limit as string);
        const skip = (pageNumber - 1) * limitNumber;

        const query: any = { isActive: true };

        if (search) {
            query.name = { $regex: search, $options: "i" };
        }

        const [categories, total] = await Promise.all([
            Category.find(query)
                .skip(skip)
                .limit(limitNumber),
            Category.countDocuments(query)
        ]);

        res.status(200).json({
            categories,
            currentPage: pageNumber,
            totalPages: Math.ceil(total / limitNumber),
            totalCategories: total
        });
    } catch (error: any) {
        res.status(500).json({ message: "Failed to get Categories, Server error", error: error.message });
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
        res.status(500).json({ message: "Failed to update category, Server error", error: error.message });
    }
};

// Delete a category (Soft delete safely)
export const deleteCategory = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Check if items exist in this category
        // const itemsExist = await Item.exists({ category: id });
        // if (itemsExist) {
        //     return res.status(400).json({
        //         message: "Cannot delete category. Items are assigned to it."
        //     });
        // }

        const category = await Category.findByIdAndDelete(id);

        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }

        res.status(200).json({ message: "Category deleted successfully" });
    } catch (error: any) {
        res.status(500).json({ message: "Faied to Delete category, server error", error: error.message });
    }
};
