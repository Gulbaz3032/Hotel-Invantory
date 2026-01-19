import type { Request, Response } from "express";
import { StockTransaction } from "../models/stockTransactionModel.js"

export const calculateInventory = async (itemId: string) => {
    const transictions = await StockTransaction.find({ item: itemId });

    let totalIn = 0;
    let totalOut = 0;

    for(const tx of transictions) {
        if(tx.type === "IN") totalIn += tx.quantity;
        else totalOut += tx.quantity
        
    }
    return {
        totalIn,
        totalOut,
         remaining: totalIn - totalOut
    }
}


export const showCalculaterInventory = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        if(!id) {
            return res.status(404).json({
                message: "Id not found",
                success: false
            })
        }

        const user = await StockTransaction.findById(id);
        if(!user) {
            return res.status(404).json({
                message: "user not found",
                success: false
            })
        }

        return res.status(200).json({
            message: "get successfully",
            user: user
        })

    } catch (error) {
        console.log("failed to show");
        return res.status(200).json({
            message: "Faile to get the show inventor",
            success: false
        })
    }
}