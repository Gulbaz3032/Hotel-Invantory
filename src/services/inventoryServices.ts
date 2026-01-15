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