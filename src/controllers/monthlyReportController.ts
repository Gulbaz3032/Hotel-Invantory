import type { Request, Response } from "express";
import { StockTransaction } from "../models/stockTransactionModel.js";

export const getMonthlyUsageReport = async (req: Request, res: Response) => {
  const { year, month } = req.query; // year=2026, month=1

  const startDate = new Date(`${year}-${month}-01`);
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 1);

  const report = await StockTransaction.aggregate([
    {
      $match: {
        type: "OUT",
        createdAt: {
          $gte: startDate,
          $lt: endDate
        }
      }
    },
    {
      $group: {
        _id: "$item",
        totalUsed: { $sum: "$quantity" }
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
    message: "successfull",
    report: report
  });
};
