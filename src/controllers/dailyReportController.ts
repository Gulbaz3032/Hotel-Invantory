import type { Request, Response } from "express";
import { StockTransaction } from "../models/stockTransactionModel.js";

export const getDailyReports = async (req: Request, res: Response) => {
    const { date } = req.query;
    
    const selectedDate = new Date(date as string);
    const nextDate = new Date(selectedDate);
    nextDate.setDate(nextDate.getDate() + 1);

    const report = await StockTransaction.aggregate([
        {
            $match: {
                type: "OUT",
                createdAt: {
                    $gte: selectedDate,
                    $lt: nextDate
                }
            }
        },
        {
            $group: {
                _id: "$item",
                totalUsed: { $sum : "$quantity" }
            }
        },
        {
            $lookup: {
                from: "items",
                localField: "_id",
                foreignField: "_id",
                as: "item"
            }
        },
        { $unwind: "$item" },
         {
      $project: {
        _id: 0,
        itemName: "$item.name",
        unit: "$item.unit",
        totalUsed: 1
      }
    }
    ]);
    res.status(200).json({
        message: "Successfully s",
        report: report
    });
}