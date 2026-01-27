import type { Request, Response } from "express";
import { StockTransaction } from "../models/stockTransactionModel.js";
import { Item } from "../models/item.js";
import mongoose from "mongoose";

// Helper for date ranges
const getDateRange = (type: 'daily' | 'weekly' | 'monthly') => {
    const now = new Date();
    const start = new Date(now);
    const end = new Date(now);

    if (type === 'daily') {
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
    } else if (type === 'weekly') {
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        start.setDate(diff);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
    } else if (type === 'monthly') {
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(now.getMonth() + 1, 0);
        end.setHours(23, 59, 59, 999);
    }
    return { start, end };
}

export const getAggregatedReport = async (req: Request, res: Response) => {
    try {
        const { type } = req.query;
        const { start, end } = getDateRange((type as 'daily' | 'weekly' | 'monthly') || 'daily');

        const pipeline = [
            {
                $match: {
                    createdAt: { $gte: start, $lte: end }
                }
            },
            {
                $lookup: {
                    from: "items",
                    localField: "item",
                    foreignField: "_id",
                    as: "itemInfo"
                }
            },
            { $unwind: "$itemInfo" },
            {
                $lookup: {
                    from: "categories",
                    localField: "category",
                    foreignField: "_id",
                    as: "categoryInfo"
                }
            },
            { $unwind: "$categoryInfo" },
            {
                $group: {
                    _id: {
                        itemId: "$item",
                        itemName: "$itemInfo.name",
                        category: "$categoryInfo.name",
                        unit: "$itemInfo.unit"
                    },
                    totalIn: {
                        $sum: {
                            $cond: [{ $eq: ["$type", "IN"] }, "$quantity", 0]
                        }
                    },
                    totalOut: {
                        $sum: {
                            $cond: [{ $eq: ["$type", "OUT"] }, "$quantity", 0]
                        }
                    },
                    transactions: {
                        $push: {
                            type: "$type",
                            quantity: "$quantity",
                            time: "$createdAt",
                            balanceAfter: "$balanceAfter",
                            remarks: "$remarks"
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    item: "$_id.itemName",
                    category: "$_id.category",
                    unit: "$_id.unit",
                    totalIn: 1,
                    totalOut: 1,
                    transactions: 1
                }
            }
        ];

        const report = await StockTransaction.aggregate(pipeline as any);
        res.status(200).json({
            dateRange: { start, end },
            data: report
        });

    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        // Parallel execution for dashboard metrics
        const [totalCategories, totalItems, lowStockItems, recentTransactions] = await Promise.all([
            mongoose.connection.db?.collection('categories').countDocuments({ isActive: true }),
            Item.countDocuments({ isActive: true }),
            Item.find({ $expr: { $lte: ["$currentStock", "$minStockLevel"] } }).select('name currentStock minStockLevel unit'),
            StockTransaction.find().sort({ createdAt: -1 }).limit(10).populate('item', 'name').populate('user', 'username')
        ]);

        // Today's IN/OUT
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayStats = await StockTransaction.aggregate([
            { $match: { createdAt: { $gte: today } } },
            {
                $group: {
                    _id: "$type",
                    count: { $sum: 1 },
                    totalQty: { $sum: "$quantity" }
                }
            }
        ]);

        res.status(200).json({
            summary: {
                totalCategories,
                totalItems,
                lowStockCount: lowStockItems.length
            },
            lowStockItems: lowStockItems.map(i => ({
                name: i.name,
                current: i.currentStock,
                min: i.minStockLevel,
                unit: i.unit,
                status: "CRITICAL"
            })),
            todayStats: todayStats.reduce((acc: any, curr) => {
                acc[curr._id] = curr;
                return acc;
            }, {}),
            recentActivity: recentTransactions
        });

    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}
